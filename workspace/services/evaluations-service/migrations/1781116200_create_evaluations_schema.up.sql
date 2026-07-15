-- Migration: Create evaluations_service schema and enums
-- Schema isolation: all tables go into evaluations_service schema

-- Create schema
CREATE SCHEMA IF NOT EXISTS evaluations_service;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set search path
SET search_path TO evaluations_service;

-- ── Custom Types ───────────────────────────────────────────────────────

CREATE TYPE evaluation_type AS ENUM (
  'autodiagnostico', 'diagnostico', 'auditoria', 'medicion_espontanea'
);

CREATE TYPE evaluation_status AS ENUM (
  'borrador', 'en_curso', 'carga_finalizada', 'en_evaluacion', 'cerrada', 'anulada'
);

CREATE TYPE access_level AS ENUM (
  'solo_lectura', 'carga', 'evaluador', 'administracion'
);

CREATE TYPE indicator_type AS ENUM (
  'gradient', 'boolean', 'numeric'
);

CREATE TYPE action_status AS ENUM (
  'idea', 'en_planificacion', 'en_ejecucion', 'finalizada', 'descartada'
);

CREATE TYPE evidence_type AS ENUM (
  'document', 'url', 'audiovisual', 'press'
);

CREATE TYPE gp_status AS ENUM (
  'designated', 'approved', 'rejected'
);

CREATE TYPE dti_plan_status AS ENUM (
  'activo', 'cerrado'
);

-- ── Catalog Tables ─────────────────────────────────────────────────────

CREATE TABLE subnational_level (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country VARCHAR(100) NOT NULL DEFAULT '',
  name VARCHAR(255) NOT NULL
);

CREATE TABLE destination_typology (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL
);

CREATE TABLE population_range (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL
);

CREATE TABLE region (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT
);

CREATE TABLE member_type (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL
);

CREATE TABLE responsible_area (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT
);
