# Media Pipeline (CFDSemarang)

Pipeline konten video untuk Instagram CFDSemarang.

## Alur

1. **Google Labs Flow/Veo**: buat footage/konsep video (manual/ekspor). Simpan aset ke `media/remotion/public/` atau `media/assets/`.
2. **Remotion**: susun komposisi video + subtitle/branding.
3. **ElevenLabs**: generate narasi/voiceover ke `media/out/voiceover.mp3`.
4. **FFmpeg**: gabungkan video + voiceover/BGM, normalisasi audio, ekspor MP4 9:16 siap Reels.
5. **Instagram Graph API**: upload URL video publik lewat endpoint admin Worker.

## Prasyarat lokal

- Node.js LTS
- FFmpeg tersedia di PATH (`ffmpeg -version`)
- Akun ElevenLabs Starter + API key
- Akun Instagram Professional (Business/Creator) untuk publish API

## Struktur

```text
media/
  README.md
  remotion/          # project Remotion (scaffold)
  scripts/           # helper ffmpeg/elevenlabs/publish
  out/               # output lokal (gitignored)
```

## Catatan penting

- Instagram Graph API butuh **URL video publik HTTPS**. File lokal `media/out/*.mp4` harus diunggah dulu ke storage publik (mis. R2/public bucket/CDN) sebelum dipublish.
- Token Instagram disimpan terenkripsi di D1 lewat `IG_TOKEN_ENC_KEY`.
- Jangan commit `.dev.vars`, API key, token, atau file media besar.