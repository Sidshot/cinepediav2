# CineAmore Session Memory
**Last Updated:** 2025-12-22 15:20 IST (Contributor Role System)

## 🟢 Current Status
*   **Active Branch:** `main`
*   **Mode:** `DEPLOYED & LIVE`
*   **Production URL:** https://cineamore.vercel.app
*   **Database:** MongoDB Atlas (`cluster0.lallguq.mongodb.net/cinepedia`)
*   **Pending:** Pushing contributor system update

---

## 📝 Session Log: 2025-12-22 (Contributor Role System)
**Goal**: Implement contributor role with pending changes approval workflow.

### ✅ Features Completed

#### 1. Contributor Authentication System
*   **Dual Login**: Admin (password only) vs Contributor (username + password)
*   **Role-Based Routes**: `/admin/*` (admin only), `/contributor/*` (both roles)
*   **API Route Login**: Uses `/api/auth/login` for reliable client-side auth
*   **Files:**
    *   `lib/auth.js` - Extended with contributor auth + role helpers
    *   `middleware.js` - Role-based access control
    *   `app/api/auth/login/route.js` - API route for login
    *   `app/login/page.js` - Client-side login form

#### 2. Contributor Management (Admin)
*   **Route**: `/admin/contributors`
*   **Features:**
    *   Create contributor accounts
    *   View/reset passwords (plaintext per requirement)
    *   Toggle active status
    *   Delete contributors
*   **Files:**
    *   `lib/contributorManagement.js` - CRUD actions
    *   `app/admin/contributors/page.js` + `ContributorList.js`

#### 3. Pending Changes Workflow
*   **Contributors submit**: Add/edit/delete → stored as `PendingChange`
*   **Admins review**: `/admin/pending` → Approve/Reject/Discard
*   **Diff View**: Side-by-side comparison for updates
*   **Bulk Actions**: Approve/reject multiple at once
*   **Files:**
    *   `models/PendingChange.js` - Pending change schema
    *   `lib/contributorActions.js` - Create pending changes
    *   `lib/adminApprovalActions.js` - Approve/reject/bulk
    *   `app/admin/pending/page.js` + `PendingList.js`
    *   `app/admin/pending/[id]/page.js` + `PendingDetail.js`

#### 4. Contributor Dashboard
*   **Route**: `/contributor`
*   **Tabs**: Pending / Approved / Rejected
*   **Shows**: Submission status, admin notes for rejections
*   **Files:**
    *   `app/contributor/page.js` - Dashboard
    *   `app/contributor/add/page.js` - Add movie form
    *   `app/contributor/edit/[id]/page.js` - Edit movie form

#### 5. First-Login Onboarding Guide
*   **Trigger**: `hasSeenGuide` field on `Contributor` model
*   **Content**: FAQ tiles (how to add, edit, status guide, tips)
*   **Files:**
    *   `models/Contributor.js` - Added `hasSeenGuide` field
    *   `lib/guideActions.js` - Mark guide as seen
    *   `components/ContributorGuide.js` - Onboarding component

#### 6. Promo Banner Enhancement
*   **"Don't show again this session"**: Uses `sessionStorage`
*   **Homepage only**: Moved from layout to `app/page.js`
*   **Files:**
    *   `components/PromoBanner.js` - Updated with checkbox
    *   `app/layout.js` - Removed PromoBanner
    *   `app/page.js` - Added PromoBanner conditionally

### 📁 New Files Created
```
models/
├── Contributor.js
└── PendingChange.js

lib/
├── contributorActions.js
├── contributorManagement.js
├── adminApprovalActions.js
└── guideActions.js

app/api/auth/login/
└── route.js

app/contributor/
├── page.js
├── add/page.js
└── edit/[id]/page.js

app/admin/contributors/
├── page.js
└── ContributorList.js

app/admin/pending/
├── page.js
├── PendingList.js
└── [id]/
    ├── page.js
    └── PendingDetail.js

components/
└── ContributorGuide.js
```

