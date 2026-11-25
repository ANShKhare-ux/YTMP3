#!/usr/bin/env bash
# ===================================================
#   SonicWave Media Converter Launcher for macOS/Linux
# ===================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "==================================================="
echo "    Starting SonicWave YouTube to MP3 Converter    "
echo "==================================================="
echo ""

# Check for Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js is required to run SonicWave."
    echo "On macOS with Homebrew installed, run:"
    echo "    brew install node"
    echo "Or download the official macOS installer from:"
    echo "    https://nodejs.org/"
    echo ""
    echo "Once installed, run ./start.sh again."
    exit 1
fi

# Check for npm
if ! command -v npm >/dev/null 2>&1; then
    echo "[ERROR] npm was not found in your system PATH."
    echo "Please ensure Node.js and npm are properly installed."
    exit 1
fi

# Helper to open browser cross-platform (macOS 'open', Linux 'xdg-open')
open_browser() {
    local url="$1"
    if command -v open >/dev/null 2>&1; then
        open "$url"
    elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$url"
    else
        echo "Please open your browser and navigate to: $url"
    fi
}

# Check backend dependencies
BACKEND_DEPS=0
if [ -d "server/node_modules" ] || [ -d "node_modules" ]; then
    BACKEND_DEPS=1
fi

if [ "$BACKEND_DEPS" -eq 0 ]; then
    echo "[Setup] Installing backend dependencies..."
    (cd "$DIR/server" && npm install)
fi

# Cleanup on exit handler
cleanup() {
    echo ""
    echo "[SonicWave] Stopping services..."
    if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
        kill "$SERVER_PID" 2>/dev/null || true
    fi
    if [ -n "$CLIENT_PID" ] && kill -0 "$CLIENT_PID" 2>/dev/null; then
        kill "$CLIENT_PID" 2>/dev/null || true
    fi
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Standalone Packaged Release Mode
if [ -f "client/dist/index.html" ] && [ ! -d "client/node_modules" ]; then
    echo "[Mode] Standalone Desktop Package detected."
    FREE_PORT=$(node -e "
      const net = require('net');
      const start = Number(process.env.PORT) || 3001;
      function probe(p) {
        const s = net.createServer();
        s.once('error', () => probe(p + 1));
        s.listen(p, '127.0.0.1', () => {
          const picked = s.address().port;
          s.close(() => { process.stdout.write(String(picked)); });
        });
      }
      probe(start);
    " 2>/dev/null || echo "3001")
    export PORT="${FREE_PORT:-3001}"
    echo "Starting SonicWave Engine on Port $PORT..."
    (cd "$DIR/server" && PORT="$PORT" npm start) &
    SERVER_PID=$!

    echo ""
    echo "==================================================="
    echo "  SonicWave Converter Studio is launching!"
    echo "  Opening Converter Studio: http://localhost:$PORT/#app"
    echo "==================================================="
    echo ""

    sleep 2
    open_browser "http://localhost:$PORT/#app"
    wait "$SERVER_PID"
    exit 0
fi

# Development Mode with Hot Reload
if [ ! -d "client/node_modules" ]; then
    echo "[Setup] Installing frontend dependencies..."
    (cd "$DIR/client" && npm install)
fi

echo "Starting Backend API Server on Port 3001..."
(cd "$DIR/server" && npm run dev) &
SERVER_PID=$!

echo "Starting Frontend Web App on Port 5173..."
(cd "$DIR/client" && npm run dev) &
CLIENT_PID=$!

echo ""
echo "==================================================="
echo "  Both services are launching!"
echo "  Opening SonicWave Website: http://localhost:5173"
echo "==================================================="
echo ""

sleep 3
open_browser "http://localhost:5173"

wait "$SERVER_PID" "$CLIENT_PID"
