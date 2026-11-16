#!/usr/bin/env python3
"""Exercise cleanup against simulated Compose; --postgres adds an isolated real transaction."""
import contextlib
import copy
import importlib.util
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
import uuid

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('cleanup_under_test', ROOT / 'deploy/clean-test-data.py')
CLEAN = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(CLEAN)
POSTGRES = '--postgres' in sys.argv
if POSTGRES:
    sys.argv.remove('--postgres')
DOC = '00000000-0000-4000-8000-000000000001'


def fixture():
    def entity(kind, identity, owner='GLOBAL', **data):
        return {'kind': kind, 'id': identity, 'owner': owner, 'data': {'id': identity, **data},
                'fingerprint': kind + ':' + identity}
    keep = [entity('role', role) for role in sorted(CLEAN.BUILTIN_ROLES)]
    keep += [entity('settings', 'default'), entity('reminder-settings', 'WORKBENCH_WECOM_REMINDER'), entity('resource-target', 'native', protocol='CCMAX_NATIVE'),
             entity('resource-target', 'newapi', protocol='NEWAPI'), entity('payout-provider', 'historical'),
             entity('exchange-rate', 'fx'), entity('intake-policy', 'system'),
             entity('api-token', 'admin-token', 'local-admin'), entity('category', 'ANTHROPIC')]
    remove = [entity('supplier', 'supplier-qa', 'supplier-qa', name='验收供应商', code='QA_TEST'),
              entity('project', 'qa-project', name='验收项目', code='QA_PROJECT'),
              entity('resource', 'qa-resource', 'supplier-qa', supplierId='supplier-qa'),
              entity('document', DOC, 'supplier-qa', supplierId='supplier-qa'),
              entity('input', 'qa-input', 'supplier-qa', supplierId='supplier-qa'),
              entity('export', 'qa-export', 'local-admin'),
              entity('api-token', 'qa-token', 'qa-user'), entity('audit', 'qa-audit'),
              entity('notice', 'qa-notice'), entity('scheduled-task', 'CCMAX_STATUS_SYNC', enabled=False, running=False),
              entity('category', 'QA_TEST'), entity('intake-policy', 'supplier-qa:qa-user')]
    admin = {'id': 'local-admin', 'username': 'wutong', 'supplierId': None, 'enabled': True,
             'role': 'ADMIN', 'fingerprint': 'unchanged-admin-password-profile-and-version'}
    member = {'id': 'qa-user', 'username': 'qa_supplier', 'supplierId': 'supplier-qa',
              'enabled': True, 'role': 'SUPPLIER', 'fingerprint': 'test-user'}
    return {'entities': keep + remove, 'users': [admin, member]}, {(e['kind'], e['id']) for e in keep}


def execute(mode='success', apply=True, inherited=False):
    inventory, kept = fixture()
    state = {'inventory': inventory, 'files': [DOC], 'calls': [], 'committed': False}
    with tempfile.TemporaryDirectory(prefix='hispread-clean-test-') as temporary:
        root = Path(temporary) / 'checkout'
        (root / 'deploy').mkdir(parents=True)
        (root / '.run/deploy').mkdir(parents=True)
        (root / '.run/deploy/ports.yml').write_text('services: {}')
        (root / '.env.production').write_text('ADMIN_USERNAME=wutong')
        argv = ['clean-test-data.py'] + (['--apply'] if apply else [])
        lock = root.parent / (root.name + '.deploy-lock')
        if inherited:
            lock.mkdir()
            (lock / 'pid').write_text(str(os.getppid()))
            argv += ['--deploy-lock-held', '--deploy-lock-owner', str(os.getppid())]
        if mode == 'formal-user':
            state['inventory']['users'][1]['username'] = 'real_supplier'
        if mode == 'unknown-kind':
            state['inventory']['entities'].append({'kind': 'unexpected', 'id': 'x', 'owner': 'GLOBAL',
                                                  'data': {}, 'fingerprint': 'x'})
        output = io.StringIO()

        def fake_run(command, **options):
            if command[:2] != ['docker', 'compose']:
                raise AssertionError('Unexpected external command: ' + str(command))
            if any(word in command for word in ['pg_dump', 'pg_restore', 'curl', 'tar']):
                raise AssertionError('Cleanup invoked backup or upstream transport')
            raw = b''
            if 'config' in command:
                state['calls'].append('config')
                raw = json.dumps({'services': {'backend': {'environment': {
                    'SPRING_PROFILES_ACTIVE': 'production', 'ADMIN_USERNAME': 'wutong'},
                    'volumes': [{'type': 'volume', 'target': '/app/data/uploads'}]}}}).encode()
            elif 'psql' in command:
                sql = options['input'].decode()
                if 'SELECT jsonb_build_object' in sql:
                    state['calls'].append('inventory')
                    raw = json.dumps(state['inventory']).encode()
                elif 'LOCK TABLE' in sql:
                    state['calls'].append('delete')
                    if mode == 'rollback':
                        raise subprocess.CalledProcessError(3, command)
                    state['inventory']['entities'] = [e for e in state['inventory']['entities']
                                                      if (e['kind'], e['id']) in kept]
                    state['inventory']['users'] = state['inventory']['users'][:1]
                    state['committed'] = True
                    if mode == 'lost-commit-response':
                        raise subprocess.CalledProcessError(3, command)
                else:
                    raise AssertionError('Unknown SQL operation')
            elif 'stop' in command:
                state['calls'].append('stop')
                if mode == 'drift':
                    state['inventory']['entities'][-1]['fingerprint'] = 'changed-after-plan'
            elif 'up' in command:
                state['calls'].append('start')
                if mode == 'restart-failure':
                    raise subprocess.CalledProcessError(22, command)
            elif 'run' in command:
                script = command[command.index('-c') + 1]
                if 'hispread-clean-list-uploads' in script:
                    state['calls'].append('list-files')
                    files = state['files'] + (['00000000-0000-4000-8000-000000000002'] if mode == 'unknown-file' else [])
                    raw = (chr(10).join(files) + (chr(10) if files else '')).encode()
                elif 'rm -f' in script:
                    state['calls'].append('remove-files')
                    if mode == 'attachment-failure':
                        raise subprocess.CalledProcessError(13, command)
                    for name in command[command.index('clean-files') + 1:]:
                        state['files'].remove(name)
                elif 'test -w' in script:
                    state['calls'].append('check-files')
                else:
                    raise AssertionError('Unexpected helper shell command')
            else:
                raise AssertionError('Unknown Compose command')
            return subprocess.CompletedProcess(command, 0, stdout=raw, stderr=b'')

        failure = None
        with patch.object(CLEAN, '__file__', str(root / 'deploy/clean-test-data.py')), \
             patch.object(sys, 'argv', argv), patch.object(CLEAN.subprocess, 'run', side_effect=fake_run), \
             contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
            try:
                CLEAN.main()
            except (ValueError, subprocess.CalledProcessError) as error:
                failure = error
        state['failure'] = failure
        state['output'] = output.getvalue()
        state['inheritedLockRetained'] = lock.exists() if inherited else not lock.exists()
        state['backupAbsent'] = not (root / 'backups').exists() and not list(root.rglob('*.dump'))
        return state


