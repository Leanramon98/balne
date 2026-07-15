-- Seed: 77 Requirements grouped by scope
-- Code format: EJE_AMB_NR (e.g., GOB_ORG_01)

SET search_path TO evaluations_service;

-- Scope IDs (deterministic)
-- GOB
\set ORG 'a0000000-0000-0000-0000-000000000001'
\set FIN 'a0000000-0000-0000-0000-000000000002'
\set PLA 'a0000000-0000-0000-0000-000000000003'
\set GEST 'a0000000-0000-0000-0000-000000000004'
-- INN
\set ECO 'a0000000-0000-0000-0000-000000000005'
\set DAT 'a0000000-0000-0000-0000-000000000006'
\set EXP 'a0000000-0000-0000-0000-000000000007'
-- TEC
\set INF 'a0000000-0000-0000-0000-000000000008'
\set CON 'a0000000-0000-0000-0000-000000000009'
\set SEN 'a0000000-0000-0000-0000-000000000010'
\set PLAT 'a0000000-0000-0000-0000-000000000011'
-- SOST
\set MED 'a0000000-0000-0000-0000-000000000012'
\set SOC 'a0000000-0000-0000-0000-000000000013'
\set ECON 'a0000000-0000-0000-0000-000000000014'
-- ACC
\set ACC_FIS 'a0000000-0000-0000-0000-000000000015'
\set ACC_DIG 'a0000000-0000-0000-0000-000000000016'
;

-- Note: psql variables don't work in INSERT statements directly.
-- Using literal UUIDs instead.

INSERT INTO requirement (id, scope_id, code, name, description) VALUES

-- ── GOB: ORG (4 requirements) ──────────────────────────────────────────
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'GOB_ORG_01', 'Estructura DTI', 'El destino cuenta con una estructura organizativa dedicada al DTI'),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'GOB_ORG_02', 'Liderazgo político', 'Existe liderazgo político comprometido con el proyecto DTI'),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'GOB_ORG_03', 'Equipo multidisciplinar', 'El equipo DTI cuenta con perfil multidisciplinar'),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'GOB_ORG_04', 'Participación público-privada', 'Existe colaboración público-privada en la gobernanza del DTI'),
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'GOB_ORG_05', 'Red DTI', 'El destino participa activamente en redes de DTI'),

-- ── GOB: FIN (5 requirements) ──────────────────────────────────────────
('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', 'GOB_FIN_01', 'Presupuesto DTI', 'El destino dispone de un presupuesto específico para el proyecto DTI'),
('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002', 'GOB_FIN_02', 'Diversificación financiera', 'Existen fuentes de financiación diversificadas'),
('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000002', 'GOB_FIN_03', 'Inversión TIC', 'Se realiza inversión sostenida en tecnología turística'),
('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000002', 'GOB_FIN_04', 'Retorno de inversión', 'Se mide el retorno de la inversión en el DTI'),
('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000002', 'GOB_FIN_05', 'Ayudas y subvenciones', 'El destino capta ayudas y subvenciones para el DTI'),

-- ── GOB: PLA (5 requirements) ──────────────────────────────────────────
('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000003', 'GOB_PLA_01', 'Plan estratégico', 'El destino cuenta con un plan estratégico DTI'),
('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000003', 'GOB_PLA_02', 'Hoja de ruta', 'Existe una hoja de ruta con hitos y plazos definidos'),
('b0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000003', 'GOB_PLA_03', 'Indicadores de seguimiento', 'Se definen KPIs para el seguimiento del plan'),
('b0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000003', 'GOB_PLA_04', 'Evaluación periódica', 'Se realizan evaluaciones periódicas del plan DTI'),
('b0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000003', 'GOB_PLA_05', 'Participación ciudadana', 'Existen mecanismos de participación ciudadana en la planificación'),

-- ── GOB: GEST (5 requirements) ─────────────────────────────────────────
('b0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000004', 'GOB_GEST_01', 'Sistema de calidad', 'El destino cuenta con un sistema de gestión de calidad'),
('b0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000004', 'GOB_GEST_02', 'Procesos definidos', 'Los procesos turísticos están documentados y optimizados'),
('b0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000004', 'GOB_GEST_03', 'Cartas de servicios', 'Se dispone de cartas de servicios turísticos'),
('b0000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000004', 'GOB_GEST_04', 'Satisfacción del turista', 'Se mide sistemáticamente la satisfacción del turista'),
('b0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000004', 'GOB_GEST_05', 'Gestión de reclamaciones', 'Existe un sistema de gestión de reclamaciones'),

