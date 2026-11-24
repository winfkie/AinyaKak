-- CFDSemarang — skema database D1 (SQLite)
-- Diterapkan lewat: npx wrangler d1 execute cfdsemarang-db --remote --file=db/schema.sql
-- (atau cf CLI / dashboard D1 console)

-- Satu baris per pemesanan lapak untuk satu Minggu tertentu.
CREATE TABLE IF NOT EXISTS bookings (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  code         TEXT NOT NULL UNIQUE,          -- cfs-A-B05-XXXX
  spot_code    TEXT NOT NULL,                 -- A-B05 (Zona A, sisi Barat, nomor 05)
  event_date   TEXT NOT NULL,                 -- 'YYYY-MM-DD' (Minggu CFD)
  name         TEXT NOT NULL,                 -- nama / nama dagang penyewa
  business_type TEXT NOT NULL,                -- Kuliner / Fashion / Kerajinan / Jasa / Lainnya
  wa_number    TEXT NOT NULL,                 -- WhatsApp penyewa
  amount_idr   INTEGER NOT NULL,              -- harga saat booking (backup dari config)
  status       TEXT NOT NULL DEFAULT 'pending', -- pending | paid | expired | cancelled
  payment_ref  TEXT,                          -- order_id Midtrans / QRIS
  snap_url     TEXT,                          -- halaman pembayaran Snap (bisa dibuka ulang)
  paid_at      TEXT,                          -- ISO timestamp saat webhook paid
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),

  -- Satu lapak hanya bisa dipesan sekali per Minggu.
  UNIQUE (spot_code, event_date)
);

CREATE INDEX IF NOT EXISTS idx_bookings_date   ON bookings (event_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (event_date, status);

-- Pengaturan harga per zona (admin-editable, M3).
CREATE TABLE IF NOT EXISTS zone_prices (
  zone        TEXT PRIMARY KEY,               -- 'A' | 'B' | 'C' | 'D'
  price_idr   INTEGER NOT NULL
);

INSERT OR IGNORE INTO zone_prices (zone, price_idr) VALUES
  ('A', 25000), ('B', 25000), ('C', 25000), ('D', 25000);

-- Akun Instagram Professional yang terhubung (satu akun aktif per instalasi).
CREATE TABLE IF NOT EXISTS ig_accounts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  ig_user_id      TEXT NOT NULL UNIQUE,       -- Instagram professional account ID
  username        TEXT,                       -- @username untuk tampilan admin
  account_type    TEXT,                       -- BUSINESS / CREATOR / unknown
  token_enc       TEXT NOT NULL,              -- access token terenkripsi (AES-GCM)
  token_type      TEXT NOT NULL DEFAULT 'bearer',
  scopes          TEXT,                       -- ruang-dipisah / JSON scope yang diberikan
  expires_at      TEXT,                       -- ISO timestamp kedaluwarsa token
  connected_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Job publikasi konten ke Instagram (Reels/video).
CREATE TABLE IF NOT EXISTS ig_media_jobs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  job_code        TEXT NOT NULL UNIQUE,       -- IGJ-XXXX
  ig_user_id      TEXT NOT NULL,              -- akun target
  media_type      TEXT NOT NULL DEFAULT 'REELS',
  video_url       TEXT NOT NULL,              -- URL publik video (diambil Meta)
  caption         TEXT,
  cover_url       TEXT,                       -- opsional thumbnail/cover
  share_to_feed   INTEGER NOT NULL DEFAULT 1, -- 1=true
  status          TEXT NOT NULL DEFAULT 'created', -- created|container_created|processing|finished|published|error
  container_id    TEXT,                       -- creation_id Instagram
  media_id        TEXT,                       -- IG media ID setelah publish
  error_message   TEXT,
  payload_json    TEXT,                       -- metadata/debug (tanpa token)
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  published_at    TEXT
);

CREATE INDEX IF NOT EXISTS idx_ig_jobs_status ON ig_media_jobs (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ig_jobs_user   ON ig_media_jobs (ig_user_id, created_at DESC);
