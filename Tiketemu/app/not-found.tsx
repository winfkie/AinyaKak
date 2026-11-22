import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-md text-center">
      <p className="text-5xl">🎫</p>
      <h1 className="mt-2 text-2xl font-extrabold">Halaman tidak ditemukan</h1>
      <p className="mt-1 text-sm text-zinc-600">Mungkin tiketnya sudah dihapus, atau kamu tidak punya akses ke halaman ini.</p>
      <Link href="/" className="btn-primary mt-4">Kembali ke beranda</Link>
    </div>
  );
}
