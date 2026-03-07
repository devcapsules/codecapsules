/**
 * EdGE Assistant — Intelligent Error Guidance Engine
 *
 * Turns machine errors into human-readable, instructor-quality explanations
 * directly inside coding widgets. Two-stage architecture:
 *
 *   Stage 1 — Error Classifier (fast regex/heuristic, no AI cost)
 *   Stage 2 — Explanation Generator (Azure OpenAI gpt-4o-mini, <1.5s target)
 *
 * Endpoints:
 *   POST /api/v1/edge/assist — Get structured explanation for a failure
 *
 * Cache Strategy:
 *   Cache key = hash(language + errorType + normalised error + first 200 chars of code structure)
 *   TTL = 1 hour. Same conceptual mistakes get instant cached responses.
 */

import { Hono } from 'hono';

type Variables = {
  auth: { userId: string; plan: string } | null;
};

const edge = new Hono<{ Bindings: Env; Variables: Variables }>();

// ══════════════════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════════════════

interface AssistRequest {
  language: string;
  problemStatement: string;
  studentCode: string;
  stderr: string;
  testResults?: {
    passed: number;
    total: number;
    results: {
      description: string;
      passed: boolean;
      expected: any;
      actual: any;
      error?: string;
    }[];
  };
  difficulty?: string;
  capsuleId?: string;
}

interface AssistResponse {
  hint: string;
  fix: string;
  explanation: string;
  lineNumber: number | null;
  errorType: ErrorType;
  cached: boolean;
}

type ErrorType =
  | 'syntax_error'
  | 'name_error'
  | 'type_error'
  | 'index_error'
  | 'key_error'
  | 'attribute_error'
  | 'import_error'
  | 'value_error'
  | 'zero_division'
  | 'runtime_error'
  | 'logic_error'
  | 'edge_case'
  | 'infinite_loop'
  | 'performance'
  | 'unknown';

// ══════════════════════════════════════════════════════════════════════════════
// Constants
// ══════════════════════════════════════════════════════════════════════════════

const ASSIST_LIMITS: Record<string, number> = {
  free: 10,       // 10 explanations per day
  creator: 50,    // 50/day
  enterprise: 200, // 200/day
};

const ASSIST_COST_USD = 0.001; // ~200 tokens in, ~300 out at gpt-4o-mini rates

// ══════════════════════════════════════════════════════════════════════════════
// Stage 1 — Error Classifier (Zero AI cost, regex + heuristic)
// ══════════════════════════════════════════════════════════════════════════════

function classifyError(stderr: string, _language: string, testResults?: AssistRequest['testResults']): ErrorType {
  const err = (stderr || '').toLowerCase();

  // ── Python-style errors ──
  if (err.includes('syntaxerror') || err.includes('unexpected eof') || err.includes('invalid syntax'))
    return 'syntax_error';
  if (err.includes('nameerror') || err.includes('is not defined') || err.includes('name \''))
    return 'name_error';
  if (err.includes('typeerror') || err.includes('not callable') || err.includes('unsupported operand'))
    return 'type_error';
  if (err.includes('indexerror') || err.includes('list index out of range') || err.includes('index out of'))
    return 'index_error';
  if (err.includes('keyerror'))
    return 'key_error';
  if (err.includes('attributeerror') || err.includes('has no attribute'))
    return 'attribute_error';
  if (err.includes('importerror') || err.includes('modulenotfounderror') || err.includes('no module named'))
    return 'import_error';
  if (err.includes('valueerror'))
    return 'value_error';
  if (err.includes('zerodivisionerror') || err.includes('division by zero'))
    return 'zero_division';
  if (err.includes('timeout') || err.includes('time limit') || err.includes('timed out'))
    return 'infinite_loop';

  // ── JavaScript-style errors ──
  if (err.includes('referenceerror'))
    return 'name_error';
  if (err.includes('rangeerror'))
    return 'index_error';
  if (err.includes('unexpected token') || err.includes('unexpected end'))
    return 'syntax_error';

  // ── Java/C++ style ──
  if (err.includes('nullpointerexception') || err.includes('segmentation fault'))
    return 'runtime_error';
  if (err.includes('compilation error') || err.includes('cannot find symbol'))
    return 'syntax_error';
  if (err.includes('arrayindexoutofboundsexception'))
    return 'index_error';

  // ── Logic errors (tests fail but no stderr) ──
  if (!stderr && testResults && testResults.total > 0) {
    const failRate = 1 - (testResults.passed / testResults.total);
    if (testResults.passed > 0 && failRate < 0.5) return 'edge_case';
    return 'logic_error';
  }

  // ── Generic stderr present ──
  if (stderr && stderr.trim().length > 0) return 'runtime_error';

  return 'unknown';
}

