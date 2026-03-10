# AI Engineering Capsules — Course Catalog

> 160 hands-on coding capsules across 6 courses. No external libraries. Pure code. Piston sandbox compatible.

---

## Course 1: JavaScript for AI & LLM Engineering (15 Capsules)

**Environment:** Pure JavaScript (Node.js / Piston)
**Constraints:** No external libraries. Build the logic from scratch.

---

### Module 1: Prompt & String Manipulation (The Input)

**Focus:** String methods, Regex basics, and Math.

#### Capsule 1: The Token Estimator
- **Difficulty:** Easy
- **Prompt:** Create a pure JavaScript lab. Write a function `estimateTokens(promptString)` that takes a string. A common LLM heuristic is that 1 word equals roughly 1.3 tokens. Split the string into words (by spaces), multiply by 1.3, and return the estimated token count rounded up to the nearest integer using `Math.ceil()`.

#### Capsule 2: The JSON Stripper
- **Difficulty:** Easy
- **Prompt:** Create a pure JavaScript lab. Write a function `cleanLLMResponse(responseText)` that takes a string. LLMs often wrap JSON in markdown (e.g., ` ```json { "key": "value" } ``` `). Use string replacement methods to remove the ` ```json ` and ` ``` ` markers, and use `.trim()` to return the clean JSON string.

#### Capsule 3: PII Redactor
- **Difficulty:** Medium
- **Prompt:** Create a pure JavaScript lab. Write a function `redactEmails(userInput)` that uses a Regular Expression to find any email addresses in the string and replaces them with `"[REDACTED]"`. Return the safe string.

#### Capsule 4: The System Prompt Injector
- **Difficulty:** Medium
- **Prompt:** Create a pure JavaScript lab. Write a function `injectVariables(template, variablesObj)` that takes a string like `"Summarize this article for a {audience}."` and an object like `{ audience: "5 year old" }`. Replace all bracketed variables in the template with their values from the object and return the final string.

---

### Module 2: Context Window Management (Arrays & State)

**Focus:** Array manipulation (slice, splice, push, shift) and Object shapes.

#### Capsule 5: Format Conversation History
- **Difficulty:** Easy
- **Prompt:** Create a pure JavaScript lab. Write a function `addMessage(historyArray, role, content)` where role is a string (`"user"` or `"assistant"`) and content is a string. Create a message object `{ role, content }`, push it to the history array, and return the updated array.

#### Capsule 6: Context Window Truncation
- **Difficulty:** Medium
- **Prompt:** Create a pure JavaScript lab. Write a function `enforceTokenLimit(historyArray, maxMessages)` that ensures the LLM doesn't run out of memory. If the array length exceeds `maxMessages`, remove the oldest messages from the beginning of the array (using `.slice()` or `.splice()`) but ALWAYS keep the very first message (which is usually the System Prompt). Return the truncated array.

#### Capsule 7: Extract Tool Calls
- **Difficulty:** Medium
- **Prompt:** Create a pure JavaScript lab. Write a function `getToolCalls(llmResponseObj)` that takes an object. Safely check if `llmResponseObj.choices[0].message.tool_calls` exists using Optional Chaining (`?.`). If it does, return the array of tool calls. If not, return an empty array `[]`.

#### Capsule 8: Calculate API Costs
- **Difficulty:** Medium
- **Prompt:** Create a pure JavaScript lab. Write a function `calculateCost(usageObj, pricingRates)` where `usageObj` has `{ prompt_tokens: 500, completion_tokens: 100 }` and `pricingRates` has `{ input_per_1k: 0.01, output_per_1k: 0.03 }`. Calculate the total cost in dollars and return it rounded to 4 decimal places.

---

### Module 3: RAG (Retrieval-Augmented Generation) Logic

**Focus:** Advanced iteration, sub-arrays, and math logic.

#### Capsule 9: The Document Chunker
- **Difficulty:** Hard
- **Prompt:** Create a pure JavaScript lab. Write a function `chunkText(documentString, maxChars)` that takes a long string. Split it into an array of smaller string chunks where no chunk exceeds `maxChars`. Crucial constraint: Do not split words in half; only split on spaces.

#### Capsule 10: Mock Vector Similarity (Dot Product)
- **Difficulty:** Hard
- **Prompt:** Create a pure JavaScript lab. Write a function `calculateSimilarity(vectorA, vectorB)` that takes two arrays of numbers (e.g., `[0.1, 0.5, -0.2]`). Calculate their dot product (multiply each corresponding element and sum the results). Return the final number. Throw an Error if the arrays are different lengths.

#### Capsule 11: Rank Search Results
- **Difficulty:** Hard
- **Prompt:** Create a pure JavaScript lab. Write a function `rankResults(documentsArray, queryVector)` where `documentsArray` contains objects `{ id: 1, text: "...", embedding: [0.1, 0.2] }`. Use your dot product logic to calculate a similarity score for each document against the `queryVector`. Return the array of documents sorted from highest score to lowest.

#### Capsule 12: Deduplicate Sources
- **Difficulty:** Medium
- **Prompt:** Create a pure JavaScript lab. Write a function `getUniqueSources(retrievedChunks)` that takes an array of objects. Extract the `sourceUrl` property from each, remove duplicates using a `Set`, and return an array of unique URLs.

---

### Module 4: Agentic Workflows (Complex Logic & Classes)

**Focus:** State machines, routing, and ES6 Classes.

#### Capsule 13: The Intent Router
- **Difficulty:** Medium
- **Prompt:** Create a pure JavaScript lab. Write a function `routeQuery(queryText)` that uses `.includes()` or Regex. If the text contains `"weather"` or `"temperature"`, return `"weather_tool"`. If it contains `"calculate"` or `"math"`, return `"calculator_tool"`. Otherwise, return `"general_chat"`.

#### Capsule 14: Fallback Retry Logic
- **Difficulty:** Hard
- **Prompt:** Create a pure JavaScript lab. Write a function `parseWithFallback(jsonString)` that attempts to use `JSON.parse()`. If it succeeds, return the object. If it throws a SyntaxError, catch the error, find the first `{` and the last `}` in the string, extract just that substring, and try parsing again. If it still fails, return `null`.

#### Capsule 15: The Capstone — SimpleAgent Class
- **Difficulty:** Hard
- **Prompt:** Create a pure JavaScript lab. Write an ES6 Class called `SimpleAgent`. The constructor should take a `systemPrompt`. Create an instance variable `this.memory = []` starting with the system prompt. Create a method `chat(userMessage)` that pushes the user message to memory, generates a mock assistant reply (e.g., `"I received: [userMessage]"`), pushes the reply to memory, and returns the reply.

---

## Course 2: Python for AI Engineering — Build an Agentic Pipeline (25 Capsules)

**Environment:** Pure Python 3 (Piston)
**Constraints:** No external libraries (pandas, numpy, etc.).

---

### Tier 1: Python Fundamentals for AI (The Building Blocks)

#### Capsule 1: System Prompt Formatter
- **Difficulty:** Easy
- **Topic Learned:** String formatting (f-strings).
- **Prompt:** Create a pure Python lab. Write a function `format_system_prompt(role, task)` that takes two strings. Return an f-string formatted exactly as: `"You are a {role}. Your task is to {task}."`

#### Capsule 2: Temperature Guardrail
- **Difficulty:** Easy
- **Topic Learned:** If/elif/else conditional logic.
- **Prompt:** Create a pure Python lab. Write a function `check_temperature(temp)` that takes a float. If `temp` is less than 0.0, return `"Too Deterministic"`. If greater than 1.0, return `"Too Random"`. Otherwise, return `"Optimal"`.

#### Capsule 3: Mock Token Estimator
- **Difficulty:** Easy
- **Topic Learned:** String length, basic integer division.
- **Prompt:** Create a pure Python lab. Write a function `estimate_tokens(text)` that takes a string. A common rough estimate is 1 token per 4 characters. Return the integer result of dividing the string's length by 4 (use integer division `//`).

#### Capsule 4: Chat History Manager
- **Difficulty:** Easy
- **Topic Learned:** List appending, list slicing (last N elements).
- **Prompt:** Create a pure Python lab. Write a function `update_chat(history, new_message)` where `history` is a list of dictionaries and `new_message` is a dictionary. Append `new_message` to `history`. Return only the last 3 messages from the updated list.

#### Capsule 5: Extract Model Config
- **Difficulty:** Easy
- **Topic Learned:** Dictionary `.get()` method, default values.
- **Prompt:** Create a pure Python lab. Write a function `get_model_setting(config, key)` where `config` is a dictionary. Return the value for the given key using `.get()`. If the key doesn't exist, return the default string `"Not Configured"`.

#### Capsule 6: Batch Prompt Cleaner
- **Difficulty:** Easy
- **Topic Learned:** for loops, string methods (`.strip()`, `.lower()`).
- **Prompt:** Create a pure Python lab. Write a function `clean_prompts(prompts_list)` that takes a list of strings. Loop through the list, remove leading/trailing whitespace, and convert each to lowercase. Return a new list of the cleaned strings.

#### Capsule 7: API Retry Backoff
- **Difficulty:** Medium
- **Topic Learned:** while loops, mathematical progression.
- **Prompt:** Create a pure Python lab. Write a function `simulate_backoff(max_retries)` that simulates exponential wait times. Start with a wait time of 1 second. Using a while loop, append the current wait time to a list, then double the wait time for the next iteration. Stop when the list has `max_retries` elements. Return the list.

#### Capsule 8: Rate Limit Handler
- **Difficulty:** Medium
- **Topic Learned:** try...except blocks, ZeroDivisionError.
- **Prompt:** Create a pure Python lab. Write a function `calculate_requests_per_second(total_requests, time_elapsed)`. Return `total_requests / time_elapsed`. Use a `try...except` block to catch `ZeroDivisionError` if `time_elapsed` is 0, and return `"Error: Time cannot be zero"`.

