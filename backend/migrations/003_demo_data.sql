-- Demo data for shopee_db (sellers, shops, products, customers, orders, reviews...).
-- Run through the seed script so the password placeholder is replaced with a
-- real bcrypt hash:   cd backend && npm run seed      (demo password: Demo@1234)
-- Safe to re-run: every row uses a reserved explicit id with INSERT IGNORE.
-- Reserved ids: users 101-109, shops 101-104, addresses 101-107, products 101-140,
-- variants 101-150, images 124-138 & 201-240, orders 1001-1016, order_items 2001-2025,
-- reviews 3001-3010, seller_feedback 4001-4006, notifications 8001-8021.
-- Needs migration 001 (it does not touch existing rows) and category ids
-- 1-10 and 21-24 (still present after migration 002).

-- MySQL Workbench's "safe update mode" rejects UPDATE/DELETE statements that have no
-- key in their WHERE clause (error 1175). Switch it off for this script only.
SET @old_safe_updates = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

SET NAMES utf8mb4;

-- ------------------------------------------------------------------
-- 1) Users: 4 sellers (role 3) and 5 customers (role 2)
-- ------------------------------------------------------------------
INSERT IGNORE INTO users
  (user_id, role_id, username, email, password_hash, first_name, last_name, phone, profile_image, status, email_verified, phone_verified)
VALUES
  (101, 3, 'techhub_manila',  'techhub_manila@shopee.local',  '__DEMO_PASSWORD_HASH__', 'Ramon', 'Dela Cruz', '09181234501', NULL, 'ACTIVE', 1, 1),
  (102, 3, 'casabella_home',  'casabella_home@shopee.local',  '__DEMO_PASSWORD_HASH__', 'Liza',  'Navarro',   '09181234502', NULL, 'ACTIVE', 1, 1),
  (103, 3, 'urbanthreads_ph', 'urbanthreads_ph@shopee.local', '__DEMO_PASSWORD_HASH__', 'Joy',   'Bautista',  '09181234503', NULL, 'ACTIVE', 1, 1),
  (104, 3, 'markgadgets',     'markgadgets@shopee.local',     '__DEMO_PASSWORD_HASH__', 'Mark',  'Lim',       '09181234504', NULL, 'ACTIVE', 1, 0),
  (105, 2, 'ana_reyes',       'ana_reyes@shopee.local',       '__DEMO_PASSWORD_HASH__', 'Ana',   'Reyes',     '09171234501', NULL, 'ACTIVE', 1, 1),
  (106, 2, 'miguel_santos',   'miguel_santos@shopee.local',   '__DEMO_PASSWORD_HASH__', 'Miguel','Santos',    '09171234502', NULL, 'ACTIVE', 1, 1),
  (107, 2, 'carla_mendoza',   'carla_mendoza@shopee.local',   '__DEMO_PASSWORD_HASH__', 'Carla', 'Mendoza',   '09171234503', NULL, 'ACTIVE', 1, 0),
  (108, 2, 'paolo_garcia',    'paolo_garcia@shopee.local',    '__DEMO_PASSWORD_HASH__', 'Paolo', 'Garcia',    '09171234504', NULL, 'ACTIVE', 1, 1),
  (109, 2, 'bea_villanueva',  'bea_villanueva@shopee.local',  '__DEMO_PASSWORD_HASH__', 'Bea',   'Villanueva','09171234505', NULL, 'ACTIVE', 1, 1);

-- ------------------------------------------------------------------
-- 2) Shops (3 active, 1 pending for the admin approval demo)
-- ------------------------------------------------------------------
INSERT IGNORE INTO shops
  (shop_id, owner_id, shop_name, shop_description, shop_logo, shop_banner, contact_email, contact_phone, shop_address, status, rating, total_reviews)
VALUES
  (101, 101, 'TechHub Manila',  'Gadgets, laptops and accessories from trusted brands with fast Metro Manila shipping.', NULL, NULL, 'techhub_manila@shopee.local',  '09181234501', 'Greenhills, San Juan, Metro Manila', 'ACTIVE',  0.00, 0),
  (102, 102, 'Casa Bella Home', 'Everything for a cozy home plus pantry favorites and everyday wellness essentials.',    NULL, NULL, 'casabella_home@shopee.local',  '09181234502', 'Mandaue City, Cebu',                 'ACTIVE',  0.00, 0),
  (103, 103, 'Urban Threads PH','Everyday fashion, footwear, bags and beauty picks for the whole family.',                NULL, NULL, 'urbanthreads_ph@shopee.local', '09181234503', 'Marikina City, Metro Manila',        'ACTIVE',  0.00, 0),
  (104, 104, 'Kuya Mark''s Gadgets', 'Pre-loved and brand new gadgets. Waiting for approval.',                           NULL, NULL, 'markgadgets@shopee.local',     '09181234504', 'Cabanatuan City, Nueva Ecija',       'PENDING', 0.00, 0);

-- ------------------------------------------------------------------
-- 3) Customer addresses (one default each, two customers have more)
-- ------------------------------------------------------------------
INSERT IGNORE INTO addresses
  (address_id, user_id, recipient_name, phone, address_line, barangay, city, province, region, postal_code, country, address_type, is_default)
VALUES
  (101, 105, 'Ana Reyes',       '09171234501', '45 Maginhawa Street',         'Teachers Village East', 'Quezon City', 'Metro Manila',  'NCR',        '1101', 'Philippines', 'HOME',  1),
  (102, 105, 'Ana Reyes',       '09171234501', 'Unit 12B, Ayala Triangle Tower','Bel-Air',             'Makati City', 'Metro Manila',  'NCR',        '1209', 'Philippines', 'WORK',  0),
  (103, 106, 'Miguel Santos',   '09171234502', '88 Osmena Boulevard',         'Capitol Site',          'Cebu City',   'Cebu',          'Region VII', '6000', 'Philippines', 'HOME',  1),
  (104, 107, 'Carla Mendoza',   '09171234503', '17 Quimpo Boulevard',         'Matina',                'Davao City',  'Davao del Sur', 'Region XI',  '8000', 'Philippines', 'HOME',  1),
  (105, 108, 'Paolo Garcia',    '09171234504', '23 Jupiter Street',           'Bel-Air',               'Makati City', 'Metro Manila',  'NCR',        '1209', 'Philippines', 'HOME',  1),
  (106, 109, 'Bea Villanueva',  '09171234505', '9 General Luna Street',       'Molo',                  'Iloilo City', 'Iloilo',        'Region VI',  '5000', 'Philippines', 'HOME',  1),
  (107, 106, 'Miguel Santos',   '09171234502', 'Block 4 Lot 7, Mabolo Heights','Mabolo',               'Cebu City',   'Cebu',          'Region VII', '6000', 'Philippines', 'OTHER', 0);

