# Kremlin Luxury Studios

Welcome to the Kremlin Luxury Studios monorepo. This repository contains the AI-powered Brand-building platform and Booking portal for Kremlin Luxury Studios.

---

## Repository Architecture

The codebase is organized as a monorepo containing a Next.js frontend at the root and an Express backend inside a subdirectory:

```
├── .github/workflows/deploy.yml  # GitHub Pages Deployment Action
├── backend/                       # Express Node.js API (PostgreSQL database handler)
│   ├── src/                       # Backend Source Code
│   ├── package.json               # Backend Dependencies
│   └── tsconfig.json              # Backend TypeScript Configuration
├── public/                        # Frontend Static Assets (images, logo, etc.)
├── src/                           # Next.js App Directory (React Frontend & Components)
│   └── app/                       # Next.js Pages & Routers
├── next.config.ts                 # Next.js Build Config (GitHub Pages Export Setup)
├── package.json                   # Frontend Dependencies & Root Monorepo Scripts
└── tsconfig.json                  # Frontend TypeScript Configuration
```

---

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (version 20 or higher) and `npm` installed.

### Installation

To install all dependencies for both the root Next.js frontend and the Express backend, run the following helper command from the root directory:

```bash
npm run install:all
```

---

## Development Scripts

Run these scripts from the repository root:

* **Start Development Servers (Concurrently)**:
  ```bash
  npm run dev
  ```
  * Starts the Next.js frontend at [http://localhost:3000](http://localhost:3000)
  * Starts the Express backend API at [http://localhost:5000](http://localhost:5000)

* **Build Production Bundles**:
  ```bash
  npm run build
  ```
  * Builds Next.js static pages (outputs to `out/`) and compiles backend TypeScript code (outputs to `backend/dist/`).

* **Lint Codebase**:
  ```bash
  npm run lint
  ```

---

## Deployment Configuration

* **Frontend Hosting (GitHub Pages)**:
  * The frontend is automatically built and deployed to GitHub Pages when changes are pushed to the `main` branch.
  * The deploy workflow builds the site with the subpath prefix `/Kremlin-Studios-Project` for correct image and stylesheet rendering.
  * Live URL: [https://rishusingh1010315.github.io/Kremlin-Studios-Project/](https://rishusingh1010315.github.io/Kremlin-Studios-Project/)

* **Backend API Hosting**:
  * Set up the Express app located in `backend/` with a PostgreSQL database and update the production API environment variables in Next.js as needed.
