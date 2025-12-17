# CineAmore Session Memory
**Last Updated:** 2025-12-17 15:35 IST (Production OAuth + Atlas Migration Complete)

## 🟢 Current Status
*   **Active Branch:** `main`
*   **Mode:** `STABLE` (All bugs fixed)
*   **Production URL:** https://cineamore.vercel.app
*   **Database:** MongoDB Atlas (`cluster0.lallguq.mongodb.net/cinepedia`)
*   **Last Commit:** `9199629` - Download button fallback fix

## � THE COMMANDMENTS (WORD OF GOD)
**V2 IS LIVE. FAILURE IS NOT AN OPTION.**

### 🛑 Deployment Protocol (STRICT)
**The Golden Workflow:**
1.  **Branch:** ALWAYS create a new branch for features/fixes (e.g., `feat/user-lists`, `fix/login`).
2.  **Work:** Implement changes on the branch.
3.  **Localhost:** Verify EVERYTHING on `localhost:3000` (or `3002`).
    *   *Does it build?*
    *   *Do features work?*
    *   *Are there typos?*
4.  **Loop:** If issues found -> Fix on Branch -> Re-test.
5.  **Merge:** ONLY when 100% stable, merge to `main` and push.

**NEVER** push code to `main` without establishing a **Task Boundary** and asking the following **Explicit Questions**:
1.  *"Did you run the codes locally?"*
2.  *"Are all bugs squashed?"*

**Only upon User Confirmation (YES) may you proceed to push.**
*   **Exception:** Emergency Hotfixes (Must still be verified locally).
*   **Rule:** If in doubt, **DO NOT PUSH.**

## �📅 Session Log: 2025-12-17 (Afternoon) - Production Setup
### ✅ Completed
1.  **Google OAuth Production Setup:**
    *   Added redirect URI: `https://cineamore.vercel.app/api/auth/callback/google`
    *   Fixed `invalid_client` error (newline in GOOGLE_CLIENT_ID env var)
    *   Added `trustHost: true` for Vercel compatibility
    *   JWT session strategy for serverless

2.  **MongoDB Atlas Migration:**
    *   Created migration script: `scripts/migrate-to-atlas.js`
    *   Migrated **2,436 movies** from local to Atlas
    *   Fixed auth failure (`bad auth`) by updating password

3.  **Download Button Regression Fix:**
    *   Updated `MovieGrid.js` to fall back to legacy `dl`/`drive` fields
    *   Issue: migrated data uses old fields, not `downloadLinks` array
    *   **Legacy Site Redirect:** Injected hard redirect into `public/index.html` to funnel `onrender.com` traffic to Vercel.

### 🔑 Production Environment Variables (Vercel)
| Variable | Purpose |
|----------|---------|
| `AUTH_SECRET` | NextAuth session encryption |
| `AUTH_URL` | `https://cineamore.vercel.app` |
| `GOOGLE_CLIENT_ID` | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret |
| `MONGODB_URI` | Atlas connection string |
| `TMDB_API_KEY` | Movie metadata API |

### ⚠️ Lessons Learned (This Session)
1.  **ALWAYS test locally before pushing to production**
2.  **Check for invisible characters** in copy-pasted env vars (`%0A` newlines)
3.  **Update memory.md** with every issue encountered
4.  **MongoDB password mismatch** causes silent auth failures

## 🐛 Active Bugs
*   **Local Sign-In:** `.env.local` has wrong MongoDB password (production works fine)

## ⏭️ Immediate Next Steps
1.  **Update local `.env.local`** with new MongoDB password (`mongoadmin`)
2.  **Phase 4:** Comments & Reviews system


## 🧠 Key Context & Rules
*   **Identity:** Film Catalogue (Not streaming/social).
*   **Add/Edit/Delete:** Full Admin CRUD for Movie management.
*   **Constraint:** Preserve `__id` logic. **Framework:** Next.js (App Router).
*   **Process:** Branch -> Local Verify -> **Update 'Updates' Tab** -> Commit -> Report.
*   **Update Rule:** Always update `TipsManager.updates` in `app.js` with user-friendly, hype-driven changelogs (no tech jargon) before every deployment.
*   **Pre-Flight:** Review `memory.md` for clean code/context before pushing.

