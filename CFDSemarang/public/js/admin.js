/* CFDSemarang — panel admin (M2).
 * Data diambil dari API Worker + D1. PIN diverifikasi di server (header
 * x-admin-pin) dan disimpan hanya di sessionStorage perangkat ini.
 * Status pembayaran bisa diubah manual lewat aksi admin (server-side).
 */
(function () {
  "use strict";

  const CFG = window.CFDS;
  const PIN_KEY = "cfdsemarang.admin-pin";
  const $ = (s) => document.querySelector(s);

  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso + "T00:00:00");
    const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][d.getDay()];
    const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${hari}, ${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
  };
  const rupiah = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");
  const fmtTime = (iso) => {
    if (!iso) return "—";
    // created_at dari SQLite: "YYYY-MM-DD HH:MM:SS" (UTC)
    const d = new Date(String(iso).replace(" ", "T") + (String(iso).endsWith("Z") ? "" : "Z"));
    if (isNaN(d)) return "—";
    return d.toLocaleString("id-ID", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };
  // 0812… → 62812… untuk tautan wa.me
  const waLink = (num) => {
    let n = (num || "").replace(/[^0-9]/g, "");
    if (n.startsWith("0")) n = "62" + n.slice(1);
    return `https://wa.me/${n}`;
  };

  let pin = sessionStorage.getItem(PIN_KEY) || "";
  let rows = []; // { date, spot, b: {...} }

  async function api(path, opts = {}) {
    const r = await fetch(path, {
      ...opts,
      headers: { accept: "application/json", "x-admin-pin": pin, ...(opts.headers || {}) },
    });
    const data = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data };
  }

  async function fetchRows() {
    const { ok, status, data } = await api("/api/admin/bookings");
    if (!ok) {
      const err = new Error(data.error || `HTTP ${status}`);
      err.status = status;
      throw err;
    }
    rows = (data.bookings || []).map((b) => ({
      date: b.event_date,
      spot: b.spot_code,
      b: {
        code: b.code,
        name: b.name,
        type: b.business_type,
        wa: b.wa_number,
        status: b.status,
        method: b.payment_method || "qris",
        amount: b.amount_idr,
        createdAt: b.created_at,
        paidAt: b.paid_at,
        snap: b.snap_url,
      },
    }));
    rows.sort((a, z) => String(z.b.createdAt || "").localeCompare(String(a.b.createdAt || "")));
  }

  /* ---------- PIN gate (server-verified) ---------- */
  function showGate(message) {
    $("#adminGate").hidden = false;
    $("#adminPage").hidden = true;
    const err = $("#gateError");
    if (message) { err.textContent = message; err.hidden = false; }
  }

  async function tryLogin(candidate) {
    const previous = pin;
    pin = candidate;
    try {
      await fetchRows();
      sessionStorage.setItem(PIN_KEY, pin);
      openPanel();
      return true;
    } catch (e) {
      pin = previous;
      showGate(e.status === 401 ? "PIN salah. Coba lagi." : "Gagal memuat data: " + e.message);
      return false;
    }
  }

  function gate() {
    $("#gateForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = $("#gatePin");
      const btn = e.target.querySelector("button[type=submit]");
      btn.disabled = true;
      $("#gateError").hidden = true;
      const ok = await tryLogin(input.value.trim());
      btn.disabled = false;
      if (!ok) { input.value = ""; input.focus(); }
    });
    if (pin) {
      tryLogin(pin).then((ok) => { if (!ok) $("#gatePin").focus(); });
    } else {
      showGate();
      $("#gatePin").focus();
    }
  }

  function openPanel() {
    $("#adminGate").hidden = true;
    $("#adminPage").hidden = false;
    $("#priceNote").textContent = rupiah(CFG.defaultPriceIdr) + " / spot / minggu";
    bindFilters();
    render();
  }

  /* ---------- filter ---------- */
  const state = { date: "", type: "", status: "", q: "" };
  let filtersBound = false;

  function bindFilters() {
    if (filtersBound) return;
    filtersBound = true;
    $("#fDate").addEventListener("change", (e) => { state.date = e.target.value; render(); });
    $("#fType").addEventListener("change", (e) => { state.type = e.target.value; render(); });
    $("#fStatus").addEventListener("change", (e) => { state.status = e.target.value; render(); });
    $("#fSearch").addEventListener("input", (e) => { state.q = e.target.value.toLowerCase(); render(); });
    $("#csvBtn").addEventListener("click", exportCsv);
    $("#bookRows").addEventListener("click", onRowAction);
  }

  function rebuildFilterOptions() {
    const dates = [...new Set(rows.map((r) => r.date))].sort().reverse();
    const fDate = $("#fDate");
    fDate.innerHTML = `<option value="">Semua Minggu</option>` +
      dates.map((d) => `<option value="${d}">${fmtDate(d)}</option>`).join("");
    fDate.value = state.date;

    const types = [...new Set(rows.map((r) => r.b.type).filter(Boolean))].sort();
    const fType = $("#fType");
    fType.innerHTML = `<option value="">Semua jenis</option>` +
      types.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
    fType.value = state.type;
  }

  function filtered() {
    return rows.filter(({ date, spot, b }) => {
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
    rebuildFilterOptions();
    const list = filtered();
    const paid = list.filter((r) => r.b.status === "paid");
    const pend = list.filter((r) => r.b.status === "pending").length;
    const omzet = paid.reduce((sum, r) => sum + Number(r.b.amount || 0), 0);

    $("#statCards").innerHTML = `
      <div class="stat-card"><span class="stat-n">${list.length}</span><span class="stat-l">Total pemesanan</span></div>
      <div class="stat-card stat-green"><span class="stat-n">${paid.length}</span><span class="stat-l">Lunas</span></div>
      <div class="stat-card stat-red"><span class="stat-n">${pend}</span><span class="stat-l">Menunggu bayar</span></div>
      <div class="stat-card"><span class="stat-n">${rupiah(omzet)}</span><span class="stat-l">Dana masuk</span></div>`;

    const perType = {};
    list.forEach(({ b }) => { perType[b.type] = (perType[b.type] || 0) + 1; });
    $("#typeBreakdown").innerHTML = Object.keys(perType).sort().map((t) =>
      `<span class="type-chip">${escapeHtml(t)} <b>${perType[t]}</b></span>`).join("") ||
      `<span class="type-chip muted">—</span>`;

    const tb = $("#bookRows");
    if (!list.length) {
      tb.innerHTML = "";
      $("#emptyNote").hidden = false;
      return;
    }
    $("#emptyNote").hidden = true;
    tb.innerHTML = list.map(({ date, spot, b }) => `
      <tr>
        <td>${fmtDate(date)}</td>
        <td><code>${escapeHtml(b.code)}</code></td>
        <td><strong>${escapeHtml(spot)}</strong></td>
        <td>${escapeHtml(b.name)}</td>
        <td>${escapeHtml(b.type)}</td>
        <td><a href="${waLink(b.wa)}" target="_blank" rel="noopener">${escapeHtml(b.wa)}</a></td>
        <td>${rupiah(b.amount)}</td>
        <td><span class="small">${b.method === "transfer" ? "Transfer" : "QRIS"}</span></td>
        <td>${badge(b.status)}</td>
        <td class="muted">${fmtTime(b.createdAt)}</td>
        <td class="row-actions">
          ${b.status === "paid"
            ? `<button class="btn btn-ghost btn-xs" data-code="${escapeHtml(b.code)}" data-act="pending">Batal lunas</button>`
            : `<button class="btn btn-primary btn-xs" data-code="${escapeHtml(b.code)}" data-act="paid">Tandai lunas</button>`}
          ${b.status !== "cancelled"
            ? `<button class="btn btn-ghost btn-xs" data-code="${escapeHtml(b.code)}" data-act="cancelled">Batalkan</button>`
            : ""}
        </td>
      </tr>`).join("");
  }

  async function onRowAction(e) {
    const btn = e.target.closest("button[data-code]");
    if (!btn) return;
    const code = btn.dataset.code;
    const act = btn.dataset.act;
    const label = act === "paid" ? "menandai booking ini LUNAS" : act === "pending" ? "mengembalikan ke menunggu bayar" : "membatalkan booking ini";
    if (!confirm(`Yakin ${label}?\n${code}`)) return;
    btn.disabled = true;
    const { ok, data } = await api("/api/admin/update", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, status: act }),
    });
    if (!ok) {
      showToast(data.error || "Gagal memperbarui status.");
      btn.disabled = false;
      return;
    }
    await refresh();
    showToast("Status diperbarui: " + code);
  }

  async function refresh() {
    try {
      await fetchRows();
      render();
    } catch (e) {
      showToast("Gagal memuat data: " + e.message);
    }
  }

  const STATUS_LABEL = {
    paid: "LUNAS",
    pending: "MENUNGGU",
    cancelled: "BATAL",
    expired: "KEDALUWARSA",
  };

  function badge(status) {
    const cls = status === "paid" ? "badge-paid" : status === "pending" ? "badge-pending" : "badge-cancel";
    return `<span class="badge ${cls}">${STATUS_LABEL[status] || status}</span>`;
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- CSV ---------- */
  function exportCsv() {
    const list = filtered();
    if (!list.length) { showToast("Tidak ada data untuk diunduh."); return; }
    const head = ["Minggu", "Kode", "Lapak", "Nama", "Jenis usaha", "WhatsApp", "Biaya", "Metode", "Status bayar", "Dipesan"];
    const lines = [head.join(";")].concat(list.map(({ date, spot, b }) =>
      [fmtDate(date), b.code, spot, b.name, b.type, b.wa, b.amount, b.method === "transfer" ? "Transfer manual" : "QRIS",
       STATUS_LABEL[b.status] || b.status, fmtTime(b.createdAt)]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")));
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cfds-sewa-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast(`CSV diunduh (${list.length} baris).`);
  }

  let toastTimer = null;
  function showToast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 3500);
  }

  gate();
})();
