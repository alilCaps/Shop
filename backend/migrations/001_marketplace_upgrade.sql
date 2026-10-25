-- Marketplace upgrade for shopee_db.
-- Run once:  mysql -u root -p shopee_db < backend/migrations/001_marketplace_upgrade.sql
-- Safe to re-run: every statement is guarded.

-- 1) System settings (admin "Settings" page, shipping rules used at checkout)
CREATE TABLE IF NOT EXISTS app_settings (
  setting_id bigint NOT NULL AUTO_INCREMENT,
  setting_name varchar(100) NOT NULL,
  setting_value varchar(500) NOT NULL,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_id),
  UNIQUE KEY setting_name (setting_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO app_settings (setting_name, setting_value) VALUES
  ('site_name', 'Shopee-Style Marketplace'),
  ('support_email', 'support@shopee.local'),
  ('shipping_fee', '50'),
  ('free_shipping_minimum', '1000');

-- 2) Every product needs at least one purchasable variant with stock.
INSERT INTO product_variants (product_id, sku, variant_name, price, status)
SELECT p.product_id, CONCAT('SKU-', p.product_id, '-STD'), 'Standard', p.base_price, 'ACTIVE'
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM product_variants v WHERE v.product_id = p.product_id
);

INSERT INTO inventory (variant_id, quantity, reserved_quantity)
SELECT v.variant_id, 50, 0
FROM product_variants v
WHERE NOT EXISTS (
  SELECT 1 FROM inventory i WHERE i.variant_id = v.variant_id
);