-- ── INN: ECO (5 requirements) ──────────────────────────────────────────
('b0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000005', 'INN_ECO_01', 'Ecosistema innovador', 'El destino fomenta un ecosistema de innovación turística'),
('b0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000005', 'INN_ECO_02', 'Emprendimiento', 'Se apoya el emprendimiento turístico innovador'),
('b0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000005', 'INN_ECO_03', 'Colaboración universidad-empresa', 'Existe colaboración con universidades y centros de I+D'),
('b0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000005', 'INN_ECO_04', 'Laboratorio de innovación', 'El destino cuenta con un laboratorio de innovación turística'),
('b0000000-0000-0000-0000-000000000025', 'a0000000-0000-0000-0000-000000000005', 'INN_ECO_05', 'Premios e incentivos', 'Existen premios o incentivos a la innovación turística'),

-- ── INN: DAT (5 requirements) ──────────────────────────────────────────
('b0000000-0000-0000-0000-000000000026', 'a0000000-0000-0000-0000-000000000006', 'INN_DAT_01', 'Datos abiertos', 'El destino publica datos turísticos en formato abierto'),
('b0000000-0000-0000-0000-000000000027', 'a0000000-0000-0000-0000-000000000006', 'INN_DAT_02', 'Calidad del dato', 'Existen procesos de calidad y actualización de datos'),
('b0000000-0000-0000-0000-000000000028', 'a0000000-0000-0000-0000-000000000006', 'INN_DAT_03', 'Cuadro de mandos', 'Se dispone de un cuadro de mandos turístico'),
('b0000000-0000-0000-0000-000000000029', 'a0000000-0000-0000-0000-000000000006', 'INN_DAT_04', 'Big data', 'Se aplican técnicas de big data al análisis turístico'),
('b0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000006', 'INN_DAT_05', 'Privacidad de datos', 'Se cumple con la normativa de protección de datos'),

-- ── INN: EXP (5 requirements) ──────────────────────────────────────────
('b0000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000007', 'INN_EXP_01', 'Personalización', 'Se ofrecen experiencias turísticas personalizadas'),
('b0000000-0000-0000-0000-000000000032', 'a0000000-0000-0000-0000-000000000007', 'INN_EXP_02', 'Gamificación', 'Se utilizan técnicas de gamificación en la experiencia turística'),
('b0000000-0000-0000-0000-000000000033', 'a0000000-0000-0000-0000-000000000007', 'INN_EXP_03', 'Realidad aumentada', 'Se implementa realidad aumentada/virtual en el destino'),
('b0000000-0000-0000-0000-000000000034', 'a0000000-0000-0000-0000-000000000007', 'INN_EXP_04', 'Co-creación', 'Se involucra al turista en la co-creación de experiencias'),
('b0000000-0000-0000-0000-000000000035', 'a0000000-0000-0000-0000-000000000007', 'INN_EXP_05', 'Innovación en servicios', 'Se innova continuamente en los servicios turísticos'),

-- ── TEC: INF (5 requirements) ──────────────────────────────────────────
('b0000000-0000-0000-0000-000000000036', 'a0000000-0000-0000-0000-000000000008', 'TEC_INF_01', 'Infraestructura TIC', 'El destino dispone de infraestructura TIC adecuada'),
('b0000000-0000-0000-0000-000000000037', 'a0000000-0000-0000-0000-000000000008', 'TEC_INF_02', 'Ciberseguridad', 'Existen medidas de ciberseguridad implementadas'),
('b0000000-0000-0000-0000-000000000038', 'a0000000-0000-0000-0000-000000000008', 'TEC_INF_03', 'Cloud computing', 'Se utiliza computación en la nube para servicios turísticos'),
('b0000000-0000-0000-0000-000000000039', 'a0000000-0000-0000-0000-000000000008', 'TEC_INF_04', 'Sistemas interoperables', 'Los sistemas turísticos son interoperables'),
('b0000000-0000-0000-0000-000000000040', 'a0000000-0000-0000-0000-000000000008', 'TEC_INF_05', 'Mantenimiento tecnológico', 'Existe un plan de mantenimiento de la infraestructura tecnológica'),

