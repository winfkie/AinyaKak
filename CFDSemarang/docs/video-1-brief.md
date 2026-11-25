# Video #1 Brief — CFDSemarang

**Status:** Approved (2026-11-25)  
**Target publish:** Stretch besok (tergantung R2/assets/VO siap)  
**Format:** Reels vertikal 9:16, 1080×1920, 30fps, 22 detik  
**Tujuan:** Ajak pedagang/UMKM amankan lapak CFD Semarang minggu ini.

## Pesan inti

- CFD Semarang buka peluang jualan untuk UMKM.
- Booking lapak 3×3 m sekarang simpel: pilih Minggu, pilih lapak, bayar QRIS.
- CTA akhir: **“amankan  tempatmu sekarang!”** + QR code ke situs.

## Voiceover (pria, muda, santai)

> “CFD Semarang lagi rame, dan lapakmu jangan sampai keduluan.  
> Di CFDSemarang, kamu bisa pilih hari Minggu, pilih lapak 3×3 meter, terus bayar pakai QRIS. Gampang, tanpa ribet.  
> Yuk, amankan  tempatmu sekarang!”

**Catatan VO:** tempo santai, percaya diri, ramah UMKM. Jangan terlalu hard-sell. Durasi target 11–14 detik agar ada ruang musik/SFX.

## On-screen text / shot list

| Detik | Visual | On-screen text | Audio |
|---:|---|---|---|
| 0–2 | Hook: crowd CFD Semarang, gerak kamera halus / b-roll ramai | `CAR FREE DAY SEMARANG` | musik upbeat ringan masuk |
| 2–6 | Montase UMKM jualan (kuliner/fashion/kerajinan), nuansa Semarang-familiar | `Jualan di CFD? Bisa banget.` | VO kalimat 1 |
| 6–10 | Screen capture/mockup alur situs: pilih tanggal Minggu | `Pilih Minggu` | VO kalimat 2 awal |
| 10–14 | Tunjukkan peta lapak 3×3 m / pilih spot | `Pilih Lapak 3×3 m` | VO kalimat 2 tengah |
| 14–16 | Tunjukkan QRIS/payment flow | `Bayar QRIS` | VO kalimat 2 akhir + 3 |
| 16–22 | Kartu CTA merah/emas/hitam, QR code besar | `amankan  tempatmu sekarang!` + QR + `Scan untuk booking` | VO kalimat 4, musik resolve |

## Caption draft

**Caption:**
Lapak CFD Semarang jangan sampai keduluan 🙌  
Sekarang booking lapak 3×3 m bisa langsung dari HP: pilih Minggu, pilih lapak, bayar QRIS.

Scan QR di video atau buka link di bio/website buat amankan tempatmu.

#CFDSemarang #CarFreeDaySemarang #UMKMSemarang #LapakUMKM #Semarang #JualanCFD

**Catatan:** sesuaikan hashtag final saat publish; hindari klaim yang belum diverifikasi.

## Asset yang dibutuhkan (copyright-safe)

Prioritas aset berlisensi jelas / buatan sendiri / stock dengan lisensi komersial:

1. **B-roll CFD Semarang ramai** — crowd, booth, jalan CFD. Sumber: rekaman sendiri, atau stock berlisensi (Pexels/Pixabay/Unsplash video) dengan verifikasi lokasi/konteks Semarang.
2. **Landmark Semarang-familiar (opsional, 1-2 shot)** — Tugu Muda, Lawang Sewu, Simpang Lima, Kota Lama/Blenduk, Sam Poo Kong. Hanya pakai foto/video dengan lisensi komersial jelas.
3. **Screen recording situs CFDSemarang** — bisa direkam dari `https://cfdsemarang.aidanrn06.workers.dev`.
4. **QR code** — sudah ada: `media/remotion/public/qr-cfdsemarang.svg`.
5. **Musik latar** — royalty-free, lisensi komersial, upbeat ringan, tidak menutupi VO.
6. **SFX opsional** — whoosh/click ringan, royalty-free.

## Produksi

1. **Script/brief ini** — approved oleh user (2026-11-25). ✅
2. **Kumpulkan aset** — browser sourcing, cek lisensi.
3. **Voiceover** — ElevenLabs, suara pria muda santai; render setelah script final.
4. **Remotion render** — gunakan `media/remotion/src/CfdPromo.tsx` sebagai base; tambahkan b-roll/VO/music sesuai aset final.
5. **FFmpeg mix** — normalize VO/BGM, mux ke MP4 final.
6. **Upload ke R2** — dapat public HTTPS `video_url`.
7. **Publish via Worker** — `POST /api/admin/instagram/publish` dengan caption final.

## Risiko / blocker

- R2 harus diaktifkan di akun Cloudflare dulu (dashboard) sebelum bucket/public URL bisa dibuat lewat API.
- Instagram publish butuh `video_url` publik HTTPS yang bisa diambil Meta.
- ElevenLabs API key / voice ID belum dikonfirmasi.
- Aset Semarang-familiar harus diverifikasi lisensinya sebelum dipakai.
- "Post besok" stretch — aman jika aset, VO, R2, dan review selesai hari ini.
