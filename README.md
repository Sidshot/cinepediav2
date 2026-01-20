# CinePedia (CineAmore)

> [!CAUTION]
> **DEPRECATED / ARCHIVED**
> This monolithic version (V1) is no longer maintained.
> The project has migrated to **V2 (Next.js)** hosted on Vercel.
> **New Site:** [cinepediav2.vercel.app](https://cinepediav2.vercel.app/)

A personal film archive dashboard built as a Node.js monolith. It features a glossy, glassmorphism UI, robust search/filtering, and a dual-role authentication system (Admin/Guest).

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB (Local or Atlas)

### Installation
1.  **Clone the repo:**
    ```bash
    git clone https://github.com/Sidshot/CinePedia.git
    cd CinePedia
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Environment:**
    Copy the example env file:
    ```bash
    cp .env.example .env
    ```
    Edit `.env` and add your MongoDB URI.
    ```env
    MONGO_URI=mongodb://localhost:27017/cinepedia
    PORT=3000
    ADMIN_PASSWORD=your_secure_password
    ```
4.  **Run the Server:**
    ```bash
    node server.js
    ```
    Visit `http://localhost:3000`.

## 🏗 Architecture

**Type:** Node.js Monolith (Express serving Static Files + API).

-   **Frontend:** Vanilla JavaScript (`public/js/app.js`), CSS variables (`style.css`), and direct DOM manipulation. No frameworks.
-   **Backend:** Express.js (`server.js`) handling API routes and serving `public/`.
-   **Database:** MongoDB via Mongoose.

### Key Constraints (CRITICAL)

1.  **Custom `__id` Field:**
    The frontend relies on a custom `__id` field (e.g., `fm_3k2j4...`) generated from a hash of the title/year. **Do not refactor this to use MongoDB's default `_id`.** The frontend logic depends on this specific string format for routing and state.

2.  **Authentication:**
    -   **Client-Side:** `app.js` manages `state.userMode` ('admin' or 'guest').
    -   **Server-Side:** Key write operations (`/api/import`) are protected by `requireAdmin` middleware.
    -   **Default Password:** Configurable via `ADMIN_PASSWORD` env var.

3.  **Data Seeding:**
    -   The system auto-seeds from `data/cinepedia.data.json` if the DB is empty.
    -   Use `node seed_mongo.js --force` to upsert/update existing data from the JSON file.

## 📂 Project Structure

-   `/cineamore-next`: **Active Web App** (Next.js 14, App Router). Main development focus.
-   `/maintenance`: Python/Node.js scripts for crawling, cleaning, and DB enrichment.
-   `/data`: Raw data exports (JSON/CSV) - *Gitignored*.
-   `/docs`: Documentation and plans.
-   `/archive`: Retired logs and debug files.
-   `/models`: Legacy Mongoose schemas (shared with scripts).
-   `server.js`: Legacy Express server (Monolith).

## 🛡 API Endpoints

-   `GET /api/movies` - Fetch all films.
-   `POST /api/movies` - Create a film.
-   `POST /api/import` - Bulk import (Protected: Requires Admin).
-   `POST /api/auth` - Verify Admin password.

---
*Deployed on Render.*
