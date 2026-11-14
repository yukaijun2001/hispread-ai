-- No upstream writes or financial transitions during upgrade. Preserve all history.
UPDATE hub_entity
SET data = data || jsonb_build_object(
      'enabled', false, 'running', false, 'nextRunAt', NULL, 'scopeRevision', 'delivery-only-v1',
      'retired', COALESCE(data->>'type', '') <> 'CCMAX_STATUS_SYNC',
      'version', version + 1, 'updatedAt', now()::text),
    version = version + 1, updated_at = now()
WHERE kind = 'scheduled-task';

UPDATE hub_entity
SET data = data || jsonb_build_object(
      'state', 'TIMED_OUT', 'resultCode', 'TASK_SCOPE_CHANGED', 'finishedAt', now()::text,
      'version', version + 1, 'updatedAt', now()::text),
    version = version + 1, updated_at = now()
WHERE kind = 'scheduled-run' AND data->>'state' = 'RUNNING';

UPDATE hub_entity
SET data = data || jsonb_build_object(
      'enabled', false, 'retired', true, 'version', version + 1, 'updatedAt', now()::text),
    version = version + 1, updated_at = now()
WHERE kind = 'monitoring-source';

UPDATE hub_entity
SET data = data || jsonb_build_object(
      'autoRenewEnabled', false, 'version', version + 1, 'updatedAt', now()::text),
    version = version + 1, updated_at = now()
WHERE kind = 'quote' AND data->>'autoRenewEnabled' = 'true';
