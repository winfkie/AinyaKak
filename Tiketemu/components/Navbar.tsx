import Link from "next/link";
import { getSessionUser } from "@/lib/supabase/server";

export default async function Navbar() {
  const sesi = await getSessionUser();
  const profil = sesi?.profile;

  const links = [
    { href: "/katalog", label: "Katalog" },
    { href: "/menfess", label: "Menfess" },
    { href: "/cara-kerja", label: "Cara Kerja" },
  ];
  const linksLogin = [
    { href: "/jual", label: "Jual Tiket" },
    { href: "/chat", label: "Chat" },
    { href: "/dashboard", label: "Dashboard" },
    ...(profil?.is_admin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">T</span>
          Tiketemu
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {[...links, ...(sesi ? linksLogin : [])].map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {sesi ? (
            <>
              <Link href="/profil" className="rounded-lg px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-100">
                {profil?.nama ?? "Profil"}
              </Link>
              <form action="/auth/logout" method="post">
                <button className="btn-outline py-2">Keluar</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-outline py-2">Masuk</Link>
              <Link href="/daftar" className="btn-primary py-2">Daftar</Link>
            </>
          )}
        </div>

        {/* Menu HP */}
        <details className="relative md:hidden">
          <summary className="list-none rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold">Menu</summary>
          <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg">
            {[...links, ...(sesi ? linksLogin : [])].map((l) => (
              <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-100">
                {l.label}
              </Link>
            ))}
            <hr className="my-2 border-zinc-200" />
            {sesi ? (
              <>
                <Link href="/profil" className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-100">Profil ({profil?.nama})</Link>
                <form action="/auth/logout" method="post">
                  <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">Keluar</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-100">Masuk</Link>
                <Link href="/daftar" className="block rounded-lg px-3 py-2 text-sm font-semibold text-brand-600 hover:bg-zinc-100">Daftar</Link>
              </>
            )}
          </div>
        </details>
      </div>
    </header>
  );
}
