#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
env_file="${ENV_FILE:-.env.production}"
docker compose --env-file "$env_file" config --quiet
docker compose --env-file "$env_file" build --pull
docker compose --env-file "$env_file" up -d --wait
url="${PUBLIC_URL:-http://localhost:8088}"
python3 deploy/smoke-test.py --url "$url" --env-file "$env_file" --out docs/deployment-smoke-latest.json
