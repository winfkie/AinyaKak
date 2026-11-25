# Instagram Content Pipeline (CFDSemarang)

Dokumen ini menjelaskan fondasi koneksi Instagram + pipeline konten video.

## 1. Akun Instagram Professional dan Meta app

Worker memakai **Instagram API dengan Unified Login** (Facebook Login for Business), API host `graph.facebook.com`, dan token BISU.

### Checklist

1. Akun Instagram harus **Professional** (Business atau Creator).
2. Meta app **Project AI Opencode** memiliki use case **Manage messaging & content on Instagram** dan terhubung ke business portfolio.
3. Di **Use cases > Instagram API > API setup with Unified login**:
   - Buat/aktifkan konfigurasi dengan permission `instagram_basic` dan `instagram_content_publish`.
   - Redirect URL: `https://cfdsemarang.aidanrn06.workers.dev/api/admin/instagram/callback`.
   - Salin `config_id` dari konfigurasi yang dipilih.
4. Di **Generate access tokens**, undang akun Instagram sebagai **Instagram Tester**, lalu terima undangannya di Instagram: **Settings > Website permissions > Apps and websites > Tester Invites**.
5. Simpan Worker secret: `IG_APP_ID`, `IG_APP_SECRET`, `IG_CONFIG_ID`, `IG_TOKEN_ENC_KEY`.
6. Untuk akun di luar tester/app owner, app harus Live dan mendapat Advanced Access lewat App Review.

## 2. Endpoint Worker (fondasi)

Semua endpoint butuh header `x-admin-pin` kecuali callback OAuth.

| Method | Path | Fungsi |
|---|---|---|
| GET | `/api/admin/instagram/auth/start` | Buat URL Facebook Login for Business dengan `config_id` (state signed) |
| GET | `/api/admin/instagram/callback` | Tukar code→BISU token, ambil IG user ID, simpan terenkripsi |
| GET | `/api/admin/instagram/status` | Status akun terhubung + config + 20 job terakhir |
| POST | `/api/admin/instagram/disconnect` | Hapus akun/token dari D1 |
| POST | `/api/admin/instagram/publish` | Buat container Reels, polling, publish |
| GET | `/api/admin/instagram/jobs?code=IGJ-...` | Detail/refresh status job |
| POST | `/api/admin/instagram/jobs/publish` | Publish container yang sudah FINISHED |

### Contoh publish

```bash
curl -X POST https://cfdsemarang.aidanrn06.workers.dev/api/admin/instagram/publish \
  -H "content-type: application/json" \
  -H "x-admin-pin: <PIN>" \
  -d '{"video_url":"https://public.example.com/video.mp4","caption":"CFD Semarang minggu ini!","media_type":"REELS","share_to_feed":true}'
```

## 3. Pipeline video

### A. Google Labs Flow / Veo
- Gunakan Flow untuk ide/shot/video clip.
- Ekspor hasil ke `media/assets/` atau `media/remotion/public/`.

### B. Remotion (komposisi)
Template `CfdPromo` berdurasi 22 detik. Scene terakhir menampilkan teks
`amankan  tempatmu sekarang!` dan QR code ke situs CFDSemarang
(`public/qr-cfdsemarang.svg`) agar penonton bisa langsung scan.

```bash
cd media/remotion
npm install
npm run start
npm run render
```

### C. ElevenLabs (voiceover)
```bash
cd media/scripts
set ELEVENLABS_API_KEY=...
set ELEVENLABS_VOICE_ID=...
node generate_voiceover_elevenlabs.mjs "Pesan lapak CFD Semarang sekarang..." ../out/voiceover.mp3
```

### D. FFmpeg (mux/normalize)
```powershell
cd media/scripts
./mix_audio_ffmpeg.ps1 -VideoIn ../remotion/out/cfd-promo.mp4 -VoiceIn ../out/voiceover.mp3 -VideoOut ../out/cfd-promo-final.mp4
```

### E. Publish
Video final harus tersedia di URL publik HTTPS. Lalu panggil `/api/admin/instagram/publish`.

## 4. Batasan penting

- **Worker CPU/timeout**: publish endpoint melakukan polling singkat; kalau container belum FINISHED, job jadi `processing` dan bisa dipublish ulang lewat `/jobs/publish`.
- **Media hosting**: Meta mengambil video dari `video_url` publik. Jangan pakai file lokal langsung.
- **Token**: BISU token masa berlakunya mengikuti konfigurasi Meta. Jika kedaluwarsa, ulangi OAuth dari `/auth/start`.
- **Keamanan**: jangan simpan token di repo; pakai Worker secret + token terenkripsi D1.