-- ------------------------------------------------------------------
-- 4) Products 101-140 (shop 101: 101-114, shop 102: 115-127, shop 103: 128-140)
-- ------------------------------------------------------------------
INSERT IGNORE INTO products
  (product_id, shop_id, category_id, product_name, description, brand, base_price, status, rating, total_reviews, total_sold)
VALUES
  (101, 101, 1,  'True Wireless Earbuds with Charging Case', 'Bluetooth 5.3 earbuds with touch controls, a noise-reducing mic and up to 24 hours of battery with the case.', 'SoundPeak', 599.00, 'ACTIVE', 4.60, 212, 1840),
  (102, 101, 1,  'Portable Bluetooth Speaker Waterproof', 'IPX6 splash-proof speaker with deep bass and 12 hours of playtime. Perfect for the beach or pool.', 'SoundPeak', 899.00, 'ACTIVE', 4.70, 168, 1320),
  (103, 101, 1,  '20000mAh Power Bank Fast Charge', 'Dual USB-A and USB-C output with 22.5W fast charging. Charges most phones four to five times.', 'VoltGo', 1099.00, 'ACTIVE', 4.80, 305, 2760),
  (104, 101, 1,  '65W USB-C GaN Charger', 'Compact GaN wall charger that powers laptops, tablets and phones from a single port.', 'VoltGo', 749.00, 'ACTIVE', 4.70, 129, 980),
  (105, 101, 1,  'Smart Watch Fitness Tracker', '1.8-inch display with heart rate, sleep tracking, 100+ sport modes and a 7-day battery.', 'FitPulse', 1499.00, 'ACTIVE', 4.50, 244, 1650),
  (106, 101, 21, '14-inch Student Laptop Intel Core i5', 'Lightweight 14-inch FHD laptop with an Intel Core i5, 8GB RAM and a 512GB SSD. Windows 11 ready.', 'NovaBook', 28990.00, 'ACTIVE', 4.60, 57, 210),
  (107, 101, 21, 'Mechanical Keyboard 87-Key RGB', 'Hot-swappable tenkeyless keyboard with tactile switches and per-key RGB lighting.', 'KeyForge', 1899.00, 'ACTIVE', 4.80, 141, 730),
  (108, 101, 21, 'Silent Wireless Mouse Ergonomic', '2.4GHz wireless mouse with silent clicks, adjustable DPI and a long battery life.', 'ClickPro', 399.00, 'ACTIVE', 4.50, 402, 4120),
  (109, 101, 21, 'Aluminum Laptop Stand Adjustable', 'Foldable laptop stand with six height levels for better posture and cooling. Fits 10 to 17 inch laptops.', 'DeskMate', 549.00, 'ACTIVE', 4.70, 176, 1530),
  (110, 101, 21, 'USB 3.0 Hub 4-Port', 'Slim 4-port USB 3.0 hub with a 30cm cable for fast file transfers.', 'DeskMate', 259.00, 'ACTIVE', 4.40, 98, 870),
  (111, 101, 10, 'Blue Light Blocking Glasses', 'Lightweight anti-glare computer glasses to reduce eye strain during long screen time.', 'ClearView', 349.00, 'ACTIVE', 4.50, 87, 640),
  (112, 101, 10, 'Polarized Sunglasses Unisex', 'UV400 polarized lenses in a durable frame. Includes a soft case and cleaning cloth.', 'ClearView', 449.00, 'ACTIVE', 4.60, 73, 560),
  (113, 101, 10, 'Slim Leather Wallet', 'Genuine leather bifold wallet with six card slots and a coin pocket.', 'Harbor & Co', 499.00, 'ACTIVE', 4.70, 64, 420),
  (114, 101, 1,  'LED Ring Light 10-inch with Tripod', 'Dimmable ring light with three colour modes and a phone holder. Great for vlogs and online selling.', 'GlowUp', 699.00, 'OUT_OF_STOCK', 4.40, 52, 390),

  (115, 102, 3,  'Non-Stick Cookware Set 5pcs', 'Five-piece granite-coated cookware set with a frying pan, saucepan and casserole. Works on gas and induction.', 'KitchenJoy', 1799.00, 'ACTIVE', 4.70, 96, 610),
  (116, 102, 3,  'Electric Kettle 1.8L Stainless Steel', 'Fast-boil kettle with auto shut-off and boil-dry protection.', 'KitchenJoy', 649.00, 'ACTIVE', 4.60, 133, 980),
  (117, 102, 3,  'Memory Foam Pillow', 'Slow-rebound memory foam pillow that supports the neck and keeps its shape.', 'DreamNest', 549.00, 'ACTIVE', 4.80, 210, 1740),
  (118, 102, 3,  'Cotton Bed Sheet Set', 'Soft 100% cotton sheet set with a fitted sheet, a flat sheet and two pillowcases.', 'DreamNest', 999.00, 'ACTIVE', 4.60, 118, 890),
  (119, 102, 3,  'Silent Quartz Wall Clock 12-inch', 'Minimalist wall clock with a silent sweep movement. Needs one AA battery.', 'Casa Bella', 299.00, 'ACTIVE', 4.50, 79, 540),
  (120, 102, 3,  'Aroma Diffuser with LED Light', 'Ultrasonic essential oil diffuser with seven colour lights and auto shut-off.', 'Casa Bella', 459.00, 'ACTIVE', 4.70, 154, 1210),
  (121, 102, 3,  'Stackable Storage Bins 3pcs', 'Set of three stackable bins with lids for closets, kitchens and kids rooms.', 'NeatNest', 389.00, 'ACTIVE', 4.60, 141, 1090),
  (122, 102, 7,  'Benguet Arabica Coffee Beans 250g', 'Medium roast single-origin arabica from the Cordillera highlands with chocolate and nutty notes.', 'Cordillera Roast', 289.00, 'ACTIVE', 4.90, 187, 1530),
  (123, 102, 7,  'Dried Mangoes 200g', 'Naturally sweet Cebu dried mangoes with no added preservatives.', 'Cebu Sweet', 169.00, 'ACTIVE', 4.80, 325, 3410),
  (124, 102, 7,  'Premium Jasmine Rice 5kg', 'Fragrant, soft-cooking jasmine rice, vacuum-packed for freshness.', 'Golden Harvest', 349.00, 'ACTIVE', 4.60, 92, 780),
  (125, 102, 4,  'Vitamin C 500mg 100 Tablets', 'Daily vitamin C supplement to support immune health. Take one tablet a day after meals.', 'VitaLife', 349.00, 'ACTIVE', 4.70, 266, 2340),
  (126, 102, 23, 'Non-Contact Infrared Thermometer', 'Digital forehead thermometer with a one-second reading and a fever alarm.', 'CareTech', 799.00, 'ACTIVE', 4.60, 84, 520),
  (127, 102, 23, 'Alcohol Hand Sanitizer 500ml', '70% ethyl alcohol sanitizer gel with moisturizer, in a pump bottle.', 'PureGuard', 129.00, 'ACTIVE', 4.50, 198, 2980),

  (128, 103, 2,  'Men''s Cotton Polo Shirt', 'Breathable pique cotton polo with a classic fit. Easy to wear to work or on weekends.', 'Urban Threads', 349.00, 'ACTIVE', 4.60, 208, 1960),
  (129, 103, 2,  'Women''s High-Waist Jogger Pants', 'Soft stretch joggers with a drawstring waist and side pockets.', 'Urban Threads', 449.00, 'ACTIVE', 4.70, 172, 1380),
  (130, 103, 2,  'Unisex Fleece Hoodie', 'Midweight fleece pullover hoodie with a kangaroo pocket. Perfect for cool mornings.', 'Urban Threads', 699.00, 'ACTIVE', 4.80, 239, 2050),
  (131, 103, 8,  'Breathable Mesh Running Shoes', 'Lightweight running shoes with a cushioned sole and a breathable knit upper.', 'StrideX', 1599.00, 'ACTIVE', 4.60, 121, 830),
  (132, 103, 8,  'Classic Canvas Sneakers', 'Everyday low-top canvas sneakers with a vulcanized rubber sole.', 'StrideX', 899.00, 'ACTIVE', 4.50, 164, 1260),
  (133, 103, 24, 'Comfort Slide Sandals', 'Cushioned EVA slides with a non-slip sole. Easy to wash and quick to dry.', 'SoleMate', 249.00, 'ACTIVE', 4.60, 287, 3120),
  (134, 103, 24, 'Rubber Flip Flops Unisex', 'Lightweight everyday flip flops with a soft strap.', 'SoleMate', 149.00, 'ACTIVE', 4.40, 356, 4680),
  (135, 103, 9,  'Canvas Tote Bag', 'Heavy-duty canvas tote with an inner zip pocket, roomy enough for a laptop and groceries.', 'Harbor & Co', 299.00, 'ACTIVE', 4.70, 143, 1210),
  (136, 103, 9,  'Waterproof Travel Duffel Bag 40L', 'Foldable duffel with a shoulder strap and a wet pocket for gym and weekend trips.', 'TrailMate', 899.00, 'ACTIVE', 4.50, 66, 470),
  (137, 103, 22, 'Matte Lipstick Set 6 Shades', 'Six long-wearing matte lipsticks in everyday nude and berry shades.', 'Rosewood', 399.00, 'ACTIVE', 4.40, 189, 1720),
  (138, 103, 22, 'Floral Eau de Parfum 50ml', 'Long-lasting floral and musk fragrance in a 50ml spray bottle.', 'Maison Aria', 1299.00, 'ACTIVE', 4.70, 77, 360),
  (139, 103, 5,  'Non-Slip Yoga Mat 6mm', 'Cushioned 6mm exercise mat with a textured grip and a carrying strap.', 'FlexFit', 499.00, 'ACTIVE', 4.60, 134, 990),
  (140, 103, 6,  'Wooden Building Blocks 100pcs', '100 smooth-edged wooden blocks in bright colours that build fine motor skills.', 'PlayNest', 449.00, 'ACTIVE', 4.80, 96, 640);

