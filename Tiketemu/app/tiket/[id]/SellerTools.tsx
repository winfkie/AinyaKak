"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SellerTools({ listingId, status }: { listingId: string; status: string }) {
  const router = useRouter();
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function lihatBukti() {
    const res = await fetch(`/api/listings/${listingId}/bukti`);
    const j = await res.json();
    if (!res.ok) return setErr(j.error);
    window.open(j.url, "_blank");
  }

  async function batalkan() {
    if (!confirm("Tarik tiket ini dari katalog?")) return;
    setLoading(true);
    const res = await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
    const j = await res.json();
    setLoading(false);
    if (!res.ok) return setErr(j.error);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <p className="rounded-xl bg-brand-50 p-3 text-sm text-brand-700">Ini tiket milikmu.</p>
      <button onClick={lihatBukti} className="btn-outline w-full">Lihat bukti pembelian</button>
      {status === "aktif" && (
        <button onClick={batalkan} disabled={loading} className="btn-danger w-full">Tarik dari katalog</button>
      )}
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}
