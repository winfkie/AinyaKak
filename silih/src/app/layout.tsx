import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { SilihProvider } from "@/context/SilihContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "SILIH — Pinjam & Bertukar Busana Mahasiswa",
  description:
    "Platform P2P sewa-menyewa & sirkulasi busana mahasiswa Tembalang & Banyumanik, Semarang."
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white antialiased">
        <SilihProvider>{children}</SilihProvider>
        <Script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ""}
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
