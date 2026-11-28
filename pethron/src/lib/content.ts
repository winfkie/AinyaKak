export const GUEST_SESSIONS_KEY = "pethron_guest_sessions";
export const USER_ACCOUNT_KEY = "pethron_user_account";

export const PERSONAS = [
  {
    id: "vc-fair",
    name: "VC Kritis tapi Fair",
    focus: "Unit economics, traction, dan moat",
    tone: "Tegas tapi terbuka kalau logikanya masuk akal.",
  },
  {
    id: "dosen-detail",
    name: "Dosen Penguji Detail",
    focus: "Metodologi, landasan teori, dan validitas data",
    tone: "Telaten, ngejar celah metodologis sampai ketemu.",
  },
  {
    id: "juri-nasional",
    name: "Juri Lomba Nasional",
    focus: "Kesiapan pitch, alur cerita, dan konsistensi data",
    tone: "Pertanyaan cepat dan tajam, tapi tetap fair.",
  },
] as const;

export const SESSION_TYPES = [
  {
    id: "startup",
    label: "Startup / Business Plan Pitch",
    hint: "Pitch ke investor, juri business plan, atau mentor startup.",
  },
  {
    id: "business-case",
    label: "Business Case Competition",
    hint: "Analisis kasus: strategi, risiko, dan keputusan bisnis.",
  },
  {
    id: "thesis",
    label: "Sidang Skripsi / Karya Ilmiah",
    hint: "Presentasi riset plus tanya jawab akademik yang ketat.",
  },
] as const;

export const DURATIONS = [
  { label: "3 menit", value: 180 },
  { label: "5 menit", value: 300 },
  { label: "10 menit", value: 600 },
] as const;

export const LANGUAGES = [
  { id: "id", label: "Bahasa Indonesia", locale: "id-ID" },
  { id: "en", label: "English", locale: "en-US" },
] as const;

export const SAMPLE_DECKS = [
  {
    id: "sim-panen",
    label: "SIM-PANEN — marketplace hasil tani",
    kind: "startup" as const,
    personaId: "vc-fair",
    duration: 300,
    notes: `SIM-PANEN adalah marketplace hasil tani yang menghubungkan distributor dengan petani lokal.

Masalah: petani cuma dapat 30% margin karena rantai distribusi panjang, sementara pembeli sering kecewa karena kualitas nggak konsisten dan update logistik lambat.

Solusi: SIM-PANEN menyatukan distribusi, standardisasi grading, dan same-day delivery dalam radius 15 km. Restock otomatis untuk pembeli langganan.

Model bisnis: komisi 6% per transaksi, subscription Rp149.000/bulan untuk pembeli bisnis, plus biaya promosi untuk supplier.

Traction: 1.240 transaksi per bulan, repeat rate 42%, GMV Rp380 juta bulan lalu. Unit economics: contribution margin 18% per order, CAC Rp21.000, LTV Rp187.000, payback 4,3 bulan.

Risiko: onboarding petani butuh waktu, dan notifikasi panen harus tepat waktu supaya stok nggak kosong.`,
  },
  {
    id: "reuse-pack",
    label: "ReusePack — kemasan reusable F&B",
    kind: "business-case" as const,
    personaId: "juri-nasional",
    duration: 180,
    notes: `ReusePack menyediakan sistem kemasan reusable untuk retail F&B, menggantikan packaging sekali pakai.

Konteks: 78% sampah plastik dari F&B adalah cup dan kemasan sekali pakai yang sulit didaur ulang.

Value proposition: kit reusable dengan standar sanitasi berbasis IoT, biaya Rp450 per pemakaian vs Rp900 sekali pakai.

Proyeksi: dalam 3 tahun revenue Rp2,4 miliar, EBITDA margin 14% di tahun ketiga. Capex awal Rp850 juta untuk 1.200 unit.

Competitive moat: integrasi dengan 40 gerai F&B dan standar sanitasi terakreditasi.

Risiko terbesar: adopsi merchant butuh perubahan operasional, dan permintaan turun di Q2.`,
  },
  {
    id: "tutor-ai",
    label: "TutorAI — pembelajaran adaptif",
    kind: "thesis" as const,
    personaId: "dosen-detail",
    duration: 600,
    notes: `Penelitian tesis: TutorAI, pendekatan spaced-repetition adaptif untuk mahasiswa teknik.

Rumusan masalah: metode belajar yang seragam tidak konsisten untuk kemampuan awal yang berbeda. Hipotesis: adaptive sequencing berbasis learner model meningkatkan retensi 23% dibanding jadwal statis.

Metode: quasi-experiment, 118 mahasiswa, 2 arm, 8 minggu. Instrumen: pre-post test dan retention test dengan delay 4 minggu.

Hasil: retensi kelompok adaptif 71% vs 48% kontrol (p<0.01), transfer test 64% vs 41%. Keterbatasan: satu institusi, engagement self-report, durasi 8 minggu.

Kontribusi: model ESI yang menggabungkan prior knowledge dan kurva kelelahan dalam satu scheduler.`,
  },
];

export const FILLER_WORDS = [
  "eee",
  "anu",
  "kayak",
  "mungkin",
  "jujur",
  "um",
  "like",
  "hmm",
  "gitu",
  "gini",
  "sebenarnya",
  "kira-kira",
];
