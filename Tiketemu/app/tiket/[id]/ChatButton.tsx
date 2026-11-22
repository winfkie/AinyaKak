"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ChatButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function mulai() {
    setLoading(true);
    setErr("");
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id: listingId }),
    });
    const j = await res.json();
    setLoading(false);
    if (!res.ok) return setErr(j.error);
    router.push(`/chat/${j.id}`);
  }

  return (
    <>
      <button onClick={mulai} disabled={loading} className="btn-outline w-full">
        {loading ? "Membuka chat…" : "💬 Chat Penjual"}
      </button>
      {err && <p className="text-sm text-red-600">{err}</p>}
    </>
  );
}