-- ------------------------------------------------------------------
-- 5) Variants: variant id = product id for the 'Standard' variant (101-140),
--    141-150 are second variants.
-- ------------------------------------------------------------------
INSERT IGNORE INTO product_variants
  (variant_id, product_id, sku, variant_name, price, weight, status)
VALUES
  (101, 101, 'SKU-101-STD', 'Standard', 599.00,   0.060, 'ACTIVE'),
  (102, 102, 'SKU-102-STD', 'Standard', 899.00,   0.500, 'ACTIVE'),
  (103, 103, 'SKU-103-STD', 'Standard', 1099.00,  0.450, 'ACTIVE'),
  (104, 104, 'SKU-104-STD', 'Standard', 749.00,   0.150, 'ACTIVE'),
  (105, 105, 'SKU-105-STD', 'Standard', 1499.00,  0.080, 'ACTIVE'),
  (106, 106, 'SKU-106-STD', 'Standard', 28990.00, 1.400, 'ACTIVE'),
  (107, 107, 'SKU-107-STD', 'Standard', 1899.00,  0.800, 'ACTIVE'),
  (108, 108, 'SKU-108-STD', 'Standard', 399.00,   0.100, 'ACTIVE'),
  (109, 109, 'SKU-109-STD', 'Standard', 549.00,   0.600, 'ACTIVE'),
  (110, 110, 'SKU-110-STD', 'Standard', 259.00,   0.080, 'ACTIVE'),
  (111, 111, 'SKU-111-STD', 'Standard', 349.00,   0.030, 'ACTIVE'),
  (112, 112, 'SKU-112-STD', 'Standard', 449.00,   0.040, 'ACTIVE'),
  (113, 113, 'SKU-113-STD', 'Standard', 499.00,   0.080, 'ACTIVE'),
  (114, 114, 'SKU-114-STD', 'Standard', 699.00,   1.100, 'ACTIVE'),
  (115, 115, 'SKU-115-STD', 'Standard', 1799.00,  3.500, 'ACTIVE'),
  (116, 116, 'SKU-116-STD', 'Standard', 649.00,   1.000, 'ACTIVE'),
  (117, 117, 'SKU-117-STD', 'Standard', 549.00,   1.000, 'ACTIVE'),
  (118, 118, 'SKU-118-STD', 'Standard', 999.00,   1.200, 'ACTIVE'),
  (119, 119, 'SKU-119-STD', 'Standard', 299.00,   0.400, 'ACTIVE'),
  (120, 120, 'SKU-120-STD', 'Standard', 459.00,   0.500, 'ACTIVE'),
  (121, 121, 'SKU-121-STD', 'Standard', 389.00,   1.500, 'ACTIVE'),
  (122, 122, 'SKU-122-STD', 'Standard', 289.00,   0.250, 'ACTIVE'),
  (123, 123, 'SKU-123-STD', 'Standard', 169.00,   0.200, 'ACTIVE'),
  (124, 124, 'SKU-124-STD', 'Standard', 349.00,   5.000, 'ACTIVE'),
  (125, 125, 'SKU-125-STD', 'Standard', 349.00,   0.150, 'ACTIVE'),
  (126, 126, 'SKU-126-STD', 'Standard', 799.00,   0.100, 'ACTIVE'),
  (127, 127, 'SKU-127-STD', 'Standard', 129.00,   0.550, 'ACTIVE'),
  (128, 128, 'SKU-128-STD', 'Standard', 349.00,   0.250, 'ACTIVE'),
  (129, 129, 'SKU-129-STD', 'Standard', 449.00,   0.350, 'ACTIVE'),
  (130, 130, 'SKU-130-STD', 'Standard', 699.00,   0.600, 'ACTIVE'),
  (131, 131, 'SKU-131-STD', 'Standard', 1599.00,  0.700, 'ACTIVE'),
  (132, 132, 'SKU-132-STD', 'Standard', 899.00,   0.600, 'ACTIVE'),
  (133, 133, 'SKU-133-STD', 'Standard', 249.00,   0.300, 'ACTIVE'),
  (134, 134, 'SKU-134-STD', 'Standard', 149.00,   0.250, 'ACTIVE'),
  (135, 135, 'SKU-135-STD', 'Standard', 299.00,   0.300, 'ACTIVE'),
  (136, 136, 'SKU-136-STD', 'Standard', 899.00,   0.800, 'ACTIVE'),
  (137, 137, 'SKU-137-STD', 'Standard', 399.00,   0.200, 'ACTIVE'),
  (138, 138, 'SKU-138-STD', 'Standard', 1299.00,  0.350, 'ACTIVE'),
  (139, 139, 'SKU-139-STD', 'Standard', 499.00,   1.100, 'ACTIVE'),
  (140, 140, 'SKU-140-STD', 'Standard', 449.00,   1.000, 'ACTIVE'),
  (141, 106, 'SKU-106-16GB',    '16GB RAM / 512GB SSD', 32990.00, 1.400, 'ACTIVE'),
  (142, 117, 'SKU-117-CNT',     'Contour',              649.00,   1.000, 'ACTIVE'),
  (143, 118, 'SKU-118-KNG',     'King',                 1199.00,  1.400, 'ACTIVE'),
  (144, 122, 'SKU-122-GRD',     'Ground',               289.00,   0.250, 'ACTIVE'),
  (145, 128, 'SKU-128-L',       'Large',                349.00,   0.280, 'ACTIVE'),
  (146, 130, 'SKU-130-GRY-L',   'Gray / Large',         699.00,   0.650, 'ACTIVE'),
  (147, 131, 'SKU-131-43',      'Size 43',              1599.00,  0.720, 'ACTIVE'),
  (148, 132, 'SKU-132-43',      'Size 43',              899.00,   0.620, 'ACTIVE'),
  (149, 138, 'SKU-138-100',     '100ml',                2199.00,  0.500, 'ACTIVE'),
  (150, 136, 'SKU-136-60L',     '60L',                  1199.00,  1.000, 'ACTIVE');

