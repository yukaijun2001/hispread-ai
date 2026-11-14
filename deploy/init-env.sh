#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
output="${1:-.env.production}"
if [[ -e "$output" ]]; then echo "Refusing to overwrite existing $output" >&2; exit 1; fi
umask 077
db_password="$(openssl rand -hex 32)"
admin_password='wutong@Qq1.'
cat > "$output" <<ENV
DATABASE_PASSWORD=$db_password
ADMIN_USERNAME=wutong
ADMIN_PASSWORD=$admin_password
PUBLIC_ORIGIN=http://localhost:8088
COOKIE_SECURE=false
HTTP_BIND=127.0.0.1
HTTP_PORT=8088
IMAGE_TAG=local
PAYMENT_SANDBOX_ENABLED=false
ENV
chmod 600 "$output"
echo "Created $output. Database password is random; platform admin is wutong. Set PUBLIC_ORIGIN and COOKIE_SECURE before public HTTPS deployment."
