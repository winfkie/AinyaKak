"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ReviewForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [komentar, setKomentar] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId, rating, komentar }),
    });
    const j = await res.json();
    setLoading(false);
    if (!res.ok) return setErr(j.error);
    router.refresh();
  }

  return (
    <form onSubmit={kirim} className="card space-y-3">
      <h2 className="font-bold">Beri ulasan untuk penjual</h2>
      <div className="flex gap-1 text-3xl">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setRating(n)} className={n <= rating ? "text-amber-400" : "text-zinc-300"} aria-label={`${n} bintang`}>
            ★
          </button>
        ))}
      </div>
      <textarea value={komentar} onChange={(e) => setKomentar(e.target.value)} maxLength={500} rows={3} className="input" placeholder="Ceritakan pengalamanmu (opsional)" />
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button disabled={loading} className="btn-primary">Kirim ulasan</button>
    </form>
  );
}
