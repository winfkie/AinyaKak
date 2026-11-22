import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LISTING_SELECT, type Listing } from "@/lib/queries";
import { METODE_SERAH, STATUS_LISTING, rupiah, tanggal } from "@/lib/format";
import ChatButton from "./ChatButton";
import SellerTools from "./SellerTools";

export default async function DetailTiket({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("listings").select(LISTING_SELECT).eq("id", id).maybeSingle();
  if (!data) notFound();
  const l = data as unknown as Listing;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: ulasan } = await supabase
    .from("reviews")
    .select("rating, komentar, created_at")
    .eq("reviewee_id", l.seller_id)
    .order("created_at", { ascending: false })
    .limit(5);
  const { data: semuaRating } = await supabase.from("reviews").select("rating").eq("reviewee_id", l.seller_id);
  const jumlahUlasan = semuaRating?.length ?? 0;
  const rata = jumlahUlasan ? semuaRating!.reduce((a, r) => a + r.rating, 0) / jumlahUlasan : null;

  const isPemilik = user?.id === l.seller_id;
  const metode = METODE_SERAH[l.metode_serah];
  const diskon = l.harga_asli > l.harga_jual ? Math.round((1 - l.harga_jual / l.harga_asli) * 100) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <div className="card">
          <div className="mb-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-brand-50 px-2 py-0.5 font-semibold text-brand-700">{l.events.kategori}</span>
            {l.tipe === "menfess" && <span className="rounded-full bg-pink-100 px-2 py-0.5 font-semibold text-pink-700">Menfess</span>}
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-semibold text-zinc-700">{STATUS_LISTING[l.status]}</span>
          </div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{l.events.nama_event}</h1>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-zinc-500">Tanggal</dt><dd className="font-semibold">{tanggal(l.events.tanggal)}</dd></div>
            <div><dt className="text-zinc-500">Venue</dt><dd className="font-semibold">{l.events.venue ?? "-"}, {l.events.kota ?? "-"}</dd></div>
            <div><dt className="text-zinc-500">Kategori tiket</dt><dd className="font-semibold">{l.kategori_tiket ?? "-"}</dd></div>
            <div><dt className="text-zinc-500">Jumlah</dt><dd className="font-semibold">{l.jumlah} tiket (dijual satu paket)</dd></div>
          </dl>
          {l.deskripsi && <p className="mt-4 whitespace-pre-line text-sm text-zinc-700">{l.deskripsi}</p>}
          <p className="mt-4 text-xs text-zinc-500">✔ Penjual telah mengunggah bukti pembelian (hanya dapat dilihat admin untuk verifikasi).</p>
        </div>

        <div className="card border-brand-100 bg-brand-50">
          <h2 className="font-bold">Cara serah terima: {metode.label}</h2>
          <p className="mt-1 text-sm text-zinc-700">{metode.info}</p>
          {l.metode_serah === "surat_kuasa" && (
            <p className="mt-3 rounded-xl bg-amber-100 p-3 text-sm text-amber-900">
              ⚠️ Tidak semua venue menerima surat kuasa. Cek aturan penukaran tiket dari promotor sebelum membeli. Beberapa promotor meminta surat kuasa asli (cetak).
            </p>
          )}
        </div>

        <div className="card">
          <h2 className="font-bold">Penjual</h2>
          <p className="mt-1">
            <span className="font-semibold">{l.profiles?.nama}</span>
            {l.profiles?.username && <span className="text-zinc-500"> @{l.profiles.username}</span>}
            {l.profiles?.is_verified && <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Terverifikasi</span>}
          </p>
          <p className="text-sm text-zinc-500">
            {rata ? `★ ${rata.toFixed(1)} dari ${jumlahUlasan} ulasan` : "Belum ada ulasan"}
          </p>
          {!!ulasan?.length && (
            <ul className="mt-3 space-y-2">
              {ulasan.map((r, i) => (
                <li key={i} className="rounded-xl bg-zinc-50 p-3 text-sm">
                  <span className="text-amber-500">{"★".repeat(r.rating)}</span>
                  {r.komentar && <p className="text-zinc-700">{r.komentar}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <aside className="card h-fit space-y-4 lg:sticky lg:top-24">
        <div>
          {diskon > 0 && <p className="text-sm text-zinc-400 line-through">{rupiah(l.harga_asli)}</p>}
          <p className="text-3xl font-extrabold">{rupiah(l.harga_jual)}</p>
          <p className="text-xs text-zinc-500">Belum termasuk biaya layanan platform.</p>
        </div>

        {isPemilik ? (
          <SellerTools listingId={l.id} status={l.status} />
        ) : !user ? (
          <Link href={`/login?next=/tiket/${l.id}`} className="btn-primary w-full">Masuk untuk membeli</Link>
        ) : l.status === "aktif" ? (
          <div className="space-y-2">
            <Link href={`/checkout/${l.id}`} className="btn-primary w-full">Beli sekarang</Link>
            <ChatButton listingId={l.id} />
          </div>
        ) : (
          <div className="space-y-2">
            <p className="rounded-xl bg-zinc-100 p-3 text-center text-sm text-zinc-600">Tiket ini {STATUS_LISTING[l.status].toLowerCase()}.</p>
            <ChatButton listingId={l.id} />
          </div>
        )}

        <ul className="space-y-1 text-xs text-zinc-500">
          <li>🔒 Dana ditahan Ticketix sampai kamu konfirmasi.</li>
          <li>📄 Harga tidak boleh di atas harga asli.</li>
          <li>🚩 Ada masalah? Laporkan dari halaman pesanan.</li>
        </ul>
      </aside>
    </div>
  );
}
