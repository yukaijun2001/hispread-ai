#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
output="${1:-deploy/artifacts/hispread-server-source.tar.gz}"
mkdir -p "$(dirname "$output")"
# Build into a staging tree to make the release independent of local credentials and dev artifacts.
staging="$(mktemp -d)"
trap 'rm -rf "$staging"' EXIT
mkdir -p "$staging/hispread-ai"
tar --exclude='node_modules' --exclude='target' --exclude='dist' --exclude='.env' --exclude='.env.*' \
    --exclude='data' --exclude='uploads' --exclude='backups' --exclude='ui-review' --exclude='evidence' \
    --exclude='deploy/artifacts' --exclude='__pycache__' --exclude='docs/runtime-fixtures.json' --exclude='.DS_Store' \
    -cf - backend frontend deploy scripts docker-compose.yml docker-compose.demo.yml docker-compose.images.yml docker-compose.tls.yml README.md docs \
  | tar -xf - -C "$staging/hispread-ai"
cp .env.production.example "$staging/hispread-ai/.env.production.example"
# Production starts clean; demo fixtures are optional and excluded from the distributable.
rm -f "$staging/hispread-ai/docs/runtime-fixtures.json"
tar -czf "$output" -C "$staging" hispread-ai
echo "Created $output; no .env or live data included."
