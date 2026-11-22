"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Pesan = { id: string; sender_id: string; isi: string; created_at: string };

export default function ChatRoom({ conversationId, userId, awal }: { conversationId: string; userId: string; awal: Pesan[] }) {
  const [pesan, setPesan] = useState<Pesan[]>(awal);
  const [teks, setTeks] = useState("");
  const [err, setErr] = useState("");
  const bawah = useRef<HTMLDivElement>(null);
  const [supabase] = useState(() => createClient());

  // Langganan pesan baru lewat Supabase Realtime (RLS tetap berlaku)
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as Pesan;
          setPesan((p) => (p.some((x) => x.id === m.id) ? p : [...p, m]));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  useEffect(() => {
    bawah.current?.scrollIntoView({ behavior: "smooth" });
  }, [pesan]);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    const isi = teks.trim();
    if (!isi) return;
    setTeks("");
    setErr("");
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: userId, isi })
      .select("id, sender_id, isi, created_at")
      .single();
    if (error) {
      setErr("Gagal mengirim: " + error.message);
      setTeks(isi);
      return;
    }
    setPesan((p) => (p.some((x) => x.id === data.id) ? p : [...p, data]));
  }

  return (
    <div className="card mt-3 flex h-[60vh] flex-col p-0">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {pesan.length === 0 && <p className="text-center text-sm text-zinc-400">Mulai percakapan. Tanyakan detail tiket ke penjual.</p>}
        {pesan.map((m) => {
          const saya = m.sender_id === userId;
          return (
            <div key={m.id} className={`flex ${saya ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${saya ? "bg-brand-600 text-white" : "bg-zinc-100 text-zinc-900"}`}>
                <p className="whitespace-pre-wrap break-words">{m.isi}</p>
                <p className={`mt-0.5 text-[10px] ${saya ? "text-white/70" : "text-zinc-400"}`}>
                  {new Date(m.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bawah} />
      </div>
      {err && <p className="px-4 text-sm text-red-600">{err}</p>}
      <form onSubmit={kirim} className="flex gap-2 border-t border-zinc-200 p-3">
        <input value={teks} onChange={(e) => setTeks(e.target.value)} maxLength={2000} placeholder="Tulis pesan…" className="input" />
        <button className="btn-primary">Kirim</button>
      </form>
    </div>
  );
}
