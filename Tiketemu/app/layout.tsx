import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Ticketix — Lepas tiket aman, dana tertahan", template: "%s | Ticketix" },
  description:
    "Marketplace C2C jual-beli tiket konser & event dengan pembayaran QRIS, dana tertahan (escrow), dan serah terima lewat surat kuasa atau e-ticket.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>
        <footer className="border-t border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Ticketix — proyek tugas. Pembayaran memakai Midtrans Sandbox.</p>
            <nav className="flex gap-4">
              <Link href="/cara-kerja" className="hover:text-zinc-800">Cara Kerja</Link>
              <Link href="/faq" className="hover:text-zinc-800">FAQ</Link>
              <Link href="/syarat" className="hover:text-zinc-800">Syarat & Ketentuan</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
