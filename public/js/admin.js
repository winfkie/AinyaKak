/* CFDSemarang — panel admin M1.
 * Membaca store mock (localStorage) dan menampilkan pemesanan dengan filter
 * per field form (Minggu, jenis usaha, status bayar) + pencarian bebas.
 * M2: sumber data diganti fetch API Worker + D1; struktur tabel tetap.
 */
(function () {
  "use strict";

  const CFG = window.CFDS;
  const STORE_KEY = "cfdsemarang.bookings.v1";
  const GATE_KEY = "cfdsemarang.admin-session";
  const $ = (s) => document.querySelector(s);

  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso + "T00:00:00");
    const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][d.getDay()];
    const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${hari}, ${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
  };
  const rupiah = (n) => "Rp" + n.toLocaleString("id-ID");
  const fmtTime = (iso) => {
    const d = new Date(iso);
    const p = (x) => String(x).padStart(2, "0");
    if (isNaN(d)) return "—";
    return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}.${p(d.getMinutes())}`;
  };
  // 0812… → 62812… untuk tautan wa.me
  const waLink = (num) => {
    let n = (num || "").replace(/[^0-9]/g, "");
    if (n.startsWith("0")) n = "62" + n.slice(1);
    return `https://wa.me/${n}`;
  };

  function loadStore() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch { return {}; }
  }

  /* ---------- flatten: {date, spot, booking}[] ---------- */
  function allRows() {
    const store = loadStore();
    const rows = [];
    Object.keys(store).sort().forEach((date) => {
      const day = store[date] || {};
      Object.keys(day).forEach((spot) => {
        rows.push({ date, spot, b: day[spot] });
      });
    });
    // terbaru dulu, lalu per tanggal & nomor lapak
    rows.sort((a, z) => (z.b.createdAt || "").localeCompare(a.b.createdAt || ""));
    return rows;
  }

  /* ---------- PIN gate (M1) ---------- */
  function gate() {
    if (!CFG.adminPin) { openPanel(); return; }
    if (sessionStorage.getItem(GATE_KEY) === "ok") { openPanel(); return; }
    $("#adminGate").hidden = false;
    $("#gateForm").addEventListener("submit", (e) => {
      e.preventDefault();
      if ($("#gatePin").value === CFG.adminPin) {
        sessionStorage.setItem(GATE_KEY, "ok");
        openPanel();
      } else {
        $("#gateError").hidden = false;
        $("#gatePin").value = "";
        $("#gatePin").focus();
      }
    });
    $("#gatePin").focus();
  }

  function openPanel() {
    $("#adminGate").hidden = true;
    $("#adminPage").hidden = false;
    $("#priceNote").textContent = rupiah(CFG.defaultPriceIdr) + " / spot / minggu";
    buildFilters();
    render();
  }

  /* ---------- filter ---------- */
  const state = { date: "", type: "", status: "", q: "" };

  function buildFilters() {
    const rows = allRows();
    // Minggu yang ada datanya (terbaru dulu)
    const dates = [...new Set(rows.map((r) => r.date))].sort().reverse();
    const fDate = $("#fDate");
    fDate.innerHTML = `<option value="">Semua Minggu</option>` +
      dates.map((d) => `<option value="${d}">${fmtDate(d)}</option>`).join("");
    // jenis usaha yang muncul di data
    const types = [...new Set(rows.map((r) => r.b.type).filter(Boolean))].sort();
    $("#fType").innerHTML = `<option value="">Semua jenis</option>` +
      types.map((t) => `<option value="${t}">${t}</option>`).join("");

    fDate.addEventListener("change", () => { state.date = fDate.value; render(); });
    $("#fType").addEventListener("change", (e) => { state.type = e.target.value; render(); });
    $("#fStatus").addEventListener("change", (e) => { state.status = e.target.value; render(); });
    $("#fSearch").addEventListener("input", (e) => { state.q = e.target.value.toLowerCase(); render(); });
    $("#csvBtn").addEventListener("click", exportCsv);
  }

  function filtered() {
    return allRows().filter(({ date, spot, b }) => {
      if (state.date && date !== state.date) return false;
      if (state.type && b.type !== state.type) return false;
      if (state.status && b.status !== state.status) return false;
      if (state.q) {
        const hay = `${b.name} ${b.code} ${spot} ${b.wa} ${b.type}`.toLowerCase();
        if (!hay.includes(state.q)) return false;
      }
      return true;
    });
  }

  /* ---------- render ---------- */
  function render() {
    const rows = filtered();
    const paid = rows.filter((r) => r.b.status === "paid").length;
    const pend = rows.length - paid;
    const omzet = paid * CFG.defaultPriceIdr;

    $("#statCards").innerHTML = `
      <div class="stat-card"><span class="stat-n">${rows.length}</span><span class="stat-l">Total pemesanan</span></div>
      <div class="stat-card stat-green"><span class="stat-n">${paid}</span><span class="stat-l">Lunas</span></div>
      <div class="stat-card stat-red"><span class="stat-n">${pend}</span><span class="stat-l">Menunggu bayar</span></div>
      <div class="stat-card"><span class="stat-n">${rupiah(omzet)}</span><span class="stat-l">Dana masuk</span></div>`;

    // kategori per jenis usaha (dari data terfilter)
    const perType = {};
    rows.forEach(({ b }) => { perType[b.type] = (perType[b.type] || 0) + 1; });
    $("#typeBreakdown").innerHTML = Object.keys(perType).sort().map((t) =>
      `<span class="type-chip">${t} <b>${perType[t]}</b></span>`).join("") ||
      `<span class="type-chip muted">—</span>`;

    const tb = $("#bookRows");
    if (!rows.length) {
      tb.innerHTML = "";
      $("#emptyNote").hidden = false;
      return;
    }
    $("#emptyNote").hidden = true;
    tb.innerHTML = rows.map(({ date, spot, b }) => `
      <tr>
        <td>${fmtDate(date)}</td>
        <td><code>${b.code}</code></td>
        <td><strong>${spot}</strong></td>
        <td>${escapeHtml(b.name)}</td>
        <td>${escapeHtml(b.type)}</td>
        <td><a href="${waLink(b.wa)}" target="_blank" rel="noopener">${escapeHtml(b.wa)}</a></td>
        <td>${badge(b.status)}</td>
        <td class="muted">${fmtTime(b.createdAt)}</td>
      </tr>`).join("");
  }

  function badge(status) {
    return status === "paid"
      ? `<span class="badge badge-paid">LUNAS</span>`
      : `<span class="badge badge-pending">MENUNGGU</span>`;
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- CSV ---------- */
  function exportCsv() {
    const rows = filtered();
    if (!rows.length) { showToast("Tidak ada data untuk diunduh."); return; }
    const head = ["Minggu", "Kode", "Lapak", "Nama", "Jenis usaha", "WhatsApp", "Status bayar", "Dipesan"];
    const lines = [head.join(";")].concat(rows.map(({ date, spot, b }) =>
      [fmtDate(date), b.code, spot, b.name, b.type, b.wa,
       b.status === "paid" ? "LUNAS" : "MENUNGGU", fmtTime(b.createdAt)]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")));
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cfds-sewa-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast(`CSV diunduh (${rows.length} baris).`);
  }

  let toastTimer = null;
  function showToast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 3000);
  }

  gate();
})();