class CleanupRunnerTest(unittest.TestCase):
    def test_plan_retains_admin_tokens_and_config_but_removes_qa_objects(self):
        inventory, keep = fixture()
        plan = CLEAN.make_plan(inventory, 'wutong')
        self.assertEqual(keep, {(e['kind'], e['id']) for e in plan['keep']})
        self.assertEqual('qa-user', plan['removeUsers'][0]['id'])
        self.assertFalse(CLEAN.summary(plan)['backupCreated'])

    def test_dry_run_has_no_writes_or_downtime(self):
        state = execute(apply=False)
        self.assertIsNone(state['failure'])
        self.assertEqual(['config', 'inventory'], state['calls'])
        self.assertFalse(state['committed'])

    def test_full_execution_preserves_admin_and_configuration_without_backup(self):
        state = execute()
        self.assertIsNone(state['failure'])
        self.assertTrue(state['committed'])
        self.assertEqual([], state['files'])
        self.assertEqual(['local-admin'], [u['id'] for u in state['inventory']['users']])
        self.assertEqual(1, state['calls'].count('delete'))
        self.assertEqual(1, state['calls'].count('start'))
        self.assertTrue(state['backupAbsent'])
        self.assertTrue(state['inheritedLockRetained'])

    def test_deploy_lock_is_reused_and_left_for_the_deployer(self):
        state = execute(inherited=True)
        self.assertIsNone(state['failure'])
        self.assertTrue(state['inheritedLockRetained'])

    def test_formal_user_and_unknown_kind_stop_before_mutations(self):
        for mode in ['formal-user', 'unknown-kind']:
            with self.subTest(mode=mode):
                state = execute(mode)
                self.assertIsInstance(state['failure'], ValueError)
                self.assertNotIn('stop', state['calls'])
                self.assertNotIn('delete', state['calls'])

    def test_drift_and_unmatched_files_resume_without_deletion(self):
        for mode in ['drift', 'unknown-file']:
            with self.subTest(mode=mode):
                state = execute(mode)
                self.assertIsInstance(state['failure'], ValueError)
                self.assertNotIn('delete', state['calls'])
                self.assertIn('start', state['calls'])
                self.assertEqual([DOC], state['files'])

    def test_transaction_failure_preserves_data_and_resumes_services(self):
        state = execute('rollback')
        self.assertIsNotNone(state['failure'])
        self.assertFalse(state['committed'])
        self.assertIn('start', state['calls'])
        self.assertEqual(2, len(state['inventory']['users']))

    def test_lost_commit_response_and_attachment_failure_do_not_restart(self):
        for mode in ['lost-commit-response', 'attachment-failure']:
            with self.subTest(mode=mode):
                state = execute(mode)
                self.assertIsNotNone(state['failure'])
                self.assertTrue(state['committed'])
                self.assertNotIn('start', state['calls'])
                self.assertEqual([DOC], state['files'])
                self.assertIn('未创建备份', state['output'])
                self.assertTrue(state['backupAbsent'])

    def test_restart_failure_is_not_reported_as_success(self):
        state = execute('restart-failure')
        self.assertIsNotNone(state['failure'])
        self.assertNotIn('清理完成', state['output'])
        self.assertGreaterEqual(state['calls'].count('stop'), 2)

    def test_mixed_supplier_project_and_active_task_are_rejected(self):
        inventory, _ = fixture()
        for kind, changes in [('supplier', {'code': 'REAL', 'name': '正式供应商'}),
                              ('project', {'code': 'REAL', 'name': '正式项目'}),
                              ('scheduled-task', {'enabled': True})]:
            with self.subTest(kind=kind):
                changed = copy.deepcopy(inventory)
                next(e for e in changed['entities'] if e['kind'] == kind)['data'].update(changes)
                with self.assertRaises(ValueError):
                    CLEAN.make_plan(changed, 'wutong')


