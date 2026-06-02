#!/usr/bin/env bash
# Boot all three apps in parallel. Each writes to its own log file under /tmp.
# Ctrl-C cleans up everything.

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Make sure deps are installed.
for app in server patient-sim nurse-dashboard; do
  if [ ! -d "$ROOT/$app/node_modules" ]; then
    echo "Installing deps for $app..."
    (cd "$ROOT/$app" && npm install)
  fi
done

# Clean shutdown.
PIDS=()
trap 'echo "Stopping..."; kill ${PIDS[@]} 2>/dev/null; exit' INT TERM

echo ""
echo "Starting SENSORA stack..."
echo ""

(cd "$ROOT/server"          && npm start         2>&1 | sed 's/^/[server  ] /') &
PIDS+=($!)

(cd "$ROOT/patient-sim"     && npm run dev       2>&1 | sed 's/^/[patient ] /') &
PIDS+=($!)

(cd "$ROOT/nurse-dashboard" && npm run dev       2>&1 | sed 's/^/[nurse   ] /') &
PIDS+=($!)

echo ""
echo "  server  → http://localhost:3001"
echo "  patient → http://localhost:5173"
echo "  nurse   → http://localhost:5174"
echo ""
echo "Ctrl-C to stop all."
echo ""

wait
