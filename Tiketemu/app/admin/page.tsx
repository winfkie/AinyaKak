import Link from "next/link";
import { notFound } from "next/navigation";
import { wajibLogin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { rupiah, waktu } from "@/lib/format";
import { getFeePersen } from "@/lib/orders";
import StatusBadge from "@/components/StatusBadge";
import { FeeForm, SengketaAksi, VerifikasiToggle, BuktiBeliButton } from "./AdminTools";

export const metadata = { title: "Admin" };

type Sengketa = {
  id: string;
  alasan: string;
  status: string;
  keputusan: string | null;
  created_at: string;
  order_id: string;
  pelapor: { nama: string } | null;
  orders: { status: string; total_bayar: number; listings: { metode_serah: string; events: { nama_event: string } } } | null;
};

function tigaHariLalu() {
  return Date.now() - 3 * 24 * 3600 * 1000;
}

export default async function Admin() {
  const { profile } = await wajibLogin("/admin");
  if (!profile?.is_admin) notFound();

  const db = createAdminClient();
  const [fee, { data: sengketa }, { data: listings }, { data: users }, { data: orders }] = await Promise.all([
    getFeePersen(),
    db
      .from("disputes")
      .select("id, alasan, status, keputusan, created_at, order_id, pelapor:profiles!disputes_pelapor_id_fkey(nama), orders(status, total_bayar, listings(metode_serah, events(nama_event)))")
      .order("created_at", { ascending: false })
      .limit(50),
    db.from("listings").select("id, status, harga_asli, harga_jual, created_at, events(nama_event), profiles(nama)").order("created_at", { ascending: false }).limit(20),
    db.from("profiles").select("id, nama, username, is_verified, is_admin, created_at").order("created_at", { ascending: false }).limit(50),
    db.from("orders").select("id, status, total_bayar, created_at, dikirim_pada").order("created_at", { ascending: false }).limit(200),
  ]);

  const list = (sengketa ?? []) as unknown as Sengketa[];
  const tiket = (listings ?? []) as unknown as { id: string; status: string; harga_asli: number; harga_jual: number; created_at: string; events: { nama_event: string } | null; profiles: { nama: string } | null }[];
  const semua = orders ?? [];
  const totalTertahan = semua.filter((o) => ["dibayar_tertahan", "surat_kuasa_diunggah", "tiket_dikirim", "sengketa"].includes(o.status)).reduce((a, o) => a + o.total_bayar, 0);
  // Pembeli belum konfirmasi > 3 hari setelah penyerahan: perlu ditinjau
  const batas = tigaHariLalu();
  const macet = semua.filter((o) => ["surat_kuasa_diunggah", "tiket_dikirim"].includes(o.status) && o.dikirim_pada && Date.parse(o.dikirim_pada) < batas);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Panel admin</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card"><p className="text-sm text-zinc-500">Dana tertahan di platform</p><p className="text-2xl font-extrabold">{rupiah(totalTertahan)}</p></div>
        <div className="card"><p className="text-sm text-zinc-500">Sengketa terbuka</p><p className="text-2xl font-extrabold text-red-600">{list.filter((s) => s.status !== "selesai").length}</p></div>
        <FeeForm awal={fee} />
      </div>

      {macet.length > 0 && (
        <div className="card border-amber-300 bg-amber-50">
          <h2 className="font-bold">Belum dikonfirmasi lebih dari 3 hari</h2>
          <ul className="mt-2 text-sm">
            {macet.map((o) => <li key={o.id}><Link href={`/pesanan/${o.id}`} className="text-brand-700 hover:underline">#{o.id.slice(0, 8)}</Link> · <StatusBadge status={o.status} /></li>)}
          </ul>
        </div>
      )}

      <div className="card">
        <h2 className="font-bold">Laporan & sengketa</h2>
        {list.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-500">Tidak ada sengketa.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {list.map((s) => (
              <li key={s.id} className="rounded-xl border border-zinc-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{s.orders?.listings.events.nama_event} · {rupiah(s.orders?.total_bayar)}</p>
                    <p className="text-xs text-zinc-500"><Link href={`/pesanan/${s.order_id}`} className="text-brand-700 hover:underline">Pesanan #{s.order_id.slice(0, 8)}</Link> · dilaporkan {s.pelapor?.nama} · {waktu(s.created_at)} · metode {s.orders?.listings.metode_serah}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold">{s.status}</span>
                    {s.orders && <StatusBadge status={s.orders.status} />}
                  </div>
                </div>
                <p className="mt-2 text-sm text-zinc-700">{s.alasan}</p>
                {s.keputusan ? (
                  <p className="mt-2 text-sm font-semibold text-green-700">Keputusan: {s.keputusan}</p>
                ) : (
                  <SengketaAksi disputeId={s.id} orderId={s.order_id} status={s.status} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-bold">Tiket terbaru (cek bukti beli)</h2>
          <ul className="mt-2 divide-y divide-zinc-100 text-sm">
            {tiket.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 py-2">
                <span>
                  <Link href={`/tiket/${l.id}`} className="font-semibold hover:underline">{l.events?.nama_event}</Link>
                  <span className="block text-xs text-zinc-500">{l.profiles?.nama} · {rupiah(l.harga_jual)} / asli {rupiah(l.harga_asli)} · {l.status}</span>
                </span>
                <BuktiBeliButton listingId={l.id} />
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="font-bold">Pengguna</h2>
          <ul className="mt-2 divide-y divide-zinc-100 text-sm">
            {(users ?? []).map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-2 py-2">
                <span>
                  <span className="font-semibold">{u.nama}</span> {u.is_admin && <span className="text-xs text-brand-700">(admin)</span>}
                  <span className="block text-xs text-zinc-500">{u.username ? "@" + u.username : "-"} · {waktu(u.created_at)}</span>
                </span>
                <VerifikasiToggle userId={u.id} verified={!!u.is_verified} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