---

### Tier 2: Intermediate Python (Data Handling)

#### Capsule 9: Confidence Filter
- **Difficulty:** Medium
- **Topic Learned:** List comprehensions, conditional filtering.
- **Prompt:** Create a pure Python lab. Write a function `filter_high_confidence(scores, threshold)` where `scores` is a list of floats. Return a new list containing only the scores strictly greater than `threshold` using a single-line list comprehension.

#### Capsule 10: Model Cost Router
- **Difficulty:** Medium
- **Topic Learned:** Dictionary comprehensions, iteration over `.items()`.
- **Prompt:** Create a pure Python lab. Write a function `calculate_costs(model_tokens, price_per_token)` where `model_tokens` is a dict like `{"gpt-4": 1000, "claude": 1500}`. Return a new dict using dictionary comprehension where values are multiplied by `price_per_token`.

#### Capsule 11: Keyword Intersection
- **Difficulty:** Medium
- **Topic Learned:** Sets, type conversion, intersection (`&`).
- **Prompt:** Create a pure Python lab. Write a function `find_common_keywords(doc1_words, doc2_words)` that takes two lists of strings. Convert them to sets, find the intersecting words, and return them as a sorted list.

#### Capsule 12: Parse AI Response Tuple
- **Difficulty:** Medium
- **Topic Learned:** Tuples, multiple return values, `.split()`.
- **Prompt:** Create a pure Python lab. Write a function `parse_intent(response_text)` that takes a string like `"BOOK_FLIGHT||New York"`. Split the string by `"||"` and return a tuple `(intent, entity)`.

#### Capsule 13: Basic RAG Chunking
- **Difficulty:** Medium
- **Topic Learned:** String slicing, loop step parameters (`range(start, stop, step)`).
- **Prompt:** Create a pure Python lab. Write a function `chunk_text(text, chunk_size)` that slices a long string into a list of strings, each of length `chunk_size`. Use a for loop with `range()` and a step. Return the list of chunks.

#### Capsule 14: Prompt Template Extractor
- **Difficulty:** Hard
- **Topic Learned:** String parsing, indexing without regex.
- **Prompt:** Create a pure Python lab. Write a function `extract_variables(template)` that finds all variable names enclosed in curly braces `{}` within a string (e.g., `"Hello {name}, your {item} is ready"`). Return a list of extracted variables (e.g., `["name", "item"]`). Assume no nested braces.

#### Capsule 15: Rank Search Results
- **Difficulty:** Hard
- **Topic Learned:** `sorted()`, lambda functions, dictionary keys.
- **Prompt:** Create a pure Python lab. Write a function `rank_results(results)` where `results` is a list of dictionaries like `[{"id": 1, "score": 0.4}, {"id": 2, "score": 0.9}]`. Use `sorted()` with a lambda function to return the list sorted by `"score"` in descending order.

#### Capsule 16: Streaming Response Generator
- **Difficulty:** Hard
- **Topic Learned:** `yield` keyword, generator functions.
- **Prompt:** Create a pure Python lab. Write a generator function `stream_words(sentence)` that takes a string of words separated by spaces. Split the string and `yield` each word one by one instead of returning a list.

---

## Course 3: Supervising AI-Generated Code (30 Capsules)

**Environment:** Pure Python 3 (Piston)
**Constraints:** No external libraries. All capsules use pure stdlib. Progressive track — each module builds on the last.
**Theme:** Learn to review, fix, and supervise code that AI generates. By capsule 30, the learner has built a complete AI code supervision toolkit.

---

### Module A — Foundations: Read & Fix AI Code (Capsules 1–5)

#### Capsule 1: Off-by-One Fixer
- **Difficulty:** Easy
- **Function:** `fix_off_by_one(arr: list[int], index: int) -> int`
- **Prompt:** Create a pure Python lab. Write a function `fix_off_by_one(arr, index)` that safely returns the element at `index` from `arr`. AI-generated code often has off-by-one errors — if `index` is out of bounds (negative or >= length), return `-1` instead of crashing. Do NOT use try/except — use explicit bounds checking.

#### Capsule 2: Redundant Loop Detector
- **Difficulty:** Easy
- **Function:** `has_redundant_loop(code_lines: list[str]) -> bool`
- **Prompt:** Create a pure Python lab. Write a function `has_redundant_loop(code_lines)` that takes a list of code line strings. Return `True` if the code contains two consecutive `for` loops that iterate over the same variable (e.g., two lines starting with `"for x in"` back-to-back). Return `False` otherwise.

#### Capsule 3: Dead Code Eliminator
- **Difficulty:** Easy
- **Function:** `remove_dead_code(lines: list[str]) -> list[str]`
- **Prompt:** Create a pure Python lab. Write a function `remove_dead_code(lines)` that takes a list of code line strings. Remove any line that starts with `#` (comment) or is an empty/whitespace-only string. Return the filtered list of active code lines.

#### Capsule 4: Variable Name Quality Checker
- **Difficulty:** Easy
- **Function:** `check_variable_names(names: list[str]) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `check_variable_names(names)` that takes a list of variable name strings. Return a dict with keys `"good"` (names with 3+ characters, snake_case) and `"bad"` (single-character or names containing uppercase). Classify each name into the appropriate list.

#### Capsule 5: Type Mismatch Detector
- **Difficulty:** Medium
- **Function:** `detect_type_mismatches(operations: list[dict]) -> list[str]`
- **Prompt:** Create a pure Python lab. Write a function `detect_type_mismatches(operations)` where each operation is a dict like `{"left": "string", "op": "+", "right": "int"}`. Return a list of warning strings for operations where types don't match (e.g., `"string + int"` is a mismatch). `"int + float"` and `"float + int"` are acceptable.

---

### Module B — Safety & Injection (Capsules 6–10)

#### Capsule 6: Prompt Injection Scanner
- **Difficulty:** Medium
- **Function:** `scan_for_injection(user_input: str) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `scan_for_injection(user_input)` that scans a string for prompt injection patterns. Check for phrases like `"ignore previous"`, `"disregard instructions"`, `"you are now"`, `"forget everything"`. Return a dict `{"safe": bool, "threats": list[str]}` where threats lists the matched patterns found.

#### Capsule 7: SQL Injection Detector in AI Code
- **Difficulty:** Medium
- **Function:** `detect_sql_injection(code_str: str) -> list[str]`
- **Prompt:** Create a pure Python lab. Write a function `detect_sql_injection(code_str)` that takes a string of Python code. Detect patterns where string concatenation or f-strings are used inside SQL query strings (e.g., `f"SELECT * FROM users WHERE id = {user_id}"`). Return a list of warning messages for each unsafe pattern found. Look for `f"SELECT`, `f"INSERT`, `f"UPDATE`, `f"DELETE"`, and `"+" ... "SELECT"` patterns.

#### Capsule 8: Hardcoded Secret Finder
- **Difficulty:** Medium
- **Function:** `find_secrets(code_lines: list[str]) -> list[dict]`
- **Prompt:** Create a pure Python lab. Write a function `find_secrets(code_lines)` that scans a list of code line strings. Detect lines containing patterns like `api_key = "..."`, `password = "..."`, `secret = "..."`, `token = "..."` where a string literal is directly assigned. Return a list of dicts `{"line": int, "variable": str}` for each found secret (1-indexed line numbers).

#### Capsule 9: Unsafe Eval Detector
- **Difficulty:** Medium
- **Function:** `detect_unsafe_eval(code_lines: list[str]) -> list[dict]`
- **Prompt:** Create a pure Python lab. Write a function `detect_unsafe_eval(code_lines)` that scans code lines for dangerous function calls: `eval(`, `exec(`, `compile(`, `__import__(`. Return a list of dicts `{"line": int, "function": str}` for each dangerous call found (1-indexed line numbers).

#### Capsule 10: Input Sanitizer
- **Difficulty:** Medium
- **Function:** `sanitize_input(user_text: str) -> str`
- **Prompt:** Create a pure Python lab. Write a function `sanitize_input(user_text)` that cleans user input for safe processing. Strip leading/trailing whitespace, replace sequences of multiple spaces with a single space, remove any characters that aren't alphanumeric, spaces, or basic punctuation (`.,!?-`). Return the cleaned string.

---

### Module C — Logic & Correctness (Capsules 11–15)

#### Capsule 11: Loop Boundary Validator
- **Difficulty:** Medium
- **Function:** `validate_loop_bounds(start: int, end: int, step: int) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `validate_loop_bounds(start, end, step)` that checks if a loop with these parameters would be valid. Return a dict `{"valid": bool, "reason": str}`. Invalid cases: `step == 0` (infinite loop), positive step but `start > end`, negative step but `start < end`. For valid loops, also include `"iterations": int` counting how many times the loop would execute.

#### Capsule 12: Null Safety Wrapper
- **Difficulty:** Medium
- **Function:** `safe_chain_access(data: dict, keys: list[str]) -> any`
- **Prompt:** Create a pure Python lab. Write a function `safe_chain_access(data, keys)` that safely traverses nested dictionaries. Given `data = {"a": {"b": {"c": 42}}}` and `keys = ["a", "b", "c"]`, return `42`. If any key in the chain is missing or the intermediate value is not a dict, return `None` instead of crashing.

#### Capsule 13: Edge Case Generator
- **Difficulty:** Hard
- **Function:** `generate_edge_cases(func_signature: str) -> list[dict]`
- **Prompt:** Create a pure Python lab. Write a function `generate_edge_cases(func_signature)` that takes a function signature string like `"def add(a: int, b: int) -> int"`. Parse the parameter types and generate edge case test inputs. For `int` params: include `0`, `-1`, large numbers. For `str` params: include `""`, single char, long string. Return a list of dicts `{"inputs": dict, "reason": str}` describing each edge case.

#### Capsule 14: Return Type Validator
- **Difficulty:** Medium
- **Function:** `validate_return_type(value: any, expected_type: str) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `validate_return_type(value, expected_type)` where `expected_type` is a string like `"int"`, `"str"`, `"list"`, `"dict"`, `"bool"`. Check if the actual value matches the expected type. Return `{"valid": bool, "actual_type": str, "expected_type": str}`.

