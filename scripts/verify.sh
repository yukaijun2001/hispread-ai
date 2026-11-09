#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
(cd frontend && npm run check && npm run build)
(cd backend && mvn test)
