# Learner Identity Solutions — Decision Document

> **Problem:** Students don't log in to the embed widget. All analytics events are stored with
> `user_id: null` and an ephemeral `session_id` (`embed_{timestamp}_{random}`).
> Course creators cannot see which students passed or failed individual capsules.

---

## Current State

| Field | Current Value | Problem |
|-------|--------------|---------|
| `user_id` | Always `null` for embed | No student identity |
| `session_id` | `embed_1716234567890_a3f8c9d2e` | Dies on page reload — can't track returning students |
| `capsule_id` | Real capsule ID | ✅ Works |
| `metadata` | Includes passedTests, totalTests, attemptsCount, etc. | ✅ Good data, but no one to attach it to |

**Result:** Creator dashboard can show aggregate counts (total runs, total passes) but **cannot** say
"Student X passed 5/8 capsules" or "These 3 students are struggling."

---

## Solution 1: Anonymous Persistent ID (localStorage)

### How It Works
- On first widget load, generate a stable `learner_id` → store in `localStorage`
- Reuse on every subsequent visit (survives page reloads, across capsules on same domain)
- Attach `learner_id` to every analytics event alongside `session_id`

### Implementation
```
// In EmbedAnalytics.ts
private getOrCreateLearnerId(): string {
  const KEY = 'edgeforge_learner_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = `learner_${crypto.randomUUID()}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}
```

### DB Change
```sql
ALTER TABLE capsule_events ADD COLUMN learner_id TEXT;
CREATE INDEX idx_learner ON capsule_events(learner_id);
```

### Creator Dashboard Shows
- "Learner #a3f8c" passed capsules 1, 2, 3 — failed capsule 4
- 45 unique learners attempted your course
- 12 at-risk learners (high attempt count, low pass rate)

### Pros
- **Zero friction** — student does nothing
- Works immediately on all embeds
- Survives page reloads within same domain/browser

### Cons
- **No real names** — creator sees anonymous IDs
- Clears if student uses incognito, clears storage, or switches browser/device
- Cross-domain embeds = different IDs per domain (iframe localStorage is per-origin)
- ⚠️ May need cookie consent in EU (persistent localStorage = "tracking")

### Effort: ~2 hours

---

## Solution 2: Host-Passed Identity (iframe attributes)

### How It Works
- Embedding site passes student info via `data-*` attributes on the iframe/script tag
- If the host site has its own authentication (LMS, blog with accounts, etc.), student identity flows through automatically
- EdGE Forge records whatever the host provides

### Implementation — Embed Side
```html
<!-- Host site embeds this: -->
<iframe
  src="https://embed.edgeforge.dev/capsule/abc123"
  data-learner-id="student_42"
  data-learner-name="Alice Johnson"
  data-learner-email="alice@university.edu"
></iframe>

<!-- Or via URL params: -->
<iframe src="https://embed.edgeforge.dev/capsule/abc123?learnerId=student_42&learnerName=Alice+Johnson"></iframe>
```

```typescript
// In embed app initialization:
const params = new URLSearchParams(window.location.search);
const learnerId = params.get('learnerId');
const learnerName = params.get('learnerName');
// Attach to all analytics events
```

### Creator Dashboard Shows
- "Alice Johnson (alice@university.edu)" passed capsules 1-5
- "Bob Smith" failed capsule 3, attempted 8 times
- If host doesn't pass identity → falls back to "Anonymous"

### Pros
- **Real names** when available
- Zero friction for students (host site handles auth)
- Works perfectly for LMS integrations, course platforms, etc.
- No privacy concerns (host site controls what's shared)

### Cons
- **Only works if the HOST SITE has authentication** — blogs/docs without login can't use this
- Requires host site to modify their embed code
- Each host site integration is custom
- Can be spoofed (no verification of passed identity)

### Effort: ~3 hours

---

## Solution 3: Both Combined (Recommended)

### How It Works
1. **Default:** Auto-generate persistent `learner_id` via localStorage (Solution 1)
2. **Enhanced:** If host page passes `data-learner-id` / `data-learner-name`, use those instead
3. Merged identity: `{ learnerId, learnerName?, learnerEmail? }`

### Implementation
```typescript
class EmbedAnalytics {
  private learnerId: string;
  private learnerName: string | null;

