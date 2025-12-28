# Task Boundary

Task Type: Security / Fix (Audit)
Runtime: Node | Edge | Both

Critical Dependencies:
- MongoDB (Safe Read Only)
- TMDB (Non-Critical)

Failure Modes:
- Timeout → Report
- Quota → Report
- Missing data → Report
- Duplicate execution → Safe (Idempotent Audit)

Data Impact:
- Read Only
- Dirty data assumed: YES

Performance Impact:
- Payload bounded: YES
- Queries bounded: YES

Security Impact:
- Raw links exposed: NO
- Signed tokens used: N/A

INVARIANTS_READ: YES
CHECKLIST_COMPLETE: YES
