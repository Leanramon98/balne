-- DTI Evaluation System — Schema, Tables & Seed Data
-- Runs after init_generated.sql (alphabetical order)

DROP SCHEMA IF EXISTS evaluations_service CASCADE;
CREATE SCHEMA IF NOT EXISTS evaluations_service;
SET search_path TO evaluations_service, public;

-- ── Custom Types ─────────────────────────────────────────────────────
CREATE TYPE evaluation_type AS ENUM ('autodiagnostico','diagnostico','auditoria','medicion_espontanea');
CREATE TYPE evaluation_status AS ENUM ('borrador','en_curso','carga_finalizada','en_evaluacion','cerrada','anulada');
CREATE TYPE access_level AS ENUM ('solo_lectura','carga','evaluador','administracion');
CREATE TYPE indicator_type AS ENUM ('gradient','boolean','numeric');
CREATE TYPE action_status AS ENUM ('idea','en_planificacion','en_ejecucion','finalizada','descartada');
CREATE TYPE evidence_type AS ENUM ('document','url','audiovisual','press');
CREATE TYPE gp_status AS ENUM ('designated','approved','rejected');
CREATE TYPE dti_plan_status AS ENUM ('activo','cerrado');

-- ── Catalog Tables ────────────────────────────────────────────────────
CREATE TABLE subnational_level (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), country VARCHAR(100) NOT NULL DEFAULT '', name VARCHAR(255) NOT NULL);
CREATE TABLE destination_typology (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name VARCHAR(255) NOT NULL);
CREATE TABLE population_range (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name VARCHAR(255) NOT NULL);
CREATE TABLE region (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name VARCHAR(255) NOT NULL, description TEXT);
CREATE TABLE member_type (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name VARCHAR(255) NOT NULL);
CREATE TABLE responsible_area (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name VARCHAR(255) NOT NULL, description TEXT);
CREATE TABLE axis_level (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), axis VARCHAR(10) NOT NULL UNIQUE, objective_percent DECIMAL(5,2) NOT NULL DEFAULT 20.00, sort_order INT NOT NULL);
CREATE TABLE scope (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), axis VARCHAR(10) NOT NULL, acronym VARCHAR(10) NOT NULL, name VARCHAR(255) NOT NULL, description TEXT, icon VARCHAR(100), sort_order INT NOT NULL);
CREATE TABLE requirement (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), scope_id UUID NOT NULL REFERENCES scope(id), code VARCHAR(20) NOT NULL UNIQUE, name VARCHAR(255) NOT NULL, description TEXT);
CREATE TABLE indicator (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), requirement_id UUID NOT NULL REFERENCES requirement(id), code VARCHAR(20) NOT NULL UNIQUE, name VARCHAR(255) NOT NULL, description TEXT, type indicator_type NOT NULL DEFAULT 'gradient', criteria JSONB NOT NULL DEFAULT '[]', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
CREATE TABLE destination (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name VARCHAR(255) NOT NULL, country VARCHAR(100) NOT NULL, subnational_level_id UUID REFERENCES subnational_level(id), typology_id UUID REFERENCES destination_typology(id), population_range_id UUID REFERENCES population_range(id), region_id UUID REFERENCES region(id), member_type_id UUID REFERENCES member_type(id), lat DECIMAL(10,7), lng DECIMAL(10,7), is_adhered BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());

