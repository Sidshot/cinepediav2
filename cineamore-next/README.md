# 🎬 CineAmore (Next.js Application)

The modern frontend and API layer for CinePedia, built with **Next.js 14 App Router**.

## 🛠️ Tech Stack
-   **Framework**: Next.js 14
-   **Database**: MongoDB (Mongoose)
-   **Styling**: Tailwind CSS
-   **Auth**: NextAuth.js (v5 Beta)
-   **Cache**: ISR (Incremental Static Regeneration) + Vercel Data Cache

## 🚀 Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create `.env.local` with:
    ```env
    MONGODB_URI=mongodb+srv://...
    NEXTAUTH_SECRET=your_secret_key
    TMDB_API_KEY=your_key (optional, for enrichment)
    KILL_SWITCH_DOWNLOADS=false
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## 📂 Key Directory Structure
-   `app/`: App Router pages and API routes.
-   `components/`: Reusable React components (UI).
-   `lib/`: Utility functions (DB connection, Auth, Helpers).
-   `models/`: Mongoose Schemas (Movie, User, List).
-   `scripts/`: Operational scripts (indexes, minor fixes).

## ⚠️ Important Notes
-   **ISR Caching**: Homepage caches for 60s. Changes might not appear instantly.
-   **Download Logic**: handled in `app/api/download`.
-   **Auth**: Currently configured for Credentials/Google (see `lib/auth-next.js`).

## 📦 Deployment
Deployed on **Vercel**.
Standard build command: `next build`.
Output: `.next` directory.
