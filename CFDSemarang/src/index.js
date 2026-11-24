/* CFDSemarang — API Worker (M2+social foundation).
 * Pemesanan lapak + pembayaran QRIS lewat Midtrans Snap.
 * Fondasi Instagram Graph API: OAuth akun profesional, simpan token terenkripsi
 * di D1, buat container Reels, cek status, publish. Hanya /api/* masuk sini.
 *
 * Status booking hanya berubah lewat webhook Midtrans terverifikasi atau aksi admin.
 */

import { encryptToken, decryptToken } from "./social/crypto.js";
import {
  igAppConfig,
  buildAuthUrl,
  exchangeCodeForShortToken,
  exchangeForLongLivedToken,
  refreshLongLivedToken,
  fetchMe,
  createVideoContainer,
  getContainerStatus,
  publishContainer,
  getMedia,
} from "./social/instagram.js";

const WIB_OFFSET = 7 * 3600 * 1000;
const DAY = 86400 * 1000;
const MAX_DAYS_AHEAD = 120;
const BUSINESS_TYPES = ["Kuliner", "Fashion", "Kerajinan", "Jasa / layanan", "Lainnya"];
const ZONES = {
  A: { sides: ["W", "E"], max: 8 },
  B: { sides: ["W", "E"], max: 10 },
  C: { sides: ["W", "E"], max: 8 },
  D: { sides: ["U", "S"], max: 8 },
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
const fail = (error, status = 400) => json({ ok: false, error }, status);

/* ---------- waktu (WIB) ---------- */
const pad2 = (n) => String(n).padStart(2, "0");
function wibNow() {
  return new Date(Date.now() + WIB_OFFSET); // getter UTC == jam WIB
}
function wibIso(d = wibNow()) {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}
function eventEpoch(dateIso) {
  const [y, m, d] = dateIso.split("-").map(Number);
  return Date.UTC(y, m - 1, d) - WIB_OFFSET; // Minggu 00.00 WIB
}
function windowFor(dateIso) {
  const ev = eventEpoch(dateIso);
  const openAt = ev - 6 * DAY; // Senin 00.00 WIB
  const closeAt = ev - DAY + 18 * 3600 * 1000; // Sabtu 18.00 WIB
  const now = Date.now();
  if (now < openAt) return { state: "upcoming", openAt, closeAt };
  if (now >= closeAt) return { state: "closed", openAt, closeAt };
  return { state: "open", openAt, closeAt };
}
function validDate(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return false;
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return false;
  if (dt.getUTCDay() !== 0) return false; // hanya Minggu
  const today = wibIso();
  if (iso < today) return false;
  const limit = new Date(Date.now() + MAX_DAYS_AHEAD * DAY);
  return dt.getTime() <= limit.getTime();
}
function validSpot(code) {
  const m = /^([A-D])-([WEUS])(\d{2})$/.exec(code || "");
  if (!m) return false;
  const z = ZONES[m[1]];
  if (!z || !z.sides.includes(m[2])) return false;
  const n = Number(m[3]);
  return n >= 1 && n <= z.max;
}
function cleanText(v, max) {
  return String(v == null ? "" : v).replace(/\s+/g, " ").trim().slice(0, max);
}
function cleanWa(v) {
  let n = String(v || "").replace(/[^0-9]/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  if (n.startsWith("8")) n = "62" + n;
  return n;
}
function makeCode(spot) {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CFS-${spot}-${rand}`;
}

/* ---------- Midtrans ---------- */
function midtransBase(env) {
  return env.MIDTRANS_PRODUCTION === "true"
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com";
}
async function createSnap(env, booking, origin) {
  if (!env.MIDTRANS_SERVER_KEY) return { error: "MIDTRANS_SERVER_KEY belum diset" };
  const body = {
    transaction_details: { order_id: booking.code, gross_amount: booking.amount_idr },
    item_details: [
      {
        id: booking.spot_code,
        price: booking.amount_idr,
        quantity: 1,
        name: `Lapak ${booking.spot_code} ${booking.event_date}`.slice(0, 50),
      },
    ],
    customer_details: {
      first_name: String(booking.name).slice(0, 50),
      phone: booking.wa_number,
    },
    enabled_payments: ["other_qris"],
    expiry: { unit: "hours", duration: 24 },
  };
  if (origin) {
    body.callbacks = {
      finish: `${origin}/ticket.html?code=${encodeURIComponent(booking.code)}&date=${booking.event_date}`,
    };
  }
  let res;
  try {
    res = await fetch(`${midtransBase(env)}/snap/v1/transactions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        authorization: "Basic " + btoa(env.MIDTRANS_SERVER_KEY + ":"),
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return { error: "Gagal menghubungi Midtrans: " + e.message };
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) {
    const msg = (data.error_messages && data.error_messages[0]) || `Midtrans ${res.status}`;
    return { error: msg };
  }
  return { token: data.token, redirect_url: data.redirect_url };
}
async function sha512hex(text) {
  const buf = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ---------- helper ---------- */
async function priceFor(env, spotCode) {
  const zone = spotCode.slice(0, 1);
  try {
    const row = await env.DB.prepare("SELECT price_idr FROM zone_prices WHERE zone = ?")
      .bind(zone)
      .first();
    if (row && row.price_idr) return row.price_idr;
  } catch (e) {
    /* tabel belum ada — pakai harga bawaan */
  }
  return 25000;
}
function adminOk(request, env) {
  const pin = request.headers.get("x-admin-pin") || "";
  const expected = env.ADMIN_PIN || "";
  return expected.length > 0 && pin === expected;
}

function cleanUrl(v, max = 1000) {
  const s = cleanText(v, max);
  if (!s) return "";
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" && u.protocol !== "http:") return "";
    return u.toString();
  } catch {
    return "";
  }
}

function jobCode() {
  return `IGJ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

async function signState(env, payload) {
  const secret = String(env.IG_TOKEN_ENC_KEY || env.ADMIN_PIN || "");
  if (!secret) throw new Error("IG_TOKEN_ENC_KEY atau ADMIN_PIN belum diset untuk state OAuth");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const body = btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const sig = [...new Uint8Array(sigBuf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${body}.${sig}`;
}

async function verifyState(env, state) {
  const [body, sig] = String(state || "").split(".");
  if (!body || !sig) return null;
  const secret = String(env.IG_TOKEN_ENC_KEY || env.ADMIN_PIN || "");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const expected = [...new Uint8Array(sigBuf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (expected !== sig) return null;
  try {
    const json = JSON.parse(atob(body.replace(/-/g, "+").replace(/_/g, "/")));
    if (!json || typeof json.exp !== "number" || Date.now() > json.exp) return null;
    return json;
  } catch {
    return null;
  }
}

function htmlPage(title, body) {
  return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 16px;line-height:1.5;color:#111}code,pre{background:#f5f5f5;padding:2px 4px;border-radius:4px}pre{padding:12px;overflow:auto}.ok{color:#1b7f3a}.err{color:#b3261e}</style><h1>${title}</h1>${body}`, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

/* ---------- handler ---------- */
async function getStatus(url, env) {
  const date = url.searchParams.get("date") || "";
  if (!validDate(date)) return fail("Tanggal tidak valid");
  const { results } = await env.DB.prepare(
    "SELECT spot_code, status FROM bookings WHERE event_date = ? AND status IN ('pending','paid')"
  )
    .bind(date)
    .all();
  const taken = {};
  (results || []).forEach((r) => {
    // 'paid' menang atas 'pending' bila ada baris ganda (tidak seharusnya).
    if (r.status === "paid" || !taken[r.spot_code]) taken[r.spot_code] = r.status;
  });
  return json({ ok: true, date, price: await priceFor(env, "A-W01"), taken });
}

async function getBooking(url, env) {
  const code = cleanText(url.searchParams.get("code"), 40);
  if (!code) return fail("Kode booking wajib diisi");
  const row = await env.DB.prepare(
    "SELECT code, spot_code, event_date, name, business_type, wa_number, amount_idr, status, paid_at, created_at FROM bookings WHERE code = ?"
  )
    .bind(code)
    .first();
  if (!row) return fail("Booking tidak ditemukan", 404);
  return json({ ok: true, booking: row });
}

async function createBooking(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Body JSON tidak valid");
  }

  const date = cleanText(body.date, 10);
  const spot = cleanText(body.spot, 8).toUpperCase();
  const name = cleanText(body.name, 60);
  const type = cleanText(body.type, 30);
  const wa = cleanWa(body.wa);

  if (!validDate(date)) return fail("Minggu yang dipilih tidak valid");
  const win = windowFor(date);
  if (win.state !== "open") {
    return fail(
      win.state === "upcoming"
        ? "Pemesanan untuk Minggu itu belum dibuka (buka Senin 00.00 WIB)."
        : "Pemesanan untuk Minggu itu sudah ditutup (Sabtu 18.00 WIB).",
      409
    );
  }
  if (!validSpot(spot)) return fail("Kode lapak tidak valid");
  if (name.length < 2) return fail("Nama minimal 2 karakter");
  if (!BUSINESS_TYPES.includes(type)) return fail("Jenis usaha tidak valid");
  if (!/^62\d{8,14}$/.test(wa)) return fail("Nomor WhatsApp tidak valid");

  const amount = await priceFor(env, spot);
  const origin = new URL(request.url).origin;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeCode(spot);
    const snap = await createSnap(env, { code, spot_code: spot, event_date: date, amount_idr: amount, name, wa_number: wa }, origin);
    // Kalau Midtrans sedang bermasalah/tombol bayar belum aktif, booking tetap
    // dicatat sebagai pending supaya admin bisa mengonfirmasi manual.
    const manual = Boolean(snap.error);
    if (manual && env.ALLOW_MANUAL_FALLBACK !== "true") {
      return fail("Pembayaran belum bisa dibuat: " + snap.error, 502);
    }

    try {
      await env.DB.prepare(
        `INSERT INTO bookings
           (code, spot_code, event_date, name, business_type, wa_number, amount_idr, status, payment_ref, snap_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
      )
        .bind(code, spot, date, name, type, wa, amount, code, (snap && snap.redirect_url) || "")
        .run();
    } catch (e) {
      const msg = String(e && e.message);
      if (/UNIQUE/i.test(msg)) {
        // Bisa bentrok kode (coba lagi) atau lapak sudah dipesan (berhenti).
        const taken = await env.DB.prepare(
          "SELECT 1 AS x FROM bookings WHERE spot_code = ? AND event_date = ? AND status IN ('pending','paid')"
        )
          .bind(spot, date)
          .first();
        if (taken) return fail("Lapak ini baru saja dipesan orang lain. Silakan pilih lapak lain.", 409);
        continue;
      }
      return fail("Gagal menyimpan booking: " + msg, 500);
    }

    return json({
      ok: true,
      code,
      date,
      spot,
      amount,
      manual,
      snap: snap.error ? null : { token: snap.token, redirect_url: snap.redirect_url },
    });
  }
  return fail("Gagal membuat kode booking, coba lagi", 500);
}

async function webhook(request, env) {
  if (!env.MIDTRANS_SERVER_KEY) return fail("Server key belum diset", 503);
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Body JSON tidak valid");
  }
  const orderId = cleanText(body.order_id, 40);
  const statusCode = cleanText(body.status_code, 3);
  const gross = cleanText(body.gross_amount, 20);
  const signature = cleanText(body.signature_key, 200);
  if (!orderId || !statusCode || !gross || !signature) return fail("Payload tidak lengkap");

  const expected = await sha512hex(orderId + statusCode + gross + env.MIDTRANS_SERVER_KEY);
  if (expected !== signature) return fail("Signature tidak cocok", 401);

  const row = await env.DB.prepare("SELECT code, amount_idr FROM bookings WHERE code = ?")
    .bind(orderId)
    .first();
  if (!row) return fail("Order tidak dikenal", 404);
  if (Number(gross) !== Number(row.amount_idr)) return fail("Nominal tidak cocok", 409);

  const ts = String(body.transaction_status || "").toLowerCase();
  const fraud = String(body.fraud_status || "").toLowerCase();
  let status = null;
  if (ts === "settlement" || (ts === "capture" && fraud === "accept")) status = "paid";
  else if (ts === "pending") status = "pending";
  else if (ts === "expire") status = "expired";
  else if (ts === "cancel" || ts === "deny" || ts === "failure") status = "cancelled";
  if (!status) return json({ ok: true, ignored: ts });

  if (status === "paid") {
    await env.DB.prepare(
      "UPDATE bookings SET status = 'paid', paid_at = COALESCE(paid_at, datetime('now')) WHERE code = ?"
    )
      .bind(orderId)
      .run();
  } else {
    // Jangan turunkan booking yang sudah lunas.
    await env.DB.prepare("UPDATE bookings SET status = ? WHERE code = ? AND status != 'paid'")
      .bind(status, orderId)
      .run();
  }
  return json({ ok: true, status });
}

async function adminList(request, env) {
  if (!adminOk(request, env)) return fail("PIN salah", 401);
  const { results } = await env.DB.prepare(
    `SELECT code, spot_code, event_date, name, business_type, wa_number, amount_idr,
            status, payment_ref, snap_url, paid_at, created_at
       FROM bookings ORDER BY created_at DESC`
  ).all();
  return json({ ok: true, bookings: results || [] });
}

async function adminUpdate(request, env) {
  if (!adminOk(request, env)) return fail("PIN salah", 401);
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Body JSON tidak valid");
  }
  const code = cleanText(body.code, 40);
  const status = cleanText(body.status, 12);
  if (!["pending", "paid", "cancelled", "expired"].includes(status)) return fail("Status tidak valid");
  const res = await env.DB.prepare(
    `UPDATE bookings SET status = ?,
            paid_at = CASE WHEN ? = 'paid' THEN COALESCE(paid_at, datetime('now')) ELSE paid_at END
       WHERE code = ?`
  )
    .bind(status, status, code)
    .run();
  if (!res.meta || res.meta.changes === 0) return fail("Booking tidak ditemukan", 404);
  return json({ ok: true, code, status });
}

/* ---------- Instagram admin ---------- */

async function getActiveIgAccount(env) {
  return env.DB.prepare(
    `SELECT id, ig_user_id, username, account_type, token_enc, token_type, scopes, expires_at, connected_at, updated_at
       FROM ig_accounts ORDER BY updated_at DESC, id DESC LIMIT 1`
  ).first();
}

async function saveIgAccount(env, { igUserId, username, accountType, token, tokenType, scopes, expiresIn }) {
  const tokenEnc = await encryptToken(env, token);
  const expiresAt = expiresIn ? new Date(Date.now() + Number(expiresIn) * 1000).toISOString() : null;
  await env.DB.prepare(
    `INSERT INTO ig_accounts (ig_user_id, username, account_type, token_enc, token_type, scopes, expires_at, connected_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
     ON CONFLICT(ig_user_id) DO UPDATE SET
       username=excluded.username,
       account_type=excluded.account_type,
       token_enc=excluded.token_enc,
       token_type=excluded.token_type,
       scopes=excluded.scopes,
       expires_at=excluded.expires_at,
       updated_at=datetime('now')`
  ).bind(igUserId, username || "", accountType || "", tokenEnc, tokenType || "bearer", scopes || "", expiresAt).run();
  return { igUserId, username, accountType, expiresAt };
}

async function igAuthStart(request, env) {
  if (!adminOk(request, env)) return fail("PIN salah", 401);
  const origin = new URL(request.url).origin;
  const state = await signState(env, { exp: Date.now() + 10 * 60 * 1000, nonce: crypto.randomUUID() });
  const { url, cfg } = buildAuthUrl(env, origin, state);
  return json({ ok: true, auth_url: url, redirect_uri: cfg.redirectUri, scopes: cfg.scopes });
}

async function igAuthCallback(request, env) {
  const url = new URL(request.url);
  const err = url.searchParams.get("error");
  const errDesc = url.searchParams.get("error_description") || url.searchParams.get("error_reason") || "";
  if (err) return htmlPage("Instagram OAuth gagal", `<p class="err">Instagram mengembalikan error: <code>${cleanText(err, 80)}</code></p><p>${cleanText(errDesc, 300)}</p>`);
  const code = cleanText(url.searchParams.get("code"), 500);
  const state = url.searchParams.get("state") || "";
  const stateOk = await verifyState(env, state);
  if (!code || !stateOk) return htmlPage("Instagram OAuth gagal", `<p class="err">State OAuth tidak valid atau kedaluwarsa. Ulangi dari panel admin.</p>`);
  try {
    const origin = url.origin;
    const short = await exchangeCodeForShortToken(env, origin, code);
    const long = await exchangeForLongLivedToken(env, short.accessToken);
    const me = await fetchMe(long.accessToken);
    const igUserId = me.igUserId || short.userId;
    if (!igUserId) throw new Error("Instagram user_id tidak ditemukan");
    const saved = await saveIgAccount(env, {
      igUserId,
      username: me.username,
      accountType: me.accountType,
      token: long.accessToken,
      tokenType: long.tokenType,
      scopes: igAppConfig(env, origin).scopes,
      expiresIn: long.expiresIn,
    });
    return htmlPage("Instagram terhubung", `<p class="ok">Akun Instagram berhasil dihubungkan.</p><pre>${cleanText(JSON.stringify({ ig_user_id: saved.igUserId, username: saved.username, account_type: saved.accountType, expires_at: saved.expiresAt }, null, 2), 2000)}</pre><p>Kamu bisa menutup tab ini dan kembali ke panel admin.</p>`);
  } catch (e) {
    return htmlPage("Instagram OAuth gagal", `<p class="err">${cleanText(e && e.message ? e.message : String(e), 500)}</p><p>Pastikan akun Instagram adalah Professional (Business/Creator), terhubung ke app Meta, dan redirect URI cocok.</p>`);
  }
}

async function igStatus(request, env) {
  if (!adminOk(request, env)) return fail("PIN salah", 401);
  const acct = await getActiveIgAccount(env);
  let jobs = { results: [] };
  try {
    jobs = await env.DB.prepare(
      `SELECT job_code, ig_user_id, media_type, video_url, caption, status, container_id, media_id, error_message, created_at, updated_at, published_at
         FROM ig_media_jobs ORDER BY created_at DESC LIMIT 20`
    ).all();
  } catch {}
  return json({
    ok: true,
    account: acct ? {
      ig_user_id: acct.ig_user_id,
      username: acct.username,
      account_type: acct.account_type,
      scopes: acct.scopes,
      expires_at: acct.expires_at,
      connected_at: acct.connected_at,
      updated_at: acct.updated_at,
    } : null,
    jobs: jobs.results || [],
    config: {
      has_app_id: Boolean(env.IG_APP_ID),
      has_app_secret: Boolean(env.IG_APP_SECRET),
      has_token_enc_key: Boolean(env.IG_TOKEN_ENC_KEY),
      redirect_uri: igAppConfig(env, new URL(request.url).origin).redirectUri,
      scopes: igAppConfig(env, new URL(request.url).origin).scopes,
    },
  });
}

async function igDisconnect(request, env) {
  if (!adminOk(request, env)) return fail("PIN salah", 401);
  await env.DB.prepare("DELETE FROM ig_accounts").run();
  return json({ ok: true, disconnected: true });
}

async function igPublish(request, env) {
  if (!adminOk(request, env)) return fail("PIN salah", 401);
  let body;
  try { body = await request.json(); } catch { return fail("Body JSON tidak valid"); }
  const videoUrl = cleanUrl(body.video_url, 1000);
  if (!videoUrl) return fail("video_url HTTPS wajib diisi");
  const caption = cleanText(body.caption, 2200);
  const coverUrl = cleanUrl(body.cover_url, 1000) || null;
  const shareToFeed = body.share_to_feed !== false;
  const mediaType = cleanText(body.media_type, 20).toUpperCase() === "VIDEO" ? "VIDEO" : "REELS";

  const acct = await getActiveIgAccount(env);
  if (!acct) return fail("Belum ada akun Instagram terhubung", 409);
  let token;
  try { token = await decryptToken(env, acct.token_enc); }
  catch (e) { return fail("Token Instagram tidak bisa dibaca: " + (e && e.message ? e.message : e), 500); }

  const code = jobCode();
  await env.DB.prepare(
    `INSERT INTO ig_media_jobs (job_code, ig_user_id, media_type, video_url, caption, cover_url, share_to_feed, status, payload_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'created', ?)`
  ).bind(code, acct.ig_user_id, mediaType, videoUrl, caption, coverUrl, shareToFeed ? 1 : 0, JSON.stringify({ source: "admin_api" })).run();

  try {
    const container = await createVideoContainer(token, acct.ig_user_id, { videoUrl, caption, coverUrl: coverUrl || undefined, shareToFeed, mediaType });
    const containerId = String(container.id || "");
    if (!containerId) throw new Error("Container ID tidak diterima dari Instagram");
    await env.DB.prepare("UPDATE ig_media_jobs SET status='container_created', container_id=?, updated_at=datetime('now') WHERE job_code=?")
      .bind(containerId, code).run();

    let status = "container_created";
    let lastStatus = null;
    for (let i = 0; i < 12; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const st = await getContainerStatus(token, containerId);
      lastStatus = st;
      const sc = String(st.status_code || "").toUpperCase();
      if (sc === "FINISHED") { status = "finished"; break; }
      if (sc === "ERROR" || sc === "EXPIRED") {
        const msg = cleanText(st.status || sc, 500);
        await env.DB.prepare("UPDATE ig_media_jobs SET status='error', error_message=?, payload_json=?, updated_at=datetime('now') WHERE job_code=?")
          .bind(msg, JSON.stringify(st), code).run();
        return fail("Instagram menolak media: " + msg, 502);
      }
      await env.DB.prepare("UPDATE ig_media_jobs SET status='processing', payload_json=?, updated_at=datetime('now') WHERE job_code=?")
        .bind(JSON.stringify(st), code).run();
    }
    if (status !== "finished") {
      await env.DB.prepare("UPDATE ig_media_jobs SET status='processing', payload_json=?, updated_at=datetime('now') WHERE job_code=?")
        .bind(JSON.stringify(lastStatus || { note: "timeout_waiting_finish" }), code).run();
      return json({ ok: true, job_code: code, container_id: containerId, status: "processing", message: "Container masih diproses Instagram. Cek status job lagi beberapa saat lalu publish." });
    }

    const pub = await publishContainer(token, acct.ig_user_id, containerId);
    const mediaId = String(pub.id || "");
    let permalink = "";
    try { const m = await getMedia(token, mediaId); permalink = m.permalink || ""; } catch {}
    await env.DB.prepare("UPDATE ig_media_jobs SET status='published', media_id=?, payload_json=?, published_at=datetime('now'), updated_at=datetime('now') WHERE job_code=?")
      .bind(mediaId, JSON.stringify({ published: pub, permalink }), code).run();
    return json({ ok: true, job_code: code, container_id: containerId, media_id: mediaId, permalink, status: "published" });
  } catch (e) {
    const msg = cleanText(e && e.message ? e.message : String(e), 500);
    await env.DB.prepare("UPDATE ig_media_jobs SET status='error', error_message=?, updated_at=datetime('now') WHERE job_code=?")
      .bind(msg, code).run();
    return fail(msg, 502);
  }
}

async function igJobs(request, env) {
  if (!adminOk(request, env)) return fail("PIN salah", 401);
  const url = new URL(request.url);
  const code = cleanText(url.searchParams.get("code"), 60);
  if (code) {
    const row = await env.DB.prepare("SELECT * FROM ig_media_jobs WHERE job_code=?").bind(code).first();
    if (!row) return fail("Job tidak ditemukan", 404);
    if (row.container_id && row.status !== "published" && row.status !== "error") {
      const acct = await getActiveIgAccount(env);
      if (acct) {
        try {
          const token = await decryptToken(env, acct.token_enc);
          const st = await getContainerStatus(token, row.container_id);
          const sc = String(st.status_code || "").toUpperCase();
          const next = sc === "FINISHED" ? "finished" : sc === "ERROR" || sc === "EXPIRED" ? "error" : "processing";
          await env.DB.prepare("UPDATE ig_media_jobs SET status=?, payload_json=?, error_message=?, updated_at=datetime('now') WHERE job_code=?")
            .bind(next, JSON.stringify(st), sc === "ERROR" || sc === "EXPIRED" ? cleanText(st.status || sc, 500) : row.error_message, code).run();
          row.status = next;
          row.payload_json = JSON.stringify(st);
        } catch {}
      }
    }
    return json({ ok: true, job: row });
  }
  const { results } = await env.DB.prepare(
    `SELECT job_code, ig_user_id, media_type, video_url, caption, status, container_id, media_id, error_message, created_at, updated_at, published_at
       FROM ig_media_jobs ORDER BY created_at DESC LIMIT 50`
  ).all();
  return json({ ok: true, jobs: results || [] });
}

async function igPublishJob(request, env) {
  if (!adminOk(request, env)) return fail("PIN salah", 401);
  let body;
  try { body = await request.json(); } catch { return fail("Body JSON tidak valid"); }
  const code = cleanText(body.job_code, 60);
  if (!code) return fail("job_code wajib diisi");
  const row = await env.DB.prepare("SELECT * FROM ig_media_jobs WHERE job_code=?").bind(code).first();
  if (!row) return fail("Job tidak ditemukan", 404);
  if (row.status === "published") return json({ ok: true, job_code: code, status: "published", media_id: row.media_id });
  if (!row.container_id) return fail("Job belum punya container_id", 409);
  const acct = await getActiveIgAccount(env);
  if (!acct) return fail("Belum ada akun Instagram terhubung", 409);
  try {
    const token = await decryptToken(env, acct.token_enc);
    const st = await getContainerStatus(token, row.container_id);
    const sc = String(st.status_code || "").toUpperCase();
    if (sc !== "FINISHED") return json({ ok: false, job_code: code, status: sc || row.status, message: "Container belum FINISHED" }, 409);
    const pub = await publishContainer(token, acct.ig_user_id, row.container_id);
    const mediaId = String(pub.id || "");
    let permalink = "";
    try { const m = await getMedia(token, mediaId); permalink = m.permalink || ""; } catch {}
    await env.DB.prepare("UPDATE ig_media_jobs SET status='published', media_id=?, payload_json=?, published_at=datetime('now'), updated_at=datetime('now') WHERE job_code=?")
      .bind(mediaId, JSON.stringify({ published: pub, permalink }), code).run();
    return json({ ok: true, job_code: code, media_id: mediaId, permalink, status: "published" });
  } catch (e) {
    return fail(e && e.message ? e.message : String(e), 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (!path.startsWith("/api/")) {
      if (env.ASSETS) return env.ASSETS.fetch(request);
      return new Response("Not found", { status: 404 });
    }
    try {
      if (path === "/api/status" && request.method === "GET") return await getStatus(url, env);
      if (path === "/api/book" && request.method === "POST") return await createBooking(request, env);
      if (path === "/api/booking" && request.method === "GET") return await getBooking(url, env);
      if (path === "/api/midtrans/webhook" && request.method === "POST") return await webhook(request, env);
      if (path === "/api/admin/bookings" && request.method === "GET") return await adminList(request, env);
      if (path === "/api/admin/update" && request.method === "POST") return await adminUpdate(request, env);

      // Instagram (fondasi) — admin-only kecuali callback OAuth.
      if (path === "/api/admin/instagram/auth/start" && request.method === "GET") return await igAuthStart(request, env);
      if (path === "/api/admin/instagram/callback" && request.method === "GET") return await igAuthCallback(request, env);
      if (path === "/api/admin/instagram/status" && request.method === "GET") return await igStatus(request, env);
      if (path === "/api/admin/instagram/disconnect" && request.method === "POST") return await igDisconnect(request, env);
      if (path === "/api/admin/instagram/publish" && request.method === "POST") return await igPublish(request, env);
      if (path === "/api/admin/instagram/jobs" && request.method === "GET") return await igJobs(request, env);
      if (path === "/api/admin/instagram/jobs/publish" && request.method === "POST") return await igPublishJob(request, env);
      return fail("Endpoint tidak dikenal", 404);
    } catch (e) {
      return fail("Kesalahan server: " + (e && e.message ? e.message : String(e)), 500);
    }
  },
};
