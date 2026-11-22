import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { wajibLogin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LISTING_SELECT, type Listing } from "@/lib/queries";
import { METODE_SERAH, rupiah, tanggal } from "@/lib/format";
import { getFeePersen, hitungBiaya } from "@/lib/orders";
import CheckoutForm from "./CheckoutForm";

export const metadata = { title: "Checkout" };

export default async function Checkout({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await wajibLogin(`/checkout/${id}`);
  const supabase = await createClient();
  const { data } = await supabase.from("listings").select(LISTING_SELECT).eq("id", id).maybeSingle();
  if (!data) notFound();
  const l = data as unknown as Listing;
  if (l.seller_id === user.id) redirect(`/tiket/${id}`);

  // Jika pembeli punya order yang masih menunggu bayar untuk tiket ini, lanjutkan saja
  const { data: pending } = await supabase
    .from("orders")
    .select("id")
    .eq("listing_id", id)
    .eq("buyer_id", user.id)
    .eq("status", "menunggu_bayar")
    .maybeSingle();
  if (pending) redirect(`/bayar/${pending.id}`);

  const feePersen = await getFeePersen();
  const b = hitungBiaya(l.harga_jual, feePersen); // hanya tampilan; server menghitung ulang saat bayar
  const metode = METODE_SERAH[l.metode_serah];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href={`/tiket/${id}`} className="text-sm text-zinc-500 hover:underline">← Kembali ke tiket</Link>
      <h1 className="text-3xl font-extrabold">Checkout</h1>

      <div className="card">
        <p className="font-bold">{l.events.nama_event}</p>
        <p className="text-sm text-zinc-500">{tanggal(l.events.tanggal)} · {l.events.venue ?? "-"}, {l.events.kota ?? "-"}</p>
        <p className="text-sm text-zinc-500">{l.kategori_tiket ?? "-"} · {l.jumlah} tiket · Penjual: {l.profiles?.nama}</p>
        <dl className="mt-4 space-y-2 border-t border-zinc-200 pt-4 text-sm">
          <div className="flex justify-between"><dt>Harga tiket</dt><dd>{rupiah(b.harga_tiket)}</dd></div>
          <div className="flex justify-between"><dt>Biaya layanan ({feePersen}%)</dt><dd>{rupiah(b.biaya_layanan)}</dd></div>
          <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-extrabold"><dt>Total bayar</dt><dd>{rupiah(b.total_bayar)}</dd></div>
        </dl>
      </div>

      <div className="card border-brand-100 bg-brand-50">
        <h2 className="font-bold">Cara serah terima: {metode.label}</h2>
        {l.metode_serah === "surat_kuasa" ? (
          <>
            <p className="mt-1 text-sm text-zinc-700">
              Setelah kamu membayar, penjual mengunggah surat kuasa bermaterai Rp10.000 beserta fotokopi KTP pemilik tiket. Kamu membawanya saat menukar e-voucher dengan wristband.
            </p>
            <p className="mt-3 rounded-xl bg-amber-100 p-3 text-sm text-amber-900">
              ⚠️ Tidak semua venue menerima surat kuasa. Sebagian promotor meminta surat kuasa asli (cetak) atau melarang pemindahtanganan tiket.
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm text-zinc-700">
            Setelah kamu membayar, penjual meneruskan e-ticket ke email kamu. Periksa nama event, kategori, dan QR sebelum menekan Konfirmasi.
          </p>
        )}
        <p className="mt-3 text-sm text-zinc-700">🔒 Dana ditahan Ticketix dan baru diteruskan ke penjual setelah kamu konfirmasi.</p>
      </div>

      {l.status === "aktif" ? (
        <CheckoutForm listingId={id} total={b.total_bayar} />
      ) : (
        <p className="card text-center text-zinc-600">Tiket ini sudah tidak tersedia.</p>
      )}
    </div>
  );
}
