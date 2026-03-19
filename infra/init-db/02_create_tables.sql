USE booking_db;
CREATE TABLE booking (
  booking_id VARCHAR(36) PRIMARY KEY,
  guest_id VARCHAR(36) NOT NULL,
  host_id VARCHAR(36) NOT NULL,
  listing_id VARCHAR(36) NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  payment_method_id VARCHAR(100) NOT NULL,
  payment_due_at DATETIME,
  hold_id VARCHAR(36),
  payment_txn_id VARCHAR(100),
  deposit_txn_id VARCHAR(100),
  booking_mode ENUM('INSTANT','REQUEST') NOT NULL,
  status ENUM('AWAITING_PAYMENT','PAID','CONFIRMED',
              'PENDING_HOST','FAILED_PAYMENT',
              'REJECTED','EXPIRED') NOT NULL 
         DEFAULT 'AWAITING_PAYMENT',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP 
             ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_guest_id (guest_id),
  INDEX idx_status (status),
  INDEX idx_payment_due (payment_due_at)
);

USE user_db;
CREATE TABLE user_profile (
  user_id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone_number VARCHAR(20) NOT NULL,
  role ENUM('guest','host') NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP 
             ON UPDATE CURRENT_TIMESTAMP
);

USE listings_db;
CREATE TABLE property_details (
  listing_id VARCHAR(36) PRIMARY KEY,
  host_id VARCHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  location VARCHAR(300) NOT NULL,
  price_per_night DECIMAL(10,2) NOT NULL,
  status ENUM('ACTIVE','INACTIVE','SUSPENDED') 
         NOT NULL DEFAULT 'ACTIVE',
  booking_mode ENUM('INSTANT','REQUEST') NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP 
             ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_host_id (host_id)
);

USE availability_db;
CREATE TABLE hold (
  hold_id VARCHAR(36) PRIMARY KEY,
  listing_id VARCHAR(36) NOT NULL,
  booking_id VARCHAR(36),
  guest_id VARCHAR(36) NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  ttl_seconds INT NOT NULL DEFAULT 900,
  expires_at DATETIME NOT NULL,
  reason VARCHAR(100),
  status ENUM('HELD','PENDING_HOST','EXPIRED',
              'CONFIRMED','RELEASED') 
         NOT NULL DEFAULT 'HELD',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_listing_dates (listing_id, check_in_date, check_out_date),
  INDEX idx_expires_at (expires_at)
);

CREATE TABLE reservation (
  reservation_id VARCHAR(36) PRIMARY KEY,
  listing_id VARCHAR(36) NOT NULL,
  booking_id VARCHAR(36) NOT NULL,
  guest_id VARCHAR(36) NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_listing_dates (listing_id, check_in_date, check_out_date)
);

USE stay_db;
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
  deposit_status ENUM('HELD','RELEASED','CAPTURED','RESOLVED') 
                 NOT NULL DEFAULT 'HELD',
  checkout_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP 
             ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_guest_id (guest_id),
  INDEX idx_checkout_deposit (checkout_time, deposit_status)
);

USE inspection_db;
CREATE TABLE inspection_report (
  inspection_id VARCHAR(36) PRIMARY KEY,
  stay_id VARCHAR(36) NOT NULL UNIQUE,
  host_id VARCHAR(36) NOT NULL,
  condition_result ENUM('GOOD','BAD') NOT NULL,
  photos TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

USE payment_logs_db;
CREATE TABLE payment_transaction (
  payment_log_id VARCHAR(36) PRIMARY KEY,
  booking_id VARCHAR(36) NOT NULL,
  payment_txn_id VARCHAR(100),
  transaction_type ENUM('BOOKING_PAYMENT_CAPTURE',
                        'BOOKING_PAYMENT_AUTHORIZE',
                        'PAYMENT_VOID') NOT NULL,
  amount DECIMAL(10,2),
  status ENUM('SUCCESS','AUTHORIZED','VOIDED','FAILED') NOT NULL,
  idempotency_key VARCHAR(150),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_booking_id (booking_id)
);

CREATE TABLE deposit_hold (
  deposit_log_id VARCHAR(36) PRIMARY KEY,
  booking_id VARCHAR(36) NOT NULL,
  deposit_txn_id VARCHAR(100),
  transaction_type ENUM('DEPOSIT_PREAUTHORIZE',
                        'DEPOSIT_RELEASE',
                        'DEPOSIT_CAPTURE') NOT NULL,
  deposit_amount DECIMAL(10,2),
  status ENUM('HELD','RELEASED','CAPTURED','FAILED') NOT NULL,
  reason VARCHAR(100),
  idempotency_key VARCHAR(150),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_booking_id (booking_id)
);

USE search_db;
CREATE TABLE listing_index (
  listing_id VARCHAR(36) PRIMARY KEY,
  host_id VARCHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  location VARCHAR(300) NOT NULL,
  price_per_night DECIMAL(10,2) NOT NULL,
  rating DECIMAL(3,2) DEFAULT 0.00,
  availability_status ENUM('AVAILABLE','UNAVAILABLE') 
                      NOT NULL DEFAULT 'AVAILABLE',
  booking_mode ENUM('INSTANT','REQUEST') NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP 
             ON UPDATE CURRENT_TIMESTAMP,
  FULLTEXT INDEX idx_search (title, location)
);

USE notification_db;
CREATE TABLE notification_message (
  notification_id VARCHAR(36) PRIMARY KEY,
  recipient_id VARCHAR(36) NOT NULL,
  recipient_phone VARCHAR(20),
  channel ENUM('SMS') NOT NULL DEFAULT 'SMS',
  message_body TEXT NOT NULL,
  event_type VARCHAR(100),
  reference_id VARCHAR(100),
  status ENUM('SENT','FAILED','SIMULATED') 
         NOT NULL DEFAULT 'SIMULATED',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

USE deposit_db;
CREATE TABLE deposit_resolution (
  resolution_id VARCHAR(36) PRIMARY KEY,
  stay_id VARCHAR(36) NOT NULL,
  guest_id VARCHAR(36) NOT NULL,
  host_id VARCHAR(36) NOT NULL,
  deposit_txn_id VARCHAR(100),
  amount DECIMAL(10,2),
  action ENUM('RELEASE','CAPTURE','AUTO_RELEASE') NOT NULL,
  reason ENUM('HOST_REPORT','DAMAGE','NO_REPORT_48HR') NOT NULL,
  status ENUM('RESOLVED','FAILED') NOT NULL DEFAULT 'RESOLVED',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
