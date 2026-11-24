# Instagram Content Pipeline (CFDSemarang)

Dokumen ini menjelaskan fondasi koneksi Instagram + pipeline konten video.

## 1. Akun Instagram Professional (belum ada)

Instagram Graph API hanya mendukung akun **Professional** (Business atau Creator).

### Checklist pembuatan akun

1. Buat akun Instagram biasa (aplikasi Instagram).
2. Ubah ke Professional: **Settings > Account type and tools > Switch to professional account**.
3. Pilih **Business** atau **Creator**.
4. Buat/hubungkan Facebook Page (disarankan untuk pengelolaan Meta Business).
5. Buat Meta app di [developers.facebook.com](https://developers.facebook.com/) dan aktifkan use case Instagram API / Instagram Login sesuai mode app.
6. Tambahkan permission:
   - `instagram_business_basic`
   - `instagram_business_content_publish`
7. Isi **OAuth Redirect URI** dengan:
   - `https://cfdsemarang.aidanrn06.workers.dev/api/admin/instagram/callback`
   - Untuk lokal: `http://127.0.0.1:8788/api/admin/instagram/callback`
8. Simpan `IG_APP_ID`, `IG_APP_SECRET` sebagai Worker secret. Simpan `IG_TOKEN_ENC_KEY` (string acak panjang) untuk enkripsi token di D1.
9. Selama app mode Development, hanya role/tester yang diberi akses bisa publish; untuk akun orang lain butuh App Review/Advanced Access.

## 2. Endpoint Worker (fondasi)

Semua endpoint butuh header `x-admin-pin` kecuali callback OAuth.

| Method | Path | Fungsi |
|---|---|---|
| GET | `/api/admin/instagram/auth/start` | Buat URL OAuth Instagram (state signed) |
| GET | `/api/admin/instagram/callback` | Tukar code→short token→long-lived token, simpan terenkripsi |
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
- **Token**: token long-lived perlu refresh sebelum kedaluwarsa (belum otomatis terjadwal; fondasi refresh ada di `src/social/instagram.js`).
- **Keamanan**: jangan simpan token di repo; pakai Worker secret + token terenkripsi D1.