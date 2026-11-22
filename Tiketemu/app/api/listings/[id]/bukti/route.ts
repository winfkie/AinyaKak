import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok, requireUser } from "@/lib/http";

// Signed URL bukti pembelian: hanya penjualnya sendiri dan admin.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) return fail("Silakan login dulu.", 401);

  const db = createAdminClient();
  const [{ data: l }, { data: p }] = await Promise.all([
    db.from("listings").select("seller_id, bukti_beli_path").eq("id", id).single(),
    db.from("profiles").select("is_admin").eq("id", user.id).single(),
  ]);
  if (!l?.bukti_beli_path) return fail("Bukti tidak ditemukan.", 404);
  if (l.seller_id !== user.id && !p?.is_admin) return fail("Tidak berhak.", 403);

  const { data } = await db.storage.from("ticket-proofs").createSignedUrl(l.bukti_beli_path, 300);
  return ok({ url: data?.signedUrl });
}