-- ── TEC: CON (4 requirements) ──────────────────────────────────────────
('b0000000-0000-0000-0000-000000000041', 'a0000000-0000-0000-0000-000000000009', 'TEC_CON_01', 'Cobertura wifi', 'El destino ofrece cobertura wifi en espacios públicos'),
('b0000000-0000-0000-0000-000000000042', 'a0000000-0000-0000-0000-000000000009', 'TEC_CON_02', 'Conectividad 5G', 'El destino dispone de cobertura 5G/4G'),
('b0000000-0000-0000-0000-000000000043', 'a0000000-0000-0000-0000-000000000009', 'TEC_CON_03', 'Red de sensores', 'Existe una red de sensores IoT desplegada'),
('b0000000-0000-0000-0000-000000000044', 'a0000000-0000-0000-0000-000000000009', 'TEC_CON_04', 'Conectividad en alojamientos', 'Los alojamientos turísticos ofrecen conectividad de calidad'),

-- ── TEC: SEN (4 requirements) ──────────────────────────────────────────
('b0000000-0000-0000-0000-000000000045', 'a0000000-0000-0000-0000-000000000010', 'TEC_SEN_01', 'Sensores ambientales', 'Se utilizan sensores para monitorización ambiental'),
('b0000000-0000-0000-0000-000000000046', 'a0000000-0000-0000-0000-000000000010', 'TEC_SEN_02', 'Aforo inteligente', 'Existen sistemas de control de aforo inteligentes'),
('b0000000-0000-0000-0000-000000000047', 'a0000000-0000-0000-0000-000000000010', 'TEC_SEN_03', 'Movilidad inteligente', 'Se monitoriza la movilidad turística'),
('b0000000-0000-0000-0000-000000000048', 'a0000000-0000-0000-0000-000000000010', 'TEC_SEN_04', 'Gestión de recursos', 'Los sensores optimizan la gestión de recursos del destino'),

-- ── TEC: PLAT (5 requirements) ─────────────────────────────────────────
('b0000000-0000-0000-0000-000000000049', 'a0000000-0000-0000-0000-000000000011', 'TEC_PLAT_01', 'Plataforma integrada', 'El destino dispone de una plataforma tecnológica integrada'),
('b0000000-0000-0000-0000-000000000050', 'a0000000-0000-0000-0000-000000000011', 'TEC_PLAT_02', 'App turística', 'Existe una aplicación móvil oficial del destino'),
('b0000000-0000-0000-0000-000000000051', 'a0000000-0000-0000-0000-000000000011', 'TEC_PLAT_03', 'Portal web', 'El portal web del destino es completo y accesible'),
('b0000000-0000-0000-0000-000000000052', 'a0000000-0000-0000-0000-000000000011', 'TEC_PLAT_04', 'Comercio electrónico', 'Se facilita la comercialización turística online'),
('b0000000-0000-0000-0000-000000000053', 'a0000000-0000-0000-0000-000000000011', 'TEC_PLAT_05', 'API turística', 'Se exponen APIs de datos turísticos'),

-- ── SOST: MED (5 requirements) ─────────────────────────────────────────
('b0000000-0000-0000-0000-000000000054', 'a0000000-0000-0000-0000-000000000012', 'SOST_MED_01', 'Gestión ambiental', 'El destino cuenta con un sistema de gestión ambiental'),
('b0000000-0000-0000-0000-000000000055', 'a0000000-0000-0000-0000-000000000012', 'SOST_MED_02', 'Energía renovable', 'Se utiliza energía renovable en servicios turísticos'),
('b0000000-0000-0000-0000-000000000056', 'a0000000-0000-0000-0000-000000000012', 'SOST_MED_03', 'Gestión de residuos', 'Existe un plan de gestión de residuos turísticos'),
('b0000000-0000-0000-0000-000000000057', 'a0000000-0000-0000-0000-000000000012', 'SOST_MED_04', 'Huella de carbono', 'Se mide y compensa la huella de carbono turística'),
('b0000000-0000-0000-0000-000000000058', 'a0000000-0000-0000-0000-000000000012', 'SOST_MED_05', 'Protección natural', 'El destino protege sus recursos naturales'),