-- ── Domain Tables ─────────────────────────────────────────────────────
CREATE TABLE evaluation (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), destination_id UUID NOT NULL REFERENCES destination(id), name VARCHAR(255) NOT NULL, type evaluation_type NOT NULL, status evaluation_status NOT NULL DEFAULT 'borrador', start_date DATE, end_date DATE, has_external_evaluator BOOLEAN DEFAULT false, promoted_from_id UUID REFERENCES evaluation(id), created_by UUID NOT NULL, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
CREATE TABLE evaluation_user (evaluation_id UUID NOT NULL REFERENCES evaluation(id) ON DELETE CASCADE, user_id UUID NOT NULL, access_level access_level NOT NULL DEFAULT 'solo_lectura', PRIMARY KEY (evaluation_id, user_id));
CREATE TABLE indicator_value (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), indicator_id UUID NOT NULL REFERENCES indicator(id), evaluation_id UUID NOT NULL REFERENCES evaluation(id) ON DELETE CASCADE, destination_value INT CHECK (destination_value >= 0 AND destination_value <= 100), evaluator_value INT CHECK (evaluator_value >= 0 AND evaluator_value <= 100), meta INT, meta_date DATE, destination_observations TEXT, evaluator_observations TEXT, is_verified BOOLEAN DEFAULT false, verified_by VARCHAR(255), verified_at TIMESTAMP, is_editing_enabled BOOLEAN DEFAULT true, analisis_ia TEXT, sugerencias_mejora_ia TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW(), UNIQUE (indicator_id, evaluation_id));
CREATE TABLE indicator_history (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), indicator_value_id UUID NOT NULL REFERENCES indicator_value(id), previous_evaluation_id UUID NOT NULL REFERENCES evaluation(id), destination_value INT, evaluator_value INT, observations TEXT, source VARCHAR(50) DEFAULT 'promotion', created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE indicator_message (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), indicator_value_id UUID NOT NULL REFERENCES indicator_value(id), user_id UUID NOT NULL, message TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE action (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), destination_id UUID NOT NULL REFERENCES destination(id), name VARCHAR(255) NOT NULL, summary TEXT, objective TEXT, status action_status NOT NULL DEFAULT 'idea', axes JSONB DEFAULT '[]', scopes JSONB DEFAULT '[]', extended_description TEXT, complexity VARCHAR(50), horizon VARCHAR(50), start_date DATE, end_date DATE, responsible_person VARCHAR(255), responsible_area_id UUID REFERENCES responsible_area(id), actors TEXT, ods JSONB DEFAULT '[]', budget_amount DECIMAL(15,2), budget_currency VARCHAR(3) DEFAULT 'EUR', budget_executed DECIMAL(15,2), budget_source TEXT, photo_url TEXT, website_url TEXT, awards TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
CREATE TABLE action_evidence (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), action_id UUID NOT NULL REFERENCES action(id) ON DELETE CASCADE, evaluation_id UUID NOT NULL REFERENCES evaluation(id), type evidence_type NOT NULL DEFAULT 'document', url TEXT, file_path TEXT, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE action_indicator_link (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), action_id UUID NOT NULL REFERENCES action(id) ON DELETE CASCADE, indicator_id UUID NOT NULL REFERENCES indicator(id), evaluation_id UUID NOT NULL REFERENCES evaluation(id), action_status_at_link action_status NOT NULL, created_at TIMESTAMP DEFAULT NOW(), UNIQUE (action_id, indicator_id, evaluation_id));
CREATE TABLE good_practice (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), action_id UUID NOT NULL REFERENCES action(id) ON DELETE CASCADE UNIQUE, designated_by UUID NOT NULL, designated_at TIMESTAMP DEFAULT NOW(), approved_by UUID, approved_at TIMESTAMP, status gp_status NOT NULL DEFAULT 'designated');
CREATE TABLE dti_plan (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), destination_id UUID NOT NULL REFERENCES destination(id), name VARCHAR(255) NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, status dti_plan_status NOT NULL DEFAULT 'activo', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
CREATE TABLE dti_plan_goal (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), dti_plan_id UUID NOT NULL REFERENCES dti_plan(id) ON DELETE CASCADE, indicator_id UUID NOT NULL REFERENCES indicator(id), current_score INT, target_score INT NOT NULL, target_date DATE, UNIQUE (dti_plan_id, indicator_id));

-- Indexes
CREATE INDEX idx_evaluation_destination ON evaluation(destination_id);
CREATE INDEX idx_evaluation_status ON evaluation(status);
CREATE INDEX idx_indicator_value_evaluation ON indicator_value(evaluation_id);
CREATE INDEX idx_indicator_value_indicator ON indicator_value(indicator_id);
CREATE INDEX idx_indicator_message_value ON indicator_message(indicator_value_id);
CREATE INDEX idx_action_destination ON action(destination_id);
CREATE INDEX idx_requirement_scope ON requirement(scope_id);
CREATE INDEX idx_indicator_requirement ON indicator(requirement_id);
CREATE INDEX idx_scope_axis ON scope(axis);
-- ── Seed: Member Types ───────────────────────────────────────────────
INSERT INTO member_type (id, name) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Destinos'),
  ('a0000000-0000-0000-0000-000000000002', 'Ejemplo')
