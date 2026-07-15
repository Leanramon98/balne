// DTI Evaluation System Types

export type EvaluationType = 'autodiagnostico' | 'diagnostico' | 'auditoria' | 'medicion_espontanea';
export type EvaluationStatus = 'borrador' | 'en_curso' | 'carga_finalizada' | 'en_evaluacion' | 'cerrada' | 'anulada';
export type ActionStatus = 'idea' | 'en_planificacion' | 'en_ejecucion' | 'finalizada' | 'descartada';
export type AccessLevel = 'solo_lectura' | 'carga' | 'evaluador' | 'administracion';
export type IndicatorType = 'gradient' | 'boolean' | 'numeric' | 'suma';
export type AxisEnum = 'gob' | 'inn' | 'tec' | 'sost' | 'acc';
export type GpStatus = 'designated' | 'approved' | 'rejected';
export type DtiPlanStatus = 'activo' | 'cerrado';
export type EvidenceType = 'document' | 'url' | 'audiovisual' | 'press';

export interface Destination {
  id: string;
  name: string;
  country: string;
  subnational_level_id?: string;
  typology_id?: string;
  population_range_id?: string;
  region_id?: string;
  member_type_id?: string;
  lat?: number;
  lng?: number;
  is_adhered: boolean;
  created_at: string;
  updated_at: string;
}

export interface Evaluation {
  id: string;
  destination_id: string;
  name: string;
  type: EvaluationType;
  status: EvaluationStatus;
  start_date?: string;
  end_date?: string;
  has_external_evaluator: boolean;
  promoted_from_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  destination_name?: string;
  created_by_name?: string;
  allowed_transitions?: EvaluationStatus[];
}

export interface PaginatedEvaluations {
  data: Evaluation[];
  total: number;
  limit: number;
  offset: number;
}

export interface EvaluationUser {
  evaluation_id: string;
  user_id: string;
  access_level: AccessLevel;
  user_name?: string;
  user_email?: string;
  is_implicit?: boolean;
}

export interface Scope {
  id: string;
  axis: AxisEnum;
  acronym: string;
  name: string;
  description?: string;
  icon?: string;
  sort_order: number;
}

export interface Requirement {
  id: string;
  scope_id: string;
  code: string;
  name: string;
  description?: string;
}

export interface IndicatorCriteria {
  level?: number;
  value?: number;
  description?: string;
  unit?: string;
  min?: number;
  max?: number;
}

export interface MappingRule {
  tipo: string;
  valor: string;
}

export interface Indicator {
  id: string;
  requirement_id: string;
  code: string;
  name: string;
  description?: string;
  type: IndicatorType;
  criteria: IndicatorCriteria[];
  nivel?: string;
  tipologia?: string;
  clasificacion?: string;
  requirement_description?: string;
  indicator_description?: string;
  tags?: string[];
  mapping_rules?: MappingRule[];
  created_at: string;
  updated_at: string;
}

export interface IndicatorValue {
  id: string;
  indicator_id: string;
  evaluation_id: string;
  destination_value?: number;
  evaluator_value?: number;
  meta?: number;
  meta_date?: string;
  destination_observations?: string;
  evaluator_observations?: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  is_editing_enabled: boolean;
  analisis_ia?: string;
  sugerencias_mejora_ia?: string;
  created_at: string;
  updated_at: string;
  indicator?: Indicator;
  requirement?: Requirement;
  scope?: Scope;
  history?: IndicatorHistory[];
}

export interface IndicatorHistory {
  id: string;
  indicator_value_id: string;
  previous_evaluation_id: string;
  destination_value?: number;
  evaluator_value?: number;
  destination_observations?: string;
  evaluator_observations?: string;
  observations?: string;
  meta?: number;
  source: string;
  modified_by?: string;
  created_at: string;
}

