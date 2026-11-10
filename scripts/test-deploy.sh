#!/usr/bin/env bash
# Isolated deploy.sh acceptance harness: real temporary Git remotes, fake Docker/curl only.
# Never operates on the user's checkout, Docker daemon, or network.
set -euo pipefail
project_root="$(cd "$(dirname "$0")/.." && pwd)"
deploy_source="${DEPLOY_SCRIPT_UNDER_TEST:-$project_root/deploy.sh}"
if [[ ! -f "$deploy_source" ]]; then echo "deploy.sh is not present yet" >&2; exit 2; fi
real_git="$(command -v git)"
real_python="$(command -v python3)"
test_root="$(mktemp -d "${TMPDIR:-/tmp}/hispread-deploy-test.XXXXXX")"
test_root="$(cd "$test_root" && pwd -P)"
trap 'rm -rf "$test_root"' EXIT
mkdir -p "$test_root/bin" "$test_root/logs" "$test_root/python"
export PYTHONPATH="$test_root/python${PYTHONPATH:+:$PYTHONPATH}"
cat > "$test_root/python/deploy_fixture_dotenv.py" <<'DOTENV'
"""Literal-only Compose dotenv reader for assertions; never evaluates shell syntax."""
def read(filename):
    values = {}
    for number, raw in enumerate(open(filename, encoding="utf-8"), 1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:]
        key, sep, value = line.partition("=")
        if not sep:
            raise AssertionError(f"Invalid fixture assignment on line {number}")
        key, value = key.strip(), value.strip()
        if value.startswith((chr(34), chr(39))):
            quote, result, i = value[0], [], 1
            escapes = {"n": "\n", "r": "\r", "t": "\t", "\\": "\\", chr(34): chr(34), "$": "$"}
            while i < len(value):
                char = value[i]
                if char == quote:
                    if value[i+1:].strip() and not value[i+1:].strip().startswith("#"):
                        raise AssertionError(f"Unexpected fixture trailing text on line {number}")
                    value = "".join(result)
                    break
                if char == "\\" and i+1 < len(value):
                    following = value[i+1]
                    if quote == chr(39) and following == chr(39):
                        result.append(chr(39)); i += 2; continue
                    if quote == chr(34) and following in escapes:
                        result.append(escapes[following]); i += 2; continue
                if quote == chr(34) and char == "$" and i+1 < len(value) and value[i+1] == "$":
                    result.append("$"); i += 2; continue
                result.append(char); i += 1
            else:
                raise AssertionError(f"Unclosed fixture value on line {number}")
        values[key] = value
    return values
DOTENV
export DEPLOY_TEST_LOG="$test_root/logs/commands.jsonl"
export DEPLOY_TEST_REAL_PYTHON="$real_python"
export DEPLOY_TEST_REAL_GIT="$real_git"
# JSON command trace avoids exposing environment or credentials.
cat > "$test_root/bin/docker" <<'DOCKER'
#!/usr/bin/env bash
set -euo pipefail
"$DEPLOY_TEST_REAL_PYTHON" - "$@" <<'PY'
import json,os,sys
args=sys.argv[1:]
clean=all(k not in os.environ for k in ('DATABASE_PASSWORD','ADMIN_PASSWORD','ADMIN_USERNAME'))
if 'compose' in args and any(k in args for k in ('config','build','up')):
 assert clean,'ambient credentials reached Docker Compose'
with open(os.environ['DEPLOY_TEST_LOG'],'a') as f:f.write(json.dumps({'cmd':'docker','args':args,'cwd':os.getcwd(),'credentialsUnset':clean})+'\n')
PY
case " $* " in
 *" compose version "*) echo 'Docker Compose version v2.32.0'; exit 0;;
 *" info "*) echo '{}'; exit 0;;
 *" version "*) echo '{"Server":{"Version":"28.0.0"}}'; exit 0;;
