import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok, requireUser } from "@/lib/http";

// Signed URL (berlaku 5 menit) untuk dokumen pesanan. Hanya pembeli, penjual, dan admin.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) return fail("Silakan login dulu.", 401);

  const db = createAdminClient();
  const [{ data: order }, { data: p }] = await Promise.all([
    db.from("orders").select("buyer_id, seller_id, bukti_kirim_path").eq("id", id).single(),
    db.from("profiles").select("is_admin").eq("id", user.id).single(),
  ]);
  if (!order) return fail("Pesanan tidak ditemukan.", 404);
  if (order.buyer_id !== user.id && order.seller_id !== user.id && !p?.is_admin) return fail("Tidak berhak.", 403);

  const { data: letters } = await db
    .from("proxy_letters")
    .select("id, file_path, status, catatan, created_at")
    .eq("order_id", id)
    .order("created_at", { ascending: false });

  const surat_kuasa = await Promise.all(
    (letters ?? []).map(async (l) => {
      const { data } = await db.storage.from("proxy-letters").createSignedUrl(l.file_path, 300);
      return { id: l.id, status: l.status, catatan: l.catatan, created_at: l.created_at, url: data?.signedUrl };
    })
  );

  let bukti_kirim: string | null = null;
  if (order.bukti_kirim_path) {
    const { data } = await db.storage.from("delivery-proofs").createSignedUrl(order.bukti_kirim_path, 300);
    bukti_kirim = data?.signedUrl ?? null;
  }

  const { data: disputes } = await db
    .from("disputes")
    .select("id, bukti_path")
    .eq("order_id", id)
    .not("bukti_path", "is", null);
  const bukti_sengketa = await Promise.all(
    (disputes ?? []).map(async (d) => {
      const { data } = await db.storage.from("delivery-proofs").createSignedUrl(d.bukti_path!, 300);
      return { id: d.id, url: data?.signedUrl };
    })
  );

  return ok({ surat_kuasa, bukti_kirim, bukti_sengketa });
}