@unittest.skipUnless(POSTGRES, 'pass --postgres for an isolated PostgreSQL transaction')
class CleanupPostgresTest(unittest.TestCase):
    def test_real_transaction_rejects_drift_and_preserves_password_secrets_and_sessions(self):
        for executable in ['createdb', 'dropdb', 'psql']:
            self.assertTrue(shutil.which(executable), executable)
        database = 'cleanup_regression_' + uuid.uuid4().hex[:12]
        subprocess.run(['createdb', database], check=True, capture_output=True)

        def sql(text, check=True):
            return subprocess.run(['psql', '-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-d', database],
                                  input=text, text=True, capture_output=True, check=check)

        try:
            for migration in ['V1__initial_schema.sql', 'V2__durable_sessions_and_indexes.sql']:
                sql((ROOT / 'backend/src/main/resources/db/migration' / migration).read_text())
            inventory, _ = fixture()
            for entry in inventory['entities']:
                raw = {**entry['data'], 'version': 7, 'retainedSecret': 'local-regression-sentinel'}
                values = [CLEAN.quote(entry['kind']), CLEAN.quote(entry['id']),
                          CLEAN.quote(entry['owner']), CLEAN.quote(json.dumps(raw)) + '::jsonb']
                sql('INSERT INTO hub_entity(kind,id,owner_id,data) VALUES(' + ','.join(values) + ');')
            for user in inventory['users']:
                profile = {'id': user['id'], 'role': user['role'], 'username': user['username']}
                supplier = 'NULL' if user['supplierId'] is None else CLEAN.quote(user['supplierId'])
                sql('INSERT INTO hub_user(id,username,password_hash,supplier_id,profile) VALUES(' +
                    ','.join([CLEAN.quote(user['id']), CLEAN.quote(user['username']), CLEAN.quote('unchanged-bcrypt-sentinel'),
                              supplier, CLEAN.quote(json.dumps(profile)) + '::jsonb']) + ');')
            sql("INSERT INTO hub_login_attempt(username,failures) VALUES('qa_supplier',2);")
            primary, session = str(uuid.uuid4()), str(uuid.uuid4())
            sql("INSERT INTO spring_session(primary_id,session_id,creation_time,last_access_time,max_inactive_interval,expiry_time) VALUES(" +
                CLEAN.quote(primary) + ',' + CLEAN.quote(session) + ',1,1,60,9999999999999);')
            sql("INSERT INTO spring_session_attributes VALUES(" + CLEAN.quote(primary) + ",'fixture',decode('00','hex'));")
            read = lambda: json.loads(sql(CLEAN.INVENTORY_SQL).stdout)
            before = read()
            plan = CLEAN.make_plan(before, 'wutong')
            sql("UPDATE hub_entity SET data=data || '{\"edited\":true}'::jsonb WHERE kind='resource';")
            rejected = sql(CLEAN.cleanup_sql(before, plan), check=False)
            self.assertNotEqual(0, rejected.returncode)
            self.assertEqual('2', sql('SELECT count(*) FROM hub_user;').stdout.strip())
            self.assertEqual('1', sql('SELECT count(*) FROM spring_session;').stdout.strip())
            current = read()
            plan = CLEAN.make_plan(current, 'wutong')
            sql(CLEAN.cleanup_sql(current, plan))
            CLEAN.verify_preserved(read(), plan)
            self.assertEqual('unchanged-bcrypt-sentinel', sql("SELECT password_hash FROM hub_user WHERE username='wutong';").stdout.strip())
            self.assertEqual('0|0|0', sql('SELECT (SELECT count(*) FROM spring_session),(SELECT count(*) FROM spring_session_attributes),(SELECT count(*) FROM hub_login_attempt);').stdout.strip())
            self.assertEqual('local-regression-sentinel', sql("SELECT data->>'retainedSecret' FROM hub_entity WHERE kind='resource-target' AND id='newapi';").stdout.strip())
        finally:
            subprocess.run(['dropdb', database], check=True, capture_output=True)


if __name__ == '__main__':
    unittest.main(verbosity=2)
