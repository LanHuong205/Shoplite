ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'cash_on_delivery';
UPDATE orders SET payment_status = 'awaiting_payment' WHERE payment_method = 'bank';