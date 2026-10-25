# Shopee-style marketplace (React + Vite + Express + MySQL)

## Setup

1. **Database** – import `shopee_db.sql` into MySQL, then run the upgrades once:
   ```
   mysql -u root -p shopee_db < backend/migrations/001_marketplace_upgrade.sql
   mysql -u root -p shopee_db < backend/migrations/002_cleanup_categories.sql
   ```
2. **Backend** – copy `backend/.env.example` to `backend/.env`, fill in your MySQL password and a long random `AUTH_SECRET`, then:
   ```
   cd backend && npm install && node server.js      # http://localhost:5000
   ```
3. **Frontend** – from the project root:
   ```
   npm install && npm run dev                        # http://localhost:5173
   ```
   Set `VITE_API_URL` if the API is not on `http://localhost:5000`.

## Accounts and roles

Sign up as **customer** ("I want to shop") or **seller** ("I want to sell"). Admin accounts are created in the database.
A new seller creates a shop in the Seller Centre; it stays *Pending* until an admin sets it to *Active* (Admin → Shops).

## Pages

| Area | Routes |
| --- | --- |
| Storefront | `/`, `/search`, `/product/:id` |
| Customer | `/customer/dashboard`, `profile`, `orders`, `wishlist`, `addresses`, `payments`, `notifications`, `cart`, `checkout` |
| Seller Centre | `/seller/dashboard`, `shop`, `products`, `orders`, `notifications` |
| Admin | `/admin/dashboard`, `users`, `sellers`, `shops`, `categories`, `products`, `orders`, `transactions`, `reviews`, `reports`, `notifications`, `activity-logs`, `settings`, `profile` |

## API

Everything except `/login`, `/signup`, `GET /api/products`, `GET /api/products/:id` and `GET /api/categories` needs `Authorization: Bearer <token>` (returned by `/login`).
`/api/customer/:userId/*`, `/api/seller/:userId/*`, `/api/admin/*` and `/api/notifications` are role-checked on the server.
