/* CFDSemarang — peta interaktif + booking (M2: API Worker + D1 + Midtrans).
 * Data ketersediaan lapak diambil dari /api/status; booking dikirim ke
 * /api/book lalu pengunjung diarahkan ke halaman pembayaran QRIS Midtrans.
 * Status "lunas" hanya bisa diubah webhook/admin di server.
 */
(function () {
  "use strict";

  const CFG = window.CFDS;
  const ZONES = window.ZONES;
  const GEO = window.MAPGEO;

  const $ = (sel) => document.querySelector(sel);
  const pad2 = (n) => String(n).padStart(2, "0");
  // Local-date ISO (bukan toISOString — menghindari geser hari karena zona WIB).
  const localIso = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const fmtDate = (iso) => {
    const d = new Date(iso + "T00:00:00");
    const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][d.getDay()];
    const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${hari}, ${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
  };
  const rupiah = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");

  /* ---------- state ---------- */
  const MINE_KEY = "cfdsemarang.mine.v1";
  function loadMine() {
    try { return JSON.parse(localStorage.getItem(MINE_KEY)) || {}; }
    catch { return {}; }
  }
  let mine = loadMine();      // { date: { spot: { code, snap } } }
  let takenMap = {};          // spot -> "paid" | "pending"
  let statusErrorShown = false;

  async function apiGet(path) {
    const r = await fetch(path, { headers: { accept: "application/json" } });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
    return data;
  }

  /* ---------- sundays ---------- */
  function nextSundays(count) {
    const out = [];
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    while (out.length < count) {
      if (d.getDay() === 0) out.push(localIso(d));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }
  // Booking untuk suatu Minggu: buka Senin pekan itu, tutup Sabtu 18.00 WIB.
  function sundayWindow(sundayIso) {
    const sun = new Date(sundayIso + "T00:00:00");
    const mon = new Date(sun); mon.setDate(sun.getDate() - 6); mon.setHours(0, 0, 0, 0);
    const sat = new Date(sun); sat.setDate(sun.getDate() - 1); sat.setHours(CFG.closeHour, 0, 0, 0);
    const now = new Date();
    if (now < mon) return { state: "upcoming", label: `Buka ${fmtDate(localIso(mon))}` };
    if (now >= sat) return { state: "closed", label: "Ditutup (Sab 18.00)" };
    return { state: "open", label: `Tutup Sab 18.00` };
  }

  let currentDate = null;
  let viewMonth = null; // tanggal 1 dari bulan yang ditampilkan di kalender
  const MONTHS_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

  // Minggu bawaan: yang pertama buka dalam ±4 bulan; kalau tidak ada yang buka
  // (mis. Sabtu malam / hari Minggu itu sendiri), pakai Minggu terdekat.
  function defaultSunday() {
    const list = nextSundays(17);
    return list.find((iso) => sundayWindow(iso).state === "open") || list[0];
  }

  /* Kalender mini — hanya hari Minggu yang bisa dipilih.
   * Dihitung ulang dari tanggal sekarang, jadi otomatis maju saat Minggu lewat. */
  function renderCalendar() {
    const wrap = $("#sundayStrip");
    wrap.innerHTML = "";

    if (!viewMonth) {
      const base = currentDate ? new Date(currentDate + "T00:00:00") : new Date();
      viewMonth = new Date(base.getFullYear(), base.getMonth(), 1);
    }

    const now = new Date();
    const todayIso = localIso(now);
    const monthStart = viewMonth;
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

    // ---- header: ‹ November 2026 ›
    const head = document.createElement("div");
    head.className = "cal-head";
    const prev = document.createElement("button");
    prev.type = "button"; prev.className = "cal-nav"; prev.textContent = "‹";
    prev.setAttribute("aria-label", "Bulan sebelumnya");
    prev.disabled = monthStart <= new Date(now.getFullYear(), now.getMonth(), 1);
    const title = document.createElement("strong");
    title.textContent = `${MONTHS_ID[monthStart.getMonth()]} ${monthStart.getFullYear()}`;
    const next = document.createElement("button");
    next.type = "button"; next.className = "cal-nav"; next.textContent = "›";
    next.setAttribute("aria-label", "Bulan berikutnya");
    next.disabled = monthStart >= new Date(now.getFullYear(), now.getMonth() + 3, 1);
    head.append(prev, title, next);
    wrap.appendChild(head);

    // ---- deretan persegi seragam: satu kotak per Minggu bulan ini
    const grid = document.createElement("div");
    grid.className = "cal-grid";
    for (let d = 1; d <= monthEnd.getDate(); d++) {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), d);
      const iso = localIso(date);
      if (date.getDay() !== 0) continue; // hanya Minggu
      const win = sundayWindow(iso);
      const b = document.createElement("button");
      b.type = "button";
      b.className = "cal-sun" +
        (win.state !== "open" ? " closed" : "") +
        (iso === todayIso ? " today" : "");
      b.setAttribute("aria-pressed", String(iso === currentDate));
      b.setAttribute("aria-label", `${fmtDate(iso)} · ${win.state === "open" ? "Pemesanan buka" : win.label}`);
      b.title = `${fmtDate(iso)} · ${win.state === "open" ? "Pemesanan buka" : win.label}`;
      const sub = win.state === "open" ? "buka" : (iso < todayIso ? "lewat" : "tutup");
      b.innerHTML = `<span class="n">${d}</span><span class="s">${sub}</span>`;
      b.addEventListener("click", () => {
        currentDate = iso;
        renderCalendar(); renderMap(); loadStatus(iso);
      });
      grid.appendChild(b);
    }
    wrap.appendChild(grid);

    prev.addEventListener("click", () => {
      viewMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1);
      renderCalendar();
    });
    next.addEventListener("click", () => {
      viewMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
      renderCalendar();
    });
  }

  // Auto-refresh: kalau hari berganti (Minggu lewat / tengah malam),
  // hitung ulang pilihan bawaan + kalender + peta.
  let todayCache = localIso(new Date());
  setInterval(() => {
    const t = localIso(new Date());
    if (t !== todayCache) {
      todayCache = t;
      viewMonth = null;
      currentDate = defaultSunday();
      renderCalendar(); renderMap(); loadStatus(currentDate);
    }
  }, 60000);

  /* ---------- spot status ---------- */
  function spotStatus(dateIso, code) {
    if ((mine[dateIso] || {})[code]) return "yours";
    const t = takenMap[code];
    if (t === "paid") return "sold";
    if (t === "pending") return "pending";
    return "free";
  }
  function allSpots() {
    const list = [];
    ZONES.forEach((z) => {
      for (let n = 1; n <= z.perSide; n++) {
        if (z.horizontal) {
          list.push({ zone: z, code: `${z.code}-U${pad2(n)}`, side: "utara" });
          list.push({ zone: z, code: `${z.code}-S${pad2(n)}`, side: "selatan" });
        } else {
          list.push({ zone: z, code: `${z.code}-W${pad2(n)}`, side: "barat" });
          list.push({ zone: z, code: `${z.code}-E${pad2(n)}`, side: "timur" });
        }
      }
    });
    return list;
  }

  /* ---------- data ketersediaan dari server ---------- */
  async function loadStatus(dateIso) {
    const wanted = dateIso;
    try {
      const data = await apiGet(`/api/status?date=${encodeURIComponent(dateIso)}`);
      if (wanted !== currentDate) return; // pengguna sudah pindah Minggu
      takenMap = data.taken || {};
      statusErrorShown = false;
      renderMap();
    } catch (e) {
      if (wanted !== currentDate) return;
      takenMap = {};
      renderMap();
      if (!statusErrorShown) {
        showToast("Gagal memuat status lapak. Periksa koneksi lalu muat ulang.");
        statusErrorShown = true;
      }
    }
  }

  /* ---------- map ---------- */
  const svgNS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, text) {
    const e = document.createElementNS(svgNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }

  function renderMap() {
    const svg = $("#cfdMap");
    svg.innerHTML = "";

    // roads
    svg.appendChild(el("rect", { class: "map-road", x: GEO.roundabout.cx - GEO.roundabout.r, y: GEO.roundabout.cy - GEO.roundabout.r, width: GEO.roundabout.r * 2, height: GEO.roundabout.r * 2, rx: 20 }));
    svg.appendChild(el("rect", { class: "map-road", x: GEO.roadX, y: GEO.roundabout.cy, width: GEO.roadW, height: GEO.field.y - GEO.roundabout.cy }));
    const D = ZONES[3].horizontal;
    svg.appendChild(el("rect", { class: "map-road", x: D.x1, y: D.y, width: D.x2 - D.x1, height: D.height }));
    // center dashes on vertical road
    svg.appendChild(el("line", { class: "map-road-line", x1: GEO.roadX + GEO.roadW / 2, y1: GEO.roundabout.cy + 10, x2: GEO.roadX + GEO.roadW / 2, y2: GEO.field.y - 10 }));

    // roundabout label
    svg.appendChild(el("circle", { class: "map-roundabout", cx: GEO.roundabout.cx, cy: GEO.roundabout.cy, r: 46 }));
    svg.appendChild(el("text", { class: "map-zone-label", x: GEO.roundabout.cx, y: GEO.roundabout.cy + 4, "text-anchor": "middle" }, "Tugu Muda"));
    svg.appendChild(el("text", { class: "map-corner", x: GEO.roundabout.cx, y: 34, "text-anchor": "middle" }, "Lawang Sewu ↗"));

    // Simpang Lima field
    svg.appendChild(el("rect", { class: "map-field", x: GEO.field.x, y: GEO.field.y, width: GEO.field.w, height: GEO.field.h, rx: 14 }));
    svg.appendChild(el("text", { class: "map-zone-label", x: GEO.field.x + GEO.field.w / 2, y: GEO.field.y + 76, "text-anchor": "middle" }, "SIMPANG LIMA"));
    svg.appendChild(el("text", { class: "map-zone-sub", x: GEO.field.x + GEO.field.w / 2, y: GEO.field.y + 96, "text-anchor": "middle" }, "Lapangan Pancasila — zona A di tepi utara lapangan"));

    // zone labels (vertical zones)
    ZONES.filter((z) => !z.horizontal).forEach((z) => {
      svg.appendChild(el("text", { class: "map-zone-label", x: 20, y: z.roadY[0] + 18 }, z.name));
      svg.appendChild(el("text", { class: "map-zone-sub", x: 20, y: z.roadY[0] + 36 }, z.sub));
      svg.appendChild(el("text", { class: "map-side-label", x: GEO.roadX - 4, y: z.roadY[0] - 6, "text-anchor": "end" }, "Sisi Barat"));
      svg.appendChild(el("text", { class: "map-side-label", x: GEO.roadX + GEO.roadW + 4, y: z.roadY[0] - 6 }, "Sisi Timur"));
    });
    svg.appendChild(el("text", { class: "map-zone-label", x: D.x1, y: D.y - 12 }, ZONES[3].name));
    svg.appendChild(el("text", { class: "map-side-label", x: D.x1, y: D.y - 26 }, "← cabang ke Jl. Pahlawan / Kota Lama"));

    // spots
    allSpots().forEach((s) => {
      let x, y;
      const z = s.zone;
      const n = parseInt(s.code.slice(-2), 10);
      if (z.horizontal) {
        x = D.x1 + 6 + (n - 1) * GEO.spotPitch;
        y = s.side === "utara" ? D.y + 4 : D.y + 4 + GEO.spotSize + 16;
      } else {
        const col = s.side === "barat" ? GEO.roadX + GEO.spotInset : GEO.roadX + GEO.roadW - GEO.spotInset - GEO.spotSize;
        x = col;
        y = z.roadY[0] + 6 + (n - 1) * GEO.spotPitch;
      }
      const g = el("g", { class: "spot", role: "button", tabindex: "0", "data-code": s.code, "aria-label": `Lapak ${s.code}` });
      g.appendChild(el("rect", { x, y, width: GEO.spotSize, height: GEO.spotSize, rx: 3 }));
      g.appendChild(el("text", { x: x + GEO.spotSize / 2, y: y + GEO.spotSize / 2 + 3, "text-anchor": "middle" }, s.code));
      const st = spotStatus(currentDate, s.code);
      if (st !== "free") g.classList.add(st === "pending" ? "pending" : st === "yours" ? "yours" : "sold");
      g.addEventListener("click", () => openSpotPopup(s));
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openSpotPopup(s); } });
      svg.appendChild(g);
    });
  }

  /* ---------- spot popup ---------- */
  let activeSpot = null;
  function waLink(spotCode) {
    const base = `https://wa.me/${CFG.waMeNumber}`;
    const msg = (spotCode ? CFG.waMessageSpot : CFG.waMessage).replace("{spot}", spotCode || "");
    return `${base}?text=${encodeURIComponent(msg)}`;
  }
  function refreshWaFab() {
    $("#waFab").href = waLink(null);
  }

  function openSpotPopup(s) {
    activeSpot = s;
    $("#popupZone").textContent = s.zone.name;
    $("#spotTitle").textContent = `Lapak ${s.code} · ${s.side}`;
    $("#spotDate").textContent = fmtDate(currentDate);
    $("#spotPrice").textContent = rupiah(CFG.defaultPriceIdr) + " / minggu";
    const st = spotStatus(currentDate, s.code);
    const stEl = $("#spotStatus");
    const btn = $("#chooseBtn");
    const winOpen = sundayWindow(currentDate).state === "open";
    // Status milik sendiri/terisi tampil apa pun jendelanya — penting saat
    // Minggu HARI CFD (jendela tutup) supaya pemilik tetap melihat lapaknya.
    const mineEntry = (mine[currentDate] || {})[s.code];
    if (st === "yours") {
      stEl.textContent = mineEntry && mineEntry.snap ? "Pesanan kamu · belum lunas" : "Pesanan kamu";
      btn.disabled = true; btn.textContent = "Sudah kamu pesan ✓";
    } else if (st === "sold") {
      stEl.textContent = "Terisi"; btn.disabled = true; btn.textContent = "Sudah terisi";
    } else if (st === "pending") {
      stEl.textContent = "Menunggu pembayaran"; btn.disabled = true; btn.textContent = "Sedang diproses…";
    } else if (!winOpen) {
      stEl.textContent = "Pemesanan ditutup — buka Senin"; btn.disabled = true; btn.textContent = "Belum buka";
    } else {
      stEl.textContent = "Tersedia"; btn.disabled = false; btn.textContent = "Pilih tempat ini";
    }
    $("#askWaBtn").href = waLink(s.code);
    $("#spotPopup").hidden = false;
    $("#popupClose").focus();
  }

  /* ---------- booking modal ---------- */
  function openBooking() {
    $("#bookSpotLabel").textContent = `${activeSpot.code} — ${fmtDate(currentDate)}`;
    $("#bookForm").reset();
    $("#bookSubmit").disabled = false;
    $("#bookModal").hidden = false;
    $("#fName").focus();
  }

  $("#bookForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (sundayWindow(currentDate).state !== "open") {
      showToast("Pemesanan untuk Minggu ini sudah ditutup (Sabtu 18.00 WIB).");
      return;
    }
    const btn = $("#bookSubmit");
    if (btn.disabled) return;
    const paymentMethod = ($("#bookForm input[name='payment_method']:checked") || {}).value || "qris";
    btn.disabled = true;
    btn.textContent = paymentMethod === "transfer" ? "Membuat pesanan…" : "Membuat pembayaran…";

    try {
      const r = await fetch("/api/book", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          date: currentDate,
          spot: activeSpot.code,
          name: $("#fName").value.trim(),
          type: $("#fType").value,
          wa: $("#fWa").value.trim(),
          payment_method: paymentMethod,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        showToast(data.error || "Booking gagal. Coba lagi.");
        btn.disabled = false;
        btn.textContent = "Buat pesanan";
        if (r.status === 409) loadStatus(currentDate);
        return;
      }

      mine[currentDate] = mine[currentDate] || {};
      mine[currentDate][activeSpot.code] = {
        code: data.code,
        snap: (data.snap && data.snap.redirect_url) || "",
        payment_method: data.payment_method || paymentMethod,
      };
      localStorage.setItem(MINE_KEY, JSON.stringify(mine));
      localStorage.setItem("cfdsemarang.last.v1", JSON.stringify({ code: data.code, date: currentDate }));

      $("#bookModal").hidden = true;
      $("#spotPopup").hidden = true;
      renderMap();

      if (data.payment_method === "qris" && data.snap && data.snap.redirect_url) {
        showToast("Mengarahkan ke pembayaran QRIS…");
        location.href = data.snap.redirect_url;
        return;
      }
      if (data.qris_fallback) {
        showToast("QRIS gagal. Dialihkan ke konfirmasi transfer via WhatsApp.");
        location.href = `index.html?code=${encodeURIComponent(data.code)}&fallback=${encodeURIComponent(data.code)}#cek-pesanan`;
        return;
      }
      if (data.payment_method === "transfer") {
        showToast("Booking dibuat. Silakan konfirmasi transfer manual via WhatsApp.");
      } else {
        showToast("Booking dibuat. Cek detail pesananmu.");
      }
      location.href = `ticket.html?code=${encodeURIComponent(data.code)}&date=${currentDate}`;
    } catch (err) {
      showToast("Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.");
      btn.disabled = false;
      btn.textContent = "Buat pesanan";
    }
  });

  /* ---------- cek pesanan ---------- */
  const statusLabel = {
    paid: "Lunas",
    pending: "Menunggu pembayaran",
    expired: "Kedaluwarsa",
    cancelled: "Dibatalkan",
  };
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function waTransferLink(b) {
    const text = encodeURIComponent(
      `Halo admin CFDSemarang, saya mau konfirmasi pembayaran transfer untuk booking ${b.code} (lapak ${b.spot_code}, ${b.event_date}, ${b.name}, ${rupiah(b.amount_idr)}).`
    );
    return `https://wa.me/${CFG.waMeNumber}?text=${text}`;
  }
  function renderFallbackNotice(b) {
    if (!b || b.status !== "pending" || b.payment_method !== "transfer") return "";
    return `<div class="fallback-notice">
      <strong>Sistem QRIS gagal / dialihkan ke transfer manual</strong>
      <p>Pesananmu tetap tercatat. Silakan lanjut konfirmasi pembayaran lewat WhatsApp agar admin bisa memverifikasi booking <b>${esc(b.code)}</b>.</p>
      <a class="btn btn-wa" href="${waTransferLink(b)}" target="_blank" rel="noopener">Lanjut ke WhatsApp</a>
    </div>`;
  }
  function renderCheckResult(b, opts = {}) {
    const status = b.status || "pending";
    const label = statusLabel[status] || status;
    const method = b.payment_method === "transfer" ? "Transfer manual" : "QRIS";
    const payBtn = status === "pending" && b.payment_method !== "transfer" && b.snap_url
      ? `<a class="btn btn-primary" href="${esc(b.snap_url)}" target="_blank" rel="noopener">Lanjut bayar QRIS</a>`
      : "";
    const wa = waTransferLink(b);
    const transferBtn = status === "pending" && b.payment_method === "transfer"
      ? `<a class="btn btn-wa" href="${wa}" target="_blank" rel="noopener">Konfirmasi transfer via WhatsApp</a>`
      : `<a class="btn btn-wa" href="https://wa.me/${CFG.waMeNumber}?text=${encodeURIComponent(`Halo admin CFDSemarang, saya mau tanya soal pesanan ${b.code}.`)}" target="_blank" rel="noopener">Hubungi admin</a>`;
    const transferNote = status === "pending" && b.payment_method === "transfer"
      ? `<p class="small muted">Transfer manual: silakan transfer sesuai nominal lalu kirim bukti ke WhatsApp admin untuk verifikasi.</p>`
      : "";
    const fallback = opts.showFallback ? renderFallbackNotice(b) : "";
    return `<div class="check-card">
      <h3>Lapak ${esc(b.spot_code)}</h3>
      <p class="muted small">${esc(fmtDate(b.event_date))}</p>
      <div class="check-status ${esc(status)}">${esc(label)}</div>
      ${fallback}
      <dl class="spot-facts">
        <div><dt>Kode booking</dt><dd>${esc(b.code)}</dd></div>
        <div><dt>Nama</dt><dd>${esc(b.name)}</dd></div>
        <div><dt>Jenis usaha</dt><dd>${esc(b.business_type)}</dd></div>
        <div><dt>WhatsApp</dt><dd>${esc(b.wa_number)}</dd></div>
        <div><dt>Harga</dt><dd>${rupiah(b.amount_idr)}</dd></div>
        <div><dt>Metode</dt><dd>${esc(method)}</dd></div>
        <div><dt>Dibuat</dt><dd>${esc(b.created_at || "—")}</dd></div>
        <div><dt>Dibayar</dt><dd>${esc(b.paid_at || "—")}</dd></div>
        <div><dt>Ref pembayaran</dt><dd>${esc(b.payment_ref || "—")}</dd></div>
      </dl>
      ${transferNote}
      <div class="check-actions">
        <a class="btn btn-primary" href="ticket.html?code=${encodeURIComponent(b.code)}&date=${encodeURIComponent(b.event_date)}">Lihat e-tiket</a>
        ${payBtn}
        ${transferBtn}
      </div>
    </div>`;
  }
  async function checkOrder(code, opts = {}) {
    const msg = $("#checkOrderMsg");
    const box = $("#checkOrderResult");
    const btn = $("#checkOrderBtn");
    msg.hidden = true; box.hidden = true; box.innerHTML = "";
    if (!code) { msg.textContent = "Masukkan kode booking."; msg.hidden = false; return; }
    btn.disabled = true; btn.textContent = "Mengecek…";
    try {
      const res = await fetch(`/api/booking?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Booking tidak ditemukan");
      box.innerHTML = renderCheckResult(data.booking, opts);
      box.hidden = false;
      localStorage.setItem("cfdsemarang.last.v1", JSON.stringify({ code: data.booking.code, date: data.booking.event_date }));
    } catch (err) {
      msg.textContent = err.message || "Gagal mengecek pesanan.";
      msg.hidden = false;
    } finally {
      btn.disabled = false; btn.textContent = "Cek pesanan";
    }
  }
  const checkForm = $("#checkOrderForm");
  if (checkForm) {
    checkForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const code = $("#checkCode").value.trim().toUpperCase();
      $("#checkCode").value = code;
      checkOrder(code);
    });
  }
  async function loadLastOrderCard() {
    const card = $("#lastOrderCard");
    if (!card) return;
    let last = null;
    try { last = JSON.parse(localStorage.getItem("cfdsemarang.last.v1") || "null"); } catch {}
    if (!last || !last.code) return;
    try {
      const res = await fetch(`/api/booking?code=${encodeURIComponent(last.code)}`);
      const data = await res.json();
      if (!data.ok) return;
      card.innerHTML = `<p class="small muted" style="margin:0 0 10px;font-weight:700;color:#8a6500">Pesanan terakhir di perangkat ini</p>` + renderCheckResult(data.booking);
      card.hidden = false;
    } catch {}
  }

  const params = new URLSearchParams(location.search);
  const prefillCode = (params.get("code") || "").trim().toUpperCase();
  const fallbackCode = (params.get("fallback") || "").trim().toUpperCase();
  if (prefillCode && $("#checkCode")) {
    $("#checkCode").value = prefillCode;
    checkOrder(prefillCode, { showFallback: fallbackCode === prefillCode });
  } else {
    try {
      const last = JSON.parse(localStorage.getItem("cfdsemarang.last.v1") || "null");
      if (last && last.code && $("#checkCode")) $("#checkCode").placeholder = `Contoh: ${last.code}`;
    } catch {}
  }
  loadLastOrderCard();

  /* ---------- toast ---------- */
  let toastTimer = null;
  function showToast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 4000);
  }

  /* ---------- wiring ---------- */
  $("#popupClose").addEventListener("click", () => { $("#spotPopup").hidden = true; });
  $("#bookClose").addEventListener("click", () => { $("#bookModal").hidden = true; });
  document.querySelectorAll(".popup-backdrop").forEach((bd) => {
    bd.addEventListener("click", (e) => { if (e.target === bd) bd.hidden = true; });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { $("#spotPopup").hidden = true; $("#bookModal").hidden = true; }
  });
  $("#chooseBtn").addEventListener("click", () => {
    if (!$("#chooseBtn").disabled) { $("#spotPopup").hidden = true; openBooking(); }
  });

  // hero video: load iframe only on click
  const hv = $(".hero-video");
  const loadVideo = () => {
    hv.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${hv.dataset.yt}?autoplay=1" title="Suasana Car Free Day Simpang Lima Semarang" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
  };
  hv.addEventListener("click", loadVideo);
  hv.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); loadVideo(); } });

  /* ---------- init ---------- */
  refreshWaFab();
  currentDate = defaultSunday();
  renderCalendar();
  renderMap();
  loadStatus(currentDate);
})();
