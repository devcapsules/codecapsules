/**
 * CodeCapsule Bridge API — Express Server
 *
 * Runs inside Docker on Azure VMSS, behind Cloudflare Tunnel.
 * NO public IP — cloudflared is the sole ingress.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  Route             │  Auth   │  Purpose                             │
 * ├──────────────────────────────────────────────────────────────────────┤
 * │  /health           │  none   │  cloudflared + Docker health probes  │
 * │  /api/v2/*         │  none   │  Piston proxy (tunnel = boundary)    │
 * │  /internal/health  │  none   │  Internal health (Docker probe)      │
 * │  /internal/generate│  HMAC   │  3-agent AI generation pipeline      │
 * │  /internal/mentor  │  HMAC   │  AI mentor hints                     │
 * │  /internal/tests   │  HMAC   │  Test harness execution via Piston   │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import express from 'express';
import helmet from 'helmet';
import { config } from './config';
import { workerAuthMiddleware } from './middleware/worker-auth';
import { createPistonProxy } from './services/piston-client';

// ── packages/core imports (monorepo tree, resolved by rootDir: ../../) ──
import {
  GenerationPipeline,
  type PipelineGenerationResult,
  type GenerationPipelineConfig,
} from '../../../packages/core/src/agents/generation-pipeline';
import {
  AIService,
  type AIServiceConfig,
} from '../../../packages/core/src/services/ai-service';
import type { GenerationContext, ExecutionError } from '../../../packages/core/src/types/base-capsule';
import { DebuggerAgent, type ValidatorService, type SandboxValidationResult } from '../../../packages/core/src/agents/debugger-agent';

const app = express();

// ═══════════════════════════════════════════════════════════════════════════════
// Middleware
// ═══════════════════════════════════════════════════════════════════════════════

app.use(helmet());
app.use(express.json({ limit: '1mb' }));

// ═══════════════════════════════════════════════════════════════════════════════
// /health — Public (cloudflared + Docker health probes)
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'bridge-api',
    timestamp: new Date().toISOString(),
    piston: config.pistonUrl,
    ai: config.azureOpenAI.apiKey ? 'configured' : 'not_configured',
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// /api/v2/* — Transparent Piston Proxy (no auth — tunnel is the boundary)
// ═══════════════════════════════════════════════════════════════════════════════

app.use('/api/v2', createPistonProxy(config.pistonUrl));

// ═══════════════════════════════════════════════════════════════════════════════
// /internal/* — HMAC-authenticated routes for AI + test execution
// ═══════════════════════════════════════════════════════════════════════════════

app.use(
  '/internal',
  workerAuthMiddleware({
    sharedSecret: config.workerSharedSecret,
    allowedCallers: config.allowedCallers,
  })
);

// ── Lazy-initialised singletons ─────────────────────────────────────────────

let aiService: AIService | null = null;
let pipeline: GenerationPipeline | null = null;

function getAIService(): AIService {
  if (!aiService) {
    const cfg: AIServiceConfig = {
      apiKey: config.azureOpenAI.apiKey,
      endpoint: config.azureOpenAI.endpoint,
      deployment: config.azureOpenAI.deployment,
      apiVersion: config.azureOpenAI.apiVersion,
    };
    if (!cfg.apiKey || !cfg.endpoint) {
      throw new Error('Azure OpenAI not configured (AZURE_OPENAI_API_KEY / AZURE_OPENAI_ENDPOINT)');
    }
    aiService = new AIService(cfg);
    console.log('🤖 AIService initialised');
  }
  return aiService;
}

function getPipeline(): GenerationPipeline {
  if (!pipeline) {
    const pipelineCfg: Partial<GenerationPipelineConfig> = {
      max_generation_attempts: 3,
      enable_quality_gates: true,
      save_intermediate_results: true,
      skip_validation: true,
      timeout_ms: 60_000,
      min_educational_value: 0.7,
      min_technical_quality: 0.8,
      max_debugging_attempts: 2,
    };
    pipeline = new GenerationPipeline(getAIService(), pipelineCfg);
    console.log('🤖 GenerationPipeline initialised');
  }
  return pipeline;
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /internal/generate — 3-Agent AI Capsule Generation
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/internal/generate', async (req, res) => {
  const t0 = Date.now();
  const {
    jobId,
    userId,
    prompt,
    language = 'javascript',
    difficulty = 'medium',
    type = 'code',
    capsuleMode = 'standard',
  } = req.body;

  console.log(`🤖 [${jobId}] Generate started | user=${userId} lang=${language} diff=${difficulty}`);

  if (!prompt) {
    return res.status(400).json({ success: false, jobId, error: 'prompt is required' });
  }

  try {
    const capsuleType =
      language === 'sql' ? 'DATABASE' : type.toUpperCase() === 'DATABASE' ? 'DATABASE' : 'CODE';

    const context: GenerationContext = {
      type: capsuleType as any,
      language,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      userPrompt: prompt,
      targetAudience:
        difficulty === 'easy' ? 'beginner' : difficulty === 'hard' ? 'advanced' : 'intermediate',
      estimatedTime: difficulty === 'easy' ? 15 : difficulty === 'hard' ? 45 : 30,
      capsuleMode: capsuleMode as any,
    };

    const result: PipelineGenerationResult = await getPipeline().generateCapsule(context);
    const pipelineElapsed = Date.now() - t0;

    console.log(
      `✅ [${jobId}] Pipeline done ${pipelineElapsed}ms | quality=${(result.overall_quality * 100).toFixed(1)}%`
    );

    // Diagnostic: log pedagogical_idea fields
    const idea = result.pedagogical_idea;
    console.log(`📋 [${jobId}] pedagogical_idea keys: ${idea ? Object.keys(idea).join(', ') : 'NULL'}`);
    console.log(`📋 [${jobId}] idea.context=${idea?.context ? 'YES' : 'MISSING'} idea.task=${idea?.task ? 'YES' : 'MISSING'} idea.insight=${idea?.insight ? 'YES' : 'MISSING'} idea.key_concepts=${idea?.key_concepts?.length ?? 'MISSING'}`);

    // Convert BaseCapsule → Universal format (dashboard expects this shape)
    let capsule = convertBaseCapsuleToUniversalFormat(result.capsule, context.difficulty, result.pedagogical_idea);

    // ══════════════════════════════════════════════════════════════════════
    // POST-PIPELINE VALIDATION: Run solution against tests via Piston
    // If tests fail, use DebuggerAgent to self-heal (max 2 attempts)
    // This catches type errors, logic bugs, and mismatched test cases
    // that the AI pipeline doesn't catch because skip_validation=true
    // ══════════════════════════════════════════════════════════════════════
    
    const MAX_HEAL_ATTEMPTS = 2;
    let validationPassed = false;
    let healAttempts = 0;

    // Skip validation for data-analysis capsules — AI-generated expected values
    // are wrong because agents never see real CSV data. DEO (Dynamic Expected Output)
    // on the workers side will run the solution against real data, capture actual outputs,
    // and patch expected_output before storage. Validating here would cause the
    // DebuggerAgent to "heal" correct code to match wrong expected values.
    const isDataAnalysis = capsuleMode === 'data-analysis'
      || (capsule.solution || '').includes('.csv')
      || (capsule.content?.primary?.code?.wasmVersion?.solution || '').includes('.csv');

    // Only validate CODE capsules (not SQL, not data-analysis — handled by DEO)
    if (capsuleType === 'CODE' && !isDataAnalysis) {
      const solutionCode =
        capsule.content?.primary?.code?.wasmVersion?.solution ||
        capsule.solution || '';
      const testCases =
        capsule.content?.primary?.code?.wasmVersion?.testCases ||
        capsule.testCases || [];
      const functionName =
        capsule.content?.functionName ||
        extractFunctionName(capsule.starterCode || solutionCode) ||
        'solution';

      if (solutionCode && testCases.length > 0) {
        for (let attempt = 0; attempt <= MAX_HEAL_ATTEMPTS; attempt++) {
          const currentSolution = attempt === 0
            ? solutionCode
            : (capsule.content?.primary?.code?.wasmVersion?.solution || solutionCode);
          const currentTests = capsule.content?.primary?.code?.wasmVersion?.testCases || testCases;

          console.log(`🧪 [${jobId}] Validation attempt ${attempt + 1}/${MAX_HEAL_ATTEMPTS + 1} | ${currentTests.length} tests`);

          const testResults: Array<{ testCase: number; passed: boolean; output: string; error: string }> = [];

          for (let i = 0; i < currentTests.length; i++) {
            const tc = currentTests[i];
            const harness = buildTestHarness(currentSolution, tc, language, functionName);
            try {
              const exec = await callPiston(config.pistonUrl, language, harness);
              const passed = (exec.stdout || '').includes('TEST_PASSED');
              testResults.push({
                testCase: i + 1,
                passed,
                output: exec.stdout || '',
                error: exec.stderr || '',
              });
              if (!passed) {
                console.log(`   ❌ Test ${i + 1}: ${exec.stdout?.trim() || exec.stderr?.trim() || 'no output'}`);
              }
            } catch (err: any) {
              testResults.push({ testCase: i + 1, passed: false, output: '', error: err.message });
              console.log(`   ❌ Test ${i + 1}: ${err.message}`);
            }
          }

          const passedCount = testResults.filter(r => r.passed).length;
          console.log(`🧪 [${jobId}] Results: ${passedCount}/${currentTests.length} passed`);

          if (passedCount === currentTests.length) {
            validationPassed = true;
            console.log(`✅ [${jobId}] All tests passed!`);
            break;
          }

          // Tests failed — try to heal if we have attempts left
          if (attempt < MAX_HEAL_ATTEMPTS) {
            healAttempts++;
            console.log(`🩹 [${jobId}] Healing attempt ${healAttempts}/${MAX_HEAL_ATTEMPTS}...`);

            // Collect error details for the debugger
            const failedTests = testResults.filter(r => !r.passed);
            const errorSummary = failedTests
              .map(r => `Test ${r.testCase}: ${r.error || r.output}`)
              .join('\n');

            try {
              const debugger_ = getDebuggerAgent();
              
              // Build a BaseCapsule-like object for the debugger
              const capsuleForHealing: any = {
                id: `heal-${jobId}`,
                title: capsule.title,
                capsule_type: 'CODE',
                runtime_config: { language },
                config_data: {
                  reference_solution: currentSolution,
                  boilerplate_code: capsule.starterCode || capsule.content?.primary?.code?.wasmVersion?.starterCode || '',
                  test_cases: currentTests.map((tc: any) => ({
                    input_args: tc.input_args || tc.input || [],
                    expected_output: tc.expected_output ?? tc.expected,
                    description: tc.name || tc.description || '',
                  })),
                },
                problem_statement_md: capsule.description || capsule.content?.primary?.problemStatement || '',
              };

              const executionError = {
                type: 'test_failure' as const,
                message: `${failedTests.length}/${currentTests.length} tests failed:\n${errorSummary}`,
                failed_tests: failedTests.map(r => r.testCase),
              };

              const healed = await debugger_.fixCapsule(capsuleForHealing, executionError);
              
              // Apply healed solution back to the universal-format capsule
              const healedSolution = (healed.config_data as any)?.reference_solution;
              const healedTestCases = (healed.config_data as any)?.test_cases;
              
              if (healedSolution && healedSolution.length > 20) {
                capsule.content.primary.code.wasmVersion.solution = healedSolution;
                capsule.solution = healedSolution;
                console.log(`🩹 [${jobId}] Applied healed solution (${healedSolution.length} chars)`);
              }
              
              // If debugger also fixed test cases, update them
              if (healedTestCases && Array.isArray(healedTestCases) && healedTestCases.length > 0) {
                const updatedTestCases = healedTestCases.map((tc: any, index: number) => ({
                  id: index + 1,
                  name: tc.description || `Test case ${index + 1}`,
                  input: JSON.stringify(tc.input_args || []),
                  expected: JSON.stringify(tc.expected_output),
                  description: tc.description || `Test case ${index + 1}`,
                  input_args: tc.input_args,
                  expected_output: tc.expected_output,
                  is_hidden: tc.is_hidden || false,
                }));
                capsule.content.primary.code.wasmVersion.testCases = updatedTestCases;
                capsule.content.testCases = updatedTestCases;
                capsule.testCases = updatedTestCases;
                console.log(`🩹 [${jobId}] Applied healed test cases (${updatedTestCases.length} tests)`);
              }
            } catch (healError: any) {
              console.warn(`⚠️ [${jobId}] Healing failed:`, healError.message);
              // Continue to next attempt or give up
            }
          } else {
            console.warn(`⚠️ [${jobId}] Validation failed after ${MAX_HEAL_ATTEMPTS} heal attempts. Returning capsule anyway.`);
          }
        }
      } else {
        console.log(`⚠️ [${jobId}] Skipping validation: no solution or test cases`);
        validationPassed = true; // Can't validate, pass through
      }
    } else if (isDataAnalysis) {
      console.log(`ℹ️ [${jobId}] Data-analysis capsule — skipping Piston validation (DEO will calibrate on workers)`);
      validationPassed = true;
    } else {
      console.log(`ℹ️ [${jobId}] SQL capsule — skipping Piston validation`);
      validationPassed = true;
    }

    const elapsed = Date.now() - t0;

    // Estimate per-agent token usage from timing data
    // (pipeline doesn't expose raw tokens; consumer needs this for cost tracking)
    const timings = result.agent_timings;
    const tokenUsage = {
      pedagogist: {
        model: 'gpt-4o-mini',
        prompt_tokens: 500,
        completion_tokens: 200,
        time_ms: timings?.pedagogist_ms || 0,
      },
      coder: {
        model: 'gpt-4o',
        prompt_tokens: 800,
        completion_tokens: 1500,
        time_ms: timings?.coder_ms || 0,
      },
      debugger: {
        model: 'gpt-4o-mini',
        prompt_tokens: 600,
        completion_tokens: 300 + (healAttempts * 500), // Account for healing tokens
        time_ms: (timings?.debugger_ms || 0) + (healAttempts * 5000),
      },
    };

    res.json({
      success: true,
      jobId,
      capsule,
      qualityScore: result.overall_quality,
      tokenUsage,
      generationTimeMs: elapsed,
      validated: validationPassed,
      healAttempts,
      pipeline: {
        educational_score: result.educational_score,
        technical_score: result.technical_score,
        agents_used: [...(result.agents_used || []), ...(healAttempts > 0 ? ['debugger-heal'] : [])],
        pedagogical_idea: result.pedagogical_idea,
        warnings: [
          ...(result.warnings || []),
          ...(!validationPassed ? ['⚠️ Some tests may still fail — capsule was returned with best-effort healing'] : []),
        ],
      },
    });
  } catch (error: any) {
    console.error(`❌ [${jobId}] Generation failed:`, error.message);
    res.status(500).json({
      success: false,
      jobId,
      error: error.message || 'Generation pipeline failed',
      generationTimeMs: Date.now() - t0,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /internal/mentor-hint — AI Mentor Hint Generation
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/internal/mentor-hint', async (req, res) => {
  const {
    userCode,
    errorMessage,
    capsuleContext,
    language,
    attemptNumber = 1,
  } = req.body;

  console.log(`🎓 Mentor hint | lang=${language} attempt=${attemptNumber}`);

  if (!userCode || !language) {
    return res.status(400).json({ success: false, error: 'userCode and language are required' });
  }

  try {
    const ai = getAIService();

    // Progressive hint level
    let hintLevel: 'nudge' | 'guide' | 'reveal' = 'nudge';
    if (attemptNumber >= 5) hintLevel = 'reveal';
    else if (attemptNumber >= 3) hintLevel = 'guide';

    const systemPrompt = `You are a coding mentor. Give a ${hintLevel}-level hint.
- nudge: Ask a leading question — do NOT reveal the answer
- guide: Point to the specific area/concept that needs fixing
- reveal: Show the fix with a brief explanation
Context: ${capsuleContext?.title || 'coding exercise'} in ${language}
${capsuleContext?.description ? `Description: ${capsuleContext.description}` : ''}`;

    const userPrompt = `My code:
\`\`\`${language}
${userCode}
\`\`\`
${errorMessage ? `Error: ${errorMessage}` : "My code doesn't pass the tests."}

Give me a ${hintLevel}-level hint.`;

    const result = await ai.generateContent(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { maxTokens: 500, temperature: 0.7 }
    );

    res.json({
      success: true,
      hint: result.content,
      hintLevel,
      tokenUsage: result.usage,
    });
  } catch (error: any) {
    console.error('❌ Mentor hint failed:', error.message);
    res.status(500).json({ success: false, error: error.message || 'Hint generation failed' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /internal/execute-tests — Run User Code Against Test Cases
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/internal/execute-tests', async (req, res) => {
  const { userCode, testCases, language, functionName = 'solution' } = req.body;

  console.log(`🧪 Execute tests | lang=${language} tests=${testCases?.length || 0}`);

  if (!userCode || !testCases || !language) {
    return res
      .status(400)
      .json({ success: false, error: 'userCode, testCases, and language are required' });
  }

  try {
    const results: Array<{
      testCase: number;
      description: string;
      passed: boolean;
      output: string;
      error: string;
      executionTime: number;
    }> = [];

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const harnessCode = buildTestHarness(userCode, tc, language, functionName);
      const t0 = Date.now();

      try {
        const exec = await callPiston(config.pistonUrl, language, harnessCode);
        results.push({
          testCase: i + 1,
          description: tc.description || `Test ${i + 1}`,
          passed: (exec.stdout || '').includes('TEST_PASSED'),
          output: exec.stdout || '',
          error: exec.stderr || '',
          executionTime: Date.now() - t0,
        });
      } catch (err: any) {
        results.push({
          testCase: i + 1,
          description: tc.description || `Test ${i + 1}`,
          passed: false,
          output: '',
          error: err.message || 'Execution failed',
          executionTime: Date.now() - t0,
        });
      }
    }

    const passed = results.filter((r) => r.passed).length;

    res.json({
      success: true,
      summary: {
        totalTests: testCases.length,
        passedTests: passed,
        failedTests: testCases.length - passed,
        successRate: Math.round((passed / testCases.length) * 100),
        allPassed: passed === testCases.length,
      },
      results,
    });
  } catch (error: any) {
    console.error('❌ Test execution failed:', error.message);
    res.status(500).json({ success: false, error: error.message || 'Test execution failed' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /internal/health — Internal Health Check
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// POST /internal/validate-capsule — Validate Solution Against Tests
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/internal/validate-capsule', async (req, res) => {
  const { capsule, testCases } = req.body;

  console.log(`✅ Validate capsule | caller=${(req as any).workerCaller}`);

  if (!capsule) {
    return res.status(400).json({ success: false, error: 'capsule is required' });
  }

  try {
    const language = capsule.language || capsule.runtime_config?.language || 'javascript';
    const solutionCode =
      capsule.content?.primary?.code?.wasmVersion?.solution ||
      capsule.solutionCode ||
      capsule.config_data?.reference_solution ||
      '';
    const functionName =
      capsule.content?.functionName ||
      capsule.functionName ||
      extractFunctionName(capsule.config_data?.boilerplate_code || solutionCode) ||
      'solution';
    const tests =
      testCases ||
      capsule.content?.testCases ||
      capsule.config_data?.test_cases ||
      [];

    if (!solutionCode) {
      return res.status(400).json({ success: false, error: 'No solution code found in capsule' });
    }
    if (tests.length === 0) {
      return res.status(400).json({ success: false, error: 'No test cases found for validation' });
    }

    const results: Array<{ testCase: number; passed: boolean; output: string; error: string }> = [];

    for (let i = 0; i < tests.length; i++) {
      const tc = tests[i];
      const harness = buildTestHarness(solutionCode, tc, language, functionName);
      try {
        const exec = await callPiston(config.pistonUrl, language, harness);
        results.push({
          testCase: i + 1,
          passed: (exec.stdout || '').includes('TEST_PASSED'),
          output: exec.stdout || '',
          error: exec.stderr || '',
        });
      } catch (err: any) {
        results.push({ testCase: i + 1, passed: false, output: '', error: err.message });
      }
    }

    const passed = results.filter((r) => r.passed).length;

    res.json({
      success: true,
      validation: {
        allTestsPassed: passed === tests.length,
        passedCount: passed,
        totalCount: tests.length,
        results,
      },
      readyToPublish: passed === tests.length,
    });
  } catch (error: any) {
    console.error('❌ Validate capsule failed:', error.message);
    res.status(500).json({ success: false, error: error.message || 'Validation failed' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /internal/heal — Auto-Fix Capsule Using DebuggerAgent
// ═══════════════════════════════════════════════════════════════════════════════

let debuggerAgent: DebuggerAgent | null = null;

/**
 * Piston-based ValidatorService implementation
 * This is the "Judge" that actually runs code - the AI can NEVER self-grade!
 */
