"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { KATEGORI_EVENT, METODE_SERAH, rupiah } from "@/lib/format";

export default function JualForm({ tipeAwal }: { tipeAwal: "jual" | "menfess" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [hargaAsli, setHargaAsli] = useState("");
  const [hargaJual, setHargaJual] = useState("");
  const [metode, setMetode] = useState<"surat_kuasa" | "kirim_email">("surat_kuasa");

  const melebihi = Number(hargaJual) > 0 && Number(hargaAsli) > 0 && Number(hargaJual) > Number(hargaAsli);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (melebihi) return setErr("Harga jual tidak boleh melebihi harga asli.");
    setLoading(true);
    setErr("");
    const res = await fetch("/api/listings", { method: "POST", body: new FormData(e.currentTarget) });
    const j = await res.json();
    setLoading(false);
    if (!res.ok) return setErr(j.error);
    router.push(`/tiket/${j.id}`);
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <fieldset className="card space-y-3">
        <legend className="px-1 font-bold">Jenis posting</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: "jual", l: "Jual tiket", d: "Muncul di katalog" },
            { v: "menfess", l: "Menfess", d: "Berhalangan hadir" },
          ].map((o) => (
            <label key={o.v} className="flex cursor-pointer gap-2 rounded-xl border border-zinc-300 p-3 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
              <input type="radio" name="tipe" value={o.v} defaultChecked={tipeAwal === o.v} />
              <span><span className="block text-sm font-semibold">{o.l}</span><span className="text-xs text-zinc-500">{o.d}</span></span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="card grid gap-3 sm:grid-cols-2">
        <legend className="px-1 font-bold">Info event</legend>
        <div className="sm:col-span-2">
          <label className="label">Nama event *</label>
          <input name="nama_event" required className="input" placeholder="Contoh: Coldplay Music of the Spheres Jakarta" />
        </div>
        <div>
          <label className="label">Tanggal event *</label>
          <input name="tanggal" type="date" required className="input" />
        </div>
        <div>
          <label className="label">Kategori event</label>
          <select name="kategori" className="input">{KATEGORI_EVENT.map((k) => <option key={k}>{k}</option>)}</select>
        </div>
        <div>
          <label className="label">Venue</label>
          <input name="venue" className="input" placeholder="GBK" />
        </div>
        <div>
          <label className="label">Kota</label>
          <input name="kota" className="input" placeholder="Jakarta" />
        </div>
      </fieldset>

      <fieldset className="card grid gap-3 sm:grid-cols-2">
        <legend className="px-1 font-bold">Detail tiket</legend>
        <div>
          <label className="label">Kategori tiket</label>
          <input name="kategori_tiket" className="input" placeholder="CAT 1 / Festival A" />
        </div>
        <div>
          <label className="label">Jumlah tiket</label>
          <input name="jumlah" type="number" min={1} max={10} defaultValue={1} className="input" />
        </div>
        <div>
          <label className="label">Harga asli (total) *</label>
          <input name="harga_asli" type="number" min={1} required value={hargaAsli} onChange={(e) => setHargaAsli(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Harga jual (total) *</label>
          <input name="harga_jual" type="number" min={1000} required value={hargaJual} onChange={(e) => setHargaJual(e.target.value)} className={`input ${melebihi ? "border-red-500" : ""}`} />
          {melebihi ? (
            <p className="mt-1 text-xs text-red-600">Maksimal {rupiah(Number(hargaAsli))} (aturan anti calo).</p>
          ) : (
            Number(hargaJual) > 0 && <p className="mt-1 text-xs text-zinc-500">Kamu akan menerima {rupiah(Number(hargaJual))} setelah pembeli konfirmasi.</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="label">Deskripsi</label>
          <textarea name="deskripsi" rows={3} className="input" placeholder="Alasan dijual, posisi duduk, dll." />
        </div>
      </fieldset>

      <fieldset className="card space-y-3">
        <legend className="px-1 font-bold">Metode serah terima *</legend>
        <p className="text-sm text-zinc-600">Pilih sesuai aturan penukaran tiket dari promotor event ini.</p>
        {(["surat_kuasa", "kirim_email"] as const).map((m) => (
          <label key={m} className="flex cursor-pointer gap-3 rounded-xl border border-zinc-300 p-3 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
            <input type="radio" name="metode_serah" value={m} checked={metode === m} onChange={() => setMetode(m)} />
            <span>
              <span className="block text-sm font-semibold">{METODE_SERAH[m].label}</span>
              <span className="text-xs text-zinc-600">
                {m === "surat_kuasa"
                  ? "Pilih jika venue meminta nama sesuai KTP saat penukaran wristband. Kamu akan mengunggah surat kuasa bermaterai Rp10.000 + fotokopi KTP."
                  : "Pilih jika tiket/QR bisa langsung dipindai. Kamu meneruskan e-ticket ke email pembeli."}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="card">
        <legend className="px-1 font-bold">Bukti pembelian *</legend>
        <p className="mb-2 text-sm text-zinc-600">Screenshot email/invoice pembelian resmi. JPG, PNG, WEBP, atau PDF, maks 4MB. Disimpan privat.</p>
        <input name="bukti" type="file" required accept="image/jpeg,image/png,image/webp,application/pdf" className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-semibold file:text-brand-700" />
      </fieldset>

      {err && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      <button disabled={loading || melebihi} className="btn-primary w-full py-3">{loading ? "Mengunggah…" : "Posting tiket"}</button>
    </form>
  );
}
