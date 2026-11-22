import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok, requireUser } from "@/lib/http";

// Membuat percakapan baru dengan penjual, atau membuka yang sudah ada.
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return fail("Silakan login dulu.", 401);
  const { listing_id } = await req.json().catch(() => ({}));
  if (!listing_id) return fail("listing_id wajib.");

  const db = createAdminClient();
  const { data: listing } = await db.from("listings").select("id, seller_id").eq("id", listing_id).single();
  if (!listing) return fail("Tiket tidak ditemukan.", 404);
  if (listing.seller_id === user.id) return fail("Ini tiketmu sendiri.");

  const { data: ada } = await db
    .from("conversations")
    .select("id")
    .eq("listing_id", listing_id)
    .eq("buyer_id", user.id)
    .maybeSingle();
  if (ada) return ok({ id: ada.id });

  const { data, error } = await db
    .from("conversations")
    .insert({ listing_id, buyer_id: user.id, seller_id: listing.seller_id })
    .select("id")
    .single();
  if (error) return fail(error.message, 500);
  return ok({ id: data.id });
}