ON CONFLICT DO NOTHING;

-- ── Seed: Typologies ────────────────────────────────────────────────
INSERT INTO destination_typology (id, name) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Emergente'),
  ('b0000000-0000-0000-0000-000000000002', 'Consolidado')
ON CONFLICT DO NOTHING;

-- ── Seed: Population Ranges ─────────────────────────────────────────
INSERT INTO population_range (id, name) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Hasta 10.000'),
  ('c0000000-0000-0000-0000-000000000002', 'De 10.001 a 50.000'),
  ('c0000000-0000-0000-0000-000000000003', 'De 50.001 a 100.000'),
  ('c0000000-0000-0000-0000-000000000004', 'De 100.001 a 1 Millon'),
  ('c0000000-0000-0000-0000-000000000005', 'Mas de 1 Millon')
ON CONFLICT DO NOTHING;

-- ── Seed: Axis Levels ───────────────────────────────────────────────
INSERT INTO axis_level (id, axis, objective_percent, sort_order) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'GOB', 80.00, 1),
  ('d0000000-0000-0000-0000-000000000002', 'INN', 80.00, 2),
  ('d0000000-0000-0000-0000-000000000003', 'TEC', 80.00, 3),
  ('d0000000-0000-0000-0000-000000000004', 'SOST', 80.00, 4),
  ('d0000000-0000-0000-0000-000000000005', 'ACC', 80.00, 5)
ON CONFLICT DO NOTHING;

-- ── Seed: Users-Service Roles (for DTI profiles) ─────────────────────
INSERT INTO users_service.role (id, name, description, permissions) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'admin', 'Super admin — full access', '{"access_scope":"global","can_write_values":true,"can_manage_users":true,"can_approve_good_practices":true,"evaluation_types":[]}'),
  ('e0000000-0000-0000-0000-000000000002', 'admin_destino', 'Destination admin', '{"access_scope":"own_destination","can_write_values":true,"can_manage_users":true,"can_approve_good_practices":true,"evaluation_types":["autodiagnostico","diagnostico","auditoria","medicion_espontanea"]}'),
  ('e0000000-0000-0000-0000-000000000003', 'gestor_destino', 'Destination manager', '{"access_scope":"own_destination","can_write_values":true,"can_manage_users":false,"can_approve_good_practices":false,"evaluation_types":["autodiagnostico","diagnostico","auditoria","medicion_espontanea"]}'),
  ('e0000000-0000-0000-0000-000000000004', 'consultor', 'External consultant', '{"access_scope":"assigned_evaluations","can_write_values":true,"can_manage_users":false,"can_approve_good_practices":false,"evaluation_types":["autodiagnostico","diagnostico"]}'),
  ('e0000000-0000-0000-0000-000000000005', 'auditor', 'External auditor', '{"access_scope":"assigned_evaluations","can_write_values":true,"can_manage_users":false,"can_approve_good_practices":false,"evaluation_types":["auditoria"]}'),
  ('e0000000-0000-0000-0000-000000000006', 'gestor_regional', 'Regional manager', '{"access_scope":"regional","can_write_values":false,"can_manage_users":false,"can_approve_good_practices":false,"evaluation_types":[]}'),
  ('e0000000-0000-0000-0000-000000000007', 'gestor_nacional', 'National manager', '{"access_scope":"national","can_write_values":false,"can_manage_users":false,"can_approve_good_practices":false,"evaluation_types":[]}')
ON CONFLICT DO NOTHING;

-- ── Seed: Admin user (password: "admin123", bcrypt hash) ─────────────
INSERT INTO users_service."user" (id, email, passwordhash, fullname, roleid, isactive, destinationid, createdat, updatedat)
SELECT 'f0000000-0000-0000-0000-000000000001', 'admin@dti.org',
  '$2b$12$NVuQ.hruinl8OLywTpBiTul2od1IHb0SlTznKIw/qY2AwPuggYcGm',
  'Admin DTI', 'e0000000-0000-0000-0000-000000000001', true,
  '00000000-0000-0000-0000-000000000000', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users_service."user" WHERE email = 'admin@dti.org');
