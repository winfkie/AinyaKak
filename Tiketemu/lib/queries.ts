export const LISTING_SELECT =
  "id, tipe, kategori_tiket, jumlah, harga_asli, harga_jual, deskripsi, metode_serah, status, created_at, seller_id, " +
  "events!inner(id, nama_event, venue, kota, tanggal, kategori, poster_url), " +
  "profiles(id, nama, username, is_verified)";

export type Listing = {
  id: string;
  tipe: "jual" | "menfess";
  kategori_tiket: string | null;
  jumlah: number;
  harga_asli: number;
  harga_jual: number;
  deskripsi: string | null;
  metode_serah: "surat_kuasa" | "kirim_email";
  status: string;
  created_at: string;
  seller_id: string;
  events: {
    id: string;
    nama_event: string;
    venue: string | null;
    kota: string | null;
    tanggal: string | null;
    kategori: string | null;
    poster_url: string | null;
  };
  profiles: { id: string; nama: string; username: string | null; is_verified: boolean } | null;
};
