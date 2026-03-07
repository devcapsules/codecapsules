// Test Piston payload size limits
// Usage: node test-piston-limit.js (run inside bridge container)

const PISTON_URL = 'http://piston:2000';

async function callPiston(code, lang = 'python') {
  const resp = await fetch(`${PISTON_URL}/api/v2/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: lang,
      version: '*',
      files: [{ name: 'main.py', content: code }],
      run_timeout: 3000,
      compile_memory_limit: -1,
      run_memory_limit: -1,
    }),
  });
  return resp.json();
}

// The actual failing test cases from the user
const testCases = [
  {
    id: 1,
    input_args: [[{"assignee":"Alice","task":"Task 1"},{"assignee":"Bob","task":"Task 2"},{"assignee":"Alice","task":"Task 3"}]],
    expected_output: {"Alice":[{"assignee":"Alice","task":"Task 1"},{"assignee":"Alice","task":"Task 3"}],"Bob":[{"assignee":"Bob","task":"Task 2"}]},
    description: "Basic test with two assignees",
    type: "unknown"
  },
  {
    id: 2,
    input_args: [[{"assignee":"Charlie","task":"Task A"},{"assignee":"Charlie","task":"Task B"}]],
    expected_output: {"Charlie":[{"assignee":"Charlie","task":"Task A"},{"assignee":"Charlie","task":"Task B"}]},
    description: "Test with single assignee",
    type: "unknown"
  },
  {
    id: 3,
    input_args: [[]],
    expected_output: {},
    description: "Edge case with empty task list",
    type: "unknown"
  },
  {
    id: 4,
    input_args: [[{"assignee":"Alice","task":"Task 1"},{"assignee":"Alice","task":"Task 2"},{"assignee":"Bob","task":"Task 3"},{"assignee":"Alice","task":"Task 4"},{"assignee":"Bob","task":"Task 5"}]],
    expected_output: {"Alice":[{"assignee":"Alice","task":"Task 1"},{"assignee":"Alice","task":"Task 2"},{"assignee":"Alice","task":"Task 4"}],"Bob":[{"assignee":"Bob","task":"Task 3"},{"assignee":"Bob","task":"Task 5"}]},
    description: "Edge case with multiple tasks",
    type: "unknown"
  }
];

const userCode = `def group_tasks_by_assignee(tasks):
    result = {}
    for task in tasks:
        assignee = task["assignee"]
        if assignee not in result:
            result[assignee] = []
        result[assignee].append(task)
    return result`;

function utf8ToBase64(str) {
  return Buffer.from(str).toString('base64');
}

async function test() {
  // Test 1: Full batched harness (all 4 tests)
  const testDataB64 = utf8ToBase64(JSON.stringify(testCases));
  const b64Len = testDataB64.length;
  const jsonLen = JSON.stringify(testCases).length;
  
  console.log(`\n=== PAYLOAD SIZES ===`);
  console.log(`JSON test data: ${jsonLen} chars`);
  console.log(`Base64 test data: ${b64Len} chars`);
  
  const fullHarness = `
import json, base64, random
random.seed(42)

${userCode}

_tests = json.loads(base64.b64decode("${testDataB64}").decode('utf-8'))
_results = []
for _t in _tests:
    _res = {"id": _t["id"], "passed": False, "actual": None, "error": None}
    try:
        _val = group_tasks_by_assignee(*_t["input_args"])
        if _val == _t["expected_output"]:
            _res["passed"] = True
        _res["actual"] = json.dumps(_val, default=str)
    except Exception as _e:
        _res["error"] = str(_e)
    _results.append(_res)
print("---JSON_START---")
print(json.dumps(_results))
`;

  console.log(`Full harness: ${fullHarness.length} chars`);
  
  // Test full harness
  console.log(`\n=== TEST: Full harness (all 4 tests) ===`);
  const r1 = await callPiston(fullHarness);
  console.log(`  signal: ${r1.run?.signal}`);
  console.log(`  code: ${r1.run?.code}`);
  console.log(`  stderr: ${(r1.run?.stderr || '').slice(0, 200)}`);
  console.log(`  stdout: ${(r1.run?.stdout || '').slice(0, 300)}`);
  console.log(`  memory: ${r1.run?.memory}`);
  if (r1.message) console.log(`  ERROR: ${r1.message}`);

  // Test individual test cases
  for (let i = 0; i < testCases.length; i++) {
    const singleB64 = utf8ToBase64(JSON.stringify([testCases[i]]));
    const singleHarness = `
import json, base64
${userCode}
_tests = json.loads(base64.b64decode("${singleB64}").decode('utf-8'))
for _t in _tests:
    _val = group_tasks_by_assignee(*_t["input_args"])
    print("RESULT:", json.dumps(_val))
    print("MATCH:", _val == _t["expected_output"])
`;
    console.log(`\n=== TEST: Single test ${i+1} (${singleHarness.length} chars) ===`);
    const r = await callPiston(singleHarness);
    console.log(`  signal: ${r.run?.signal}`);
    console.log(`  code: ${r.run?.code}`);
    console.log(`  stdout: ${(r.run?.stdout || '').slice(0, 200)}`);
    console.log(`  stderr: ${(r.run?.stderr || '').slice(0, 200)}`);
    if (r.message) console.log(`  ERROR: ${r.message}`);
  }

  // Test with progressively larger payloads
  console.log(`\n=== SIZE LIMIT TEST ===`);
  for (const multiplier of [1, 5, 10, 20, 50]) {
    // Create a large list of tasks
    const bigList = [];
    for (let i = 0; i < multiplier * 10; i++) {
      bigList.push({ assignee: `Person${i % 5}`, task: `Task ${i}` });
    }
    const bigTestCase = [{
      id: 1,
      input_args: [bigList],
      expected_output: {},
      description: "size test"
    }];
    const bigB64 = utf8ToBase64(JSON.stringify(bigTestCase));
    const bigHarness = `
import json, base64
${userCode}
_t = json.loads(base64.b64decode("${bigB64}").decode('utf-8'))[0]
_val = group_tasks_by_assignee(*_t["input_args"])
print("OK", len(_val))
`;
    console.log(`  ${multiplier}x (${bigList.length} tasks, harness=${bigHarness.length} chars, b64=${bigB64.length}):`);
    const r = await callPiston(bigHarness);
    console.log(`    signal=${r.run?.signal} code=${r.run?.code} stdout=${(r.run?.stdout||'').trim().slice(0,50)} mem=${r.run?.memory} ${r.message || ''}`);
  }
}

test().catch(console.error);
