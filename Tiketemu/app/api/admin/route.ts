import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok, requireUser } from "@/lib/http";
import { cairkanDana, refundDana } from "@/lib/orders";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return fail("Silakan login dulu.", 401);
  const db = createAdminClient();
  const { data: p } = await db.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!p?.is_admin) return fail("Khusus admin.", 403);

  const b = await req.json().catch(() => ({}));

  if (b.aksi === "set_fee") {
    const n = Number(b.fee_persen);
    if (!Number.isFinite(n) || n < 0 || n > 50) return fail("Persentase 0 sampai 50.");
    await db.from("settings").upsert({ key: "fee_persen", value: String(n), updated_at: new Date().toISOString() });
    return ok();
  }

  if (b.aksi === "proses_sengketa") {
    await db.from("disputes").update({ status: "diproses" }).eq("id", b.dispute_id).eq("status", "terbuka");
    return ok();
  }

  if (b.aksi === "putus_sengketa") {
    const { dispute_id, keputusan, catatan } = b;
    const { data: d } = await db.from("disputes").select("id, order_id, status").eq("id", dispute_id).single();
    if (!d || d.status === "selesai") return fail("Sengketa tidak ditemukan atau sudah selesai.", 404);
    let berhasil = false;
    if (keputusan === "refund") berhasil = await refundDana(d.order_id);
    else if (keputusan === "cairkan") berhasil = await cairkanDana(d.order_id, ["sengketa"]);
    else return fail("Keputusan harus refund atau cairkan.");
    if (!berhasil) return fail("Status pesanan tidak lagi sengketa.", 409);
    const teks = keputusan === "refund" ? "Refund ke pembeli" : "Dana dicairkan ke penjual";
    await db
      .from("disputes")
      .update({ status: "selesai", keputusan: catatan ? `${teks}: ${catatan}` : teks })
      .eq("id", dispute_id);
    return ok();
  }

  if (b.aksi === "verifikasi_user") {
    await db.from("profiles").update({ is_verified: !!b.nilai }).eq("id", b.user_id);
    return ok();
  }

  return fail("Aksi tidak dikenal.");
}
