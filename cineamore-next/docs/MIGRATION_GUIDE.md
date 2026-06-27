# Production Migration Guide

## Phase 3: Visibility System Migration

After deploying the Phase 3 schema changes to production, you MUST run the database migration to convert legacy `hidden` fields to the new `visibility` object.

### Step 1: Deploy to Production
The code is already pushed to `main`. Vercel will auto-deploy.

### Step 2: Run Production Migration

#### Option A: Via Admin API (Recommended)
1. Go to your production site: `https://cinepediav2.vercel.app/admin`
2. Log in as admin
3. Open browser console (F12)
4. Run this command:
```javascript
fetch('/api/admin/migrate-visibility', { 
    method: 'POST' 
}).then(r => r.json()).then(console.log)
```

#### Option B: Via Server-Side Script (Advanced)
1. SSH into your production server (or use Vercel Console).
2. Run the script directly in the production environment where `MONGODB_URI` is already secure.
**NEVER copy production credentials to your local `.env.local` file.**

### Expected Output
```json
{
  "success": true,
  "message": "Migration completed successfully",
  "stats": {
    "totalMovies": 8711,
    "migrated": 3664,
    "quarantined": 1166,
    "visible": 2498
  }
}
```

### Verification
1. Check homepage: Only visible movies should appear
2. Check admin dashboard: Quarantined movies should show status badges
3. Verify the API returns success

### Safety Notes
- The migration is **idempotent** - safe to run multiple times
- It will auto-detect if already migrated
- Admin authentication is required for the API endpoint
- No data loss - only adds the `visibility` object and removes legacy `hidden` field
