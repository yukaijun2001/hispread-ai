#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
output="${1:-.env.production}"
if [[ -e "$output" ]]; then echo "Refusing to overwrite existing $output" >&2; exit 1; fi
umask 077
db_password="$(openssl rand -hex 32)"
admin_password="Aa1!$(openssl rand -hex 24)"
wecom_encryption_key="$(openssl rand -base64 32)"
cat > "$output" <<ENV
DATABASE_PASSWORD=$db_password
ADMIN_USERNAME=admin
ADMIN_PASSWORD=$admin_password
PUBLIC_ORIGIN=http://localhost:8088
COOKIE_SECURE=false
HTTP_BIND=127.0.0.1
HTTP_PORT=8088
IMAGE_TAG=local
WECOM_ENCRYPTION_KEY=$wecom_encryption_key
PAYMENT_SANDBOX_ENABLED=false
MONITORING_SCHEDULING_ENABLED=true
ENV
chmod 600 "$output"
echo "Created $output with random secrets (not printed). Set PUBLIC_ORIGIN and COOKIE_SECURE before public HTTPS deployment."