-- ------------------------------------------------------------------
-- 6) Inventory (inventory id = variant id). 114 is out of stock,
--    124 and 137 are low on stock (threshold 5).
-- ------------------------------------------------------------------
INSERT IGNORE INTO inventory
  (inventory_id, variant_id, quantity, reserved_quantity, low_stock_threshold)
VALUES
  (101, 101, 80, 0, 5), (102, 102, 45, 0, 5), (103, 103, 60, 0, 5), (104, 104, 70, 0, 5),
  (105, 105, 35, 0, 5), (106, 106, 12, 0, 5), (107, 107, 25, 0, 5), (108, 108, 150, 0, 5),
  (109, 109, 40, 0, 5), (110, 110, 90, 0, 5), (111, 111, 55, 0, 5), (112, 112, 48, 0, 5),
  (113, 113, 30, 0, 5), (114, 114, 0, 0, 5),  (115, 115, 18, 0, 5), (116, 116, 42, 0, 5),
  (117, 117, 64, 0, 5), (118, 118, 27, 0, 5), (119, 119, 85, 0, 5), (120, 120, 33, 0, 5),
  (121, 121, 76, 0, 5), (122, 122, 120, 0, 5), (123, 123, 200, 0, 5), (124, 124, 3, 0, 5),
  (125, 125, 160, 0, 5), (126, 126, 22, 0, 5), (127, 127, 300, 0, 5), (128, 128, 90, 0, 5),
  (129, 129, 70, 0, 5), (130, 130, 45, 0, 5), (131, 131, 4, 0, 5),  (132, 132, 60, 0, 5),
  (133, 133, 110, 0, 5), (134, 134, 240, 0, 5), (135, 135, 95, 0, 5), (136, 136, 28, 0, 5),
  (137, 137, 5, 0, 5),  (138, 138, 14, 0, 5), (139, 139, 52, 0, 5), (140, 140, 38, 0, 5),
  (141, 141, 8, 0, 5),  (142, 142, 30, 0, 5), (143, 143, 15, 0, 5), (144, 144, 100, 0, 5),
  (145, 145, 60, 0, 5), (146, 146, 35, 0, 5), (147, 147, 20, 0, 5), (148, 148, 40, 0, 5),
  (149, 149, 9, 0, 5),  (150, 150, 12, 0, 5);

-- ------------------------------------------------------------------
-- 7) Product photos. Files live in backend/uploads/demo/ and are served
--    from /uploads/demo/<file>. image id = 100 + product id.
-- ------------------------------------------------------------------
INSERT IGNORE INTO product_images
  (image_id, product_id, image_url, is_primary, display_order)
