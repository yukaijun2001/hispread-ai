#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -f .env ]]; then set -a; source .env; set +a;
elif [[ -f backend/.env ]]; then set -a; source backend/.env; set +a; fi
: "${SEED_USERNAME:?Set SEED_USERNAME in .env}"
: "${SEED_PASSWORD:?Set SEED_PASSWORD in .env}"
mkdir -p .run
(cd backend && mvn spring-boot:run) >.run/backend.log 2>&1 &
backend_pid=$!
trap 'kill "$backend_pid" 2>/dev/null || true' EXIT INT TERM
(cd frontend && npm run dev)