esac
if [[ " $* " == *" config "* ]]; then
 if [[ " $* " == *" --format json "* ]]; then
  "$DEPLOY_TEST_REAL_PYTHON" - <<'PY'
import json,os
bad=os.environ.get('DEPLOY_TEST_BAD_PORTS')=='1'
s={'services': {'postgres': {}, 'backend': {'expose': ['8080']}, 'frontend': {'ports': [{'host_ip': '0.0.0.0', 'published': '10001', 'target': 8080, 'protocol': 'tcp'}]}}}
if bad:s['services']['backend']['ports']=[{'host_ip':'0.0.0.0','published':'8080','target':8080}]
print(json.dumps(s))
PY
 else
  cat <<'YAML'
services:
  postgres: {}
  backend:
    expose:
      - "8080"
  frontend:
    ports:
      - mode: ingress
        host_ip: 0.0.0.0
        target: 8080
        published: "10001"
        protocol: tcp
YAML
 fi
 exit 0
fi
if [[ " $* " == *" build "* && "${DEPLOY_TEST_DOCKER_FAIL:-0}" == 1 ]]; then echo 'fixture: build failed' >&2; exit 19; fi
if [[ " $* " == *" ps "* ]]; then echo 'frontend healthy'; fi
exit 0
DOCKER
cat > "$test_root/bin/curl" <<'CURL'
#!/usr/bin/env bash
set -euo pipefail
"$DEPLOY_TEST_REAL_PYTHON" - "$@" <<'PY'
import json,os,sys
with open(os.environ['DEPLOY_TEST_LOG'],'a') as f:f.write(json.dumps({'cmd':'curl','args':sys.argv[1:]})+'\n')
PY
if [[ "${DEPLOY_TEST_CURL_FAIL:-0}" == 1 ]]; then exit 22; fi
case " $* " in
 *"/api/auth/csrf"*) printf '%s\n' '{"headerName":"X-CSRF-TOKEN","token":"fixture-csrf-token"}';;
 *"/api/health"*) printf '%s\n' '{"status":"UP"}';;
 *) printf '%s\n' '<!doctype html><html><head><title>Hispread AI</title></head><body></body></html>';;
