import Link from "next/link";

export const metadata = { title: "Cara Kerja" };

export default function CaraKerja() {
  const alur = [
    ["Penjual posting tiket", "Mengisi info event, harga (maksimal harga asli), metode serah terima, dan mengunggah bukti pembelian."],
    ["Pembeli chat penjual", "Tanyakan detail tiket, kategori, atau email tujuan e-ticket lewat chat Ticketix."],
    ["Pembeli bayar QRIS", "Total bayar = harga tiket + biaya layanan. Bayar lewat e-wallet atau m-banking."],
    ["Dana tertahan", "Ticketix menahan dana. Penjual belum menerima uang di tahap ini."],
    ["Tiket diserahkan", "Penjual mengunggah surat kuasa atau meneruskan e-ticket via email, sesuai metode yang dipilih."],
    ["Pembeli konfirmasi", "Setelah memeriksa dokumen/e-ticket, pembeli menekan Konfirmasi. Ada masalah? Laporkan."],
    ["Dana cair", "Dana diteruskan ke penjual, pembeli bisa memberi ulasan."],
  ];
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-extrabold">Cara kerja Ticketix</h1>
      <ol className="space-y-3">
        {alur.map(([j, d], i) => (
          <li key={j} className="card flex gap-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 font-bold text-white">{i + 1}</span>
            <div><h2 className="font-bold">{j}</h2><p className="text-sm text-zinc-600">{d}</p></div>
          </li>
        ))}
      </ol>

      <div className="card">
        <h2 className="text-xl font-bold">Dua metode serah terima</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-zinc-200"><th className="py-2 pr-3">Metode</th><th className="py-2 pr-3">Kapan dipakai</th><th className="py-2">Yang dilakukan penjual</th></tr></thead>
            <tbody>
              <tr className="border-b border-zinc-100 align-top"><td className="py-2 pr-3 font-semibold">Surat kuasa</td><td className="py-2 pr-3">Event yang menukar e-voucher dengan wristband dan mencocokkan nama di KTP (umum di konser K-pop & internasional).</td><td className="py-2">Mengunggah surat kuasa bermaterai Rp10.000 + fotokopi KTP pemilik tiket.</td></tr>
              <tr className="align-top"><td className="py-2 pr-3 font-semibold">E-ticket via email</td><td className="py-2 pr-3">Event yang e-ticket/QR-nya bisa dipindahtangankan tanpa dokumen khusus.</td><td className="py-2">Meneruskan e-ticket ke email pembeli lalu menandai “sudah dikirim”.</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 rounded-xl bg-amber-100 p-3 text-sm text-amber-900">⚠️ Tidak semua venue menerima surat kuasa, dan sebagian promotor melarang pemindahtanganan tiket. Selalu cek aturan resmi event.</p>
      </div>
      <Link href="/katalog" className="btn-primary">Cari tiket sekarang</Link>
    </div>
  );
}
