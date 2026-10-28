-- Category clean-up for shopee_db.
-- Run once:  mysql -u root -p shopee_db < backend/migrations/002_cleanup_categories.sql
-- Safe to re-run.

-- MySQL Workbench's "safe update mode" rejects UPDATE/DELETE statements that have no
-- key in their WHERE clause (error 1175). Switch it off for this script only.
SET @old_safe_updates = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

-- 1) The original seed inserted every top-level category twice (ids 11-20 copy
--    ids 1-10). Point anything that uses a duplicate at the original, then
--    remove the duplicates.
UPDATE products p
INNER JOIN categories dup ON dup.category_id = p.category_id
INNER JOIN categories keep
        ON keep.category_name = dup.category_name
       AND keep.parent_category_id <=> dup.parent_category_id
       AND keep.category_id < dup.category_id
SET p.category_id = keep.category_id;

DELETE dup
FROM categories dup
INNER JOIN categories keep
        ON keep.category_name = dup.category_name
       AND keep.parent_category_id <=> dup.parent_category_id
       AND keep.category_id < dup.category_id;

-- 2) Stop it happening again. The existing unique key ignores top-level rows
--    because NULL never equals NULL, so index a COALESCEd copy of the parent.
SET @has_col = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'parent_key'
);
SET @sql = IF(@has_col = 0,
  'ALTER TABLE categories
     ADD COLUMN parent_key int GENERATED ALWAYS AS (IFNULL(parent_category_id, 0)) VIRTUAL,
     ADD UNIQUE KEY uq_category_name_per_parent (parent_key, category_name)',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) Notifications are listed per user, newest first.
SET @has_idx = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications'
    AND INDEX_NAME = 'idx_notifications_user_date'
);
SET @sql = IF(@has_idx = 0,
  'CREATE INDEX idx_notifications_user_date ON notifications (user_id, created_at)',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET SQL_SAFE_UPDATES = @old_safe_updates;
