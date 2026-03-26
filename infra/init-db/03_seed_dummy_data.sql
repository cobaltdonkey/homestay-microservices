-- =====================================================
-- 03_seed_dummy_data.sql
-- Demo seed data for local development & testing.
-- Password for all users: "password123"
-- Hash generated via: werkzeug.security.generate_password_hash("password123")
-- =====================================================

-- ─────────────────────────────────────────────────────
-- USERS
-- Guest:  alice2@demo.com  / password123
-- Host:   bob2@demo.com    / password123
--
-- NOTE: werkzeug scrypt hashes are salted at generation time and cannot be
-- embedded as static SQL. After `docker compose up --build`, run:
--   docker exec homestay-microservices-users-service-1 python /app/seed_passwords.py
-- to set the passwords correctly via the ORM.
-- ─────────────────────────────────────────────────────
USE user_db;
INSERT IGNORE INTO user_profile (user_id, name, email, phone_number, role, password) VALUES
(
  '8b0e51e5-a7c3-4870-8684-683c8d5af482',
  'Alice Tan',
  'alice2@demo.com',
  '+6591234568',
  'guest',
  'PENDING_HASH'
),
(
  'af112c4e-8b77-46ac-9014-7cdb291e0023',
  'Bob Lim',
  'bob2@demo.com',
  '+6598765433',
  'host',
  'PENDING_HASH'
);

-- ─────────────────────────────────────────────────────
-- LISTINGS (listings_db)
-- ─────────────────────────────────────────────────────
USE listings_db;
INSERT INTO property_details (listing_id, host_id, title, location, price_per_night, status, booking_mode) VALUES
('aa0d8294-5c71-4179-9bb1-0be4ee9fb26a', 'af112c4e-8b77-46ac-9014-7cdb291e0023', 'Cozy Studio in Orchard',       'Orchard Road, Singapore',  150.00, 'ACTIVE', 'INSTANT'),
('974d9393-02c3-47e0-9d45-159f3bc14f3d', 'af112c4e-8b77-46ac-9014-7cdb291e0023', 'Modern Condo in Marina Bay',   'Marina Bay, Singapore',    250.00, 'ACTIVE', 'REQUEST'),
('c05ac9bc-5cff-4423-9179-94f77967d9e4', 'af112c4e-8b77-46ac-9014-7cdb291e0023', 'Charming Room in Tiong Bahru', 'Tiong Bahru, Singapore',   100.00, 'ACTIVE', 'INSTANT');

-- ─────────────────────────────────────────────────────
-- SEARCH INDEX (search_db) — mirrors listings_db
-- ─────────────────────────────────────────────────────
USE search_db;
INSERT INTO listing_index (listing_id, host_id, title, location, price_per_night, availability_status, booking_mode) VALUES
('aa0d8294-5c71-4179-9bb1-0be4ee9fb26a', 'af112c4e-8b77-46ac-9014-7cdb291e0023', 'Cozy Studio in Orchard',       'Orchard Road, Singapore',  150.00, 'AVAILABLE', 'INSTANT'),
('974d9393-02c3-47e0-9d45-159f3bc14f3d', 'af112c4e-8b77-46ac-9014-7cdb291e0023', 'Modern Condo in Marina Bay',   'Marina Bay, Singapore',    250.00, 'AVAILABLE', 'REQUEST'),
('c05ac9bc-5cff-4423-9179-94f77967d9e4', 'af112c4e-8b77-46ac-9014-7cdb291e0023', 'Charming Room in Tiong Bahru', 'Tiong Bahru, Singapore',   100.00, 'AVAILABLE', 'INSTANT');

-- ─────────────────────────────────────────────────────
-- BOOKING (booking_db) — 1 confirmed instant booking
-- ─────────────────────────────────────────────────────
USE booking_db;
INSERT INTO booking (
  booking_id, guest_id, host_id, listing_id,
  check_in_date, check_out_date,
  payment_method_id, payment_txn_id, deposit_txn_id,
  booking_mode, status
) VALUES (
  'bkg-1111-2222-3333',
  '8b0e51e5-a7c3-4870-8684-683c8d5af482',
  'af112c4e-8b77-46ac-9014-7cdb291e0023',
  'aa0d8294-5c71-4179-9bb1-0be4ee9fb26a',
  CURDATE(),
  DATE_ADD(CURDATE(), INTERVAL 2 DAY),
  'card_demo_1234',
  'txn_pay_001',
  'txn_dep_001',
  'INSTANT',
  'CONFIRMED'
);

-- ─────────────────────────────────────────────────────
-- AVAILABILITY RESERVATION (availability_db)
-- Locks the dates for the confirmed booking above
-- ─────────────────────────────────────────────────────
USE availability_db;
INSERT INTO reservation (reservation_id, listing_id, booking_id, guest_id, check_in_date, check_out_date)
VALUES (
  'res-1111-2222-3333',
  'aa0d8294-5c71-4179-9bb1-0be4ee9fb26a',
  'bkg-1111-2222-3333',
  '8b0e51e5-a7c3-4870-8684-683c8d5af482',
  CURDATE(),
  DATE_ADD(CURDATE(), INTERVAL 2 DAY)
);

-- ─────────────────────────────────────────────────────
-- STAY (stay_db)
-- ─────────────────────────────────────────────────────
USE stay_db;
INSERT INTO stay (
  stay_id, booking_id, guest_id, host_id, listing_id,
  check_in_date, check_out_date,
  deposit_txn_id, deposit_amount, deposit_status
) VALUES (
  'stay-1111-2222-3333',
  'bkg-1111-2222-3333',
  '8b0e51e5-a7c3-4870-8684-683c8d5af482',
  'af112c4e-8b77-46ac-9014-7cdb291e0023',
  'aa0d8294-5c71-4179-9bb1-0be4ee9fb26a',
  CURDATE(),
  DATE_ADD(CURDATE(), INTERVAL 2 DAY),
  'txn_dep_001',
  200.00,
  'HELD'
);

-- ─────────────────────────────────────────────────────
-- PAYMENT LOGS (payment_logs_db)
-- ─────────────────────────────────────────────────────
USE payment_logs_db;
INSERT INTO payment_transaction (payment_log_id, booking_id, payment_txn_id, transaction_type, amount, status)
VALUES ('plog-1111', 'bkg-1111-2222-3333', 'txn_pay_001', 'BOOKING_PAYMENT_CAPTURE', 330.00, 'SUCCESS');

INSERT INTO deposit_hold (deposit_log_id, booking_id, deposit_txn_id, transaction_type, deposit_amount, status)
VALUES ('dlog-1111', 'bkg-1111-2222-3333', 'txn_dep_001', 'DEPOSIT_PREAUTHORIZE', 200.00, 'HELD');
