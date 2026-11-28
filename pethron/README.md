# Pethron

Simulator latihan pitch, business case, dan sidang skripsi. Rekam suara, dapet skor kesiapan 0–10, audit filler words, lalu dibantai 3 pertanyaan juri AI plus Golden Answer.

Dibangun dengan Next.js 16 (App Router, TypeScript, Tailwind CSS 4), Gemini untuk analisis bahasa, dan Sumopod Dynamic QRIS untuk pembayaran.

---

## 1. Jalanin lokal

```bash
npm install
cp .env.example .env.local   # lalu isi key-nya
npm run dev                  # http://localhost:3000
```

Build produksi:

```bash
npm run build
npm run start
```

Lint:

```bash
npm run lint
```

Aplikasi tetap jalan **tanpa** `GEMINI_API_KEY`: `/api/analyze-pitch` otomatis pakai analyzer deterministik lokal (`src/lib/analyzer.ts`), dan field `audit.source` bernilai `"fallback"`. Tanpa `SUMOPOD_API_KEY`, checkout menampilkan banner konfigurasi plus struktur payload QRIS yang bakal dikirim, bukan QR palsu.

## 2. Environment variables

| Variable | Wajib | Default | Fungsi |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | tidak | — | Key Google AI Studio. Tanpa ini analisis pakai fallback lokal. |
| `GEMINI_MODEL` | tidak | `gemini-2.0-flash` | Model Gemini yang dipakai. |
| `SUMOPOD_API_KEY` | ya (buat bayar) | — | API key dashboard Sumopod. |
| `SUMOPOD_MERCHANT_ID` | ya (buat bayar) | — | Merchant ID Sumopod. |
| `SUMOPOD_BASE_URL` | tidak | `https://api.sumopod.com/v1` | Base URL API Sumopod. |
| `SUMOPOD_QRIS_PATH` | tidak | `/qris/create` | Path pembuatan QRIS dinamis. |
| `SUMOPOD_STATUS_PATH` | tidak | `/qris/status/{orderId}` | Path cek status transaksi. |
| `SUMOPOD_WEBHOOK_SECRET` | disarankan | — | Secret HMAC-SHA256 buat verifikasi webhook. Kalau kosong, webhook diterima dengan warning di log (biar gampang testing lokal). |

Ambil key Gemini di <https://aistudio.google.com/app/apikey>, key Sumopod di dashboard merchant Sumopod. Kalau kontrak endpoint Sumopod kamu beda, cukup override `SUMOPOD_QRIS_PATH` / `SUMOPOD_STATUS_PATH` — route membaca field response secara toleran (`qr_string`, `qrString`, `data.qr_code`, dst).

## 3. Alur produk

1. **Guest mode dulu.** `/studio` dan `/history` langsung bisa dipakai tanpa login. Sesi guest disimpan di `localStorage` key `pethron_guest_sessions`.
2. **Auth baru muncul saat perlu.** Klik "Simpan Akun Permanen" atau upgrade paket → modal login/register (ada tombol **1-Click Demo Account**). Setelah sukses, semua sesi guest dimigrasi ke `pethron_user_account` dan key guest dibersihkan.
3. **Studio 4 langkah:** kalibrasi (tipe sesi, durasi, bahasa, persona juri, catatan deck + 3 sample deck) → rekam suara (Web Speech API, waveform, timer, fallback ketik transkrip) → audit delivery (skor 0–10, filler, WPM, narrative check, rewrite) → Q&A adversarial (3 pertanyaan dibacakan TTS, jawaban dinilai, Golden Answer). Laporan disimpan ke history.
4. **History:** grafik progres skor, statistik, detail expandable per sesi, export markdown, hapus sesi.
5. **Pricing:** Free / Pro Solo Rp29.000 / Team Pack Rp69.000 dengan checkout QRIS dinamis.

## 4. Struktur

```
src/
  app/
    page.tsx                    landing
    studio/page.tsx             studio (client orchestrator)
    history/page.tsx            analytics + laporan
    pricing/page.tsx            paket + checkout
    api/analyze-pitch/route.ts  audit | questions | answer
    api/sumopod/create-qris/    bikin QRIS dinamis
    api/sumopod/check-status/   polling status
    api/sumopod/webhook/        callback pembayaran
  components/
    AuthProvider.tsx  AuthModal.tsx  Navbar.tsx
    ScoreRing.tsx  MicWave.tsx  ScorecardPreview.tsx
    studio/     CalibrationStep, RecordStep, AuditStep, QAStep, StudioClient
    history/    HistoryClient
    pricing/    PricingClient, CheckoutModal
  lib/
    analyzer.ts            analyzer + evaluator + question generator (fallback)
    content.ts             persona, tipe sesi, durasi, sample deck, filler list
    plans.ts  types.ts     domain types & paket harga
    store.ts               localStorage: guest, akun, migrasi, limit, sesi
    payment-store.ts       catatan order QRIS + normalisasi status
    useSpeechRecognition.ts  utils.ts  speech.d.ts
```

## 5. API

### `POST /api/analyze-pitch`

Body: `{ mode, transcript, language, sessionType, persona, durationSec?, pitchNotes?, question?, answer? }`

- `mode: "audit"` → `{ ok, audit: AuditResult }`
- `mode: "questions"` → `{ ok, questions: QAQuestion[] }` (3 pertanyaan, level ringan/menengah/berat)
- `mode: "answer"` → `{ ok, evaluation: QAEvaluation }` (skor + feedback + goldenAnswer)

Semua skor di-clamp 1–10 dan `wordCount`/`wpm` dihitung ulang di server, bukan dipercaya dari model.

### `POST /api/sumopod/create-qris`

Body: `{ planId, planName, amount, customerName, customerEmail }` → `{ ok, orderId, amount, qrString, qrImageUrl, payload, configMissing? }`

Order ID format: `PETHRON-<plan>-<base36 timestamp>-<random>`. Nominal divalidasi terhadap paket (29.000 / 69.000), bukan dari input bebas.

### `GET /api/sumopod/check-status?orderId=...`

→ `{ ok, orderId, status: "PENDING" | "PAID" | "EXPIRED" | "FAILED", paidAt }`. Status dinormalisasi dari berbagai bentuk upstream (`PAID`, `SETTLED`, `SUCCESS`, `EXPIRE`, dst).

### `POST /api/sumopod/webhook`

Verifikasi `x-sumopod-signature` (HMAC-SHA256 hex atas raw body). Saat status jadi `PAID`, record order di-update dan klien yang sedang polling langsung melihat paket aktif.

## 6. Catatan produksi

- Akun dan sesi disimpan di `localStorage` (sesuai alur guest-first). Untuk multi-device, ganti `src/lib/store.ts` dengan backend auth + DB.
- `src/lib/payment-store.ts` menyimpan order di memori proses + file `.pethron-data/payments.json` supaya dev restart nggak kehilangan order. Di produksi (serverless / Cloudflare Pages) ganti dengan KV, D1, Redis, atau Postgres — jangan andalkan filesystem.
- Webhook harus diarahkan ke URL publik (`https://domain-kamu/api/sumopod/webhook`); `localhost` nggak bisa dipanggil Sumopod.
- `next.config.ts` sengaja tanpa `output: "export"` karena API routes butuh server. Untuk Cloudflare Pages pakai `@cloudflare/next-on-pages`.
- Password akun lokal disimpan apa adanya untuk demo. Jangan dipakai sebagai auth produksi.

## 7. Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · motion · lucide-react · @google/generative-ai · qrcode.react

Font: Bricolage Grotesque (heading), DM Sans (body), JetBrains Mono (skor & timer) via `next/font/google`.
