import { wajibLogin } from "@/lib/auth";
import JualForm from "./JualForm";

export const metadata = { title: "Jual Tiket" };

export default async function Jual({ searchParams }: { searchParams: Promise<{ tipe?: string }> }) {
  await wajibLogin("/jual");
  const { tipe } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-3xl font-extrabold">Posting tiket</h1>
      <p className="mb-6 text-zinc-600">Harga jual tidak boleh melebihi harga asli. Bukti pembelian wajib diunggah dan hanya dilihat admin.</p>
      <JualForm tipeAwal={tipe === "menfess" ? "menfess" : "jual"} />
    </div>
  );
}
