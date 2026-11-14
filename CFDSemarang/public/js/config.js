/* CFDSemarang — site config.
 * TODO(user): isi nomor WhatsApp admin (format internasional tanpa "+" dan tanpa spasi).
 * Contoh: 6281234567890
 */
window.CFDS = {
  // Nomor admin untuk tombol WhatsApp melayang & tombol "Tanya admin".
  waMeNumber: "6280000000000", // PLACEHOLDER — ganti dengan nomor admin asli

  // Template pesan; {spot} diganti kode lapak jika konteks ada.
  waMessage: "Halo admin CFDSemarang, saya mau tanya soal sewa lapak CFD Semarang",
  waMessageSpot: "Halo admin CFDSemarang, saya mau tanya soal lapak {spot}",

  // Harga per spot per Minggu (Rp) — placeholder, bisa diganti di panel admin (M3).
  defaultPriceIdr: 25000,

  // Booking dibuka Senin dan tutup Sabtu 18.00 WIB.
  closeDay: 6,        // 6 = Sabtu (JS getDay)
  closeHour: 18,      // 18.00 WIB

  // PIN panel admin (M1 placeholder — login nyata + sesi server di M3).
  // TODO(user): ganti PIN ini sebelum situs dipakai publik!
  adminPin: "123456",
};
