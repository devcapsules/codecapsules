#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# CodeCapsule — Azure VMSS Deployment
#
# Creates a Virtual Machine Scale Set running Piston behind Cloudflare Tunnel.
# VMs have NO public IPs — all traffic flows through the tunnel.
#
# Architecture:
#   Cloudflare Worker → Cloudflare Tunnel → Azure VMSS → Piston (port 2000)
#
# Prerequisites:
#   - Azure CLI installed and logged in (az login)
#   - Cloudflare Tunnel created (run setup-tunnel.sh first)
#   - Tunnel token from setup-tunnel.sh output
#
# Usage:
#   chmod +x deploy-azure.sh
#   ./deploy-azure.sh <TUNNEL_ID> <ACCOUNT_TAG> <TUNNEL_SECRET> <TUNNEL_HOSTNAME>
#
# Budget: ~$36/month for 1x Standard_B2as_v2 (2 vCPU, 8 GB RAM)
#         Auto-scales to 5x under load (~$180/month peak)
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Validate Input ────────────────────────────────────────────────────────────
if [ $# -lt 4 ]; then
  echo "Usage: $0 <TUNNEL_ID> <ACCOUNT_TAG> <TUNNEL_SECRET> <TUNNEL_HOSTNAME>"
  echo ""
  echo "Get these values from: cloudflared tunnel create / .cloudflared/*.json"
  exit 1
fi

TUNNEL_ID="$1"
ACCOUNT_TAG="$2"
TUNNEL_SECRET="$3"
TUNNEL_HOSTNAME="$4"

# ── Configuration ─────────────────────────────────────────────────────────────
RESOURCE_GROUP="codecapsule-rg"
LOCATION="centralindia"              # Closest to us, Mumbai PoPs
VMSS_NAME="codecapsule-piston"
VNET_NAME="codecapsule-vnet"
SUBNET_NAME="piston-subnet"
NSG_NAME="piston-nsg"
VM_SIZE="Standard_B2as_v2"            # 2 vCPU, 8 GB RAM (~$36/month)
VM_IMAGE="Ubuntu2204"                # Ubuntu 22.04 LTS
ADMIN_USER="codecapsule"
MIN_INSTANCES=1
MAX_INSTANCES=5
INITIAL_INSTANCES=1
SCALE_UP_CPU=70                      # Scale up when CPU > 70%
SCALE_DOWN_CPU=30                    # Scale down when CPU < 30%

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "═══════════════════════════════════════════════════════════"
echo "  CodeCapsule — Azure VMSS Deployment"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  Resource Group:  ${RESOURCE_GROUP}"
echo "  Location:        ${LOCATION}"
echo "  VM Size:         ${VM_SIZE}"
echo "  Scale Range:     ${MIN_INSTANCES}–${MAX_INSTANCES} instances"
echo ""

# ── Step 1: Resource Group ────────────────────────────────────────────────────
echo "[1/7] Creating Resource Group: ${RESOURCE_GROUP}"
az group create \
  --name "${RESOURCE_GROUP}" \
  --location "${LOCATION}" \
  --output none
echo "  ✓ Resource Group created"

# ── Step 2: Virtual Network + Subnet ─────────────────────────────────────────
echo "[2/7] Creating VNet: ${VNET_NAME} (10.0.0.0/16)"
az network vnet create \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${VNET_NAME}" \
  --address-prefix "10.0.0.0/16" \
  --subnet-name "${SUBNET_NAME}" \
  --subnet-prefix "10.0.1.0/24" \
  --output none
echo "  ✓ VNet + Subnet created"

# ── Step 3: Network Security Group (DENY all inbound) ────────────────────────
echo "[3/7] Creating NSG: ${NSG_NAME} (deny all inbound from internet)"
az network nsg create \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${NSG_NAME}" \
  --output none

# Explicit deny-all inbound from internet
az network nsg rule create \
  --resource-group "${RESOURCE_GROUP}" \
  --nsg-name "${NSG_NAME}" \
  --name "DenyAllInternetInbound" \
  --priority 4096 \
  --direction Inbound \
  --access Deny \
  --protocol "*" \
  --source-address-prefixes "Internet" \
  --destination-address-prefixes "*" \
  --destination-port-ranges "*" \
  --output none

# Associate NSG with subnet
az network vnet subnet update \
  --resource-group "${RESOURCE_GROUP}" \
  --vnet-name "${VNET_NAME}" \
  --name "${SUBNET_NAME}" \
  --network-security-group "${NSG_NAME}" \
  --output none
echo "  ✓ NSG created and associated (no public inbound traffic allowed)"

# ── Step 4: Render cloud-init with tunnel token ──────────────────────────────
echo "[4/7] Rendering cloud-init with tunnel token..."
CLOUD_INIT_TEMPLATE="${SCRIPT_DIR}/cloud-init.yaml"
CLOUD_INIT_RENDERED="/tmp/codecapsule-cloud-init-rendered.yaml"

if [ ! -f "${CLOUD_INIT_TEMPLATE}" ]; then
  echo "  ERROR: cloud-init.yaml not found at ${CLOUD_INIT_TEMPLATE}"
  exit 1
fi

sed -e "s|__TUNNEL_ID__|${TUNNEL_ID}|g" \
    -e "s|__ACCOUNT_TAG__|${ACCOUNT_TAG}|g" \
    -e "s|__TUNNEL_SECRET__|${TUNNEL_SECRET}|g" \
    -e "s|__TUNNEL_HOSTNAME__|${TUNNEL_HOSTNAME}|g" \
    "${CLOUD_INIT_TEMPLATE}" > "${CLOUD_INIT_RENDERED}"
echo "  ✓ cloud-init rendered (tunnel credentials injected)"

# ── Step 5: Create VMSS ──────────────────────────────────────────────────────
echo "[5/7] Creating VMSS: ${VMSS_NAME} (${VM_SIZE} × ${INITIAL_INSTANCES})"
echo "  This may take 2–3 minutes..."
az vmss create \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${VMSS_NAME}" \
  --image "${VM_IMAGE}" \
  --vm-sku "${VM_SIZE}" \
  --instance-count "${INITIAL_INSTANCES}" \
  --vnet-name "${VNET_NAME}" \
  --subnet "${SUBNET_NAME}" \
  --public-ip-address "" \
  --custom-data "${CLOUD_INIT_RENDERED}" \
  --admin-username "${ADMIN_USER}" \
  --generate-ssh-keys \
  --orchestration-mode "Flexible" \
  --output none
echo "  ✓ VMSS created"

# ── Step 6: Configure Auto-Scale ─────────────────────────────────────────────
echo "[6/7] Configuring auto-scale (${MIN_INSTANCES}–${MAX_INSTANCES} instances)"

# Get VMSS resource ID
VMSS_ID=$(az vmss show \
  --resource-group "${RESOURCE_GROUP}" \
  --name "${VMSS_NAME}" \
  --query "id" --output tsv)

# Create autoscale profile
az monitor autoscale create \
  --resource-group "${RESOURCE_GROUP}" \
  --resource "${VMSS_ID}" \
  --min-count "${MIN_INSTANCES}" \
  --max-count "${MAX_INSTANCES}" \
  --count "${INITIAL_INSTANCES}" \
  --name "${VMSS_NAME}-autoscale" \
  --output none

# Scale UP rule: CPU > 70% for 3 minutes → add 1 instance
az monitor autoscale rule create \
  --resource-group "${RESOURCE_GROUP}" \
  --autoscale-name "${VMSS_NAME}-autoscale" \
  --condition "Percentage CPU > ${SCALE_UP_CPU} avg 3m" \
  --scale out 1 \
  --cooldown 5 \
  --output none

# Scale DOWN rule: CPU < 30% for 5 minutes → remove 1 instance
az monitor autoscale rule create \
  --resource-group "${RESOURCE_GROUP}" \
  --autoscale-name "${VMSS_NAME}-autoscale" \
  --condition "Percentage CPU < ${SCALE_DOWN_CPU} avg 5m" \
  --scale in 1 \
  --cooldown 5 \
  --output none

echo "  ✓ Auto-scale configured"
echo "    Scale UP:   CPU > ${SCALE_UP_CPU}% for 3 min → +1 instance"
echo "    Scale DOWN: CPU < ${SCALE_DOWN_CPU}% for 5 min → -1 instance"

# ── Step 7: Cleanup ──────────────────────────────────────────────────────────
echo "[7/7] Cleaning up temporary files..."
rm -f "${CLOUD_INIT_RENDERED}"
echo "  ✓ Cleanup done"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  DEPLOYMENT COMPLETE"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  VMSS:          ${VMSS_NAME}"
echo "  Instances:     ${INITIAL_INSTANCES} (scales to ${MAX_INSTANCES})"
echo "  VM Size:       ${VM_SIZE} (2 vCPU, 8 GB RAM)"
echo "  Public IPs:    NONE (all traffic via Cloudflare Tunnel)"
echo ""
echo "  ⏳ VMs will take ~5 minutes to fully initialize:"
echo "     1. Docker Engine install      (~1 min)"
echo "     2. Piston container build     (~2 min)"
echo "     3. Language runtime install   (~2 min)"
echo "     4. cloudflared tunnel connect (~30 sec)"
echo ""
echo "  MONITOR:"
echo "    az vmss list-instances -g ${RESOURCE_GROUP} -n ${VMSS_NAME} -o table"
echo ""
echo "  VERIFY (after 5 min):"
echo "    curl -s https://tunnel.devcapsules.com/api/v2/runtimes | jq ."
echo ""
echo "  TEST EXECUTION:"
echo "    curl -s -X POST https://devcapsules-api.devleep-edu.workers.dev/api/execute \\"
echo '      -H "Content-Type: application/json" \'
echo '      -d '\''{"source_code":"print(42)","language":"python"}'\'''
echo ""