esac
CURL
cat > "$test_root/bin/ip" <<'IP'
#!/usr/bin/env bash
printf '%s\n' '1.1.1.1 via 192.0.2.1 dev eth0 src 198.51.100.8 uid 1000'
IP
cat > "$test_root/bin/hostname" <<'HOST'
#!/usr/bin/env bash
if [[ "${1:-}" == -I ]]; then echo '198.51.100.8'; else echo 'deploy-fixture'; fi
HOST
chmod +x "$test_root/bin/"*
export PATH="$test_root/bin:$PATH"
# Build one upstream fixture commit with the real deployment script and minimal tracked sources.
remote="$test_root/remote.git"
seed="$test_root/seed"
"$real_git" init --bare --quiet "$remote"
"$real_git" init --quiet "$seed"
"$real_git" -C "$seed" config user.email 'deploy-test@example.invalid'
"$real_git" -C "$seed" config user.name 'Deploy fixture'
"$real_git" -C "$seed" checkout -q -b main
cp "$deploy_source" "$seed/deploy.sh"
mkdir -p "$seed/deploy" "$seed/backend" "$seed/frontend"
printf 'FROM scratch\n' > "$seed/backend/Dockerfile"
printf 'FROM scratch\n' > "$seed/frontend/Dockerfile"
cp "$project_root/docker-compose.yml" "$seed/docker-compose.yml"
cp "$project_root/.env.production.example" "$seed/.env.production.example"
cp "$project_root/deploy/init-env.sh" "$seed/deploy/init-env.sh"
if [[ -f "$project_root/.gitignore" ]]; then cp "$project_root/.gitignore" "$seed/.gitignore"; fi
printf '\n.env*\n!.env.example\n!.env.*.example\n.run/\n' >> "$seed/.gitignore"
printf '%s\n' 'fixture version one' > "$seed/README.fixture"
"$real_git" -C "$seed" add -f .
"$real_git" -C "$seed" commit -q -m 'deployment fixture'
"$real_git" -C "$seed" remote add origin "$remote"
"$real_git" -C "$seed" push -q origin main
passes=0
pass(){ passes=$((passes+1)); echo "PASS $1"; }
fail(){ echo "FAIL $1" >&2; if [[ -f "${last_output:-}" ]]; then tail -30 "$last_output" >&2; fi; exit 1; }
clone(){ "$real_git" clone -q --branch main "$remote" "$1"; "$real_git" -C "$1" config user.email 'deploy-test@example.invalid'; "$real_git" -C "$1" config user.name 'Deploy fixture'; }
run_deploy(){
 local checkout="$1"; shift
 last_output="$test_root/logs/run-$passes.log"
 (cd "$test_root" && REPO_URL="$remote" DEPLOY_BRANCH=main DEPLOY_DIR="$checkout" ENV_FILE=.env.production COMPOSE_PROJECT_NAME=deploy-fixture PUBLIC_ORIGIN=http://198.51.100.8:10001 HTTP_PORT=9999 HTTP_BIND=127.0.0.1 DATABASE_PASSWORD=ambient-database-must-not-win ADMIN_PASSWORD=AmbientAdmin-MustNotWin123 ADMIN_USERNAME=ambient-user-must-not-win bash "$seed/deploy.sh" --repo "$remote" --branch main --dir "$checkout" --origin http://198.51.100.8:10001 --env-file .env.production --project deploy-fixture "$@") > "$last_output" 2>&1
}
expect_fail(){ if run_deploy "$1"; then fail "$2 unexpectedly succeeded"; fi; pass "$2"; }
# Help must be safe and never call Docker or create state.
bash "$seed/deploy.sh" --help > "$test_root/logs/help.log"
[[ ! -e "$DEPLOY_TEST_LOG" ]] || fail 'help had deployment side effects'
pass 'help is read-only'
checkout="$test_root/new-install"
run_deploy "$checkout" || fail 'fresh clone deployment'
[[ -d "$checkout/.git" && -f "$checkout/.env.production" ]] || fail 'fresh install files missing'
"$real_python" - "$checkout/.env.production" <<'PY'
import os,stat,sys
p=sys.argv[1];mode=stat.S_IMODE(os.stat(p).st_mode)
assert mode==0o600,f'env permissions {oct(mode)}'
from deploy_fixture_dotenv import read
values=read(p)
assert values.get('DATABASE_PASSWORD') and len(values['DATABASE_PASSWORD'])>=24
assert values.get('ADMIN_USERNAME')=='wutong'
assert values.get('ADMIN_PASSWORD')=='wutong@Qq1.'
assert values.get('PUBLIC_ORIGIN')=='http://198.51.100.8:10001'
PY
pass 'fresh clone creates private production environment'
# deploy.sh keeps a restrictive secret umask, but Git checkout must leave image inputs readable.
"$real_python" - "$checkout" <<'PY'
import os,stat,sys
for relative in ('backend/Dockerfile','frontend/Dockerfile','docker-compose.yml'):
 mode=stat.S_IMODE(os.stat(os.path.join(sys.argv[1],relative)).st_mode)
 assert mode==0o644,f'fresh tracked source {relative} permissions {oct(mode)}, expected 0o644'
PY
pass 'fresh clone source files remain readable with mode 644'
# All compose up/config invocations must enforce the sole public port using an override or env.
"$real_python" - "$DEPLOY_TEST_LOG" <<'PY'
import json,sys,os
rows=[json.loads(x) for x in open(sys.argv[1])]
docker=[x for x in rows if x['cmd']=='docker']
assert any('up' in x['args'] for x in docker),'docker up missing'
assert not any('down' in x['args'] for x in docker),'deployment must not down existing volumes'
assert not any('-v' in x['args'] and 'down' in x['args'] for x in docker),'volume deletion'
for row in docker:
 if 'up' not in row['args'] and 'config' not in row['args']:continue
 args=row['args'];files=[args[i+1] for i,v in enumerate(args[:-1]) if v in ['-f','--file']]
 assert len(files)>=2,'fixed-port deployment requires generated override'
 found=False
 for f in files[1:]:
  p=f if os.path.isabs(f) else os.path.join(row['cwd'],f)
  text=open(p).read()
  if '10001' in text and '0.0.0.0' in text and ('!override' in text or '!reset' in text):found=True
 assert found,'override must enforce frontend public port 10001'
PY
pass 'fixed public port override and persistent volumes'
# Remote fast-forward update must be pulled.
printf '%s\n' 'fixture version two' > "$seed/README.fixture"
printf '%s\n' 'FROM scratch' '# changed image input' > "$seed/frontend/Dockerfile"
printf '%s\n' 'fixture newly tracked image configuration' > "$seed/frontend/config.fixture"
"$real_git" -C "$seed" add README.fixture frontend/Dockerfile frontend/config.fixture
"$real_git" -C "$seed" commit -q -m 'remote update'
"$real_git" -C "$seed" push -q origin main
before_hash="$("$real_python" - "$checkout/.env.production" <<'PY'
import hashlib,sys
from deploy_fixture_dotenv import read
v=read(sys.argv[1])
print(hashlib.sha256((v['DATABASE_PASSWORD']+'\0'+v['ADMIN_PASSWORD']).encode()).hexdigest())
PY
)"
run_deploy "$checkout" || fail 'clean update deployment'
[[ "$(cat "$checkout/README.fixture")" == 'fixture version two' ]] || fail 'latest remote commit not pulled'
after_hash="$("$real_python" - "$checkout/.env.production" <<'PY'
import hashlib,sys
from deploy_fixture_dotenv import read
v=read(sys.argv[1])
print(hashlib.sha256((v['DATABASE_PASSWORD']+'\0'+v['ADMIN_PASSWORD']).encode()).hexdigest())
PY
)"
[[ "$before_hash" == "$after_hash" ]] || fail 'existing secrets changed'
pass 'fast-forward update preserves existing secrets'
"$real_python" - "$checkout" <<'PY'
import os,stat,sys
for relative in ('frontend/Dockerfile','frontend/config.fixture','README.fixture'):
 mode=stat.S_IMODE(os.stat(os.path.join(sys.argv[1],relative)).st_mode)
 assert mode==0o644,f'updated tracked source {relative} permissions {oct(mode)}, expected 0o644'
 assert os.access(os.path.join(sys.argv[1],relative),os.R_OK)
