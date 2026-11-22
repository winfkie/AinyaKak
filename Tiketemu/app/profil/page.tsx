import { wajibLogin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import ProfilForm from "./ProfilForm";

export const metadata = { title: "Profil" };

export default async function Profil() {
  const { user } = await wajibLogin("/profil");
  // no_hp tidak bisa dibaca lewat client biasa (disembunyikan), jadi ambil via server
  const { data: p } = await createAdminClient()
    .from("profiles")
    .select("nama, username, no_hp, is_verified, is_admin, created_at")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="card">
        <h1 className="text-2xl font-extrabold">Profil saya</h1>
        <p className="text-sm text-zinc-500">{user.email}</p>
        <div className="mt-2 flex gap-2 text-xs">
          {p?.is_verified ? (
            <span className="rounded-full bg-green-100 px-2 py-0.5 font-semibold text-green-700">Terverifikasi</span>
          ) : (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-semibold text-zinc-600">Belum terverifikasi</span>
          )}
          {p?.is_admin && <span className="rounded-full bg-brand-100 px-2 py-0.5 font-semibold text-brand-700">Admin</span>}
        </div>
      </div>
      <ProfilForm awal={{ nama: p?.nama ?? "", username: p?.username ?? "", no_hp: p?.no_hp ?? "" }} />
    </div>
  );
}
