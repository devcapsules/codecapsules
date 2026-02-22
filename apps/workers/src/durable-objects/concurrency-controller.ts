/**
 * ConcurrencyController — Durable Object for Per-Org Execution Throttling
 *
 * Single-threaded actor model: one instance per org (sharded by orgId).
 * Implements a semaphore pattern — consumers must acquire a slot before
 * calling Piston, and release it when done.
 *
 * Key behaviors:
 * - Slot acquire/release with per-org max (derived from plan)
 * - Idempotency: duplicate acquire for same jobId returns success
 * - Alarm-based cleanup: stuck slots (>30s) are auto-released
 * - Hibernation-safe: all state persisted to Durable Object storage
 *
 * Endpoints (called by queue consumer via stub.fetch):
 *   POST /acquire  → { granted, reason, activeCount, maxSlots, queuePosition? }
 *   POST /release  → { released }
 *   GET  /status   → { activeSlots, maxSlots, available, slots }
 *   POST /configure → { maxSlots } — update max slots for this org
 */

// ── Types ────────────────────────────────────────────────────────────────────

interface SlotInfo {
  jobId: string;
  orgId: string;
  plan: string;
  acquiredAt: number;
  language: string;
  type: 'run' | 'tests';
}

interface AcquireRequest {
  jobId: string;
  orgId: string;
  plan: string;
  language: string;
  type: 'run' | 'tests';
}

interface AcquireResponse {
  granted: boolean;
  reason: 'granted' | 'idempotent' | 'at_capacity';
  activeCount: number;
  maxSlots: number;
  queuePosition?: number;
}

interface ReleaseRequest {
  jobId: string;
}

interface ReleaseResponse {
  released: boolean;
  activeCount: number;
}

interface StatusResponse {
  activeSlots: number;
  maxSlots: number;
  available: number;
  slots: Record<string, SlotInfo>;
}

// ── Plan-based concurrency limits ────────────────────────────────────────────

const PLAN_MAX_SLOTS: Record<string, number> = {
  free: 2,
  creator: 5,
  team: 10,
  enterprise: 25,
};

const DEFAULT_MAX_SLOTS = 3;

// Slots older than this are considered stuck and auto-released
const STUCK_SLOT_THRESHOLD_MS = 30_000; // 30s (Piston max is 3s, generous buffer)

// Alarm interval for checking stuck slots
const ALARM_INTERVAL_MS = 15_000; // 15s

// ══════════════════════════════════════════════════════════════════════════════
// Durable Object Class
// ══════════════════════════════════════════════════════════════════════════════

export class ConcurrencyController implements DurableObject {
  private state: DurableObjectState;
  private env: Env;

  // In-memory cache — rebuilt from storage on cold start
  private activeSlots: Map<string, SlotInfo> = new Map();
  private maxSlots: number = DEFAULT_MAX_SLOTS;
  private initialized: boolean = false;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;

