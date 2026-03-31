-- =========================================================================================
-- SUPABASE / POSTGRESQL INITIALIZATION SCRIPT
-- =========================================================================================
-- This script replaces the old MySQL databases with PostgreSQL dbs for each service.
-- It also includes table definitions and the seed data properly formatted for Supabase.
-- =========================================================================================

-- 1. Drop existing dbs if you are completely replacing the current database
-- WARNING: This deletes ALL existing data in these dbs.
DROP SCHEMA IF EXISTS booking_db CASCADE;
DROP SCHEMA IF EXISTS user_db CASCADE;
DROP SCHEMA IF EXISTS listings_db CASCADE;
DROP SCHEMA IF EXISTS availability_db CASCADE;
DROP SCHEMA IF EXISTS stay_db CASCADE;
DROP SCHEMA IF EXISTS inspection_db CASCADE;
DROP SCHEMA IF EXISTS payment_logs_db CASCADE;
DROP SCHEMA IF EXISTS search_db CASCADE;
DROP SCHEMA IF EXISTS notification_db CASCADE;
DROP SCHEMA IF EXISTS deposit_db CASCADE;

-- 2. Create microservice dbs
CREATE SCHEMA booking_db;
CREATE SCHEMA user_db;
CREATE SCHEMA listings_db;
CREATE SCHEMA availability_db;
CREATE SCHEMA stay_db;
CREATE SCHEMA inspection_db;
CREATE SCHEMA payment_logs_db;
CREATE SCHEMA search_db;
CREATE SCHEMA notification_db;
CREATE SCHEMA deposit_db;

-- =========================================================================================
-- TABLES
-- =========================================================================================

-- -----------------------------------------------------
-- user_db
-- -----------------------------------------------------
SET search_path TO user_db;

