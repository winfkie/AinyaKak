import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok, requireUser } from "@/lib/http";

// Ulasan dari pembeli untuk penjual, hanya setelah dana dicairkan.
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return fail("Silakan login dulu.", 401);
  const { order_id, rating, komentar } = await req.json().catch(() => ({}));
  const r = Number(rating);
  if (!order_id || !Number.isInteger(r) || r < 1 || r > 5) return fail("Rating 1 sampai 5.");

  const db = createAdminClient();
  const { data: order } = await db.from("orders").select("buyer_id, seller_id, status").eq("id", order_id).single();
  if (!order || order.buyer_id !== user.id) return fail("Hanya pembeli yang bisa memberi ulasan.", 403);
  if (order.status !== "dicairkan") return fail("Ulasan bisa diberikan setelah transaksi selesai.", 409);

  const { error } = await db.from("reviews").insert({
    order_id,
    reviewer_id: user.id,
    reviewee_id: order.seller_id,
    rating: r,
    komentar: String(komentar ?? "").slice(0, 500) || null,
  });
  if (error) return fail(error.code === "23505" ? "Kamu sudah memberi ulasan." : error.message, 409);
  return ok();
}
