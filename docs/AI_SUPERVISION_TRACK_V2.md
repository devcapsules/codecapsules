# DevCapsules: AI Supervision Track (v2)
## Learn to Review, Fix, and Harden AI-Generated Code

---

## Course Overview

**Target Audience:** Developers who already use AI tools and want to become confident reviewers of AI-generated code.
**Duration:** 6–8 weeks
**Capsules:** 25 (24 + capstone)
**Language:** Pure Python 3
**Runtime:** Piston-only (no external libraries, no network, `assert`-only testing)

**Core Skill:**
Not "write everything from scratch," but "take an AI-generated solution, find the flaw, and correct it so all tests pass."

**Domain Threads (3 rotating contexts to prevent fatigue):**

| Domain | System | Capsule Count | Role |
|--------|--------|---------------|------|
| **PayFlow** | Payroll & salary engine | ~13 | Primary thread |
| **ShelfTrack** | Inventory management system | ~6 | Secondary thread |
| **BookNow** | Booking & reservation engine | ~6 | Tertiary thread |

> All three domains use the same supervision skills. Rotating contexts forces the learner to transfer skills across unfamiliar codebases — which is exactly what real AI supervision requires.

---

## Implementation Rule for Edge Forge (global):

For every capsule:

1. **Generate** a realistic AI-produced solution in Python.
2. **Inject** 1–2 flaws related to the capsule's learning goal.
3. The **learner's job** is to read, identify, and fix those flaws.
4. Keep the function signature and I/O contract fixed.
5. Use only Python standard library, Piston-compatible code.
6. Generate tests that **fail** on the flawed solution and **pass** when correctly fixed.
7. Every capsule must include:
   - **Difficulty** rating (Easy / Medium / Hard)
   - **Function signature** with type hints
   - **Learner prompt** (what the learner sees)
   - **Edge Forge spec** (what the system generates)
   - **Test cases** with concrete input → output examples

---

## Phase 1: Read and Understand AI Code (Capsules 1–4)

### Capsule 1: Audit AI-Generated Salary Engine

**Domain:** PayFlow
**Difficulty:** Medium
**Function:** `calculate_salary(employee: dict) -> dict`

**Learner Prompt:**
PayFlow uses an AI-generated `calculate_salary()` function in production. The code works but uses meaningless variable names like `x1`, `tmp`, `data2` and has zero documentation. Your job: rewrite for clarity. Keep the same function signature and return format. Rename variables to meaningful business names, add inline comments, and add a docstring.

**Edge Forge Spec:**
- Generate `calculate_salary(employee)` with obscure variable names, no comments, correct behavior for standard cases.
- Learner must rename all variables, add docstring, add inline comments.
- Flaw: readability, not logic.

**Tests:**
- `calculate_salary({"name": "Alice", "base": 5000, "bonus_pct": 10, "tax_rate": 20})` → `{"gross": 5500.0, "tax": 1100.0, "net": 4400.0}`
- `calculate_salary({"name": "Bob", "base": 3000, "bonus_pct": 0, "tax_rate": 15})` → `{"gross": 3000.0, "tax": 450.0, "net": 2550.0}`
- Output must match original logic exactly — only readability changes allowed.

---

### Capsule 2: Extract Magic Numbers from Inventory Pricing

**Domain:** ShelfTrack
**Difficulty:** Easy
**Function:** `calculate_item_price(item: dict) -> dict`

**Learner Prompt:**
ShelfTrack's AI-generated pricing function uses hardcoded numbers everywhere: `0.18`, `0.05`, `500`, `1000`. You have no idea what they mean. Extract all numeric literals to named constants at the top of the module, add comments explaining each, and refactor the function to use them.

**Edge Forge Spec:**
- Generate `calculate_item_price(item)` with inline magic numbers for tax rate (0.18), discount threshold (500), bulk threshold (1000), bulk discount (0.05).
- Learner must extract to `TAX_RATE = 0.18`, `DISCOUNT_THRESHOLD = 500`, etc.

