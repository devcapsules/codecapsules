#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Build & Push DevCapsules Custom Piston Image
#
# This script:
#   1. Copies CSV datasets from dashboard/public/ into the build context
#   2. Builds the custom Piston Docker image with baked-in datasets
#   3. Optionally pushes to Azure Container Registry (ACR)
#
# Usage:
#   ./build-piston.sh                          # Build locally only
#   ./build-piston.sh --push <registry_name>   # Build & push to ACR
#
# Examples:
#   ./build-piston.sh
#   ./build-piston.sh --push devcapsulesacr
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BUILD_DIR="${SCRIPT_DIR}"
IMAGE_NAME="devcapsules-piston"
IMAGE_TAG="latest"

echo "═══════════════════════════════════════════════════════════"
echo "  DevCapsules — Custom Piston Image Builder"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ── Step 1: Copy CSV datasets into the build context ─────────────────────────
DATASET_SRC="${REPO_ROOT}/apps/dashboard/public"
echo "[1/3] Copying datasets into build context..."

for csv in apple_global_sales_dataset.csv spotify-tracks-dataset.csv; do
  if [ ! -f "${DATASET_SRC}/${csv}" ]; then
    echo "  ERROR: ${DATASET_SRC}/${csv} not found!"
    echo "  Make sure the CSV files exist in apps/dashboard/public/"
    exit 1
  fi
  cp "${DATASET_SRC}/${csv}" "${BUILD_DIR}/${csv}"
  SIZE=$(wc -l < "${BUILD_DIR}/${csv}")
  echo "  ✓ ${csv} (${SIZE} rows)"
done

# ── Step 2: Build the Docker image ──────────────────────────────────────────
echo ""
echo "[2/3] Building Docker image: ${IMAGE_NAME}:${IMAGE_TAG}"
docker build \
  -t "${IMAGE_NAME}:${IMAGE_TAG}" \
  -f "${BUILD_DIR}/Dockerfile.piston" \
  "${BUILD_DIR}"

echo "  ✓ Image built: ${IMAGE_NAME}:${IMAGE_TAG}"

# ── Step 3: Push to ACR (optional) ──────────────────────────────────────────
if [ "${1:-}" = "--push" ] && [ -n "${2:-}" ]; then
  REGISTRY="${2}"
  FULL_TAG="${REGISTRY}.azurecr.io/${IMAGE_NAME}:${IMAGE_TAG}"

  echo ""
  echo "[3/3] Pushing to Azure Container Registry: ${FULL_TAG}"

  # Login to ACR
  az acr login --name "${REGISTRY}" 2>/dev/null || {
    echo "  WARNING: az acr login failed — trying docker login instead"
    docker login "${REGISTRY}.azurecr.io"
  }

  # Tag and push
  docker tag "${IMAGE_NAME}:${IMAGE_TAG}" "${FULL_TAG}"
  docker push "${FULL_TAG}"

  echo "  ✓ Pushed: ${FULL_TAG}"
else
  echo ""
  echo "[3/3] Skipping push (use --push <registry_name> to push to ACR)"
fi

# ── Cleanup: remove copied CSVs from build context ──────────────────────────
echo ""
echo "Cleaning up build context..."
rm -f "${BUILD_DIR}/apple_global_sales_dataset.csv"
rm -f "${BUILD_DIR}/spotify-tracks-dataset.csv"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✓ Done! Image: ${IMAGE_NAME}:${IMAGE_TAG}"
echo ""
echo "  To test locally:"
echo "    docker run --rm -p 2000:2000 --privileged ${IMAGE_NAME}:${IMAGE_TAG}"
echo "    # Verify datasets:"
echo "    docker run --rm ${IMAGE_NAME}:${IMAGE_TAG} ls -la /piston/datasets/"
echo "═══════════════════════════════════════════════════════════"
