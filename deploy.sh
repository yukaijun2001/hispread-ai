#!/usr/bin/env bash
# Fetch a clean Git checkout and deploy with exactly one published port: frontend TCP/10001.
set -Eeuo pipefail
umask 077

usage() {
  cat <<'HELP'
Hispread AI one-command Docker deployment

  ./deploy.sh [options]

Options (environment variables with the same meaning are also supported):
  --repo URL        Git repository (REPO_URL; default: this checkout's origin,
                    otherwise https://github.com/yukaijun2001/hispread-ai.git)
  --branch NAME     Remote branch (DEPLOY_BRANCH; default: main)
  --dir PATH        Checkout directory (DEPLOY_DIR; default: this checkout or /opt/hispread-ai)
  --env-file PATH   Production environment, relative to checkout if not absolute
                    (ENV_FILE; default: .env.production)
  --origin URL      Browser-facing origin, e.g. http://203.0.113.10:10001
                    (PUBLIC_ORIGIN; otherwise existing origin or detected public IPv4)
  --project NAME    Stable Compose project (COMPOSE_PROJECT_NAME; default: hispread)
  -h, --help        Display this help without changing anything

Prerequisites: Git, Docker Engine, Docker Compose >= 2.24.4, Python 3 and curl.
Only frontend 0.0.0.0:10001 -> 8080 is published; backend/PostgreSQL remain unexposed.
Existing passwords and data volumes are preserved. Dirty, ahead and divergent checkouts
are rejected; the script never resets Git, runs compose down or deletes volumes.
HELP
}

log() { printf '\n[deploy] %s\n' "$*"; }
die() { printf '\n[deploy] ERROR: %s\n' "$*" >&2; exit 1; }
need_value() { [[ $# -ge 2 && -n "$2" && "$2" != --* ]] || die "Missing value for $1"; }

cleanup() {
  if [[ -n "${DEPLOY_PRIVATE_CONFIG:-}" ]]; then rm -f "$DEPLOY_PRIVATE_CONFIG"; fi
  if [[ -n "${DEPLOY_PRIVATE_CSRF:-}" ]]; then rm -f "$DEPLOY_PRIVATE_CSRF"; fi
  rm -f "$DEPLOY_LOCK_DIR/pid"
  rmdir "$DEPLOY_LOCK_DIR" 2>/dev/null || true
}

main() {
  local script_dir repo branch destination env_file origin project
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
  repo="${REPO_URL:-}"
  branch="${DEPLOY_BRANCH:-main}"
  destination="${DEPLOY_DIR:-}"
  env_file="${ENV_FILE:-.env.production}"
  origin="${PUBLIC_ORIGIN:-}"
  project="${COMPOSE_PROJECT_NAME:-hispread}"
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -h|--help) usage; return 0 ;;
      --repo) need_value "$@"; repo="$2"; shift 2 ;;
      --branch) need_value "$@"; branch="$2"; shift 2 ;;
      --dir) need_value "$@"; destination="$2"; shift 2 ;;
      --env-file) need_value "$@"; env_file="$2"; shift 2 ;;
      --origin) need_value "$@"; origin="$2"; shift 2 ;;
      --project) need_value "$@"; project="$2"; shift 2 ;;
      *) die "Unknown option: $1 (use --help)" ;;
    esac
  done
  local command
  for command in git docker python3 curl; do
    command -v "$command" >/dev/null 2>&1 || die "Missing prerequisite: $command";
  done
  docker info >/dev/null 2>&1 || die "Docker daemon is unavailable or this user lacks Docker access"
  local compose_version
  compose_version="$(docker compose version --short)" || die "Install Docker Compose v2"
  python3 - "$compose_version" <<'PY'
import re, sys
m = re.search(r'(\d+)\.(\d+)\.(\d+)', sys.argv[1])
if not m or tuple(map(int, m.groups())) < (2, 24, 4):
    raise SystemExit('Docker Compose >= 2.24.4 is required for safe !override port replacement')
PY
  [[ "$project" =~ ^[a-z0-9][a-z0-9_-]*$ ]] || die "Invalid Compose project name"
  git check-ref-format --branch "$branch" >/dev/null 2>&1 || die "Invalid Git branch"
  if [[ -z "$destination" ]]; then
    if [[ -e "$script_dir/.git" && -f "$script_dir/docker-compose.yml" ]]; then
      destination="$script_dir"
    else
      destination=/opt/hispread-ai
    fi
  fi
  destination="$(python3 - "$destination" <<'PY'