**Tests:**
- `calculate_item_price({"name": "Widget", "base_price": 100, "quantity": 3})` → `{"subtotal": 300, "tax": 54.0, "discount": 0, "total": 354.0}`
- `calculate_item_price({"name": "Gadget", "base_price": 200, "quantity": 6})` → subtotal 1200, bulk discount applied, tax on discounted price
- No remaining magic numbers in the function body.

---

### Capsule 3: Add Type Safety to Bonus Calculator

**Domain:** PayFlow
**Difficulty:** Medium
**Function:** `compute_bonus(salary: float, multiplier: float) -> dict`

**Learner Prompt:**
The AI-generated `compute_bonus()` works when both arguments are floats, but crashes when `salary` is passed as a string or `None`. Add type hints to parameters and return type. Add runtime type checks: return a structured error dict `{"error": str}` for invalid types instead of crashing.

**Edge Forge Spec:**
- Generate `compute_bonus(salary, multiplier)` with no type hints, no validation, crashes on wrong types.
- Flaw: `compute_bonus("5000", 1.5)` crashes with TypeError.

**Tests:**
- `compute_bonus(5000.0, 1.5)` → `{"bonus": 7500.0}`
- `compute_bonus("5000", 1.5)` → `{"error": "salary must be a float or int"}`
- `compute_bonus(None, 1.5)` → `{"error": "salary must be a float or int"}`
- `compute_bonus(5000.0, "high")` → `{"error": "multiplier must be a float or int"}`

---

### Capsule 4: Test Booking Confirmation Reliability

**Domain:** BookNow
**Difficulty:** Medium
**Function:** `confirm_booking(booking: dict) -> dict`

**Learner Prompt:**
The AI-generated `confirm_booking()` has no tests and fails silently on edge cases (zero guests, past dates, missing fields). Write a test suite using pure `assert` statements covering: normal booking, zero guests, negative guest count, missing required fields, and extremely large party size.

