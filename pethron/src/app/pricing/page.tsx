import type { Metadata } from "next";
import PricingClient from "@/components/pricing/PricingClient";

export const metadata: Metadata = {
  title: "Harga & Paket",
  description:
    "Free, Pro Solo Rp29.000/bulan, dan Team Pack Rp69.000/bulan. Bayar pakai QRIS dinamis, paket aktif otomatis setelah pembayaran terverifikasi.",
};

export default function PricingPage() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(ellipse_at_top,rgba(27,67,50,0.1),transparent_70%)]" />
      <PricingClient />
    </div>
  );
}