## �️ Legacy V1 System Documentation (Archive)
**Status:** Deprecated (Redirecting to V2).
**Last Stable State:** Commit `3dab7f0` (Before Redirect Overlay).
**Backup Branch:** `backup/pre-v2-migration`

### 🏗️ V1 Architecture
*   **Type:** Node.js Monolith (Express.js).
*   **Entry Point:** `server.js` (Root).
*   **Frontend:** Vanilla JS (`public/js/app.js`) + HTML (`public/index.html`).
*   **Styling:** CSS Variables (`public/css/style.css`).
*   **Database:** MongoDB (Local or Atlas) + Local JSON Fallback (`data/cinepedia.data.json`).

### ⚙️ V1 Core Mechanics
1.  **Identity Engine:**
    *   Uses `__id` (Double Underscore) generated from `SHA-256(Title|Year|Director)`.
    *   **CRITICAL:** V1 relies entirely on this hash for routing. Do NOT mix with V2 `_id`.
2.  **Data Persistence:**
    *   **Read:** Queries MongoDB first.
    *   **Seed:** If DB empty, auto-seeds from `data/cinepedia.data.json`.
    *   **Write:** Admin actions update MongoDB *and* (formerly) attempted to write to JSON (deprecated).
3.  **Authentication:**
    *   **Method:** Shared Password (Env: `ADMIN_PASSWORD`).
    *   **Mechanism:** Client sends `x-admin-pass` header.

### 🔄 How to Resurrect V1 (Emergency Protocol)
If V2 fails catastrophicall and you need the "Old Viral Site" back:

1.  **Checkout Backup:**
    ```bash
    git checkout backup/pre-v2-migration
    ```
2.  **Restore Render Config:**
    *   **Root Directory:** `.` (Current directory)
    *   **Build Command:** `npm install`
    *   **Start Command:** `node server.js`
3.  **Environment Variables (Render):**
    *   `MONGO_URI`: (Must point to a valid Atlas Cluster)
    *   `ADMIN_PASSWORD`: (Your shared password)
4.  **Verify:**
    *   Ensure `server.js` is running.
    *   Ensure `auto-seed` log appears if DB is fresh.

---

## �🛡️ Failsafe Protocol (Nuclear Doomsday)
1.  **Backup Location:** Branch `backup/pre-v2-migration` (Contains the "Golden" state of V1).
2.  **Restore:** If V2 fails, `git checkout backup/pre-v2-migration` and re-deploy.
3.  **V1 Status:** **FROZEN (Read-Only).** Writes disabled in `server.js` (in current `main` branch).

## 🔐 Auth Strategy (Soft Internal)
*   **Model:** Lightweight Admin / Shared Password.
*   **Context:** Catalogue application. Not a social platform.
*   **Rule:** Explicitly maintained as "Soft" until Phase 3 (Social Features).

## 🚀 V2 Roadmap ("The Infinite Scale")
### Phase 1: Core Architecture (Stability)
- [x] **Immutable Identity:** Migrate from Title+Year to `_id` (UUID/ObjectId).
- [x] **Auth:** Implement Admin Token (JWT) + Google Auth (Guest).
- [ ] **Caching:** Pre-compute aggregation stats (directors, years).

### Phase 2: Frontend Evolution
- [x] **Feature Parity:** Search, Filtering, and Detailed Movie Pages (Next.js).
- [x] **UI Overhaul:** Dark/Light Mode, Glossy Aesthetic, Interactive Ratings.
- [ ] **Image Optimization:** Cloudinary/ImageKit integration.

### Phase 2.4: Admin "Easy Mode" (Completed)
- [x] **Magic Search:** Integrated TMDB API for auto-filling movie details.
- [x] **Client Components:** Refactored Search, Delete, and Forms for Next.js Server Actions compatibility.

### Phase 3: The Social Layer (Collections)
- [ ] **Authentication:** NextAuth.js (Google OAuth only).
- [ ] **Feature:** User Lists (Watchlist, Custom Collections).
- [ ] **Sharing:** Public URLs for lists.

## 🛑 Session Handoff (2025-12-16)
**Everything is Saved & Verified.**

