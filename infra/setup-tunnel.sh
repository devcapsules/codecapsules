#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# CodeCapsule — Cloudflare Tunnel Setup
#
# Creates a Cloudflare Tunnel that routes traffic from Workers to Azure VMs.
# VMs have NO public IPs — all traffic flows through this tunnel.
#
# Prerequisites:
#   - cloudflared CLI installed (https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
#   - Authenticated: cloudflared login
#   - A domain configured in Cloudflare (e.g., devcapsules.com)
#
# Usage:
#   chmod +x setup-tunnel.sh
#   ./setup-tunnel.sh
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

TUNNEL_NAME="codecapsule-piston"
TUNNEL_HOSTNAME="tunnel.devcapsules.com"

echo "═══════════════════════════════════════════════════════════"
echo "  CodeCapsule — Cloudflare Tunnel Setup"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ── Step 1: Create Tunnel ─────────────────────────────────────────────────────
echo "[1/4] Creating Cloudflare Tunnel: ${TUNNEL_NAME}"
cloudflared tunnel create "${TUNNEL_NAME}"
echo ""

# ── Step 2: Get Tunnel ID ─────────────────────────────────────────────────────
echo "[2/4] Retrieving Tunnel ID..."
TUNNEL_ID=$(cloudflared tunnel info "${TUNNEL_NAME}" 2>&1 | grep -oP '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1)
echo "  Tunnel ID: ${TUNNEL_ID}"
echo ""

# ── Step 3: Create DNS Route ──────────────────────────────────────────────────
echo "[3/4] Creating DNS CNAME: ${TUNNEL_HOSTNAME} → ${TUNNEL_ID}.cfargotunnel.com"
cloudflared tunnel route dns "${TUNNEL_NAME}" "${TUNNEL_HOSTNAME}"
echo ""

# ── Step 4: Get Tunnel Token ──────────────────────────────────────────────────
echo "[4/4] Generating Tunnel Token (used by Azure VMs to connect)..."
TUNNEL_TOKEN=$(cloudflared tunnel token "${TUNNEL_NAME}")
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "  TUNNEL CREATED SUCCESSFULLY"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  Tunnel Name:  ${TUNNEL_NAME}"
echo "  Tunnel ID:    ${TUNNEL_ID}"
echo "  Hostname:     ${TUNNEL_HOSTNAME}"
echo ""
echo "  ┌─────────────────────────────────────────────────┐"
echo "  │  SAVE THIS TOKEN — needed for Azure VM deploy:  │"
echo "  └─────────────────────────────────────────────────┘"
echo ""
echo "  ${TUNNEL_TOKEN}"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "NEXT STEPS:"
echo ""
echo "  1. Go to Cloudflare Zero Trust Dashboard:"
echo "     https://one.dash.cloudflare.com → Networks → Tunnels"
echo ""
echo "  2. Click on '${TUNNEL_NAME}' → Public Hostname tab"
echo ""
echo "  3. Add a public hostname:"
echo "     Subdomain: tunnel"
echo "     Domain:    devcapsules.com"
echo "     Service:   http://localhost:2000"
echo ""
echo "  4. Deploy Azure VMs with this token:"
echo "     ./deploy-azure.sh ${TUNNEL_TOKEN}"
echo ""