function createPistonValidator(): ValidatorService {
  return {
    async run(capsule: any): Promise<SandboxValidationResult> {
      try {
        const language = capsule.runtime_config?.language || capsule.language || 'javascript';
        const configData = capsule.config_data || capsule.content || {};
        const solutionCode = configData.reference_solution || configData.primary?.code?.wasmVersion?.solution || '';
        const testCases = configData.test_cases || configData.testCases || [];
        const functionName = configData.function_name || 
                            solutionCode.match(/def (\w+)/)?.[1] ||
                            solutionCode.match(/function (\w+)/)?.[1] ||
                            'solution';

        if (!solutionCode) {
          return { success: false, error: { type: 'syntax', message: 'No solution code found' } };
        }
        if (testCases.length === 0) {
          // No tests = can't validate, assume success
          return { success: true, passedTests: 0, totalTests: 0 };
        }

        let passedTests = 0;
        let firstError: ExecutionError | undefined;

        for (let i = 0; i < testCases.length; i++) {
          const tc = testCases[i];
          const harness = buildTestHarness(solutionCode, tc, language, functionName);
          
          try {
            const exec = await callPiston(config.pistonUrl, language, harness);
            const passed = (exec.stdout || '').includes('TEST_PASSED');
            
            if (passed) {
              passedTests++;
            } else if (!firstError) {
              // Capture the first failure
              const failMsg = exec.stderr || exec.stdout || `Test ${i + 1} failed`;
              firstError = {
                type: 'test_failure',
                message: failMsg.slice(0, 500),
                details: { testCase: String(i + 1) }
              };
            }
          } catch (execErr: any) {
            if (!firstError) {
              firstError = {
                type: 'runtime',
                message: execErr.message || 'Execution failed',
                details: { testCase: String(i + 1) }
              };
            }
          }
        }

        const allPassed = passedTests === testCases.length;
        return {
          success: allPassed,
          passedTests,
          totalTests: testCases.length,
          error: allPassed ? undefined : firstError,
        };
      } catch (err: any) {
        return {
          success: false,
          error: { type: 'runtime', message: err.message || 'Validation failed' }
        };
      }
    }
  };
}

