import Link from "next/link";
import { wajibLogin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { waktu } from "@/lib/format";

export const metadata = { title: "Chat" };

type Conv = {
  id: string;
  buyer_id: string;
  created_at: string;
  listings: { events: { nama_event: string } } | null;
  buyer: { nama: string } | null;
  seller: { nama: string } | null;
  messages: { isi: string; created_at: string }[];
};

export default async function DaftarChat() {
  const { user } = await wajibLogin("/chat");
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select(
      "id, buyer_id, created_at, listings(events(nama_event)), buyer:profiles!conversations_buyer_id_fkey(nama), seller:profiles!conversations_seller_id_fkey(nama), messages(isi, created_at)"
    )
    .order("created_at", { referencedTable: "messages", ascending: false })
    .limit(1, { referencedTable: "messages" });

  const convs = ((data ?? []) as unknown as Conv[]).sort((a, b) => {
    const ta = a.messages[0]?.created_at ?? a.created_at;
    const tb = b.messages[0]?.created_at ?? b.created_at;
    return tb.localeCompare(ta);
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-3xl font-extrabold">Chat</h1>
      {convs.length === 0 ? (
        <div className="card text-center text-zinc-500">Belum ada percakapan. Buka detail tiket lalu tekan “Chat Penjual”.</div>
      ) : (
        <ul className="space-y-2">
          {convs.map((c) => {
            const lawan = c.buyer_id === user.id ? c.seller?.nama : c.buyer?.nama;
            const peran = c.buyer_id === user.id ? "Penjual" : "Pembeli";
            const last = c.messages[0];
            return (
              <li key={c.id}>
                <Link href={`/chat/${c.id}`} className="card flex items-start justify-between gap-3 p-4 hover:border-brand-500">
                  <div className="min-w-0">
                    <p className="font-semibold">{lawan} <span className="text-xs font-normal text-zinc-500">({peran})</span></p>
                    <p className="truncate text-xs text-brand-700">{c.listings?.events.nama_event}</p>
                    <p className="truncate text-sm text-zinc-600">{last?.isi ?? "Belum ada pesan"}</p>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-400">{waktu(last?.created_at ?? c.created_at)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
