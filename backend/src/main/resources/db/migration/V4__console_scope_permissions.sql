UPDATE hub_entity
SET data = jsonb_set(data, '{permissions}',
      COALESCE((SELECT jsonb_agg(permission)
                FROM jsonb_array_elements(data->'permissions') permission
                WHERE permission #>> '{}' NOT IN ('workbench.monitoring.read', 'workbench.monitoring.configure')), '[]'::jsonb))
      || jsonb_build_object('version', version + 1, 'updatedAt', now()::text),
    version = version + 1, updated_at = now()
WHERE kind = 'role' AND jsonb_typeof(data->'permissions') = 'array'
  AND (data->'permissions' ?| ARRAY['workbench.monitoring.read', 'workbench.monitoring.configure']);

UPDATE hub_user
SET profile = jsonb_set(profile, '{permissions}',
      COALESCE((SELECT jsonb_agg(permission)
                FROM jsonb_array_elements(profile->'permissions') permission
                WHERE permission #>> '{}' NOT IN ('workbench.monitoring.read', 'workbench.monitoring.configure')), '[]'::jsonb))
WHERE jsonb_typeof(profile->'permissions') = 'array'
  AND (profile->'permissions' ?| ARRAY['workbench.monitoring.read', 'workbench.monitoring.configure']);
