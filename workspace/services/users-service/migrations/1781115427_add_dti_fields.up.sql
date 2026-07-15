-- Migration: Add DTI fields to users-service
-- Adds destination_id to user table and permissions to role table
-- Seeds the 7 DTI roles with their permission sets

-- 1. Add destination_id column to user (nullable UUID)
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS destination_id UUID;

-- 2. Add permissions column to role (JSONB)
ALTER TABLE role ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{}';

-- 3. Seed 7 DTI roles (idempotent — uses ON CONFLICT DO NOTHING)
INSERT INTO role (id, name, description, permissions) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin',
   'Super admin — full access',
   '{"access_scope":"global","can_write_values":true,"can_manage_users":true,"can_approve_good_practices":true,"evaluation_types":["autodiagnostico","diagnostico","auditoria","medicion_espontanea"]}'),
  ('00000000-0000-0000-0000-000000000002', 'admin_destino',
   'Destination admin',
   '{"access_scope":"destination","can_write_values":true,"can_manage_users":true,"can_approve_good_practices":true,"evaluation_types":["autodiagnostico","diagnostico","auditoria","medicion_espontanea"]}'),
  ('00000000-0000-0000-0000-000000000003', 'gestor_destino',
   'Destination manager',
   '{"access_scope":"destination","can_write_values":true,"can_manage_users":true,"can_approve_good_practices":false,"evaluation_types":["autodiagnostico","diagnostico"]}'),
  ('00000000-0000-0000-0000-000000000004', 'consultor',
   'External consultant',
   '{"access_scope":"destination","can_write_values":false,"can_manage_users":false,"can_approve_good_practices":false,"evaluation_types":[]}'),
  ('00000000-0000-0000-0000-000000000005', 'auditor',
   'External auditor',
   '{"access_scope":"destination","can_write_values":false,"can_manage_users":false,"can_approve_good_practices":false,"evaluation_types":[]}'),
  ('00000000-0000-0000-0000-000000000006', 'gestor_regional',
   'Regional manager',
   '{"access_scope":"destination","can_write_values":false,"can_manage_users":false,"can_approve_good_practices":false,"evaluation_types":[]}'),
  ('00000000-0000-0000-0000-000000000007', 'gestor_nacional',
   'National manager',
   '{"access_scope":"destination","can_write_values":false,"can_manage_users":false,"can_approve_good_practices":false,"evaluation_types":[]}')
ON CONFLICT (name) DO NOTHING;
