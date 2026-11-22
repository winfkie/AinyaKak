import { createClient } from "@/lib/supabase/server";
import { fail, ok } from "@/lib/http";
import { getStatus } from "@/lib/midtrans";
import { prosesStatusPembayaran } from "@/lib/orders";

/**
 * Dipanggil berkala oleh halaman bayar. Server bertanya LANGSUNG ke Midtrans
 * (bukan percaya browser), jadi aman dan juga berguna saat tes di localhost
 * yang tidak bisa menerima notifikasi Midtrans.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Silakan login dulu.", 401);

  // RLS memastikan hanya pembeli/penjual yang bisa membaca order ini
  const { data: order } = await supabase.from("orders").select("id, status").eq("id", id).single();
  if (!order) return fail("Pesanan tidak ditemukan.", 404);

  if (order.status === "menunggu_bayar") {
    const st = await getStatus(id).catch(() => null);
    if (st && st.transaction_status) {
      await prosesStatusPembayaran(id, st, "cek_status");
    }
  }

  const { data: baru } = await supabase.from("orders").select("status").eq("id", id).single();
  return ok({ status: baru?.status });
}
