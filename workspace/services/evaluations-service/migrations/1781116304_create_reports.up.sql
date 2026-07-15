-- Migration: Create reports table for generated evaluation reports

SET search_path TO evaluations_service;

CREATE TABLE IF NOT EXISTS report (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_id UUID REFERENCES evaluation(id),
    destination_id UUID NOT NULL REFERENCES destination(id),
    year INTEGER NOT NULL,
    name TEXT NOT NULL,
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

CREATE INDEX idx_report_destination ON report(destination_id);
CREATE INDEX idx_report_evaluation ON report(evaluation_id);
CREATE INDEX idx_report_year ON report(year);