### 📁 Modified Files
*   `lib/auth.js` - Dual login, role helpers
*   `middleware.js` - Role-based access
*   `app/login/page.js` - Client-side form
*   `app/admin/page.js` - Added Contributors/Pending links
*   `app/page.js` - Added PromoBanner for homepage only
*   `app/layout.js` - Removed PromoBanner
*   `components/MovieForm.js` - Added `cancelUrl` prop
*   `components/PromoBanner.js` - Added "don't show again"

### ⚠️ Technical Notes
1.  **Server Actions Issue**: Login via server action had issues; switched to API route  
2.  **Password Storage**: Plaintext as per user requirement for admin visibility
3.  **Session**: JWT-based, 24hr expiry

---

## 📝 Session Log: 2025-12-20 (CineStats Promotional Banner)
**Goal**: Add promotional banner for CineStats year-end Letterboxd analytics tool.

### ✅ Features Completed

#### 1. Jottacloud Scraper (`extract_links.py`)
*   **Problem**: Jottacloud pages are JavaScript SPAs - simple HTTP requests return empty `<div id="root">`
*   **Solution**: Built Playwright-based scraper that uses headless Chromium to render pages
*   **Tech Stack**: Python + Playwright + Pandas
*   **Output**: Extracted **1,760 movie files** from 28 alphabetical folders
*   **Files Created:**
    *   `extract_links.py` - Main Playwright scraper
    *   `movies_master_list.csv` - Raw extracted data
    *   `clean_extracted_data.py` - Data cleanup script

#### 2. Data Cleanup Pipeline
*   **Script**: `clean_extracted_data.py`
*   **Features:**
    *   Extracts movie titles from filenames
    *   Removes quality tags: `ENG SUBS`, `[HD]`, `4K`, `1080p`, etc.
    *   Extracts year from filename patterns: `(1999)`, `[1999]`, etc.
    *   Generates CineAmore-compatible JSON format
*   **Output:**
    *   `movies_for_import.json` - Full cleaned dataset (1,758 unique movies)
    *   `movies_cleaned.csv` - Reference CSV
    *   `movies_batch_1.json` through `movies_batch_4.json` - Split files (440 each) for 500-item import limit

#### 3. Import Progress UI Enhancement
*   **Modified:** `app/admin/import/page.js`
*   **Problem**: Import screen just showed "Please wait..." with no details
*   **Solution**: Added live progress during import:
    *   Progress bar with percentage
    *   Counter: "X / Y movies"
    *   Current movie name being imported
    *   Scrolling activity log (last 10 imports) with status icons:
        *   ✓ Success (green)
        *   ⊘ Skipped (yellow)
        *   ✗ Error (red)
*   **Commit**: `f123679` - "feat(admin): Add live progress display to bulk import"

### 📁 Files Created (Not Committed - Data Files)
```
movies jon w alphabet order.xlsx   # Source Excel with Jottacloud links
movies_master_list.csv             # Raw scraped data
movies_for_import.json             # Full cleaned dataset
movies_batch_1.json                # Batch 1 (440 movies)
movies_batch_2.json                # Batch 2 (440 movies)
movies_batch_3.json                # Batch 3 (440 movies)
movies_batch_4.json                # Batch 4 (438 movies)
movies_cleaned.csv                 # Reference CSV
extract_links.py                   # Playwright scraper
clean_extracted_data.py            # Cleanup script
debug_page.html                    # Debug output (empty SPA page)
debug_rendered.html                # Debug output (rendered page)
```

### ⚠️ Lessons Learned
1.  **Jottacloud is a SPA** - Cannot scrape with simple `requests.get()`, needs browser automation
2.  **Playwright > Selenium** - Modern, async, easier to install on Windows
3.  **Filename cleanup is essential** - Raw filenames have `ENG SUBS`, `[HD]`, quality tags that confuse TMDB search
4.  **Batch imports** - CineAmore has 500-item limit per import, must split large datasets