  constructor() {
    // 1. Check host-passed identity first
    const params = new URLSearchParams(window.location.search);
    const hostLearnerId = params.get('learnerId');
    const hostLearnerName = params.get('learnerName');

    // 2. Fall back to persistent localStorage ID
    this.learnerId = hostLearnerId || this.getOrCreateLearnerId();
    this.learnerName = hostLearnerName || null;
  }
}
```

### Creator Dashboard Shows
- When host passes identity: "Alice Johnson passed 5/8 capsules"
- When anonymous: "Learner #a3f8c passed 3/8 capsules"
- Either way: full progress tracking, at-risk identification, completion grids

### API Changes Needed
1. Add `learner_id` and `learner_name` columns to `capsule_events`
2. New API endpoints:
   - `GET /analytics/learners/:capsuleId` — list learners who attempted a capsule
   - `GET /analytics/learner-progress/:learnerId` — get one learner's full history
   - `GET /analytics/course-progress/:playlistId` — per-learner progress grid for a course
3. Wire existing dashboard components (CohortDashboard, CapsuleDeepDive) to real API

### DB Schema
```sql
-- Option A: Add to existing table
ALTER TABLE capsule_events ADD COLUMN learner_id TEXT;
ALTER TABLE capsule_events ADD COLUMN learner_name TEXT;
CREATE INDEX idx_learner ON capsule_events(learner_id, capsule_id);

