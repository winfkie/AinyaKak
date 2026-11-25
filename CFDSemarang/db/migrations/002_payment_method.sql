-- Add payment_method for QRIS/transfer selection and fallback
ALTER TABLE bookings ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'qris';

CREATE INDEX IF NOT EXISTS idx_bookings_payment_method ON bookings (payment_method);