#### Capsule 15: Recursive Depth Guard
- **Difficulty:** Hard
- **Function:** `safe_flatten(nested: list, max_depth: int = 10) -> list`
- **Prompt:** Create a pure Python lab. Write a function `safe_flatten(nested, max_depth)` that flattens a nested list structure. AI sometimes generates infinite recursion — implement a depth guard that stops flattening beyond `max_depth` levels. If depth limit is exceeded, include the remaining nested structure as-is. Return the flattened list.

---

### Module D — Performance & Complexity (Capsules 16–20)

#### Capsule 16: Time Complexity Estimator
- **Difficulty:** Hard
- **Function:** `estimate_complexity(code_lines: list[str]) -> str`
- **Prompt:** Create a pure Python lab. Write a function `estimate_complexity(code_lines)` that analyzes code lines for nested loop patterns. Count the maximum nesting depth of `for`/`while` loops. Return `"O(1)"` for no loops, `"O(n)"` for one loop, `"O(n^2)"` for two nested loops, `"O(n^3)"` for three nested. Use indentation level to detect nesting.

#### Capsule 17: Memoization Wrapper
- **Difficulty:** Hard
- **Function:** `memoize(func)` — returns a wrapped function with a cache dict
- **Prompt:** Create a pure Python lab. Write a function `memoize(func)` that takes a function and returns a new function that caches results. Use a dictionary as the cache with argument tuples as keys. If the same arguments are passed again, return the cached result instead of recomputing. The wrapper function should also have a `.cache` attribute exposing the cache dict.

#### Capsule 18: Redundant Computation Detector
- **Difficulty:** Medium
- **Function:** `find_redundant_calls(code_lines: list[str]) -> list[str]`
- **Prompt:** Create a pure Python lab. Write a function `find_redundant_calls(code_lines)` that scans code lines for repeated function calls. If the same function call string (e.g., `len(data)`) appears more than once, flag it as redundant (should be stored in a variable). Return a list of the duplicated call strings.

#### Capsule 19: Memory-Efficient Batch Processor
- **Difficulty:** Medium
- **Function:** `process_in_batches(items: list, batch_size: int) -> list[list]`
- **Prompt:** Create a pure Python lab. Write a function `process_in_batches(items, batch_size)` that splits a list into smaller batches. Return a list of lists where each inner list has at most `batch_size` elements. The last batch may have fewer elements. Use list slicing with `range()`.

#### Capsule 20: Algorithm Selector
- **Difficulty:** Hard
- **Function:** `recommend_algorithm(data_size: int, sorted_flag: bool, unique: bool) -> str`
- **Prompt:** Create a pure Python lab. Write a function `recommend_algorithm(data_size, sorted_flag, unique)` that recommends a search/sort strategy. If data is sorted and unique, return `"binary_search"`. If data_size < 100, return `"linear_scan"`. If data is sorted but not unique, return `"bisect_search"`. If data_size >= 10000, return `"hash_index"`. Otherwise return `"linear_scan"`.

---

### Module E — Reliability & Testing (Capsules 21–25)

#### Capsule 21: Test Case Generator
- **Difficulty:** Hard
- **Function:** `generate_tests(func_name: str, params: list[dict]) -> list[dict]`
- **Prompt:** Create a pure Python lab. Write a function `generate_tests(func_name, params)` where each param is `{"name": str, "type": str}`. Generate a list of test case dicts `{"name": str, "inputs": dict, "description": str}`. Include: a normal case, an empty/zero case, a boundary case, and a type edge case for each parameter type.

#### Capsule 22: Flaky Test Stabilizer
- **Difficulty:** Medium
- **Function:** `stabilize_output(outputs: list, tolerance: float) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `stabilize_output(outputs, tolerance)` that takes a list of numeric outputs from multiple runs. Return `{"stable": bool, "mean": float, "spread": float}` where `spread` is `max - min`. If `spread <= tolerance`, the output is stable.

#### Capsule 23: Error Message Classifier
- **Difficulty:** Medium
- **Function:** `classify_error(error_msg: str) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `classify_error(error_msg)` that classifies an error message string. Check for patterns: `"TypeError"` → `"type"`, `"IndexError"` → `"boundary"`, `"KeyError"` → `"missing_key"`, `"ZeroDivision"` → `"math"`, `"RecursionError"` → `"infinite_loop"`. Return `{"category": str, "severity": str}` where severity is `"high"` for recursion/math, `"medium"` for others.

#### Capsule 24: Assertion Builder
- **Difficulty:** Medium
- **Function:** `build_assertions(func_name: str, test_cases: list[dict]) -> list[str]`
- **Prompt:** Create a pure Python lab. Write a function `build_assertions(func_name, test_cases)` where each test case is `{"inputs": list, "expected": any}`. Generate assertion strings like `"assert func_name(1, 2) == 3"`. Return the list of assertion strings.

#### Capsule 25: Regression Detector
- **Difficulty:** Hard
- **Function:** `detect_regressions(old_results: dict, new_results: dict) -> list[dict]`
- **Prompt:** Create a pure Python lab. Write a function `detect_regressions(old_results, new_results)` where both dicts map test names to `"pass"`/`"fail"`. Return a list of dicts `{"test": str, "change": str}` for tests that changed from `"pass"` to `"fail"` (regression) or `"fail"` to `"pass"` (fix). Ignore unchanged tests.

---

### Module F — Hallucination Detection (Capsules 26–28)

#### Capsule 26: Phantom API Detector
- **Difficulty:** Hard
- **Function:** `detect_phantom_apis(code_str: str, valid_apis: list[str]) -> list[str]`
- **Prompt:** Create a pure Python lab. Write a function `detect_phantom_apis(code_str, valid_apis)` that scans code for function calls (anything matching `word(` pattern). Extract all unique function call names and compare against `valid_apis`. Return a list of function names that appear in the code but are NOT in the valid API list — these are hallucinated APIs.

#### Capsule 27: Hallucinated Import Detector
- **Difficulty:** Medium
- **Function:** `detect_fake_imports(code_lines: list[str], real_modules: list[str]) -> list[str]`
- **Prompt:** Create a pure Python lab. Write a function `detect_fake_imports(code_lines, real_modules)` that scans code lines for `import` and `from ... import` statements. Extract the module names and check them against `real_modules` (a list of known valid module names). Return a list of module names that are NOT in the valid list.

#### Capsule 28: Confidence Score Validator
- **Difficulty:** Medium
- **Function:** `validate_confidence(response: dict) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `validate_confidence(response)` that takes a response dict with keys `"answer"`, `"confidence"`, `"sources"`. Validate: confidence must be a float between 0.0 and 1.0, sources must be a non-empty list, and if confidence < 0.3 the answer should be flagged as `"low_confidence"`. Return `{"valid": bool, "flags": list[str]}`.

---

### Module G — Capstone: Full Supervision Pipeline (Capsules 29–30)

#### Capsule 29: Code Review Pipeline
- **Difficulty:** Hard
- **Function:** `review_code(code_lines: list[str]) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `review_code(code_lines)` that runs a multi-step code review. Check for: (1) hardcoded secrets (lines containing `password =`, `api_key =`), (2) unsafe functions (`eval`, `exec`), (3) poor variable names (single-character), (4) missing error handling (no `try` found in code). Return `{"score": int, "issues": list[dict]}` where score starts at 100 and deducts 10 per issue found. Each issue has `{"type": str, "line": int, "message": str}`.

#### Capsule 30: AI Code Supervision Dashboard
- **Difficulty:** Hard
- **Function:** `supervise_ai_code(submissions: list[dict]) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `supervise_ai_code(submissions)` where each submission is `{"id": int, "code_lines": list[str], "language": str}`. For each submission, run all checks: secret detection, unsafe function detection, variable quality, complexity estimation based on loop nesting depth. Return `{"total": int, "passed": int, "failed": int, "reports": list[dict]}` where each report summarizes the issues found per submission. A submission passes if it has 0 high-severity issues.

---

## Course 4: Build an AI Customer Support Agent — Progressive Capstone (30 Capsules)

**Environment:** Pure Python 3 (Piston)
**Constraints:** No external libraries. All capsules use pure stdlib. Progressive track — each capsule builds toward one complete AI system.
**Theme:** Build and supervise an AI Customer Support Agent. By capsule 30 the learner has assembled a complete AI pipeline: User Question → Prompt Builder → Retriever (RAG) → LLM → Tool Executor → Response Validator.

---

### Phase 1 — Prompt & Input Safety (Capsules 1–5)

**Goal:** Prepare safe inputs for AI systems.

#### Capsule 1: System Prompt Formatter
- **Difficulty:** Easy
- **Function:** `format_system_prompt(role: str, goal: str) -> str`
- **Prompt:** Create a pure Python lab. Write a function `format_system_prompt(role, goal)` that takes a role string (e.g., `"customer support agent"`) and a goal string (e.g., `"help users resolve billing issues"`). Return a formatted system prompt string: `"You are a {role}. Your goal is to {goal}. Be helpful, accurate, and concise."`

#### Capsule 2: Model Configuration Validator
- **Difficulty:** Easy
- **Function:** `validate_config(config: dict) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `validate_config(config)` that validates an AI model configuration dict. Check: `"temperature"` must be a float between 0.0 and 2.0, `"max_tokens"` must be a positive integer <= 4096, `"top_p"` must be a float between 0.0 and 1.0. Return `{"valid": bool, "errors": list[str]}` listing any validation failures.