VALUES
  -- existing products 24-38 (same pictures the storefront used before)
  (124, 24, '/uploads/demo/rack-organizer.jpg', 1, 0),
  (125, 25, '/uploads/demo/t-shirt.jpg', 1, 0),
  (126, 26, '/uploads/demo/earphones.jpg', 1, 0),
  (127, 27, '/uploads/demo/mattress.jpg', 1, 0),
  (128, 28, '/uploads/demo/eyeglasses.jpg', 1, 0),
  (129, 29, '/uploads/demo/mini-fan.jpg', 1, 0),
  (130, 30, '/uploads/demo/water-bottle.jpg', 1, 0),
  (131, 31, '/uploads/demo/desk-lamp.jpg', 1, 0),
  (132, 32, '/uploads/demo/backpack.jpg', 1, 0),
  (133, 33, '/uploads/demo/wireless-mouse.jpg', 1, 0),
  (134, 34, '/uploads/demo/ceramic-mug.jpg', 1, 0),
  (135, 35, '/uploads/demo/phone-stand.jpg', 1, 0),
  (136, 36, '/uploads/demo/makeup-organizer.jpg', 1, 0),
  (137, 37, '/uploads/demo/led-string-lights.jpg', 1, 0),
  (138, 38, '/uploads/demo/foldable-storage-box.jpg', 1, 0),
  -- new demo products
  (201, 101, '/uploads/demo/earphones.jpg', 1, 0),
  (202, 102, '/uploads/demo/earphones.jpg', 1, 0),
  (203, 103, '/uploads/demo/phone-stand.jpg', 1, 0),
  (204, 104, '/uploads/demo/phone-stand.jpg', 1, 0),
  (205, 105, '/uploads/demo/accessories.jpg', 1, 0),
  (206, 106, '/uploads/demo/laptop-computers.jpg', 1, 0),
  (207, 107, '/uploads/demo/laptop-computers.jpg', 1, 0),
  (208, 108, '/uploads/demo/wireless-mouse.jpg', 1, 0),
  (209, 109, '/uploads/demo/laptop-computers.jpg', 1, 0),
  (210, 110, '/uploads/demo/laptop-computers.jpg', 1, 0),
  (211, 111, '/uploads/demo/eyeglasses.jpg', 1, 0),
  (212, 112, '/uploads/demo/eyeglasses.jpg', 1, 0),
  (213, 113, '/uploads/demo/accessories.jpg', 1, 0),
  (214, 114, '/uploads/demo/led-string-lights.jpg', 1, 0),
  (215, 115, '/uploads/demo/home-living.jpg', 1, 0),
  (216, 116, '/uploads/demo/home-living.jpg', 1, 0),
  (217, 117, '/uploads/demo/mattress.jpg', 1, 0),
  (218, 118, '/uploads/demo/mattress.jpg', 1, 0),
  (219, 119, '/uploads/demo/home-living.jpg', 1, 0),
  (220, 120, '/uploads/demo/led-string-lights.jpg', 1, 0),
  (221, 121, '/uploads/demo/foldable-storage-box.jpg', 1, 0),
  (222, 122, '/uploads/demo/groceries.jpg', 1, 0),
  (223, 123, '/uploads/demo/groceries.jpg', 1, 0),
  (224, 124, '/uploads/demo/groceries.jpg', 1, 0),
  (225, 125, '/uploads/demo/healthPersonalCare.jpg', 1, 0),
  (226, 126, '/uploads/demo/healthPersonalCare.jpg', 1, 0),
  (227, 127, '/uploads/demo/healthPersonalCare.jpg', 1, 0),
  (228, 128, '/uploads/demo/t-shirt.jpg', 1, 0),
  (229, 129, '/uploads/demo/t-shirt.jpg', 1, 0),
  (230, 130, '/uploads/demo/t-shirt.jpg', 1, 0),
  (231, 131, '/uploads/demo/shoes.jpg', 1, 0),
  (232, 132, '/uploads/demo/shoes.jpg', 1, 0),
  (233, 133, '/uploads/demo/shoes.jpg', 1, 0),
  (234, 134, '/uploads/demo/shoes.jpg', 1, 0),
  (235, 135, '/uploads/demo/bags.jpg', 1, 0),
  (236, 136, '/uploads/demo/backpack.jpg', 1, 0),
  (237, 137, '/uploads/demo/makeup-fragrances.jpg', 1, 0),
  (238, 138, '/uploads/demo/makeup-fragrances.jpg', 1, 0),
  (239, 139, '/uploads/demo/sports.jpg', 1, 0),
  (240, 140, '/uploads/demo/toys.jpg', 1, 0);

-- ------------------------------------------------------------------
-- 8) Orders 1001-1016 (one shop per order; shipping 50, free from 1000)
-- ------------------------------------------------------------------
INSERT IGNORE INTO orders
  (order_id, order_number, user_id, subtotal, shipping_fee, discount_amount, total_amount, voucher_id, status, notes, placed_at)