CREATE TABLE user_profile (
  user_id      VARCHAR(36) PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(150) NOT NULL UNIQUE,
  phone_number VARCHAR(20)  NOT NULL,
  role         VARCHAR(20) CHECK (role IN ('guest','host')) NOT NULL,
  password     VARCHAR(255) NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_session (
  session_id    VARCHAR(36)  PRIMARY KEY,
  user_id       VARCHAR(36)  NOT NULL,
  logged_in_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  logged_out_at TIMESTAMP,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE
);
CREATE INDEX idx_user_session_user_id ON user_session (user_id);


-- -----------------------------------------------------
-- booking_db
-- -----------------------------------------------------
SET search_path TO booking_db;

CREATE TABLE booking (
  booking_id VARCHAR(36) PRIMARY KEY,
  guest_id VARCHAR(36) NOT NULL,
  host_id VARCHAR(36) NOT NULL,
  listing_id VARCHAR(36) NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  payment_method_id VARCHAR(100) NOT NULL,
  payment_due_at TIMESTAMP,
  hold_id VARCHAR(36),
  payment_txn_id VARCHAR(100),
  deposit_txn_id VARCHAR(100),
  booking_mode VARCHAR(20) CHECK (booking_mode IN ('INSTANT','REQUEST')) NOT NULL,
  status VARCHAR(30) CHECK (status IN ('AWAITING_PAYMENT','PAID','CONFIRMED','PENDING_HOST','FAILED_PAYMENT','REJECTED','EXPIRED')) NOT NULL DEFAULT 'AWAITING_PAYMENT',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_booking_guest_id ON booking (guest_id);
CREATE INDEX idx_booking_status ON booking (status);
CREATE INDEX idx_booking_payment_due ON booking (payment_due_at);


-- -----------------------------------------------------
-- listings_db
-- -----------------------------------------------------
SET search_path TO listings_db;

CREATE TABLE property_details (
  listing_id VARCHAR(36) PRIMARY KEY,
  host_id VARCHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  location VARCHAR(300) NOT NULL,
  region VARCHAR(50) NOT NULL,
  price_per_night DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  status VARCHAR(20) CHECK (status IN ('ACTIVE','INACTIVE','SUSPENDED')) NOT NULL DEFAULT 'ACTIVE',
  booking_mode VARCHAR(20) CHECK (booking_mode IN ('INSTANT','REQUEST')) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_property_host_id ON property_details (host_id);


-- -----------------------------------------------------
-- availability_db
-- -----------------------------------------------------
SET search_path TO availability_db;

CREATE TABLE hold (
  hold_id VARCHAR(36) PRIMARY KEY,
  listing_id VARCHAR(36) NOT NULL,
  booking_id VARCHAR(36),
  guest_id VARCHAR(36) NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  ttl_seconds INT NOT NULL DEFAULT 900,
  expires_at TIMESTAMP NOT NULL,
  reason VARCHAR(100),
  status VARCHAR(20) CHECK (status IN ('HELD','PENDING_HOST','EXPIRED','CONFIRMED','RELEASED')) NOT NULL DEFAULT 'HELD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hold_listing_dates ON hold (listing_id, check_in_date, check_out_date);
CREATE INDEX idx_hold_expires_at ON hold (expires_at);

CREATE TABLE reservation (
  reservation_id VARCHAR(36) PRIMARY KEY,
  listing_id VARCHAR(36) NOT NULL,
  booking_id VARCHAR(36) NOT NULL,
  guest_id VARCHAR(36) NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reservation_listing_dates ON reservation (listing_id, check_in_date, check_out_date);


-- -----------------------------------------------------
-- stay_db
-- -----------------------------------------------------
SET search_path TO stay_db;

CREATE TABLE stay (
  stay_id VARCHAR(36) PRIMARY KEY,
  booking_id VARCHAR(36) NOT NULL UNIQUE,
  guest_id VARCHAR(36) NOT NULL,
  host_id VARCHAR(36) NOT NULL,
  listing_id VARCHAR(36) NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  deposit_txn_id VARCHAR(100),
  deposit_amount DECIMAL(10,2),
  deposit_status VARCHAR(20) CHECK (deposit_status IN ('HELD','RELEASED','CAPTURED','RESOLVED')) NOT NULL DEFAULT 'HELD',
  checkout_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stay_guest_id ON stay (guest_id);
CREATE INDEX idx_stay_checkout_deposit ON stay (checkout_time, deposit_status);


-- -----------------------------------------------------
-- inspection_db
-- -----------------------------------------------------
SET search_path TO inspection_db;

CREATE TABLE inspection_report (
  inspection_id VARCHAR(36) PRIMARY KEY,
  stay_id VARCHAR(36) NOT NULL UNIQUE,
  host_id VARCHAR(36) NOT NULL,
  condition_result VARCHAR(10) CHECK (condition_result IN ('GOOD','BAD')) NOT NULL,
  photos TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- -----------------------------------------------------
-- payment_logs_db
-- -----------------------------------------------------
SET search_path TO payment_logs_db;

CREATE TABLE payment_transaction (
  payment_log_id VARCHAR(36) PRIMARY KEY,
  booking_id VARCHAR(36) NOT NULL,
  payment_txn_id VARCHAR(100),
  transaction_type VARCHAR(50) CHECK (transaction_type IN ('BOOKING_PAYMENT_CAPTURE', 'BOOKING_PAYMENT_AUTHORIZE', 'PAYMENT_VOID')) NOT NULL,
  amount DECIMAL(10,2),
  status VARCHAR(20) CHECK (status IN ('SUCCESS','AUTHORIZED','VOIDED','FAILED')) NOT NULL,
  idempotency_key VARCHAR(150),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_payment_booking_id ON payment_transaction (booking_id);

CREATE TABLE deposit_hold (
  deposit_log_id VARCHAR(36) PRIMARY KEY,
  booking_id VARCHAR(36) NOT NULL,
  deposit_txn_id VARCHAR(100),
  transaction_type VARCHAR(50) CHECK (transaction_type IN ('DEPOSIT_PREAUTHORIZE', 'DEPOSIT_RELEASE', 'DEPOSIT_CAPTURE')) NOT NULL,
  deposit_amount DECIMAL(10,2),
  status VARCHAR(20) CHECK (status IN ('HELD','RELEASED','CAPTURED','FAILED')) NOT NULL,
  reason VARCHAR(100),
  idempotency_key VARCHAR(150),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_deposit_booking_id ON deposit_hold (booking_id);


-- -----------------------------------------------------
-- search_db
-- -----------------------------------------------------
SET search_path TO search_db;

CREATE TABLE listing_index (
  listing_id VARCHAR(36) PRIMARY KEY,
  host_id VARCHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  location VARCHAR(300) NOT NULL,
  region VARCHAR(50) NOT NULL,
  price_per_night DECIMAL(10,2) NOT NULL,
  rating DECIMAL(3,2) DEFAULT 0.00,
  availability_status VARCHAR(20) CHECK (availability_status IN ('AVAILABLE','UNAVAILABLE')) NOT NULL DEFAULT 'AVAILABLE',
  booking_mode VARCHAR(20) CHECK (booking_mode IN ('INSTANT','REQUEST')) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PostgreSQL text search index integration setup
CREATE INDEX idx_listing_search ON listing_index USING gin (to_tsvector('english', title || ' ' || location || ' ' || region));


-- -----------------------------------------------------
-- notification_db
-- -----------------------------------------------------
SET search_path TO notification_db;

CREATE TABLE notification_message (
  notification_id VARCHAR(36) PRIMARY KEY,
  recipient_id VARCHAR(36) NOT NULL,
  recipient_phone VARCHAR(20),
  channel VARCHAR(20) CHECK (channel IN ('SMS')) NOT NULL DEFAULT 'SMS',
  message_body TEXT NOT NULL,
  event_type VARCHAR(100),
  reference_id VARCHAR(100),
  status VARCHAR(20) CHECK (status IN ('SENT','FAILED','SIMULATED')) NOT NULL DEFAULT 'SIMULATED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- -----------------------------------------------------
-- deposit_db
-- -----------------------------------------------------
SET search_path TO deposit_db;

CREATE TABLE deposit_resolution (
  resolution_id VARCHAR(36) PRIMARY KEY,
  stay_id VARCHAR(36) NOT NULL,
  guest_id VARCHAR(36) NOT NULL,
  host_id VARCHAR(36) NOT NULL,
  deposit_txn_id VARCHAR(100),
  amount DECIMAL(10,2),
  action VARCHAR(20) CHECK (action IN ('RELEASE','CAPTURE','AUTO_RELEASE')) NOT NULL,
  reason VARCHAR(30) CHECK (reason IN ('HOST_REPORT','DAMAGE','NO_REPORT_48HR')) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('RESOLVED','FAILED')) NOT NULL DEFAULT 'RESOLVED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================================================
-- SEED DATA
-- =========================================================================================

-- -----------------------------------------------------
-- USERS
-- -----------------------------------------------------
SET search_path TO user_db;
INSERT INTO user_profile (user_id, name, email, phone_number, role, password) VALUES
('8b0e51e5-a7c3-4870-8684-683c8d5af482', 'Alice Tan', 'alice2@demo.com', '+6591234568', 'guest', 'PENDING_HASH') ON CONFLICT DO NOTHING;

INSERT INTO user_profile (user_id, name, email, phone_number, role, password) VALUES
('af112c4e-8b77-46ac-9014-7cdb291e0023', 'Bob Lim', 'bob2@demo.com', '+6598765433', 'host', 'PENDING_HASH') ON CONFLICT DO NOTHING;

-- -----------------------------------------------------
-- LISTINGS
-- -----------------------------------------------------
SET search_path TO listings_db;
INSERT INTO property_details (listing_id, host_id, title, location, region, price_per_night, image_url, status, booking_mode) VALUES
('aa0d8294-5c71-4179-9bb1-0be4ee9fb26a', 'af112c4e-8b77-46ac-9014-7cdb291e0023', 'Cozy Studio in Orchard',       'Orchard Road, Singapore',  'Central Region', 150.00, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'ACTIVE', 'INSTANT') ON CONFLICT DO NOTHING;

INSERT INTO property_details (listing_id, host_id, title, location, region, price_per_night, image_url, status, booking_mode) VALUES
('974d9393-02c3-47e0-9d45-159f3bc14f3d', 'af112c4e-8b77-46ac-9014-7cdb291e0023', 'Modern Condo in Marina Bay',   'Marina Bay, Singapore',    'Central Region', 250.00, 'https://images.unsplash.com/photo-1502672260266-1c1e52409818?w=800', 'ACTIVE', 'REQUEST') ON CONFLICT DO NOTHING;

INSERT INTO property_details (listing_id, host_id, title, location, region, price_per_night, image_url, status, booking_mode) VALUES
('c05ac9bc-5cff-4423-9179-94f77967d9e4', 'af112c4e-8b77-46ac-9014-7cdb291e0023', 'Charming Room in Tiong Bahru', 'Tiong Bahru, Singapore',   'Central Region', 100.00, 'https://images.unsplash.com/photo-1493809842364-78817add7fcb?w=800', 'ACTIVE', 'INSTANT') ON CONFLICT DO NOTHING;

INSERT INTO property_details (listing_id, host_id, title, location, region, price_per_night, image_url, status, booking_mode) VALUES
('d11bc8ac-7e77-4421-9179-94f88967d9e5', 'af112c4e-8b77-46ac-9014-7cdb291e0023', 'Breezy East Coast Bungalow', 'East Coast Park, Singapore', 'East Region', 300.00, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', 'ACTIVE', 'INSTANT') ON CONFLICT DO NOTHING;

INSERT INTO property_details (listing_id, host_id, title, location, region, price_per_night, image_url, status, booking_mode) VALUES
('e22cc9db-8f88-4422-9179-94f99967d9e6', 'af112c4e-8b77-46ac-9014-7cdb291e0023', 'Nature Retreat in Sembawang', 'Sembawang, Singapore', 'North Region', 180.00, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', 'ACTIVE', 'REQUEST') ON CONFLICT DO NOTHING;

-- -----------------------------------------------------
-- SEARCH INDEX
-- -----------------------------------------------------
SET search_path TO search_db;
INSERT INTO listing_index (listing_id, host_id, title, location, region, price_per_night, availability_status, booking_mode) VALUES
('aa0d8294-5c71-4179-9bb1-0be4ee9fb26a', 'af112c4e-8b77-46ac-9014-7cdb291e0023', 'Cozy Studio in Orchard',       'Orchard Road, Singapore',  'Central Region', 150.00, 'AVAILABLE', 'INSTANT') ON CONFLICT DO NOTHING;

INSERT INTO listing_index (listing_id, host_id, title, location, region, price_per_night, availability_status, booking_mode) VALUES
('974d9393-02c3-47e0-9d45-159f3bc14f3d', 'af112c4e-8b77-46ac-9014-7cdb291e0023', 'Modern Condo in Marina Bay',   'Marina Bay, Singapore',    'Central Region', 250.00, 'AVAILABLE', 'REQUEST') ON CONFLICT DO NOTHING;

INSERT INTO listing_index (listing_id, host_id, title, location, region, price_per_night, availability_status, booking_mode) VALUES
('c05ac9bc-5cff-4423-9179-94f77967d9e4', 'af112c4e-8b77-46ac-9014-7cdb291e0023', 'Charming Room in Tiong Bahru', 'Tiong Bahru, Singapore',   'Central Region', 100.00, 'AVAILABLE', 'INSTANT') ON CONFLICT DO NOTHING;

INSERT INTO listing_index (listing_id, host_id, title, location, region, price_per_night, availability_status, booking_mode) VALUES
('d11bc8ac-7e77-4421-9179-94f88967d9e5', 'af112c4e-8b77-46ac-9014-7cdb291e0023', 'Breezy East Coast Bungalow', 'East Coast Park, Singapore', 'East Region', 300.00, 'AVAILABLE', 'INSTANT') ON CONFLICT DO NOTHING;

INSERT INTO listing_index (listing_id, host_id, title, location, region, price_per_night, availability_status, booking_mode) VALUES
('e22cc9db-8f88-4422-9179-94f99967d9e6', 'af112c4e-8b77-46ac-9014-7cdb291e0023', 'Nature Retreat in Sembawang', 'Sembawang, Singapore', 'North Region', 180.00, 'AVAILABLE', 'REQUEST') ON CONFLICT DO NOTHING;

-- -----------------------------------------------------
-- BOOKING
-- -----------------------------------------------------
SET search_path TO booking_db;
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
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '2 days',
  'card_demo_1234',
  'txn_pay_001',
  'txn_dep_001',
  'INSTANT',
  'CONFIRMED'
) ON CONFLICT DO NOTHING;

-- -----------------------------------------------------
-- AVAILABILITY RESERVATION
-- -----------------------------------------------------
SET search_path TO availability_db;
INSERT INTO reservation (reservation_id, listing_id, booking_id, guest_id, check_in_date, check_out_date)
VALUES (
  'res-1111-2222-3333',
  'aa0d8294-5c71-4179-9bb1-0be4ee9fb26a',
  'bkg-1111-2222-3333',
  '8b0e51e5-a7c3-4870-8684-683c8d5af482',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '2 days'
) ON CONFLICT DO NOTHING;

-- -----------------------------------------------------
-- STAY
-- -----------------------------------------------------
SET search_path TO stay_db;
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
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '2 days',
  'txn_dep_001',
  200.00,
  'HELD'
) ON CONFLICT DO NOTHING;

-- -----------------------------------------------------
-- PAYMENT LOGS
-- -----------------------------------------------------
SET search_path TO payment_logs_db;
INSERT INTO payment_transaction (payment_log_id, booking_id, payment_txn_id, transaction_type, amount, status)
VALUES ('plog-1111', 'bkg-1111-2222-3333', 'txn_pay_001', 'BOOKING_PAYMENT_CAPTURE', 330.00, 'SUCCESS') ON CONFLICT DO NOTHING;

INSERT INTO deposit_hold (deposit_log_id, booking_id, deposit_txn_id, transaction_type, deposit_amount, status)
VALUES ('dlog-1111', 'bkg-1111-2222-3333', 'txn_dep_001', 'DEPOSIT_PREAUTHORIZE', 200.00, 'HELD') ON CONFLICT DO NOTHING;

-- =========================================================================================
-- PERMISSIONS (MANDATORY FOR SUPABASE)
-- =========================================================================================
-- These commands grant the public roles (anon and authenticated) access to our custom schemas.
-- Without these, the frontend will get "Schema not found" or "Permission denied" errors.

-- 1. Grant usage on schemas
GRANT USAGE ON SCHEMA user_db TO anon, authenticated;
GRANT USAGE ON SCHEMA listings_db TO anon, authenticated;
GRANT USAGE ON SCHEMA booking_db TO anon, authenticated;
GRANT USAGE ON SCHEMA availability_db TO anon, authenticated;
GRANT USAGE ON SCHEMA stay_db TO anon, authenticated;
GRANT USAGE ON SCHEMA search_db TO anon, authenticated;
GRANT USAGE ON SCHEMA payment_logs_db TO anon, authenticated;
GRANT USAGE ON SCHEMA notification_db TO anon, authenticated;
GRANT USAGE ON SCHEMA deposit_db TO anon, authenticated;

-- 2. Grant SELECT access to allow fetching data
GRANT SELECT ON ALL TABLES IN SCHEMA user_db TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA listings_db TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA booking_db TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA availability_db TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA stay_db TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA search_db TO anon, authenticated;

-- 3. Grant INSERT/UPDATE access for specific tables (Login, SignUp, Session Management)
GRANT INSERT, UPDATE, SELECT ON ALL TABLES IN SCHEMA user_db TO anon, authenticated;

-- OPTIONAL: If you want to allow anyone to create bookings/stays via the frontend
GRANT INSERT, UPDATE ON ALL TABLES IN SCHEMA booking_db TO anon, authenticated;
GRANT INSERT, UPDATE ON ALL TABLES IN SCHEMA availability_db TO anon, authenticated;
GRANT INSERT, UPDATE ON ALL TABLES IN SCHEMA stay_db TO anon, authenticated;
