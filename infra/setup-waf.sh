#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# DevCapsules — WAF Custom Rules Setup
#
# Creates two WAF custom rules for the devcapsules.com zone:
# 1. Block oversized payloads to /execute (>1MB body)
# 2. Rate limit /execute endpoint (60 req/10s per IP)
#
# PREREQUISITES:
#   Create an API Token at https://dash.cloudflare.com/profile/api-tokens
#   with permissions:  Zone > Firewall Services > Edit
#   Scope:             devcapsules.com
#
# USAGE:
#   export CF_API_TOKEN="your-token-here"
#   bash infra/setup-waf.sh
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

ZONE_ID="ae991b5832ec8aa3a9ddfd93a8c988b3"
API_BASE="https://api.cloudflare.com/client/v4"

if [ -z "${CF_API_TOKEN:-}" ]; then
  echo "ERROR: CF_API_TOKEN not set."
  echo "Create one at: https://dash.cloudflare.com/profile/api-tokens"
  echo "Required permissions: Zone > Firewall Services > Edit"
  exit 1
fi

AUTH_HEADER="Authorization: Bearer $CF_API_TOKEN"

echo "=== DevCapsules WAF Setup ==="
echo "Zone: devcapsules.com ($ZONE_ID)"
echo ""

# ─── Rule 1: Block oversized payloads on /execute ─────────────────────────────
echo "Creating Rule 1: Block large payloads on /execute..."

RULE1_RESULT=$(curl -s -X POST "$API_BASE/zones/$ZONE_ID/rulesets" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "DevCapsules: Execute Endpoint Protection",
    "kind": "zone",
    "phase": "http_request_firewall_custom",
    "rules": [
      {
        "action": "block",
        "expression": "(http.request.uri.path contains \"/execute\" and http.request.body.size gt 1048576)",
        "description": "Block requests to /execute with body > 1MB",
        "enabled": true
      },
      {
        "action": "block",
        "expression": "(http.request.uri.path contains \"/execute\" and not http.request.method in {\"POST\" \"OPTIONS\"})",
        "description": "Block non-POST/OPTIONS requests to /execute",
        "enabled": true
      },
      {
        "action": "block",
        "expression": "(http.request.uri.path contains \"/generate\" and http.request.body.size gt 524288)",
        "description": "Block requests to /generate with body > 512KB",
        "enabled": true
      }
    ]
  }')

if echo "$RULE1_RESULT" | grep -q '"success":true'; then
  RULE1_ID=$(echo "$RULE1_RESULT" | python3 -c "import sys,json;print(json.load(sys.stdin)['result']['id'])")
  echo "  ✓ Created ruleset: $RULE1_ID"
else
  echo "  ✗ Failed to create ruleset:"
  echo "$RULE1_RESULT" | python3 -m json.tool 2>/dev/null || echo "$RULE1_RESULT"
  echo ""
  echo "  NOTE: If a custom ruleset already exists in this phase, you need to"
  echo "  update the existing one with PUT instead. Check existing rulesets with:"
  echo "  curl -s '$API_BASE/zones/$ZONE_ID/rulesets' -H '$AUTH_HEADER'"
fi

echo ""

# ─── Rule 2: Rate limit /execute per IP ───────────────────────────────────────
echo "Creating Rule 2: Rate limit /execute (60 req / 10s per IP)..."

RULE2_RESULT=$(curl -s -X POST "$API_BASE/zones/$ZONE_ID/rulesets/phases/http_ratelimit/entrypoint" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "DevCapsules: Execute Rate Limit",
    "rules": [
      {
        "action": "block",
        "ratelimit": {
          "characteristics": ["cf.colo.id", "ip.src"],
          "period": 10,
          "requests_per_period": 60,
          "mitigation_timeout": 30
        },
        "expression": "(http.request.uri.path contains \"/execute\" and http.request.method eq \"POST\")",
        "description": "Rate limit /execute: 60 req/10s per IP, block 30s",
        "enabled": true
      },
      {
        "action": "block",
        "ratelimit": {
          "characteristics": ["cf.colo.id", "ip.src"],
          "period": 60,
          "requests_per_period": 10,
          "mitigation_timeout": 120
        },
        "expression": "(http.request.uri.path contains \"/generate\" and http.request.method eq \"POST\")",
        "description": "Rate limit /generate: 10 req/60s per IP, block 120s",
        "enabled": true
      }
    ]
  }')

if echo "$RULE2_RESULT" | grep -q '"success":true'; then
  RULE2_ID=$(echo "$RULE2_RESULT" | python3 -c "import sys,json;print(json.load(sys.stdin)['result']['id'])")
  echo "  ✓ Created rate limit ruleset: $RULE2_ID"
else
  echo "  ✗ Failed to create rate limit ruleset:"
  echo "$RULE2_RESULT" | python3 -m json.tool 2>/dev/null || echo "$RULE2_RESULT"
fi

echo ""
echo "=== WAF Setup Complete ==="
echo ""
echo "Rules created:"
echo "  1. Block /execute body > 1MB"
echo "  2. Block non-POST/OPTIONS on /execute"  
echo "  3. Block /generate body > 512KB"
echo "  4. Rate limit /execute: 60 req/10s per IP (30s block)"
echo "  5. Rate limit /generate: 10 req/60s per IP (120s block)"
echo ""
echo "Verify at: https://dash.cloudflare.com/$ZONE_ID/security/waf/custom-rules"