VALUES
  (1001, 'SP20260922DEMO01', 105,   998.00, 50.00, 0.00,   1048.00, NULL, 'COMPLETED',       NULL,                                  '2026-09-22 10:15:00'),
  (1002, 'SP20260924DEMO02', 106,  1799.00,  0.00, 0.00,   1799.00, NULL, 'COMPLETED',       'Please include a gift receipt.',      '2026-09-24 14:05:00'),
  (1003, 'SP20260927DEMO03', 107,  1898.00,  0.00, 0.00,   1898.00, NULL, 'COMPLETED',       NULL,                                  '2026-09-27 19:40:00'),
  (1004, 'SP20260930DEMO04', 108,  1085.00,  0.00, 0.00,   1085.00, NULL, 'COMPLETED',       NULL,                                  '2026-09-30 08:55:00'),
  (1005, 'SP20261019DEMO05', 105,  1499.00,  0.00, 0.00,   1499.00, NULL, 'DELIVERED',       NULL,                                  '2026-10-19 13:30:00'),
  (1006, 'SP20261022DEMO06', 109,  1148.00,  0.00, 0.00,   1148.00, NULL, 'SHIPPED',         NULL,                                  '2026-10-22 09:45:00'),
  (1007, 'SP20261023DEMO07', 106,   758.00, 50.00, 0.00,    808.00, NULL, 'SHIPPED',         'Call before delivery please.',        '2026-10-23 18:20:00'),
  (1008, 'SP20261025DEMO08', 107,  1099.00,  0.00, 0.00,   1099.00, NULL, 'PROCESSING',      NULL,                                  '2026-10-25 20:10:00'),
  (1009, 'SP20261026DEMO09', 108,   798.00, 50.00, 0.00,    848.00, NULL, 'PAID',            NULL,                                  '2026-10-26 09:05:00'),
  (1010, 'SP20261026DEMO10', 109,   808.00, 50.00, 0.00,    858.00, NULL, 'PAID',            NULL,                                  '2026-10-26 15:30:00'),
  (1011, 'SP20261026DEMO11', 105,  1098.00,  0.00, 0.00,   1098.00, NULL, 'PENDING_PAYMENT', NULL,                                  '2026-10-26 21:15:00'),
  (1012, 'SP20261027DEMO12', 106,   547.00, 50.00, 0.00,    597.00, NULL, 'PENDING_PAYMENT', NULL,                                  '2026-10-27 08:40:00'),
  (1013, 'SP20261014DEMO13', 107,   899.00, 50.00, 0.00,    949.00, NULL, 'CANCELLED',       'Ordered by mistake.',                 '2026-10-14 12:00:00'),
  (1014, 'SP20261018DEMO14', 108,  1148.00,  0.00, 0.00,   1148.00, NULL, 'CANCELLED',       NULL,                                  '2026-10-18 17:25:00'),
  (1015, 'SP20261002DEMO15', 109,   948.00, 50.00, 0.00,    998.00, NULL, 'COMPLETED',       NULL,                                  '2026-10-02 16:20:00'),
  (1016, 'SP20261004DEMO16', 105, 28990.00,  0.00, 0.00,  28990.00, NULL, 'COMPLETED',       NULL,                                  '2026-10-04 11:10:00');

INSERT IGNORE INTO order_items
  (order_item_id, order_id, product_id, variant_id, shop_id, product_name, variant_name, quantity, unit_price, subtotal)
VALUES
  (2001, 1001, 101, 101, 101, 'True Wireless Earbuds with Charging Case', 'Standard', 1,   599.00,   599.00),
  (2002, 1001, 108, 108, 101, 'Silent Wireless Mouse Ergonomic',          'Standard', 1,   399.00,   399.00),
  (2003, 1002, 115, 115, 102, 'Non-Stick Cookware Set 5pcs',              'Standard', 1,  1799.00,  1799.00),
  (2004, 1003, 131, 131, 103, 'Breathable Mesh Running Shoes',            'Standard', 1,  1599.00,  1599.00),
  (2005, 1003, 135, 135, 103, 'Canvas Tote Bag',                          'Standard', 1,   299.00,   299.00),
  (2006, 1004, 122, 122, 102, 'Benguet Arabica Coffee Beans 250g',        'Standard', 2,   289.00,   578.00),
  (2007, 1004, 123, 123, 102, 'Dried Mangoes 200g',                       'Standard', 3,   169.00,   507.00),
  (2008, 1005, 105, 105, 101, 'Smart Watch Fitness Tracker',              'Standard', 1,  1499.00,  1499.00),
  (2009, 1006, 130, 130, 103, 'Unisex Fleece Hoodie',                     'Standard', 1,   699.00,   699.00),
  (2010, 1006, 129, 129, 103, 'Women''s High-Waist Jogger Pants',         'Standard', 1,   449.00,   449.00),
  (2011, 1007, 120, 120, 102, 'Aroma Diffuser with LED Light',            'Standard', 1,   459.00,   459.00),
  (2012, 1007, 119, 119, 102, 'Silent Quartz Wall Clock 12-inch',         'Standard', 1,   299.00,   299.00),
  (2013, 1008, 103, 103, 101, '20000mAh Power Bank Fast Charge',          'Standard', 1,  1099.00,  1099.00),
  (2014, 1009, 137, 137, 103, 'Matte Lipstick Set 6 Shades',              'Standard', 2,   399.00,   798.00),
  (2015, 1010, 109, 109, 101, 'Aluminum Laptop Stand Adjustable',         'Standard', 1,   549.00,   549.00),
  (2016, 1010, 110, 110, 101, 'USB 3.0 Hub 4-Port',                       'Standard', 1,   259.00,   259.00),
  (2017, 1011, 117, 117, 102, 'Memory Foam Pillow',                       'Standard', 2,   549.00,  1098.00),
  (2018, 1012, 134, 134, 103, 'Rubber Flip Flops Unisex',                 'Standard', 2,   149.00,   298.00),
  (2019, 1012, 133, 133, 103, 'Comfort Slide Sandals',                    'Standard', 1,   249.00,   249.00),
  (2020, 1013, 102, 102, 101, 'Portable Bluetooth Speaker Waterproof',    'Standard', 1,   899.00,   899.00),
  (2021, 1014, 126, 126, 102, 'Non-Contact Infrared Thermometer',         'Standard', 1,   799.00,   799.00),
  (2022, 1014, 125, 125, 102, 'Vitamin C 500mg 100 Tablets',              'Standard', 1,   349.00,   349.00),
  (2023, 1015, 139, 139, 103, 'Non-Slip Yoga Mat 6mm',                    'Standard', 1,   499.00,   499.00),
  (2024, 1015, 140, 140, 103, 'Wooden Building Blocks 100pcs',            'Standard', 1,   449.00,   449.00),
  (2025, 1016, 106, 106, 101, '14-inch Student Laptop Intel Core i5',     'Standard', 1, 28990.00, 28990.00);

-- Each order ships to the customer's default address (order_address_id = 5000 + order_id - 1000).
INSERT IGNORE INTO order_addresses
  (order_address_id, order_id, recipient_name, phone, address_line, barangay, city, province, region, postal_code, country)
SELECT
  5000 + (o.order_id - 1000), o.order_id, a.recipient_name, a.phone, a.address_line, a.barangay,
  a.city, a.province, a.region, a.postal_code, a.country
FROM orders o
INNER JOIN addresses a ON a.user_id = o.user_id AND a.is_default = 1
WHERE o.order_id BETWEEN 1001 AND 1016;

INSERT IGNORE INTO payments
  (payment_id, order_id, payment_method, transaction_reference, amount, status, paid_at)
