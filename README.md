# Ticketix

Marketplace C2C jual-beli tiket event dengan pembayaran QRIS (Midtrans Sandbox), dana tertahan (escrow), dan serah terima lewat surat kuasa atau e-ticket via email.

## Menjalankan di laptop

1. `npm install`
2. Salin `.env.example` menjadi `.env.local`, lalu isi nilai dari Supabase dan Midtrans Sandbox.
3. Jalankan `supabase/schema.sql` di Supabase → SQL Editor.
4. `npm run dev` lalu buka http://localhost:3000

Di localhost, halaman bayar mengecek status ke Midtrans setiap 4 detik, jadi pembayaran lewat simulator Sandbox tetap terdeteksi walaupun notifikasi Midtrans belum bisa menjangkau laptop.

## Struktur penting

| Path | Isi |
| --- | --- |
| `supabase/schema.sql` | Semua tabel, RLS, trigger profil, realtime, bucket storage |
| `lib/midtrans.ts` | Charge QRIS, Get Transaction Status, verifikasi signature |
| `lib/orders.ts` | Hitung biaya, proses status bayar (idempoten), pencairan & refund (simulasi) |
| `app/api/checkout` | Membuat order + transaksi QRIS |
| `app/api/midtrans/notifikasi` | Webhook notifikasi Midtrans |
| `app/api/orders/[id]/aksi` | Unggah surat kuasa, tandai e-ticket terkirim, konfirmasi, laporkan, batalkan |
| `app/pesanan/[id]` | Halaman detail pesanan (alur escrow) |
| `app/admin` | Sengketa, biaya layanan, verifikasi pengguna |

## Jadikan akun admin

Setelah daftar di web, jalankan di SQL Editor:

```sql
update profiles set is_admin = true
where id = (select id from auth.users where email = 'emailkamu@contoh.com');
```
