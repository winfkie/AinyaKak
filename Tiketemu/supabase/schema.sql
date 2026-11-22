-- =====================================================================
-- TICKETIX - Skema database lengkap untuk Supabase
-- Cara pakai: Supabase Dashboard -> SQL Editor -> New query -> tempel
-- seluruh isi file ini -> Run. Aman dijalankan SEKALI di proyek baru.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. TABEL
-- ---------------------------------------------------------------------

-- Profil pengguna (terhubung ke akun login)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  username text unique,
  no_hp text,
  foto_url text,
  is_verified boolean default false,
  is_admin boolean default false,
  created_at timestamptz default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  nama_event text not null,
  venue text,
  kota text,
  tanggal date,
  kategori text,
  poster_url text,
  created_at timestamptz default now()
);

create table listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references profiles(id),
  event_id uuid not null references events(id),
  tipe text not null default 'jual' check (tipe in ('jual','menfess')),
  kategori_tiket text,
  jumlah int not null default 1 check (jumlah > 0),
  harga_asli int not null check (harga_asli >= 0),
  harga_jual int not null check (harga_jual >= 0),
  deskripsi text,
  bukti_beli_path text,
  metode_serah text not null default 'surat_kuasa'
    check (metode_serah in ('surat_kuasa','kirim_email')),
  status text not null default 'aktif'
    check (status in ('aktif','dipesan','terjual','batal')),
  created_at timestamptz default now(),
  -- aturan anti calo: tidak boleh di atas harga asli
  constraint harga_tidak_boleh_naik check (harga_jual <= harga_asli)
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id),
  buyer_id uuid not null references profiles(id),
  seller_id uuid not null references profiles(id),
  created_at timestamptz default now(),
  unique (listing_id, buyer_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  isi text not null check (length(isi) between 1 and 2000),
  created_at timestamptz default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id),
  buyer_id uuid not null references profiles(id),
  seller_id uuid not null references profiles(id),
  harga_tiket int not null,
  biaya_layanan int not null,
  total_bayar int not null,
  dana_untuk_seller int not null,
  status text not null default 'menunggu_bayar'
    constraint orders_status_check check (status in (
      'menunggu_bayar','kedaluwarsa','dibayar_tertahan','surat_kuasa_diunggah',
      'tiket_dikirim','dikonfirmasi_pembeli','dicairkan','sengketa','refund','dibatalkan')),
  bukti_kirim_path text,
  snap_token text,
  qr_url text,
  midtrans_transaction_id text,
  payment_type text,
  payment_expired_at timestamptz,
  dibayar_pada timestamptz,
  dikirim_pada timestamptz,
  dicairkan_pada timestamptz,
  created_at timestamptz default now()
);

create table proxy_letters (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  file_path text not null,
  status text not null default 'menunggu'
    check (status in ('menunggu','disetujui','ditolak')),
  catatan text,
  created_at timestamptz default now()
);

create table ledger (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  jenis text not null check (jenis in ('bayar','tahan','cairkan','refund','fee')),
  jumlah int not null,
  created_at timestamptz default now()
);

create table disputes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  pelapor_id uuid not null references profiles(id),
  alasan text not null,
  bukti_path text,
  status text not null default 'terbuka' check (status in ('terbuka','diproses','selesai')),
  keputusan text,
  created_at timestamptz default now()
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  reviewer_id uuid not null references profiles(id),
  reviewee_id uuid not null references profiles(id),
  rating int not null check (rating between 1 and 5),
  komentar text,
  created_at timestamptz default now(),
  unique (order_id, reviewer_id)
);

-- Catatan notifikasi Midtrans: jejak audit dan pencegah pemrosesan ganda
create table payment_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  midtrans_transaction_id text,
  transaction_status text not null,
  sumber text,
  payload jsonb,
  created_at timestamptz default now()
);

-- Pengaturan platform (persentase biaya layanan, diatur admin)
create table settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);
insert into settings (key, value) values ('fee_persen', '5');

create index on listings (status, created_at desc);
create index on orders (buyer_id);
create index on orders (seller_id);
create index on messages (conversation_id, created_at);

-- ---------------------------------------------------------------------
-- 2. PROFIL OTOMATIS SAAT DAFTAR
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nama)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'nama', ''), split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- Prinsip: browser hanya boleh MEMBACA data miliknya + mengirim chat.
-- Semua perubahan penting (listing, order, status, dana) lewat API route
-- server yang memakai service role.
-- ---------------------------------------------------------------------
alter table profiles       enable row level security;
alter table events         enable row level security;
alter table listings       enable row level security;
alter table conversations  enable row level security;
alter table messages       enable row level security;
alter table orders         enable row level security;
alter table proxy_letters  enable row level security;
alter table ledger         enable row level security;
alter table disputes       enable row level security;
alter table reviews        enable row level security;
alter table payment_events enable row level security; -- tanpa policy: hanya server
alter table settings       enable row level security;

-- Profil publik (nama, foto, verifikasi). Nomor HP disembunyikan lewat column grant di bawah.
create policy "profil publik" on profiles for select using (true);
revoke select on profiles from anon, authenticated;
grant select (id, nama, username, foto_url, is_verified, is_admin, created_at) on profiles to anon, authenticated;

create policy "event publik" on events for select using (true);
create policy "listing publik" on listings for select using (true);
create policy "ulasan publik" on reviews for select using (true);
create policy "pengaturan publik" on settings for select using (true);

-- Chat: hanya dua peserta
create policy "peserta lihat percakapan" on conversations for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "peserta lihat pesan" on messages for select
  using (exists (
    select 1 from conversations c
    where c.id = messages.conversation_id
      and (auth.uid() = c.buyer_id or auth.uid() = c.seller_id)));

create policy "peserta kirim pesan" on messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and (auth.uid() = c.buyer_id or auth.uid() = c.seller_id)));

-- Order dan turunannya: hanya pembeli & penjualnya
create policy "order milik sendiri" on orders for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "surat kuasa milik order sendiri" on proxy_letters for select
  using (exists (
    select 1 from orders o where o.id = proxy_letters.order_id
      and (auth.uid() = o.buyer_id or auth.uid() = o.seller_id)));

create policy "ledger milik order sendiri" on ledger for select
  using (exists (
    select 1 from orders o where o.id = ledger.order_id
      and (auth.uid() = o.buyer_id or auth.uid() = o.seller_id)));

create policy "sengketa milik order sendiri" on disputes for select
  using (exists (
    select 1 from orders o where o.id = disputes.order_id
      and (auth.uid() = o.buyer_id or auth.uid() = o.seller_id)));

-- ---------------------------------------------------------------------
-- 4. REALTIME untuk chat
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table messages;

-- ---------------------------------------------------------------------
-- 5. STORAGE (semua private; akses hanya lewat signed URL dari server)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('ticket-proofs', 'ticket-proofs', false),
  ('proxy-letters', 'proxy-letters', false),
  ('delivery-proofs', 'delivery-proofs', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 6. JADIKAN AKUN KAMU ADMIN (jalankan terpisah setelah daftar di web):
-- update profiles set is_admin = true
--   where id = (select id from auth.users where email = 'emailkamu@contoh.com');
-- ---------------------------------------------------------------------
