import Link from "next/link";
import ListingBrowser from "@/components/ListingBrowser";

export const metadata = { title: "Menfess" };

export default async function Menfess({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return (
    <div>
      <h1 className="mb-1 text-3xl font-extrabold">Menfess 💌</h1>
      <p className="mb-6 max-w-2xl text-zinc-600">
        Tiket yang dilepas karena pemiliknya berhalangan hadir. Biasanya dijual di bawah harga asli.{" "}
        <Link href="/jual?tipe=menfess" className="font-semibold text-brand-600 hover:underline">Kirim menfess tiketmu</Link>
      </p>
      <ListingBrowser tipe="menfess" sp={sp} basePath="/menfess" />
    </div>
  );
}
