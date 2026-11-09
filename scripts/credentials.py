#!/usr/bin/env python3
"""Show local account names. --passwords explicitly reveals this local .env."""
from pathlib import Path
import argparse
parser = argparse.ArgumentParser()
parser.add_argument('--passwords', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
path = root / '.env' if (root / '.env').is_file() else root / 'backend' / '.env'
values = {}
for line in path.read_text().splitlines():
    if '=' in line and not line.startswith('#'):
        key, value = line.split('=', 1)
        values[key.removeprefix('export ')] = value.strip().strip("'\"")
for role, prefix in [
    ('平台最高管理员', 'ADMIN'),
    ('平台运营', 'OPERATOR'),
    ('财务人员', 'FINANCE'),
    ('供应商主账号', 'SEED'),
    ('供应商子账号', 'MEMBER'),
]:
    print(role + ': ' + values.get(prefix + '_USERNAME', '(unset)'))
    if args.passwords:
        print('  password: ' + values.get(prefix + '_PASSWORD', '(unset)'))
