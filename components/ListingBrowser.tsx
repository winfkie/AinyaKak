import { createClient } from "@/lib/supabase/server";
import { LISTING_SELECT, type Listing } from "@/lib/queries";
import { KATEGORI_EVENT } from "@/lib/format";
import ListingCard from "@/components/ListingCard";

type Filter = Record<string, string | string[] | undefined>;

/** Daftar tiket + form filter (kota, tanggal, kategori, harga). Dipakai Katalog & Menfess. */
export default async function ListingBrowser({ tipe, sp, basePath }: { tipe?: "jual" | "menfess"; sp: Filter; basePath: string }) {
  const v = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : "");
  const supabase = await createClient();

  let q = supabase.from("listings").select(LISTING_SELECT).eq("status", "aktif");
  if (tipe) q = q.eq("tipe", tipe);
  if (v("q")) q = q.ilike("events.nama_event", `%${v("q")}%`);
  if (v("kota")) q = q.ilike("events.kota", `%${v("kota")}%`);
  if (v("kategori")) q = q.eq("events.kategori", v("kategori"));
  if (v("dari")) q = q.gte("events.tanggal", v("dari"));
  if (v("sampai")) q = q.lte("events.tanggal", v("sampai"));
  if (Number(v("min")) > 0) q = q.gte("harga_jual", Number(v("min")));
  if (Number(v("max")) > 0) q = q.lte("harga_jual", Number(v("max")));

  const urut = v("urut");
  if (urut === "termurah") q = q.order("harga_jual", { ascending: true });
  else if (urut === "termahal") q = q.order("harga_jual", { ascending: false });
  else q = q.order("created_at", { ascending: false });

  const { data, error } = await q.limit(60);
  const list = (data ?? []) as unknown as Listing[];

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <form action={basePath} className="card h-fit space-y-3">
        <div>
          <label className="label">Cari event</label>
          <input name="q" defaultValue={v("q")} className="input" placeholder="Nama konser/event" />
        </div>
        <div>
          <label className="label">Kota</label>
          <input name="kota" defaultValue={v("kota")} className="input" placeholder="Jakarta" />
        </div>
        <div>
          <label className="label">Kategori</label>
          <select name="kategori" defaultValue={v("kategori")} className="input">
            <option value="">Semua</option>
            {KATEGORI_EVENT.map((k) => <option key={k}>{k}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Dari tgl</label>
            <input type="date" name="dari" defaultValue={v("dari")} className="input px-2" />
          </div>
          <div>
            <label className="label">Sampai</label>
            <input type="date" name="sampai" defaultValue={v("sampai")} className="input px-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Harga min</label>
            <input type="number" name="min" defaultValue={v("min")} className="input" min={0} />
          </div>
          <div>
            <label className="label">Harga maks</label>
            <input type="number" name="max" defaultValue={v("max")} className="input" min={0} />
          </div>
        </div>
        <div>
          <label className="label">Urutkan</label>
          <select name="urut" defaultValue={urut} className="input">
            <option value="">Terbaru</option>
            <option value="termurah">Termurah</option>
            <option value="termahal">Termahal</option>
          </select>
        </div>
        <button className="btn-primary w-full">Terapkan filter</button>
        <a href={basePath} className="block text-center text-sm text-zinc-500 hover:underline">Reset</a>
      </form>

      <div>
        {error && (
          <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error.message.includes("fetch failed")
              ? "Tidak bisa terhubung ke database. Pastikan NEXT_PUBLIC_SUPABASE_URL dan key di .env.local sudah benar."
              : `Gagal memuat: ${error.message}`}
          </p>
        )}
        <p className="mb-3 text-sm text-zinc-500">{list.length} tiket ditemukan</p>
        {list.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((l) => <ListingCard key={l.id} l={l} />)}
          </div>
        ) : (
          <div className="card text-center text-zinc-500">Tidak ada tiket yang cocok dengan filter.</div>
        )}
      </div>
    </div>
  );
}
