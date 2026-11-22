<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Proyek Ticketix

Platform C2C jual-beli tiket event dengan pembayaran QRIS (Midtrans Sandbox), dana tertahan yang dicatat di database, dan serah terima tiket lewat surat kuasa atau e-ticket.

## Stack
- Next.js 16 (App Router, TypeScript), Tailwind CSS v4. Middleware bernama `proxy.ts`.
- Supabase: auth, database Postgres, realtime (chat), storage. Skema di `supabase/schema.sql`.
- Midtrans Sandbox: pembayaran QRIS (Core API, `lib/midtrans.ts`).
- Deploy di Vercel.

## Aturan wajib
- Bahasa antarmuka: Indonesia.
- Jangan menaruh kunci rahasia di kode. Semua kunci lewat `.env.local` dan Environment Variables Vercel.
- Hanya variabel berawalan NEXT_PUBLIC_ yang boleh dipakai di sisi browser.
- SUPABASE_SERVICE_ROLE_KEY dan MIDTRANS_SERVER_KEY hanya dipakai di kode server (`lib/supabase/admin.ts`, `lib/midtrans.ts`, API route).
- Biaya layanan, pembuatan transaksi Midtrans, dan perubahan status order hanya dilakukan di server.
- Jangan percaya status pembayaran dari browser. Order menjadi dibayar_tertahan hanya setelah status dicek ke Midtrans (Get Transaction Status); notifikasi wajib lolos verifikasi signature_key.
- Simpan setiap notifikasi di tabel payment_events; update order bersyarat pada status lama supaya notifikasi ganda tidak diproses dua kali.
- harga_jual tidak boleh lebih dari harga_asli.
- Pencairan dana ke penjual adalah SIMULASI: hanya mengubah status dan ledger.
- Bucket storage ticket-proofs, proxy-letters, dan delivery-proofs bersifat private, akses lewat signed URL.
- Jangan commit file .env*.

## Status order
menunggu_bayar -> dibayar_tertahan -> (surat_kuasa_diunggah atau tiket_dikirim) -> dikonfirmasi_pembeli -> dicairkan
Cabang: kedaluwarsa, sengketa, refund, dibatalkan.

## Metode serah terima tiket
- listings.metode_serah bernilai 'surat_kuasa' atau 'kirim_email', dipilih penjual saat posting tiket.
- Pembeli melihat metodenya di detail tiket dan wajib mencentang pemahamannya di checkout.
- surat_kuasa: penjual mengunggah surat kuasa ke bucket proxy-letters, status surat_kuasa_diunggah.
- kirim_email: penjual menekan "Saya sudah kirim e-ticket" (bukti opsional ke bucket delivery-proofs), status tiket_dikirim.
- Kedua jalur menunggu konfirmasi pembeli sebelum dana dicairkan.