PY
pass 'fast-forward changed and newly tracked sources retain mode 644'
# Docker must receive canonical dotenv credentials, never inherited shell overrides.
"$real_python" - "$DEPLOY_TEST_LOG" <<'PY'
import json,sys
rows=[json.loads(x) for x in open(sys.argv[1])]
checked=[x for x in rows if x['cmd']=='docker' and any(y in x['args'] for y in ('config','build','up'))]
assert checked and all(x['credentialsUnset'] for x in checked),'ambient credentials were not unset'
PY
pass 'ambient credential variables are unset before Compose'
# Literal round trip includes both quote types, literal dollar names, and a trailing backslash.
"$real_python" - "$checkout/.env.production" "$test_root/special-expected.json" <<'PY'
import json,os,sys
from deploy_fixture_dotenv import read
values=read(sys.argv[1])
values['DATABASE_PASSWORD']='Database-Literal-123456789-"quoted"-'+chr(39)+'single'+chr(39)+'-$HOME-$$TOKEN-'+chr(92)
values['ADMIN_PASSWORD']='Aa1!Admin-Literal-123456-'+chr(39)+'single'+chr(39)+'-"double"-$HOME-'+chr(92)
with open(sys.argv[2],'w') as f:json.dump({k:values[k] for k in ('DATABASE_PASSWORD','ADMIN_PASSWORD')},f)
with open(sys.argv[1],'w') as f:
 for key,value in values.items():
  encoded=value.replace(chr(92),chr(92)*2).replace(chr(34),chr(92)+chr(34)).replace('$','$$')
  f.write(key+'="'+encoded+'"\n')
