import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok, requireUser } from "@/lib/http";
import { chargeQris } from "@/lib/midtrans";
import { getFeePersen, hitungBiaya } from "@/lib/orders";

const BATAS_BAYAR_MENIT = 15;

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return fail("Silakan login dulu.", 401);

  const { listing_id, setuju } = await req.json().catch(() => ({}));
  if (!listing_id) return fail("listing_id wajib.");
  if (setuju !== true) return fail("Kamu wajib mencentang pernyataan cara serah terima.");

  const db = createAdminClient();
  const { data: listing } = await db
    .from("listings")
    .select("id, seller_id, harga_jual, status, kategori_tiket, events(nama_event)")
    .eq("id", listing_id)
    .single();
  if (!listing) return fail("Tiket tidak ditemukan.", 404);
  if (listing.seller_id === user.id) return fail("Kamu tidak bisa membeli tiketmu sendiri.");
  if (listing.status !== "aktif") return fail("Tiket sudah tidak tersedia.", 409);

  // Kunci listing (aktif -> dipesan) secara atomik supaya tidak dibeli dua orang
  const { data: dikunci } = await db
    .from("listings")
    .update({ status: "dipesan" })
    .eq("id", listing_id)
    .eq("status", "aktif")
    .select("id");
  if (!dikunci?.length) return fail("Tiket baru saja dipesan orang lain.", 409);

  const biaya = hitungBiaya(listing.harga_jual, await getFeePersen());

  const { data: order, error } = await db
    .from("orders")
    .insert({
      listing_id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      ...biaya,
      status: "menunggu_bayar",
    })
    .select("id")
    .single();
  if (error || !order) {
    await db.from("listings").update({ status: "aktif" }).eq("id", listing_id);
    return fail("Gagal membuat pesanan: " + error?.message, 500);
  }

  const { data: profil } = await db.from("profiles").select("nama").eq("id", user.id).single();
  const ev = listing.events as unknown as { nama_event: string } | null;

  let res: Record<string, unknown>;
  try {
    res = await chargeQris({
      orderId: order.id,
      grossAmount: biaya.total_bayar,
      items: [
        { id: listing.id.slice(0, 40), price: biaya.harga_tiket, quantity: 1, name: `Tiket ${ev?.nama_event ?? ""}` },
        { id: "biaya-layanan", price: biaya.biaya_layanan, quantity: 1, name: "Biaya layanan Ticketix" },
      ].filter((i) => i.price > 0),
      customer: { first_name: profil?.nama ?? "Pembeli", email: user.email },
      expiryMinutes: BATAS_BAYAR_MENIT,
    });
  } catch (e) {
    res = { status_message: (e as Error).message };
  }

  if (res.status_code !== "201") {
    await db.from("orders").update({ status: "dibatalkan" }).eq("id", order.id);
    await db.from("listings").update({ status: "aktif" }).eq("id", listing_id);
    return fail("Midtrans menolak transaksi: " + (res.status_message ?? "tidak diketahui"), 502);
  }

  const actions = (res.actions as { name: string; url: string }[] | undefined) ?? [];
  const qr_url = actions.find((a) => a.name === "generate-qr-code")?.url ?? null;

  await db
    .from("orders")
    .update({
      qr_url,
      midtrans_transaction_id: res.transaction_id as string,
      payment_type: "qris",
      payment_expired_at: new Date(Date.now() + BATAS_BAYAR_MENIT * 60_000).toISOString(),
    })
    .eq("id", order.id);

  return ok({ order_id: order.id });
}