---


## 📝 Session Log: 2025-12-18 (Bulk Import & UI Polish)
**Goal**: Make bulk import foolproof, add Recently Added section, fix light/dark mode issues.

### ✅ Features Completed

#### 1. Smart Bulk Import System (`app/admin/import/`)
*   **NEW FILE:** `lib/bulkImport.js` - Multi-format parsing (JSON, CSV, TXT)
*   **NEW FILE:** `app/admin/import/page.js` - Complete import UI with:
    *   File upload with drag & drop
    *   Multi-format detection (JSON, CSV, TSV, TXT)
    *   Validation preview (shows errors/warnings)
    *   TMDB enrichment with progress bar
    *   Duplicate checking before import
*   **Smart CSV Parser Features:**
    *   **Content-based column detection** - Analyzes data patterns instead of headers
    *   Detects: URL columns, Year columns (1900-2100), Row numbers, Text fields
    *   Works with ANY language headers (Spanish, Japanese, etc.)
    *   Supports comma and tab separators
    *   Skips decorative/metadata rows automatically
*   **Validation Safeguards:**
    *   Skips rows with numeric-only titles (row indices)
    *   Validates URL format (http/https/common domains)
    *   Year range check (1800-2100)
    *   Title minimum length (2 chars)

#### 2. Poster & Backdrop Backfill
*   **NEW FILE:** `scripts/backfill-posters.mjs`
*   **Fix:** `lib/bulkImport.js` now saves `poster` and `backdrop` from TMDB
*   **Fix:** `lib/tmdb.js` now returns `backdropUrl` in addition to `posterUrl`
*   **Backfill Results:** 2,474 movies updated with posters/backdrops

#### 3. Recently Added Section (Homepage)
*   **Modified:** `app/page.js`
*   Shows movies added in last 24 hours
*   6-column grid with "NEW" badges
*   Theme-aware placeholder (🎬 icon) for missing posters
*   Only visible on page 1 without search/genre filters

#### 4. Default Sort Changed
*   **Modified:** `app/page.js`
*   Default: `year-desc` (newest films by year first)
*   Was: `newest` (most recently added first)

#### 5. Light/Dark Mode Theme Fixes
*   **Fixed:** Sort dropdown (`components/MovieGrid.js`)
    *   Changed `bg-[#1a1a1a]` → `bg-[var(--card-bg)]`
*   **Fixed:** AddToListButton dropdown (`components/AddToListButton.js`)
    *   Changed `bg-[#1a1a1a]` → `bg-[var(--bg)]`
*   **Fixed:** CreateListForm modal (`app/lists/CreateListForm.js`)
    *   Changed `bg-[#1a1a1a]` → `bg-[var(--bg)]`
*   **Fixed:** MovieForm TMDB dropdown (`components/MovieForm.js`)
    *   Changed `bg-[#1a1a1a]` → `bg-[var(--bg)]`

#### 6. Cleanup Script
*   **NEW FILE:** `scripts/cleanup-numeric-titles.mjs`
*   Deleted 174 incorrectly imported movies (numeric titles from bad CSV parse)

### 🐛 Bugs Fixed This Session

| Bug | File | Fix |
|-----|------|-----|
| CSV import read wrong columns | `lib/bulkImport.js` | Smart content-based column detection |
| Numeric titles imported | `lib/bulkImport.js` | Added `/^\d+$/` title filter |
| No posters on import | `lib/bulkImport.js` | Added poster/backdrop to enrichment |
| Missing backdrops in TMDB | `lib/tmdb.js` | Added `backdropUrl` to return object |
| Sort dropdown dark in light mode | `MovieGrid.js` | Use `var(--card-bg)` |
| Dropdowns dark in light mode | Multiple files | Use `var(--bg)` |
| Async validation not awaited | `lib/bulkImport.js` | Added `Promise.all` for validateMovieEntry |

