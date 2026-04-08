/**
 * SQLSandbox — Durable Object for isolated SQL execution
 *
 * Each execution gets a unique DO instance with its own private SQLite database.
 * Schema setup + user code runs in complete isolation from production D1.
 * The DO is ephemeral — storage is deleted after execution completes.
 */

interface SQLRequest {
  action: 'execute';
  schemaSetup?: string[];
  userCode: string;
}

interface SQLResponse {
  success: boolean;
  results: unknown[];
  error?: string;
}

const ALLOWED_STMT = /^(SELECT|INSERT|UPDATE|DELETE|CREATE\s+TABLE|DROP\s+TABLE|ALTER)/i;

export class SQLSandbox implements DurableObject {
  private state: DurableObjectState;
  private sql: SqlStorage;

  constructor(state: DurableObjectState, _env: Env) {
    this.state = state;
    this.sql = state.storage.sql;
  }

  async fetch(request: Request): Promise<Response> {
    try {
      const body = await request.json() as SQLRequest;

      if (body.action !== 'execute') {
        return Response.json({ success: false, error: 'Unknown action' }, { status: 400 });
      }

      const result = await this.execute(body.schemaSetup || [], body.userCode);

      // Clean up — delete all storage so this DO can be evicted
      await this.state.storage.deleteAll();

      return Response.json(result);
    } catch (err) {
      return Response.json({
        success: false,
        results: [],
        error: err instanceof Error ? err.message : 'SQL sandbox error',
      });
    }
  }

  private async execute(schemaSetup: string[], userCode: string): Promise<SQLResponse> {
    const allResults: unknown[] = [];

    // 1. Run schema setup (CREATE TABLE + INSERT seed data)
    for (const stmt of schemaSetup) {
      const parts = stmt.split(';').filter(s => s.trim());
      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        if (!ALLOWED_STMT.test(trimmed)) {
          return { success: false, results: [], error: `Statement not allowed: ${trimmed.slice(0, 50)}` };
        }
        this.sql.exec(trimmed);
      }
    }

    // 2. Run user code — collect results from SELECT statements
    const userStatements = userCode.split(';').filter(s => s.trim());
    for (const stmt of userStatements) {
      const trimmed = stmt.trim();
      if (!trimmed) continue;

      if (!ALLOWED_STMT.test(trimmed)) {
        return { success: false, results: [], error: `Statement not allowed: ${trimmed.slice(0, 50)}` };
      }

      const cursor = this.sql.exec(trimmed);
      // Collect rows for SELECT queries
      if (/^SELECT/i.test(trimmed)) {
        const rows = [...cursor];
        allResults.push(rows);
      } else {
        allResults.push([]);
      }
    }

    return { success: true, results: allResults };
  }
}
