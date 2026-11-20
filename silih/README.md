# SILIH — Pinjam & Bertukar Busana Mahasiswa

Platform web full-stack **P2P sewa-menyewa & sirkulasi busana mahasiswa** untuk area **Tembalang & Banyumanik, Semarang**.

> **SILIH** (bukan akronim) berasal dari kata bahasa Jawa/Banjarnegara yang berarti *pinjam, bertukar, berganti*.

Dibangun dengan **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Lucide React Icons**, state terpusat di `localStorage`, dan integrasi **Midtrans Snap Sandbox** (dengan fallback simulator).

---

## ✨ Fitur Utama

- **4 peran dalam 1 aplikasi** — Penyewa, Pemilik Baju, Kurir Mahasiswa, Admin Ledger — bisa berpindah instan lewat *Top Control Bar* sticky.
- **Geofencing 3 zona** (Tembalang Inti, Tembalang Sekitar, Banyumanik) dengan matriks ongkir otomatis Rp5.000 / Rp7.000 / Rp10.000 per kaki.
- **Etalase + filter** (search, kategori, ukuran, zona).
- **Menfess reverse-marketplace** — penyewa posting kebutuhan, pemilik baju menawarkan produk tertaut.
- **Chat negosiasi & Deal Card Generator** — pemilik membuat penawaran resmi (durasi + harga final), penyewa menyetujui dan langsung checkout dengan harga terkunci.
- **Checkout terjadwal** — antar awal (instan/jadwal + slot jam) & jemput balik otomatis.
- **Escrow auto-split** — dana sewa, ongkir 2 arah, komisi platform Rp5.000 dipetakan & dilepas bertahap.
- **Tracking pesanan real-time** + tombol chat kurir & ajukan penjemputan kembali.
- **Portal kurir** — radar tiket ANTAR AWAL vs JEMPUT BALIK, notifikasi suara (Web Audio API) & pop-up browser, install PWA.
- **Admin Ledger** — GMV, pendapatan platform, escrow pemilik, dana kurir, tabel auto-split.
- **Sinkronisasi antar-tab** via `window.addEventListener("storage", ...)` dan key `silih_app_state_v1`.
- **Tombol "Reset Data Demo"** di top bar untuk mengembalikan seed saat presentasi.

---

## 🚀 Instalasi Lokal

Prasyarat: **Node.js 18+** dan npm.

```bash
# 1. Install dependency
npm install

# 2. Salin env contoh
cp .env.example .env.local

# 3. Jalankan dev server
npm run dev
```

Buka <http://localhost:3000>.

### Build produksi

```bash
npm run build
npm run start
```

Cek tipe tanpa emit:

```bash
npx tsc --noEmit
```

---

## 🔐 Konfigurasi `.env.local`

```env
MIDTRANS_SERVER_KEY=
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=
```

- **Kosongkan keduanya** → aplikasi berjalan dalam **mode SIMULASI**: tombol bayar membuka modal *Midtrans Snap Sandbox Simulator* (QRIS virtual, VA BCA, GoPay) dan seluruh alur (notifikasi kurir, escrow, dll.) tetap 100% berfungsi.
- **Isi dengan kredensial sandbox Midtrans** (dari dashboard Midtrans → Settings → Access Keys) → API route akan membuat transaksi Snap asli dan `window.snap.pay()` dipanggil.

Endpoint: `POST /api/midtrans` (`runtime = 'edge'`), payload:

```json
{ "orderId": "order_xxx", "grossAmount": 123000, "customerName": "Nadia Putri", "itemTitle": "Jas Hitam" }
```

Respons sukses: `{ "token": "...", "redirect_url": "..." }` — atau `{ "mode": "SIMULATION" }` bila key kosong.

---

## 🧭 Skenario Demo 3 Peran (5 menit)

1. **Penyewa (Nadia Putri)**
   - Tab **Etalase** → pilih *Jas Hitam Formal Sidang Skripsi* → **Sewa Sekarang**.
   - Isi checkout → **Bayar Sekarang** → selesaikan modal simulator → pesanan muncul di **Pesanan Saya** dengan status *Menunggu Kurir Antar*.
   - (Opsional) Tab **Menfess** → posting kebutuhan → lihat balasan pemilik → **Sewa Produk Ini**.
