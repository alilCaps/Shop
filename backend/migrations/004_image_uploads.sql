-- Image uploads. Images are stored on disk under backend/uploads/ and the
-- database keeps only their path (e.g. /uploads/ab12...f9.jpg) in the existing
-- columns: users.profile_image, shops.shop_logo, product_images.image_url.
-- This table records who uploaded what.
-- Run once:  mysql -u root -p shopee_db < backend/migrations/004_image_uploads.sql
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS uploaded_files (
  file_id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint DEFAULT NULL,
  file_path varchar(255) NOT NULL,
  mime_type varchar(50) NOT NULL,
  size_bytes int NOT NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (file_id),
  UNIQUE KEY file_path (file_path),
  KEY idx_uploaded_files_user (user_id),
  CONSTRAINT uploaded_files_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