// ══════════════════════════════════════════════════════════════════════════════
// Line number extraction from stderr
// ══════════════════════════════════════════════════════════════════════════════

function extractLineNumber(stderr: string): number | null {
  // Python: File "<string>", line 7
  const pyMatch = stderr.match(/line\s+(\d+)/i);
  if (pyMatch) return parseInt(pyMatch[1]);

  // JavaScript/Node: at Object.<anonymous> (file:7:5)  or  :7:
  const jsMatch = stderr.match(/:(\d+):\d+/);
  if (jsMatch) return parseInt(jsMatch[1]);

  // Java: .java:15
  const javaMatch = stderr.match(/\.java:(\d+)/);
  if (javaMatch) return parseInt(javaMatch[1]);

  // C/C++: :15:3: error
  const cMatch = stderr.match(/:(\d+):\d+:\s*(?:error|warning)/);
  if (cMatch) return parseInt(cMatch[1]);

  return null;
}

// ══════════════════════════════════════════════════════════════════════════════
// Code structure normalizer (for cache key — strip variable names, keep shape)
// ══════════════════════════════════════════════════════════════════════════════

function normalizeCodeStructure(code: string): string {
  return code
    .replace(/#.*/g, '')          // strip comments
    .replace(/\/\/.*/g, '')       // strip JS comments
    .replace(/\s+/g, ' ')        // normalize whitespace
    .trim()
    .slice(0, 200);              // first 200 chars of structure
}

// ══════════════════════════════════════════════════════════════════════════════
// Cache key builder
// ══════════════════════════════════════════════════════════════════════════════

async function buildCacheKey(
  language: string,
  errorType: ErrorType,
  stderr: string,
  code: string
): Promise<string> {
  const normalizedError = (stderr || '').trim().replace(/\s+/g, ' ').slice(0, 150);
  const codeStructure = normalizeCodeStructure(code);
  const raw = `${language}:${errorType}:${normalizedError}:${codeStructure}`;

  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

// ══════════════════════════════════════════════════════════════════════════════
// Stage 2 — Explanation Generator (Azure OpenAI gpt-4o-mini)
// ══════════════════════════════════════════════════════════════════════════════

async function generateExplanation(
  env: Env,
  request: AssistRequest,
  errorType: ErrorType,
  lineNumber: number | null
): Promise<{ hint: string; fix: string; explanation: string; lineNumber: number | null }> {
  const failedTests = request.testResults?.results?.filter(r => !r.passed) || [];
  const failedTestsStr = failedTests.length > 0
    ? failedTests.slice(0, 3).map((t, i) =>
        `Test ${i + 1}: ${t.description}\n  Expected: ${JSON.stringify(t.expected)}\n  Got: ${JSON.stringify(t.actual)}${t.error ? `\n  Error: ${t.error}` : ''}`
      ).join('\n\n')
    : 'No specific test failure details available.';

  const systemPrompt = `You are EdGE Assistant, a patient programming instructor inside a coding widget.
Your job: explain why a student's code failed in a way that teaches, not just tells.

Rules:
- Write for a beginner. No jargon unless explained.
- Be concise. Hint ≤1 sentence. Fix ≤3 lines of code. Explanation ≤4 sentences.
- Never reveal the full solution. Guide them to find it.
- If you can identify the exact line, include it in line_number.
- Use the student's variable names and context.
- When providing the Fix code snippet, ensure the code is highly idiomatic, efficient, and formatted for a beginner to understand. Avoid redundant operations (e.g. don't wrap a string slice in join() when the slice already returns a string).
- Return valid JSON only, no markdown fences.`;

  const userPrompt = `Language: ${request.language}
Difficulty: ${request.difficulty || 'medium'}
Error Type: ${errorType}

Problem Statement:
${(request.problemStatement || 'Not provided').slice(0, 500)}

Student Code:
\`\`\`
${request.studentCode.slice(0, 1500)}
\`\`\`

Error Output:
${(request.stderr || 'No stderr').slice(0, 500)}

Failed Tests:
${failedTestsStr}

${lineNumber ? `Suspected line: ${lineNumber}` : ''}

Return JSON:
{
  "hint": "One-sentence nudge (what is wrong, not how to fix)",
  "fix": "Minimal code snippet showing the fix (≤3 lines)",
  "explanation": "2-4 sentence teaching explanation of why this happens and the concept behind it",
  "line_number": ${lineNumber || 'null'}
}`;

  // Call Azure OpenAI (gpt-4o-mini for speed + cost)
  const endpoint = env.AZURE_OPENAI_ENDPOINT;
  const apiKey = env.AZURE_OPENAI_API_KEY;
  // Use mini model for assistant (fast + cheap); fall back to main deployment
  const deployment = 'gpt-4o-mini';
  const apiVersion = env.AZURE_OPENAI_API_VERSION || '2025-01-01-preview';

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    // If mini model not available, retry with main deployment
    if (response.status === 404) {
      const fallbackUrl = `${endpoint}/openai/deployments/${env.AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${apiVersion}`;
      const fallbackResponse = await fetch(fallbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 500,
          response_format: { type: 'json_object' },
        }),
      });

      if (!fallbackResponse.ok) {
        throw new Error(`Azure OpenAI error: ${fallbackResponse.status}`);
      }

      const fallbackData = await fallbackResponse.json() as any;
      const parsed = JSON.parse(fallbackData.choices[0].message.content);
      return {
        hint: parsed.hint || 'Check your code for errors.',
        fix: parsed.fix || '',
        explanation: parsed.explanation || 'An error occurred in your code.',
        lineNumber: parsed.line_number ?? lineNumber,
      };
    }

    throw new Error(`Azure OpenAI error: ${response.status}`);
  }

  const data = await response.json() as any;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from Azure OpenAI');
  }

  const parsed = JSON.parse(content);

  return {
    hint: parsed.hint || 'Check your code for errors.',
    fix: parsed.fix || '',
    explanation: parsed.explanation || 'An error occurred in your code.',
    lineNumber: parsed.line_number ?? lineNumber,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// POST /assist — Main endpoint
// ══════════════════════════════════════════════════════════════════════════════

edge.post('/assist', async (c) => {
  const startTime = Date.now();
  const env = c.env;

  // Auth is optional for embed widgets (they don't authenticate)
  // but if present, we apply rate limits
  const auth = c.get('auth') as { userId: string; plan: string } | undefined;

  const body = await c.req.json<AssistRequest>();
  const { language, studentCode, stderr, testResults, difficulty, capsuleId } = body;

  // ── Validate ──
  if (!language || !studentCode) {
    return c.json({ error: 'language and studentCode are required' }, 400);
  }

  // ── Only on failure (cost optimization: ~70% savings) ──
  if (!stderr && (!testResults || testResults.passed === testResults.total)) {
    return c.json({ error: 'EdGE Assistant only activates on failures' }, 400);
  }

  // ── Rate limit (per-IP for anonymous, per-user for authenticated) ──
  const rateLimitId = auth ? `edge:${auth.userId}` : `edge:ip:${c.req.header('cf-connecting-ip') || 'unknown'}`;
  const dailyCount = parseInt(await env.CACHE.get(`${rateLimitId}:daily`) || '0');
  const maxDaily = auth ? (ASSIST_LIMITS[auth.plan] || ASSIST_LIMITS.free) : ASSIST_LIMITS.free;

  if (dailyCount >= maxDaily) {
    return c.json({
      error: `EdGE Assistant daily limit reached (${maxDaily}/day)`,
      assistsUsed: dailyCount,
      assistsRemaining: 0,
    }, 429);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Stage 1 — Classify error (instant, no cost)
  // ══════════════════════════════════════════════════════════════════════════

  const errorType = classifyError(stderr || '', language, testResults);
  const lineNumber = extractLineNumber(stderr || '');

  // ══════════════════════════════════════════════════════════════════════════
  // Check cache (same conceptual mistakes → instant response)
  // ══════════════════════════════════════════════════════════════════════════

  const cacheKey = await buildCacheKey(language, errorType, stderr || '', studentCode);
  const cached = await env.CACHE.get(`edge:cache:${cacheKey}`, 'json') as AssistResponse | null;

  if (cached) {
    console.log(JSON.stringify({
      type: 'metric',
      name: 'edge.cache_hit',
      errorType,
      language,
      latencyMs: Date.now() - startTime,
    }));

    return c.json({
      ...cached,
      cached: true,
      errorType,
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Stage 2 — Generate explanation (Azure OpenAI)
  // ══════════════════════════════════════════════════════════════════════════

  try {
    const result = await generateExplanation(env, body, errorType, lineNumber);

    const assistResponse: AssistResponse = {
      hint: result.hint,
      fix: result.fix,
      explanation: result.explanation,
      lineNumber: result.lineNumber,
      errorType,
      cached: false,
    };

    // ── Cache for 1 hour ──
    await env.CACHE.put(`edge:cache:${cacheKey}`, JSON.stringify(assistResponse), {
      expirationTtl: 3600,
    });

    // ── Track usage ──
    await env.CACHE.put(`${rateLimitId}:daily`, String(dailyCount + 1), {
      expirationTtl: 86400,
    });

    // Track daily AI spend
    const dailySpend = parseFloat(await env.CACHE.get('system:ai:daily_spend') || '0');
    await env.CACHE.put('system:ai:daily_spend', String(dailySpend + ASSIST_COST_USD), {
      expirationTtl: 86400,
    });

    // ── Buffer analytics event ──
    if (capsuleId) {
      const eventKey = `events:pending:${Math.floor(Date.now() / 60_000)}:${crypto.randomUUID().slice(0, 8)}`;
      await env.CACHE.put(eventKey, JSON.stringify({
        capsuleId,
        userId: auth?.userId || 'anonymous',
        eventType: 'edge_assist',
        metadata: {
          errorType,
          lineNumber: result.lineNumber,
          language,
          difficulty,
          latencyMs: Date.now() - startTime,
          cached: false,
        },
        timestamp: new Date().toISOString(),
      }), { expirationTtl: 900 });
    }

    console.log(JSON.stringify({
      type: 'metric',
      name: 'edge.assist_generated',
      errorType,
      language,
      lineNumber: result.lineNumber,
      latencyMs: Date.now() - startTime,
      cached: false,
    }));

    return c.json(assistResponse);
  } catch (err) {
    console.error(JSON.stringify({
      type: 'log',
      level: 'error',
      action: 'edge.assist_failed',
      error: err instanceof Error ? err.message : 'Unknown error',
      errorType,
      language,
      latencyMs: Date.now() - startTime,
    }));

    // ── Graceful fallback: return classifier result with contextual heuristic hints ──
    const fallback = getHeuristicFallback(errorType, stderr || '', language, body);
    return c.json({
      ...fallback,
      errorType,
      cached: false,
      fallback: true,
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// Contextual Heuristic Analysis (code-aware, no AI cost)
// Analyzes the student's code + test results to give specific guidance
// ══════════════════════════════════════════════════════════════════════════════

function getContextualHint(
  errorType: ErrorType,
  stderr: string,
  request: AssistRequest
): { hint: string; fix: string; explanation: string } | null {
  const code = request.studentCode || '';
  const failedTests = request.testResults?.results?.filter(r => !r.passed) || [];
  const lang = (request.language || '').toLowerCase();

  // ── Logic errors: analyze what the code actually does vs what tests expect ──
  if (errorType === 'logic_error' || errorType === 'edge_case') {
    // Check if function just returns input unchanged
    if (failedTests.length > 0) {
      const first = failedTests[0];
      const expected = typeof first.expected === 'string' ? first.expected : JSON.stringify(first.expected);
      const actual = typeof first.actual === 'string' ? first.actual : JSON.stringify(first.actual);

      // Detect: returning raw split (list instead of string)
      if (actual && actual.startsWith('[') && !expected.startsWith('[')) {
        return {
          hint: `Your function returns a list, but the test expects a string. You need to join the result back together.`,
          fix: `After processing, join your list back into a string (e.g., ' '.join(result))`,
          explanation: `split() breaks a string into a list. But the tests expect a string back. After transforming the words, you need to rejoin them with a space as separator.`,
        };
      }

      // Detect: returning the original input unchanged
      if (actual === first.expected?.toString()?.split('')?.reverse()?.join('') ||
          (expected !== actual && actual === request.testResults?.results?.[0]?.expected?.toString())) {
        return {
          hint: `Your function isn't transforming the data — it's returning what it received (or very close to it).`,
          fix: '',
          explanation: `Look at what the test expects vs what you return. You need to add the transformation step between reading the input and returning the output.`,
        };
      }

      // Detect: words reversed in wrong way (whole sentence reversed vs each word reversed)
      if (expected && actual) {
        const expWords = expected.split(' ');
        const actWords = actual.split(' ');
        if (expWords.length === actWords.length) {
          // Check if they reversed word order instead of reversing each word
          const isOrderReversed = actWords.join(' ') === expWords.reverse().join(' ');
          if (isOrderReversed) {
            return {
              hint: `You reversed the order of the words, but the task asks you to reverse each word's characters individually.`,
              fix: `Instead of reversing the list of words, reverse the characters inside each word.`,
              explanation: `"reverse the words" here means reverse each word's letters (e.g., "Hello" → "olleH"), not rearrange the word positions in the sentence.`,
            };
          }
        }
      }

      // Detect: returning a list/array representation as string
      if (actual && (actual.includes("'") || actual.includes('"')) && actual.startsWith('[')) {
        return {
          hint: `You're returning a list instead of a string. The tests expect a single string with spaces between words.`,
          fix: lang === 'python' ? `return ' '.join(your_list)` : `return yourArray.join(' ')`,
          explanation: `After processing each word, you need to combine them back into one string separated by spaces.`,
        };
      }

      // Generic but still contextual: show what's expected vs actual
      const expectedShort = expected.length > 60 ? expected.slice(0, 60) + '...' : expected;
      const actualShort = actual.length > 60 ? actual.slice(0, 60) + '...' : actual;

      return {
        hint: `Your output "${actualShort}" doesn't match expected "${expectedShort}". Check what transformation you're applying to each element.`,
        fix: '',
        explanation: `Compare your output to the expected result character by character. What step is missing or wrong in your logic? Try tracing through your code with the test input.`,
      };
    }
  }

  // ── Syntax errors: try to extract the specific issue from stderr ──
  if (errorType === 'syntax_error' && stderr) {
    const missingColon = stderr.match(/expected '?:'?/i) || stderr.match(/SyntaxError.*expected/i);
    if (missingColon) {
      return {
        hint: `You're missing a colon (:) at the end of a statement like if, for, def, or while.`,
        fix: `Add a : at the end of your def/if/for/while line`,
        explanation: `In Python, control statements and function definitions need a colon at the end of the line. For example: def my_function():`,
      };
    }

    const indentError = stderr.match(/IndentationError|unexpected indent|expected.*indent/i);
    if (indentError) {
      return {
        hint: `Your code has an indentation problem — check that your lines are aligned correctly.`,
        fix: `Use consistent indentation (4 spaces per level is standard in Python)`,
        explanation: `Python uses indentation to define code blocks. All lines inside a function, loop, or if-statement must be indented the same amount.`,
      };
    }
  }

  // ── Name errors: try to find the specific undefined name ──
  if (errorType === 'name_error') {
    const nameMatch = stderr.match(/name '(\w+)' is not defined/i) ||
                      stderr.match(/(\w+) is not defined/i);
    if (nameMatch) {
      const varName = nameMatch[1];
      // Check if it's a typo of a variable in the code
      const codeWords = code.match(/\b\w+\b/g) || [];
      const similar = codeWords.find(w => 
        w !== varName && w.toLowerCase().includes(varName.toLowerCase().slice(0, -1))
      );
      return {
        hint: `The name "${varName}" isn't defined anywhere in your code.${similar ? ` Did you mean "${similar}"?` : ''}`,
        fix: similar ? `Check if "${varName}" should be "${similar}"` : `Make sure to define "${varName}" before using it`,
        explanation: `Every variable and function must be defined before it's used. Either you misspelled it, or you forgot to create it.`,
      };
    }
  }

  // ── Type errors: parse the specific type mismatch ──
  if (errorType === 'type_error') {
    const concatError = stderr.match(/can only concatenate str.*to str|unsupported operand.*str.*int/i);
    if (concatError) {
      return {
        hint: `You're trying to combine a string with a number. Convert one to match the other.`,
        fix: lang === 'python' ? `Use str(number) to convert, or f-strings: f"text {number}"` : `Use String(number) or template literals: \`text \${number}\``,
        explanation: `Strings and numbers can't be directly combined with +. You need to convert the number to a string first, or use string formatting.`,
      };
    }
  }

  return null; // fall through to generic fallback
}

// ══════════════════════════════════════════════════════════════════════════════
// Heuristic Fallback (when AI is unavailable — still useful!)
// ══════════════════════════════════════════════════════════════════════════════

function getHeuristicFallback(
  errorType: ErrorType,
  stderr: string,
  _language: string,
  request?: AssistRequest
): { hint: string; fix: string; explanation: string; lineNumber: number | null } {
  const lineNumber = extractLineNumber(stderr);

  // ── Try contextual analysis first (uses code + test results) ──
  if (request) {
    const contextual = getContextualHint(errorType, stderr, request);
    if (contextual) return { ...contextual, lineNumber };
  }

  // ── Generic fallbacks (last resort) ──
  const fallbacks: Record<ErrorType, { hint: string; fix: string; explanation: string }> = {
    syntax_error: {
      hint: 'There\'s a syntax issue — check for missing brackets, quotes, or colons.',
      fix: '',
      explanation: 'Syntax errors mean the code can\'t be read by the interpreter. Common causes: unclosed parentheses, missing colons after if/for/def, or mismatched quotes.',
    },
    name_error: {
      hint: 'You\'re using a variable or function that hasn\'t been defined yet.',
      fix: '',
      explanation: 'A NameError means you referenced something the program doesn\'t know about. Either it\'s misspelled, or you forgot to create it before using it.',
    },
    type_error: {
      hint: 'You\'re trying to use a value in a way that doesn\'t match its type.',
      fix: '',
      explanation: 'A TypeError happens when you mix incompatible types — like adding a string to a number, or calling something that isn\'t a function.',
    },
    index_error: {
      hint: 'You\'re trying to access a position that doesn\'t exist in your list.',
      fix: '',
      explanation: 'Your code tries to access an element beyond the list\'s length. Remember: indices start at 0, so a list of 3 items has indices 0, 1, 2.',
    },
    key_error: {
      hint: 'You\'re looking for a key that doesn\'t exist in your dictionary.',
      fix: '',
      explanation: 'A KeyError means the dictionary doesn\'t have the key you\'re looking for. Use .get(key, default) to handle missing keys safely.',
    },
    attribute_error: {
      hint: 'You\'re calling a method or property that this object doesn\'t have.',
      fix: '',
      explanation: 'An AttributeError means you\'re trying to use something that doesn\'t exist on that object. Check the spelling and make sure you have the right type.',
    },
    import_error: {
      hint: 'A module or package you\'re trying to import isn\'t available.',
      fix: '',
      explanation: 'Import errors happen when the module isn\'t installed or the name is misspelled. Check if the module name is correct.',
    },
    value_error: {
      hint: 'A function received a value it can\'t handle.',
      fix: '',
      explanation: 'A ValueError means the value is the right type but wrong content — like trying to convert "hello" to an integer.',
    },
    zero_division: {
      hint: 'Your code is dividing by zero somewhere.',
      fix: '',
      explanation: 'Division by zero is undefined in math. Add a check: if the divisor could be zero, handle that case before dividing.',
    },
    infinite_loop: {
      hint: 'Your code took too long — likely an infinite loop.',
      fix: '',
      explanation: 'The execution timed out. Check your loops: is the condition ever becoming false? Is the counter being updated?',
    },
    runtime_error: {
      hint: 'Your code hit a runtime error during execution.',
      fix: '',
      explanation: 'A runtime error means the code is syntactically correct but fails during execution. Check the error message for the specific cause.',
    },
    logic_error: {
      hint: 'Your code runs but produces wrong results for some test cases.',
      fix: '',
      explanation: 'A logic error means the code doesn\'t crash, but the logic doesn\'t match what\'s expected. Walk through your code step by step with a failing test case.',
    },
    edge_case: {
      hint: 'Your solution works for most cases but fails on edge cases.',
      fix: '',
      explanation: 'Edge cases are unusual inputs: empty lists, zero, negative numbers, very large values. Think about what happens at the boundaries.',
    },
    performance: {
      hint: 'Your solution is too slow for large inputs.',
      fix: '',
      explanation: 'Consider using a more efficient data structure (like a dictionary or set) to reduce the number of operations. Nested loops on large inputs are usually too slow.',
    },
    unknown: {
      hint: 'Something went wrong with your code. Check the error output for details.',
      fix: '',
      explanation: 'Review the error message carefully. If it\'s unclear, try simplifying your code and testing smaller pieces.',
    },
  };

  return {
    ...fallbacks[errorType],
    lineNumber,
  };
}

export { edge as edgeRoutes };