### 🖥️ Environment Status
*   **V2 App (Next.js):** Running on `http://localhost:3002` (PID: Depends on restart).
*   **V1 App (Legacy):** Running on `http://localhost:3000` (PID: 1240).
*   **Database:** `cinepedia` (Local MongoDB).
*   **Active Directory:** `d:\CinePedia - IDL\CinePedia\cineamore-next` (Majority of work here).

### 🔑 Authentication & Secrets
*   **Admin Route:** `/admin` (Protected).
*   **Login Route:** `/login`.
*   **Credentials:** `ADMIN_PASSWORD` and `JWT_SECRET` are set in `.env.local` (GitIgnored).
    *   *Dev Password:* `admin123` (Default backup if env missing).
    *   *Library:* `jose` used for edge-compatible JWT cookies.

### 🛠️ Completed Implementation
1.  **Feature Parity (Phase 2.1):**
    *   Home Grid with Client-Side Search (Title/Year/Director).
    *   Dynamic Details Page (`/movie/[id]`) supporting both `_id` and legacy `__id`.
    *   Hydration Error suppressed in `layout.js` (User extension issue).
2.  **Authentication (Phase 2.2):**
    *   Middleware protection for `/admin`.
    *   Lightweight JWT session capability.
3.  **Admin CRUD (Phase 2.3):**
    *   **Add/Edit/Delete** Fully functional using Server Actions (`lib/actions.js`).
    *   **Zod Validation** ensures data integrity.
    *   **Glossy UI** forms (`MovieForm.js`) match V2 aesthetic.
    *   **Verified:** Added "JS Force" movie and deleted it.

### ⏭️ Next Session Goals
1.  **Deployment:** Push to a preview environment (Vercel/Netlify) to verify mobile responsiveness in the wild.
3.  **Image Uploads:** Currently using URL strings; consider Cloudinary implementation.

### 2025-12-16: UI Refinements & Dark Mode Finalization
*   **Deployment Fixes:** Resolved static build crashes by updating `deploy_static_bundle.js` to include missing fields (`ratingSum`, `ratingCount`, `addedAt`) and implementing robust fallbacks for missing data in `app/movie/[id]/page.js`.
*   **Dark Mode:** Implemented a system-aware Dark/Light mode toggle with a new `ThemeToggle.js` component. Fixed `globals.css` to respect the `data-theme` attribute for manual overriding.
*   **Glossy UI Polish:** aligned the Movie Detail page buttons (Letterboxd, IMDb, Google) with the home page "Glossy" aesthetic using `glossy-box` and `social-link` classes.
*   **Interactive Ratings:** Built a new `InteractiveRating.js` component for the detail page.
    *   **Features:** Glossy UI, hover animations, optimistic updates.
    *   **Backend:** Created `app/api/rate/route.js` to handle rating submissions via MongoDB.
*   **Bug Fixes:**
    *   **HTML Nesting:** Refactored `MovieGrid.js` to remove illegal `<a>` inside `<a>` nesting, allowing sibling links for "Download" and "Letterboxd".
    *   **Hydration Mismatch:** Hardened `MovieGrid` year/director sorting to strict types (Integer/String) to prevent server/client sort differences with "N/A" values.
*   **Status:** All features verified on localhost:3002. Code pushed to `v2/identity-migration`.

### 2025-12-16: V2 Identity Migration & Features Complete
### 2025-12-16: Admin "Easy Mode" & Stability
*   **TMDB Integration:**
    *   Added "✨ Magic Auto-Fill" to `/admin/add`.
    *   Implemented `lib/tmdb.js` Server Actions to fetch metadata (Title, Director, Year, Plot, Poster).
    *   **Secrets:** Added `TMDB_API_KEY` to `.env.local` (and fixed User Pwd `Password2025`).
*   **Stability Corrections:**
    *   **Env Vars:** Fixed `AdminDashboard` to check both `MONGO_URI` and `MONGODB_URI`.
    *   **Serialization:** Fixed `Only plain objects` error in Edit Page by deep-cloning DB objects.
    *   **Client Components:** Extracted `AdminSearch` and `DeleteButton` to valid Client Components to fix `onClick` and `onSearch` errors.

*   **Ready for:**
    1.  Deployment of Admin Fixes (Merge to V2 branch).
    2.  Resuming Phase 3 (Lists).