-- Option B: Separate learner table (better for name updates)
CREATE TABLE learners (
  learner_id TEXT PRIMARY KEY,
  display_name TEXT,
  email TEXT,
  first_seen TEXT DEFAULT (datetime('now')),
  last_seen TEXT DEFAULT (datetime('now')),
  source TEXT  -- 'auto' | 'host_passed' | 'self_identified'
);
```

### Pros
- Best of both worlds — always tracks, uses real names when available
- Graceful degradation — anonymous is the default, identity is a bonus
- No friction for students
- Documentation-driven: tell host sites "add these attributes for named tracking"

### Cons
- More implementation work
- Still anonymous by default (many creators won't get named data)
- localStorage limitations (cross-device, incognito, etc.)

### Effort: ~6-8 hours (embed + API + dashboard wiring)

---

## Solution 4: Lightweight Name Prompt

### How It Works
- When a student starts their **first capsule in a course**, show a small non-blocking dialog:
  "Enter your name so your instructor can track your progress (optional)"
- Store name + auto-generated ID in localStorage
- If student skips → tracked as anonymous (Solution 1 fallback)
- Only prompt once per course (localStorage flag)

### Implementation
```tsx
// In embed widget, before first capsule interaction:
function LearnerIdentityPrompt({ onSubmit, onSkip }) {
  const [name, setName] = useState('');
  return (
    <div className="learner-prompt">
      <p>Your instructor tracks progress for this course.</p>
      <input placeholder="Your name (optional)" value={name} onChange={...} />
      <button onClick={() => onSubmit(name)}>Continue</button>
      <button onClick={onSkip}>Skip</button>
    </div>
  );
}
```

### Creator Dashboard Shows
- "Alice" passed 5/8 (if name entered)
- "Anonymous Learner #a3f8c" passed 3/8 (if skipped)

### Pros
- **Real names** for most students (most will type their name if asked)
- Still zero-login — just a name, no account creation
- Works on all embed sites (no host integration needed)
- Creator gets actionable data: "Alice is struggling with recursion"

### Cons
- **Adds friction** — even a one-time prompt interrupts the coding flow
- Students may enter fake names
- Privacy concern: some students don't want to be identified
- Need to design the prompt UX carefully (must be non-annoying)
- May reduce engagement if students feel "watched"

### Effort: ~4-5 hours

---

## Comparison Matrix

| Criteria | Sol 1: Auto ID | Sol 2: Host-Passed | Sol 3: Both | Sol 4: Name Prompt |
|----------|:-:|:-:|:-:|:-:|
| Student friction | None | None | None | Minimal (once) |
| Real names | ❌ | ✅ (if host has auth) | Partial | ✅ (if entered) |
| Works on all sites | ✅ | ❌ (needs host auth) | ✅ | ✅ |
| Cross-device tracking | ❌ | ✅ (if host ID stable) | Partial | ❌ |
| Privacy-friendly | ⚠️ | ✅ (host controls) | ⚠️ | ⚠️ |
| Implementation effort | 2h | 3h | 6-8h | 4-5h |
| Creator value | Medium | High (when available) | Highest | High |

---

## Backend Work Required (All Solutions)

Regardless of which identity solution is chosen, these API endpoints need to be built to replace the mock data in the dashboard:

1. **`GET /analytics/engagement/:capsuleId`** — real engagement metrics
2. **`GET /analytics/pedagogical/:orgId`** — real pedagogical metrics
3. **`GET /analytics/failing-tests/:orgId`** — real failing test analysis
4. **`GET /analytics/pro-tier/:userId`** — real pro tier dashboard data
5. **`GET /analytics/cohort/:cohortId`** — real cohort metrics
6. **`GET /analytics/capsule-deep-dive/:capsuleId`** — real deep-dive data
7. **Learner-specific endpoints** (depends on chosen solution)

Currently, the 4 dashboard components (`ProTierDashboard`, `CohortDashboard`, `CapsuleDeepDive`, `B2BAnalyticsDashboard`) all fetch from non-existent endpoints and silently fall back to **hardcoded mock data**.

---

## Decision Status: IMPLEMENTED — Sol 1 + Sol 4 Hybrid ("The Passive-Aggressive Upgrade")

**Chosen approach:** Start with Solution 1 (Anonymous Persistent ID), layer Solution 4 on top
as an optional, non-blocking "leaderboard name" toast after the student's first successful test pass.

### How It Works

1. **Default (Sol 1):** Student arrives → `localStorage` generates a stable UUID → they appear 
   as "Student #abc123" in the creator dashboard.
2. **The Hook (Sol 4):** After they successfully pass all test cases, a tiny toast slides up:
   `"🏆 Nice! Save to leaderboard? [Your name] [Save]"`
3. **The Merge:** If they enter "Alice", a `learner_identified` event fires → backend backfills
   `learner_name` on all prior events for that UUID → creator now sees "Alice" instead of "Student #abc123".
4. **One-shot:** The toast is shown once per browser. If dismissed or submitted, it never appears again.

### Files Changed

| File | Change |
|------|--------|
| `apps/embed/src/utils/EmbedAnalytics.ts` | Added `learnerId` (persistent localStorage UUID), `learnerName`, `setLearnerName()`, `shouldPromptForName()`, `dismissNamePrompt()`. All events now include `learnerId` + `learnerName`. |
| `apps/embed/src/components/LeaderboardToast.tsx` | **NEW** — non-blocking name prompt toast with auto-dismiss (15s), keyboard shortcuts (Enter/Escape), confirmation animation. |
| `apps/embed/src/components/codecapsuleEmbed.tsx` | Imports LeaderboardToast, shows it 2s after first successful test pass (behind success overlay). |
| `apps/workers/src/routes/analytics.ts` | `POST /track` now persists `learner_id` + `learner_name`. `learner_identified` event triggers backfill UPDATE. Added `GET /analytics/learners/:capsuleId` and `GET /analytics/course-learners/:playlistId` endpoints. |
| `apps/workers/src/utils/analytics-buffer.ts` | Updated INSERT to include `learner_id` and `learner_name` columns. |
| `apps/workers/migrations/0006_learner_identity.sql` | **NEW** — adds `learner_id`, `learner_name` columns + indexes to `capsule_events`. |
