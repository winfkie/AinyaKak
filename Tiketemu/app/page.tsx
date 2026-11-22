import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LISTING_SELECT, type Listing } from "@/lib/queries";
import ListingCard from "@/components/ListingCard";

export default async function Beranda() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("status", "aktif")
    .order("created_at", { ascending: false })
    .limit(8);
  const terbaru = (data ?? []) as unknown as Listing[];

  const langkah = [
    { no: 1, judul: "Penjual posting tiket", isi: "Lengkap dengan bukti pembelian. Harga tidak boleh di atas harga asli." },
    { no: 2, judul: "Chat & bayar QRIS", isi: "Tanya penjual lewat chat, lalu bayar dengan QRIS dari e-wallet atau m-banking." },
    { no: 3, judul: "Dana tertahan", isi: "Uangmu ditahan Ticketix, belum diteruskan ke penjual." },
    { no: 4, judul: "Tiket diserahkan", isi: "Lewat surat kuasa atau e-ticket via email, sesuai aturan event." },
    { no: 5, judul: "Konfirmasi, dana cair", isi: "Setelah kamu konfirmasi, dana dicairkan ke penjual." },
  ];

  return (
    <div className="space-y-14">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-fuchsia-600 px-6 py-12 text-white sm:px-12 sm:py-16">
        <p className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">Escrow · QRIS · Surat kuasa</p>
        <h1 className="max-w-2xl text-3xl font-extrabold leading-tight sm:text-5xl">
          Berhalangan nonton? Lepas tiketmu dengan aman.
        </h1>
        <p className="mt-4 max-w-xl text-white/85">
          Ticketix menahan dana pembeli sampai tiket benar-benar diserahkan. Tidak ada lagi transfer duluan lalu ditinggal kabur.
        </p>
        <form action="/katalog" className="mt-8 flex max-w-xl flex-col gap-2 sm:flex-row">
          <input name="q" placeholder="Cari konser atau event…" className="input flex-1 border-white/30 text-zinc-900" />
          <button className="btn bg-white text-brand-700 hover:bg-brand-50">Cari tiket</button>
        </form>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link href="/jual" className="rounded-xl border border-white/40 px-4 py-2 font-semibold hover:bg-white/10">Jual tiketku →</Link>
          <Link href="/menfess" className="rounded-xl border border-white/40 px-4 py-2 font-semibold hover:bg-white/10">Lihat menfess</Link>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Tiket terbaru</h2>
          <Link href="/katalog" className="text-sm font-semibold text-brand-600 hover:underline">Lihat semua</Link>
        </div>
        {terbaru.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {terbaru.map((l) => <ListingCard key={l.id} l={l} />)}
          </div>
        ) : (
          <div className="card text-center text-zinc-500">
            Belum ada tiket. <Link href="/jual" className="font-semibold text-brand-600">Jadilah yang pertama memposting.</Link>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">Cara kerja</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {langkah.map((s) => (
            <div key={s.no} className="card">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">{s.no}</span>
              <h3 className="mt-3 font-bold">{s.judul}</h3>
              <p className="mt-1 text-sm text-zinc-600">{s.isi}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