import os, sys
print(os.path.realpath(os.path.expanduser(sys.argv[1])))
PY
)"
  [[ "$destination" != / ]] || die "The checkout directory must not be /"
  if [[ -z "$repo" && -e "$destination/.git" ]]; then
    repo="$(git -C "$destination" remote get-url origin)" || die "The checkout has no origin remote"
  fi
  repo="${repo:-https://github.com/yukaijun2001/hispread-ai.git}"
  python3 - "$repo" <<'PY'
import sys, urllib.parse
url = urllib.parse.urlsplit(sys.argv[1])
if url.scheme in ('http', 'https') and (url.username or url.password):
    raise SystemExit('Do not embed GitHub credentials in REPO_URL; use SSH or a Git credential helper')
PY

  # An adjacent atomic lock also protects a first clone; it contains no secrets.
  mkdir -p "$(dirname "$destination")"
  DEPLOY_LOCK_DIR="${destination}.deploy-lock"
  mkdir "$DEPLOY_LOCK_DIR" 2>/dev/null || die "Deployment lock exists: $DEPLOY_LOCK_DIR (verify no deployment is running before removing a stale lock)"
  printf '%s\n' "$$" > "$DEPLOY_LOCK_DIR/pid"
  trap cleanup EXIT
  trap 'printf "\n[deploy] Deployment failed (exit %s, line %s). Existing volumes were preserved; inspect Docker Compose status/logs.\n" "$?" "$LINENO" >&2' ERR

  if [[ ! -e "$destination/.git" ]]; then
    if [[ -d "$destination" && -n "$(ls -A "$destination")" ]]; then
      die "Destination is not an empty Git checkout: $destination"
    fi
    log "Cloning the selected repository branch"
    # Source files copied into non-root containers must retain normal read permissions.
    (umask 022; git clone --single-branch --branch "$branch" -- "$repo" "$destination")
  else
    [[ "$(git -C "$destination" rev-parse --show-toplevel)" == "$destination" ]] || die "Destination is not the repository root"
    [[ "$(git -C "$destination" remote get-url origin)" == "$repo" ]] || die "origin differs from --repo; refusing to update another repository"
    [[ "$(git -C "$destination" symbolic-ref --quiet --short HEAD)" == "$branch" ]] || die "Checkout must be on branch $branch (no detached HEAD)"
    [[ -z "$(git -C "$destination" status --porcelain --untracked-files=normal)" ]] || die "Checkout has local changes/untracked files; commit or move them before deploying"
    log "Fetching the latest remote branch"
    git -C "$destination" fetch --no-tags origin "+refs/heads/$branch:refs/remotes/origin/$branch"
    git -C "$destination" merge-base --is-ancestor HEAD "refs/remotes/origin/$branch" || die "Local branch is ahead or divergent; refusing to overwrite local commits"
    (umask 022; git -C "$destination" merge --ff-only "refs/remotes/origin/$branch")
  fi
  cd "$destination"
  [[ -f docker-compose.yml && -f backend/Dockerfile && -f frontend/Dockerfile ]] || die "Required Compose/Docker build files are missing from the fetched commit"
  local revision
  revision="$(git rev-parse --short=12 HEAD)"
  log "Deploying commit $revision"
  if [[ "$env_file" != /* ]]; then env_file="$destination/$env_file"; fi
  env_file="$(python3 - "$env_file" <<'PY'
import os, sys
print(os.path.abspath(sys.argv[1]))
PY
)"
  if [[ "$env_file" == "$destination/"* ]]; then
    local relative_env="${env_file#"$destination/"}"
    if git ls-files --error-unmatch -- "$relative_env" >/dev/null 2>&1; then
      die "Production environment must not be tracked in Git: $relative_env"
    fi
    git check-ignore -q -- "$relative_env" || die "Choose an ignored environment path such as .env.production, or store it outside the checkout"
  fi

  # Use an explicit origin first, a usable existing origin second, public IPv4 detection last.
  if [[ -z "$origin" && -f "$env_file" ]]; then
    origin="$(python3 - "$env_file" <<'PY'
import sys, urllib.parse
for line in open(sys.argv[1], encoding='utf-8'):
    key, sep, value = line.partition('=')
    if sep and key.strip() == 'PUBLIC_ORIGIN':
        value = value.strip().strip(chr(39) + chr(34))
        try:
            u = urllib.parse.urlsplit(value)
            if u.hostname and u.hostname not in ('localhost', '127.0.0.1', '::1') and u.port == 10001:
                print(value)
        except ValueError:
            pass
        break
PY
)"
  fi
  if [[ -z "$origin" ]]; then
    local candidate=""
    if command -v ip >/dev/null 2>&1; then
      candidate="$(ip -4 route get 1.1.1.1 2>/dev/null | python3 -c 'import re,sys; m=re.search(r"\bsrc\s+(\S+)",sys.stdin.read()); print(m.group(1) if m else "")')" || true
    fi
    if ! python3 - "$candidate" <<'PY'
import ipaddress, sys
try:
    if not ipaddress.ip_address(sys.argv[1]).is_global: raise ValueError()
except ValueError: raise SystemExit(1)
PY
    then
      candidate="$(curl --fail --silent --show-error --connect-timeout 3 --max-time 5 -4 https://api.ipify.org 2>/dev/null)" || candidate=""
    fi
    python3 - "$candidate" <<'PY'
import ipaddress, sys
try:
    if not ipaddress.IPv4Address(sys.argv[1]).is_global: raise ValueError()
except ValueError:
    raise SystemExit('Cannot detect public IPv4. Run again with --origin http://YOUR_SERVER_IP:10001')
PY
    origin="http://$candidate:10001"
  fi

  # Treat dotenv as data, never shell code. Never rotate an existing database password.
  # The untouched default administrator "admin" is replaced by the requested platform account.
  python3 - "$env_file" "$origin" "$revision" <<'PY'
import base64, os, re, secrets, sys, tempfile, urllib.parse
filename, origin, revision = sys.argv[1:]
if os.path.islink(filename): raise SystemExit('Environment file must not be a symbolic link')
try:
    u = urllib.parse.urlsplit(origin)
    if u.scheme not in ('http', 'https') or not u.hostname or u.username or u.password or u.query or u.fragment or u.path or u.port != 10001:
        raise ValueError()
except ValueError:
    raise SystemExit('PUBLIC_ORIGIN must be http(s)://SERVER_HOST:10001 without a path or credentials')
values = {}

def literal_value(raw, number):
    if not raw.startswith(("'", '"')):
        return re.split(r'\s+#', raw, maxsplit=1)[0]
    quote, result, i = raw[0], [], 1
    escapes = {'n': '\n', 'r': '\r', 't': '\t', '\\': '\\', '"': '"', '$': '$'}
    while i < len(raw):
        char = raw[i]
        if char == quote:
            remainder = raw[i + 1:].strip()
            if remainder and not remainder.startswith('#'):
                raise SystemExit(f'Unexpected text after quoted value on line {number}')
            return ''.join(result)
        if char == '\\' and i + 1 < len(raw):
            following = raw[i + 1]
            if quote == "'" and following == "'":
                result.append("'"); i += 2; continue
            if quote == '"' and following in escapes:
                result.append(escapes[following]); i += 2; continue
        if quote == '"' and char == '$' and i + 1 < len(raw) and raw[i + 1] == '$':
            result.append('$'); i += 2; continue
        result.append(char); i += 1
    raise SystemExit(f'Unsupported multiline/quoted value on line {number}')

if os.path.exists(filename):
    for number, raw in enumerate(open(filename, encoding='utf-8'), 1):
        line = raw.strip()
        if not line or line.startswith('#'): continue
        if line.startswith('export '): line = line[7:]
        key, sep, value = line.partition('=')
        if not sep or not re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]*', key.strip()):
            raise SystemExit(f'Invalid environment assignment on line {number}')
        key, value = key.strip(), value.strip()
        if key in values: raise SystemExit(f'Duplicate environment key: {key}')
        value = literal_value(value, number)
        if '\x00' in value or '\r' in value or '\n' in value: raise SystemExit(f'Invalid environment value on line {number}')
        values[key] = value
values.setdefault('DATABASE_PASSWORD', secrets.token_hex(32))
if values.get('ADMIN_USERNAME', 'admin') in ('', 'admin'):
    values['ADMIN_USERNAME'] = 'wutong'
    values['ADMIN_PASSWORD'] = 'wutong@Qq1.'
else:
    values.setdefault('ADMIN_USERNAME', 'wutong')
    values.setdefault('ADMIN_PASSWORD', 'wutong@Qq1.')
values.setdefault('WECOM_ENCRYPTION_KEY', base64.b64encode(secrets.token_bytes(32)).decode())
values.setdefault('PAYMENT_SANDBOX_ENABLED', 'false')
values.setdefault('MONITORING_SCHEDULING_ENABLED', 'true')
if len(values['DATABASE_PASSWORD']) < 20 or len(values['ADMIN_PASSWORD']) < 8:
    raise SystemExit('Existing database/admin password is too short. Correct the environment explicitly; deployment will not silently rotate it.')
values.update(PUBLIC_ORIGIN=origin, COOKIE_SECURE='true' if u.scheme == 'https' else 'false',
              HTTP_BIND='0.0.0.0', HTTP_PORT='10001', IMAGE_TAG='git-' + revision)
parent = os.path.dirname(filename)
os.makedirs(parent, exist_ok=True)
fd, temporary = tempfile.mkstemp(prefix='.deploy-env-', dir=parent)
try:
    with os.fdopen(fd, 'w', encoding='utf-8') as stream:
        stream.write('# Managed by deploy.sh; secrets are preserved across deployments.\n')
        for key, value in values.items():
            # Compose double quotes safely encode trailing slashes, quotes and literal dollars.
            encoded = value.replace('\\', '\\\\').replace('"', '\\"').replace('$', '$$')
            stream.write(key + '="' + encoded + '"\n')
    os.chmod(temporary, 0o600)
    os.replace(temporary, filename)
finally:
    if os.path.exists(temporary): os.unlink(temporary)
PY

  mkdir -p .run/deploy
  local override="$destination/.run/deploy/ports.yml"
  cat > "$override" <<'YAML'
services:
  postgres:
    ports: !reset []
  backend:
    ports: !reset []
  frontend:
    ports: !override
      - "0.0.0.0:10001:8080"
YAML
  local -a compose
  compose=(docker compose --project-name "$project" --env-file "$env_file" -f "$destination/docker-compose.yml" -f "$override")
  local rendered="$destination/.run/deploy/compose.private.json"
  DEPLOY_PRIVATE_CONFIG="$rendered"
  DEPLOY_PRIVATE_CSRF="$destination/.run/deploy/csrf.private.json"
  # The production file is the source of truth, even from a shell used for local development.
  unset DATABASE_PASSWORD ADMIN_USERNAME ADMIN_PASSWORD
  unset WECOM_ENCRYPTION_KEY PAYMENT_SANDBOX_ENABLED MONITORING_SCHEDULING_ENABLED
  # Shell environment wins over dotenv in Compose: force these values as a second guard.
  export HTTP_BIND=0.0.0.0 HTTP_PORT=10001 IMAGE_TAG="git-$revision" PUBLIC_ORIGIN="$origin"
  export COOKIE_SECURE
  COOKIE_SECURE="$(python3 - "$origin" <<'PY'
import sys, urllib.parse
print('true' if urllib.parse.urlsplit(sys.argv[1]).scheme == 'https' else 'false')
PY
)"
  "${compose[@]}" config --format json > "$rendered"
  python3 - "$rendered" <<'PY'
import json, sys
services = json.load(open(sys.argv[1]))['services']
if set(services) != {'frontend', 'backend', 'postgres'}: raise SystemExit('Only frontend/backend/postgres are allowed in this deployment')
for name, service in services.items():
    if service.get('network_mode') == 'host' or service.get('privileged'):
        raise SystemExit('Host networking and privileged containers are not allowed')
    ports = service.get('ports') or []
    if name != 'frontend' and ports: raise SystemExit(f'{name} must not publish any host ports')
    if name == 'frontend':
        if len(ports) != 1: raise SystemExit('frontend must publish exactly one port')
        port = ports[0]
        if str(port.get('published')) != '10001' or port.get('target') != 8080 or port.get('host_ip') != '0.0.0.0' or port.get('protocol', 'tcp') != 'tcp':
            raise SystemExit('Only frontend TCP 0.0.0.0:10001 -> 8080 may be published')
PY
  rm -f "$rendered"
  log "Building production images (the running application stays up during the build)"
  "${compose[@]}" build --pull
  log "Updating containers and waiting for health checks"
  "${compose[@]}" up -d --remove-orphans --wait --wait-timeout "${DEPLOY_WAIT_TIMEOUT:-180}"
  local ready="$destination/.run/deploy/ready.json" csrf="$destination/.run/deploy/csrf.private.json"
  curl --fail --silent --show-error --connect-timeout 5 --max-time 15 http://127.0.0.1:10001/healthz >/dev/null
  curl --fail --silent --show-error --connect-timeout 5 --max-time 15 http://127.0.0.1:10001/api/health/ready > "$ready"
  curl --fail --silent --show-error --connect-timeout 5 --max-time 15 http://127.0.0.1:10001/api/auth/csrf > "$csrf"
  python3 - "$ready" "$csrf" <<'PY'
import json, sys
if json.load(open(sys.argv[1])).get('status') != 'UP': raise SystemExit('Backend is not ready')
token = json.load(open(sys.argv[2]))
if not token.get('headerName') or not token.get('token'): raise SystemExit('CSRF endpoint is not ready')
PY
  rm -f "$csrf"
  "${compose[@]}" ps
  log "Deployment complete: $origin (commit $revision)"
  printf 'Only frontend TCP/10001 is published. Allow this port in your server firewall/security group.\n'
  printf 'Administrator username/password are in %s (mode 600); existing account passwords were not reset.\n' "$env_file"
}

main "$@"
