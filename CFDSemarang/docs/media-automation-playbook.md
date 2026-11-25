# Playbook Otomasi Media CFDSemarang

Dokumen ini menyiapkan prosedur koneksi **ElevenLabs + Remotion + FFmpeg + Google Flow + R2 + Instagram Worker**.  
R2 belum diaktifkan sekarang; langkah R2 ditandai **NANTI**.

## Status saat ini

- **Instagram OAuth Worker:** terhubung (`@cfdsemarang_project`).
- **FFmpeg lokal:** terdeteksi.
- **Node/npm:** terdeteksi.
- **R2:** belum aktif (blokir `video_url` publik).
- **ElevenLabs:** butuh `ELEVENLABS_API_KEY` dan `ELEVENLABS_VOICE_ID`.
- **Google Flow/Veo:** butuh akses akun dan proses ekspor aset manual/semi-manual.

## 1) Siapkan env lokal

1. Salin `media/.env.example` menjadi `media/.env`.
2. Isi minimal:
   - `ELEVENLABS_API_KEY`
   - `ELEVENLABS_VOICE_ID` (suara pria, muda, santai)
   - `ADMIN_PIN`
3. Jangan commit `media/.env`.

## 2) Google Flow / Veo (aset visual)

Google Flow saat ini dipakai sebagai **sumber aset**, bukan API publish langsung di repo ini.

1. Buka Google Labs Flow/Veo.
2. Pakai prompt dari `media/flow/asset-manifest.json`.
3. Ekspor footage 9:16 (1080×1920 bila memungkinkan).
4. Simpan file ke `media/assets/flow/` sesuai `targetPath`.
5. Verifikasi lisensi/hak pakai sebelum dipakai komersial.
6. Catat sumber aset di manifest atau catatan produksi.

**Aturan aset Semarang-familiar:** boleh pakai Lawang Sewu/Tugu Muda/Simpang Lima/Kota Lama/Sam Poo Kong hanya jika lisensi komersial jelas atau rekaman sendiri.

## 3) ElevenLabs (voiceover)

Script final: `docs/video-1-script.txt`.

Tes manual:

```powershell
cd C:\Users\User\Documents\Aidan\aidan's\Codingg\AI\AinyaKak\CFDSemarang
# load media/.env ke environment shell, lalu:
node .\media\scripts\generate_voiceover_elevenlabs.mjs (Get-Content .\docs\video-1-script.txt -Raw) .\media\out\voiceover.mp3
```

Output: `media/out/voiceover.mp3`.

## 4) Remotion (video)

Template: `media/remotion/src/CfdPromo.tsx`.  
Scene akhir sudah berisi teks `amankan  tempatmu sekarang!` dan QR code.

Render:

```powershell
cd C:\Users\User\Documents\Aidan\aidan's\Codingg\AI\AinyaKak\CFDSemarang\media\remotion
npm install
npm run render
```

Output default: `media/remotion/out/cfd-promo.mp4` (sesuai script package). Pindahkan/salin ke `media/out/cfd-promo.mp4` bila perlu.

## 5) FFmpeg (mix VO + BGM)

```powershell
cd C:\Users\User\Documents\Aidan\aidan's\Codingg\AI\AinyaKak\CFDSemarang\media\scripts
.\mix_audio_ffmpeg.ps1 -VideoIn ..\out\cfd-promo.mp4 -VoiceIn ..\out\voiceover.mp3 -VideoOut ..\out\cfd-promo-final.mp4 -MusicIn ..\assets\music\background.mp3
```

Tanpa musik:

```powershell
.\mix_audio_ffmpeg.ps1 -VideoIn ..\out\cfd-promo.mp4 -VoiceIn ..\out\voiceover.mp3 -VideoOut ..\out\cfd-promo-final.mp4
```

## 6) Pipeline satu perintah

Setelah `media/.env` diisi:

```powershell
cd C:\Users\User\Documents\Aidan\aidan's\Codingg\AI\AinyaKak\CFDSemarang\media\scripts
.\run_pipeline.ps1
```

Opsi:
- `-SkipVoice` — pakai VO yang sudah ada.
- `-SkipRender` — pakai render Remotion yang sudah ada.
- `-SkipMix` — skip FFmpeg.
- `-Publish` — publish ke Instagram (butuh `R2_PUBLIC_BASE_URL` dan video sudah publik).

## 7) R2 (NANTI, setelah kamu aktivasi)

Saat R2 aktif:

1. Buat bucket: `cf r2 buckets create --name cfdsemarang-media --location-hint apac`
2. Aktifkan r2.dev public: `cf r2 buckets domains managed update cfdsemarang-media --enabled true`
3. Ambil public URL: `cf r2 buckets domains managed get cfdsemarang-media`
4. Upload `media/out/cfd-promo-final.mp4` ke bucket.
5. Isi `R2_PUBLIC_BASE_URL` dan `R2_VIDEO_PREFIX` di `media/.env`.
6. Publish:

```powershell
node .\media\scripts\publish_instagram.mjs "https://<public-r2>/instagram/video-1/cfd-promo-final.mp4" (Get-Content .\docs\video-1-caption.txt -Raw)
```

## 8) Instagram publish (Worker)

Endpoint: `POST /api/admin/instagram/publish`  
Header: `x-admin-pin`  
Body:

```json
{
  "video_url": "https://public-r2/.../cfd-promo-final.mp4",
  "caption": "...",
  "media_type": "REELS",
  "share_to_feed": true
}
```

Cek status job: `GET /api/admin/instagram/jobs?code=IGJ-XXXX`.

## 9) Checklist otomatisasi

- [x] Instagram OAuth terhubung.
- [x] Script VO, caption, brief, manifest Flow dibuat.
- [x] Script pipeline lokal dibuat.
- [ ] `ELEVENLABS_API_KEY` diisi.
- [ ] `ELEVENLABS_VOICE_ID` dipilih (pria, muda, santai).
- [ ] Aset Flow/stock direkam/diunduh + lisensi diverifikasi.
- [ ] Musik royalty-free dipilih.
- [ ] R2 diaktifkan dan public URL tersedia.
- [ ] Upload video final ke R2.
- [ ] Publish via Worker dan verifikasi job succeeded.