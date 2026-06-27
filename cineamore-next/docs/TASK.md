# Task Boundary

Task Type: Security / Fix (Members-Only Lock)
Runtime: Node | Edge | Both

Critical Dependencies:
- Next.js middleware/runtime (Critical)
- MongoDB (Critical)
- Site gate credentials (Critical)
- Telegram API (Non-Critical)
- TMDB/image hosts (Non-Critical)
- Upstash rate limiting (Non-Critical)

Failure Modes:
- Timeout -> fail closed for auth/security; fail open only for non-critical rate-limit checks
- Quota -> non-critical integrations degrade without blocking site security
- Missing data -> keep site locked and return controlled 4xx/5xx responses without leaking internals
- Duplicate execution -> idempotent source-only hardening

Data Impact:
- Read / Write source code only; no production data mutation
- Dirty data assumed: YES

Performance Impact:
- Payload bounded: YES
- Queries bounded: YES

Security Impact:
- Raw links exposed: NO
- Signed tokens used: YES

INVARIANTS_READ: YES
CHECKLIST_COMPLETE: YES
