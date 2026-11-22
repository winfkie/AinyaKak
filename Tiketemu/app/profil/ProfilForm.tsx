"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProfilForm({ awal }: { awal: { nama: string; username: string; no_hp: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    setLoading(true);
    const res = await fetch("/api/profil", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    const j = await res.json();
    setLoading(false);
    setPesan(res.ok ? { ok: true, teks: "Profil disimpan." } : { ok: false, teks: j.error });
    if (res.ok) router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <div>
        <label className="label">Nama</label>
        <input name="nama" defaultValue={awal.nama} required className="input" />
      </div>
      <div>
        <label className="label">Username</label>
        <input name="username" defaultValue={awal.username} className="input" placeholder="contoh: budi_konser" />
      </div>
      <div>
        <label className="label">Nomor HP (tidak ditampilkan publik)</label>
        <input name="no_hp" defaultValue={awal.no_hp} className="input" placeholder="08xxxxxxxxxx" />
      </div>
      {pesan && <p className={`text-sm ${pesan.ok ? "text-green-700" : "text-red-600"}`}>{pesan.teks}</p>}
      <button disabled={loading} className="btn-primary w-full">{loading ? "Menyimpan…" : "Simpan"}</button>
    </form>
  );
}
