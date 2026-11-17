#!/usr/bin/env bash
# usage: up.sh <command to run while stack is up>
M=/sessions/youthful-inspiring-hypatia/mnt/hispread-ai
export LD_LIBRARY_PATH=/tmp/env/pgroot/usr/lib/aarch64-linux-gnu:/tmp/env/xlib/usr/lib/aarch64-linux-gnu
B=/tmp/env/pgroot/usr/lib/postgresql/14/bin
mkdir -p /tmp/env/sock
$B/pg_ctl -D /tmp/env/pgdata -o "-k /tmp/env/sock -p 5432" -l /tmp/env/pg.log start >/dev/null
$B/psql -h /tmp/env/sock -U postgres -tc "select 1 from pg_database where datname='hispread_ai'" | grep -q 1 || $B/createdb -h /tmp/env/sock -U postgres hispread_ai
# sync frontend sources (not node_modules)
(cd $M/frontend && tar --exclude=node_modules --exclude=dist -cf - .) | (cd /tmp/fe && tar xf -)
export DATABASE_URL=jdbc:postgresql://127.0.0.1:5432/hispread_ai DATABASE_USER=postgres DATABASE_PASSWORD=postgres
export SEED_USERNAME=local_supplier SEED_PASSWORD='Sandbox_Seed1!' FIXTURES_PATH=$M/docs/runtime-fixtures.json PORT=8080
export ADMIN_USERNAME=sandbox_admin ADMIN_PASSWORD='Sandbox_Admin1!' MEMBER_USERNAME=sandbox_member MEMBER_PASSWORD='Sandbox_Member1!'
export OPERATOR_USERNAME=sandbox_operator OPERATOR_PASSWORD='Sandbox_Oper1!' FINANCE_USERNAME=sandbox_finance FINANCE_PASSWORD='Sandbox_Fin1!'
export COOKIE_SECURE=false PUBLIC_ORIGIN=http://127.0.0.1:5173
/tmp/env/jdk-17.0.21+9/bin/java -jar $M/backend/target/hispread-ai-1.0.0.jar >/tmp/env/backend.log 2>&1 &
BP=$!
(cd /tmp/fe && npx vite --host 127.0.0.1 >/tmp/env/vite.log 2>&1) &
VP=$!
for i in $(seq 1 90); do curl -sf http://127.0.0.1:8080/api/health >/dev/null && break; sleep 1; done
curl -s http://127.0.0.1:8080/api/health; echo
for i in $(seq 1 30); do curl -sf http://127.0.0.1:5173/ >/dev/null && break; sleep 1; done
"$@"
RC=$?
kill $BP $VP 2>/dev/null; pkill -f "node .*vite" 2>/dev/null
$B/pg_ctl -D /tmp/env/pgdata stop -m fast >/dev/null
exit $RC