os.chmod(sys.argv[1],0o600)
PY
for fixture_round in 1 2; do
 run_deploy "$checkout" || fail 'special password round trip deployment'
 "$real_python" - "$checkout/.env.production" "$test_root/special-expected.json" <<'PY'
import json,sys
from deploy_fixture_dotenv import read
actual=read(sys.argv[1]);expected=json.load(open(sys.argv[2]))
assert all(actual[k]==v for k,v in expected.items()),'special password was expanded or changed'
PY
done
pass 'quoted backslash and literal-dollar passwords survive repeated deployment'
# Alias checkout paths must resolve to the same physical repository on every rerun.
ln -s "$checkout" "$test_root/checkout-link"
run_deploy "$test_root/checkout-link" || fail 'symbolic-link checkout rerun'
pass 'symbolic-link checkout rerun resolves physical repository'
# Environment file content is data; shell substitutions must never execute.
printf '\nUNTRUSTED_TEST_VALUE=$(touch %s)\n' "$test_root/env-executed" >> "$checkout/.env.production"
run_deploy "$checkout" || true
[[ ! -e "$test_root/env-executed" ]] || fail 'environment file was sourced'
pass 'environment values are not shell-executed'
printf '%s\n' 'dirty local change' >> "$checkout/README.fixture"
expect_fail "$checkout" 'dirty working tree rejected'
"$real_git" -C "$checkout" restore README.fixture
printf '%s\n' 'local ahead' >> "$checkout/README.fixture"
"$real_git" -C "$checkout" add README.fixture
"$real_git" -C "$checkout" commit -q -m 'local ahead'
expect_fail "$checkout" 'local-ahead branch rejected'
# Separate clean fixture for failures after Git validation.
clean="$test_root/clean"
clone "$clean"
export DEPLOY_TEST_DOCKER_FAIL=1
expect_fail "$clean" 'Docker build failure propagates'
unset DEPLOY_TEST_DOCKER_FAIL
export DEPLOY_TEST_BAD_PORTS=1
expect_fail "$clean" 'rendered backend port exposure rejected'
unset DEPLOY_TEST_BAD_PORTS
export DEPLOY_TEST_CURL_FAIL=1
expect_fail "$clean" 'failed readiness smoke propagates'
unset DEPLOY_TEST_CURL_FAIL
# A remote update and a different local update must be rejected without reset.
diverged="$test_root/diverged"
clone "$diverged"
printf '%s\n' 'local divergence' >> "$diverged/README.fixture"
"$real_git" -C "$diverged" add README.fixture
"$real_git" -C "$diverged" commit -q -m 'local divergence'
printf '%s\n' 'remote divergence' >> "$seed/README.fixture"
"$real_git" -C "$seed" add README.fixture
"$real_git" -C "$seed" commit -q -m 'remote divergence'
"$real_git" -C "$seed" push -q origin main
expect_fail "$diverged" 'diverged branch rejected'
[[ "$(tail -1 "$diverged/README.fixture")" == 'local divergence' ]] || fail 'local divergence was destructively overwritten'
# Final trace must include health and CSRF checks, without credentials in command args.
"$real_python" - "$DEPLOY_TEST_LOG" <<'PY'
import json,sys
rows=[json.loads(x) for x in open(sys.argv[1])]
urls=[' '.join(x['args']) for x in rows if x['cmd']=='curl']
assert any('/api/health' in x for x in urls),'health smoke check missing'
assert any('/api/auth/csrf' in x for x in urls),'CSRF smoke check missing'
PY
pass 'readiness and CSRF smoke checks run'
echo "deploy.sh harness: $passes scenarios passed (no real Docker daemon or network used)."
