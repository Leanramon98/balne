-- Migration: Create core domain tables

SET search_path TO evaluations_service;

-- ── 1. AxisLevel ───────────────────────────────────────────────────────

CREATE TABLE axis_level (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  axis VARCHAR(10) NOT NULL UNIQUE,
  objective_percent DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  sort_order INT NOT NULL
);

-- ── 2. Scope ──────────────────────────────────────────────────────────

CREATE TABLE scope (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  axis VARCHAR(10) NOT NULL,
  acronym VARCHAR(10) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  sort_order INT NOT NULL
);
CREATE INDEX idx_scope_axis ON scope(axis);

-- ── 3. Requirement ─────────────────────────────────────────────────────

CREATE TABLE requirement (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scope_id UUID NOT NULL REFERENCES scope(id),
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT
);
CREATE INDEX idx_requirement_scope ON requirement(scope_id);

-- ── 4. Indicator ───────────────────────────────────────────────────────

CREATE TABLE indicator (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requirement_id UUID NOT NULL REFERENCES requirement(id),
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type indicator_type NOT NULL DEFAULT 'gradient',
  criteria JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_indicator_requirement ON indicator(requirement_id);

-- ── 5. Destination ─────────────────────────────────────────────────────

CREATE TABLE destination (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  country VARCHAR(100) NOT NULL,
  subnational_level_id UUID REFERENCES subnational_level(id),
  typology_id UUID REFERENCES destination_typology(id),
  population_range_id UUID REFERENCES population_range(id),
  region_id UUID REFERENCES region(id),
  member_type_id UUID REFERENCES member_type(id),
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  is_adhered BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ── 6. Evaluation ──────────────────────────────────────────────────────

CREATE TABLE evaluation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  destination_id UUID NOT NULL REFERENCES destination(id),
  name VARCHAR(255) NOT NULL,
  type evaluation_type NOT NULL,
  status evaluation_status NOT NULL DEFAULT 'borrador',
  start_date DATE,
  end_date DATE,
  has_external_evaluator BOOLEAN DEFAULT false,
  promoted_from_id UUID REFERENCES evaluation(id),
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_evaluation_destination ON evaluation(destination_id);
CREATE INDEX idx_evaluation_status ON evaluation(status);

-- ── 7. EvaluationUser (access control) ────────────────────────────────

CREATE TABLE evaluation_user (
  evaluation_id UUID NOT NULL REFERENCES evaluation(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  access_level access_level NOT NULL DEFAULT 'solo_lectura',
  PRIMARY KEY (evaluation_id, user_id)
);

-- ── 8. IndicatorValue ──────────────────────────────────────────────────

CREATE TABLE indicator_value (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_id UUID NOT NULL REFERENCES indicator(id),
  evaluation_id UUID NOT NULL REFERENCES evaluation(id) ON DELETE CASCADE,
  destination_value INT CHECK (destination_value >= 0 AND destination_value <= 100),
  evaluator_value INT CHECK (evaluator_value >= 0 AND evaluator_value <= 100),
  meta INT,
  meta_date DATE,
  destination_observations TEXT,
  evaluator_observations TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_by VARCHAR(255),
  verified_at TIMESTAMP,
  is_editing_enabled BOOLEAN DEFAULT true,
  analisis_ia TEXT,
  sugerencias_mejora_ia TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (indicator_id, evaluation_id)
);
CREATE INDEX idx_indicator_value_evaluation ON indicator_value(evaluation_id);
CREATE INDEX idx_indicator_value_indicator ON indicator_value(indicator_id);

-- ── 9. IndicatorHistory ────────────────────────────────────────────────

CREATE TABLE indicator_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_value_id UUID NOT NULL REFERENCES indicator_value(id),
  previous_evaluation_id UUID NOT NULL REFERENCES evaluation(id),
  destination_value INT,
  evaluator_value INT,
  observations TEXT,
  source VARCHAR(50) DEFAULT 'promotion',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ── 10. IndicatorMessage ───────────────────────────────────────────────

CREATE TABLE indicator_message (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_value_id UUID NOT NULL REFERENCES indicator_value(id),
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_indicator_message_value ON indicator_message(indicator_value_id);

-- ── 11. Action ─────────────────────────────────────────────────────────

CREATE TABLE action (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  destination_id UUID NOT NULL REFERENCES destination(id),
  name VARCHAR(255) NOT NULL,
  summary TEXT,
  objective TEXT,
  status action_status NOT NULL DEFAULT 'idea',
  axes JSONB DEFAULT '[]',
  scopes JSONB DEFAULT '[]',
  extended_description TEXT,
  complexity VARCHAR(50),
  horizon VARCHAR(50),
  start_date DATE,
  end_date DATE,
  responsible_person VARCHAR(255),
  responsible_area_id UUID REFERENCES responsible_area(id),
  actors TEXT,
  ods JSONB DEFAULT '[]',
  budget_amount DECIMAL(15,2),
  budget_currency VARCHAR(3) DEFAULT 'EUR',
  budget_executed DECIMAL(15,2),
  budget_source TEXT,
  photo_url TEXT,
  website_url TEXT,
  awards TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_action_destination ON action(destination_id);

-- ── 12. ActionEvidence ─────────────────────────────────────────────────

CREATE TABLE action_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_id UUID NOT NULL REFERENCES action(id) ON DELETE CASCADE,
  evaluation_id UUID NOT NULL REFERENCES evaluation(id),
  type evidence_type NOT NULL DEFAULT 'document',
  url TEXT,
  file_path TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ── 13. ActionIndicatorLink ────────────────────────────────────────────

CREATE TABLE action_indicator_link (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_id UUID NOT NULL REFERENCES action(id) ON DELETE CASCADE,
  indicator_id UUID NOT NULL REFERENCES indicator(id),
  evaluation_id UUID NOT NULL REFERENCES evaluation(id),
  action_status_at_link action_status NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (action_id, indicator_id, evaluation_id)
);

-- ── 14. GoodPractice ───────────────────────────────────────────────────

CREATE TABLE good_practice (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_id UUID NOT NULL REFERENCES action(id) ON DELETE CASCADE UNIQUE,
  designated_by UUID NOT NULL,
  designated_at TIMESTAMP DEFAULT NOW(),
  approved_by UUID,
  approved_at TIMESTAMP,
  status gp_status NOT NULL DEFAULT 'designated'
);

-- ── 15. DtiPlan ────────────────────────────────────────────────────────

CREATE TABLE dti_plan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  destination_id UUID NOT NULL REFERENCES destination(id),
  name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status dti_plan_status NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ── 16. DtiPlanGoal ────────────────────────────────────────────────────

CREATE TABLE dti_plan_goal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dti_plan_id UUID NOT NULL REFERENCES dti_plan(id) ON DELETE CASCADE,
  indicator_id UUID NOT NULL REFERENCES indicator(id),
  current_score INT,
  target_score INT NOT NULL,
  target_date DATE,
  UNIQUE (dti_plan_id, indicator_id)
);