VALUES
  (6001, 1001, 'GCASH',            'GCASH-7731045982',  1048.00, 'PAID',    '2026-09-22 10:20:00'),
  (6002, 1002, 'CASH_ON_DELIVERY', NULL,                1799.00, 'PAID',    '2026-09-27 15:10:00'),
  (6003, 1003, 'CREDIT_CARD',      'CC-4482-91736',     1898.00, 'PAID',    '2026-09-27 19:42:00'),
  (6004, 1004, 'MAYA',             'MAYA-5528194037',   1085.00, 'PAID',    '2026-09-30 09:00:00'),
  (6005, 1005, 'GCASH',            'GCASH-7731991204',  1499.00, 'PAID',    '2026-10-19 13:35:00'),
  (6006, 1006, 'BANK_TRANSFER',    'BT-20261022-3381',  1148.00, 'PAID',    '2026-10-22 10:30:00'),
  (6007, 1007, 'CASH_ON_DELIVERY', NULL,                 808.00, 'PENDING', NULL),
  (6008, 1008, 'CASH_ON_DELIVERY', NULL,                1099.00, 'PENDING', NULL),
  (6009, 1009, 'MAYA',             'MAYA-5528342210',    848.00, 'PAID',    '2026-10-26 09:08:00'),
  (6010, 1010, 'DEBIT_CARD',       'DC-9921-45018',      858.00, 'PAID',    '2026-10-26 15:33:00'),
  (6011, 1011, 'GCASH',            NULL,                1098.00, 'PENDING', NULL),
  (6012, 1012, 'MAYA',             NULL,                 597.00, 'PENDING', NULL),
  (6013, 1013, 'GCASH',            NULL,                 949.00, 'FAILED',  NULL),
  (6014, 1014, 'CASH_ON_DELIVERY', NULL,                1148.00, 'FAILED',  NULL),
  (6015, 1015, 'GCASH',            'GCASH-7730512377',   998.00, 'PAID',    '2026-10-02 16:24:00'),
  (6016, 1016, 'BANK_TRANSFER',    'BT-20261004-5520', 28990.00, 'PAID',    '2026-10-04 12:00:00');

INSERT IGNORE INTO shipments
  (shipment_id, order_id, courier, tracking_number, shipping_method, status, shipped_at, delivered_at)
VALUES
  (7001, 1001, 'J&T Express',    'JT1234567801',    'Standard', 'DELIVERED',        '2026-09-23 09:30:00', '2026-09-26 14:30:00'),
  (7002, 1002, 'LBC',            '1100234567',      'Standard', 'DELIVERED',        '2026-09-25 10:00:00', '2026-09-27 15:10:00'),
  (7003, 1003, 'Flash Express',  'FE2026TH00123',   'Standard', 'DELIVERED',        '2026-09-28 11:00:00', '2026-10-01 13:20:00'),
  (7004, 1004, 'LBC',            '1100234988',      'Standard', 'DELIVERED',        '2026-10-01 09:45:00', '2026-10-04 16:05:00'),
  (7005, 1005, 'J&T Express',    'JT1234567855',    'Standard', 'DELIVERED',        '2026-10-20 10:15:00', '2026-10-23 12:40:00'),
  (7006, 1006, 'J&T Express',    'JT1234567890',    'Standard', 'IN_TRANSIT',       '2026-10-23 14:00:00', NULL),
  (7007, 1007, 'Flash Express',  'FE2026TH00471',   'Standard', 'OUT_FOR_DELIVERY', '2026-10-25 08:30:00', NULL),
  (7008, 1015, 'J&T Express',    'JT1234567812',    'Standard', 'DELIVERED',        '2026-10-03 10:00:00', '2026-10-06 11:45:00'),
  (7009, 1016, 'LBC',            '1100235410',      'Standard', 'DELIVERED',        '2026-10-05 09:00:00', '2026-10-08 10:30:00');

-- ------------------------------------------------------------------
-- 9) Reviews (only for items of COMPLETED orders) and shop feedback
-- ------------------------------------------------------------------
INSERT IGNORE INTO reviews
  (review_id, product_id, user_id, order_item_id, rating, review_text, status, created_at)
VALUES
  (3001, 101, 105, 2001, 5, 'Clear sound and the battery lasts all day. Great value for the price!',                         'VISIBLE', '2026-09-28 18:00:00'),
  (3002, 108, 105, 2002, 4, 'Quiet clicks and comfortable in the hand. The receiver is a bit small.',                        'VISIBLE', '2026-09-28 18:05:00'),
  (3003, 115, 106, 2003, 5, 'Heats evenly and nothing sticks. Arrived well packed.',                                         'VISIBLE', '2026-09-29 20:10:00'),
  (3004, 131, 107, 2004, 4, 'Light and breathable. Runs slightly narrow, so size up if you have wide feet.',                 'VISIBLE', '2026-10-03 09:30:00'),
  (3005, 135, 107, 2005, 5, 'Sturdy tote that fits my laptop and groceries.',                                                'VISIBLE', '2026-10-03 09:35:00'),
  (3006, 122, 108, 2006, 5, 'Fresh roast and a lovely aroma. Will reorder.',                                                 'VISIBLE', '2026-10-06 07:50:00'),
  (3007, 123, 108, 2007, 3, 'Tasty but a little too sweet for me. Delivery was fast.',                                       'VISIBLE', '2026-10-06 07:55:00'),
  (3008, 139, 109, 2023, 5, 'Good grip even when sweaty and a nice thickness.',                                              'VISIBLE', '2026-10-08 19:20:00'),
  (3009, 140, 109, 2024, 4, 'My toddler loves them. Smooth edges and bright colours.',                                       'VISIBLE', '2026-10-08 19:25:00'),
  (3010, 106, 105, 2025, 5, 'Fast enough for school work and the screen is sharp. The seller shipped quickly.',              'VISIBLE', '2026-10-10 21:00:00');

INSERT IGNORE INTO seller_feedback
  (seller_feedback_id, shop_id, user_id, order_id, rating, feedback_text, status, created_at)
