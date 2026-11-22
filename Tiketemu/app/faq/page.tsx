export const metadata = { title: "FAQ" };

const faq = [
  ["Apakah uang saya aman?", "Dana pembeli ditahan Ticketix dan baru diteruskan ke penjual setelah pembeli mengonfirmasi tiket diterima dengan benar. Jika ada masalah, laporkan sebelum konfirmasi."],
  ["Berapa biaya layanannya?", "Sekitar 5% dari harga tiket (diatur admin), ditambahkan ke total bayar pembeli. Penjual menerima harga tiket penuh."],
  ["Kenapa harga tidak boleh di atas harga asli?", "Ticketix dibuat untuk orang yang berhalangan hadir, bukan untuk calo. Sistem menolak harga jual di atas harga asli."],
  ["Apa itu surat kuasa?", "Jika nama di tiket berbeda dengan orang yang datang, banyak venue meminta surat kuasa bermaterai Rp10.000 dari pemilik tiket beserta fotokopi KTP-nya saat penukaran wristband."],
  ["Bagaimana jika venue menolak tiket?", "Laporkan masalah dari halaman pesanan sebelum menekan Konfirmasi. Admin meninjau dan bisa memutuskan refund ke pembeli."],
  ["Berapa lama batas bayar QRIS?", "15 menit. Jika lewat, pesanan kedaluwarsa dan tiket kembali tersedia."],
  ["Apakah ini uang sungguhan?", "Belum. Versi ini memakai Midtrans Sandbox, jadi tidak ada uang sungguhan yang berpindah. Pencairan ke penjual disimulasikan."],
];

export default function Faq() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-extrabold">Pertanyaan umum</h1>
      <div className="space-y-2">
        {faq.map(([q, a]) => (
          <details key={q} className="card group p-4">
            <summary className="cursor-pointer list-none font-semibold group-open:text-brand-700">{q}</summary>
            <p className="mt-2 text-sm text-zinc-700">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