### 📁 Files Changed (Unstaged)
```
Modified:
- app/admin/page.js
- app/lists/CreateListForm.js  
- app/page.js
- components/AddToListButton.js
- components/MovieForm.js
- components/MovieGrid.js
- lib/tmdb.js

New Files:
- app/admin/import/ (full directory)
- lib/bulkImport.js
- scripts/backfill-posters.mjs
- scripts/cleanup-numeric-titles.mjs
```

### ⚠️ Lessons Learned (This Session)
1.  **CSV parsing is HARD** - Headers can be any language, columns can be in any order
2.  **Content analysis > Header names** - Look at actual data patterns
3.  **Always save images during import** - Poster/backdrop must be included in enrichment
4.  **Theme variables everywhere** - Never use hardcoded colors like `#1a1a1a`
5.  **Test with real data** - Sample CSV exposed many edge cases

---


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

## 📝 Session Log: 2025-12-17 (Auto-Genre Automation)
- **Goal**: Implement persistent, automated genre categorization for all movies (new and existing).
- **Actions**:
  - **Schema Update**: Added `genre: [String]` to `Movie.js`.
  - **TMDB Integration**: Updated `tmdb.js` to fetch genres and `actions.js` to save them.
  - **Magic Auto-Fill**: Updated `MovieForm.js` to auto-fill genres when adding new movies.
  - **Backfill Tool**: Created `app/admin/auto-genre` (UI) and `api/admin/backfill-genres` (Backend) to automatically categorize thousands of existing movies.
  - **Optimization**: Implemented "Batch 5" processing and direct MongoDB driver writes (`updateOne`) to bypass Mongoose hot-reload caching issues and incorrect "Title Year" strict matching.
- **Status**: **Verified Locally.** User is currently running the backfill process.

### � CRITICAL LESSON (2025-12-17): PREMATURE DEPLOYMENT CONFIDENCE
- **Incident**: I recommended merging to `main` while the "Auto-Genre" backfill tool was still encountering edge cases (timeouts, "4k" title mismatches, infinite loops).
- **Rule**: **NEVER** recommend deployment for a **Data Automation/Migration Tool** until it has successfully processed a significant chunk of real-world (dirty) data without intervention.
- **Key Takeaway**: "Verified Locally" on a small sample (mock data) is NOT sufficient for data pipelines. Always anticipate:
    1.  **Dirty Data**: Titles will have "4k", "HDR", etc. (Must clean inputs).
    2.  **API Failures**: Search will fail. (Must handle failure states explicitly to prevent loops).
    3.  **Timeouts**: 20 items per batch is too slow. (Use smaller batches + client timeouts).
    4.  **Edge Cases**: Mongoose hot-reload won't register new schema fields immediately. (Use `collection.updateOne`).

### �🔍 Comprehensive Error Log & Post-Mortem (Current Session)
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


## 📝 Session Log: 2025-12-17 (Late Night) - Auto-Genre Debugging
- **Goal**: Resolve "Infinite Loop" in backfill tool and "Missing Genres" in UI.
- **Outcome**: **Success.** All issues resolved. Project is ready for deployment.

### 🔍 detailed Debug Log & Post-Mortem

#### 1. The Case of the Infinite Backfill Loop
- **Symptom**: Auto-Genre process got stuck on specific movies (e.g., "Ash", "Black Bag") and won't progress.
- **Cause**:
    1.  **Dirty Titles**: Movies like "Furiosa: A Mad Max Saga 4k" failed TMDB search due to "4k" suffix.
    2.  **Logic Flaw**: When search failed, no genres were saved. The loop query (`genre: { $size: 0 }`) thus re-picked the same movies endlessly.
- **Fix**:
    - **Backfill API**: Added regex to clean titles (remove "4k", "1080p").
    - **Loop Breaker**: Explicitly save `genre: ["Uncategorized"]` if search fails.
    - **Optimization**: Switched to `Movie.collection.updateOne` (native driver) to bypass Mongoose schema validation.

