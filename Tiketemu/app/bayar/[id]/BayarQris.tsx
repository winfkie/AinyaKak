"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function BayarQris({ orderId, qrUrl, expiredAt }: { orderId: string; qrUrl: string | null; expiredAt: string | null }) {
  const router = useRouter();
  const [sisa, setSisa] = useState<number | null>(null);
  const [status, setStatus] = useState("menunggu_bayar");
  const [batal, setBatal] = useState(false);

  // Hitung mundur batas waktu bayar
  useEffect(() => {
    if (!expiredAt) return;
    const t = setInterval(() => setSisa(Math.max(0, Math.floor((Date.parse(expiredAt) - Date.now()) / 1000))), 1000);
    return () => clearInterval(t);
  }, [expiredAt]);

  // Cek status ke server tiap 4 detik. Server yang bertanya ke Midtrans, bukan browser.
  useEffect(() => {
    let aktif = true;
    const cek = async () => {
      const res = await fetch(`/api/orders/${orderId}/cek-status`, { method: "POST" }).catch(() => null);
      const j = await res?.json().catch(() => null);
      if (!aktif || !j?.status) return;
      setStatus(j.status);
      if (j.status !== "menunggu_bayar") {
        router.push(`/pesanan/${orderId}`);
        router.refresh();
      }
    };
    cek();
    const t = setInterval(cek, 4000);
    return () => {
      aktif = false;
      clearInterval(t);
    };
  }, [orderId, router]);

  async function batalkan() {
    if (!confirm("Batalkan pesanan ini?")) return;
    setBatal(true);
    const f = new FormData();
    f.set("aksi", "batalkan");
    await fetch(`/api/orders/${orderId}/aksi`, { method: "POST", body: f });
    router.push(`/pesanan/${orderId}`);
    router.refresh();
  }

  const mm = sisa !== null ? String(Math.floor(sisa / 60)).padStart(2, "0") : "--";
  const ss = sisa !== null ? String(sisa % 60).padStart(2, "0") : "--";

  return (
    <div className="mt-4 space-y-3">
      {qrUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrUrl} alt="Kode QRIS" className="mx-auto h-64 w-64 rounded-xl border border-zinc-200 bg-white p-2" />
      ) : (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">Kode QR tidak tersedia. Batalkan lalu coba checkout ulang.</p>
      )}
      <p className="text-sm text-zinc-600">
        Scan dengan e-wallet atau m-banking. Sisa waktu: <b className="font-mono">{mm}:{ss}</b>
      </p>
      <p className="flex items-center justify-center gap-2 text-sm text-zinc-500">
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
        {status === "menunggu_bayar" ? "Menunggu pembayaran…" : "Pembayaran diproses…"}
      </p>
      <button onClick={batalkan} disabled={batal} className="btn-danger w-full">Batalkan pesanan</button>
    </div>
  );
}
