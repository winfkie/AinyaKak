import Link from "next/link";
import { wajibLogin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LISTING, STATUS_TERTAHAN, rupiah, tanggal, waktu } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

export const metadata = { title: "Dashboard" };

type OrderRow = {
  id: string;
  status: string;
  total_bayar: number;
  dana_untuk_seller: number;
  created_at: string;
  listings: { events: { nama_event: string } } | null;
};

function Tab({ id, label, aktif }: { id: string; label: string; aktif: string }) {
  return (
    <Link href={`/dashboard?tab=${id}`} className={`rounded-xl px-4 py-2 text-sm font-semibold ${aktif === id ? "bg-brand-600 text-white" : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"}`}>
      {label}
    </Link>
  );
}

function DaftarOrder({ rows, kosong, sebagaiPenjual }: { rows: OrderRow[]; kosong: string; sebagaiPenjual: boolean }) {
  if (!rows.length) return <p className="py-4 text-center text-sm text-zinc-500">{kosong}</p>;
  return (
    <ul className="divide-y divide-zinc-100">
      {rows.map((o) => (
        <li key={o.id}>
          <Link href={`/pesanan/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-zinc-50">
            <div>
              <p className="font-semibold">{o.listings?.events.nama_event}</p>
              <p className="text-xs text-zinc-500">#{o.id.slice(0, 8)} · {waktu(o.created_at)} · {rupiah(sebagaiPenjual ? o.dana_untuk_seller : o.total_bayar)}</p>
            </div>
            <StatusBadge status={o.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { user } = await wajibLogin("/dashboard");
  const { tab = "penjual" } = await searchParams;
  const supabase = await createClient();
  const sel = "id, status, total_bayar, dana_untuk_seller, created_at, listings(events(nama_event))";

  const [{ data: listings }, { data: masuk }, { data: beli }] = await Promise.all([
    supabase
      .from("listings")
      .select("id, status, harga_jual, tipe, created_at, events(nama_event, tanggal)")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("orders").select(sel).eq("seller_id", user.id).order("created_at", { ascending: false }),
    supabase.from("orders").select(sel).eq("buyer_id", user.id).order("created_at", { ascending: false }),
  ]);

  const pesananMasuk = (masuk ?? []) as unknown as OrderRow[];
  const pembelian = (beli ?? []) as unknown as OrderRow[];
  const tiketSaya = (listings ?? []) as unknown as {
    id: string; status: string; harga_jual: number; tipe: string; events: { nama_event: string; tanggal: string } | null;
  }[];

  const saldoTertahan = pesananMasuk.filter((o) => STATUS_TERTAHAN.includes(o.status)).reduce((a, o) => a + o.dana_untuk_seller, 0);
  const saldoCair = pesananMasuk.filter((o) => o.status === "dicairkan").reduce((a, o) => a + o.dana_untuk_seller, 0);
  const perluAksi = pesananMasuk.filter((o) => o.status === "dibayar_tertahan").length;

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Dashboard</h1>
      <div className="flex gap-2">
        <Tab id="penjual" label="Sebagai penjual" aktif={tab} />
        <Tab id="pembeli" label="Sebagai pembeli" aktif={tab} />
      </div>

      {tab === "penjual" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card"><p className="text-sm text-zinc-500">Saldo tertahan</p><p className="text-2xl font-extrabold">{rupiah(saldoTertahan)}</p><p className="text-xs text-zinc-500">Menunggu serah terima & konfirmasi</p></div>
            <div className="card"><p className="text-sm text-zinc-500">Saldo cair (simulasi)</p><p className="text-2xl font-extrabold text-green-700">{rupiah(saldoCair)}</p></div>
            <div className="card"><p className="text-sm text-zinc-500">Perlu diproses</p><p className="text-2xl font-extrabold text-brand-700">{perluAksi} pesanan</p><p className="text-xs text-zinc-500">Sudah dibayar, tiket belum diserahkan</p></div>
          </div>

          <div className="card">
            <h2 className="font-bold">Pesanan masuk</h2>
            <DaftarOrder rows={pesananMasuk} kosong="Belum ada pesanan masuk." sebagaiPenjual />
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Tiket saya</h2>
              <Link href="/jual" className="btn-primary py-2">+ Posting tiket</Link>
            </div>
            {tiketSaya.length ? (
              <ul className="mt-2 divide-y divide-zinc-100">
                {tiketSaya.map((l) => (
                  <li key={l.id}>
                    <Link href={`/tiket/${l.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-zinc-50">
                      <div>
                        <p className="font-semibold">{l.events?.nama_event} {l.tipe === "menfess" && <span className="text-xs text-pink-600">(menfess)</span>}</p>
                        <p className="text-xs text-zinc-500">{tanggal(l.events?.tanggal)} · {rupiah(l.harga_jual)}</p>
                      </div>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">{STATUS_LISTING[l.status]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-zinc-500">Kamu belum memposting tiket.</p>
            )}
          </div>
        </>
      ) : (
        <div className="card">
          <h2 className="font-bold">Riwayat pembelian</h2>
          <DaftarOrder rows={pembelian} kosong="Belum ada pembelian." sebagaiPenjual={false} />
        </div>
      )}
    </div>
  );
}
