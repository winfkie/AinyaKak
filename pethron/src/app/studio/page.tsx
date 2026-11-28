import type { Metadata } from "next";
import StudioClient from "@/components/studio/StudioClient";

export const metadata: Metadata = {
  title: "Pitch & Q&A Studio",
  description:
    "Latihan pitch, business case, atau sidang skripsi: rekam suara, dapet skor 0–10, audit filler words, lalu dibantai 3 pertanyaan juri AI.",
};

export default function StudioPage() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(ellipse_at_top,rgba(27,67,50,0.08),transparent_70%)]" />
      <StudioClient />
    </div>
  );
}
