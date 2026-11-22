import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok, requireUser } from "@/lib/http";

// Penjual membatalkan (menarik) listing miliknya yang masih aktif.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) return fail("Silakan login dulu.", 401);

  const db = createAdminClient();
  const { data } = await db
    .from("listings")
    .update({ status: "batal" })
    .eq("id", id)
    .eq("seller_id", user.id)
    .eq("status", "aktif")
    .select("id");
  if (!data?.length) return fail("Listing tidak bisa dibatalkan (bukan milikmu atau sedang dipesan).", 409);
  return ok();
}
