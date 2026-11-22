import { createAdminClient } from "@/lib/supabase/admin";
import { cekFile, fail, namaFileAman, ok, requireUser } from "@/lib/http";
import { cancelTransaksi } from "@/lib/midtrans";
import { cairkanDana } from "@/lib/orders";

/**
 * Semua perubahan status order setelah pembayaran dilakukan di sini,
 * dengan pengecekan siapa yang berhak dan status saat ini.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) return fail("Silakan login dulu.", 401);

  const f = await req.formData();
  const aksi = String(f.get("aksi") ?? "");

  const db = createAdminClient();
  const { data: order } = await db
    .from("orders")
    .select("id, status, buyer_id, seller_id, listing_id, listings(metode_serah)")
    .eq("id", id)
    .single();
  if (!order) return fail("Pesanan tidak ditemukan.", 404);

  const isBuyer = order.buyer_id === user.id;
  const isSeller = order.seller_id === user.id;
  if (!isBuyer && !isSeller) return fail("Kamu bukan pihak dalam pesanan ini.", 403);
  const metode = (order.listings as unknown as { metode_serah: string }).metode_serah;

  // Update bersyarat: hanya berhasil jika status masih sesuai (mencegah balapan)
  const ubah = async (dari: string[], data: Record<string, unknown>) => {
    const { data: r } = await db.from("orders").update(data).eq("id", id).in("status", dari).select("id");
    return !!r?.length;
  };

  switch (aksi) {
    case "unggah_surat_kuasa": {
      if (!isSeller) return fail("Hanya penjual yang bisa mengunggah surat kuasa.", 403);
      if (metode !== "surat_kuasa") return fail("Tiket ini memakai metode e-ticket via email.");
      const dari = ["dibayar_tertahan", "surat_kuasa_diunggah"];
      if (!dari.includes(order.status)) return fail("Surat kuasa hanya bisa diunggah setelah pembeli membayar.", 409);
      const file = cekFile(f.get("file"), true);
      if (typeof file === "string") return fail(file);
      const path = `${id}/${namaFileAman(file!)}`;
      const up = await db.storage.from("proxy-letters").upload(path, file!, { contentType: file!.type });
      if (up.error) return fail("Gagal mengunggah: " + up.error.message, 500);
      if (!(await ubah(dari, { status: "surat_kuasa_diunggah", dikirim_pada: new Date().toISOString() })))
        return fail("Status pesanan sudah berubah.", 409);
      const catatan = String(f.get("catatan") ?? "").trim() || null;
      await db.from("proxy_letters").insert({ order_id: id, file_path: path, catatan });
      return ok();
    }

    case "tandai_terkirim": {
      if (!isSeller) return fail("Hanya penjual yang bisa menandai e-ticket terkirim.", 403);
      if (metode !== "kirim_email") return fail("Tiket ini memakai metode surat kuasa.");
      if (order.status !== "dibayar_tertahan") return fail("Pesanan belum dibayar atau sudah ditandai.", 409);
      const file = cekFile(f.get("file"), false);
      if (typeof file === "string") return fail(file);
      let bukti_kirim_path: string | null = null;
      if (file) {
        bukti_kirim_path = `${id}/${namaFileAman(file)}`;
        const up = await db.storage.from("delivery-proofs").upload(bukti_kirim_path, file, { contentType: file.type });
        if (up.error) return fail("Gagal mengunggah: " + up.error.message, 500);
      }
      const berhasil = await ubah(["dibayar_tertahan"], {
        status: "tiket_dikirim",
        bukti_kirim_path,
        dikirim_pada: new Date().toISOString(),
      });
      if (!berhasil) return fail("Status pesanan sudah berubah.", 409);
      return ok();
    }

    case "konfirmasi": {
      if (!isBuyer) return fail("Hanya pembeli yang bisa mengonfirmasi.", 403);
      const dari = metode === "surat_kuasa" ? ["surat_kuasa_diunggah"] : ["tiket_dikirim"];
      if (!dari.includes(order.status)) return fail("Penjual belum menyerahkan tiket.", 409);
      if (!(await ubah(dari, { status: "dikonfirmasi_pembeli" }))) return fail("Status pesanan sudah berubah.", 409);
      // Pencairan SIMULASI langsung setelah konfirmasi (tanpa mengirim uang)
      await cairkanDana(id, ["dikonfirmasi_pembeli"]);
      return ok();
    }

    case "laporkan": {
      const alasan = String(f.get("alasan") ?? "").trim();
      if (alasan.length < 10) return fail("Jelaskan masalahnya minimal 10 karakter.");
      const bolehDari = ["dibayar_tertahan", "surat_kuasa_diunggah", "tiket_dikirim"];
      if (!bolehDari.includes(order.status)) return fail("Pesanan ini tidak bisa dilaporkan pada status sekarang.", 409);
      const file = cekFile(f.get("file"), false);
      if (typeof file === "string") return fail(file);
      let bukti_path: string | null = null;
      if (file) {
        bukti_path = `sengketa/${id}/${namaFileAman(file)}`;
        await db.storage.from("delivery-proofs").upload(bukti_path, file, { contentType: file.type });
      }
      if (!(await ubah(bolehDari, { status: "sengketa" }))) return fail("Status pesanan sudah berubah.", 409);
      await db.from("disputes").insert({ order_id: id, pelapor_id: user.id, alasan, bukti_path });
      return ok();
    }

    case "batalkan": {
      if (!isBuyer) return fail("Hanya pembeli yang bisa membatalkan.", 403);
      if (!(await ubah(["menunggu_bayar"], { status: "dibatalkan" })))
        return fail("Pesanan yang sudah dibayar tidak bisa dibatalkan. Gunakan Laporkan masalah.", 409);
      await db.from("listings").update({ status: "aktif" }).eq("id", order.listing_id).eq("status", "dipesan");
      await cancelTransaksi(id).catch(() => null);
      return ok();
    }

    default:
      return fail("Aksi tidak dikenal.");
  }
}
