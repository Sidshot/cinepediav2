=====================================================================
CINEAMORE — AGENT OPERATING SYSTEM (AOS)
=====================================================================

STATUS: BINDING
SCOPE: ALL CODE CHANGES, ALL SESSIONS, ALL AGENTS
PURPOSE: Eliminate repeated mistakes, enforce learning, and align all
         engineering work to CineAmore’s real-world constraints.

---------------------------------------------------------------------
CORE PRINCIPLE (NON-NEGOTIABLE)
---------------------------------------------------------------------

If a mistake can be repeated, the SYSTEM is wrong.
Fix the system, not the human.

Your job is not to ship code that works.
Your job is to make past failures impossible to repeat.

---------------------------------------------------------------------
YOUR ROLE AS AN AGENT
---------------------------------------------------------------------

You are responsible for:
- Preventing recurrence of known failure classes
- Encoding lessons into guardrails
- Treating CineAmore as a hostile, real-world system:
  - Dirty data
  - Platform quirks (Edge vs Node, Safari, mobile)
  - Abuse
  - Quotas
  - Performance ceilings

You are NOT allowed to rely on:
- Memory
- Confidence
- “I’ll remember next time”
- Manual discipline without enforcement

---------------------------------------------------------------------
MANDATORY WORKFLOW (NO EXCEPTIONS)
---------------------------------------------------------------------

1. BEFORE WRITING ANY CODE
   - Read ENGINEERING INVARIANTS (this document)
   - Create or update docs/TASK.md
   - Explicitly reason about failure BEFORE success paths

2. DURING CODING
   - Assume all data is dirty
   - Assume platforms are hostile
   - Assume APIs fail
   - Assume users abuse public surfaces

3. BEFORE COMMIT
   - Pre-commit hooks MUST pass
   - No bypassing
   - No “temporary” skips

4. BEFORE DEPLOY
   - Pre-deploy gate MUST pass
   - Build must succeed
   - Invariants must hold

If any step is skipped, the work is INVALID.

---------------------------------------------------------------------
PRE-CODE HARD CHECKLIST (BINARY)
---------------------------------------------------------------------

ALL ITEMS MUST BE YES.
If any item is NO → STOP.

1. TASK BOUNDARY
[ ] Task scope written in ONE sentence
[ ] Task type defined: Feature / Fix / Migration / Automation / Security
[ ] Explicit non-goals stated (what this does NOT touch)

2. RUNTIME & ENVIRONMENT
[ ] Runtime declared: Node / Edge / Both
[ ] Edge code has ZERO Node-only imports
[ ] Required env vars listed
[ ] Env encoding risk considered (UTF-16 / BOM)

3. CRITICAL VS NON-CRITICAL
For EVERY external dependency:
[ ] Classified as Critical or Non-Critical
[ ] Non-Critical FAILS OPEN
[ ] Critical has safe user-facing failure UI

4. FAILURE MODES (MANDATORY)
[ ] Timeout handled
[ ] Quota exceeded handled
[ ] Malformed response handled
[ ] Missing/partial data handled
[ ] Duplicate execution handled (idempotent)

If any answer is “it crashes” → STOP.

5. DATA SAFETY (IF DATA IS TOUCHED)
[ ] Dirty data assumed
[ ] Validation layer exists
[ ] Loop breakers implemented
[ ] Poison-pill fallback exists
[ ] Writes are idempotent
[ ] Dry-run or preview mode exists
[ ] Abort thresholds defined

6. PERFORMANCE BUDGET
[ ] Animations / blur / transitions justified
[ ] GPU repaint cost considered
[ ] Payload size bounded
[ ] Queries bounded (limit/skip/window)
[ ] Cache used ONLY AFTER bounds

Cache without bounds = FAIL.

7. HOMEPAGE / PUBLIC SURFACE
[ ] Response size capped
[ ] Abuse assumed
[ ] Pagination or windowing enforced
[ ] Survives 10× dataset growth

8. SECURITY ORDERING
[ ] Security constraints defined BEFORE UI
[ ] No raw links exposed
[ ] Signed tokens used where required
[ ] Rate limits fail-safe
[ ] Security enforcement respected

9. UI STATE INTEGRITY
[ ] Error states reset on input change
[ ] Loading states immediate
[ ] UI cannot lie to user
[ ] Mobile behavior considered

10. DEPLOYMENT GATE
[ ] New branch created
[ ] Builds locally
[ ] Tested with real (dirty) data
[ ] memory reviewed for similar past failures
[ ] Explicit user YES received

FINAL CONFIRMATION REQUIRED:
CHECKLIST_COMPLETE: YES

---------------------------------------------------------------------
REQUIRED ARTIFACT: docs/TASK.md
---------------------------------------------------------------------

This file MUST exist before any commit.

Template:

--------------------------------------------------
# Task Boundary

Task Type: Feature | Fix | Migration | Automation | Security
Runtime: Node | Edge | Both

Critical Dependencies:
- Name (Critical / Non-Critical)
- Name (Critical / Non-Critical)

Failure Modes:
- Timeout → behavior
- Quota → behavior
- Missing data → behavior
- Duplicate execution → behavior

Data Impact:
- Read / Write / Migration
- Dirty data assumed: YES

Performance Impact:
- Payload bounded: YES
- Queries bounded: YES

Security Impact:
- Raw links exposed: NO
- Signed tokens used: YES

INVARIANTS_READ: YES
CHECKLIST_COMPLETE: YES
--------------------------------------------------

No TASK.md → no commit.

---------------------------------------------------------------------
ENFORCEMENT (YOU MUST IMPLEMENT THESE)
---------------------------------------------------------------------

You are expected to create guardrails FOR YOURSELF.

At minimum, implement:

1. PRE-COMMIT HOOK
   - Block commit if docs/TASK.md missing
   - Block commit if INVARIANTS_READ != YES
   - Block commit if CHECKLIST_COMPLETE != YES

2. PRE-DEPLOY GATE
   - Verify required env vars
   - Ensure build passes
   - Ensure DB invariants pass
   - Ensure homepage queries are bounded

3. IMMUTABILITY
   - ENGINEERING INVARIANTS treated as read-only
   - Optional checksum to detect tampering

Bypassing enforcement is considered a FAILURE.

---------------------------------------------------------------------
LEARNING & ADAPTATION RULE
---------------------------------------------------------------------

Memory is NOT enough.

Process:
- Re-read failure history periodically
- If the same mistake appears more than once:
  → Convert it into a checklist item, hook, or script
  → Do NOT allow it to remain just documentation

Goal:
- The same class of failure NEVER occurs twice

---------------------------------------------------------------------
KEY OPERATIONAL LAWS
---------------------------------------------------------------------

- Caching is NOT a substitute for bounded queries
- Homepage is a PUBLIC API surface
- Security precedes UX
- All data is dirty by default
- Platforms are hostile by default

---------------------------------------------------------------------
FINAL LAW
---------------------------------------------------------------------

If enforcement allows a known mistake to recur,
ENFORCEMENT MUST BE STRENGTHENED.

“This worked” is irrelevant.
Only “this cannot fail the same way again” matters.

=====================================================================
END OF AGENT OPERATING SYSTEM
=====================================================================
