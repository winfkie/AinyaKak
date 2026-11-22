"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { orderId: string; status: string; peran: "pembeli" | "penjual" | "admin"; metode: "surat_kuasa" | "kirim_email" };

export default function OrderActions({ orderId, status, peran, metode }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [lapor, setLapor] = useState(false);

  async function kirim(aksi: string, form?: HTMLFormElement, tanya?: string) {
    if (tanya && !confirm(tanya)) return;
    const f = form ? new FormData(form) : new FormData();
    f.set("aksi", aksi);
    setLoading(true);
    setErr("");
    const res = await fetch(`/api/orders/${orderId}/aksi`, { method: "POST", body: f });
    const j = await res.json();
    setLoading(false);
    if (!res.ok) return setErr(j.error);
    setLapor(false);
    router.refresh();
  }

  const bisaLapor = ["dibayar_tertahan", "surat_kuasa_diunggah", "tiket_dikirim"].includes(status);
  const fileInput = "block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-semibold file:text-brand-700";

  let isi: React.ReactNode = null;

  if (peran === "admin") {
    return (
      <div className="card text-sm text-zinc-700">
        Kamu melihat pesanan ini sebagai <b>admin</b>. Keputusan sengketa dibuat dari <Link href="/admin" className="font-semibold text-brand-600">panel admin</Link>.
      </div>
    );
  }

  if (status === "menunggu_bayar") {
    isi = peran === "pembeli" ? (
      <div className="flex flex-wrap gap-2">
        <Link href={`/bayar/${orderId}`} className="btn-primary">Lanjutkan pembayaran QRIS</Link>
        <button onClick={() => kirim("batalkan", undefined, "Batalkan pesanan ini?")} disabled={loading} className="btn-danger">Batalkan</button>
      </div>
    ) : (
      <p className="text-sm text-zinc-600">Menunggu pembeli membayar. Jangan serahkan tiket sebelum status menjadi “Dibayar”.</p>
    );
  } else if (status === "dibayar_tertahan" || (status === "surat_kuasa_diunggah" && peran === "penjual")) {
    if (peran === "penjual") {
      isi =
        metode === "surat_kuasa" ? (
          <form onSubmit={(e) => { e.preventDefault(); kirim("unggah_surat_kuasa", e.currentTarget); }} className="space-y-3">
            <p className="text-sm text-zinc-700">
              {status === "surat_kuasa_diunggah" ? "Surat kuasa sudah diunggah. Kamu bisa mengunggah versi baru jika perlu." : "Pembeli sudah membayar dan dana tertahan. Unggah surat kuasa bermaterai Rp10.000 yang kamu tanda tangani, beserta fotokopi KTP (gabungkan jadi satu PDF/gambar)."}
            </p>
            <input type="file" name="file" required accept="image/jpeg,image/png,image/webp,application/pdf" className={fileInput} />
            <input name="catatan" placeholder="Catatan untuk pembeli (opsional)" className="input" />
            <button disabled={loading} className="btn-primary">{loading ? "Mengunggah…" : "Unggah surat kuasa"}</button>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); kirim("tandai_terkirim", e.currentTarget, "Pastikan e-ticket sudah kamu teruskan ke email pembeli. Lanjutkan?"); }} className="space-y-3">
            <p className="text-sm text-zinc-700">Pembeli sudah membayar. Teruskan e-ticket ke email pembeli (tanyakan lewat chat), lalu tandai di sini. Bukti kirim (screenshot email terkirim) opsional.</p>
            <input type="file" name="file" accept="image/jpeg,image/png,image/webp,application/pdf" className={fileInput} />
            <button disabled={loading} className="btn-primary">{loading ? "Menyimpan…" : "Saya sudah kirim e-ticket"}</button>
          </form>
        );
    } else {
      isi = (
        <p className="text-sm text-zinc-700">
          Pembayaran diterima dan dana ditahan Ticketix. Menunggu penjual {metode === "surat_kuasa" ? "mengunggah surat kuasa" : "mengirim e-ticket ke email kamu"}. Hubungi penjual lewat chat jika perlu.
        </p>
      );
    }
  } else if ((status === "surat_kuasa_diunggah" || status === "tiket_dikirim") && peran === "pembeli") {
    isi = (
      <div className="space-y-3">
        <p className="text-sm text-zinc-700">
          {metode === "surat_kuasa"
            ? "Penjual sudah mengunggah surat kuasa. Periksa dokumennya di bawah (nama, tanda tangan, materai, fotokopi KTP)."
            : "Penjual menandai e-ticket sudah dikirim. Periksa email kamu: nama event, kategori, dan QR harus sesuai."}{" "}
          Tekan <b>Konfirmasi</b> hanya jika semuanya benar. Setelah konfirmasi, dana diteruskan ke penjual.
        </p>
        <button onClick={() => kirim("konfirmasi", undefined, "Konfirmasi tiket sudah diterima dengan benar? Dana akan dicairkan ke penjual dan tidak bisa dibatalkan.")} disabled={loading} className="btn-primary">
          ✅ Konfirmasi {metode === "surat_kuasa" ? "surat kuasa diterima" : "e-ticket diterima"}
        </button>
      </div>
    );
  } else if (status === "tiket_dikirim" && peran === "penjual") {
    isi = <p className="text-sm text-zinc-700">Menunggu pembeli memeriksa e-ticket dan mengonfirmasi.</p>;
  } else if (status === "dicairkan") {
    isi = <p className="text-sm text-green-700">Transaksi selesai. Dana {peran === "penjual" ? "sudah dicairkan ke saldo kamu (simulasi)" : "sudah diteruskan ke penjual"}.</p>;
  } else if (status === "sengketa") {
    isi = <p className="text-sm text-red-700">Pesanan sedang ditinjau admin. Dana tetap tertahan sampai ada keputusan.</p>;
  } else if (status === "kedaluwarsa" || status === "dibatalkan") {
    isi = <p className="text-sm text-zinc-600">Pesanan {status === "kedaluwarsa" ? "kedaluwarsa karena tidak dibayar" : "dibatalkan"}. Tiket kembali tersedia di katalog.</p>;
  } else if (status === "refund") {
    isi = <p className="text-sm text-zinc-600">Dana dikembalikan ke pembeli (simulasi).</p>;
  }

  return (
    <div className="card space-y-3">
      <h2 className="font-bold">Langkah berikutnya</h2>
      {isi}
      {err && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}

      {bisaLapor && (
        <div className="border-t border-zinc-200 pt-3">
          {!lapor ? (
            <button onClick={() => setLapor(true)} className="text-sm font-semibold text-red-600 hover:underline">🚩 Laporkan masalah</button>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); kirim("laporkan", e.currentTarget, "Kirim laporan? Pesanan akan ditinjau admin dan dana tetap tertahan."); }} className="space-y-2">
              <textarea name="alasan" required minLength={10} rows={3} className="input" placeholder="Jelaskan masalahnya (mis. surat kuasa tidak sesuai, e-ticket tidak diterima, ditolak venue)" />
              <input type="file" name="file" accept="image/jpeg,image/png,image/webp,application/pdf" className={fileInput} />
              <div className="flex gap-2">
                <button disabled={loading} className="btn-danger">Kirim laporan</button>
                <button type="button" onClick={() => setLapor(false)} className="btn-outline">Batal</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