### 2025-12-16: Google Authentication Implementation (Complete)
*   **Status:** Verified & Live on localhost:3000.
*   **Implementation Details:**
    *   **Provider:** Google OAuth (NextAuth.js v5 Beta).
    *   **Architecture:**
        *   `lib/auth-next.js`: Main DB-connected auth logic.
        *   `lib/auth.config.js`: Edge-safe configuration for Middleware.
        *   `lib/auth-actions.js`: Server Actions for `signIn`/`signOut` (Avoiding client-side import issues).
        *   `components/UserMenu.js`: Composition-based client component.
*   **Debugging Victory:**
    *   **Issue:** Persistent 500 Server Error ("MissingSecret", "MONGODB_URI missing").
    *   **Root Cause:** corrupted `UTF-16` encoding in `.env.local` prevented Node from parsing variables.
    *   **Fix:** Re-wrote `.env.local` with `ASCII` encoding and forced dynamic execution in API route.
    *   **Redirect:** Fixed `redirect_uri_mismatch` by adding `http://localhost:3000/api/auth/callback/google` to Cloud Console.

### ⏭️ Next Actions
1.  **Phase 3: Social Features:**
    *   User Lists (Watchlist/Favorites).

## 📝 Session Log: 2025-12-17 (V2 Admin & UI Polish)
- **Goal**: Fix mobile layout, admin login, and enhance UI with glossy, iOS-style elements.
- **Actions**:
  - **Fixed Mobile Posters**: Switched `OptimizedPoster.js` to use `fill` layout, resolving blank spaces on mobile.
  - **Fixed Header Scroll**: `Header.js` now fades out and slides up on scroll for better immersion.
  - **Fixed Admin Login**: Rewrote `middleware.js` to correctly verify custom JWT session cookies (fixed `403/redirect` loop).
  - **Enhanced UI**: Updated `ActionFABs.js` (Request/Report buttons) to use a premium "Glossy/Glassmorphism" iOS style (pill-shaped, gradients, blur) in dark/light mode.
  - **Added Features**: Created API endpoints (`/api/export/requests`, `/api/export/reports`) and added "📥 Download CSV" buttons to the Admin Dashboard.
- **Outcome**: **Deployed to Production.** `main` branch updated (Commit: `7641e0f`). Live site `cineamore.vercel.app` should now reflect these changes.

### 🔍 Comprehensive Error Log & Post-Mortem (Current Session)
This section documents every major technical hurdle encountered during the implementation of Google Auth and V2 UI fixes, analyzing the root cause and the specific resolution.

#### 1. "Use Server" Action Error in Client Component
*   **Error:** `Ecmascript file had an error...` when defining inline actions in `UserMenu.js`.
*   **Why?** Client Components (`'use client'`) cannot define inline `use server` functions. They must import them.
*   **Fix:** Extracted `signIn`/`signOut` into a dedicated file `lib/auth-actions.js`. Refactored `Header.js` to accept `UserMenu` as a prop (Composition Pattern) to keep it a Server Component.

#### 2. Edge Runtime "Crypto" Error
*   **Error:** `The edge runtime does not support Node.js 'crypto' module.`
*   **Why?** `middleware.js` (Edge) was importing `lib/auth-next.js`, which imported Mongoose (Node.js-only).
*   **Fix:** Created `lib/auth.config.js`, a lightweight, dependency-free config object specifically for the middleware to verify sessions without touching the database.

#### 3. Persistent 500 "Server Error" (MissingSecret / MONGODB_URI)
*   **Error:** NextAuth complaining about `MissingSecret` and `MONGODB_URI` despite them being in `.env.local`.
*   **Why?** **Encoding Corruption.** The `.env.local` file was likely saved with `UTF-16` (LE BOM) encoding via PowerShell redirection. Node.js `dotenv` expects `UTF-8` or `ASCII`. It couldn't read the keys, making them `undefined`.
*   **Fix:** Re-wrote `.env.local` using `Set-Content -Encoding Ascii`. Forced `dynamic = 'force-dynamic'` in the Auth API route to bypass build-time caching.

#### 4. Google "Redirect URI Mismatch"
*   **Error:** `Error 400: redirect_uri_mismatch`.
*   **Why?** Google Cloud Console is strict. It didn't recognize `http://localhost:3000` as a valid callback origin.
*   **Fix:** User manually added `http://localhost:3000/api/auth/callback/google` to the Google Console.

