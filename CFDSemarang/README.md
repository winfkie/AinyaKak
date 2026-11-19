# CFDSemarang — Sewa Lapak Car Free Day Semarang

Situs pemesanan lapak (spot 3×3 m) untuk **Car Free Day Kota Semarang** yang berlangsung
setiap Minggu pagi ± 06.00–10.00 WIB di koridor Simpang Lima — Jl. Pemuda — Tugu Muda
(dan Jl. Pahlawan / Kota Lama).

Pengunjung memilih minggu dari kalender Minggu, klik lapak kosong di peta interaktif
zona A–D, isi data singkat (tanpa login), lalu membayar QRIS lewat Midtrans.
E-tiket dengan QR terbit otomatis setelah pembayaran terverifikasi.

## Status

- **M1** — situs statis, booking demo di localStorage.
- **M2 (sekarang)** — API Cloudflare Workers + D1 + Midtrans Snap (sandbox):
  ketersediaan lapak dari server, booking pending, webhook pembayaran, panel admin
  dengan data nyata dan aksi ubah status.
- **M3** — login admin nyata, harga per zona, domain produksi, Midtrans production.

## Fitur

- **Peta interaktif** koridor CFD (skema, tidak berskala): zona A Simpang Lima,
  B DP Mall, C Tugu Muda/Lawang Sewu, D Jl. Pahlawan — total 68 lapak (A16·B20·C16·D16).
- **Ketersediaan real-time** dari database (semua perangkat melihat status yang sama).
- **Kalender Minggu** — hanya hari Minggu, navigasi bulan, otomatis maju saat Minggu lewat.
- **Jendela pemesanan:** buka Senin 00.00, tutup **Sabtu 18.00 WIB** (dicek di server).
- **Pembayaran QRIS** lewat Midtrans Snap; status "lunas" hanya dari webhook
  terverifikasi (signature SHA-512) atau aksi admin.
- **E-tiket QR** — `ticket.html?code=…`, status menunggu/lunas/batal, tombol bayar ulang.
- **Panel admin** — statistik, filter, pencarian, CSV, dan aksi *tandai lunas / batalkan*.
- **Tombol WhatsApp melayang** ke admin (pesan terisi otomatis per konteks lapak).

## Struktur

```
src/index.js           API Worker: status, booking, webhook Midtrans, admin
public/                situs (static assets)
  index.html           hero, kalender Minggu, peta, FAQ
  ticket.html          e-tiket (data dari API)
  admin.html           panel admin
  css/style.css        tema warna Lambang Kota Semarang (domain publik)
  js/config.js         nomor WA admin, harga tampilan, jam tutup
  js/data.js           zona & lapak (geometri peta)
  js/app.js            peta + booking (fetch API)
  js/admin.js          panel admin (fetch API + PIN server)
  assets/              lambang kota (SVG)
db/schema.sql          skema D1 (bookings, zone_prices)
cloudflare.config.ts   konfigurasi Worker: binding D1, secrets, routing /api/*
wrangler.config.ts     build settings bundler Wrangler (direktori aset)
wrangler.jsonc         dipakai hanya untuk perintah D1 lokal (`wrangler d1 execute`)
```

## API

| Method | Path | Keterangan |
|---|---|---|
| GET | `/api/status?date=YYYY-MM-DD` | Peta ketersediaan lapak (`taken`) + harga |
| POST | `/api/book` | Buat booking `{date, spot, name, type, wa}` → Snap |
| GET | `/api/booking?code=…` | Detail tiket (dipakai halaman tiket) |
| POST | `/api/midtrans/webhook` | Notifikasi pembayaran (signature diverifikasi) |
| GET | `/api/admin/bookings` | Daftar semua booking (header `x-admin-pin`) |
| POST | `/api/admin/update` | Ubah status `{code, status}` (header `x-admin-pin`) |

## Menjalankan lokal

