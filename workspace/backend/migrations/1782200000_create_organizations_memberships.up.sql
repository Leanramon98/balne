-- User-owned additive foundation migration for users_service schema.
-- No destructive down migration is provided.
--
-- All catalog lookups use pg_catalog-qualified system tables with
-- OID-based table resolution against explicit schema + table names.
-- This ensures correct behavior regardless of search_path settings.

CREATE SCHEMA IF NOT EXISTS users_service;

CREATE TABLE IF NOT EXISTS users_service.organizations (
    id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users_service.organizations
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS users_service.memberships (
    id UUID,
    organization_id UUID,
    principal_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users_service.memberships
    ADD COLUMN IF NOT EXISTS organization_id UUID,
    ADD COLUMN IF NOT EXISTS principal_id UUID,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE users_service.memberships
    ALTER COLUMN organization_id SET NOT NULL,
    ALTER COLUMN principal_id SET NOT NULL;

DO $$
DECLARE
    org_oid oid;
    mem_oid oid;
BEGIN
    -- Resolve table OIDs via pg_catalog with explicit schema qualification.
    -- This is search_path-independent and avoids ambiguity when the same
    -- table name exists in multiple schemas.
    SELECT c.oid INTO org_oid
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = 'organizations' AND n.nspname = 'users_service';

    SELECT c.oid INTO mem_oid
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = 'memberships' AND n.nspname = 'users_service';

    -- organizations_pkey
    IF NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_constraint
        WHERE conname = 'organizations_pkey' AND conrelid = org_oid
    ) THEN
        ALTER TABLE users_service.organizations ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);
    END IF;

    -- memberships_pkey
    IF NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_constraint
        WHERE conname = 'memberships_pkey' AND conrelid = mem_oid
    ) THEN
        ALTER TABLE users_service.memberships ADD CONSTRAINT memberships_pkey PRIMARY KEY (id);
    END IF;

    -- memberships -> organizations FK
    IF NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_constraint
        WHERE conname = 'memberships_organization_fk' AND conrelid = mem_oid
    ) THEN
        ALTER TABLE users_service.memberships ADD CONSTRAINT memberships_organization_fk
            FOREIGN KEY (organization_id) REFERENCES users_service.organizations(id) ON DELETE CASCADE;
    END IF;

    -- memberships_org_principal_key (unique)
    IF NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_constraint
        WHERE conname = 'memberships_org_principal_key' AND conrelid = mem_oid
    ) THEN
        ALTER TABLE users_service.memberships ADD CONSTRAINT memberships_org_principal_key
            UNIQUE (organization_id, principal_id);
    END IF;
END $$;

-- Schema-qualified index creation with pg_catalog.pg_indexes guard.
-- Using a DO block with a pg_indexes check ensures that even if an index
-- with the same name exists in a different schema, the correct schema's
-- index is still created.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_indexes
        WHERE schemaname = 'users_service'
          AND tablename  = 'memberships'
          AND indexname  = 'memberships_organization_idx'
    ) THEN
        CREATE INDEX memberships_organization_idx ON users_service.memberships (organization_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_indexes
        WHERE schemaname = 'users_service'
          AND tablename  = 'memberships'
          AND indexname  = 'memberships_principal_idx'
    ) THEN
        CREATE INDEX memberships_principal_idx ON users_service.memberships (principal_id);
    END IF;
END $$;
