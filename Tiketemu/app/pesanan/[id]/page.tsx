import Link from "next/link";
import { notFound } from "next/navigation";
import { wajibLogin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { METODE_SERAH, rupiah, tanggal, waktu } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import OrderActions from "./OrderActions";
import Dokumen from "./Dokumen";
import ReviewForm from "./ReviewForm";

type Order = {
  id: string;
  status: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  harga_tiket: number;
  biaya_layanan: number;
  total_bayar: number;
  dana_untuk_seller: number;
  created_at: string;
  dibayar_pada: string | null;
  dikirim_pada: string | null;
  dicairkan_pada: string | null;
  listings: { metode_serah: "surat_kuasa" | "kirim_email"; kategori_tiket: string | null; events: { nama_event: string; tanggal: string; venue: string | null; kota: string | null } };
  buyer: { nama: string } | null;
  seller: { nama: string } | null;
};

export default async function DetailPesanan({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, profile } = await wajibLogin(`/pesanan/${id}`);
  // Pembeli/penjual membaca lewat RLS; admin boleh meninjau semua pesanan lewat service role
  const supabase = profile?.is_admin ? createAdminClient() : await createClient();

  const { data } = await supabase
    .from("orders")
    .select(
      "id, status, buyer_id, seller_id, listing_id, harga_tiket, biaya_layanan, total_bayar, dana_untuk_seller, created_at, dibayar_pada, dikirim_pada, dicairkan_pada, " +
        "listings(metode_serah, kategori_tiket, events(nama_event, tanggal, venue, kota)), buyer:profiles!orders_buyer_id_fkey(nama), seller:profiles!orders_seller_id_fkey(nama)"
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const o = data as unknown as Order;

  const [{ data: ledger }, { data: disputes }, { data: review }, { data: conv }] = await Promise.all([
    supabase.from("ledger").select("jenis, jumlah, created_at").eq("order_id", id).order("created_at"),
    supabase.from("disputes").select("id, alasan, status, keputusan, created_at").eq("order_id", id).order("created_at"),
    supabase.from("reviews").select("rating, komentar").eq("order_id", id).maybeSingle(),
    supabase.from("conversations").select("id").eq("listing_id", o.listing_id).eq("buyer_id", o.buyer_id).maybeSingle(),
  ]);

  const peran = o.buyer_id === user.id ? "pembeli" : o.seller_id === user.id ? "penjual" : "admin";
  const metode = o.listings.metode_serah;
  const langkahSerah = metode === "surat_kuasa" ? "surat_kuasa_diunggah" : "tiket_dikirim";
  const urutan = ["menunggu_bayar", "dibayar_tertahan", langkahSerah, "dikonfirmasi_pembeli", "dicairkan"];
  const labelLangkah: Record<string, string> = {
    menunggu_bayar: "Pesanan dibuat",
    dibayar_tertahan: "Dibayar, dana tertahan",
    surat_kuasa_diunggah: "Surat kuasa diunggah",
    tiket_dikirim: "E-ticket dikirim",
    dikonfirmasi_pembeli: "Dikonfirmasi pembeli",
    dicairkan: "Dana dicairkan",
  };
  const idx = urutan.indexOf(o.status);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/dashboard" className="text-sm text-zinc-500 hover:underline">← Dashboard</Link>

      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-zinc-500">Pesanan #{o.id.slice(0, 8)} · kamu sebagai <b>{peran}</b></p>
            <h1 className="text-2xl font-extrabold">{o.listings.events.nama_event}</h1>
            <p className="text-sm text-zinc-500">
              {tanggal(o.listings.events.tanggal)} · {o.listings.events.venue ?? "-"}, {o.listings.events.kota ?? "-"} · {o.listings.kategori_tiket ?? "-"}
            </p>
            <p className="text-sm text-zinc-500">Penjual: {o.seller?.nama} · Pembeli: {o.buyer?.nama}</p>
          </div>
          <StatusBadge status={o.status} />
        </div>

        {idx >= 0 && (
          <ol className="mt-5 grid gap-2 sm:grid-cols-5">
            {urutan.map((s, i) => (
              <li key={s} className={`rounded-xl border p-2 text-center text-xs font-semibold ${i <= idx ? "border-brand-500 bg-brand-50 text-brand-700" : "border-zinc-200 text-zinc-400"}`}>
                {i + 1}. {labelLangkah[s]}
              </li>
            ))}
          </ol>
        )}
      </div>

      <OrderActions orderId={o.id} status={o.status} peran={peran} metode={metode} />

      {["surat_kuasa_diunggah", "tiket_dikirim", "dikonfirmasi_pembeli", "dicairkan", "sengketa", "refund"].includes(o.status) && (
        <Dokumen orderId={o.id} metode={metode} />
      )}

      {peran === "pembeli" && o.status === "dicairkan" && (
        review ? (
          <div className="card">
            <h2 className="font-bold">Ulasanmu</h2>
            <p className="text-amber-500">{"★".repeat(review.rating)}</p>
            {review.komentar && <p className="text-sm text-zinc-700">{review.komentar}</p>}
          </div>
        ) : (
          <ReviewForm orderId={o.id} />
        )
      )}

      {!!disputes?.length && (
        <div className="card">
          <h2 className="font-bold">Laporan / sengketa</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {disputes.map((d) => (
              <li key={d.id} className="rounded-xl bg-red-50 p-3">
                <p><b>Status:</b> {d.status} · {waktu(d.created_at)}</p>
                <p className="text-zinc-700">{d.alasan}</p>
                {d.keputusan && <p className="mt-1 font-semibold">Keputusan admin: {d.keputusan}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <h2 className="font-bold">Rincian dana</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between"><dt>Harga tiket</dt><dd>{rupiah(o.harga_tiket)}</dd></div>
            <div className="flex justify-between"><dt>Biaya layanan</dt><dd>{rupiah(o.biaya_layanan)}</dd></div>
            <div className="flex justify-between font-bold"><dt>Total dibayar pembeli</dt><dd>{rupiah(o.total_bayar)}</dd></div>
            <div className="flex justify-between text-green-700"><dt>Untuk penjual</dt><dd>{rupiah(o.dana_untuk_seller)}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-zinc-500">Metode serah terima: {METODE_SERAH[metode].label}</p>
          {conv && <Link href={`/chat/${conv.id}`} className="btn-outline mt-3 w-full">💬 Buka chat</Link>}
        </div>
        <div className="card">
          <h2 className="font-bold">Riwayat (ledger)</h2>
          <ul className="mt-2 space-y-1 text-sm">
            <li className="flex justify-between text-zinc-500"><span>Pesanan dibuat</span><span>{waktu(o.created_at)}</span></li>
            {(ledger ?? []).map((g, i) => (
              <li key={i} className="flex justify-between">
                <span className="capitalize">{g.jenis} {rupiah(g.jumlah)}</span>
                <span className="text-zinc-500">{waktu(g.created_at)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-zinc-500">Pencairan dana adalah simulasi (Midtrans Sandbox).</p>
        </div>
      </div>
    </div>
  );
}
