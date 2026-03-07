// Test Piston payload size limits
// Run inside bridge container: node /tmp/test-piston-limits.js

const PISTON_URL = 'http://piston:2000';

async function testSize(charCount) {
  // Generate Python code with a large string variable (simulates big test harness)
  const padding = 'x'.repeat(charCount);
  const code = `data = "${padding}"\nprint(len(data))`;

  try {
    const resp = await fetch(`${PISTON_URL}/api/v2/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'python',
        version: '3.10.0',
        files: [{ name: 'main.py', content: code }],
        run_timeout: 3000,
        compile_memory_limit: -1,
        run_memory_limit: -1,
      }),
    });

    const data = await resp.json();
    const stdout = data.run?.stdout?.trim() || '';
    const stderr = data.run?.stderr?.trim() || '';
    const signal = data.run?.signal;
    const code_ = data.run?.code;
    const memory = data.run?.memory;

    const ok = code_ === 0 && stdout === String(charCount);
    console.log(
      `${charCount.toLocaleString().padStart(10)} chars | ` +
      `${ok ? 'OK' : 'FAIL'} | ` +
      `exit=${code_} signal=${signal} mem=${memory} | ` +
      `stdout="${stdout.slice(0,50)}" stderr="${stderr.slice(0,80)}"`
    );
    return ok;
  } catch (err) {
    console.log(
      `${charCount.toLocaleString().padStart(10)} chars | ` +
      `ERROR: ${err.message}`
    );
    return false;
  }
}

async function main() {
  console.log('=== Piston Payload Size Limit Test ===\n');

  // Test increasing sizes: 1KB, 5KB, 10KB, 25KB, 50KB, 75KB, 100KB, 150KB, 200KB, 500KB
  const sizes = [1000, 5000, 10000, 25000, 50000, 75000, 100000, 150000, 200000, 500000];

  for (const size of sizes) {
    const ok = await testSize(size);
    if (!ok) {
      // Found the boundary — test more granularly
      const prevSize = sizes[sizes.indexOf(size) - 1] || 0;
      console.log(`\n--- Narrowing between ${prevSize} and ${size} ---`);
      const step = Math.floor((size - prevSize) / 5);
      for (let s = prevSize + step; s < size; s += step) {
        await testSize(s);
      }
      break;
    }
  }

  // Also test with realistic batched test harness (base64 encoded data)
  console.log('\n=== Realistic Test Harness Size Test ===\n');
  
  const sampleCode = `
def create_task(task_id, title, is_urgent=False):
    return {
        "id": task_id,
        "title": title,
        "status": "Pending",
        "is_urgent": is_urgent
    }
`;

  const testCases = [
    { input_args: [1, "Buy groceries", false], expected_output: { id: 1, title: "Buy groceries", status: "Pending", is_urgent: false } },
    { input_args: [2, "Fix bug #42", true], expected_output: { id: 2, title: "Fix bug #42", status: "Pending", is_urgent: true } },
    { input_args: [3, "Read documentation on advanced Python patterns and best practices for software engineering", false], expected_output: { id: 3, title: "Read documentation on advanced Python patterns and best practices for software engineering", status: "Pending", is_urgent: false } },
    { input_args: [4, "Submit quarterly report to management team", true], expected_output: { id: 4, title: "Submit quarterly report to management team", status: "Pending", is_urgent: true } },
  ];

  const b64 = Buffer.from(JSON.stringify(testCases)).toString('base64');

  const harness = `
import json, base64, random
random.seed(42)

${sampleCode}

__td = json.loads(base64.b64decode('${b64}').decode())
results = []
for i, tc in enumerate(__td):
    try:
        r = create_task(*tc['input_args'])
        passed = r == tc['expected_output']
        results.append({"id": i+1, "passed": passed, "output": str(r)[:200], "expected": str(tc['expected_output'])[:200]})
    except Exception as e:
        results.append({"id": i+1, "passed": False, "error": str(e)})

print("---JSON_START---")
print(json.dumps({"results": results}))
`;

  console.log(`Harness size: ${harness.length} chars`);
  console.log(`Base64 test data size: ${b64.length} chars`);

  const resp = await fetch(`${PISTON_URL}/api/v2/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: 'python',
      version: '3.10.0',
      files: [{ name: 'main.py', content: harness }],
      run_timeout: 3000,
      compile_memory_limit: -1,
      run_memory_limit: -1,
    }),
  });

  const result = await resp.json();
  console.log('Result:', JSON.stringify(result.run, null, 2));
}

main().catch(console.error);
