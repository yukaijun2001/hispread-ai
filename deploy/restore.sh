#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
backup_dir="${1:?Usage: restore.sh BACKUP_DIRECTORY --replace-data}"
if [[ "${2:-}" != "--replace-data" ]]; then echo "Restore replaces existing database records and uploads; pass --replace-data explicitly." >&2; exit 1; fi
env_file="${ENV_FILE:-.env.production}"
test -s "$backup_dir/database.dump"
test -s "$backup_dir/uploads.tar.gz"
docker compose --env-file "$env_file" stop frontend backend
docker compose --env-file "$env_file" exec -T postgres pg_restore --clean --if-exists --no-owner -U hispread -d hispread_ai < "$backup_dir/database.dump"
docker compose --env-file "$env_file" run --rm --no-deps -T --entrypoint sh backend -c 'find /app/data/uploads -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +; tar -C /app/data -xzf -' < "$backup_dir/uploads.tar.gz"
docker compose --env-file "$env_file" up -d --wait
echo "Restore completed. Existing sessions and accounts reflect the backup."
