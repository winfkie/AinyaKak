# CFDSemarang — Sewa Lapak Car Free Day Semarang

Situs pemesanan lapak (spot 3×3 m) untuk **Car Free Day Kota Semarang** yang berlangsung
setiap Minggu pagi ± 06.00–10.00 WIB di koridor Simpang Lima — Jl. Pemuda — Tugu Muda
(dan Jl. Pahlawan / Kota Lama).

Pengunjung memilih minggu dari kalender khusus Minggu, klik lapak kosong di peta
interaktif zona A–D, isi data singkat (tanpa login), dan mendapat e-tiket QR.

## Fitur

- **Peta interaktif** koridor CFD (skema, tidak berskala): zona A Simpang Lima,
  B DP Mall, C Tugu Muda/Lawang Sewu, D Jl. Pahlawan — total 68 lapak (A16·B20·C16·D16).
- **Kalender Minggu** — hanya hari Minggu, navigasi bulan, otomatis maju saat Minggu lewat.
- **Jendela pemesanan:** buka Senin 00.00, tutup **Sabtu 18.00 WIB** untuk CFD minggu berikutnya.
- **Popup lapak** — harga, status (tersedia / menunggu bayar / terisi / pesanan kamu),
  tombol "Tanya admin" dengan pesan WhatsApp berisi kode lapak.
- **E-tiket QR** — `ticket.html?code=…&date=…`, bisa dicetak/disimpan PDF.
- **Tombol WhatsApp melayang** ke admin (pesan terisi otomatis per konteks lapak).
- **Panel admin** — statistik, tabel pemesanan, filter kategori, unduh CSV.

## Struktur

```
public/            situs (dilayani sebagai static assets)
  index.html       halaman utama: hero, kalender Minggu, peta, FAQ
  ticket.html      e-tiket (?code=CFS-...&date=YYYY-MM-DD)
  admin.html       panel admin: statistik, tabel pemesanan, filter, CSV
  css/style.css    tema warna dari Lambang Kota Semarang (domain publik)
  js/config.js     konfigurasi: nomor WA admin, PIN, harga, aturan buka/tutup
  js/data.js       zona & lapak (geometri peta)
  js/app.js        peta interaktif + booking (mock localStorage)
  js/admin.js      logika panel admin (M2: sumber data → API D1)
  assets/          lambang kota (SVG)
db/schema.sql      skema database D1 (tabel bookings & zone_prices)
wrangler.jsonc     config Cloudflare Workers (assets + binding D1)
serve.json?        (tidak dipakai — lihat catatan di bawah)
```

## Menjalankan lokal

```
npx wrangler dev          # paling dekat dengan produksi (query string utuh)
npx serve public          # alternatif server statis
```

> Catatan: `npx serve` memakai clean-URL yang menghapus query string saat redirect
> `ticket.html?code=…` → `ticket`; e-tiket tetap jalan karena ada fallback
> tiket-terakhir di localStorage. Di produksi (Workers) query string utuh.

## Men-deploy

```
npx wrangler deploy       # → https://cfdsemarang.<subdomain>.workers.dev
```

## Data pemesanan

- **M1 (sekarang):** pemesanan disimpan di `localStorage` perangkat pengunjung
  (mock, key `cfdsemarang.bookings.v1`) — untuk demo tanpa backend.
- **M2:** API Cloudflare Workers + database D1 + Midtrans sandbox
  (QRIS dinamis + webhook → status "paid" hanya lewat verifikasi webhook/admin).

## Database (Cloudflare D1)

Database sudah dibuat di akun Cloudflare:

| | |
|---|---|
| Nama | `cfdsemarang-db` |
| ID   | `bb25fcac-c911-4f73-aaff-101b7ad68222` |
| Wilayah | APAC (Singapore) |
| Binding Worker | `DB` (lihat wrangler.jsonc) |

**Cara akses:**
1. **Dashboard** — login Cloudflare → *Storage & Databases* → *D1 SQL* → `cfdsemarang-db`
   (bisa lihat tabel, jalankan SQL, dan metrik dari browser).
2. **Wrangler (terminal)** —
   ```
   npx wrangler d1 execute cfdsemarang-db --remote --command "SELECT * FROM bookings"
   npx wrangler d1 execute cfdsemarang-db --remote --file=db/schema.sql   # terapkan skema
   ```

Tabel: `bookings` (1 baris per pemesanan per Minggu, unik per `spot_code + event_date`)
dan `zone_prices` (harga per zona, admin-editable di M3).

## Panel Admin

Buka `/admin.html` (tautan kecil juga ada di footer situs).

- **PIN M1:** `123456` — ganti di `public/js/config.js` (`adminPin`) sebelum publik.
  Login/session nyata menyusul di M3.
- **Statistik:** total pemesanan, lunas, menunggu bayar, dana masuk.
- **Kategori per field form:** filter Minggu, jenis usaha, status bayar + pencarian bebas;
  ringkasan jumlah per jenis usaha.
- **Tabel:** Minggu · Kode · Lapak · Nama · Jenis usaha · WhatsApp (klik = chat) ·
  **Status bayar** (LUNAS / MENUNGGU) · waktu pesan.
- **Unduh CSV** hasil filter (pemisah `;`, UTF-8 BOM — aman dibuka di Excel).
- M1 membaca data perangkat ini (mock). Di M2 sumbernya jadi API + D1 sehingga
  data dari semua pengunjung terlihat.

## Roadmap

- **M1 (sekarang)** — situs statis: peta, kalender, booking mock, e-tiket, panel admin.
- **M2** — API Workers + D1 + Midtrans sandbox (QRIS dinamis + webhook).
- **M3** — login admin nyata, harga per zona, domain produksi.

## TODO sebelum publik

- [ ] Ganti `waMeNumber` di `public/js/config.js` dengan nomor WhatsApp admin asli.
- [ ] Ganti PIN admin (`adminPin`) di `public/js/config.js`.
- [ ] Midtrans sandbox keys (M2).
- [ ] Konfirmasi jadwal/jam CFD terbaru dari PPID Kota Semarang.

## Kredit & legal

- Video suasana CFD: YouTube "4K~ Simpang Lima Semarang Car Free Day" (embed, youtube-nocookie).
- Lambang Kota Semarang: [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Seal_of_the_City_of_Semarang.svg)
  — domain publik (UU 28/2014 Pasal 43).
- Bukan situs resmi Pemerintah Kota Semarang — layanan pemesanan independen.