#### Capsule 3: Token Cost Estimator
- **Difficulty:** Easy
- **Function:** `estimate_cost(prompt: str, rate_per_1k: float) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `estimate_cost(prompt, rate_per_1k)` that estimates the token cost of a prompt. Use the heuristic: 1 token ≈ 4 characters. Calculate token count, then cost as `(tokens / 1000) * rate_per_1k`. Return `{"tokens": int, "cost": float}` with cost rounded to 6 decimal places.

#### Capsule 4: Prompt Injection Detector
- **Difficulty:** Medium
- **Function:** `detect_injection(user_input: str) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `detect_injection(user_input)` that scans user input for prompt injection attacks. Check for these patterns (case-insensitive): `"ignore previous instructions"`, `"disregard all"`, `"you are now"`, `"forget everything"`, `"system prompt"`. Return `{"safe": bool, "threats": list[str]}` where threats lists the matched patterns.

#### Capsule 5: User Input Sanitizer
- **Difficulty:** Medium
- **Function:** `sanitize_query(raw_input: str) -> str`
- **Prompt:** Create a pure Python lab. Write a function `sanitize_query(raw_input)` that cleans a user query before sending it to an AI model. Strip whitespace, collapse multiple spaces into one, remove any HTML tags (anything between `<` and `>`), and truncate to 500 characters max. Return the cleaned string.

---

### Phase 2 — Conversation Memory (Capsules 6–10)

**Goal:** Manage chat history for multi-turn conversations.

#### Capsule 6: Add Message to Conversation
- **Difficulty:** Easy
- **Function:** `add_message(history: list, role: str, content: str) -> list`
- **Prompt:** Create a pure Python lab. Write a function `add_message(history, role, content)` that appends a message dict `{"role": role, "content": content}` to the history list. Validate that role is one of `"system"`, `"user"`, `"assistant"`. If invalid role, raise a `ValueError`. Return the updated history list.

#### Capsule 7: Context Window Truncation
- **Difficulty:** Medium
- **Function:** `truncate_history(history: list, max_messages: int) -> list`
- **Prompt:** Create a pure Python lab. Write a function `truncate_history(history, max_messages)` that keeps conversation history within token limits. If the history has more than `max_messages` entries, keep the first message (system prompt) and the most recent `max_messages - 1` messages. Return the truncated list.

#### Capsule 8: Conversation Token Budget
- **Difficulty:** Medium
- **Function:** `check_budget(history: list, max_tokens: int) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `check_budget(history, max_tokens)` that calculates total token usage of a conversation. Estimate tokens per message as `len(msg["content"]) // 4`. Sum all messages. Return `{"total_tokens": int, "budget_remaining": int, "over_budget": bool}`.

#### Capsule 9: Conversation Summarizer
- **Difficulty:** Medium
- **Function:** `summarize_conversation(history: list, max_sentences: int) -> str`
- **Prompt:** Create a pure Python lab. Write a function `summarize_conversation(history, max_sentences)` that creates an extractive summary. From each message, extract the first sentence (split by `". "`). Collect sentences from user and assistant messages (skip system). Return at most `max_sentences` joined with `" "`. This simulates conversation compression for long chats.

#### Capsule 10: Conversation Serializer
- **Difficulty:** Easy
- **Function:** `serialize_conversation(history: list) -> str` and `deserialize_conversation(data: str) -> list`
- **Prompt:** Create a pure Python lab. Write two functions: `serialize_conversation(history)` converts a list of message dicts to a JSON string using `json.dumps()`. `deserialize_conversation(data)` parses a JSON string back to a list using `json.loads()`. This enables conversation persistence between requests.

---

### Phase 3 — Retrieval / RAG (Capsules 11–15)

**Goal:** Add knowledge retrieval to the AI system.

#### Capsule 11: Document Chunker
- **Difficulty:** Medium
- **Function:** `chunk_document(text: str, chunk_size: int, overlap: int) -> list[str]`
- **Prompt:** Create a pure Python lab. Write a function `chunk_document(text, chunk_size, overlap)` that splits a long document into overlapping chunks. Each chunk is at most `chunk_size` characters, and consecutive chunks overlap by `overlap` characters. Do not split words — find the last space within the chunk boundary. Return the list of chunks.

#### Capsule 12: Vector Similarity Calculator
- **Difficulty:** Hard
- **Function:** `cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float`
- **Prompt:** Create a pure Python lab. Write a function `cosine_similarity(vec_a, vec_b)` that computes cosine similarity between two vectors using only the `math` module. Calculate: dot product / (magnitude_a * magnitude_b). Handle the edge case where either magnitude is 0 by returning 0.0. Return the similarity score rounded to 4 decimal places.

#### Capsule 13: Search Top Documents
- **Difficulty:** Hard
- **Function:** `search_documents(query_vec: list[float], documents: list[dict], top_k: int) -> list[dict]`
- **Prompt:** Create a pure Python lab. Write a function `search_documents(query_vec, documents, top_k)` where each document is `{"id": int, "text": str, "embedding": list[float]}`. Calculate cosine similarity between `query_vec` and each document's embedding. Return the top `top_k` documents sorted by similarity score (highest first), each augmented with a `"score"` key.

#### Capsule 14: Deduplicate Sources
- **Difficulty:** Medium
- **Function:** `deduplicate(results: list[dict]) -> list[dict]`
- **Prompt:** Create a pure Python lab. Write a function `deduplicate(results)` that removes duplicate documents from search results. Two documents are duplicates if they share the same `"id"` or if their `"text"` content is identical. Keep the first occurrence. Return the deduplicated list preserving original order.

#### Capsule 15: Build Retrieval Pipeline
- **Difficulty:** Hard
- **Function:** `retrieve(query: str, knowledge_base: list[dict], top_k: int) -> list[dict]`
- **Prompt:** Create a pure Python lab. Write a function `retrieve(query, knowledge_base, top_k)` that combines the full retrieval pipeline. Each knowledge base entry is `{"id": int, "text": str, "embedding": list[float]}`. Create a mock query embedding by converting query characters to floats (e.g., `ord(c) / 1000`). Calculate similarity with each document, deduplicate, sort by score, and return the top `top_k` results.

---

### Phase 4 — Agent Tooling (Capsules 16–20)

**Goal:** Give the AI agent tools to take actions.

#### Capsule 16: Tool Dispatcher
- **Difficulty:** Medium
- **Function:** `dispatch_tool(tool_name: str, args: dict, registry: dict) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `dispatch_tool(tool_name, args, registry)` where `registry` maps tool names to functions. If `tool_name` exists in registry, call it with `**args` and return `{"status": "success", "result": <output>}`. If not found, return `{"status": "error", "message": "Unknown tool: <tool_name>"}`.

#### Capsule 17: Weather Tool (Mock)
- **Difficulty:** Easy
- **Function:** `get_weather(city: str) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `get_weather(city)` that simulates a weather API. Use a hardcoded lookup dict with 5 cities (e.g., `{"New York": {"temp": 72, "condition": "Sunny"}, ...}`). If the city is found, return its weather dict. If not, return `{"temp": None, "condition": "Unknown", "error": "City not found"}`.

#### Capsule 18: Calculator Tool (Safe)
- **Difficulty:** Medium
- **Function:** `safe_calculate(expression: str) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `safe_calculate(expression)` that evaluates simple math expressions WITHOUT using `eval()`. Support: addition (`+`), subtraction (`-`), multiplication (`*`), division (`/`). Parse the expression string to extract two numbers and an operator. Handle division by zero. Return `{"result": float, "expression": str}` or `{"error": str}`.

#### Capsule 19: Agent Intent Router
- **Difficulty:** Medium
- **Function:** `route_intent(query: str) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `route_intent(query)` that classifies user queries by keyword matching. If query contains `"weather"`, `"temperature"`, or `"forecast"` → route to `"weather_tool"`. If `"calculate"`, `"math"`, `"+"`, `"-"` → `"calculator_tool"`. If `"order"`, `"shipping"`, `"tracking"` → `"order_lookup"`. Otherwise → `"general_chat"`. Return `{"intent": str, "tool": str, "confidence": str}` where confidence is `"high"` if 2+ keywords match, else `"medium"`.

#### Capsule 20: ReAct Loop (Reason-Act-Observe)
- **Difficulty:** Hard
- **Function:** `react_loop(query: str, tools: dict, max_steps: int) -> list[dict]`
- **Prompt:** Create a pure Python lab. Write a function `react_loop(query, tools, max_steps)` that simulates the ReAct pattern. Each step: (1) **Reason** — determine which tool to use based on keywords in the query, (2) **Act** — call the tool from the `tools` dict, (3) **Observe** — record the result. Return a list of step dicts `{"step": int, "thought": str, "action": str, "observation": str}`. Stop when a tool returns a result or `max_steps` is reached.

---

### Phase 5 — AI Supervision (Capsules 21–25)

**Goal:** Supervise and validate AI outputs.

#### Capsule 21: Hallucinated Library Detector
- **Difficulty:** Medium
- **Function:** `detect_hallucinated_libs(code_str: str, known_libs: list[str]) -> list[str]`
- **Prompt:** Create a pure Python lab. Write a function `detect_hallucinated_libs(code_str, known_libs)` that scans Python code for import statements. Extract all module names from `import X` and `from X import Y` patterns. Return a list of module names that appear in the code but are NOT in `known_libs` — these are hallucinated by the AI.

#### Capsule 22: JSON Response Validator
- **Difficulty:** Medium
- **Function:** `validate_json_response(response_str: str) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `validate_json_response(response_str)` that attempts to parse an AI's response as JSON. Use `json.loads()` in a try/except. If valid, return `{"valid": True, "data": <parsed>}`. If invalid, attempt to extract JSON by finding the first `{` and last `}`, try parsing that substring. Return `{"valid": False, "error": str, "recovered": bool}`.

#### Capsule 23: Output Schema Validator
- **Difficulty:** Medium
- **Function:** `validate_schema(data: dict, schema: dict) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `validate_schema(data, schema)` where `schema` defines required fields and types, e.g., `{"name": "str", "age": "int", "tags": "list"}`. Check that every required field exists in `data` and has the correct type. Return `{"valid": bool, "missing": list[str], "type_errors": list[str]}`.