-- ── SOST: SOC (5 requirements) ─────────────────────────────────────────
('b0000000-0000-0000-0000-000000000059', 'a0000000-0000-0000-0000-000000000013', 'SOST_SOC_01', 'Impacto social', 'Se mide el impacto social del turismo'),
('b0000000-0000-0000-0000-000000000060', 'a0000000-0000-0000-0000-000000000013', 'SOST_SOC_02', 'Turismo inclusivo', 'Se promueve el turismo inclusivo y accesible'),
('b0000000-0000-0000-0000-000000000061', 'a0000000-0000-0000-0000-000000000013', 'SOST_SOC_03', 'Empleo local', 'El turismo genera empleo de calidad para la población local'),
('b0000000-0000-0000-0000-000000000062', 'a0000000-0000-0000-0000-000000000013', 'SOST_SOC_04', 'Patrimonio cultural', 'Se preserva y promociona el patrimonio cultural'),
('b0000000-0000-0000-0000-000000000063', 'a0000000-0000-0000-0000-000000000013', 'SOST_SOC_05', 'Calidad de vida', 'El turismo contribuye a la calidad de vida de los residentes'),

-- ── SOST: ECON (5 requirements) ────────────────────────────────────────
('b0000000-0000-0000-0000-000000000064', 'a0000000-0000-0000-0000-000000000014', 'SOST_ECON_01', 'Impacto económico', 'Se mide el impacto económico del turismo'),
('b0000000-0000-0000-0000-000000000065', 'a0000000-0000-0000-0000-000000000014', 'SOST_ECON_02', 'Estacionalidad', 'Se implementan medidas contra la estacionalidad turística'),
('b0000000-0000-0000-0000-000000000066', 'a0000000-0000-0000-0000-000000000014', 'SOST_ECON_03', 'Gasto turístico', 'Se analiza el gasto turístico y su distribución'),
('b0000000-0000-0000-0000-000000000067', 'a0000000-0000-0000-0000-000000000014', 'SOST_ECON_04', 'Emprendimiento local', 'Se fomenta el emprendimiento turístico local'),
('b0000000-0000-0000-0000-000000000068', 'a0000000-0000-0000-0000-000000000014', 'SOST_ECON_05', 'Proveedores locales', 'Se prioriza la contratación de proveedores locales'),

-- ── ACC: ACC_FIS (5 requirements) ──────────────────────────────────────
('b0000000-0000-0000-0000-000000000069', 'a0000000-0000-0000-0000-000000000015', 'ACC_FIS_01', 'Accesibilidad urbana', 'El destino cumple con normativas de accesibilidad urbana'),
('b0000000-0000-0000-0000-000000000070', 'a0000000-0000-0000-0000-000000000015', 'ACC_FIS_02', 'Accesibilidad en alojamientos', 'Los alojamientos turísticos son accesibles'),
('b0000000-0000-0000-0000-000000000071', 'a0000000-0000-0000-0000-000000000015', 'ACC_FIS_03', 'Accesibilidad en atractivos', 'Los atractivos turísticos son accesibles'),
('b0000000-0000-0000-0000-000000000072', 'a0000000-0000-0000-0000-000000000015', 'ACC_FIS_04', 'Transporte accesible', 'El transporte público es accesible'),
('b0000000-0000-0000-0000-000000000073', 'a0000000-0000-0000-0000-000000000015', 'ACC_FIS_05', 'Señalización accesible', 'La señalización turística es accesible'),

-- ── ACC: ACC_DIG (4 requirements) ──────────────────────────────────────
('b0000000-0000-0000-0000-000000000074', 'a0000000-0000-0000-0000-000000000016', 'ACC_DIG_01', 'Accesibilidad web', 'Los canales digitales cumplen con WCAG'),
('b0000000-0000-0000-0000-000000000075', 'a0000000-0000-0000-0000-000000000016', 'ACC_DIG_02', 'Información multilingüe', 'La información turística está disponible en varios idiomas'),
('b0000000-0000-0000-0000-000000000076', 'a0000000-0000-0000-0000-000000000016', 'ACC_DIG_03', 'Lectura fácil', 'Se utiliza lectura fácil y lenguaje claro'),
('b0000000-0000-0000-0000-000000000077', 'a0000000-0000-0000-0000-000000000016', 'ACC_DIG_04', 'Canales de atención', 'Existen canales de atención accesibles para el turista')

ON CONFLICT (code) DO NOTHING;
