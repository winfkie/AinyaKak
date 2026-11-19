/* CFDSemarang — API Worker (M2).
 * Pemesanan lapak + pembayaran QRIS lewat Midtrans Snap (sandbox/production
 * dipilih dengan env.MIDTRANS_PRODUCTION). Hanya /api/* yang masuk ke sini;
 * sisanya dilayani static assets.
 *
 * Status booking hanya berubah lewat webhook Midtrans terverifikasi atau
 * aksi admin. Klien tidak pernah bisa menandai "paid" sendiri.
 */

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
      return fail("Endpoint tidak dikenal", 404);
    } catch (e) {
      return fail("Kesalahan server: " + (e && e.message ? e.message : String(e)), 500);
    }
  },
};