```bash
npm install
npm run schema:local      # terapkan skema ke D1 lokal (.cloudflare/state)
npm run dev               # cf dev → http://127.0.0.1:8788
```

Rahasia untuk lokal disimpan di **`.dev.vars`** (tidak di-commit — lihat `.dev.vars.example`):

```
MIDTRANS_SERVER_KEY=Mid-server-...
ADMIN_PIN=123456
```

## Men-deploy

```bash
cf deploy                 # build + upload Worker, aset, binding
```

Rahasia di produksi disimpan sebagai Worker secret (bukan di file):

```bash
cf workers secrets update MIDTRANS_SERVER_KEY --text "Mid-server-..."
cf workers secrets update ADMIN_PIN --text "PIN-baru-anda"
```

Setelah deploy, atur **Payment Notification URL** di dashboard Midtrans ke:

```
https://cfdsemarang.aidanrn06.workers.dev/api/midtrans/webhook
```

## Database (Cloudflare D1)

| | |
|---|---|
| Nama | `cfdsemarang-db` |
| ID   | `bb25fcac-c911-4f73-aaff-101b7ad68222` |
| Wilayah | APAC (Singapore) |
| Binding | `DB` |

Akses: dashboard Cloudflare → *Storage & Databases* → *D1 SQL*, atau

```bash
cf d1 query bb25fcac-c911-4f73-aaff-101b7ad68222 --sql "SELECT * FROM bookings"
```

Tabel: `bookings` (unik per `spot_code + event_date`) dan `zone_prices`.

### Upgrade skema pada database lama

`CREATE TABLE IF NOT EXISTS` tidak menambah kolom ke tabel yang sudah ada. Kalau
database dibuat sebelum kolom `snap_url` ada, jalankan sekali:

```bash
cf d1 query bb25fcac-c911-4f73-aaff-101b7ad68222 --sql "ALTER TABLE bookings ADD COLUMN snap_url TEXT"
```

## Panel Admin

Buka `/admin.html` (tautan kecil juga ada di footer situs). Masukkan **PIN admin** —
PIN diverifikasi di server lewat secret `ADMIN_PIN`, bukan di file publik.

- **Statistik:** total pemesanan, lunas, menunggu bayar, dana masuk.
- **Filter:** Minggu, jenis usaha, status bayar, pencarian bebas.
- **Tabel:** kode, lapak, nama, jenis usaha, WhatsApp, biaya, status, waktu pesan.
- **Aksi:** *Tandai lunas* / *Batalkan* (tercatat di server).
- **CSV** hasil filter (pemisah `;`, UTF-8 BOM).

## Roadmap

- **M2 (sekarang)** — API + D1 + Midtrans sandbox, panel admin berbasis server.
- **M3** — login admin (hash + sesi), harga per zona yang bisa diedit, domain produksi,
  Midtrans production + NPWP.

## TODO sebelum publik

- [ ] Ganti `MIDTRANS_SERVER_KEY` dengan server key sandbox yang valid
      (key saat ini ditolak Midtrans dengan `401 Unauthorized`).
- [ ] Atur Payment Notification URL di dashboard Midtrans.
- [ ] Ganti `ADMIN_PIN` sebelum situs dipakai publik.
- [ ] Aktifkan QRIS di akun Midtrans (butuh NPWP) atau pakai fallback manual
      (`ALLOW_MANUAL_FALLBACK=true` di `cloudflare.config.ts`).
- [ ] Konfirmasi jadwal/jam CFD terbaru dari PPID Kota Semarang.

## Kredit & legal

- Video suasana CFD: YouTube "4K~ Simpang Lima Semarang Car Free Day" (embed, youtube-nocookie).
- Lambang Kota Semarang: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Seal_of_the_City_of_Semarang.svg)
  — domain publik (UU 28/2014 Pasal 43).
- Bukan situs resmi Pemerintah Kota Semarang — layanan pemesanan independen.
