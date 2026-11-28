import type { PlanId } from "./types";

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  price: number;
  priceLabel: string;
  period: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Cocok buat coba-coba dulu tanpa ribet",
    price: 0,
    priceLabel: "Rp0",
    period: "/bulan",
    features: [
      "2 sesi latihan per bulan",
      "Langsung jalan pakai Guest Mode",
      "Skor delivery + audit filler words",
      "3 pertanyaan Q&A otomatis",
      "Riwayat tersimpan di browser",
    ],
    cta: "Gas Latihan",
  },
  {
    id: "pro",
    name: "Pro Solo",
    tagline: "Buat kamu yang serius mau menang lomba",
    price: 29000,
    priceLabel: "Rp29.000",
    period: "/bulan",
    features: [
      "Unlimited sesi sampai 15 menit",
      "Semua persona juri (VC, dosen, juri nasional)",
      "Golden Answer rewrite tiap jawaban",
      "Analitik progres & export laporan",
      "Prioritas pemrosesan AI",
    ],
    cta: "Upgrade ke Pro",
    highlight: true,
  },
  {
    id: "team",
    name: "Team Pack",
    tagline: "Buat 1 tim lomba hingga 5 orang",
    price: 69000,
    priceLabel: "Rp69.000",
    period: "/bulan",
    features: [
      "Semua fitur Pro Solo",
      "1 tim hingga 5 anggota",
      "Shared history & leaderboard tim",
      "Latihan Q&A lintas peran",
      "Golden Answer library tim",
    ],
    cta: "Upgrade ke Team",
  },
];

export function planLabel(id: PlanId): string {
  return PLANS.find((p) => p.id === id)?.name ?? "Free";
}

export function planPrice(id: PlanId): number {
  return PLANS.find((p) => p.id === id)?.price ?? 0;
}
