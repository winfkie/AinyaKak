import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

type StatusMidtrans = {
  transaction_status?: string;
  fraud_status?: string;
  gross_amount?: string;
  transaction_id?: string;
  payment_type?: string;
  status_code?: string;
};

export async function getFeePersen() {
  const db = createAdminClient();
  const { data } = await db.from("settings").select("value").eq("key", "fee_persen").single();
  const n = Number(data?.value ?? 5);
  return Number.isFinite(n) && n >= 0 && n <= 50 ? n : 5;
}

/** Biaya layanan dihitung di server. Pembeli membayar harga + biaya. */
export function hitungBiaya(harga: number, feePersen: number) {
  const biaya_layanan = Math.round((harga * feePersen) / 100);
  return {
    harga_tiket: harga,
    biaya_layanan,
    total_bayar: harga + biaya_layanan,
    dana_untuk_seller: harga,
  };
}

/**
 * Memproses status transaksi dari Midtrans (hasil Get Transaction Status yang
 * SUDAH dicek ke server Midtrans). Idempoten: update bersyarat pada status lama,
 * jadi notifikasi ganda tidak mencatat ledger dua kali.
 */
export async function prosesStatusPembayaran(
  orderId: string,
  st: StatusMidtrans,
  sumber: "notifikasi" | "cek_status",
  payload?: unknown
) {
  const db = createAdminClient();
  const { data: order } = await db
    .from("orders")
    .select("id, status, total_bayar, listing_id")
    .eq("id", orderId)
    .single();
  if (!order) return { hasil: "order_tidak_ada" as const };

  const ts = st.transaction_status ?? "unknown";

  // Jejak audit setiap notifikasi / pengecekan yang membawa perubahan
  if (sumber === "notifikasi" || ts !== "pending") {
    await db.from("payment_events").insert({
      order_id: orderId,
      midtrans_transaction_id: st.transaction_id ?? null,
      transaction_status: ts,
      sumber,
      payload: (payload ?? st) as object,
    });
  }

  const lunas = ts === "settlement" || (ts === "capture" && st.fraud_status === "accept");

  if (lunas) {
    const dibayar = Math.round(Number(st.gross_amount));
    if (dibayar !== order.total_bayar) {
      console.error("Nominal tidak cocok", orderId, dibayar, order.total_bayar);
      return { hasil: "nominal_tidak_cocok" as const };
    }
    const { data: diubah } = await db
      .from("orders")
      .update({
        status: "dibayar_tertahan",
        dibayar_pada: new Date().toISOString(),
        midtrans_transaction_id: st.transaction_id ?? null,
        payment_type: st.payment_type ?? "qris",
      })
      .eq("id", orderId)
      .eq("status", "menunggu_bayar")
      .select("id");

    if (diubah && diubah.length > 0) {
      await db.from("ledger").insert([
        { order_id: orderId, jenis: "bayar", jumlah: order.total_bayar },
        { order_id: orderId, jenis: "tahan", jumlah: order.total_bayar },
      ]);
      return { hasil: "dibayar" as const };
    }
    return { hasil: "sudah_diproses" as const };
  }

  if (["expire", "cancel", "deny", "failure"].includes(ts)) {
    const statusBaru = ts === "expire" ? "kedaluwarsa" : "dibatalkan";
    const { data: diubah } = await db
      .from("orders")
      .update({ status: statusBaru })
      .eq("id", orderId)
      .eq("status", "menunggu_bayar")
      .select("id");
    if (diubah && diubah.length > 0) {
      await db.from("listings").update({ status: "aktif" }).eq("id", order.listing_id).eq("status", "dipesan");
      return { hasil: statusBaru };
    }
    return { hasil: "sudah_diproses" as const };
  }

  return { hasil: "pending" as const };
}

/** Pencairan dana ke penjual (SIMULASI: hanya status + ledger). */
export async function cairkanDana(orderId: string, dariStatus: string[]) {
  const db = createAdminClient();
  const { data: diubah } = await db
    .from("orders")
    .update({ status: "dicairkan", dicairkan_pada: new Date().toISOString() })
    .eq("id", orderId)
    .in("status", dariStatus)
    .select("id, listing_id, dana_untuk_seller, biaya_layanan");
  const o = diubah?.[0];
  if (!o) return false;
  await db.from("ledger").insert([
    { order_id: orderId, jenis: "cairkan", jumlah: o.dana_untuk_seller },
    { order_id: orderId, jenis: "fee", jumlah: o.biaya_layanan },
  ]);
  await db.from("listings").update({ status: "terjual" }).eq("id", o.listing_id);
  await db.from("proxy_letters").update({ status: "disetujui" }).eq("order_id", orderId).eq("status", "menunggu");
  return true;
}

/** Pengembalian dana ke pembeli (SIMULASI). */
export async function refundDana(orderId: string) {
  const db = createAdminClient();
  const { data: diubah } = await db
    .from("orders")
    .update({ status: "refund" })
    .eq("id", orderId)
    .eq("status", "sengketa")
    .select("id, listing_id, total_bayar");
  const o = diubah?.[0];
  if (!o) return false;
  await db.from("ledger").insert({ order_id: orderId, jenis: "refund", jumlah: o.total_bayar });
  await db.from("listings").update({ status: "batal" }).eq("id", o.listing_id);
  return true;
}
