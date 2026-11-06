-- Login lockout + forgot-password support.
-- Run once:  mysql -u root -p shopee_db < backend/migrations/005_security.sql
-- Safe to re-run. The server also applies this file automatically on startup.
-- Times are stored as Unix seconds (UTC) so time zones never matter.
-- Keep each statement ending with a semicolon at the end of a line.

-- 1) Failed login attempts, tracked per email address (whether or not an
--    account exists, so the lockout reveals nothing about which emails are
--    registered). 3 failures lock the email for 15 minutes.
CREATE TABLE IF NOT EXISTS login_attempts (
  email varchar(100) NOT NULL,
  failed_count int NOT NULL DEFAULT 0,
  locked_until bigint DEFAULT NULL,
  last_failed_at bigint DEFAULT NULL,
  PRIMARY KEY (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) One row per "forgot password" request. Only hashes are stored: the
--    6-digit code and the reset token are never saved in plain text.
CREATE TABLE IF NOT EXISTS password_resets (
  reset_id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NOT NULL,
  code_hash char(64) NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  expires_at bigint NOT NULL,
  verified_at bigint DEFAULT NULL,
  token_hash char(64) DEFAULT NULL,
  token_expires_at bigint DEFAULT NULL,
  used_at bigint DEFAULT NULL,
  created_at bigint NOT NULL,
  PRIMARY KEY (reset_id),
  UNIQUE KEY token_hash (token_hash),
  KEY idx_password_resets_user (user_id),
  CONSTRAINT password_resets_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
