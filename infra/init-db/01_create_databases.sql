CREATE DATABASE IF NOT EXISTS booking_db;
CREATE DATABASE IF NOT EXISTS user_db;
CREATE DATABASE IF NOT EXISTS listings_db;
CREATE DATABASE IF NOT EXISTS availability_db;
CREATE DATABASE IF NOT EXISTS stay_db;
CREATE DATABASE IF NOT EXISTS inspection_db;
CREATE DATABASE IF NOT EXISTS payment_logs_db;
CREATE DATABASE IF NOT EXISTS search_db;
CREATE DATABASE IF NOT EXISTS notification_db;
CREATE DATABASE IF NOT EXISTS deposit_db;

CREATE USER IF NOT EXISTS 'appuser'@'%' IDENTIFIED BY 'apppassword';

GRANT ALL PRIVILEGES ON booking_db.* TO 'appuser'@'%';
GRANT ALL PRIVILEGES ON user_db.* TO 'appuser'@'%';
GRANT ALL PRIVILEGES ON listings_db.* TO 'appuser'@'%';
GRANT ALL PRIVILEGES ON availability_db.* TO 'appuser'@'%';
GRANT ALL PRIVILEGES ON stay_db.* TO 'appuser'@'%';
GRANT ALL PRIVILEGES ON inspection_db.* TO 'appuser'@'%';
GRANT ALL PRIVILEGES ON payment_logs_db.* TO 'appuser'@'%';
GRANT ALL PRIVILEGES ON search_db.* TO 'appuser'@'%';
GRANT ALL PRIVILEGES ON notification_db.* TO 'appuser'@'%';
GRANT ALL PRIVILEGES ON deposit_db.* TO 'appuser'@'%';

GRANT ALL PRIVILEGES ON *.* TO 'root'@'%';

FLUSH PRIVILEGES;
