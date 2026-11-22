"use client";
import { useState } from "react";
import { waktu } from "@/lib/format";

type Data = {
  surat_kuasa: { id: string; status: string; catatan: string | null; created_at: string; url?: string }[];
  bukti_kirim: string | null;
  bukti_sengketa: { id: string; url?: string }[];
};

/** Dokumen privat dibuka lewat signed URL yang berlaku 5 menit. */
export default function Dokumen({ orderId, metode }: { orderId: string; metode: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function muat() {
    setLoading(true);
    const res = await fetch(`/api/orders/${orderId}/dokumen`);
    const j = await res.json();
    setLoading(false);
    if (!res.ok) return setErr(j.error);
    setData(j);
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-bold">Dokumen serah terima</h2>
        <button onClick={muat} disabled={loading} className="btn-outline py-1.5">{data ? "Muat ulang" : loading ? "Memuat…" : "Tampilkan dokumen"}</button>
      </div>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      {data && (
        <ul className="mt-3 space-y-2 text-sm">
          {metode === "surat_kuasa" && data.surat_kuasa.length === 0 && <li className="text-zinc-500">Belum ada surat kuasa.</li>}
          {data.surat_kuasa.map((s, i) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-50 p-3">
              <span>
                📄 Surat kuasa {i === 0 ? "(terbaru)" : ""} · {waktu(s.created_at)} · {s.status}
                {s.catatan && <span className="block text-zinc-600">Catatan: {s.catatan}</span>}
              </span>
              {s.url && <a href={s.url} target="_blank" className="font-semibold text-brand-600 hover:underline">Buka</a>}
            </li>
          ))}
          {metode === "kirim_email" && (
            <li className="rounded-xl bg-zinc-50 p-3">
              {data.bukti_kirim ? (
                <a href={data.bukti_kirim} target="_blank" className="font-semibold text-brand-600 hover:underline">📧 Bukti pengiriman e-ticket</a>
              ) : (
                <span className="text-zinc-500">Penjual tidak mengunggah bukti pengiriman (opsional). Periksa email kamu.</span>
              )}
            </li>
          )}
          {data.bukti_sengketa.map((b) => (
            <li key={b.id} className="rounded-xl bg-red-50 p-3">
              <a href={b.url} target="_blank" className="font-semibold text-red-700 hover:underline">🚩 Bukti laporan</a>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-zinc-500">Link dokumen hanya berlaku 5 menit dan hanya bisa dibuka pembeli, penjual, dan admin.</p>
    </div>
  );
}
