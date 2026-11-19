/* CFDSemarang — site config.
 * Format nomor WhatsApp internasional tanpa "+" dan tanpa spasi.
 */
window.CFDS = {
  // Nomor admin untuk tombol WhatsApp melayang & tombol "Tanya admin".
  waMeNumber: "6281232793825",

  // Template pesan; {spot} diganti kode lapak jika konteks ada.
  waMessage: "Halo admin CFDSemarang, saya mau tanya soal sewa lapak CFD Semarang",
  waMessageSpot: "Halo admin CFDSemarang, saya mau tanya soal lapak {spot}",

  // Harga per spot per Minggu (Rp) — placeholder, bisa diganti di panel admin (M3).
  defaultPriceIdr: 25000,

  // Booking dibuka Senin dan tutup Sabtu 18.00 WIB.
  closeDay: 6,        // 6 = Sabtu (JS getDay)
  closeHour: 18,      // 18.00 WIB

  // PIN admin TIDAK ada di file ini — disimpan sebagai Worker secret
  // (ADMIN_PIN) dan diverifikasi di server.
};
