import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import { BrandLogo } from "@/components/BrandLogo";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const space = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Pethron — Pitch & Defense Studio | No More Overthinking Sebelum Naik Panggung",
    template: "%s · Pethron",
  },
  description:
    "Spill ide kamu di sini! Latihan pitch, business case, dan sidang skripsi bareng AI coach. Feedback real-time biar pitch kamu makin on-point.",
  keywords: [
    "latihan pitch",
    "simulasi sidang skripsi",
    "business case competition",
    "AI pitch coach",
    "latihan tanya jawab juri",
    "pethron",
  ],
  openGraph: {
    title: "Pethron — Pitch & Defense Studio",
    description:
      "No more overthinking sebelum naik panggung. Skor 0–10, audit bahasa, dan simulasi Q&A juri AI dalam satu studio.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F4F6FB",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      className={`${bricolage.variable} ${jakarta.variable} ${space.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-full flex-col bg-[#F4F6FB] font-body text-ink">
        {/* Iridescent Frosted Mesh Ambient Glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -top-36 -left-24 h-[460px] w-[460px] rounded-full bg-[#2563EB]/18 blur-[120px]" />
          <div className="absolute top-[10%] -right-28 h-[440px] w-[440px] rounded-full bg-[#EC4899]/18 blur-[125px]" />
          <div className="absolute top-[48%] left-[20%] h-[420px] w-[420px] rounded-full bg-[#A78BFA]/22 blur-[130px]" />
          <div className="absolute -bottom-32 right-[15%] h-[380px] w-[380px] rounded-full bg-[#2563EB]/14 blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(rgba(37, 99, 235, 0.08) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />
        </div>

        <AuthProvider>
          <Navbar />
          <main className="relative z-10 flex-1">{children}</main>
          <footer className="relative z-10 mt-16 border-t border-white/80 bg-white/55 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="space-y-2.5">
                <BrandLogo href="/" size="sm" showTag />
                <p className="max-w-md text-xs leading-relaxed text-muted">
                  No more overthinking sebelum naik panggung. Feedback real-time biar pitch,
                  business case, dan sidang kamu makin on-point.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-muted">
                <Link href="/studio" className="transition hover:text-cobalt">
                  Studio
                </Link>
                <Link href="/history" className="transition hover:text-cobalt">
                  History
                </Link>
                <Link href="/pricing" className="transition hover:text-magenta">
                  Pricing
                </Link>
                <span className="font-metric rounded-full glass-pill px-3 py-1 text-[11px] text-muted">
                  © {new Date().getFullYear()} Pethron
                </span>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
