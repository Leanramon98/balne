# Modelo de Datos

## Entidades del Sistema

### Dominio Users Service

```
User
├── ID (uuid, PK)
├── Email (string, unique)
├── PasswordHash (string)
├── FullName (string)
├── RoleID (uuid -> Role)
├── IsActive (boolean)
├── DestinationID (uuid, nullable -> Destination)
├── CreatedAt (timestamp)
└── UpdatedAt (timestamp)

Role
├── ID (uuid, PK)
├── Name (string, unique)
├── Description (string)
└── Permissions (json)

AuditLog
├── ID (uuid, PK)
├── EntityType (string)
├── EntityID (uuid)
├── Action (string)
├── OldValue (json)
├── NewValue (json)
├── ChangedBy (uuid)
├── ChangedAt (timestamp)
└── IPAddress (string)
```

### Dominio Evaluations Service

```
Destination
├── ID (uuid, PK)
├── Name (string)
├── Country (string)
├── SubnationalLevelID (uuid, nullable)
├── TypologyID (uuid, nullable)
├── PopulationRangeID (uuid, nullable)
├── RegionID (uuid, nullable)
├── MemberTypeID (uuid, nullable)
├── Lat (decimal, nullable)
├── Lng (decimal, nullable)
├── IsAdhered (boolean)
├── CreatedAt (timestamp)
└── UpdatedAt (timestamp)

Evaluation
├── ID (uuid, PK)
├── DestinationID (uuid)
├── Name (string)
├── Type (enum: autodiagnostico, diagnostico, auditoria, medicion_espontanea)
├── Status (enum: borrador, en_curso, carga_finalizada, en_evaluacion, cerrada, anulada)
├── StartDate (timestamp, nullable)
├── EndDate (timestamp, nullable)
├── HasExternalEvaluator (boolean)
├── PromotedFromID (uuid, nullable)
├── CreatedBy (uuid)
├── CreatedAt (timestamp)
└── UpdatedAt (timestamp)

EvaluationUser
├── EvaluationID (uuid)
├── UserID (uuid)
├── AccessLevel (enum: solo_lectura, carga, evaluador, administracion)

Scope (Ambito)
├── ID (uuid, PK)
├── Axis (enum: gob, inn, tec, sost, acc)
├── Acronym (string)
├── Name (string)
├── Description (string)
├── Icon (string)
└── SortOrder (int)

Requirement
├── ID (uuid, PK)
├── ScopeID (uuid)
├── Code (string)     -- ej: ACC_A_01
├── Name (string)
└── Description (string)

Indicator
├── ID (uuid, PK)
├── RequirementID (uuid)
├── Code (string)     -- ej: ACC_A_01.1
├── Name (string)
├── Description (string)
├── Type (enum: gradient, boolean, numeric)
├── Criteria (json)
├── CreatedAt (timestamp)
└── UpdatedAt (timestamp)

IndicatorValue
├── ID (uuid, PK)
├── IndicatorID (uuid)
├── EvaluationID (uuid)
├── DestinationValue (int, nullable)
├── EvaluatorValue (int, nullable)
├── Meta (int, nullable)
├── MetaDate (timestamp, nullable)
├── DestinationObservations (text, nullable)
├── EvaluatorObservations (text, nullable)
├── IsVerified (boolean)
├── VerifiedBy (string, nullable)
├── VerifiedAt (timestamp, nullable)
├── IsEditingEnabled (boolean)
├── AnalisisIA (text, nullable)
├── SugerenciasMejoraIA (text, nullable)
├── CreatedAt (timestamp)
└── UpdatedAt (timestamp)

IndicatorHistory
├── ID (uuid, PK)
├── IndicatorValueID (uuid)
├── PreviousEvaluationID (uuid)
├── DestinationValue (int, nullable)
├── EvaluatorValue (int, nullable)
├── Observations (text, nullable)
├── Source (string)
└── CreatedAt (timestamp)

IndicatorMessage
├── ID (uuid, PK)
├── IndicatorValueID (uuid)
├── UserID (uuid)
├── Message (text)
└── CreatedAt (timestamp)

Action
├── ID (uuid, PK)
├── DestinationID (uuid)
├── Name (string)
├── Summary (string, nullable)
├── Objective (string, nullable)
├── Status (enum: idea, en_planificacion, en_ejecucion, finalizada, descartada)
├── Axes (json)
├── Scopes (json)
├── ExtendedDescription (text, nullable)
├── Complexity (string, nullable)
├── Horizon (string, nullable)
├── StartDate (timestamp, nullable)
├── EndDate (timestamp, nullable)
├── ResponsiblePerson (string, nullable)
├── ResponsibleAreaID (uuid, nullable)
├── Actors (text, nullable)
├── ODS (json)
├── BudgetAmount (decimal, nullable)
├── BudgetCurrency (string)
├── BudgetExecuted (decimal, nullable)
├── BudgetSource (string, nullable)
├── PhotoURL (string, nullable)
├── WebsiteURL (string, nullable)
├── Awards (text, nullable)
├── CreatedAt (timestamp)
└── UpdatedAt (timestamp)

ActionEvidence
├── ID (uuid, PK)
├── ActionID (uuid)
├── EvaluationID (uuid)
├── Type (enum: document, url, audiovisual, press)
├── URL (string, nullable)
├── FilePath (string, nullable)
└── CreatedAt (timestamp)

ActionIndicatorLink
├── ID (uuid, PK)
├── ActionID (uuid)
├── IndicatorID (uuid)
├── EvaluationID (uuid)
├── ActionStatusAtLink (enum: estado al momento del vinculo)
└── CreatedAt (timestamp)

GoodPractice
├── ID (uuid, PK)
├── ActionID (uuid)
├── DesignatedBy (uuid)
├── DesignatedAt (timestamp)
├── ApprovedBy (uuid, nullable)
├── ApprovedAt (timestamp, nullable)
└── Status (enum: designated, approved, rejected)

DtiPlan
├── ID (uuid, PK)
├── DestinationID (uuid)
├── Name (string)
├── StartDate (timestamp)
├── EndDate (timestamp)
├── Status (enum: activo, cerrado)
├── CreatedAt (timestamp)
└── UpdatedAt (timestamp)

DtiPlanGoal
├── ID (uuid, PK)
├── DtiPlanID (uuid)
├── IndicatorID (uuid)
├── CurrentScore (int, nullable)
├── TargetScore (int)
└── TargetDate (timestamp, nullable)
```

## Catalogos Administrativos

```
SubnationalLevel      - Niveles subnacionales por pais
DestinationTypology   - Tipologias de destino (Emergente, Consolidado)
PopulationRange       - Rangos de poblacion
Region                - Regiones (agrupa destinos)
MemberType            - Tipos de membresia (Destinos, Ejemplo)
ResponsibleArea       - Areas responsables de acciones
AxisLevel             - Niveles por eje (objetivos de cumplimiento %)
```

## Enumeraciones Clave

| Enumeracion | Valores |
|-------------|---------|
| EvaluationType | autodiagnostico, diagnostico, auditoria, medicion_espontanea |
| EvaluationStatus | borrador, en_curso, carga_finalizada, en_evaluacion, cerrada, anulada |
| AccessLevel | solo_lectura, carga, evaluador, administracion |
| ActionStatus | idea, en_planificacion, en_ejecucion, finalizada, descartada |
| IndicatorType | gradient, boolean, numeric |
| GpStatus | designated, approved, rejected |
| DtiPlanStatus | activo, cerrado |
| EvidenceType | document, url, audiovisual, press |
| Axis | gob, inn, tec, sost, acc |