#### 5. "Blocked" Download Buttons (UI Bug)
*   **Error:** Download buttons on Home Page were grayed out/unclickable.
*   **Why?** The Mongoose query in `app/page.js` was optimizing performance by only selecting specific fields. It **excluded** `downloadLinks`, `dl`, and `drive`.
*   **Fix:** Added `.select('... downloadLinks dl drive')` into the query. Updated `MovieGrid` to prioritize the new `downloadLinks` array.

#### 6. Missing Plot Summaries (Data Bug)
*   **Error:** Movies showed "No plot summary available" even after admin adds.
*   **Why?** The app was looking for `movie.plot`, but the schema only had `movie.notes`. TMDB data (`overview`) wasn't mapped to a persistent field.
*   **Fix:** Added `plot: String` to `Movie.js` schema. Updated `actions.js`, `MovieForm.js`, and `lib/tmdb.js` to explicitly handle `plot` as a separate field from `notes`.

#### 7. Serialization Error (Client Component)
*   **Error:** `Only plain objects can be passed to Client Components...`
*   **Why?** The new `downloadLinks` array contained raw Mongoose subdocuments, which include specific object types like `_id` (Buffer) and `addedAt` (Date) that React cannot serialize.
*   **Fix:** Added a deep serialization step in `app/page.js` to manually convert `link._id` to string and `link.addedAt` to ISO string before passing to the client.

### 🔮 Detailed Roadmap: Phase 3 (Social Layer)
**Objective:** Transform CineAmore from a personal catalogue into a social platform.

#### 1. User Lists & Collections (Priority)
*   **Schema Design:**
    *   Create `List` model: `{ owner: ObjectId, title: String, isPublic: Boolean, items: [MovieId], type: 'watchlist'|'favorites'|'custom' }`.
*   **UI Components:**
    *   **"Add to List" Modal:** Triggered from Movie Card/Details.
    *   **List View:** Grid view of movies within a list.
*   **Actions:**
    *   `createList`, `addMovieToList`, `removeMovieFromList`.

#### 2. User Profiles
*   **Route:** `/profile/[userId]` (Public) and `/profile/me` (Private).
*   **Features:**
    *   Avatar/Banner upload (requires Image solution).
    *   Stats display (Movies watched, Total runtime).
    *   Public Lists display.

#### 3. Comments & Reviews
*   **Schema:** `{ user: ObjectId, movie: ObjectId, rating: Number, text: String, date: Date }`.
*   **Integration:** Display reviews on Movie Details page below the plot.

---

### ⚠️ Technical Debt & Risk Assessment (Critical)
These items are currently working but are fragile or unscalable. **Must be addressed soon.**

#### 1. 🚨 Homepage Performance (Pagination Missing)
*   **Risk:** **HIGH.** Currently, `app/page.js` fetches **ALL** movies (`Movie.find({})`) and sends them to the client.
*   **Impact:** As the library grows (currently ~2500), the initial page load size will balloon, causing slow LCP (Largest Contentful Paint) and potentially crashing the browser on mobile.
*   **Fix:** Implement `Limit/Skip` pagination or Infinite Scroll on the server side immediately.

#### 2. 🚨 Image Hotlinking & Reliability
*   **Risk:** **MEDIUM.** We are using direct URLs from TMDB or other sources.
*   **Impact:** If TMDB changes their URL structure or rate-limits us, **all images will break**.
*   **Fix:** Integrate an Image Proxy (ImageKit/Cloudinary) to cache and optimize images.

#### 3. ⚠️ Data Consistency (Download Links)
*   **Risk:** **LOW.** We have mixed data: legacy `dl`/`drive` fields vs the new `downloadLinks` array.
*   **Impact:** Code complexity in `MovieGrid` and `MoviePage` to handle both. Potential for bugs if one source is prioritized incorrectly.
*   **Fix:** Write a one-time migration script to move all `dl`/`drive` values into `downloadLinks` and deprecate the old fields.

#### 4. ⚠️ Missing Plot Data
*   **Risk:** **LOW.** Old movies lack the new `plot` field.
*   **Impact:** UI shows "No plot summary available" for thousands of films.
*   **Fix:** Create a background script that iterates through the DB, fetches the plot from TMDB for existing movies, and patches the records.

