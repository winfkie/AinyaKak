import { fail, ok } from "@/lib/http";
import { getStatus, verifikasiSignature } from "@/lib/midtrans";
import { prosesStatusPembayaran } from "@/lib/orders";

/**
 * Webhook notifikasi pembayaran dari Midtrans.
 * 1. Verifikasi signature_key  2. Cek ulang via Get Transaction Status
 * 3. Simpan ke payment_events  4. Ubah order (idempoten)
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return fail("Body tidak valid.");

  if (!verifikasiSignature(body)) {
    console.warn("Notifikasi Midtrans dengan signature salah ditolak:", body.order_id);
    return fail("Signature tidak valid.", 403);
  }

  const st = await getStatus(body.order_id);
  if (!st?.transaction_status || st.order_id !== body.order_id) {
    return fail("Transaksi tidak ditemukan di Midtrans.", 404);
  }

  const hasil = await prosesStatusPembayaran(body.order_id, st, "notifikasi", body);
  if (hasil.hasil === "order_tidak_ada") {
    // Mis. tombol "Test notification" di dashboard Midtrans. Balas 200 supaya tidak diulang.
    return ok({ ok: true, info: "order tidak dikenal" });
  }
  return ok({ ok: true, ...hasil });
}
