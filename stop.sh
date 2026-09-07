#!/bin/bash
PORT=${PORT:-3001}
echo "Stopping DF Satellite on port $PORT..."
fuser -k $PORT/tcp 2>/dev/null || true
echo "DF Satellite stopped."
