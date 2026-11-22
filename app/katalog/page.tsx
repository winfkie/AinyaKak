import ListingBrowser from "@/components/ListingBrowser";

export const metadata = { title: "Katalog Tiket" };

export default async function Katalog({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return (
    <div>
      <h1 className="mb-1 text-3xl font-extrabold">Katalog tiket</h1>
      <p className="mb-6 text-zinc-600">Semua tiket dijual maksimal seharga tiket aslinya.</p>
      <ListingBrowser sp={sp} basePath="/katalog" />
    </div>
  );
}
