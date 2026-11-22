import Link from "next/link";
import type { Listing } from "@/lib/queries";
import { METODE_SERAH, rupiah, tanggal } from "@/lib/format";

export default function ListingCard({ l }: { l: Listing }) {
  const diskon = l.harga_asli > l.harga_jual ? Math.round((1 - l.harga_jual / l.harga_asli) * 100) : 0;
  return (
    <Link
      href={`/tiket/${l.id}`}
      className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-brand-50 px-2 py-0.5 font-semibold text-brand-700">{l.events.kategori ?? "Event"}</span>
        {l.tipe === "menfess" && <span className="rounded-full bg-pink-100 px-2 py-0.5 font-semibold text-pink-700">Menfess</span>}
        {l.status !== "aktif" && <span className="rounded-full bg-zinc-200 px-2 py-0.5 font-semibold text-zinc-700">{l.status === "dipesan" ? "Sedang dipesan" : l.status}</span>}
      </div>
      <h3 className="line-clamp-2 font-bold text-zinc-900 group-hover:text-brand-700">{l.events.nama_event}</h3>
      <p className="mt-1 text-sm text-zinc-500">
        {tanggal(l.events.tanggal)} · {l.events.kota ?? "-"}
      </p>
      {l.kategori_tiket && <p className="mt-1 text-sm text-zinc-600">Kategori: {l.kategori_tiket}</p>}
      <div className="mt-auto pt-4">
        <div className="flex items-end justify-between gap-2">
          <div>
            {diskon > 0 && <p className="text-xs text-zinc-400 line-through">{rupiah(l.harga_asli)}</p>}
            <p className="text-lg font-extrabold text-zinc-900">{rupiah(l.harga_jual)}</p>
          </div>
          {diskon > 0 && <span className="rounded-lg bg-green-100 px-2 py-1 text-xs font-bold text-green-700">-{diskon}%</span>}
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {METODE_SERAH[l.metode_serah].label} · oleh {l.profiles?.nama ?? "-"}
          {l.profiles?.is_verified && " ✔"}
        </p>
      </div>
    </Link>
  );
}
