#!/bin/bash
PORT=${PORT:-3001}
echo "Stopping DF Satellite on port $PORT..."

# Try fuser if available
if command -v fuser >/dev/null 2>&1; then
  fuser -k ${PORT}/tcp 2>/dev/null || true
fi

# Try lsof if available
if command -v lsof >/dev/null 2>&1; then
  PIDS=$(lsof -ti :${PORT} 2>/dev/null)
  if [ -n "$PIDS" ]; then
    echo "$PIDS" | xargs kill -9 2>/dev/null || true
  fi
fi

# Try ss / netstat
if command -v ss >/dev/null 2>&1; then
  SS_PIDS=$(ss -lptn "sport = :${PORT}" 2>/dev/null | grep -o 'pid=[0-9]*' | cut -d= -f2)
  if [ -n "$SS_PIDS" ]; then
    echo "$SS_PIDS" | xargs kill -9 2>/dev/null || true
  fi
fi

# Try pkill fallback for next server matching port
pkill -f "next.*-p.*${PORT}" 2>/dev/null || true

echo "DF Satellite service on port $PORT stopped."