#### 2. The Case of the Missing Genres (UI)
- **Symptom**: Backfill was "Success", but genres didn't appear on `localhost:3000` cards.
- **Cause**:
    1.  **Stale Mongoose Schema**: Next.js Hot Reloading kept an old version of the `Movie` model in memory that didn't know about `genre` field, effectively stripping it from results.
    2.  **Frontend Crash**: A hidden error `d.addedAt.toISOString is not a function` (invalid date format in DB) caused `app/page.js` to crash silently and fallback to **Static JSON Data** (Safe Mode), which naturally lacked the new genre data.
- **Fix**:
    - **Schema Refresh**: Added `delete mongoose.models.Movie` in `models/Movie.js` to force schema reload.
    - **Crash Prevention**: Added type checks (`typeof === 'function'`) for `addedAt` in `app/page.js`.
    - **Cache Killing**: Added `export const dynamic = 'force-dynamic'` to `app/page.js`.
    - **Query Update**: Added `genre` to `.select()` chain.

#### 3. Critical Mistakes (Mea Culpa)
- **Premature Confidence**: I recommended deploying the Backfill Tool before it handled "dirty data" (4k titles), leading to a stuck loop.
- **Hidden Errors**: I initially missed the `addedAt` crash because the logs hid the real error under a generic "DB Connection Failed" warning.
- **Syntax Error**: I accidentally duplicated lines in `Movie.js` while fixing the schema, causing a build fail.

## 🏁 Current Project Status (End of Session)
- **Feature**: Auto-Genre System is **Fully Functional**.
    - **Schema**: `genre` field is active.
    - **Data**: ~2400 movies have been backfilled.
    - **UI**: Homepage cards now display genre tags (e.g., "HORROR", "SCI-FI").
- **Stability**:
    - **Hot Reload**: Fixed for Mongoose models.
    - **Date Handling**: Robust against invalid DB dates.
- **Next Step**: READY for deployment to Production.

---

## 🛡️ "Foolproofing" Sprint (Completed Dec 2025)
We paused feature development to harden the system against data corruption and operational error.

### 1. Data Integrity (The "Clean Database" Promise)
- **Schema:** `models/Movie.js` now strictly forbids legacy fields (`dl`, `drive`).
- **Audit:** `scripts/audit-db.mjs` verifies 100% compliance.
- **Migration:** All legacy records migrated to `downloadLinks` array.

### 2. Write Safety (The "Circuit Breaker")
- **Hard Caps:** Bulk Imports limited to **500 items** per session.
- **Circuit Breakers:**
  - Abort import if **>5% error rate**.
  - Abort if **>10 consecutive errors**.
- **Dry Runs:** All admin scripts summarize changes and require confirmation before executing.

### 3. Deployment Guardrails (The "Gatekeeper")
- **Mechanism:** `npm run build` is now prefixed with `node scripts/pre-deploy.mjs`.
- **Checks:**
  1.  **Environment:** Must have `MONGODB_URI`, `TMDB_API_KEY`, `AUTH_SECRET`.
  2.  **Database:** Must pass `audit-db.mjs` (Zero invariant violations).
- **Result:** It is impossible to deploy a broken schema or environment to Vercel.

### 4. Observability
- **Logger:** `lib/logger.js` outputs structured JSON logs.
- **Coverage:** `CREATE`, `UPDATE`, `DELETE`, `BULK_IMPORT`, and `AUTH` events are audited.

---

## 🔑 Operational Invariants (New)
*   **Images:** Always use `getProxyUrl` (never hotlink TMDB).
*   **Imports:** Always check `bulkImport.js` logs if data looks weird.
## 📝 Session Log: 2025-12-19 (Maintenance & Architecture)
**Goal**: Resolve robust UI/UX bugs, improve observability, and architecture hardening.

