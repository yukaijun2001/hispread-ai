#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
env_file="${ENV_FILE:-.env.production}"
backup_dir="${BACKUP_DIRECTORY:-backups/$(date -u +%Y%m%dT%H%M%SZ)}"
umask 077
mkdir -p "$backup_dir"
docker compose --env-file "$env_file" exec -T postgres pg_dump -U hispread -d hispread_ai -Fc > "$backup_dir/database.dump"
docker compose --env-file "$env_file" exec -T backend tar -C /app/data -czf - uploads > "$backup_dir/uploads.tar.gz"
echo "Backup saved to $backup_dir. Database and files are separate snapshots; pause writes for a consistent backup."