    // blockConcurrencyWhile ensures no requests are processed until state is loaded
    this.state.blockConcurrencyWhile(async () => {
      await this.loadState();
    });
  }

  // ── State Persistence ──────────────────────────────────────────────────────

  private async loadState(): Promise<void> {
    const [storedSlots, storedMax] = await Promise.all([
      this.state.storage.get<[string, SlotInfo][]>('activeSlots'),
      this.state.storage.get<number>('maxSlots'),
    ]);

    // Restore active slots (stored as entries array for reliable serialization)
    if (storedSlots) {
      this.activeSlots = new Map(storedSlots);
    }

    if (storedMax) {
      this.maxSlots = storedMax;
    }

    this.initialized = true;
  }

  private async persistSlots(): Promise<void> {
    // Store as entries array (Map serialization can be unreliable across runtimes)
    await this.state.storage.put('activeSlots', Array.from(this.activeSlots.entries()));
  }

  private async persistMaxSlots(): Promise<void> {
    await this.state.storage.put('maxSlots', this.maxSlots);
  }

  // ── Request Router ─────────────────────────────────────────────────────────

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    try {
      switch (url.pathname) {
        case '/acquire':
          return await this.handleAcquire(request);
        case '/release':
          return await this.handleRelease(request);
        case '/status':
          return await this.handleStatus();
        case '/configure':
          return await this.handleConfigure(request);
        default:
          return Response.json({ error: 'Not Found' }, { status: 404 });
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown DO error';
      console.error(`ConcurrencyController error: ${errMsg}`);
      return Response.json({ error: errMsg }, { status: 500 });
    }
  }

  // ── POST /acquire — Request an execution slot ──────────────────────────────

  private async handleAcquire(request: Request): Promise<Response> {
    const body = (await request.json()) as AcquireRequest;
    const { jobId, orgId, plan, language, type } = body;

    if (!jobId) {
      return Response.json({ error: 'jobId is required' }, { status: 400 });
    }

    // Idempotency: if this job already has a slot, return success
    if (this.activeSlots.has(jobId)) {
      const response: AcquireResponse = {
        granted: true,
        reason: 'idempotent',
        activeCount: this.activeSlots.size,
        maxSlots: this.maxSlots,
      };
      return Response.json(response);
    }

    // Update max slots based on plan (auto-configure on first acquire)
    const planMax = PLAN_MAX_SLOTS[plan || 'free'] || DEFAULT_MAX_SLOTS;
    if (planMax !== this.maxSlots) {
      this.maxSlots = planMax;
      await this.persistMaxSlots();
    }

    // Check capacity
    if (this.activeSlots.size >= this.maxSlots) {
      const response: AcquireResponse = {
        granted: false,
        reason: 'at_capacity',
        activeCount: this.activeSlots.size,
        maxSlots: this.maxSlots,
        queuePosition: this.activeSlots.size - this.maxSlots + 1,
      };

      console.log(JSON.stringify({
        type: 'warn',
        action: 'concurrency_controller.slot_denied',
        orgId,
        jobId,
        activeCount: this.activeSlots.size,
        maxSlots: this.maxSlots,
      }));

      return Response.json(response);
    }

    // Grant slot
    const slotInfo: SlotInfo = {
      jobId,
      orgId: orgId || 'anonymous',
      plan: plan || 'free',
      acquiredAt: Date.now(),
      language: language || 'unknown',
      type: type || 'run',
    };

    this.activeSlots.set(jobId, slotInfo);
    await this.persistSlots();

    // Ensure alarm is set for stuck-slot cleanup
    await this.ensureAlarm();

    const response: AcquireResponse = {
      granted: true,
      reason: 'granted',
      activeCount: this.activeSlots.size,
      maxSlots: this.maxSlots,
    };

    console.log(JSON.stringify({
      type: 'info',
      action: 'concurrency_controller.slot_acquired',
      orgId,
      jobId,
      language,
      activeCount: this.activeSlots.size,
      maxSlots: this.maxSlots,
    }));

    return Response.json(response);
  }

  // ── POST /release — Free an execution slot ─────────────────────────────────

  private async handleRelease(request: Request): Promise<Response> {
    const body = (await request.json()) as ReleaseRequest;
    const { jobId } = body;

    if (!jobId) {
      return Response.json({ error: 'jobId is required' }, { status: 400 });
    }

    const existed = this.activeSlots.has(jobId);
    const slotInfo = this.activeSlots.get(jobId);

    if (existed) {
      this.activeSlots.delete(jobId);
      await this.persistSlots();

      console.log(JSON.stringify({
        type: 'info',
        action: 'concurrency_controller.slot_released',
        jobId,
        orgId: slotInfo?.orgId,
        activeCount: this.activeSlots.size,
        heldFor: slotInfo ? Date.now() - slotInfo.acquiredAt : 0,
      }));
    }

    const response: ReleaseResponse = {
      released: existed,
      activeCount: this.activeSlots.size,
    };

    return Response.json(response);
  }

  // ── GET /status — Current concurrency state ────────────────────────────────

  private async handleStatus(): Promise<Response> {
    const response: StatusResponse = {
      activeSlots: this.activeSlots.size,
      maxSlots: this.maxSlots,
      available: Math.max(0, this.maxSlots - this.activeSlots.size),
      slots: Object.fromEntries(this.activeSlots),
    };

    return Response.json(response);
  }

  // ── POST /configure — Update max slots ─────────────────────────────────────

  private async handleConfigure(request: Request): Promise<Response> {
    const body = (await request.json()) as { maxSlots: number };

    if (typeof body.maxSlots !== 'number' || body.maxSlots < 1 || body.maxSlots > 100) {
      return Response.json({ error: 'maxSlots must be 1-100' }, { status: 400 });
    }

    this.maxSlots = body.maxSlots;
    await this.persistMaxSlots();

    return Response.json({ maxSlots: this.maxSlots });
  }

  // ── Alarm — Cleanup stuck slots ────────────────────────────────────────────

  async alarm(): Promise<void> {
    const now = Date.now();
    let cleaned = 0;
    const stuckJobs: string[] = [];

    for (const [jobId, info] of this.activeSlots) {
      if (now - info.acquiredAt > STUCK_SLOT_THRESHOLD_MS) {
        stuckJobs.push(jobId);
        cleaned++;
      }
    }

    // Remove stuck slots
    for (const jobId of stuckJobs) {
      this.activeSlots.delete(jobId);
    }

    if (cleaned > 0) {
      await this.persistSlots();

      console.log(JSON.stringify({
        type: 'warn',
        action: 'concurrency_controller.alarm_cleanup',
        cleanedSlots: cleaned,
        stuckJobs,
        remainingActive: this.activeSlots.size,
      }));
    }

    // Reschedule alarm if slots are still active
    if (this.activeSlots.size > 0) {
      await this.state.storage.setAlarm(Date.now() + ALARM_INTERVAL_MS);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async ensureAlarm(): Promise<void> {
    const currentAlarm = await this.state.storage.getAlarm();
    if (!currentAlarm) {
      await this.state.storage.setAlarm(Date.now() + ALARM_INTERVAL_MS);
    }
  }
}
