export const metadata = { title: "Syarat & Ketentuan" };

export default function Syarat() {
  return (
    <article className="card mx-auto max-w-3xl space-y-4 text-sm leading-relaxed text-zinc-700">
      <h1 className="text-3xl font-extrabold text-zinc-900">Syarat & Ketentuan</h1>
      <p className="rounded-xl bg-amber-50 p-3 text-amber-900">Dokumen ini dibuat untuk keperluan tugas/prototipe dan belum ditinjau ahli hukum.</p>

      <h2 className="text-lg font-bold text-zinc-900">1. Peran Ticketix</h2>
      <p>Ticketix adalah perantara antara penjual dan pembeli tiket. Ticketix bukan penyelenggara event dan tidak menerbitkan tiket.</p>

      <h2 className="text-lg font-bold text-zinc-900">2. Harga dan biaya</h2>
      <p>Harga jual tidak boleh melebihi harga asli tiket. Pembeli membayar harga tiket ditambah biaya layanan yang ditampilkan di checkout.</p>

      <h2 className="text-lg font-bold text-zinc-900">3. Dana tertahan</h2>
      <p>Pembayaran pembeli ditahan dan baru diteruskan ke penjual setelah pembeli mengonfirmasi penerimaan tiket, atau setelah keputusan admin dalam sengketa. Pada versi ini pembayaran memakai Midtrans Sandbox dan pencairan disimulasikan.</p>

      <h2 className="text-lg font-bold text-zinc-900">4. Surat kuasa dan e-ticket</h2>
      <p>Penjual wajib memilih metode serah terima yang sesuai aturan event. Untuk metode surat kuasa, penjual menyerahkan surat kuasa bermaterai Rp10.000 yang ditandatangani pemilik tiket dan fotokopi identitasnya. Untuk e-ticket, penjual meneruskan e-ticket asli dan tidak boleh mengirimkan tiket yang sama ke orang lain.</p>
      <p>Tidak semua venue menerima surat kuasa, dan sebagian penyelenggara melarang pemindahtanganan tiket. Pembeli wajib memeriksa aturan event sebelum membeli.</p>

      <h2 className="text-lg font-bold text-zinc-900">5. Sengketa dan refund</h2>
      <p>Masalah wajib dilaporkan sebelum pembeli menekan Konfirmasi. Admin meninjau bukti dari kedua pihak dan memutuskan refund ke pembeli atau pencairan ke penjual. Setelah konfirmasi, dana dianggap final.</p>

      <h2 className="text-lg font-bold text-zinc-900">6. Batas tanggung jawab</h2>
      <p>Ticketix tidak bertanggung jawab atas pembatalan event, perubahan jadwal, atau penolakan oleh venue yang berada di luar kendali Ticketix, kecuali ditetapkan lain dalam keputusan sengketa.</p>

      <h2 className="text-lg font-bold text-zinc-900">7. Data pribadi</h2>
      <p>Bukti pembelian, KTP, dan surat kuasa disimpan di penyimpanan privat dan hanya dapat diakses pihak dalam transaksi serta admin, lewat tautan sementara.</p>

      <h2 className="text-lg font-bold text-zinc-900">8. Larangan</h2>
      <p>Dilarang menjual tiket palsu, menjual tiket yang sama ke lebih dari satu pembeli, meminta transfer di luar platform, atau menyalahgunakan dokumen identitas orang lain.</p>
    </article>
  );
}
