import type { ClothingItem, MenfessPost } from "@/types/silih";

const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=640&q=80`;

export const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='800' viewBox='0 0 640 800'>
      <rect width='640' height='800' fill='#F8FAFC'/>
      <rect x='1' y='1' width='638' height='798' fill='none' stroke='#E2E8F0' stroke-width='2'/>
      <path d='M320 210 L400 250 L400 330 L370 330 L370 560 L270 560 L270 330 L240 330 L240 250 Z' fill='#CBD5E1'/>
      <rect x='285' y='240' width='70' height='70' rx='35' fill='#0F172A'/>
      <text x='320' y='640' text-anchor='middle' font-family='Montserrat,Arial' font-size='34' font-weight='700' fill='#0F172A'>SILIH</text>
      <text x='320' y='680' text-anchor='middle' font-family='Montserrat,Arial' font-size='16' fill='#64748B'>Foto Busana tidak tersedia</text>
    </svg>`
  );

export const seedItems: ClothingItem[] = [
  {
    id: "item_jas_slimfit",
    title: "Jas Hitam Formal Sidang Skripsi (Slim Fit)",
    category: "Jas & Blazer",
    size: "L",
    pricePerDay: 35000,
    maxDays: 4,
    ownerName: "Raka Pratama",
    zone: "ZONA_1",
    subArea: "Sirojudin",
    addressDetail: "Jl. Sirojudin Gang 3, Kos Putra Al-Ikhlas",
    imageUrl: U("photo-1594938298603-c8148c4dae35"),
    description:
      "Jas slim fit hitam, bahan wol campuran, setrika rapi. Cocok buat sidang skripsi & wisuda. Include dasi hitam polos.",
    isAvailable: true,
    availableUntilText: "Ready sampai akhir bulan ini"
  },
  {
    id: "item_kebaya_sage",
    title: "Kebaya Modern Wisuda Sage Green + Rok Lilit",
    category: "Kebaya & Batik",
    size: "M",
    pricePerDay: 55000,
    maxDays: 3,
    ownerName: "Anisa Larasati",
    zone: "ZONA_1",
    subArea: "Banjarsari",
    addressDetail: "Jl. Banjarsari Selatan No. 21, Kos Putri Melati",
    imageUrl: U("photo-1611042553365-9b101441c135"),
    description:
      "Kebaya modern brokat sage green, rok lilit nada senada. Sudah include inner & bros. Nyaman, tidak transparan.",
    isAvailable: true,
    availableUntilText: "Ready, cek jadwal dulu sebelum booking"
  },
  {
    id: "item_blazer_cream",
    title: "Blazer Wanita Oversize Cream Presentasi",
    category: "Jas & Blazer",
    size: "M",
    pricePerDay: 30000,
    maxDays: 5,
    ownerName: "Raka Pratama",
    zone: "ZONA_1",
    subArea: "Gondang",
    addressDetail: "Jl. Gondang Raya RT 04, depan Indomaret",
    imageUrl: U("photo-1593030103066-0093718efeb9"),
    description:
      "Blazer oversize warna cream, bahan tweed lembut. Pas buat presentasi PKM, interview, atau acara formal kampus.",
    isAvailable: true,
    availableUntilText: "Ready setiap hari"
  },
  {
    id: "item_batik_semarangan",
    title: "Batik Tulis Semarangan Lengan Panjang",
    category: "Kebaya & Batik",
    size: "XL",
    pricePerDay: 30000,
    maxDays: 4,
    ownerName: "Dimas Saputra",
    zone: "ZONA_2",
    subArea: "Bulusan",
    addressDetail: "Jl. Bulusan Permai No. 7",
    imageUrl: U("photo-1602810318383-e386cc2a3ccf"),
    description:
      "Batik tulis asli Semarangan, motif parang modern, lengan panjang. Cocok buat acara dinas, kuliah, atau kondangan siang.",
    isAvailable: true,
    availableUntilText: "Ready, kecuali sedang dipakai acara kampus"
  },
  {
    id: "item_dress_dusty",
    title: "Dress Midi Kondangan Dusty Pink",
    category: "Dress & Formal",
    size: "S",
    pricePerDay: 45000,
    maxDays: 3,
    ownerName: "Clarissa Putri",
    zone: "ZONA_3",
    subArea: "Ngesrep",
    addressDetail: "Jl. Ngesrep Baru No. 12, Kos Wanita Amanah",
    imageUrl: U("photo-1539109136881-3be0616acf4b"),
    description:
      "Dress midi dusty pink, bahan rayon premium, ada lengan balon & resleting belakang. Include sabuk tali pinggang.",
    isAvailable: true,
    availableUntilText: "Ready akhir pekan & hari kerja"
  },
  {
    id: "item_setelan_interview",
    title: "Setelan Kemeja Putih & Celana Bahan Interview",
    category: "Kostum & Almamater",
    size: "L",
    pricePerDay: 25000,
    maxDays: 5,
    ownerName: "Raka Pratama",
    zone: "ZONA_1",
    subArea: "Baskoro",
    addressDetail: "Jl. Baskoro No. 3, dekat JCO Tempura",
    imageUrl: U("photo-1620012253295-c15cc0e7fa22"),
    description:
      "Setelan kemeja putih lengan panjang + celana bahan hitam slim. Anti-kusut, cocok buat interview magang & job fair.",
    isAvailable: true,
    availableUntilText: "Ready sampai akhir semester"
  }
];

