import type { Metadata } from "next";
import HistoryClient from "@/components/history/HistoryClient";

export const metadata: Metadata = {
  title: "History & Analytics",
  description:
    "Lihat progres skor readiness kamu dari sesi ke sesi, buka detail laporan, export, atau hapus sesi lama.",
};

export default function HistoryPage() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 bg-[radial-gradient(ellipse_at_top,rgba(217,119,6,0.08),transparent_70%)]" />
      <HistoryClient />
    </div>
  );
}