**Edge Forge Spec:**
- Generate a correct-looking `confirm_booking(booking)` with no tests and known edge-case bugs (accepts 0 guests, doesn't validate date format).
- Learner writes assertions that expose the bugs, then fixes the function.

**Tests (learner must write these):**
- `confirm_booking({"guest": "Alice", "guests": 2, "date": "2026-04-01"})` → `{"status": "confirmed", ...}`
- `confirm_booking({"guest": "Bob", "guests": 0, "date": "2026-04-01"})` → `{"status": "error", "reason": "guests must be >= 1"}`
- `confirm_booking({"guest": "Eve"})` → `{"status": "error", "reason": "missing required field: guests"}`

---

## Phase 2: Fix Logic Bugs in AI Code (Capsules 5–9)

### Capsule 5: Fix AI Mutation Bug

**Domain:** PayFlow
**Difficulty:** Medium
**Function:** `process_employees(employees: list[dict]) -> list[dict]`

**Learner Prompt:**
The AI wrote a loop that mutates a list while iterating — some employees get skipped during processing. Fix the logic so every employee is processed exactly once. Do not mutate the list you're iterating over.

**Edge Forge Spec:**
- Generate `process_employees(employees)` that removes items inside a `for` loop, causing skips.
- Flaw: modifying list during iteration.

**Tests:**
- `process_employees([{"id": 1, "status": "active"}, {"id": 2, "status": "inactive"}, {"id": 3, "status": "active"}])` → all 3 processed, inactive ones tagged
- `len(process_employees(input_list))` must equal `len(input_list)` — no employee lost

---

### Capsule 6: Fix AI Tax Boundary Error

**Domain:** PayFlow
**Difficulty:** Hard
**Function:** `calculate_progressive_tax(salary: float) -> float`

**Learner Prompt:**
The AI misapplied progressive tax slabs. It taxes the **full** salary at the highest applicable rate instead of only the portion above each threshold. Fix the slab logic so each income portion is taxed in the correct bracket.

**Edge Forge Spec:**
- Generate `calculate_progressive_tax(salary)` with slabs [0–50000: 10%, 50001–100000: 20%, 100001+: 30%].
- Flaw: applies top rate to entire salary instead of marginal calculation.

**Tests:**
- `calculate_progressive_tax(40000)` → `4000.0` (40000 × 10%)
- `calculate_progressive_tax(75000)` → `10000.0` (50000 × 10% + 25000 × 20%)
- `calculate_progressive_tax(150000)` → `25000.0` (50000 × 10% + 50000 × 20% + 50000 × 30%)
- `calculate_progressive_tax(50000)` → `5000.0` (boundary: exactly at first slab)

---

### Capsule 7: Fix AI Crash on Missing Booking Data

**Domain:** BookNow
**Difficulty:** Medium
**Function:** `calculate_booking_total(booking: dict) -> dict`

**Learner Prompt:**
The AI assumes all fields exist (`room_type`, `nights`, `extras`) and crashes with `KeyError` when optional fields are missing. Use `dict.get()` to handle missing optional fields with sensible defaults. For truly required fields (`guest_name`, `nights`), return a structured error instead of crashing.

**Edge Forge Spec:**
- Generate `calculate_booking_total(booking)` that directly accesses `booking["extras"]`, `booking["discount_code"]`.
- Flaw: `KeyError` when optional fields absent.

**Tests:**
- `calculate_booking_total({"guest_name": "Alice", "nights": 3, "room_type": "standard", "extras": ["breakfast"]})` → `{"total": ..., "status": "ok"}`
- `calculate_booking_total({"guest_name": "Bob", "nights": 2})` → works with defaults (no extras, standard room)
- `calculate_booking_total({"room_type": "deluxe"})` → `{"status": "error", "reason": "missing required field: guest_name"}`

---

### Capsule 8: Fix AI Infinite Loop in Stock Reorder

**Domain:** ShelfTrack
**Difficulty:** Medium
**Function:** `reorder_stock(items: list[dict], threshold: int) -> list[dict]`

**Learner Prompt:**
The AI created a `while` loop to process items that need reordering, but it never increments the index — causing an infinite loop. Fix the termination condition so the function completes correctly and returns the list of reorder actions.

**Edge Forge Spec:**
- Generate `reorder_stock(items, threshold)` with a while loop that never advances the counter.
- Flaw: missing `i += 1` or wrong termination condition.

**Tests:**
- `reorder_stock([{"sku": "A1", "stock": 5}, {"sku": "B2", "stock": 20}], 10)` → `[{"sku": "A1", "action": "reorder", "quantity": 10}]`
- `reorder_stock([], 10)` → `[]`
- Function must complete in under 1 second for any input.

---

### Capsule 9: Fix AI Rounding Mistake

**Domain:** PayFlow
**Difficulty:** Medium
**Function:** `calculate_net_salary(salary: float, tax_rate: float) -> float`

**Learner Prompt:**
The AI rounds intermediate values at every step, causing cumulative rounding errors in the final amount. Remove all intermediate rounding. Round only once at the end to 2 decimal places.

**Edge Forge Spec:**
- Generate `calculate_net_salary(salary, tax_rate)` that calls `round()` after every arithmetic operation.
- Flaw: `round(round(salary * 0.1, 2) + round(salary * 0.05, 2), 2)` instead of `round(salary * 0.15, 2)`.

**Tests:**
- `calculate_net_salary(3333.33, 0.235)` → `2549.90` (exact, not `2549.89` from intermediate rounding)
- `calculate_net_salary(10000, 0.30)` → `7000.00`
- Result must always have exactly 2 decimal places.

---

## Phase 3: Refactor for Maintainability (Capsules 10–13)

### Capsule 10: Break AI Monolith

**Domain:** PayFlow
**Difficulty:** Hard
**Function:** `calculate_payroll(employees: list[dict]) -> list[dict]`

**Learner Prompt:**
The AI produced a single 100+ line `calculate_payroll()` function that handles validation, tax, bonus, deductions, and formatting all in one place. Break it into smaller, focused functions: `validate_employee()`, `compute_tax()`, `compute_bonus()`, `format_payslip()`. Keep overall input/output behavior identical.

**Edge Forge Spec:**
- Generate one massive function with clearly separable concerns (validation block, tax block, bonus block, format block).
- Flaw: maintainability, not correctness. All logic in one function.
- Note for Piston: keep generated code under 80 lines to fit sandbox constraints.

**Tests:**
- End-to-end: `calculate_payroll([{"name": "A", "base": 5000, ...}])` → same output before and after refactoring.
- Helper functions exist and are callable independently.

---

### Capsule 11: Remove Duplication and Rename

**Domain:** PayFlow
**Difficulty:** Medium
**Function:** `run_payroll_report(employees: list[dict]) -> dict`

**Learner Prompt:**
The AI duplicated the same tax calculation logic in three different functions (`process_data()`, `handle_values()`, `compute_thing()`), and all function names are meaningless. Extract the shared logic into one helper, rename all functions to business-meaningful names, and update all call sites.

**Edge Forge Spec:**
- Generate three functions with copy-pasted tax logic and vague names.
- Flaw: duplication + poor naming (two issues in one capsule).

**Tests:**
- All renamed functions produce identical results to originals.
- Shared helper is used by all callers (no duplicated calculation code).

---

### Capsule 12: Separate Logic Layers in Booking System

**Domain:** BookNow
**Difficulty:** Medium
**Function:** `process_booking(booking: dict) -> str`

**Learner Prompt:**
The AI mixed calculation, string formatting, and `print()` logging all in one function. Split into: `calculate_booking_cost(booking) -> dict` (pure calculation, returns numbers) and `format_booking_receipt(cost_data) -> str` (formatting only). Remove all `print()` calls.

**Edge Forge Spec:**
- Generate `process_booking(booking)` that interleaves `total = price * nights`, `print(f"Processing...")`, `receipt = f"₹{total}"` in one function.
- Flaw: mixed concerns.

**Tests:**
- `calculate_booking_cost({"nights": 3, "rate": 150})` → `{"subtotal": 450, "tax": 81.0, "total": 531.0}` (returns numeric dict, no strings)
- `format_booking_receipt({"subtotal": 450, "tax": 81.0, "total": 531.0})` → formatted string
- No `print()` calls in final code.

---

### Capsule 13: Standardize AI Output Schema

**Domain:** ShelfTrack
**Difficulty:** Medium
**Function:** Multiple inventory functions → standardized `InventoryResult` dict

**Learner Prompt:**
AI-generated inventory functions return wildly different shapes: one returns a tuple, another returns a raw number, a third returns a dict with different keys. Standardize all to return `{"item": str, "quantity": int, "status": str, "value": float}`. Refactor all functions while keeping calculations unchanged.

**Edge Forge Spec:**
- Generate `check_stock()` returning `(name, qty)`, `get_value()` returning a float, `audit_item()` returning `{"sku": ..., "count": ...}`.
- Flaw: inconsistent return types.

**Tests:**
- All three functions return dicts with exactly keys `["item", "quantity", "status", "value"]`.
- Calculation results unchanged from originals.

---

## Phase 4: Optimize Performance (Capsules 14–16)

### Capsule 14: Optimize Nested Loops in Inventory Lookup

**Domain:** ShelfTrack
**Difficulty:** Hard
**Function:** `match_orders_to_stock(orders: list[dict], inventory: list[dict]) -> list[dict]`

**Learner Prompt:**
The AI uses nested loops to match orders to inventory items — O(n²) behavior that breaks on large catalogs. Replace the inner loop with a dictionary-based lookup for O(n) performance.

**Edge Forge Spec:**
- Generate nested `for order in orders: for item in inventory: if order["sku"] == item["sku"]`.
- Flaw: O(n²) when a dict index would give O(n).

**Tests:**
- `match_orders_to_stock([{"sku": "A1", "qty": 2}], [{"sku": "A1", "stock": 10}])` → `[{"sku": "A1", "qty": 2, "available": True}]`
- Works correctly for 1000+ items (performance, not just correctness).
- Missing SKU → `{"sku": "X1", "available": False}`

---

### Capsule 15: Cache AI Tax Computations

**Domain:** PayFlow
**Difficulty:** Medium
**Function:** `get_tax_bracket(salary: float) -> dict` with caching

**Learner Prompt:**
The AI recomputes the same tax bracket lookup for identical salary ranges over and over. Add a dictionary-based cache keyed by salary. If the same salary is passed again, return the cached result.

**Edge Forge Spec:**
- Generate `get_tax_bracket(salary)` called repeatedly with same inputs, no cache.
- Flaw: redundant computation.

**Tests:**
- `get_tax_bracket(50000)` → `{"bracket": "B", "rate": 0.20}` (first call computes)
- `get_tax_bracket(50000)` → same result (second call uses cache)
- Cache is accessible and contains the computed entries.

---

### Capsule 16: Optimize Employee Lookup by ID

**Domain:** PayFlow
**Difficulty:** Medium
**Function:** `build_employee_index(employees: list[dict]) -> dict` and `find_employee(index: dict, emp_id: str) -> dict`

**Learner Prompt:**
The AI repeatedly searches a list of employees by ID using a `for` loop. Build a dict index keyed by `employee_id` for O(1) lookups. Handle the "not found" case gracefully.

**Edge Forge Spec:**
- Generate list-based `find_employee(employees, emp_id)` using `for emp in employees: if emp["id"] == emp_id`.
- Flaw: O(n) per lookup instead of O(1).

**Tests:**
- `idx = build_employee_index([{"id": "E1", "name": "Alice"}, {"id": "E2", "name": "Bob"}])`
- `find_employee(idx, "E1")` → `{"id": "E1", "name": "Alice"}`
- `find_employee(idx, "E99")` → `None`

---

## Phase 5: Reliability and Safety (Capsules 17–20)

### Capsule 17: Handle AI Runtime Errors

**Domain:** PayFlow
**Difficulty:** Medium
**Function:** `safe_process_payslip(employee: dict) -> dict`

**Learner Prompt:**
The AI-generated payslip processor crashes on unexpected values (division by zero for hourly rate, KeyError for missing fields, TypeError for wrong types). Wrap risky operations in try/except blocks. Return structured error responses `{"status": "error", "reason": str}` instead of crashing.

**Edge Forge Spec:**
- Generate `safe_process_payslip(employee)` that can raise ZeroDivisionError, KeyError, TypeError.
- Flaw: no error handling at all.

**Tests:**
- `safe_process_payslip({"name": "A", "hours": 40, "rate": 25})` → `{"status": "ok", "net": ...}`
- `safe_process_payslip({"name": "B", "hours": 40, "rate": 0})` → `{"status": "error", "reason": "..."}`
- `safe_process_payslip({})` → `{"status": "error", "reason": "..."}` (no crash)

---

### Capsule 18: Validate Booking Inputs

**Domain:** BookNow
**Difficulty:** Medium
**Function:** `validate_booking(booking: dict) -> dict`

**Learner Prompt:**
The AI never validates input — negative night counts, empty guest names, and past dates all produce nonsense outputs. Add validation: `nights` must be >= 1, `guest_name` must be non-empty string, `guests` must be >= 1. Return `{"valid": True}` or `{"valid": False, "errors": list[str]}`.

**Edge Forge Spec:**
- Generate `validate_booking(booking)` with no validation, passes everything through.
- Flaw: accepts all inputs blindly.

**Tests:**
- `validate_booking({"guest_name": "Alice", "nights": 3, "guests": 2})` → `{"valid": True}`
- `validate_booking({"guest_name": "", "nights": -1, "guests": 0})` → `{"valid": False, "errors": ["guest_name must be non-empty", "nights must be >= 1", "guests must be >= 1"]}`
- `validate_booking({})` → `{"valid": False, "errors": [...]}`

---

### Capsule 19: Add Retry Logic to Flaky Processor

**Domain:** PayFlow
**Difficulty:** Hard
**Function:** `retry_process(func, args: dict, max_retries: int) -> dict`

**Learner Prompt:**
The AI gives up after the first transient failure. Add bounded retry logic: try calling `func(**args)`, if it raises an exception, retry up to `max_retries` times with exponential backoff delays (1, 2, 4, 8...). Return the result on success or a final error dict after all retries exhausted.

**Edge Forge Spec:**
- Generate `retry_process(func, args, max_retries)` that calls once and crashes on failure.
- Flaw: no retry, no backoff.
- Piston note: no actual `time.sleep()` — track delay values in the return dict instead of sleeping.

**Tests:**
- Given a func that fails twice then succeeds: `retry_process(flaky_fn, {}, 5)` → `{"status": "ok", "attempts": 3, "delays": [1, 2]}`
- Given a func that always fails: `retry_process(always_fail, {}, 3)` → `{"status": "error", "attempts": 3, "delays": [1, 2, 4]}`

---

### Capsule 20: Handle Edge Cases in Stock Levels

**Domain:** ShelfTrack
**Difficulty:** Medium
**Function:** `adjust_stock(item: dict, adjustment: int) -> dict`

**Learner Prompt:**
The AI only handles the normal case (positive stock, positive adjustment) and produces wrong results for: zero stock, negative adjustments that exceed current stock, extremely large values, and non-integer quantities. Add explicit handling per business rules: stock can never go below 0, adjustments must be integers, and max stock is 999999.

**Edge Forge Spec:**
- Generate `adjust_stock(item, adjustment)` that does `item["stock"] += adjustment` with no bounds checking.
- Flaw: allows negative stock, ignores type checks, no upper bound.

**Tests:**
- `adjust_stock({"sku": "A1", "stock": 10}, 5)` → `{"sku": "A1", "stock": 15, "status": "ok"}`
- `adjust_stock({"sku": "A1", "stock": 3}, -10)` → `{"sku": "A1", "stock": 0, "status": "clamped", "warning": "stock cannot go below 0"}`
- `adjust_stock({"sku": "A1", "stock": 999990}, 100)` → stock clamped at 999999
- `adjust_stock({"sku": "A1", "stock": 10}, 2.5)` → `{"error": "adjustment must be an integer"}`

---

## Phase 6: Secure AI Code (Capsules 21–23)

### Capsule 21: Fix SQL Injection in Employee Lookup

**Domain:** PayFlow
**Difficulty:** Hard
**Function:** `build_employee_query(employee_id: str) -> dict`

**Learner Prompt:**
The AI constructs SQL using f-string concatenation: `f"SELECT * FROM employees WHERE id = '{employee_id}'"`. Replace with a safe parameterized pattern that separates the query template from the parameters. Return `{"query": str, "params": tuple}` where the query uses `?` placeholders.

**Edge Forge Spec:**
- Generate `build_employee_query(employee_id)` using `f"SELECT * FROM employees WHERE id = '{employee_id}'"`.
- Flaw: SQL injection via string concatenation.
- Piston note: no actual DB — validate the returned query/params structure.

**Tests:**
- `build_employee_query("E001")` → `{"query": "SELECT * FROM employees WHERE id = ?", "params": ("E001",)}`
- `build_employee_query("'; DROP TABLE employees; --")` → same safe structure (injection payload is just a parameter value, not executed)
- Query string must NOT contain the actual employee_id value.

---

### Capsule 22: Remove eval() Risk in Inventory Formulas

**Domain:** ShelfTrack
**Difficulty:** Hard
**Function:** `calculate_formula(expression: str, variables: dict) -> dict`

**Learner Prompt:**
The AI uses `eval(expression)` to compute inventory pricing formulas from user input. Replace with a safe alternative: parse the expression manually, support only `+`, `-`, `*`, `/` with numeric values, and reject anything else. Use a whitelist-dispatch approach.

**Edge Forge Spec:**
- Generate `calculate_formula(expression, variables)` using `eval()`.
- Flaw: arbitrary code execution via `eval()`.

**Tests:**
- `calculate_formula("price * quantity", {"price": 10, "quantity": 5})` → `{"result": 50}`
- `calculate_formula("base + tax", {"base": 100, "tax": 18})` → `{"result": 118}`
- `calculate_formula("__import__('os').system('rm -rf /')", {})` → `{"error": "unsafe expression"}` (must NOT execute)
- `calculate_formula("price / quantity", {"price": 100, "quantity": 0})` → `{"error": "division by zero"}`

---

### Capsule 23: Sanitize Booking User Input

**Domain:** BookNow
**Difficulty:** Medium
**Function:** `sanitize_booking_input(raw: dict) -> dict`

**Learner Prompt:**
The AI logs and displays raw user input from booking forms without any sanitization — control characters, HTML-like tags, and excessively long strings pass through unfiltered. Add sanitization: strip control characters, normalize whitespace, remove anything between `<` and `>`, and truncate each string field to 200 characters max.

**Edge Forge Spec:**
- Generate `sanitize_booking_input(raw)` that passes all string values through unchanged.
- Flaw: no sanitization of user-provided strings.

**Tests:**
- `sanitize_booking_input({"name": "  Alice  ", "note": "Great <script>alert(1)</script> hotel"})` → `{"name": "Alice", "note": "Great  hotel"}`
- `sanitize_booking_input({"name": "A" * 500})` → name truncated to 200 chars
- `sanitize_booking_input({"name": "hello\x00world\x07"})` → control characters stripped

---

## Phase 7: Hallucination Detection (Capsules 24–25)

> **Why this phase exists:** The #1 failure mode of AI-generated code is inventing APIs, libraries, and methods that don't exist. These capsules teach learners to catch hallucinations before they hit production.

### Capsule 24: Detect Hallucinated Imports

**Domain:** PayFlow
**Difficulty:** Medium
**Function:** `detect_fake_imports(code_lines: list[str], known_modules: list[str]) -> list[dict]`

**Learner Prompt:**
The AI generated payroll code that imports `payflow_utils`, `salary_helpers`, and `tax_engine` — none of which exist. Write a function that scans code lines for `import X` and `from X import Y` statements, extracts the module names, and flags any that aren't in the known-valid list. Return a list of `{"line": int, "module": str, "status": "hallucinated"}` dicts.

**Edge Forge Spec:**
- Generate code with mix of real (`json`, `math`, `os`) and fake (`payflow_utils`, `employee_db`) imports.
- Learner writes the detector function from scratch (this capsule teaches building the tool, not fixing existing code).

**Tests:**
- Input: `["import json", "import payflow_utils", "from tax_engine import calc"]`, known: `["json", "math", "os"]`
- → `[{"line": 2, "module": "payflow_utils", "status": "hallucinated"}, {"line": 3, "module": "tax_engine", "status": "hallucinated"}]`
- `["import json", "import math"]` with known `["json", "math"]` → `[]`

---

### Capsule 25: Detect Phantom API Calls

**Domain:** ShelfTrack
**Difficulty:** Hard
**Function:** `detect_phantom_apis(code_str: str, valid_apis: list[str]) -> list[dict]`

**Learner Prompt:**
The AI generated inventory code calling `inventory.auto_rebalance()`, `shelf.predict_demand()`, and `stock.optimize()` — methods that don't exist in the ShelfTrack API. Write a function that scans code for function/method calls (pattern: `word(` or `word.word(`), extracts all unique call names, and flags any not in the valid API list.

**Edge Forge Spec:**
- Generate code with mix of valid calls (`len()`, `print()`, `dict.get()`) and phantom calls (`inventory.smart_sort()`, `stock.ml_predict()`).
- Learner builds detector function.

**Tests:**
- Input: `"result = inventory.auto_rebalance(items)\ncount = len(items)\nforecast = shelf.predict_demand()"`, valid: `["len", "print", "range", "dict.get"]`
- → `[{"call": "inventory.auto_rebalance", "status": "phantom"}, {"call": "shelf.predict_demand", "status": "phantom"}]`
- Code with only valid calls → `[]`

---

## Capstone (Capsule 26)

### Capsule 26: Full AI System Supervision — PayFlow Audit

**Domain:** PayFlow (with ShelfTrack and BookNow integration points)
**Difficulty:** Hard
**Function:** `audit_ai_system(modules: list[dict]) -> dict`

**Learner Prompt:**
You are the senior engineer responsible for the AI-generated PayFlow payroll system. It also integrates with ShelfTrack for employee equipment tracking and BookNow for corporate travel booking. The system contains 6–8 deliberately placed flaws across all categories you've learned:

- Logic bugs (boundary errors, mutation)
- Poor naming and duplication
- Performance issues (nested loops, missing cache)
- Missing validation and error handling
- Security vulnerabilities (SQL concat, eval)
- Hallucinated imports/APIs

Audit and fix all issues. Make the system correct, reliable, efficient, secure, and understandable.

**Edge Forge Spec:**
- Generate a multi-function module (~60–80 lines) with:
  - `calculate_payroll(employees)` — progressive tax bug + hardcoded secrets
  - `lookup_equipment(employee_id, inventory)` — O(n²) nested loop + hallucinated import
  - `book_travel(employee, booking)` — f-string SQL + no input validation
  - `generate_report(data)` — eval() usage + no error handling
- 6–8 flaws distributed across categories.

**Tests:**
- Normal input produces correct payroll output.
- Edge cases (zero salary, missing fields, injection payloads) handled gracefully.
- No `eval()`, no f-string SQL, no hallucinated imports in final code.
- All functions produce consistent output schemas.
- Score starts at 100, deducts 15 per unfixed issue.

---

## Appendix: Changes from v1 → v2

### Structural Changes

| Change | Reason |
|--------|--------|
| 29 → 26 capsules (25 + capstone) | Closer to 25-capsule launch target |
| Merged Capsules v1-1 + v1-2 (both "rename for clarity") | Eliminated redundancy |
| Merged Capsules v1-12 + v1-13 (both "deduplicate/rename") | Eliminated redundancy |
| Cut v1-17 (Reduce Memory) | Can't verify memory usage in Piston |
| Cut v1-19 (Batch Processing) | Overlapped with v1-17 optimization pattern |
| Added Phase 7: Hallucination Detection (2 capsules) | #1 real-world AI supervision skill was missing |
| Expanded domains from 1 to 3 | Prevent payroll fatigue after 15+ capsules |

### Domain Distribution

| Phase | PayFlow | ShelfTrack | BookNow |
|-------|---------|------------|---------|
| 1: Read & Understand | 2 | 1 | 1 |
| 2: Fix Logic Bugs | 3 | 1 | 1 |
| 3: Refactor | 2 | 1 | 1 |
| 4: Optimize | 2 | 1 | — |
| 5: Reliability | 2 | 1 | 1 |
| 6: Security | 1 | 1 | 1 |
| 7: Hallucination | 1 | 1 | — |
| Capstone | 1 (all 3) | — | — |
| **Total** | **14** | **7** | **5** |

### Metadata Added to Every Capsule

- ✅ Difficulty rating (Easy / Medium / Hard)
- ✅ Function signature with type hints
- ✅ Learner-facing prompt (what the learner sees)
- ✅ Edge Forge spec (what the system generates)
- ✅ Concrete test cases (input → output)
- ✅ Piston compatibility notes where needed

### Piston Constraints Clarified

- All testing via `assert` statements only (no `unittest` module)
- No `time.sleep()` — retry delays tracked as data, not executed
- No memory profiling — removed memory-focused capsule
- No real DB — SQL capsules validate query/params structure
- Generated code kept under 80 lines per capsule
- No network calls — all external APIs are mock/hardcoded

---

## Positioning for Learners

**Headline:**
"You already use AI to write code. Now learn to supervise it."

**Promise:**
By the end of this track, you won't just trust AI blindly — you'll know how to read its code, spot subtle bugs and risks, and fix them before they hit production.

**What makes this different:**
You won't practice on toy examples. You'll audit code across three real-world systems — payroll, inventory, and bookings — because the skill of supervision must transfer across domains, not just one codebase.
