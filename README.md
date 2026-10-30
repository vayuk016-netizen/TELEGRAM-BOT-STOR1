# 🛍️ Digital Store Ecosystem: Storefront, Admin Dashboard & Telegram Bot

A complete, unified, production-ready digital e-commerce ecosystem consisting of:
1. **🌐 Customer Storefront Website**: Modern responsive e-commerce web app for digital subscriptions (Canva Pro, CapCut Pro, etc.) with Bakong KHQR scan, ABA transfer, Telegram login widget, and instant on-screen key delivery.
2. **⚙️ Executive Admin Dashboard**: Inventory management, live stock counters, order audit logs with source identification (`website` vs `telegram`), customer user manager, and Telegram broadcast manager.
3. **🤖 Automated Telegram Bot (aiogram 3.x)**: 24/7 automated store bot with Khmer/English keyboards, referral commissions, KHQR auto top-up, and instant delivery.

> [!IMPORTANT]
> **Single Unified Database**: All three components (Storefront Website, Admin Dashboard, and Telegram Bot) connect to the **same PostgreSQL database**. There is NO separate database. Any product, price, or stock changed in the Admin Dashboard reflects on the website and bot immediately.

---

## 🌟 How the Website, Admin Dashboard, and Telegram Bot Share Data

```
                     ┌────────────────────────────────────────┐
                     │          PostgreSQL Database           │
                     │ (products, categories, keys, users, ..)│
                     └───────────────────┬────────────────────┘
                                         │
                         ┌───────────────┴───────────────┐
                         ▼                               ▼
             ┌───────────────────────┐       ┌───────────────────────┐
             │    FastAPI Backend    │       │ Telegram Bot Engine   │
             │  (REST API + Webhooks)│       │     (aiogram 3.x)     │
             └───────────┬───────────┘       └───────────┬───────────┘
                         │                               │
        ┌────────────────┴────────────────┐              │
        ▼                                 ▼              ▼
┌───────────────────────┐     ┌───────────────────────┐  │ (Instant Telegram
│ Customer Storefront   │     │ Admin Dashboard       │  │  delivery & alerts)
│ (http://localhost:3000)│    │ (/admin or /login)    │  │
└───────────────────────┘     └───────────────────────┘──┘
```

1. **Shared Products & Live Stock**:
   - Products, descriptions, prices, and digital keys are stored in `products`, `categories`, and `digital_keys`.
   - When an order is placed on the website or Telegram bot, `SELECT ... FOR UPDATE SKIP LOCKED` atomically reserves unsold keys. Stock decreases once, preventing double-selling.
2. **Shared Users**:
   - When a customer logs in via the Telegram Login Widget on the website, they are authenticated against the bot's secret token.
   - The user record matches the `telegram_id` used in the bot, sharing account balance, order history, and referral data.
3. **Shared Orders & Source Tracking**:
   - All purchases are recorded in the `orders` table.
   - Website purchases set `source = "website"`; bot purchases set `source = "telegram"`.
   - The Admin Dashboard displays all orders in one unified table with distinct source badges (🌐 Website vs 🤖 Telegram).
4. **Dual Delivery**:
   - When a website order is confirmed, the digital license key appears on the customer's browser screen AND is automatically delivered to the customer's Telegram chat via the bot.
   - The admin also receives an instant Telegram notification about the new sale.

---

## 🧭 Application Routes

### Customer Storefront (Public)
| Path | Page Description |
|---|---|
| `/` | **Home**: Hero banner, featured subscriptions, category pills, How It Works, FAQ, Telegram contact button |
| `/products` | **Products Catalog**: Filter by category, real-time search, price sorting, live stock badges |
| `/products/:id` | **Product Detail**: Description, duration, available stock, quantity picker (1-10), Buy Now |
| `/checkout/:id` | **Checkout & Payment**: Bakong KHQR auto-polling, manual ABA/Wing slip upload, instant key reveal |
| `/my-orders` | **My Orders**: Lookup order by ID or view full history for logged-in Telegram users |
| `/contact` | **Contact & Support**: 24/7 customer care linking directly to Telegram (`@sopha9926`) |

### Admin Dashboard (Protected)
| Path | Page Description |
|---|---|
| `/login` | Admin login portal |
| `/admin` | Executive Analytics & real-time revenue overview |
| `/admin/products` | Manage products, prices, categories, and stock toggles |
| `/admin/stock` | Digital key vault & bulk upload modal |
| `/admin/orders` | Unified order audit log with Source (`website` / `telegram`) |
| `/admin/users` | Customer user management & balance auditing |
| `/admin/broadcast` | Bulk Telegram message broadcast scheduler |
| `/admin/settings` | Telegram Bot configuration & payment credentials |

---

## 🚀 Quick Start Guide

### 1. Unified Development Command
Run both Backend (Port 8000) and Frontend (Port 3000) simultaneously with one command:

```bash
npm run dev
```

### 2. Manual Service Execution
If you prefer running in separate terminal tabs:

- **Backend (API & Bot)**:
  ```bash
  npm run dev:backend
  ```
  *(or `cd backend && ./.venv/bin/uvicorn app.main:app --reload --port 8000`)*

- **Frontend (Storefront & Admin)**:
  ```bash
  npm run dev:frontend
  ```

---

## 🔐 Admin Credentials

- **URL**: `http://localhost:3000/login` (or click **Admin** in the storefront header)
- **Email / Username**: `vayuk016@gmail.com`
- **Password**: `sp169926`

---

## 📝 License
This project is licensed under the MIT License.