export const seedMenfess: MenfessPost[] = [
  {
    id: "menfess_seed_1",
    authorName: "Dewi Anggraini",
    zone: "ZONA_1",
    subArea: "Mulawarman",
    content:
      "Guys, butuh kebaya buat wisuda kakak tanggal 28 nanti. Warnanya bebas asal elegan, budget mepet banget soalnya. Ada yang ready sekitar Mulawarman?",
    budgetPerDay: 40000,
    neededDate: "2026-11-28",
    createdAt: "2026-11-19T09:15:00.000Z",
    replies: [
      {
        id: "reply_seed_1",
        ownerName: "Anisa Larasati",
        clothingItemId: "item_kebaya_sage",
        message:
          "Kebaya sage green plus rok lilit ready kak, bisa nego dikit. Lokasi cuma seberang di Banjarsari, gampang diantar kurir SILIH.",
        createdAt: "2026-11-19T09:40:00.000Z"
      }
    ]
  },
  {
    id: "menfess_seed_2",
    authorName: "Bagas Wicaksono",
    zone: "ZONA_3",
    subArea: "Srondol Wetan",
    content:
      "Cari jas hitam ukuran L buat sidang pekan depan. Kalau ada yang bisa disewa 2 hari, tolong reply ya. Terima kasih banyak SILIH.",
    budgetPerDay: 30000,
    neededDate: "2026-11-26",
    createdAt: "2026-11-19T14:05:00.000Z",
    replies: [
      {
        id: "reply_seed_2",
        ownerName: "Raka Pratama",
        clothingItemId: "item_jas_slimfit",
        message:
          "Jas slim fit L ready bang, include dasi. Bisa deal 2 hari, tarif pas di budget kamu.",
        createdAt: "2026-11-19T14:22:00.000Z"
      }
    ]
  }
];

export const DEMO_PROFILES = {
  RENTER: {
    name: "Nadia Putri",
    zone: "ZONA_1" as const,
    subArea: "Banjarsari",
    addressDetail: "Jl. Banjarsari Selatan No. 14"
  },
  OWNER: {
    name: "Raka Pratama",
    zone: "ZONA_1" as const,
    subArea: "Sirojudin",
    addressDetail: "Jl. Sirojudin Gang 3"
  },
  COURIER: {
    name: "Arif Hidayat",
    zone: "ZONA_1" as const,
    subArea: "Tembalang",
    addressDetail: "Mahasiswa Undip • Motor Vario"
  },
  ADMIN: {
    name: "Admin Ledger",
    zone: "ZONA_1" as const,
    subArea: "Platform",
    addressDetail: "Kas Platform SILIH"
  }
};

export const TIME_SLOTS = ["08.00", "10.00", "13.00", "16.00", "18.30", "20.00"];
