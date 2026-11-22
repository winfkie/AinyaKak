import "server-only";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";

/** Untuk halaman yang wajib login: arahkan ke /login jika belum. */
export async function wajibLogin(next: string) {
  const sesi = await getSessionUser();
  if (!sesi) redirect(`/login?next=${encodeURIComponent(next)}`);
  return sesi;
}