### ✅ Completed Updates
1.  **Mobile UI Obstruction Fix**:
    *   **Problem**: Floating Action Buttons (Request/Report) blocked pagination on mobile.
    *   **Fix**: Added `pb-32` padding to `app/page.js` to ensure content scroll clearance.
2.  **Observability Integration**:
    *   **Feature**: Integrated Vercel **Speed Insights** (`@vercel/speed-insights`).
    *   **Feature**: Added **Offline Mode Banner** to Homepage (`app/page.js`) to diagnose DB connection failures visually.
3.  **Admin Empowerment**:
    *   **Feature**: Added **"Poster URL"** field to `MovieForm.js`.
    *   **Backend**: Updated `lib/actions.js` to handle manual poster override, putting control in user hands.
4.  **Architectural Fix: Image Loading**:
    *   **Bug**: `OptimizedPoster.js` kept "remembering" error state even after URL fix.
    *   **Fix**: Added `useEffect` to reset state on prop change.
    *   **Bug**: Homepage images timed out while Detail page worked.
    *   **Fix**: Disabled Next.js Optimization (`unoptimized={true}`) for internal Proxy URLs, aligning Homepage logic with Detail Page logic (removing double-proxy overhead).

### 📁 Files Changed
*   `app/page.js` (Layout, Offline Banner)
*   `app/layout.js` (Speed Insights)
*   `components/OptimizedPoster.js` (State Reset, Optimization Bypass)
*   `components/MovieForm.js` (Poster Input)
*   `lib/actions.js` (Poster Save Logic)
*   `next.config.mjs` (Verified image domains)

### ⚠️ Lessons Learned
*   **State "Stickiness"**: UI components with validation error states (like image 404s) must explicitly reset when their inputs change, otherwise they "lie" to the user.

---

## 📝 Session Log: 2025-12-23 (Scraper Cleanup & UI Polish)
**Goal**: Finalize homepage UI, automate data cleaning, and handle massive scraper input.

### ✅ Features Completed

#### 1. Homepage Refactor (Dual View)
*   **New Architecture**:
    *   **Genre Rows**: "Netflix-style" horizontal scrolling rows for browsing.
    *   **Filtered Grid**: Classic grid view appears when Searching or Filtering.
    *   **Component**: `GenreRow.js` (Horizontal scroll, snap-to-start, lazy loaded).
    *   **Files**: `app/page.js` (Logic splitter), `components/GenreRow.js`.

#### 2. Persistent Minimalist Footer
*   **Design**: Clean, single-line footer with "Go to Top" button.
*   **Functionality**:
    *   "Go to Top" smooth scrolls to header.
    *   "DMCA" and "Contact" tabs expand inline (no page navigation).
*   **Files**: `components/Footer.js`, `app/layout.js`.

