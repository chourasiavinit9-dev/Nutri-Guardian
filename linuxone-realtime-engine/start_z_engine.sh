#!/usr/bin/env bash
# ==============================================================================
# start_z_engine.sh — Nutri-Guardian Z IBM LinuxONE (s390x) Engine Bootstrap
# IBM Z Datathon 2026 — Theme 01: Real-Time AI for Critical Decisions
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODEL_FILE="${SCRIPT_DIR}/nutri_z_realtime_model.joblib"
HOST="${Z_ENGINE_HOST:-0.0.0.0}"
PORT="${Z_ENGINE_PORT:-8000}"
WORKERS="${Z_ENGINE_WORKERS:-4}"

echo "============================================================"
echo "  Nutri-Guardian Z — IBM LinuxONE (s390x) Engine Bootstrap"
echo "============================================================"
echo "  Architecture : $(uname -m)"
echo "  CPU Cores    : $(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 'unknown')"
echo "  Host:Port    : ${HOST}:${PORT}"
echo "============================================================"

# Step 1: Activate virtual environment if present
if [ -f "${SCRIPT_DIR}/venv/bin/activate" ]; then
    echo "  [1/4] Activating virtual environment ..."
    source "${SCRIPT_DIR}/venv/bin/activate"
else
    echo "  [1/4] No venv found — using system Python"
fi

# Step 2: Install dependencies
echo "  [2/4] Installing s390x-compatible dependencies ..."
pip install --quiet -r "${SCRIPT_DIR}/requirements.txt"

# Step 3: Train model if .joblib is missing
if [ ! -f "${MODEL_FILE}" ]; then
    echo "  [3/4] Model not found — training Nutri-Guardian Z model on s390x ..."
    echo "        This may take 60–120 seconds depending on core count."
    python "${SCRIPT_DIR}/train_realtime_s390x_model.py"
    echo "  [3/4] Training complete."
else
    echo "  [3/4] Model found (${MODEL_FILE}) — skipping training."
fi

# Step 4: Launch FastAPI / Uvicorn
echo "  [4/4] Launching Uvicorn on ${HOST}:${PORT} with ${WORKERS} workers ..."
echo "        API docs: http://${HOST}:${PORT}/docs"
echo "        Telemetry: http://${HOST}:${PORT}/api/z-telemetry"
echo "        Stream: http://${HOST}:${PORT}/api/z-stream-vitals"
echo "============================================================"

cd "${SCRIPT_DIR}"
exec uvicorn main:app \
    --host "${HOST}" \
    --port "${PORT}" \
    --workers "${WORKERS}" \
    --loop asyncio \
    --log-level info \
    --access-log