export interface IndicatorMessage {
  id: string;
  indicator_value_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

export interface Action {
  id: string;
  destination_id: string;
  name: string;
  summary?: string;
  objective?: string;
  status: ActionStatus;
  axes: string[];
  scopes: string[];
  extended_description?: string;
  complexity?: string;
  horizon?: string;
  start_date?: string;
  end_date?: string;
  responsible_person?: string;
  responsible_area_id?: string;
  actors?: string;
  ods: ODSItem[];
  budget_amount?: number;
  budget_currency: string;
  budget_executed?: number;
  budget_source?: string;
  photo_url?: string;
  website_url?: string;
  awards?: string;
  created_at: string;
  updated_at: string;
  good_practice?: GoodPractice;
  linked_indicators?: IndicatorLink[];
}

export interface ODSItem {
  ods_id: string;
  contribution: string;
}

export interface ActionEvidence {
  id: string;
  action_id: string;
  evaluation_id: string;
  type: EvidenceType;
  url?: string;
  file_path?: string;
  created_at: string;
}

export interface ActionIndicatorLink {
  id: string;
  action_id: string;
  indicator_id: string;
  evaluation_id: string;
  action_status_at_link: ActionStatus;
  created_at: string;
  indicator_name?: string;
  indicator_code?: string;
}

export interface IndicatorLink {
  indicator_id: string;
  evaluation_id: string;
  action_status_at_link: ActionStatus;
  indicator_name?: string;
  indicator_code?: string;
}

export interface GoodPractice {
  id: string;
  action_id: string;
  designated_by: string;
  designated_at: string;
  approved_by?: string;
  approved_at?: string;
  status: GpStatus;
  designated_by_name?: string;
  approved_by_name?: string;
}

export interface DtiPlan {
  id: string;
  destination_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: DtiPlanStatus;
  created_at: string;
  updated_at: string;
  destination_name?: string;
}

export interface DtiPlanGoal {
  id: string;
  dti_plan_id: string;
  indicator_id: string;
  current_score?: number;
  target_score: number;
  target_date?: string;
  indicator_name?: string;
  indicator_code?: string;
}

export interface ScopeProgress {
  scope_id: string;
  scope_name: string;
  scope_acronym: string;
  scope_icon?: string;
  axis?: AxisEnum;
  total_indicators: number;
  completed_indicators: number;
  percentage: number;
}

export interface ResultsData {
  destination_id: string;
  destination_name: string;
  country: string;
  typology?: string;
  population_range?: string;
  total_indicators: number;
  completed_indicators: number;
  percentage_by_scope: Record<string, number>;
  percentage_by_axis: Record<string, number>;
  total_compliance: number;
  completed_by_scope: Record<string, number>;
  total_by_scope: Record<string, number>;
}

export interface GoodPracticePublic {
  id: string;
  action_id: string;
  action_name: string;
  action_summary?: string;
  action_description?: string;
  destination_name: string;
  country: string;
  typology?: string;
  population_range?: string;
  scope_names: string[];
  axis_names: string[];
  ods?: ODSItem[];
  photo_url?: string;
  website_url?: string;
  awards?: string;
  evidence_docs?: string[];
  evidence_urls?: string[];
  audiovisual_links?: string[];
  press_notes?: string[];
  approved_at: string;
}

export interface ActionTranslation {
  id: string;
  action_id: string;
  locale: string;
  name: string;
  summary?: string;
  description?: string;
  ods?: ODSItem[];
  translated_at: string;
  translation_reviewed: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  action_name?: string;
  action_destination_id?: string;
  /** Original Spanish text (source for comparison during review). */
  source_name: string;
  source_summary?: string | null;
  source_description?: string | null;
}

// Admin catalogs
export interface Informe {
  id: string;
  evaluation_id?: string;
  destination_id: string;
  destination_name: string;
  year: number;
  name: string;
  file_url?: string;
  created_at: string;
}

export interface SubnationalLevel {
  id: string;
  country?: string;
  name: string;
}

export interface DestinationTypology {
  id: string;
  name: string;
}

export interface PopulationRange {
  id: string;
  name: string;
}

export interface Region {
  id: string;
  name: string;
  description?: string;
}

export interface MemberType {
  id: string;
  name: string;
}

export interface ResponsibleArea {
  id: string;
  name: string;
  description?: string;
}

export interface AxisLevel {
  id: string;
  axis: AxisEnum;
  objective_percent: number;
  sort_order: number;
}

// Profile types
export interface UpdateProfileDTO {
  full_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  preferences?: Record<string, unknown>;
}

export interface AuditLogFilter {
  entity_type?: string;
  action?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface ApiError {
  message: string;
  status: number;
  allowed_transitions?: EvaluationStatus[];
}

export interface SaveDestinationValueResponse extends IndicatorValue {
  status_changed?: boolean;
  new_status?: EvaluationStatus;
}

export interface IndicatorEditorProps {
  evaluationId: string;
  scopeId: string;
  indicatorId: string;
}

export interface IndicatorViewProps {
  evaluationId: string;
  scopeId: string;
  indicatorId: string;
}