#### 3. Data Pipeline & Scraper (Ongoing)
*   **Scraper**: `scrape_directory.py` running for 13+ hours (Processed ~240k lines).
*   **Urgent Title Fix**:
    *   **Issue**: Scraper imported polluted titles (`/movies/Inception (2010)...`).
    *   **Fix**: Created fix-db-titles.mjs` to strip paths/extensions from MongoDB live.
    *   **Result**: 3,216 titles cleaned instantly.

#### 4. Enrichment Optimization & Quarantine
*   **Optimization**: Rewrote `enrich-directory.mjs` with **5x concurrency**, timeouts, and User-Agent headers. Speed increased from ~100/hour to ~5000/hour.
*   **Quarantine Logic**:
    *   Movies rejected by TMDB (not found) are now flagged `hidden: true`.
    *   Movies missing critical metadata (poster, genre) are flagged `hidden: true`.
    *   **Result**: 1,166 bad files hidden, 7,500+ clean movies visible.

#### 5. "Recently Added" Fix
*   **Bug**: Locking "View All" to `genre=newest` returned 0 results.
*   **Fix**:
    *   Updated `GenreRow.js` to accept `viewAllUrl`.
    *   Updated `app/page.js` to link "Recently Added" -> `/?sort=newest` (semantic sort).
*   **Data Fix**: Scraped movies had old `addedAt` dates. Run `touch-enriched.mjs` to bump their timestamps to `Date.now()`, ensuring they appear at the top of the list.

### 📁 New Scripts Created
```
scripts/
├── fix-db-titles.mjs        # Cleans "/movies/..." from DB titles
├── quarantine-bad-movies.mjs # Hides unenriched content
├── enrich-directory.mjs     # The optimized 5x parallel enrichment
├── touch-enriched.mjs       # Bumps addedAt timestamp
├── check-status.mjs         # Reports Visible vs Hidden count
├── debug-recent.mjs         # Debugs homepage query issues
└── fix_titles.py            # Post-processor for scraper JSON output
```

### ⚠️ Lessons Learned
1.  **Date Timestamps Matter**: Users expect "Recently Added" to mean "Appeared on Site", not "File Created Date".
2.  **Concurrency is King**: Serial API fetching is too slow for 10k items. Concurrency + Timeouts is essential using `Promise.all`.
3.  **Buffer Truncation**: Debugging large lists in terminal requires simplified output (avoiding huge JSON dumps).


## 🔐 SECURITY ENFORCEMENT PROTOCOL (BINDING)
**Role**: Security Enforcement Agent
**Status**: ACTIVE (Iron Dome)
**Philosophy**: Defense > UX. Economic Deterrence.

### 1. Hard Constraints (DO NOT RELAX)
*   **Edge Firewall**: `middleware.js` MUST block `curl`, `wget`, `python`.
*   **Header Lock**: Chrome UAs MUST have `Sec-CH-UA` if sending `Sec-Fetch-*`.
*   **Rate Limits (Upstash)**:
    *   Listings: **10/min** (Anti-Mirroring)
    *   Details: **30/min** (Anti-Scraping)
    *   Downloads: **3/15min** (Anti-Bulk)
*   **Download Vault**:
    *   NO raw links in frontend.
    *   Links MUST use signed JWT (`movieId` + `linkIndex` + `ip`).
    *   Redirects MUST be `307 Temporary`.

### 2. Emergency Kill Switch (Eschelon Protocol)
*   **Trigger**: Massive abuse / bandwidth spike.
*   **Action**: Set `KILL_SWITCH_DOWNLOADS=true` in Vercel.
*   **Effect**: 503 Service Unavailable on ALL download routes.

### 3. Accepted Risks
*   **Mobile IP Drift**: Users changing towers may get 403. Acceptable.
*   **Puppeteer Siege**: Rich attackers ($100+/day) can bypass. Acceptable (Economic Victory).

### 4. Documentation Rules
*   ⛔ BANNED: "Impossible", "Unbreakable".
*   ✅ REQUIRED: "Economically Infeasible", "Cost-Prohibitive".

## Latest Session: December 24, 2025 - Comprehensive Security Audit

### 🎯 Objective
Complete security audit to lock down the application, focusing on Admin authorization, API security, and Rate Limiting.

### ✅ Completed Work
1.  **Admin Route Security**:
    - **UI**: Added server-side checks in `app/admin/layout.js` to redirect unauthorized users.
    - **API**: Standardized all 5 admin routes (`backfill-genres`, `debug-visibility`, `migrate-visibility`, `quarantined`, `quarantined-export`) to use a unified `isAdmin()` check.
2.  **Server Action Hardening**:
    - Patched `lib/actions.js` (`create`, `update`, `delete`) and `lib/bulkImport.js` to require admin permissions.
3.  **Public API Protection**:
    - Applied rate limiting (10 requests/10s) and strict input validation to `api/request` and `api/report`.
4.  **Download Security**:
    - Verified `lib/download-token.js` uses signed JWTs to prevent link sharing abuses.

### 🛡️ Status
The application core is now secure. Administrative functions are strictly gated.
