"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

async function panggil(body: Record<string, unknown>) {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error);
}

export function FeeForm({ awal }: { awal: number }) {
  const router = useRouter();
  const [nilai, setNilai] = useState(String(awal));
  const [pesan, setPesan] = useState("");
  return (
    <form
      className="card"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await panggil({ aksi: "set_fee", fee_persen: Number(nilai) });
          setPesan("Tersimpan");
          router.refresh();
        } catch (err) {
          setPesan((err as Error).message);
        }
      }}
    >
      <p className="text-sm text-zinc-500">Biaya layanan (%)</p>
      <div className="mt-1 flex gap-2">
        <input type="number" step="0.5" min={0} max={50} value={nilai} onChange={(e) => setNilai(e.target.value)} className="input" />
        <button className="btn-primary">Simpan</button>
      </div>
      {pesan && <p className="mt-1 text-xs text-zinc-600">{pesan}</p>}
    </form>
  );
}

export function SengketaAksi({ disputeId, orderId, status }: { disputeId: string; orderId: string; status: string }) {
  const router = useRouter();
  const [catatan, setCatatan] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function jalan(body: Record<string, unknown>, tanya?: string) {
    if (tanya && !confirm(tanya)) return;
    setLoading(true);
    setErr("");
    try {
      await panggil(body);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    }
    setLoading(false);
  }

  async function lihatDokumen() {
    const res = await fetch(`/api/orders/${orderId}/dokumen`);
    const j = await res.json();
    if (!res.ok) return setErr(j.error);
    const urls = [...j.surat_kuasa.map((s: { url: string }) => s.url), j.bukti_kirim, ...j.bukti_sengketa.map((b: { url: string }) => b.url)].filter(Boolean);
    if (!urls.length) return setErr("Tidak ada dokumen.");
    urls.forEach((u: string) => window.open(u, "_blank"));
  }

  return (
    <div className="mt-3 space-y-2">
      <input value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan keputusan" className="input" />
      <div className="flex flex-wrap gap-2">
        <button onClick={lihatDokumen} className="btn-outline py-1.5">Lihat dokumen</button>
        {status === "terbuka" && <button disabled={loading} onClick={() => jalan({ aksi: "proses_sengketa", dispute_id: disputeId })} className="btn-outline py-1.5">Tandai diproses</button>}
        <button disabled={loading} onClick={() => jalan({ aksi: "putus_sengketa", dispute_id: disputeId, keputusan: "refund", catatan }, "Refund dana ke pembeli?")} className="btn-danger py-1.5">Refund ke pembeli</button>
        <button disabled={loading} onClick={() => jalan({ aksi: "putus_sengketa", dispute_id: disputeId, keputusan: "cairkan", catatan }, "Cairkan dana ke penjual?")} className="btn-primary py-1.5">Cairkan ke penjual</button>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}

export function VerifikasiToggle({ userId, verified }: { userId: string; verified: boolean }) {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await panggil({ aksi: "verifikasi_user", user_id: userId, nilai: !verified }).catch(() => null);
        router.refresh();
      }}
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${verified ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-600"}`}
    >
      {verified ? "✔ Terverifikasi" : "Verifikasi"}
    </button>
  );
}

export function BuktiBeliButton({ listingId }: { listingId: string }) {
  return (
    <button
      onClick={async () => {
        const res = await fetch(`/api/listings/${listingId}/bukti`);
        const j = await res.json();
        if (res.ok) window.open(j.url, "_blank");
        else alert(j.error);
      }}
      className="shrink-0 text-xs font-semibold text-brand-600 hover:underline"
    >
      Bukti beli
    </button>
  );
}
