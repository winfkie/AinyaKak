"use client";

import { useState } from "react";
import { MapPin, Shirt, Ruler, CheckCircle2, Clock } from "lucide-react";
import { FALLBACK_IMAGE } from "@/data/seedData";
import { getZone } from "@/lib/pricing";
import { rupiah } from "@/lib/format";
import type { ClothingItem, OrderStatus, ZoneId } from "@/types/silih";

export function ItemImage({
  src,
  alt,
  className = "h-48 w-full object-cover"
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={errored ? FALLBACK_IMAGE : src}
      alt={alt}
      onError={() => setErrored(true)}
      className={className}
    />
  );
}

export function ZoneBadge({ zone }: { zone: ZoneId }) {
  const z = getZone(zone);
  return (
    <span className="badge bg-slate-100 text-slate-700">
      <MapPin size={12} />
      {z.label}
    </span>
  );
}

export const ORDER_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "PENDING_PAYMENT", label: "Menunggu Pembayaran" },
  { key: "WAITING_DELIVERY_COURIER", label: "Menunggu Kurir Antar" },
  { key: "DELIVERY_PICKING_UP", label: "Kurir Ambil Baju" },
  { key: "DELIVERY_ON_THE_WAY", label: "Dalam Pengiriman" },
  { key: "ACTIVE_RENTAL", label: "Sewa Berjalan" },
  { key: "WAITING_RETURN_COURIER", label: "Menunggu Kurir Jemput" },
  { key: "RETURN_PICKING_UP", label: "Kurir Jemput Baju" },
  { key: "RETURN_ON_THE_WAY", label: "Baju Dikembalikan" },
  { key: "COMPLETED", label: "Selesai" }
];

export const STATUS_META: Record<OrderStatus, { label: string; tone: string }> = {
  PENDING_PAYMENT: { label: "Menunggu Pembayaran", tone: "bg-amber-50 text-[#D97706]" },
  WAITING_DELIVERY_COURIER: { label: "Menunggu Kurir Antar", tone: "bg-slate-100 text-slate-700" },
  DELIVERY_PICKING_UP: { label: "Kurir Mengambil Baju", tone: "bg-emerald-50 text-[#059669]" },
  DELIVERY_ON_THE_WAY: { label: "Dalam Pengiriman", tone: "bg-emerald-50 text-[#059669]" },
  ACTIVE_RENTAL: { label: "Sewa Berjalan", tone: "bg-emerald-50 text-[#059669]" },
  WAITING_RETURN_COURIER: { label: "Menunggu Kurir Jemput", tone: "bg-amber-50 text-[#D97706]" },
  RETURN_PICKING_UP: { label: "Kurir Jemput Baju", tone: "bg-amber-50 text-[#D97706]" },
  RETURN_ON_THE_WAY: { label: "Baju Dikembalikan", tone: "bg-amber-50 text-[#D97706]" },
  COMPLETED: { label: "Selesai", tone: "bg-emerald-50 text-[#059669]" }
};

export function ItemCard({
  item,
  onChat,
  onRent
}: {
  item: ClothingItem;
  onChat: () => void;
  onRent: () => void;
}) {
  return (
    <article className="card overflow-hidden transition hover:shadow-md">
      <div className="relative">
        <ItemImage src={item.imageUrl} alt={item.title} className="h-48 w-full object-cover" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span
            className={`badge ${
              item.isAvailable ? "bg-emerald-50 text-[#059669]" : "bg-slate-100 text-slate-500"
            }`}
          >
            {item.isAvailable ? (
              <>
                <CheckCircle2 size={12} /> Tersedia • Maks. {item.maxDays} Hari
              </>
            ) : (
              <>
                <Clock size={12} /> Sedang Dipinjam
              </>
            )}
          </span>
        </div>
        <div className="absolute right-3 top-3">
          <span className="badge bg-[#0F172A] text-white">
            <Ruler size={12} /> {item.size}
          </span>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {item.category}
          </p>
          <h3 className="mt-0.5 text-sm font-bold leading-snug text-[#0F172A]">{item.title}</h3>
        </div>
        <p className="line-clamp-2 text-xs text-slate-500">{item.description}</p>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Shirt size={13} className="text-slate-400" />
          <span className="font-semibold">{item.ownerName}</span>
          <span className="text-slate-400">•</span>
          <span>
            {item.subArea}, {getZone(item.zone).label}
          </span>
        </div>
        <div className="flex items-end justify-between border-t border-slate-100 pt-3">
          <div>
            <p className="text-lg font-bold text-[#059669]">{rupiah(item.pricePerDay)}</p>
            <p className="text-[11px] text-slate-400">per hari</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onChat} className="btn-ghost px-3 py-2 text-xs">
              Chat &amp; Nego
            </button>
            <button
              onClick={onRent}
              disabled={!item.isAvailable}
              className="btn-primary px-3 py-2 text-xs"
            >
              Sewa Sekarang
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function SectionTitle({
  icon,
  title,
  subtitle
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="flex items-center gap-2 text-lg font-bold text-[#0F172A]">
        {icon}
        {title}
      </h2>
      {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default"
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "accent" | "warn";
}) {
  const tones: Record<string, string> = {
    default: "border-slate-200 bg-white text-[#0F172A]",
    accent: "border-emerald-200 bg-emerald-50 text-[#059669]",
    warn: "border-amber-200 bg-amber-50 text-[#D97706]"
  };
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] opacity-70">{hint}</p>}
    </div>
  );
}