VALUES
  (4001, 101, 105, 1001, 5, 'Fast shipping and well packed.',                 'VISIBLE', '2026-09-28 18:10:00'),
  (4002, 102, 106, 1002, 5, 'Great communication from the seller.',           'VISIBLE', '2026-09-29 20:15:00'),
  (4003, 103, 107, 1003, 4, 'Good products, delivery took a day longer.',     'VISIBLE', '2026-10-03 09:40:00'),
  (4004, 102, 108, 1004, 4, 'Fresh items, would buy again.',                  'VISIBLE', '2026-10-06 08:00:00'),
  (4005, 103, 109, 1015, 5, 'Exactly as described. Thank you!',               'VISIBLE', '2026-10-08 19:30:00'),
  (4006, 101, 105, 1016, 5, 'Responsive seller and quick shipping.',          'VISIBLE', '2026-10-10 21:05:00');

-- ------------------------------------------------------------------
-- 10) Wishlists, a cart with two items, and notifications
-- ------------------------------------------------------------------
INSERT IGNORE INTO wishlists (wishlist_id, user_id, product_id) VALUES
  (101, 105, 136), (102, 105, 138), (103, 106, 101), (104, 106, 106),
  (105, 107, 105), (106, 108, 139), (107, 109, 131), (108, 109, 24);

INSERT IGNORE INTO carts (cart_id, user_id) VALUES (101, 108);

INSERT IGNORE INTO cart_items (cart_item_id, cart_id, variant_id, quantity) VALUES
  (101, 101, 109, 1),
  (102, 101, 132, 2);

INSERT IGNORE INTO notifications
  (notification_id, user_id, title, message, notification_type, reference_id, is_read, created_at)
VALUES
  (8001, 105, 'Order placed',          'Your order SP20260922DEMO01 has been placed.',                                      'ORDER',     1001, 1, '2026-09-22 10:15:00'),
  (8002, 105, 'Order update',          'Your order SP20260922DEMO01 has been shipped.',                                     'SHIPPING',  1001, 1, '2026-09-23 09:30:00'),
  (8003, 106, 'Order placed',          'Your order SP20261023DEMO07 has been placed.',                                      'ORDER',     1007, 1, '2026-10-23 18:20:00'),
  (8004, 106, 'Order update',          'Your order SP20261023DEMO07 has been shipped.',                                     'SHIPPING',  1007, 0, '2026-10-25 08:30:00'),
  (8005, 105, 'Order update',          'Your order SP20261019DEMO05 was delivered. Please confirm you received it.',        'SHIPPING',  1005, 0, '2026-10-23 12:40:00'),
  (8006, 109, 'Order update',          'Your order SP20261022DEMO06 has been shipped.',                                     'SHIPPING',  1006, 0, '2026-10-23 14:00:00'),
  (8007, 107, 'Order placed',          'Your order SP20261025DEMO08 has been placed.',                                      'ORDER',     1008, 1, '2026-10-25 20:10:00'),
  (8008, 108, 'Payment received',      'We received your payment for order SP20261026DEMO09.',                              'PAYMENT',   1009, 0, '2026-10-26 09:08:00'),
  (8009, 109, 'Payment received',      'We received your payment for order SP20261026DEMO10.',                              'PAYMENT',   1010, 0, '2026-10-26 15:33:00'),
  (8010, 105, 'Waiting for payment',   'Your order SP20261026DEMO11 is waiting for payment.',                               'PAYMENT',   1011, 0, '2026-10-26 21:15:00'),
  (8011, 106, 'Waiting for payment',   'Your order SP20261027DEMO12 is waiting for payment.',                               'PAYMENT',   1012, 0, '2026-10-27 08:40:00'),
  (8012, 107, 'Order cancelled',       'Your order SP20261014DEMO13 was cancelled.',                                        'ORDER',     1013, 1, '2026-10-14 12:05:00'),
  (8013, 108, 'Order cancelled',       'Your order SP20261018DEMO14 was cancelled.',                                        'ORDER',     1014, 1, '2026-10-18 17:30:00'),
  (8014, 105, 'Flash sale is live',    'Grab up to 70% off plus free shipping on today''s deals.',                          'PROMOTION', NULL, 0, '2026-10-27 07:00:00'),
  (8015, 101, 'New order received',    'Order SP20261026DEMO10 is waiting for your attention.',                             'ORDER',     1010, 0, '2026-10-26 15:30:00'),
  (8016, 101, 'New order received',    'Order SP20261025DEMO08 is waiting for your attention.',                             'ORDER',     1008, 0, '2026-10-25 20:10:00'),
  (8017, 102, 'New order received',    'Order SP20261026DEMO11 is waiting for your attention.',                             'ORDER',     1011, 1, '2026-10-26 21:15:00'),
  (8018, 103, 'New order received',    'Order SP20261026DEMO09 is waiting for your attention.',                             'ORDER',     1009, 0, '2026-10-26 09:05:00'),
  (8019, 103, 'New order received',    'Order SP20261027DEMO12 is waiting for your attention.',                             'ORDER',     1012, 0, '2026-10-27 08:40:00'),
  (8020, 104, 'Shop under review',     'Your shop is waiting for admin approval. We will notify you once it is active.',    'SYSTEM',    NULL, 0, '2026-10-26 10:00:00'),
  (8021, 102, 'New order received',    'Order SP20261023DEMO07 is waiting for your attention.',                             'ORDER',     1007, 1, '2026-10-23 18:20:00');

-- ------------------------------------------------------------------
-- 11) Ratings: recalculate from the reviews / feedback (same as the app does)
-- ------------------------------------------------------------------
UPDATE products p
INNER JOIN (
  SELECT product_id, ROUND(AVG(rating), 2) AS avg_rating, COUNT(*) AS review_count
  FROM reviews
  WHERE status = 'VISIBLE'
    AND product_id IN (SELECT DISTINCT product_id FROM reviews WHERE review_id BETWEEN 3001 AND 3010)
  GROUP BY product_id
) r ON r.product_id = p.product_id
SET p.rating = r.avg_rating, p.total_reviews = r.review_count;

UPDATE shops s
INNER JOIN (
  SELECT shop_id, ROUND(AVG(rating), 2) AS avg_rating, COUNT(*) AS feedback_count
  FROM seller_feedback
  WHERE status = 'VISIBLE' AND shop_id IN (101, 102, 103)
  GROUP BY shop_id
) f ON f.shop_id = s.shop_id
SET s.rating = f.avg_rating, s.total_reviews = f.feedback_count;

SET SQL_SAFE_UPDATES = @old_safe_updates;