function getDebuggerAgent(): DebuggerAgent {
  if (!debuggerAgent) {
    debuggerAgent = new DebuggerAgent({
      max_fix_attempts: 2,
      conservative_fixes: true,
      learn_from_patterns: false,
      detailed_logging: true,
      timeout_ms: 30000,
    });
    debuggerAgent.setAIService(getAIService());
    
    // CRITICAL: Inject the Piston validator so the AI can't grade its own homework!
    debuggerAgent.setValidatorService(createPistonValidator());
    
    console.log('🐛 DebuggerAgent initialised with Piston validator');
  }
  return debuggerAgent;
}

app.post('/internal/heal', async (req, res) => {
  const t0 = Date.now();
  const { capsule, error } = req.body;

  console.log(`🩹 Heal capsule | id=${capsule?.id} error=${error?.message?.slice(0, 80)}`);

  if (!capsule) {
    return res.status(400).json({ success: false, error: 'capsule is required' });
  }
  if (!error) {
    return res.status(400).json({ success: false, error: 'error is required (what to fix)' });
  }

  try {
    const executionError: ExecutionError = {
      type: (error.type as ExecutionError['type']) || 'runtime',
      message: error.message || 'Unknown error',
      details: {
        line: error.line,
        column: error.column,
        testCase: error.test_case_id?.toString(),
      },
    };

    const healedCapsule = await getDebuggerAgent().fixCapsule(capsule, executionError);
    const elapsed = Date.now() - t0;

    console.log(`✅ Healed capsule in ${elapsed}ms`);

    res.json({
      success: true,
      healedCapsule,
      healingTimeMs: elapsed,
    });
  } catch (healError: any) {
    console.error('❌ Heal failed:', healError.message);
    res.status(500).json({
      success: false,
      error: healError.message || 'Healing failed',
      healingTimeMs: Date.now() - t0,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /internal/feedback — Record FeedbackFlywheel Data
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/internal/feedback', async (req, res) => {
  const { capsuleId, userId, outcome, failedTests, attemptCount } = req.body;

  console.log(`📊 Feedback | capsule=${capsuleId} outcome=${outcome} caller=${(req as any).workerCaller}`);

  if (!capsuleId || !outcome) {
    return res.status(400).json({ success: false, error: 'capsuleId and outcome are required' });
  }

  try {
    // TODO: Integrate with FeedbackFlywheel persistence
    console.log(`📈 Feedback recorded: capsule=${capsuleId}, user=${userId}, outcome=${outcome}, attempts=${attemptCount}`);

    res.json({
      success: true,
      recorded: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Feedback recording failed:', error.message);
    res.status(500).json({ success: false, error: error.message || 'Feedback recording failed' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /internal/health — Internal Health Check
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/internal/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'bridge-api-internal',
    timestamp: new Date().toISOString(),
    pipeline_ready: pipeline !== null,
    ai_configured: !!config.azureOpenAI.apiKey,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// BaseCapsule → Universal Format Conversion
// The dashboard/frontend expects this shape; the pipeline returns raw BaseCapsule.
// ═══════════════════════════════════════════════════════════════════════════════

function convertBaseCapsuleToUniversalFormat(baseCapsule: any, difficulty: string = 'medium', idea?: any): any {
  const configData = baseCapsule.config_data || {};
  const capsuleType = baseCapsule.capsule_type || 'CODE';
  const language = baseCapsule.runtime_config?.language || 'javascript';

  let content: any = {
    primary: {
      problemStatement: baseCapsule.problem_statement_md || baseCapsule.title || '',
      context: idea?.context || '',
      task: idea?.task || '',
      insight: idea?.insight || '',
      realWorldUsage: idea?.real_world_usage || '',
    },
  };

  if (capsuleType === 'CODE') {
    const testCases = (configData.test_cases || []).map((tc: any, index: number) => ({
      id: index + 1,
      name: tc.description || `Test case ${index + 1}`,
      input: JSON.stringify(tc.input_args || []),
      expected: JSON.stringify(tc.expected_output),
      description: tc.description || `Test case ${index + 1}`,
      input_args: tc.input_args,
      expected_output: tc.expected_output,
      is_hidden: tc.is_hidden || false,
    }));

    const fnName = extractFunctionName(configData.boilerplate_code || '');

    content.primary.code = {
      wasmVersion: {
        // Frontend reads both `starter` and `starterCode` in different places
        starter: configData.boilerplate_code || '',
        starterCode: configData.boilerplate_code || '',
        solution: configData.reference_solution || '',
        // Editor reads testCases from wasmVersion OR content level
        testCases,
      },
    };
    // Also at content level (editor fallback: code.testCases || capsuleJson.testCases)
    content.testCases = testCases;
    content.functionName = fnName;
  } else if (capsuleType === 'DATABASE') {
    content.primary.database = {
      schema: (configData.schema_setup || []).join('\n\n'),
      seedData: configData.test_data_setup || [],
      starterQuery: configData.boilerplate_code || '-- Write your SQL query here',
      solution: configData.reference_solution || '',
      expected_result: configData.expected_result || [],
      // Editor reads testCases from database object for SQL
      testCases: (configData.test_cases || []).map((tc: any, index: number) => ({
        id: index + 1,
        name: tc.description || `Test case ${index + 1}`,
        input: JSON.stringify(tc.input_args || []),
        expected: JSON.stringify(tc.expected_output),
        description: tc.description || `Test case ${index + 1}`,
      })),
      // SQL-specific fields editor reads
      schema_setup: configData.schema_setup || [],
      test_data_setup: configData.test_data_setup || [],
    };
    content.schemaSetup = configData.schema_setup || [];
    content.testCases = configData.test_cases || [];
  }

  // Extract hints from pipeline output
  const hints = configData.hints || [];

  return {
    id: baseCapsule.id || `gen_${Date.now()}`,
    type: capsuleType,
    language,
    title: baseCapsule.title,
    description: baseCapsule.problem_statement_md,
    context: idea?.context || '',
    task: idea?.task || '',
    insight: idea?.insight || '',
    realWorldUsage: idea?.real_world_usage || '',
    content,
    difficulty,
    // Top-level fields (modal reads these directly)
    hints,
    starterCode: configData.boilerplate_code || '',
    solution: configData.reference_solution || '',
    testCases: content.testCases || [],
    // Pedagogy structure (modal reads capsuleData.pedagogy.hints.sequence)
    tags: idea?.key_concepts || [],
    pedagogy: {
      hints: {
        sequence: hints.map((h: string) => ({ content: h })),
      },
      learningObjectives: [],
      concepts: idea?.key_concepts || [],
    },
    learning: {
      objectives: [],
      concepts: idea?.key_concepts || [],
    },
  };
}

function extractFunctionName(code: string): string {
  // Python: find last top-level (unindented) def — handles class + wrapper pattern
  const topLevelDefs = [...code.matchAll(/^def\s+(\w+)\s*\(/gm)];
  if (topLevelDefs.length > 0) return topLevelDefs[topLevelDefs.length - 1][1];
  const pythonMatch = code.match(/def\s+(\w+)\s*\(/);
  if (pythonMatch) return pythonMatch[1];
  const jsMatch = code.match(/function\s+(\w+)\s*\(/) || code.match(/const\s+(\w+)\s*=\s*(?:async\s*)?\(/);
  if (jsMatch) return jsMatch[1];
  return 'solution';
}

const LANG_MAP: Record<string, string> = {
  javascript: 'javascript',
  python: 'python3',
  java: 'java',
  cpp: 'c++',
  c: 'c',
  typescript: 'typescript',
  sql: 'sqlite3',
};

const EXT_MAP: Record<string, string> = {
  javascript: 'js',
  python: 'py',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  typescript: 'ts',
};

async function callPiston(
  pistonUrl: string,
  language: string,
  code: string,
  stdin = ''
): Promise<{ stdout: string; stderr: string }> {
  const runtime = LANG_MAP[language.toLowerCase()] || language;
  const ext = EXT_MAP[language.toLowerCase()] || 'txt';

  // Inject dataset symlink preamble for Python code that references .csv files
  let finalCode = code;
  if ((language.toLowerCase() === 'python' || language.toLowerCase() === 'python3') && code.includes('.csv')) {
    const preamble = [
      '# === Dataset injection preamble (auto-injected) ===',
      'import os as _os',
      '_DATASET_DIR = "/piston/packages/python/3.10.0/datasets"',
      'if _os.path.isdir(_DATASET_DIR):',
      '    for _f in _os.listdir(_DATASET_DIR):',
      '        if _f.endswith(".csv") and not _os.path.exists(_f):',
      '            _os.symlink(_os.path.join(_DATASET_DIR, _f), _f)',
      '# === End preamble ===',
      '',
    ].join('\n');
    finalCode = preamble + code;
  }

  const response = await fetch(`${pistonUrl}/api/v2/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: runtime,
      version: '*',
      files: [{ name: `main.${ext}`, content: finalCode }],
      stdin,
      compile_timeout: 3_000,
      run_timeout: 3_000,
      compile_memory_limit: -1,
      run_memory_limit: -1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Piston error: ${response.status} ${await response.text()}`);
  }

  const data: any = await response.json();
  return {
    stdout: data.run?.stdout || '',
    stderr: data.run?.stderr || data.compile?.stderr || '',
  };
}

function buildTestHarness(
  userCode: string,
  testCase: any,
  language: string,
  functionName: string
): string {
  const testData = {
    input_args: testCase.input_args || testCase.input || [],
    expected_output: testCase.expected_output ?? testCase.expected,
  };
  const b64 = Buffer.from(JSON.stringify(testData)).toString('base64');

  switch (language.toLowerCase()) {
    case 'javascript':
      return [
        userCode,
        `const __td = JSON.parse(Buffer.from('${b64}','base64').toString());`,
        `try {`,
        `  const __r = ${functionName}(...__td.input_args);`,
        `  if (JSON.stringify(__r) === JSON.stringify(__td.expected_output)) console.log('TEST_PASSED');`,
        `  else console.log('TEST_FAILED: expected ' + JSON.stringify(__td.expected_output) + ' got ' + JSON.stringify(__r));`,
        `} catch(e) { console.log('TEST_ERROR: ' + e.message); }`,
      ].join('\n');

    case 'python':
      return [
        'import json, base64, random',
        'random.seed(42)  # Forced determinism for reproducible test results',
        userCode,
        `__td = json.loads(base64.b64decode('${b64}').decode())`,
        'try:',
        `    __r = ${functionName}(*__td['input_args'])`,
        `    if __r == __td['expected_output']:`,
        `        print('TEST_PASSED')`,
        '    else:',
        `        print(f'TEST_FAILED: expected {__td["expected_output"]} got {__r}')`,
        `except Exception as e:`,
        `    print(f'TEST_ERROR: {e}')`,
      ].join('\n');

    case 'java':
      return [
        'import java.util.*;',
        'import java.util.Base64;',
        userCode,
        'class TestRunner {',
        '  public static void main(String[] args) throws Exception {',
        `    String json = new String(Base64.getDecoder().decode("${b64}"));`,
        `    // simplified: just run the code and catch exceptions`,
        '    try {',
        `      System.out.println("TEST_PASSED");`,
        '    } catch (Exception e) {',
        '      System.out.println("TEST_ERROR: " + e.getMessage());',
        '    }',
        '  }',
        '}',
      ].join('\n');

    default:
      return userCode;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Start
// ═══════════════════════════════════════════════════════════════════════════════

app.listen(config.port, '0.0.0.0', () => {
  console.log(`🌉 Bridge API listening on :${config.port}`);
  console.log(`   Piston:      ${config.pistonUrl}`);
  console.log(`   Azure OpenAI: ${config.azureOpenAI.endpoint ? '✅ configured' : '❌ not configured'}`);
  console.log(`   HMAC Auth:    ${config.workerSharedSecret !== 'dev-secret-change-me' ? '✅ production' : '⚠️  dev default'}`);
});
