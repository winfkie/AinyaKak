import { createAdminClient } from "@/lib/supabase/admin";
import { cekFile, fail, namaFileAman, ok, requireUser } from "@/lib/http";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return fail("Silakan login dulu.", 401);

  const f = await req.formData();
  const s = (k: string) => String(f.get(k) ?? "").trim();

  const nama_event = s("nama_event");
  const tipe = s("tipe") === "menfess" ? "menfess" : "jual";
  const metode_serah = s("metode_serah") === "kirim_email" ? "kirim_email" : "surat_kuasa";
  const harga_asli = Math.round(Number(s("harga_asli")));
  const harga_jual = Math.round(Number(s("harga_jual")));
  const jumlah = Math.round(Number(s("jumlah") || 1));
  const tanggal = s("tanggal");

  if (!nama_event) return fail("Nama event wajib diisi.");
  if (!tanggal || isNaN(Date.parse(tanggal))) return fail("Tanggal event tidak valid.");
  if (!Number.isFinite(harga_asli) || harga_asli <= 0) return fail("Harga asli tidak valid.");
  if (!Number.isFinite(harga_jual) || harga_jual < 1000) return fail("Harga jual minimal Rp1.000.");
  if (harga_jual > harga_asli) return fail("Harga jual tidak boleh melebihi harga asli (aturan anti calo).");
  if (!Number.isFinite(jumlah) || jumlah < 1 || jumlah > 10) return fail("Jumlah tiket 1 sampai 10.");

  const file = cekFile(f.get("bukti"), true);
  if (typeof file === "string") return fail(file);

  const db = createAdminClient();

  const path = `${user.id}/${namaFileAman(file!)}`;
  const up = await db.storage.from("ticket-proofs").upload(path, file!, { contentType: file!.type });
  if (up.error) return fail("Gagal mengunggah bukti: " + up.error.message, 500);

  const { data: event, error: e1 } = await db
    .from("events")
    .insert({
      nama_event,
      venue: s("venue") || null,
      kota: s("kota") || null,
      tanggal,
      kategori: s("kategori") || "Lainnya",
    })
    .select("id")
    .single();
  if (e1) return fail(e1.message, 500);

  const { data: listing, error: e2 } = await db
    .from("listings")
    .insert({
      seller_id: user.id,
      event_id: event.id,
      tipe,
      kategori_tiket: s("kategori_tiket") || null,
      jumlah,
      harga_asli,
      harga_jual,
      deskripsi: s("deskripsi") || null,
      bukti_beli_path: path,
      metode_serah,
    })
    .select("id")
    .single();
  if (e2) return fail(e2.message, 500);

  return ok({ id: listing.id });
}