#### Capsule 24: Security Pattern Scanner
- **Difficulty:** Hard
- **Function:** `scan_security(code_lines: list[str]) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `scan_security(code_lines)` that audits code for security vulnerabilities. Check for: `eval(`/`exec(` (code injection), string-formatted SQL queries (SQL injection), hardcoded passwords/keys, `pickle.loads` (deserialization attack), `os.system(` (command injection). Return `{"risk_level": str, "vulnerabilities": list[dict]}` where risk is `"critical"`/`"high"`/`"medium"`/`"low"` based on count.

#### Capsule 25: Token Usage & Cost Monitor
- **Difficulty:** Medium
- **Function:** `monitor_usage(requests: list[dict]) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `monitor_usage(requests)` where each request is `{"model": str, "prompt_tokens": int, "completion_tokens": int}`. Calculate total tokens, cost per model (use hardcoded rates: `{"gpt-4": 0.03, "gpt-3.5": 0.002, "claude": 0.015}` per 1K tokens), and overall cost. Return `{"total_tokens": int, "total_cost": float, "by_model": dict}`.

---

### Phase 6 — Capstone: Assemble the Full AI System (Capsules 26–30)

**Goal:** Combine all components into one working AI agent system.

#### Capsule 26: Build AI Query Pipeline
- **Difficulty:** Hard
- **Function:** `build_pipeline(query: str, system_role: str, knowledge_base: list[dict]) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `build_pipeline(query, system_role, knowledge_base)` that assembles an AI query pipeline. Steps: (1) sanitize the user query, (2) format a system prompt with the role, (3) search the knowledge base for relevant documents (mock embedding similarity), (4) build the final prompt combining system prompt + retrieved context + user query. Return `{"sanitized_query": str, "system_prompt": str, "context": list[str], "final_prompt": str}`.

#### Capsule 27: Add Tool Execution Layer
- **Difficulty:** Hard
- **Function:** `execute_with_tools(query: str, tools: dict) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `execute_with_tools(query, tools)` that adds tool execution to the pipeline. First route the user's intent. If the intent maps to a tool, dispatch and execute it. If no tool matches, mark the response as `"direct_response"`. Return `{"intent": str, "tool_used": str or None, "tool_result": any, "needs_llm": bool}`.

#### Capsule 28: Add Safety Layer
- **Difficulty:** Hard
- **Function:** `apply_safety(query: str, ai_response: str) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `apply_safety(query, ai_response)` that validates both input and output. On the input: run injection detection. On the output: validate JSON format, check schema compliance, scan for hallucinated libraries if code is present. Return `{"input_safe": bool, "output_valid": bool, "flags": list[str], "approved": bool}` where approved is True only if both input and output pass all checks.

#### Capsule 29: Performance Optimizer
- **Difficulty:** Hard
- **Function:** `optimize_request(history: list, query: str, budget: int) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `optimize_request(history, query, budget)` that optimizes an AI request for cost and performance. Steps: (1) truncate history to fit within token budget, (2) estimate cost of the optimized request, (3) summarize long conversations to save tokens. Return `{"original_tokens": int, "optimized_tokens": int, "savings_percent": float, "optimized_history": list}`.

#### Capsule 30: Final Capstone — AI Support Agent
- **Difficulty:** Hard
- **Function:** `handle_support_request(query: str, history: list, knowledge_base: list[dict], tools: dict) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `handle_support_request(query, history, knowledge_base, tools)` that processes a complete customer support request through the full AI pipeline. Steps: (1) sanitize input and check for injection, (2) add message to conversation history, (3) check token budget and truncate if needed, (4) route intent — if tool needed, execute it, (5) search knowledge base for relevant context, (6) build the final prompt, (7) validate the response format, (8) calculate cost. Return a comprehensive dict with `{"query": str, "safe": bool, "intent": str, "tool_result": any, "context": list, "prompt": str, "cost": dict, "response_valid": bool}`.

---

## Course 5: Reliable AI Systems — Progressive Capstone (30 Capsules)

**Environment:** Pure Python 3 (Piston)
**Constraints:** No external libraries. All capsules use pure stdlib. Progressive track — each capsule builds toward one reliable AI service pipeline.
**Theme:** Build a production-grade reliable AI pipeline. By capsule 30 the learner has assembled: User Query → Input Guardrails → Prompt Builder → Mock LLM → Output Validator → Retry / Fallback → Cost Monitor → Reliable Response.

---

### Phase 1 — Input Guardrails (Capsules 1–5)

**Goal:** Protect AI systems from unsafe or malformed inputs.

#### Capsule 1: Prompt Injection Detector
- **Difficulty:** Easy
- **Function:** `detect_prompt_injection(text: str) -> bool`
- **Prompt:** Create a pure Python lab. Write a function `detect_prompt_injection(text)` that returns `True` if the text contains prompt injection phrases (case-insensitive): `"ignore previous instructions"`, `"disregard all"`, `"system prompt"`, `"you are now"`, `"forget everything"`. Return `False` if no threats are found.

#### Capsule 2: Input Length Guard
- **Difficulty:** Easy
- **Function:** `validate_input_length(text: str, max_chars: int) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `validate_input_length(text, max_chars)` that checks if user input exceeds allowed length. Return `{"valid": bool, "length": int, "max": int, "error": str or None}`. If length exceeds `max_chars`, set error to `"Input exceeds maximum length of {max_chars} characters"`.

#### Capsule 3: User Input Sanitizer
- **Difficulty:** Medium
- **Function:** `sanitize_input(text: str) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `sanitize_input(text)` that removes suspicious tokens from user input. Strip HTML tags (anything between `<` and `>`), remove SQL keywords (`DROP TABLE`, `DELETE FROM`, `INSERT INTO`, `UPDATE SET`), collapse multiple whitespace into single spaces, and strip leading/trailing whitespace. Return `{"cleaned": str, "removed": list[str]}` where removed lists what was stripped.

#### Capsule 4: Sensitive Data Detector
- **Difficulty:** Medium
- **Function:** `detect_sensitive_data(text: str) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `detect_sensitive_data(text)` that scans input for sensitive patterns. Detect: credit card numbers (16 consecutive digits or groups of 4 separated by dashes/spaces), SSN patterns (3-2-4 digit format like `123-45-6789`), and API key patterns (strings starting with `sk-`, `api_`, or `key_` followed by 20+ alphanumeric chars). Return `{"contains_sensitive": bool, "types_found": list[str]}`.

#### Capsule 5: Allowed Topic Filter
- **Difficulty:** Medium
- **Function:** `filter_allowed_topics(query: str, allowed_topics: list[str]) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `filter_allowed_topics(query, allowed_topics)` that checks if a user query falls within allowed support domains. Match query keywords against the allowed topic list (case-insensitive). Return `{"allowed": bool, "matched_topic": str or None, "confidence": str}` where confidence is `"high"` if 2+ topic words match, `"medium"` if 1 matches, and `"none"` if no match.

---

### Phase 2 — Prompt Reliability (Capsules 6–10)

**Goal:** Ensure prompts sent to the LLM are well structured and budget-safe.

#### Capsule 6: System Prompt Builder
- **Difficulty:** Easy
- **Function:** `build_system_prompt(role: str, rules: list[str]) -> str`
- **Prompt:** Create a pure Python lab. Write a function `build_system_prompt(role, rules)` that constructs a structured system prompt. Format: `"You are a {role}.\n\nRules:\n- {rule1}\n- {rule2}\n..."`. Number the rules and join them with newlines. Return the complete system prompt string.

#### Capsule 7: Prompt Token Estimator
- **Difficulty:** Easy
- **Function:** `estimate_tokens(text: str) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `estimate_tokens(text)` that estimates token count using the heuristic: 1 token ≈ 4 characters. Return `{"text_length": int, "estimated_tokens": int, "cost_at_gpt4_rate": float}` where cost uses $0.03 per 1K tokens, rounded to 6 decimal places.

#### Capsule 8: Token Budget Manager
- **Difficulty:** Medium
- **Function:** `manage_budget(components: dict, max_tokens: int) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `manage_budget(components, max_tokens)` where `components` is a dict like `{"system": "...", "history": "...", "query": "...", "context": "..."}`. Estimate tokens for each component (len//4). Return `{"breakdown": dict, "total_tokens": int, "budget_remaining": int, "over_budget": bool, "suggestions": list[str]}` where suggestions recommend which components to trim if over budget (largest first).

#### Capsule 9: Conversation Truncation
- **Difficulty:** Medium
- **Function:** `truncate_conversation(history: list, max_messages: int) -> list`
- **Prompt:** Create a pure Python lab. Write a function `truncate_conversation(history, max_messages)` that trims conversation history while preserving the first message (system prompt). If `len(history) > max_messages`, keep the first message plus the most recent `max_messages - 1` messages. Return the truncated list.

#### Capsule 10: Prompt Structure Validator
- **Difficulty:** Medium
- **Function:** `validate_prompt_structure(prompt_text: str) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `validate_prompt_structure(prompt_text)` that validates a prompt follows the required format with sections `SYSTEM:`, `USER:`, and optionally `CONTEXT:`. Check: (1) SYSTEM section exists and is non-empty, (2) USER section exists and is non-empty, (3) sections appear in correct order. Return `{"valid": bool, "sections_found": list[str], "errors": list[str]}`.

---

### Phase 3 — Output Validation (Capsules 11–15)

**Goal:** Prevent hallucinations and malformed AI outputs.

#### Capsule 11: JSON Response Validator
- **Difficulty:** Medium
- **Function:** `validate_json_response(response_str: str) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `validate_json_response(response_str)` that validates model output is valid JSON using `json.loads()`. If valid, return `{"valid": True, "data": <parsed>}`. If invalid, attempt recovery: find the first `{` and last `}`, try parsing that substring. Return `{"valid": False, "recovered": bool, "data": <parsed or None>, "error": str}`.

#### Capsule 12: Schema Validator
- **Difficulty:** Medium
- **Function:** `validate_schema(response: dict, schema: dict) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `validate_schema(response, schema)` where `schema` defines required fields and types, e.g., `{"answer": "str", "confidence": "float"}`. Check that every field exists and has the correct type. Return `{"valid": bool, "missing_fields": list[str], "type_errors": list[str]}`.

#### Capsule 13: Hallucinated Link Detector
- **Difficulty:** Medium
- **Function:** `detect_hallucinated_links(text: str, allowed_domains: list[str]) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `detect_hallucinated_links(text, allowed_domains)` that finds URLs in text (patterns like `http://` or `https://` followed by non-whitespace). Extract the domain from each URL. Return `{"urls_found": list[str], "hallucinated": list[str], "safe": bool}` where hallucinated contains URLs whose domains are not in `allowed_domains`.

#### Capsule 14: Response Length Guard
- **Difficulty:** Easy
- **Function:** `guard_response_length(response: str, max_chars: int) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `guard_response_length(response, max_chars)` that checks if an AI response exceeds the allowed character limit. If it does, truncate at the last complete sentence within the limit. Return `{"original_length": int, "truncated": bool, "response": str}`.

#### Capsule 15: Output Safety Filter
- **Difficulty:** Medium
- **Function:** `filter_unsafe_output(response: str, banned_phrases: list[str]) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `filter_unsafe_output(response, banned_phrases)` that scans an AI response for banned words or phrases (case-insensitive). Return `{"safe": bool, "flagged_phrases": list[str], "censored_response": str}` where censored_response replaces each banned phrase with `"[REDACTED]"`.

---

### Phase 4 — Reliability Controls (Capsules 16–20)

**Goal:** Handle failures and ensure stable system behavior.

#### Capsule 16: Retry With Exponential Backoff
- **Difficulty:** Medium
- **Function:** `retry_with_backoff(results: list[str], max_retries: int) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `retry_with_backoff(results, max_retries)` that simulates retrying a failing operation. `results` is a list of mock outcomes like `["error", "error", "success"]`. Iterate through results up to `max_retries`. Track delay as `[1, 2, 4, 8, ...]` (doubling). Return `{"success": bool, "attempts": int, "delays": list[int], "final_result": str}`. Stop immediately on `"success"`.

#### Capsule 17: Timeout Handler
- **Difficulty:** Medium
- **Function:** `handle_timeout(response_time_ms: int, timeout_ms: int, fallback: str) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `handle_timeout(response_time_ms, timeout_ms, fallback)` that simulates timeout detection. If `response_time_ms > timeout_ms`, return the fallback response instead. Return `{"timed_out": bool, "response_time_ms": int, "response": str, "used_fallback": bool}`.

#### Capsule 18: Fallback Model Router
- **Difficulty:** Medium
- **Function:** `route_to_fallback(primary_result: dict, fallback_result: dict) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `route_to_fallback(primary_result, fallback_result)` where each result dict has `{"status": str, "response": str, "model": str}`. If primary status is `"success"`, use it. If `"error"` or `"timeout"`, use fallback. Return `{"model_used": str, "response": str, "fallback_activated": bool, "reason": str}`.

#### Capsule 19: Response Confidence Check
- **Difficulty:** Medium
- **Function:** `check_confidence(response: dict, threshold: float) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `check_confidence(response, threshold)` where response has `{"answer": str, "confidence": float}`. If confidence >= threshold, accept. If between threshold-0.2 and threshold, flag as `"low_confidence"`. If below threshold-0.2, reject. Return `{"accepted": bool, "action": str, "confidence": float, "threshold": float}` where action is `"accept"`, `"flag"`, or `"reject"`.

#### Capsule 20: Circuit Breaker
- **Difficulty:** Hard
- **Function:** `circuit_breaker(request_results: list[str], failure_threshold: int, reset_after: int) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `circuit_breaker(request_results, failure_threshold, reset_after)` that implements the circuit breaker pattern. Process each result in order. Track consecutive failures. States: `"closed"` (normal), `"open"` (blocking — after `failure_threshold` consecutive failures), `"half-open"` (testing — after `reset_after` requests in open state). Return `{"final_state": str, "total_requests": int, "blocked_requests": int, "state_transitions": list[str]}`.

---

### Phase 5 — Observability & Cost (Capsules 21–25)

**Goal:** Monitor AI system behavior and costs.

#### Capsule 21: Token Cost Calculator
- **Difficulty:** Easy
- **Function:** `calculate_cost(usage: dict) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `calculate_cost(usage)` where usage is `{"model": str, "prompt_tokens": int, "completion_tokens": int}`. Use hardcoded rates: `{"gpt-4": {"input": 0.03, "output": 0.06}, "gpt-3.5": {"input": 0.001, "output": 0.002}, "claude": {"input": 0.015, "output": 0.075}}` (per 1K tokens). Return `{"input_cost": float, "output_cost": float, "total_cost": float, "model": str}` rounded to 6 decimal places.

#### Capsule 22: Usage Rate Limiter
- **Difficulty:** Medium
- **Function:** `check_rate_limit(user_requests: list[dict], max_requests: int, window_seconds: int) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `check_rate_limit(user_requests, max_requests, window_seconds)` where each request has `{"user_id": str, "timestamp": int}`. Count requests per user within the time window (from the latest timestamp backwards). Return `{"allowed": bool, "user_id": str, "requests_in_window": int, "limit": int}`.

#### Capsule 23: Structured Log Formatter
- **Difficulty:** Easy
- **Function:** `format_log(event: str, query: str, tokens: int, response_time_ms: int, status: str) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `format_log(event, query, tokens, response_time_ms, status)` that creates a structured log entry. Return `{"timestamp": str, "event": str, "query": str, "tokens": int, "response_time_ms": int, "status": str, "level": str}` where level is `"ERROR"` if status is `"error"`, `"WARN"` if response_time_ms > 5000, else `"INFO"`. Use a fixed timestamp string `"2024-01-01T00:00:00Z"` for testability.

#### Capsule 24: Error Categorizer
- **Difficulty:** Medium
- **Function:** `categorize_error(error_msg: str) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `categorize_error(error_msg)` that classifies an error message string. Categories: if contains `"invalid input"` or `"validation"` → `"INPUT_ERROR"`, if `"timeout"` or `"rate limit"` or `"model"` → `"MODEL_ERROR"`, if `"connection"` or `"server"` or `"memory"` → `"SYSTEM_ERROR"`. Return `{"category": str, "severity": str, "retryable": bool}` where INPUT_ERROR is not retryable, MODEL_ERROR is retryable, SYSTEM_ERROR has high severity.

#### Capsule 25: Telemetry Summary Generator
- **Difficulty:** Hard
- **Function:** `generate_telemetry(logs: list[dict]) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `generate_telemetry(logs)` where each log has `{"status": str, "tokens": int, "response_time_ms": int, "cost": float}`. Calculate: total requests, success rate (percentage of `"success"` status), average response time, total tokens, total cost, p95 response time (95th percentile — sort times, take the value at index `int(len * 0.95)`). Return `{"total_requests": int, "success_rate": float, "avg_response_time_ms": float, "p95_response_time_ms": int, "total_tokens": int, "total_cost": float}`.

---

### Phase 6 — Capstone: Assemble the Reliable AI Pipeline (Capsules 26–30)

**Goal:** Combine all components into one reliable AI service.

#### Capsule 26: Input Guardrail Pipeline
- **Difficulty:** Hard
- **Function:** `run_input_guardrails(query: str, max_length: int, allowed_topics: list[str]) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `run_input_guardrails(query, max_length, allowed_topics)` that runs all input checks in sequence: (1) prompt injection detection, (2) input length validation, (3) input sanitization (remove HTML/SQL), (4) sensitive data detection, (5) topic filtering. Return `{"passed": bool, "cleaned_query": str, "checks": list[dict]}` where each check has `{"name": str, "passed": bool, "details": str}`. Fail fast — if any check fails, stop processing.

#### Capsule 27: Reliable Prompt Builder
- **Difficulty:** Hard
- **Function:** `build_reliable_prompt(system_role: str, rules: list[str], history: list, query: str, context: list[str], max_tokens: int) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `build_reliable_prompt(system_role, rules, history, query, context, max_tokens)` that assembles a complete prompt with budget awareness. Steps: (1) build system prompt from role + rules, (2) truncate history if over budget, (3) format the final prompt as `"SYSTEM: {system}\nCONTEXT: {context}\nUSER: {query}"`, (4) validate structure. Return `{"prompt": str, "tokens_used": int, "budget_ok": bool, "history_truncated": bool}`.

#### Capsule 28: Output Validation Layer
- **Difficulty:** Hard
- **Function:** `validate_output(response_str: str, schema: dict, banned_phrases: list[str], max_length: int) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `validate_output(response_str, schema, banned_phrases, max_length)` that runs all output validations: (1) JSON validation, (2) schema compliance, (3) hallucinated link detection (any URL not in `["example.com", "docs.example.com"]`), (4) length guard, (5) safety filter. Return `{"valid": bool, "data": dict or None, "checks": list[dict], "issues": list[str]}`.

#### Capsule 29: Reliability Engine
- **Difficulty:** Hard
- **Function:** `run_with_reliability(mock_responses: list[dict], confidence_threshold: float, max_retries: int, timeout_ms: int) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `run_with_reliability(mock_responses, confidence_threshold, max_retries, timeout_ms)` that processes mock LLM responses with reliability controls. For each response in order: (1) check timeout, (2) check confidence, (3) if both pass, accept. If not, retry with next response using exponential backoff. If all fail, activate circuit breaker. Return `{"success": bool, "attempts": int, "final_response": dict or None, "retries_used": int, "circuit_breaker_triggered": bool, "total_delay": int}`.

#### Capsule 30: Final Capstone — Reliable AI Service
- **Difficulty:** Hard
- **Function:** `handle_request(query: str, history: list, config: dict) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `handle_request(query, history, config)` that processes a request through the complete reliable AI pipeline. `config` contains `{"role": str, "rules": list, "allowed_topics": list, "max_tokens": int, "confidence_threshold": float, "max_retries": int}`. Steps: (1) run input guardrails — reject if unsafe, (2) build prompt with token budget, (3) simulate LLM call (return a mock response dict), (4) validate output against schema, (5) check confidence and retry if needed, (6) calculate cost, (7) generate log entry. Return `{"answer": str, "confidence": float, "tokens": int, "cost": float, "status": str, "retries": int, "guardrails_passed": bool, "output_valid": bool}` where status is `"SUCCESS"`, `"REJECTED"`, `"FALLBACK"`, or `"FAILED"`.

---

## Course 6: AI Infrastructure Engineering — Progressive Capstone (30 Capsules)

**Environment:** Pure Python 3 (Piston)
**Constraints:** No external libraries. All capsules use pure stdlib. Concurrency/timing is simulated with mock timestamps and state dicts — no `threading`, `multiprocessing`, or `time.sleep`.
**Theme:** Build the infrastructure that powers AI systems at scale. By capsule 30 the learner has assembled: Client Request → Rate Limiter → Request Queue → Worker Pool → LLM Executor (mock) → Cache Layer → Response.

---

### Phase 1 — Request Control (Capsules 1–5)

**Goal:** Control and limit incoming requests to protect AI services.

#### Capsule 1: Request Counter
- **Difficulty:** Easy
- **Function:** `count_requests(logs: list[dict]) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `count_requests(logs)` where each log is `{"user_id": str, "timestamp": int, "endpoint": str}`. Count total requests, requests per user, and requests per endpoint. Return `{"total": int, "by_user": dict, "by_endpoint": dict}`.

#### Capsule 2: Fixed Window Rate Limiter
- **Difficulty:** Easy
- **Function:** `rate_limit(requests: list[dict], max_per_window: int, window_size: int) -> list[dict]`
- **Prompt:** Create a pure Python lab. Write a function `rate_limit(requests, max_per_window, window_size)` where each request has `{"user_id": str, "timestamp": int}`. For each user, allow at most `max_per_window` requests per `window_size` seconds. Process requests in order. Return a list of result dicts `{"user_id": str, "timestamp": int, "allowed": bool}`.

#### Capsule 3: Sliding Window Rate Limiter
- **Difficulty:** Medium
- **Function:** `sliding_rate_limit(requests: list[dict], max_per_window: int, window_seconds: int) -> list[dict]`
- **Prompt:** Create a pure Python lab. Write a function `sliding_rate_limit(requests, max_per_window, window_seconds)` that implements a sliding window rate limiter. For each request, count how many previous requests from the same user fall within the last `window_seconds`. If the count >= `max_per_window`, reject. Return a list of result dicts `{"user_id": str, "timestamp": int, "allowed": bool, "current_count": int}`.

#### Capsule 4: User Quota Tracker
- **Difficulty:** Medium
- **Function:** `track_quota(requests: list[dict], quotas: dict) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `track_quota(requests, quotas)` where each request has `{"user_id": str, "tokens": int}` and `quotas` maps user IDs to max token limits. Process requests in order, accumulating tokens per user. Return `{"usage": dict, "over_quota": list[str], "remaining": dict}` where over_quota lists users who exceeded their limit and remaining shows tokens left per user.

#### Capsule 5: Burst Detection
- **Difficulty:** Medium
- **Function:** `detect_bursts(requests: list[dict], burst_threshold: int, window_ms: int) -> list[dict]`
- **Prompt:** Create a pure Python lab. Write a function `detect_bursts(requests, burst_threshold, window_ms)` that detects burst patterns. For each user, if they send `burst_threshold` or more requests within `window_ms` milliseconds, flag it. Return a list of burst dicts `{"user_id": str, "burst_count": int, "start_time": int, "end_time": int}`.

---

### Phase 2 — Queue Systems (Capsules 6–10)

**Goal:** Build queue infrastructure for async job processing.

#### Capsule 6: FIFO Queue
- **Difficulty:** Easy
- **Function:** `class FIFOQueue` with `enqueue`, `dequeue`, `peek`, `size`, `is_empty`
- **Prompt:** Create a pure Python lab. Write a class `FIFOQueue` that implements a basic first-in-first-out queue. Methods: `enqueue(item)` adds to the back, `dequeue()` removes and returns from the front (returns `None` if empty), `peek()` returns the front item without removing, `size()` returns current length, `is_empty()` returns bool. Use a plain Python list internally.

#### Capsule 7: Priority Queue
- **Difficulty:** Medium
- **Function:** `class PriorityQueue` with `enqueue`, `dequeue`, `peek`, `size`
- **Prompt:** Create a pure Python lab. Write a class `PriorityQueue` where each item has a priority (lower number = higher priority). Methods: `enqueue(item, priority)` adds an item, `dequeue()` removes and returns the highest priority item (lowest number), `peek()` returns it without removing, `size()` returns count. Use a sorted list or `heapq` from stdlib. If priorities are equal, maintain FIFO order.

#### Capsule 8: Job Retry Queue
- **Difficulty:** Medium
- **Function:** `process_with_retries(jobs: list[dict], max_retries: int) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `process_with_retries(jobs, max_retries)` where each job is `{"id": int, "result": str}` with result being `"success"` or `"fail"`. Process jobs in order. On failure, re-enqueue the job with an incremented retry count. After `max_retries` failures, move to dead letter queue. Return `{"completed": list, "retried": list, "dead_letter": list}` with job IDs in each.

#### Capsule 9: Dead Letter Queue
- **Difficulty:** Medium
- **Function:** `manage_dead_letters(dead_letters: list[dict]) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `manage_dead_letters(dead_letters)` where each item is `{"id": int, "error": str, "retry_count": int, "timestamp": int}`. Categorize by error type, find the most common error, calculate average retries before failure. Return `{"total": int, "by_error": dict, "most_common_error": str, "avg_retries": float, "oldest": int, "newest": int}`.

#### Capsule 10: Queue Size Monitor
- **Difficulty:** Medium
- **Function:** `monitor_queue(snapshots: list[dict]) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `monitor_queue(snapshots)` where each snapshot is `{"timestamp": int, "queue_size": int, "processing": int}`. Detect: peak queue size, average queue size, times the queue exceeded a threshold of 100, and whether the queue is growing (last 3 snapshots increasing). Return `{"peak": int, "average": float, "overloaded_count": int, "trend": str}` where trend is `"growing"`, `"shrinking"`, or `"stable"`.

---

### Phase 3 — Concurrency Control (Capsules 11–15)

**Goal:** Simulate worker pool management and concurrent job execution.

#### Capsule 11: Worker Pool Simulator
- **Difficulty:** Medium
- **Function:** `simulate_worker_pool(jobs: list[dict], num_workers: int) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `simulate_worker_pool(jobs, num_workers)` where each job is `{"id": int, "duration_ms": int}`. Simulate a pool of workers processing jobs. Assign each job to the worker with the earliest availability time. Track which worker processed which job. Return `{"assignments": list[dict], "total_time_ms": int, "worker_utilization": dict}` where each assignment has `{"job_id": int, "worker_id": int, "start_ms": int, "end_ms": int}` and utilization is busy_time/total_time per worker.

#### Capsule 12: Task Scheduler
- **Difficulty:** Hard
- **Function:** `schedule_tasks(tasks: list[dict], num_workers: int) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `schedule_tasks(tasks, num_workers)` where each task is `{"id": int, "priority": int, "duration_ms": int, "depends_on": list[int]}`. Schedule tasks respecting dependencies — a task cannot start until all its dependencies are complete. Higher priority tasks (lower number) go first among ready tasks. Return `{"schedule": list[dict], "total_time_ms": int, "critical_path": list[int]}` where each schedule entry has `{"task_id": int, "worker_id": int, "start_ms": int, "end_ms": int}`.

#### Capsule 13: Concurrency Limiter
- **Difficulty:** Medium
- **Function:** `limit_concurrency(requests: list[dict], max_concurrent: int) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `limit_concurrency(requests, max_concurrent)` where each request is `{"id": int, "start_ms": int, "duration_ms": int}`. Process requests in order but queue them if `max_concurrent` slots are busy. Return `{"results": list[dict], "max_queue_depth": int, "total_time_ms": int}` where each result has `{"id": int, "queued_ms": int, "started_ms": int, "completed_ms": int}`.

#### Capsule 14: Job Timeout Detector
- **Difficulty:** Medium
- **Function:** `detect_timeouts(jobs: list[dict], timeout_ms: int) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `detect_timeouts(jobs, timeout_ms)` where each job is `{"id": int, "start_ms": int, "end_ms": int or None}`. A job has timed out if `end_ms is None` or `end_ms - start_ms > timeout_ms`. Return `{"completed": list[int], "timed_out": list[int], "still_running": list[int], "avg_duration_ms": float}`.

#### Capsule 15: Job Cancellation Manager
- **Difficulty:** Medium
- **Function:** `cancel_jobs(jobs: list[dict], cancel_ids: list[int]) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `cancel_jobs(jobs, cancel_ids)` where each job is `{"id": int, "status": str, "depends_on": list[int]}`. Cancel the requested jobs and cascade — any job that depends on a cancelled job must also be cancelled. Return `{"cancelled": list[int], "cascade_cancelled": list[int], "still_active": list[int]}` where cascade_cancelled are jobs cancelled due to dependency, not directly requested.

---

### Phase 4 — Caching (Capsules 16–20)

**Goal:** Build a caching layer to reduce redundant LLM calls.

#### Capsule 16: Simple Response Cache
- **Difficulty:** Easy
- **Function:** `class ResponseCache` with `get`, `set`, `has`, `size`, `clear`
- **Prompt:** Create a pure Python lab. Write a class `ResponseCache` that stores key-value pairs. Methods: `set(key, value)` stores a response, `get(key)` returns the value or `None`, `has(key)` returns bool, `size()` returns number of entries, `clear()` empties the cache. Use a plain dict internally.

#### Capsule 17: Cache Key Generator
- **Difficulty:** Medium
- **Function:** `generate_cache_key(query: str, model: str, temperature: float) -> str`
- **Prompt:** Create a pure Python lab. Write a function `generate_cache_key(query, model, temperature)` that creates a deterministic cache key from request parameters. Normalize the query (lowercase, strip whitespace, collapse multiple spaces). Combine with model and temperature. Use `hashlib.md5` (stdlib) to generate a hex digest string. Return the key string.

#### Capsule 18: Cache with Expiration
- **Difficulty:** Medium
- **Function:** `class ExpiringCache` with `set`, `get`, `cleanup`
- **Prompt:** Create a pure Python lab. Write a class `ExpiringCache` where each entry has a TTL (time-to-live). `set(key, value, ttl_seconds, current_time)` stores the value with an expiry time. `get(key, current_time)` returns the value if not expired, else `None`. `cleanup(current_time)` removes all expired entries. Uses mock integer timestamps passed as parameters — no `time.time()`.

#### Capsule 19: Cache Hit Rate Tracker
- **Difficulty:** Easy
- **Function:** `track_hit_rate(access_log: list[str]) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `track_hit_rate(access_log)` where each entry is `"hit"` or `"miss"`. Calculate total accesses, hits, misses, hit rate percentage, and the running hit rate after each 10 accesses. Return `{"total": int, "hits": int, "misses": int, "hit_rate": float, "rolling_rates": list[float]}`.

#### Capsule 20: Cache Invalidation Manager
- **Difficulty:** Hard
- **Function:** `invalidate_cache(cache: dict, rules: list[dict]) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `invalidate_cache(cache, rules)` where cache maps keys to `{"value": any, "tags": list[str], "created_at": int}` and rules are invalidation conditions like `{"type": "tag", "value": "model-v1"}` (remove entries with this tag), `{"type": "age", "max_age": int, "now": int}` (remove old entries), or `{"type": "key_prefix", "value": str}` (remove keys starting with prefix). Return `{"removed": list[str], "remaining": int, "rules_applied": int}`.

---

### Phase 5 — Cost Control (Capsules 21–25)

**Goal:** Monitor, limit, and optimize AI API costs.

#### Capsule 21: Token Usage Tracker
- **Difficulty:** Easy
- **Function:** `track_tokens(requests: list[dict]) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `track_tokens(requests)` where each request is `{"model": str, "prompt_tokens": int, "completion_tokens": int}`. Calculate total tokens, tokens per model, input vs output breakdown. Return `{"total_tokens": int, "by_model": dict, "input_tokens": int, "output_tokens": int, "input_ratio": float}`.

#### Capsule 22: Cost Calculator
- **Difficulty:** Easy
- **Function:** `calculate_costs(requests: list[dict]) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `calculate_costs(requests)` where each request has `{"model": str, "prompt_tokens": int, "completion_tokens": int}`. Use rates: `{"gpt-4": {"input": 0.03, "output": 0.06}, "gpt-3.5": {"input": 0.001, "output": 0.002}, "claude": {"input": 0.015, "output": 0.075}}` per 1K tokens. Return `{"total_cost": float, "by_model": dict, "cheapest_model": str, "most_expensive_model": str}` rounded to 6 decimal places.

#### Capsule 23: User Cost Quota
- **Difficulty:** Medium
- **Function:** `check_cost_quota(user_usage: list[dict], quotas: dict) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `check_cost_quota(user_usage, quotas)` where each usage is `{"user_id": str, "cost": float}` and quotas maps user IDs to max cost floats. Sum costs per user and compare against quotas. Return `{"users": dict, "over_quota": list[str], "warnings": list[str]}` where warnings list users above 80% of their quota and over_quota lists those who exceeded it.

#### Capsule 24: Cost Alert System
- **Difficulty:** Medium
- **Function:** `generate_alerts(usage_records: list[dict], thresholds: dict) -> list[dict]`
- **Prompt:** Create a pure Python lab. Write a function `generate_alerts(usage_records, thresholds)` where each record is `{"timestamp": int, "cost": float, "tokens": int}` and thresholds has `{"cost_warning": float, "cost_critical": float, "token_limit": int}`. Accumulate costs and tokens. Generate alerts when thresholds are crossed. Return a list of alert dicts `{"level": str, "type": str, "message": str, "timestamp": int, "current_value": float}` with levels `"warning"` or `"critical"`.

#### Capsule 25: Daily Usage Summary
- **Difficulty:** Medium
- **Function:** `daily_summary(logs: list[dict]) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `daily_summary(logs)` where each log is `{"timestamp": int, "user_id": str, "model": str, "tokens": int, "cost": float, "status": str}`. Group by day (integer divide timestamp by 86400). Return `{"days": dict, "total_cost": float, "total_tokens": int, "busiest_day": int, "avg_daily_cost": float}` where each day entry has requests count, unique users, total tokens, total cost, and success rate.

---

### Phase 6 — Capstone: Assemble AI Service Infrastructure (Capsules 26–30)

**Goal:** Combine all components into one complete AI service infrastructure.

#### Capsule 26: Request Gateway
- **Difficulty:** Hard
- **Function:** `request_gateway(request: dict, rate_limits: dict, quotas: dict) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `request_gateway(request, rate_limits, quotas)` where request has `{"user_id": str, "query": str, "timestamp": int}`. Run checks: (1) rate limit — check user hasn't exceeded `rate_limits[user_id]` requests, (2) quota — check user has remaining budget in `quotas`. Return `{"allowed": bool, "reason": str or None, "request_id": str}` where request_id is generated from user_id + timestamp.

#### Capsule 27: Queue Integration Layer
- **Difficulty:** Hard
- **Function:** `enqueue_request(request: dict, queue: list, max_queue_size: int) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `enqueue_request(request, queue, max_queue_size)` that adds validated requests to a priority queue. Priority is based on user tier: `"premium"` = 1, `"standard"` = 2, `"free"` = 3. If queue exceeds `max_queue_size`, reject with backpressure. Return `{"queued": bool, "position": int, "queue_size": int, "estimated_wait_ms": int}` where wait estimate is position * 200ms.

#### Capsule 28: Worker Execution Layer
- **Difficulty:** Hard
- **Function:** `execute_job(job: dict, cache: dict, mock_llm_responses: dict) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `execute_job(job, cache, mock_llm_responses)` where job has `{"id": int, "query": str, "model": str}`. First check the cache for the query. If cache hit, return cached result. If miss, look up the mock response from `mock_llm_responses` dict. Simulate processing with a mock latency based on query length. Store result in cache. Return `{"job_id": int, "response": str, "cache_hit": bool, "latency_ms": int, "tokens": int}`.

#### Capsule 29: Infrastructure Monitor
- **Difficulty:** Hard
- **Function:** `monitor_infrastructure(events: list[dict]) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `monitor_infrastructure(events)` where each event is `{"type": str, "timestamp": int, "data": dict}` with types like `"request"`, `"queue"`, `"worker"`, `"cache"`, `"cost"`. Aggregate metrics across all subsystems. Return `{"requests": {"total": int, "rate_limited": int}, "queue": {"peak_size": int, "avg_wait_ms": float}, "workers": {"utilization": float, "timeouts": int}, "cache": {"hit_rate": float}, "cost": {"total": float}, "health": str}` where health is `"healthy"`, `"degraded"`, or `"critical"` based on error rates.

#### Capsule 30: Final Capstone — AI Service Infrastructure
- **Difficulty:** Hard
- **Function:** `handle_ai_request(request: dict, infrastructure: dict) -> dict`
- **Prompt:** Create a pure Python lab. Write a function `handle_ai_request(request, infrastructure)` where request has `{"user_id": str, "query": str, "timestamp": int, "tier": str}` and infrastructure has `{"rate_limits": dict, "quotas": dict, "queue": list, "cache": dict, "mock_responses": dict, "workers": int}`. Process through the full pipeline: (1) rate limit check, (2) quota check, (3) enqueue with priority based on tier, (4) assign to worker, (5) check cache — hit or execute mock LLM, (6) store in cache, (7) calculate cost, (8) generate log. Return `{"status": str, "response": str, "latency_ms": int, "cache_hit": bool, "tokens": int, "cost": float, "queue_position": int, "worker_id": int}` where status is `"success"`, `"rate_limited"`, `"over_quota"`, or `"queue_full"`.

---

## Summary

| # | Course | Language | Capsules | Theme |
|---|--------|----------|:--------:|-------|
| 1 | AI & LLM Engineering | JavaScript | 15 | Prompt/RAG/Agent fundamentals |
| 2 | AI Engineering: Agentic Pipeline | Python | 25 | Build an agentic data pipeline |
| 3 | Supervising AI-Generated Code | Python | 30 | Review, fix & audit AI code |
| 4 | Build an AI Customer Support Agent | Python | 30 | Progressive capstone → full AI agent |
| 5 | Reliable AI Systems | Python | 30 | Progressive capstone → reliable AI service |
| 6 | AI Infrastructure Engineering | Python | 30 | Progressive capstone → AI service infra |
| | **Total** | | **160** | |

## How to Use

1. Generate each capsule through the application UI using the prompt text above
2. Publish each capsule
3. Click **"Mark as Featured"** in the success modal
4. Capsules appear on the `/capsules` public catalog page
5. Tag capsules with categories (e.g., `ai-javascript`, `ai-python`, `ai-supervision`, `ai-agent`, `ai-reliability`, `ai-infrastructure`) for grouping
