import Link from "next/link";
import { notFound } from "next/navigation";
import { wajibLogin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupiah } from "@/lib/format";
import ChatRoom from "./ChatRoom";

type Conv = {
  id: string;
  listing_id: string;
  buyer_id: string;
  listings: { harga_jual: number; status: string; events: { nama_event: string } } | null;
  buyer: { nama: string } | null;
  seller: { nama: string } | null;
};

export default async function RuangChat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await wajibLogin(`/chat/${id}`);
  const supabase = await createClient();

  // RLS: hanya peserta percakapan yang mendapat datanya
  const { data } = await supabase
    .from("conversations")
    .select(
      "id, listing_id, buyer_id, listings(harga_jual, status, events(nama_event)), buyer:profiles!conversations_buyer_id_fkey(nama), seller:profiles!conversations_seller_id_fkey(nama)"
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const c = data as unknown as Conv;

  const { data: pesan } = await supabase
    .from("messages")
    .select("id, sender_id, isi, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .limit(200);

  const isBuyer = c.buyer_id === user.id;
  const lawan = isBuyer ? c.seller?.nama : c.buyer?.nama;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/chat" className="text-sm text-zinc-500 hover:underline">← Semua chat</Link>
      <div className="card mt-2 flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="font-bold">{lawan}</p>
          <Link href={`/tiket/${c.listing_id}`} className="text-sm text-brand-700 hover:underline">
            {c.listings?.events.nama_event} · {rupiah(c.listings?.harga_jual)}
          </Link>
        </div>
        {isBuyer && c.listings?.status === "aktif" && (
          <Link href={`/checkout/${c.listing_id}`} className="btn-primary py-2">Beli tiket ini</Link>
        )}
      </div>
      <ChatRoom conversationId={id} userId={user.id} awal={pesan ?? []} />
      <p className="mt-2 text-center text-xs text-zinc-400">
        Jangan transfer di luar Ticketix. Pembayaran di luar platform tidak dilindungi dana tertahan.
      </p>
    </div>
  );
}
