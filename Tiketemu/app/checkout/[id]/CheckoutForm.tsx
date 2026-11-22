"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { rupiah } from "@/lib/format";

export default function CheckoutForm({ listingId, total }: { listingId: string; total: number }) {
  const router = useRouter();
  const [setuju, setSetuju] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function bayar() {
    setLoading(true);
    setErr("");
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id: listingId, setuju }),
    });
    const j = await res.json();
    if (!res.ok) {
      setLoading(false);
      return setErr(j.error);
    }
    router.push(`/bayar/${j.order_id}`);
  }

  return (
    <div className="card space-y-4">
      <label className="flex cursor-pointer gap-3 text-sm">
        <input type="checkbox" checked={setuju} onChange={(e) => setSetuju(e.target.checked)} className="mt-1 h-4 w-4" />
        <span>Saya memahami cara serah terima tiket ini dan bahwa venue dapat menolak jika syaratnya tidak terpenuhi.</span>
      </label>
      {err && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      <button onClick={bayar} disabled={!setuju || loading} className="btn-primary w-full py-3">
        {loading ? "Membuat kode QRIS…" : `Bayar ${rupiah(total)} dengan QRIS`}
      </button>
      <p className="text-center text-xs text-zinc-500">Pembayaran diproses Midtrans (mode Sandbox: tidak ada uang sungguhan).</p>
    </div>
  );
}
