# Kremlin Luxury Studios & Creator Residency Monorepo

Welcome to the official repository for **Kremlin Luxury Studios**—a premium, AI-first creative agency and boutique creator residency located in Greater Noida (Delhi-NCR). 

This project is built as a production-grade monorepo featuring a responsive Next.js frontend, a TypeScript-Express backend, and a secure PostgreSQL database.

---

## 🌟 Key Features

- **Premium Responsive UI**: Curated luxury branding, typography, dynamic slideshows, interactive booking widgets, and creator showcase grids fully optimized for mobile, tablet, and desktop viewports.
- **Interactive AI Concierge**: Built-in chatbot widget featuring a **live animated SVG robot face** that blinks, smiles, blushes, and pulses its antenna when processing. Equipped with custom recommendations for travel guides, studio booking guidelines, and pricing.
- **Host Admin Panel**: Secure dashboard (`/admin`) for hosts to monitor inquiries, manage guest checkout statuses, and view real-time site analytics (views, CTA clicks, chat engagements).
- **Comprehensive XSS Mitigation**: Fully protected against Stored, Reflected, and DOM-based Cross-Site Scripting (XSS) via strict input format regex validation, recursive JSON metadata cleaning, and custom Next.js security headers (CSP, X-Frame-Options, XSS-Protection).
- **Seamless Cloud Seeding**: Multi-path database initializer that automatically seeds schema tables and default admin credentials (`admin@kremlinstudios.com` / `admin`) on local or remote servers.

---

## 📁 Repository Structure

```
├── backend/                  # Express.js & TypeScript REST API
│   ├── src/
│   │   ├── config/db.ts      # Database connection & seeding logic
│   │   ├── controllers/      # API logic (Inquiries, Chat, Analytics)
│   │   ├── db/schema.sql     # Database tables schema
│   │   ├── routes/api.ts     # Express routes
│   │   └── server.ts         # Express server startup
│   ├── .env.example          # Backend environment variables template
│   └── tsconfig.json
├── frontend/                 # Next.js App Router (React & TailwindCSS)
│   ├── src/app/
│   │   ├── page.tsx          # Main hotel website & chatbot client
│   │   ├── admin/page.tsx    # Host admin metrics dashboard & login
│   │   └── layout.tsx        # Global fonts and metadata
│   ├── next.config.ts        # Next.js config & custom CSP headers
│   ├── .env.example          # Frontend environment variables template
│   └── tsconfig.json
├── package.json              # Monorepo runner & dependencies scripts
└── README.md                 # Project documentation
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **PostgreSQL** database instance running locally or in the cloud.

### 2. Dependency Installation
Install all root, frontend, and backend packages with a single command:
```bash
npm run install:all
```

### 3. Environment Configurations
Create a `.env` file in the `/backend` folder. You can use the provided `.env.example` as a template:
```bash
# In backend/.env
PORT=5000
DATABASE_URL=postgresql://<username>:<password>@localhost:5432/kremlin_studios
JWT_SECRET=your_jwt_secret_here
OPENAI_API_KEY=your_openai_api_key_here
ADMIN_REGISTRATION_TOKEN=your_admin_registration_token_here
```

Create a `.env` file in the `/frontend` folder:
```bash
# In frontend/.env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Running the Development Servers
Start both the Next.js frontend (port `3000`) and the Express backend (port `5000`) concurrently:
```bash
npm run dev
```

---

## 🏗️ Production Build & Verification

To verify that both projects compile successfully for production, run:
```bash
npm run build
```
This runs:
- `npm run build --prefix backend` (TypeScript `tsc` compiler)
- `npm run build --prefix frontend` (Next.js production bundles)

---

## ☁️ Live Cloud Deployment Guide

### 1. Cloud Database Setup
1. Spin up a PostgreSQL instance on a cloud provider like **Neon.tech**, **Supabase**, or **Render**.
2. Save the database connection URI (e.g. `postgresql://user:pass@host:port/db?sslmode=require`).

### 2. Backend API Deployment (Render / Railway / Heroku)
1. Link this repository to your hosting service.
2. Configure the directory path to `backend/`.
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `node dist/server.js`
5. Add the following environment variables:
   - `DATABASE_URL`: Your cloud database connection URI.
   - `JWT_SECRET`: A secure random secret string.
   - `OPENAI_API_KEY`: Your OpenAI API key for chatbot AI concierge.
   - `ADMIN_REGISTRATION_TOKEN`: A token to secure new host registration.

### 3. Frontend Next.js Deployment (Vercel / Netlify)
1. Import this repository in **Vercel**.
2. Set the root directory configuration to `frontend`.
3. Vercel will auto-detect Next.js. Keep default build and output settings.
4. Add the following environment variable:
   - `NEXT_PUBLIC_API_URL`: The URL of your deployed backend (e.g. `https://your-backend.onrender.com/api`).
