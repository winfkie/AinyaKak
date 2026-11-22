import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { wajibLogin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rupiah } from "@/lib/format";
import { IS_SANDBOX } from "@/lib/midtrans";
import BayarQris from "./BayarQris";

export const metadata = { title: "Bayar QRIS" };

export default async function Bayar({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await wajibLogin(`/bayar/${id}`);
  const supabase = await createClient();
  const { data: o } = await supabase
    .from("orders")
    .select("id, buyer_id, status, total_bayar, qr_url, payment_expired_at, listings(events(nama_event))")
    .eq("id", id)
    .maybeSingle();
  if (!o || o.buyer_id !== user.id) notFound();
  if (o.status !== "menunggu_bayar") redirect(`/pesanan/${id}`);

  const nama = (o.listings as unknown as { events: { nama_event: string } } | null)?.events.nama_event;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="card text-center">
        <p className="text-sm text-zinc-500">Bayar untuk</p>
        <p className="font-bold">{nama}</p>
        <p className="mt-2 text-3xl font-extrabold">{rupiah(o.total_bayar)}</p>
        <BayarQris orderId={id} qrUrl={o.qr_url} expiredAt={o.payment_expired_at} />
      </div>

      {IS_SANDBOX && o.qr_url && (
        <div className="card text-sm">
          <p className="font-bold">🧪 Mode Sandbox: cara simulasi bayar</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-zinc-700">
            <li>Klik kanan gambar QR → <b>Copy image address</b>.</li>
            <li>Buka <a href="https://simulator.sandbox.midtrans.com/v2/qris/index" target="_blank" className="font-semibold text-brand-600 underline">Simulator QRIS Midtrans</a>.</li>
            <li>Tempel link gambar QR, klik <b>Scan QR</b>, lalu <b>Pay</b>.</li>
            <li>Halaman ini otomatis pindah setelah pembayaran terkonfirmasi.</li>
          </ol>
        </div>
      )}

      <p className="text-center text-sm">
        <Link href={`/pesanan/${id}`} className="text-zinc-500 hover:underline">Lihat detail pesanan</Link>
      </p>
    </div>
  );
}
