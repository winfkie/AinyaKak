export function rupiah(n: number | null | undefined) {
  return "Rp" + (n ?? 0).toLocaleString("id-ID");
}

export function tanggal(d: string | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function waktu(d: string | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const STATUS_ORDER: Record<string, { label: string; warna: string }> = {
  menunggu_bayar: { label: "Menunggu pembayaran", warna: "bg-amber-100 text-amber-800" },
  kedaluwarsa: { label: "Kedaluwarsa", warna: "bg-gray-200 text-gray-700" },
  dibayar_tertahan: { label: "Dibayar, dana tertahan", warna: "bg-blue-100 text-blue-800" },
  surat_kuasa_diunggah: { label: "Surat kuasa diunggah", warna: "bg-indigo-100 text-indigo-800" },
  tiket_dikirim: { label: "E-ticket dikirim", warna: "bg-indigo-100 text-indigo-800" },
  dikonfirmasi_pembeli: { label: "Dikonfirmasi pembeli", warna: "bg-teal-100 text-teal-800" },
  dicairkan: { label: "Selesai, dana dicairkan", warna: "bg-green-100 text-green-800" },
  sengketa: { label: "Sengketa", warna: "bg-red-100 text-red-800" },
  refund: { label: "Dana dikembalikan", warna: "bg-gray-200 text-gray-700" },
  dibatalkan: { label: "Dibatalkan", warna: "bg-gray-200 text-gray-700" },
};

export const STATUS_LISTING: Record<string, string> = {
  aktif: "Aktif",
  dipesan: "Sedang dipesan",
  terjual: "Terjual",
  batal: "Dibatalkan",
};

export const METODE_SERAH: Record<string, { label: string; info: string }> = {
  surat_kuasa: {
    label: "Surat kuasa",
    info: "Penjual mengirim surat kuasa bermaterai Rp10.000 + fotokopi KTP pemilik tiket. Dipakai untuk event yang menukar e-voucher dengan wristband dan mencocokkan nama di KTP.",
  },
  kirim_email: {
    label: "E-ticket via email",
    info: "Penjual meneruskan e-ticket/QR ke email kamu. Dipakai untuk event yang tiketnya bisa langsung dipindai tanpa dokumen khusus.",
  },
};

export const KATEGORI_EVENT = ["Konser", "Festival", "Olahraga", "Teater", "Stand-up", "Seminar", "Lainnya"];

/** Status order yang dananya masih tertahan di platform */
export const STATUS_TERTAHAN = [
  "dibayar_tertahan",
  "surat_kuasa_diunggah",
  "tiket_dikirim",
  "dikonfirmasi_pembeli",
  "sengketa",
];
