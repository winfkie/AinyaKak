import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok, requireUser } from "@/lib/http";

// Ubah profil sendiri. Kolom is_admin / is_verified TIDAK bisa diubah dari sini.
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return fail("Silakan login dulu.", 401);
  const b = await req.json().catch(() => ({}));
  const nama = String(b.nama ?? "").trim();
  const username = String(b.username ?? "").trim().toLowerCase() || null;
  const no_hp = String(b.no_hp ?? "").trim() || null;
  if (nama.length < 2) return fail("Nama minimal 2 huruf.");
  if (username && !/^[a-z0-9_]{3,20}$/.test(username))
    return fail("Username 3-20 karakter: huruf kecil, angka, garis bawah.");
  if (no_hp && !/^[0-9+ -]{8,16}$/.test(no_hp)) return fail("Nomor HP tidak valid.");

  const db = createAdminClient();
  const { error } = await db.from("profiles").update({ nama, username, no_hp }).eq("id", user.id);
  if (error) return fail(error.code === "23505" ? "Username sudah dipakai." : error.message, 409);
  return ok();
}
