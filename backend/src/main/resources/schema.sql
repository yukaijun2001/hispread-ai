CREATE TABLE IF NOT EXISTS hub_entity (
 id varchar(100) NOT NULL,
 kind varchar(80) NOT NULL,
 owner_id varchar(100) NOT NULL,
 data jsonb NOT NULL,
 version bigint NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(kind,id)
);
CREATE INDEX IF NOT EXISTS hub_entity_tenant ON hub_entity(kind,owner_id);
CREATE TABLE IF NOT EXISTS hub_user (
 id varchar(100) PRIMARY KEY,
 username varchar(100) NOT NULL UNIQUE,
 password_hash varchar(100) NOT NULL,
 supplier_id varchar(100),
 profile jsonb NOT NULL,
 enabled boolean NOT NULL DEFAULT true,
 session_version bigint NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS hub_login_attempt (
 username varchar(100) PRIMARY KEY,
 failures integer NOT NULL DEFAULT 0,
 window_started timestamptz NOT NULL DEFAULT now()
);
