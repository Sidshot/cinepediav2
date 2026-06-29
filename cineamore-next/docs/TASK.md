# Task Boundary

Task Type: Feature / Fix (Minimal Gate + Visible Fallback Links)
Runtime: Both

Critical Dependencies:
- Next.js layout and login page rendering (Critical)
- Site gate auth API and middleware token validation (Critical)
- Footer visibility and global floating support entry point (Critical)
- Ko-fi widget CDN (Non-Critical)

Failure Modes:
- Timeout -> Ko-fi widgets fail open to a normal support link; gate login still works
- Quota -> no app quota impact beyond optional third-party widget loads
- Missing data -> login page, footer, and fallback links render even if Ko-fi scripts never load
- Duplicate execution -> guarded widget initialization prevents duplicate footer or floating mounts; token expiry is explicit per session type

Data Impact:
- Read / Write source code only; no production data mutation
- Dirty data assumed: YES

Performance Impact:
- Payload bounded: YES
- Queries bounded: YES

Security Impact:
- Raw links exposed: YES (public Ko-fi donation URL only)
- Signed tokens used: N/A

INVARIANTS_READ: YES
CHECKLIST_COMPLETE: YES