2. **Kurir (Arif Hidayat)**
   - Top bar → **Kurir** → aktifkan **Notifikasi Suara** (dengar nada ding).
   - Radar **Antar Awal** → **Ambil Tugas Ini** → klik **Tiba di Lokasi Pemilik** → **Serahkan Baju ke Penyewa**. Upah antar cair, status pesanan jadi *Sewa Berjalan*.
3. **Penyewa**
   - **Pesanan Saya** → **Ajukan Penjemputan Kembali Sekarang** → tiket **Jemput Balik** muncul di radar kurir.
4. **Kurir**
   - Ambil tiket jemput → **Tiba di Lokasi Penyewa** → **Kembalikan Baju ke Pemilik**. Upah jemput cair + dana sewa dilepas dari escrow ke saldo pemilik.
5. **Pemilik (Raka Pratama)**
   - Lihat **Saldo Tertahan** turun & **Saldo Aktif** naik. Coba **Buat Penawaran Deal** dari inbox chat.
6. **Admin**
   - Lihat **GMV**, **Pendapatan Platform (Rp5.000 × transaksi lunas)**, **Escrow**, dan tabel **auto-split**.

> Gunakan **Reset Data Demo** kapan pun untuk kembali ke kondisi awal.

---

## ☁️ Deploy ke Cloudflare Pages

1. Push repo ke GitHub (lihat bagian berikut).
2. Buka **Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git**.
3. Pilih repo, lalu set:
   - **Framework preset:** `Next.js`
   - **Build command:** `npm run build`
   - **Build output directory:** `.next`
   - **Node version:** 18+ (set env `NODE_VERSION=18` atau lebih baru)
4. Tambahkan **Environment Variables**:
   - `MIDTRANS_SERVER_KEY`
   - `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`
5. Deploy. API route `/api/midtrans` memakai `runtime = 'edge'` sehingga kompatibel dengan Cloudflare Pages Functions.

> Alternatif: **Vercel** — import repo, tambahkan env yang sama, deploy tanpa konfigurasi tambahan.

---

## 📦 Push ke GitHub

```bash
git init
git add .
git commit -m "feat: SILIH — hyperlocal P2P clothing rental"
git branch -M main
git remote add origin https://github.com/USERNAME/silih.git
git push -u origin main
```

---

## 🗂️ Struktur Proyek

```
silih/
├─ public/
│  ├─ manifest.json          # metadata PWA
│  └─ icon.svg               # ikon app (tanpa 404)
├─ src/
│  ├─ app/
│  │  ├─ api/midtrans/route.ts   # Edge API Snap Sandbox + fallback
│  │  ├─ globals.css
│  │  ├─ layout.tsx          # font, PWA, script Snap
│  │  └─ page.tsx            # router peran
│  ├─ components/
│  │  ├─ TopBar.tsx          # quick role switcher + reset
│  │  ├─ RenterView.tsx
│  │  ├─ OwnerView.tsx
│  │  ├─ CourierView.tsx
│  │  ├─ AdminLedgerView.tsx
│  │  ├─ ChatDrawer.tsx
│  │  ├─ CheckoutModal.tsx
│  │  ├─ MidtransModal.tsx   # simulator pembayaran
│  │  └─ shared.tsx
│  ├─ context/SilihContext.tsx   # state terpusat + localStorage + sync
│  ├─ data/seedData.ts       # 6 produk + 2 menfess
│  ├─ lib/
│  │  ├─ pricing.ts          # geofencing & matriks ongkir
│  │  └─ format.ts
│  └─ types/silih.ts         # skema data ketat
├─ .env.example
├─ next.config.mjs
├─ tailwind.config.ts
├─ tsconfig.json
└─ package.json
```

---

## 🎨 Sistem Desain

| Token | Nilai |
|---|---|
| Background | `#FFFFFF` |
| Surface sekunder | `#F8FAFC` |
| Primer | `#0F172A` (Slate Charcoal) |
| Aksen sukses | `#059669` (Emerald) |
| Peringatan / escrow | `#D97706` (Amber) |
| Font | Montserrat (400–700) |

---

## 📝 Catatan

- Semua data demo disimpan di `localStorage` browser (key `silih_app_state_v1`) — tidak ada database eksternal.
- Gambar produk memakai Unsplash; bila offline/gagal, otomatis jatuh ke ilustrasi SVG elegan.
- Komisi platform tetap **Rp5.000** per transaksi.
