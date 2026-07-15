-- Seed Data: DTI Evaluation Framework
-- Runs AFTER init_zz_evaluations.sql (alphabetical zzz suffix)
-- Populates scopes, requirements, indicators, regions, and subnational levels

SET search_path TO evaluations_service, public;

-- ── Regions ────────────────────────────────────────────────────────────
INSERT INTO region (id, name, description) VALUES
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'region-noroeste-arg'), 'Noroeste', 'Región Noroeste de Argentina (Jujuy, Salta, Tucumán, Catamarca, La Rioja)'),
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'region-noreste-arg'), 'Noreste', 'Región Noreste de Argentina (Formosa, Chaco, Misiones, Corrientes, Entre Ríos)'),
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'region-cuyo-arg'), 'Cuyo', 'Región de Cuyo (Mendoza, San Juan, San Luis)'),
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'region-centro-arg'), 'Centro', 'Región Centro (Córdoba, Santa Fe, La Pampa)'),
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'region-pampeana-arg'), 'Pampeana', 'Región Pampeana (Buenos Aires, Ciudad de Buenos Aires)'),
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'region-patagonia-arg'), 'Patagonia', 'Región Patagónica (Neuquén, Río Negro, Chubut, Santa Cruz, Tierra del Fuego)'),
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'region-espana'), 'España', 'España'),
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'region-mexico'), 'México', 'México'),
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'region-colombia'), 'Colombia', 'Colombia'),
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'region-uruguay'), 'Uruguay', 'Uruguay')
ON CONFLICT (id) DO NOTHING;

-- ── Subnational Levels ─────────────────────────────────────────────────
INSERT INTO subnational_level (id, country, name) VALUES
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'snl-arg-provincia'), 'Argentina', 'Provincia'),
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'snl-arg-municipio'), 'Argentina', 'Municipio'),
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'snl-esp-comunidad'), 'España', 'Comunidad Autónoma'),
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'snl-esp-municipio'), 'España', 'Municipio'),
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'snl-mex-estado'), 'México', 'Estado'),
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'snl-mex-municipio'), 'México', 'Municipio'),
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'snl-col-departamento'), 'Colombia', 'Departamento'),
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'snl-col-municipio'), 'Colombia', 'Municipio')
ON CONFLICT (id) DO NOTHING;

-- ── Scopes (16) ────────────────────────────────────────────────────────
INSERT INTO scope (id, axis, acronym, name, description, icon, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'gob', 'ORG', 'Organización', 'Estructura organizativa del destino turístico inteligente', 'org-icon', 1),
  ('a0000000-0000-0000-0000-000000000002', 'gob', 'FIN', 'Financiación', 'Modelo de financiación y sostenibilidad económica del DTI', 'fin-icon', 2),
  ('a0000000-0000-0000-0000-000000000003', 'gob', 'PLA', 'Planificación', 'Planificación estratégica y hoja de ruta del DTI', 'pla-icon', 3),
  ('a0000000-0000-0000-0000-000000000004', 'gob', 'GEST', 'Gestión', 'Gestión de procesos y calidad en el destino', 'gest-icon', 4),
  ('a0000000-0000-0000-0000-000000000005', 'inn', 'ECO', 'Ecosistema', 'Ecosistema de innovación y emprendimiento turístico', 'eco-icon', 5),
  ('a0000000-0000-0000-0000-000000000006', 'inn', 'DAT', 'Datos', 'Apertura y gestión de datos turísticos', 'dat-icon', 6),
  ('a0000000-0000-0000-0000-000000000007', 'inn', 'EXP', 'Experiencia', 'Innovación en la experiencia turística', 'exp-icon', 7),
  ('a0000000-0000-0000-0000-000000000008', 'tec', 'INF', 'Infraestructura', 'Infraestructura tecnológica del destino', 'inf-icon', 8),
  ('a0000000-0000-0000-0000-000000000009', 'tec', 'CON', 'Conectividad', 'Conectividad digital y acceso a internet', 'con-icon', 9),
  ('a0000000-0000-0000-0000-000000000010', 'tec', 'SEN', 'Sensorización', 'IoT y sensorización del destino', 'sen-icon', 10),
  ('a0000000-0000-0000-0000-000000000011', 'tec', 'PLAT', 'Plataforma', 'Plataforma tecnológica integral del DTI', 'plat-icon', 11),
  ('a0000000-0000-0000-0000-000000000012', 'sost', 'MED', 'Medio Ambiente', 'Gestión ambiental y sostenibilidad ecológica', 'med-icon', 12),
  ('a0000000-0000-0000-0000-000000000013', 'sost', 'SOC', 'Social', 'Sostenibilidad social e impacto comunitario', 'soc-icon', 13),
  ('a0000000-0000-0000-0000-000000000014', 'sost', 'ECON', 'Económica', 'Sostenibilidad económica y desarrollo local', 'econ-icon', 14),
  ('a0000000-0000-0000-0000-000000000015', 'acc', 'ACC_FIS', 'Accesibilidad Física', 'Accesibilidad universal en espacios y servicios turísticos', 'acc-fis-icon', 15),
  ('a0000000-0000-0000-0000-000000000016', 'acc', 'ACC_DIG', 'Accesibilidad Digital', 'Accesibilidad digital y comunicativa del destino', 'acc-dig-icon', 16)
ON CONFLICT (id) DO NOTHING;

-- ── Requirements (77) ──────────────────────────────────────────────────
INSERT INTO requirement (id, scope_id, code, name, description) VALUES

  -- GOB: ORG
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'GOB_ORG_01', 'Estructura DTI', 'El destino cuenta con una estructura organizativa dedicada al DTI'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'GOB_ORG_02', 'Liderazgo político', 'Existe liderazgo político comprometido con el proyecto DTI'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'GOB_ORG_03', 'Equipo multidisciplinar', 'El equipo DTI cuenta con perfil multidisciplinar'),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'GOB_ORG_04', 'Participación público-privada', 'Existe colaboración público-privada en la gobernanza del DTI'),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'GOB_ORG_05', 'Red DTI', 'El destino participa activamente en redes de DTI'),

  -- GOB: FIN
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', 'GOB_FIN_01', 'Presupuesto DTI', 'El destino dispone de un presupuesto específico para el proyecto DTI'),
  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002', 'GOB_FIN_02', 'Diversificación financiera', 'Existen fuentes de financiación diversificadas'),
  ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000002', 'GOB_FIN_03', 'Inversión TIC', 'Se realiza inversión sostenida en tecnología turística'),
  ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000002', 'GOB_FIN_04', 'Retorno de inversión', 'Se mide el retorno de la inversión en el DTI'),
  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000002', 'GOB_FIN_05', 'Ayudas y subvenciones', 'El destino capta ayudas y subvenciones para el DTI'),

  -- GOB: PLA
  ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000003', 'GOB_PLA_01', 'Plan estratégico', 'El destino cuenta con un plan estratégico DTI'),
  ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000003', 'GOB_PLA_02', 'Hoja de ruta', 'Existe una hoja de ruta con hitos y plazos definidos'),
  ('b0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000003', 'GOB_PLA_03', 'Indicadores de seguimiento', 'Se definen KPIs para el seguimiento del plan'),
  ('b0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000003', 'GOB_PLA_04', 'Evaluación periódica', 'Se realizan evaluaciones periódicas del plan DTI'),
  ('b0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000003', 'GOB_PLA_05', 'Participación ciudadana', 'Existen mecanismos de participación ciudadana en la planificación'),

  -- GOB: GEST
  ('b0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000004', 'GOB_GEST_01', 'Sistema de calidad', 'El destino cuenta con un sistema de gestión de calidad'),
  ('b0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000004', 'GOB_GEST_02', 'Procesos definidos', 'Los procesos turísticos están documentados y optimizados'),
  ('b0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000004', 'GOB_GEST_03', 'Cartas de servicios', 'Se dispone de cartas de servicios turísticos'),
  ('b0000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000004', 'GOB_GEST_04', 'Satisfacción del turista', 'Se mide sistemáticamente la satisfacción del turista'),
  ('b0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000004', 'GOB_GEST_05', 'Gestión de reclamaciones', 'Existe un sistema de gestión de reclamaciones'),

  -- INN: ECO
  ('b0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000005', 'INN_ECO_01', 'Ecosistema innovador', 'El destino fomenta un ecosistema de innovación turística'),
  ('b0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000005', 'INN_ECO_02', 'Emprendimiento', 'Se apoya el emprendimiento turístico innovador'),
  ('b0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000005', 'INN_ECO_03', 'Colaboración universidad-empresa', 'Existe colaboración con universidades y centros de I+D'),
  ('b0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000005', 'INN_ECO_04', 'Laboratorio de innovación', 'El destino cuenta con un laboratorio de innovación turística'),
  ('b0000000-0000-0000-0000-000000000025', 'a0000000-0000-0000-0000-000000000005', 'INN_ECO_05', 'Premios e incentivos', 'Existen premios o incentivos a la innovación turística'),

  -- INN: DAT
  ('b0000000-0000-0000-0000-000000000026', 'a0000000-0000-0000-0000-000000000006', 'INN_DAT_01', 'Datos abiertos', 'El destino publica datos turísticos en formato abierto'),
  ('b0000000-0000-0000-0000-000000000027', 'a0000000-0000-0000-0000-000000000006', 'INN_DAT_02', 'Calidad del dato', 'Existen procesos de calidad y actualización de datos'),
  ('b0000000-0000-0000-0000-000000000028', 'a0000000-0000-0000-0000-000000000006', 'INN_DAT_03', 'Cuadro de mandos', 'Se dispone de un cuadro de mandos turístico'),
  ('b0000000-0000-0000-0000-000000000029', 'a0000000-0000-0000-0000-000000000006', 'INN_DAT_04', 'Big data', 'Se aplican técnicas de big data al análisis turístico'),
  ('b0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000006', 'INN_DAT_05', 'Privacidad de datos', 'Se cumple con la normativa de protección de datos'),

  -- INN: EXP
  ('b0000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000007', 'INN_EXP_01', 'Personalización', 'Se ofrecen experiencias turísticas personalizadas'),
  ('b0000000-0000-0000-0000-000000000032', 'a0000000-0000-0000-0000-000000000007', 'INN_EXP_02', 'Gamificación', 'Se utilizan técnicas de gamificación en la experiencia turística'),
  ('b0000000-0000-0000-0000-000000000033', 'a0000000-0000-0000-0000-000000000007', 'INN_EXP_03', 'Realidad aumentada', 'Se implementa realidad aumentada/virtual en el destino'),
  ('b0000000-0000-0000-0000-000000000034', 'a0000000-0000-0000-0000-000000000007', 'INN_EXP_04', 'Co-creación', 'Se involucra al turista en la co-creación de experiencias'),
  ('b0000000-0000-0000-0000-000000000035', 'a0000000-0000-0000-0000-000000000007', 'INN_EXP_05', 'Innovación en servicios', 'Se innova continuamente en los servicios turísticos'),

  -- TEC: INF
  ('b0000000-0000-0000-0000-000000000036', 'a0000000-0000-0000-0000-000000000008', 'TEC_INF_01', 'Infraestructura TIC', 'El destino dispone de infraestructura TIC adecuada'),
  ('b0000000-0000-0000-0000-000000000037', 'a0000000-0000-0000-0000-000000000008', 'TEC_INF_02', 'Ciberseguridad', 'Existen medidas de ciberseguridad implementadas'),
  ('b0000000-0000-0000-0000-000000000038', 'a0000000-0000-0000-0000-000000000008', 'TEC_INF_03', 'Cloud computing', 'Se utiliza computación en la nube para servicios turísticos'),
  ('b0000000-0000-0000-0000-000000000039', 'a0000000-0000-0000-0000-000000000008', 'TEC_INF_04', 'Sistemas interoperables', 'Los sistemas turísticos son interoperables'),
  ('b0000000-0000-0000-0000-000000000040', 'a0000000-0000-0000-0000-000000000008', 'TEC_INF_05', 'Mantenimiento tecnológico', 'Existe un plan de mantenimiento de la infraestructura tecnológica'),

  -- TEC: CON
  ('b0000000-0000-0000-0000-000000000041', 'a0000000-0000-0000-0000-000000000009', 'TEC_CON_01', 'Cobertura wifi', 'El destino ofrece cobertura wifi en espacios públicos'),
  ('b0000000-0000-0000-0000-000000000042', 'a0000000-0000-0000-0000-000000000009', 'TEC_CON_02', 'Conectividad 5G', 'El destino dispone de cobertura 5G/4G'),
  ('b0000000-0000-0000-0000-000000000043', 'a0000000-0000-0000-0000-000000000009', 'TEC_CON_03', 'Red de sensores', 'Existe una red de sensores IoT desplegada'),
  ('b0000000-0000-0000-0000-000000000044', 'a0000000-0000-0000-0000-000000000009', 'TEC_CON_04', 'Conectividad en alojamientos', 'Los alojamientos turísticos ofrecen conectividad de calidad'),

  -- TEC: SEN
  ('b0000000-0000-0000-0000-000000000045', 'a0000000-0000-0000-0000-000000000010', 'TEC_SEN_01', 'Sensores ambientales', 'Se utilizan sensores para monitorización ambiental'),
  ('b0000000-0000-0000-0000-000000000046', 'a0000000-0000-0000-0000-000000000010', 'TEC_SEN_02', 'Aforo inteligente', 'Existen sistemas de control de aforo inteligentes'),
  ('b0000000-0000-0000-0000-000000000047', 'a0000000-0000-0000-0000-000000000010', 'TEC_SEN_03', 'Movilidad inteligente', 'Se monitoriza la movilidad turística'),
  ('b0000000-0000-0000-0000-000000000048', 'a0000000-0000-0000-0000-000000000010', 'TEC_SEN_04', 'Gestión de recursos', 'Los sensores optimizan la gestión de recursos del destino'),

  -- TEC: PLAT
  ('b0000000-0000-0000-0000-000000000049', 'a0000000-0000-0000-0000-000000000011', 'TEC_PLAT_01', 'Plataforma integrada', 'El destino dispone de una plataforma tecnológica integrada'),
  ('b0000000-0000-0000-0000-000000000050', 'a0000000-0000-0000-0000-000000000011', 'TEC_PLAT_02', 'App turística', 'Existe una aplicación móvil oficial del destino'),
  ('b0000000-0000-0000-0000-000000000051', 'a0000000-0000-0000-0000-000000000011', 'TEC_PLAT_03', 'Portal web', 'El portal web del destino es completo y accesible'),
  ('b0000000-0000-0000-0000-000000000052', 'a0000000-0000-0000-0000-000000000011', 'TEC_PLAT_04', 'Comercio electrónico', 'Se facilita la comercialización turística online'),
  ('b0000000-0000-0000-0000-000000000053', 'a0000000-0000-0000-0000-000000000011', 'TEC_PLAT_05', 'API turística', 'Se exponen APIs de datos turísticos'),

  -- SOST: MED
  ('b0000000-0000-0000-0000-000000000054', 'a0000000-0000-0000-0000-000000000012', 'SOST_MED_01', 'Gestión ambiental', 'El destino cuenta con un sistema de gestión ambiental'),
  ('b0000000-0000-0000-0000-000000000055', 'a0000000-0000-0000-0000-000000000012', 'SOST_MED_02', 'Energía renovable', 'Se utiliza energía renovable en servicios turísticos'),
  ('b0000000-0000-0000-0000-000000000056', 'a0000000-0000-0000-0000-000000000012', 'SOST_MED_03', 'Gestión de residuos', 'Existe un plan de gestión de residuos turísticos'),
  ('b0000000-0000-0000-0000-000000000057', 'a0000000-0000-0000-0000-000000000012', 'SOST_MED_04', 'Huella de carbono', 'Se mide y compensa la huella de carbono turística'),
  ('b0000000-0000-0000-0000-000000000058', 'a0000000-0000-0000-0000-000000000012', 'SOST_MED_05', 'Protección natural', 'El destino protege sus recursos naturales'),

  -- SOST: SOC
  ('b0000000-0000-0000-0000-000000000059', 'a0000000-0000-0000-0000-000000000013', 'SOST_SOC_01', 'Impacto social', 'Se mide el impacto social del turismo'),
  ('b0000000-0000-0000-0000-000000000060', 'a0000000-0000-0000-0000-000000000013', 'SOST_SOC_02', 'Turismo inclusivo', 'Se promueve el turismo inclusivo y accesible'),
  ('b0000000-0000-0000-0000-000000000061', 'a0000000-0000-0000-0000-000000000013', 'SOST_SOC_03', 'Empleo local', 'El turismo genera empleo de calidad para la población local'),
  ('b0000000-0000-0000-0000-000000000062', 'a0000000-0000-0000-0000-000000000013', 'SOST_SOC_04', 'Patrimonio cultural', 'Se preserva y promociona el patrimonio cultural'),
  ('b0000000-0000-0000-0000-000000000063', 'a0000000-0000-0000-0000-000000000013', 'SOST_SOC_05', 'Calidad de vida', 'El turismo contribuye a la calidad de vida de los residentes'),

  -- SOST: ECON
  ('b0000000-0000-0000-0000-000000000064', 'a0000000-0000-0000-0000-000000000014', 'SOST_ECON_01', 'Impacto económico', 'Se mide el impacto económico del turismo'),
  ('b0000000-0000-0000-0000-000000000065', 'a0000000-0000-0000-0000-000000000014', 'SOST_ECON_02', 'Estacionalidad', 'Se implementan medidas contra la estacionalidad turística'),
  ('b0000000-0000-0000-0000-000000000066', 'a0000000-0000-0000-0000-000000000014', 'SOST_ECON_03', 'Gasto turístico', 'Se analiza el gasto turístico y su distribución'),
  ('b0000000-0000-0000-0000-000000000067', 'a0000000-0000-0000-0000-000000000014', 'SOST_ECON_04', 'Emprendimiento local', 'Se fomenta el emprendimiento turístico local'),
  ('b0000000-0000-0000-0000-000000000068', 'a0000000-0000-0000-0000-000000000014', 'SOST_ECON_05', 'Proveedores locales', 'Se prioriza la contratación de proveedores locales'),

  -- ACC: ACC_FIS
  ('b0000000-0000-0000-0000-000000000069', 'a0000000-0000-0000-0000-000000000015', 'ACC_FIS_01', 'Accesibilidad urbana', 'El destino cumple con normativas de accesibilidad urbana'),
  ('b0000000-0000-0000-0000-000000000070', 'a0000000-0000-0000-0000-000000000015', 'ACC_FIS_02', 'Accesibilidad en alojamientos', 'Los alojamientos turísticos son accesibles'),
  ('b0000000-0000-0000-0000-000000000071', 'a0000000-0000-0000-0000-000000000015', 'ACC_FIS_03', 'Accesibilidad en atractivos', 'Los atractivos turísticos son accesibles'),
  ('b0000000-0000-0000-0000-000000000072', 'a0000000-0000-0000-0000-000000000015', 'ACC_FIS_04', 'Transporte accesible', 'El transporte público es accesible'),
  ('b0000000-0000-0000-0000-000000000073', 'a0000000-0000-0000-0000-000000000015', 'ACC_FIS_05', 'Señalización accesible', 'La señalización turística es accesible'),

  -- ACC: ACC_DIG
  ('b0000000-0000-0000-0000-000000000074', 'a0000000-0000-0000-0000-000000000016', 'ACC_DIG_01', 'Accesibilidad web', 'Los canales digitales cumplen con WCAG'),
  ('b0000000-0000-0000-0000-000000000075', 'a0000000-0000-0000-0000-000000000016', 'ACC_DIG_02', 'Información multilingüe', 'La información turística está disponible en varios idiomas'),
  ('b0000000-0000-0000-0000-000000000076', 'a0000000-0000-0000-0000-000000000016', 'ACC_DIG_03', 'Lectura fácil', 'Se utiliza lectura fácil y lenguaje claro'),
  ('b0000000-0000-0000-0000-000000000077', 'a0000000-0000-0000-0000-000000000016', 'ACC_DIG_04', 'Canales de atención', 'Existen canales de atención accesibles para el turista')
ON CONFLICT (code) DO NOTHING;

-- ── Indicators (152) ───────────────────────────────────────────────────
INSERT INTO indicator (id, requirement_id, code, name, description, type, criteria) VALUES

  -- ══════════════════════════════════════════════════════════════════
  -- GOB: ORG (10 indicators)
  -- ══════════════════════════════════════════════════════════════════
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'GOB_ORG_01.NI1', 'Órgano de gestión DTI', 'El destino dispone de un órgano de gestión específico para el DTI', 'gradient', '[{"level":0,"value":0,"description":"No existe órgano de gestión"},{"level":1,"value":25,"description":"En fase de creación"},{"level":2,"value":50,"description":"Creado pero sin recursos asignados"},{"level":3,"value":75,"description":"Operativo con recursos parciales"},{"level":4,"value":100,"description":"Totalmente operativo y consolidado"}]'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'GOB_ORG_01.NI2', 'Personal DTI dedicado', 'Número de personas dedicadas al proyecto DTI', 'numeric', '[{"unit":"personas","min":0,"max":null,"description":"Número de personas dedicadas al DTI"}]'),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'GOB_ORG_02.NI1', 'Compromiso político', 'Existe compromiso político formal con el DTI', 'gradient', '[{"level":0,"value":0,"description":"Sin compromiso político"},{"level":1,"value":25,"description":"Compromiso verbal"},{"level":2,"value":50,"description":"Compromiso por escrito sin presupuesto"},{"level":3,"value":75,"description":"Compromiso con presupuesto asignado"},{"level":4,"value":100,"description":"Compromiso institucionalizado y plurianual"}]'),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'GOB_ORG_02.NI2', 'Delegado DTI', 'Existe un delegado o responsable político del DTI', 'boolean', '[{"level":0,"value":0,"description":"No"},{"level":1,"value":100,"description":"Sí"}]'),
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', 'GOB_ORG_03.NI1', 'Perfiles del equipo', 'El equipo DTI cubre los perfiles necesarios', 'gradient', '[{"level":0,"value":0,"description":"Sin equipo definido"},{"level":1,"value":25,"description":"Equipo con 1-2 perfiles"},{"level":2,"value":50,"description":"Equipo con 3-4 perfiles"},{"level":3,"value":75,"description":"Equipo multidisciplinar (>5 perfiles)"},{"level":4,"value":100,"description":"Equipo completo con formación continua"}]'),
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003', 'GOB_ORG_03.NI2', 'Formación del equipo', 'El equipo recibe formación específica DTI', 'numeric', '[{"unit":"horas/año","min":0,"max":null,"description":"Horas de formación DTI por persona al año"}]'),
  ('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000004', 'GOB_ORG_04.NI1', 'Colaboración público-privada', 'Existen mecanismos de colaboración público-privada', 'gradient', '[{"level":0,"value":0,"description":"Sin colaboración"},{"level":1,"value":25,"description":"Reuniones esporádicas"},{"level":2,"value":50,"description":"Mesa de trabajo estable"},{"level":3,"value":75,"description":"Proyectos conjuntos en marcha"},{"level":4,"value":100,"description":"Colaboración institucionalizada y estratégica"}]'),
  ('c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000004', 'GOB_ORG_04.NI2', 'Empresas colaboradoras', 'Número de empresas que colaboran en el DTI', 'numeric', '[{"unit":"empresas","min":0,"max":null,"description":"Número de empresas privadas colaborando en el DTI"}]'),
  ('c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000005', 'GOB_ORG_05.NI1', 'Participación en redes', 'El destino participa activamente en redes DTI', 'gradient', '[{"level":0,"value":0,"description":"Sin participación en redes"},{"level":1,"value":25,"description":"Miembro observador"},{"level":2,"value":50,"description":"Miembro activo"},{"level":3,"value":75,"description":"Participación en proyectos colaborativos"},{"level":4,"value":100,"description":"Liderazgo en redes y grupos de trabajo"}]'),
  ('c0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000005', 'GOB_ORG_05.NI2', 'Eventos DTI', 'Asistencia a eventos de la red DTI', 'numeric', '[{"unit":"eventos/año","min":0,"max":null,"description":"Número de eventos de la red a los que se asiste al año"}]'),

  -- GOB: FIN (6 indicators)
  ('c0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000006', 'GOB_FIN_01.NI1', 'Presupuesto asignado', 'El destino dispone de presupuesto específico DTI', 'gradient', '[{"level":0,"value":0,"description":"Sin presupuesto específico"},{"level":1,"value":25,"description":"Presupuesto < 50.000€"},{"level":2,"value":50,"description":"Presupuesto entre 50.000-200.000€"},{"level":3,"value":75,"description":"Presupuesto entre 200.000-500.000€"},{"level":4,"value":100,"description":"Presupuesto > 500.000€"}]'),
  ('c0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000006', 'GOB_FIN_01.NI2', 'Ejecución presupuestaria', 'Porcentaje de ejecución del presupuesto DTI', 'numeric', '[{"unit":"%","min":0,"max":100,"description":"Porcentaje de ejecución del presupuesto anual DTI"}]'),
  ('c0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000007', 'GOB_FIN_02.NI1', 'Fuentes de financiación', 'El destino cuenta con fuentes diversificadas', 'gradient', '[{"level":0,"value":0,"description":"Única fuente de financiación"},{"level":1,"value":25,"description":"2 fuentes diferentes"},{"level":2,"value":50,"description":"3 fuentes diferentes"},{"level":3,"value":75,"description":"4 fuentes diferentes"},{"level":4,"value":100,"description":"5 o más fuentes diversificadas"}]'),
  ('c0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000008', 'GOB_FIN_03.NI1', 'Inversión en tecnología', 'Se realiza inversión sostenida en TIC turísticas', 'gradient', '[{"level":0,"value":0,"description":"Sin inversión TIC"},{"level":1,"value":25,"description":"Inversión esporádica"},{"level":2,"value":50,"description":"Inversión anual planificada"},{"level":3,"value":75,"description":"Inversión plurianual"},{"level":4,"value":100,"description":"Inversión estratégica con ROI medido"}]'),
  ('c0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000008', 'GOB_FIN_03.NI2', 'Gasto TIC por turista', 'Gasto en TIC por turista recibido', 'numeric', '[{"unit":"€/turista","min":0,"max":null,"description":"Gasto anual en TIC dividido por número de turistas"}]'),
  ('c0000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000009', 'GOB_FIN_04.NI1', 'Medición del ROI', 'Se mide el retorno de la inversión del DTI', 'gradient', '[{"level":0,"value":0,"description":"No se mide el ROI"},{"level":1,"value":25,"description":"ROI medido parcialmente"},{"level":2,"value":50,"description":"ROI medido con indicadores básicos"},{"level":3,"value":75,"description":"ROI medido con metodología definida"},{"level":4,"value":100,"description":"ROI medido y publicado anualmente"}]'),
  ('c0000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000010', 'GOB_FIN_05.NI1', 'Captación de fondos', 'El destino capta ayudas para el DTI', 'gradient', '[{"level":0,"value":0,"description":"No se solicitan ayudas"},{"level":1,"value":25,"description":"Se solicitan pero no se obtienen"},{"level":2,"value":50,"description":"Se obtienen ayudas nacionales"},{"level":3,"value":75,"description":"Se obtienen ayudas europeas"},{"level":4,"value":100,"description":"Se obtienen ayudas internacionales competitivas"}]'),

  -- GOB: PLA (5 indicators)
  ('c0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000011', 'GOB_PLA_01.NI1', 'Plan estratégico DTI', 'El destino cuenta con un plan estratégico DTI', 'gradient', '[{"level":0,"value":0,"description":"Sin plan estratégico"},{"level":1,"value":25,"description":"Plan en elaboración"},{"level":2,"value":50,"description":"Plan aprobado"},{"level":3,"value":75,"description":"Plan implementado parcialmente"},{"level":4,"value":100,"description":"Plan implementado y en revisión periódica"}]'),
  ('c0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000011', 'GOB_PLA_01.NI2', 'Alcance del plan', 'El plan estratégico abarca todas las áreas DTI', 'numeric', '[{"unit":"%","min":0,"max":100,"description":"Porcentaje de ejes DTI cubiertos por el plan estratégico"}]'),
  ('c0000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000012', 'GOB_PLA_02.NI1', 'Hoja de ruta definida', 'Existe una hoja de ruta DTI con hitos', 'gradient', '[{"level":0,"value":0,"description":"Sin hoja de ruta"},{"level":1,"value":25,"description":"Borrador de hoja de ruta"},{"level":2,"value":50,"description":"Hoja de ruta aprobada"},{"level":3,"value":75,"description":"Hoja de ruta con hitos cumplidos parcialmente"},{"level":4,"value":100,"description":"Hoja de ruta actualizada y en seguimiento trimestral"}]'),
  ('c0000000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000015', 'GOB_PLA_05.NI1', 'Participación ciudadana', 'Existen mecanismos de participación', 'gradient', '[{"level":0,"value":0,"description":"Sin mecanismos de participación"},{"level":1,"value":25,"description":"Encuestas esporádicas"},{"level":2,"value":50,"description":"Foros de participación anuales"},{"level":3,"value":75,"description":"Plataforma digital de participación"},{"level":4,"value":100,"description":"Participación ciudadana institucionalizada y continua"}]'),
  ('c0000000-0000-0000-0000-000000000022', 'b0000000-0000-0000-0000-000000000015', 'GOB_PLA_05.NI2', 'Tasa de participación', 'Porcentaje de participación ciudadana en consultas', 'numeric', '[{"unit":"%","min":0,"max":100,"description":"Porcentaje de participación en procesos participativos"}]'),

  -- GOB: GEST (5 indicators)
  ('c0000000-0000-0000-0000-000000000023', 'b0000000-0000-0000-0000-000000000016', 'GOB_GEST_01.NI1', 'Sistema de calidad', 'El destino cuenta con sistema de gestión de calidad', 'gradient', '[{"level":0,"value":0,"description":"Sin sistema de calidad"},{"level":1,"value":25,"description":"En fase de implementación"},{"level":2,"value":50,"description":"Certificado ISO 9001 o SICTED"},{"level":3,"value":75,"description":"Sistema integrado de calidad"},{"level":4,"value":100,"description":"Sistema de calidad con mejora continua"}]'),
  ('c0000000-0000-0000-0000-000000000024', 'b0000000-0000-0000-0000-000000000019', 'GOB_GEST_04.NI1', 'Medición de satisfacción', 'Se mide la satisfacción del turista', 'gradient', '[{"level":0,"value":0,"description":"No se mide"},{"level":1,"value":25,"description":"Medición esporádica"},{"level":2,"value":50,"description":"Medición trimestral"},{"level":3,"value":75,"description":"Medición continua con metodología"},{"level":4,"value":100,"description":"Medición integrada con análisis predictivo"}]'),
  ('c0000000-0000-0000-0000-000000000025', 'b0000000-0000-0000-0000-000000000019', 'GOB_GEST_04.NI2', 'Índice de satisfacción', 'Puntuación media de satisfacción del turista', 'numeric', '[{"unit":"puntos","min":0,"max":10,"description":"Puntuación media de satisfacción (0-10)"}]'),
  ('c0000000-0000-0000-0000-000000000026', 'b0000000-0000-0000-0000-000000000020', 'GOB_GEST_05.NI1', 'Sistema de reclamaciones', 'Existe sistema de gestión de reclamaciones', 'gradient', '[{"level":0,"value":0,"description":"Sin sistema"},{"level":1,"value":25,"description":"Sistema básico"},{"level":2,"value":50,"description":"Sistema con registro y seguimiento"},{"level":3,"value":75,"description":"Sistema con análisis y mejora"},{"level":4,"value":100,"description":"Sistema integrado con inteligencia de negocio"}]'),
  ('c0000000-0000-0000-0000-000000000027', 'b0000000-0000-0000-0000-000000000020', 'GOB_GEST_05.NI2', 'Tasa de resolución', 'Porcentaje de reclamaciones resueltas', 'numeric', '[{"unit":"%","min":0,"max":100,"description":"Porcentaje de reclamaciones resueltas satisfactoriamente"}]'),

  -- INN: ECO (5 indicators)
  ('c0000000-0000-0000-0000-000000000028', 'b0000000-0000-0000-0000-000000000021', 'INN_ECO_01.NI1', 'Ecosistema de innovación', 'El destino fomenta un ecosistema innovador', 'gradient', '[{"level":0,"value":0,"description":"No existe ecosistema"},{"level":1,"value":25,"description":"Iniciativas aisladas"},{"level":2,"value":50,"description":"Red de agentes identificados"},{"level":3,"value":75,"description":"Ecosistema activo con proyectos"},{"level":4,"value":100,"description":"Ecosistema consolidado con impacto medible"}]'),
  ('c0000000-0000-0000-0000-000000000029', 'b0000000-0000-0000-0000-000000000022', 'INN_ECO_02.NI1', 'Apoyo al emprendimiento', 'Se apoya el emprendimiento turístico innovador', 'gradient', '[{"level":0,"value":0,"description":"Sin apoyo al emprendimiento"},{"level":1,"value":25,"description":"Programas de formación"},{"level":2,"value":50,"description":"Incubadora/aceleradora"},{"level":3,"value":75,"description":"Financiación de startups"},{"level":4,"value":100,"description":"Ecosistema emprendedor completo"}]'),
  ('c0000000-0000-0000-0000-000000000030', 'b0000000-0000-0000-0000-000000000022', 'INN_ECO_02.NI2', 'Startups turísticas', 'Número de startups turísticas activas', 'numeric', '[{"unit":"startups","min":0,"max":null,"description":"Número de startups turísticas en el destino"}]'),
  ('c0000000-0000-0000-0000-000000000031', 'b0000000-0000-0000-0000-000000000023', 'INN_ECO_03.NI1', 'Colaboración I+D', 'Existe colaboración con centros de I+D', 'gradient', '[{"level":0,"value":0,"description":"Sin colaboración"},{"level":1,"value":25,"description":"Colaboración puntual"},{"level":2,"value":50,"description":"Convenios activos"},{"level":3,"value":75,"description":"Proyectos de I+D conjuntos"},{"level":4,"value":100,"description":"Cátedra o centro de investigación DTI"}]'),
  ('c0000000-0000-0000-0000-000000000032', 'b0000000-0000-0000-0000-000000000023', 'INN_ECO_03.NI2', 'Proyectos de I+D', 'Número de proyectos de I+D en turismo', 'numeric', '[{"unit":"proyectos","min":0,"max":null,"description":"Número de proyectos de I+D activos en turismo"}]'),
  ('c0000000-0000-0000-0000-000000000033', 'b0000000-0000-0000-0000-000000000025', 'INN_ECO_05.NI1', 'Premios a la innovación', 'Existen premios o incentivos a la innovación', 'gradient', '[{"level":0,"value":0,"description":"Sin premios ni incentivos"},{"level":1,"value":25,"description":"Premio local esporádico"},{"level":2,"value":50,"description":"Concurso anual de innovación"},{"level":3,"value":75,"description":"Programa de incentivos estable"},{"level":4,"value":100,"description":"Programa integral de reconocimiento e incentivos"}]'),

  -- INN: DAT (6 indicators)
  ('c0000000-0000-0000-0000-000000000034', 'b0000000-0000-0000-0000-000000000026', 'INN_DAT_01.NI1', 'Datos abiertos turísticos', 'El destino publica datos en formato abierto', 'gradient', '[{"level":0,"value":0,"description":"Sin datos abiertos"},{"level":1,"value":25,"description":"Datos básicos en PDF"},{"level":2,"value":50,"description":"Datos en formatos reutilizables"},{"level":3,"value":75,"description":"Portal de datos abiertos turísticos"},{"level":4,"value":100,"description":"Catálogo completo con API y actualización automática"}]'),
  ('c0000000-0000-0000-0000-000000000035', 'b0000000-0000-0000-0000-000000000026', 'INN_DAT_01.NI2', 'Conjuntos de datos', 'Número de conjuntos de datos turísticos publicados', 'numeric', '[{"unit":"conjuntos","min":0,"max":null,"description":"Número de datasets turísticos en datos abiertos"}]'),
  ('c0000000-0000-0000-0000-000000000036', 'b0000000-0000-0000-0000-000000000027', 'INN_DAT_02.NI1', 'Calidad de datos', 'Existen procesos de calidad del dato', 'gradient', '[{"level":0,"value":0,"description":"Sin control de calidad"},{"level":1,"value":25,"description":"Validación básica"},{"level":2,"value":50,"description":"Procesos de limpieza periódicos"},{"level":3,"value":75,"description":"Gobernanza del dato establecida"},{"level":4,"value":100,"description":"Calidad del dato automatizada y monitorizada"}]'),
  ('c0000000-0000-0000-0000-000000000037', 'b0000000-0000-0000-0000-000000000028', 'INN_DAT_03.NI1', 'Cuadro de mandos', 'Se dispone de un cuadro de mandos turístico', 'gradient', '[{"level":0,"value":0,"description":"Sin cuadro de mandos"},{"level":1,"value":25,"description":"Informes básicos en Excel"},{"level":2,"value":50,"description":"Dashboard con indicadores clave"},{"level":3,"value":75,"description":"Cuadro de mandos interactivo y actualizado"},{"level":4,"value":100,"description":"Cuadro de mandos con inteligencia predictiva"}]'),
  ('c0000000-0000-0000-0000-000000000038', 'b0000000-0000-0000-0000-000000000030', 'INN_DAT_05.NI1', 'Protección de datos', 'Se cumple con la normativa de protección de datos', 'gradient', '[{"level":0,"value":0,"description":"Sin medidas de protección"},{"level":1,"value":25,"description":"Medidas básicas"},{"level":2,"value":50,"description":"RGPD implementado"},{"level":3,"value":75,"description":"DPO designado y procesos establecidos"},{"level":4,"value":100,"description":"Sistema integral de privacidad y seguridad"}]'),
  ('c0000000-0000-0000-0000-000000000039', 'b0000000-0000-0000-0000-000000000030', 'INN_DAT_05.NI2', 'Cumplimiento normativo', 'Porcentaje de procesos turísticos que cumplen RGPD', 'numeric', '[{"unit":"%","min":0,"max":100,"description":"Porcentaje de procesos que cumplen con RGPD"}]'),

  -- INN: EXP (4 indicators)
  ('c0000000-0000-0000-0000-000000000040', 'b0000000-0000-0000-0000-000000000031', 'INN_EXP_01.NI1', 'Experiencias personalizadas', 'Se ofrecen experiencias personalizadas al turista', 'gradient', '[{"level":0,"value":0,"description":"Experiencias estandarizadas"},{"level":1,"value":25,"description":"Ofertas segmentadas básicas"},{"level":2,"value":50,"description":"Recomendaciones basadas en perfil"},{"level":3,"value":75,"description":"Personalización en tiempo real"},{"level":4,"value":100,"description":"Personalización predictiva con IA"}]'),
  ('c0000000-0000-0000-0000-000000000041', 'b0000000-0000-0000-0000-000000000032', 'INN_EXP_02.NI1', 'Gamificación turística', 'Se utilizan técnicas de gamificación', 'gradient', '[{"level":0,"value":0,"description":"Sin gamificación"},{"level":1,"value":25,"description":"Elementos básicos (puntos)"},{"level":2,"value":50,"description":"Insignias y retos"},{"level":3,"value":75,"description":"Rutas gamificadas completas"},{"level":4,"value":100,"description":"Sistema gamificado con comunidad activa"}]'),
  ('c0000000-0000-0000-0000-000000000042', 'b0000000-0000-0000-0000-000000000035', 'INN_EXP_05.NI1', 'Innovación en servicios', 'Se innova continuamente en servicios turísticos', 'gradient', '[{"level":0,"value":0,"description":"Sin innovación"},{"level":1,"value":25,"description":"Innovación reactiva"},{"level":2,"value":50,"description":"Innovación planificada anualmente"},{"level":3,"value":75,"description":"Cultura de innovación establecida"},{"level":4,"value":100,"description":"Innovación sistematizada con métricas"}]'),
  ('c0000000-0000-0000-0000-000000000043', 'b0000000-0000-0000-0000-000000000035', 'INN_EXP_05.NI2', 'Innovaciones implementadas', 'Número de innovaciones implementadas al año', 'numeric', '[{"unit":"innovaciones/año","min":0,"max":null,"description":"Número de mejoras innovadoras implementadas anualmente"}]'),

  -- TEC: INF (5 indicators)
  ('c0000000-0000-0000-0000-000000000044', 'b0000000-0000-0000-0000-000000000036', 'TEC_INF_01.NI1', 'Infraestructura TIC', 'El destino dispone de infraestructura TIC adecuada', 'gradient', '[{"level":0,"value":0,"description":"Sin infraestructura TIC"},{"level":1,"value":25,"description":"Infraestructura básica"},{"level":2,"value":50,"description":"Infraestructura estándar"},{"level":3,"value":75,"description":"Infraestructura avanzada"},{"level":4,"value":100,"description":"Infraestructura de última generación"}]'),
  ('c0000000-0000-0000-0000-000000000045', 'b0000000-0000-0000-0000-000000000037', 'TEC_INF_02.NI1', 'Ciberseguridad', 'Existen medidas de ciberseguridad', 'gradient', '[{"level":0,"value":0,"description":"Sin medidas"},{"level":1,"value":25,"description":"Antivirus y firewall básicos"},{"level":2,"value":50,"description":"Política de seguridad definida"},{"level":3,"value":75,"description":"Auditorías periódicas"},{"level":4,"value":100,"description":"SOC y plan de respuesta a incidentes"}]'),
  ('c0000000-0000-0000-0000-000000000046', 'b0000000-0000-0000-0000-000000000037', 'TEC_INF_02.NI2', 'Incidentes de seguridad', 'Número de incidentes de seguridad al año', 'numeric', '[{"unit":"incidentes/año","min":0,"max":null,"description":"Número de incidentes de seguridad registrados al año"}]'),
  ('c0000000-0000-0000-0000-000000000047', 'b0000000-0000-0000-0000-000000000038', 'TEC_INF_03.NI1', 'Computación en la nube', 'Se utiliza cloud computing para servicios turísticos', 'gradient', '[{"level":0,"value":0,"description":"Sin uso de cloud"},{"level":1,"value":25,"description":"Uso marginal de cloud"},{"level":2,"value":50,"description":"Migración parcial a cloud"},{"level":3,"value":75,"description":"Infraestructura cloud híbrida"},{"level":4,"value":100,"description":"Cloud-native con alta disponibilidad"}]'),
  ('c0000000-0000-0000-0000-000000000048', 'b0000000-0000-0000-0000-000000000040', 'TEC_INF_05.NI1', 'Mantenimiento TIC', 'Existe plan de mantenimiento tecnológico', 'gradient', '[{"level":0,"value":0,"description":"Sin plan de mantenimiento"},{"level":1,"value":25,"description":"Mantenimiento reactivo"},{"level":2,"value":50,"description":"Mantenimiento preventivo básico"},{"level":3,"value":75,"description":"Mantenimiento planificado y documentado"},{"level":4,"value":100,"description":"Mantenimiento predictivo y mejora continua"}]'),

  -- TEC: CON (6 indicators)
  ('c0000000-0000-0000-0000-000000000049', 'b0000000-0000-0000-0000-000000000041', 'TEC_CON_01.NI1', 'Cobertura wifi pública', 'El destino ofrece wifi en espacios públicos', 'gradient', '[{"level":0,"value":0,"description":"Sin wifi público"},{"level":1,"value":25,"description":"Wifi en puntos turísticos principales"},{"level":2,"value":50,"description":"Wifi en todo el centro urbano"},{"level":3,"value":75,"description":"Wifi de alta velocidad en todo el destino"},{"level":4,"value":100,"description":"Wifi inteligente con servicios integrados"}]'),
  ('c0000000-0000-0000-0000-000000000050', 'b0000000-0000-0000-0000-000000000041', 'TEC_CON_01.NI2', 'Velocidad media wifi', 'Velocidad media de conexión wifi pública', 'numeric', '[{"unit":"Mbps","min":0,"max":null,"description":"Velocidad media de descarga en wifi público"}]'),
  ('c0000000-0000-0000-0000-000000000051', 'b0000000-0000-0000-0000-000000000042', 'TEC_CON_02.NI1', 'Cobertura móvil', 'El destino dispone de cobertura móvil de calidad', 'gradient', '[{"level":0,"value":0,"description":"Cobertura 3G limitada"},{"level":1,"value":25,"description":"Cobertura 4G parcial"},{"level":2,"value":50,"description":"Cobertura 4G completa"},{"level":3,"value":75,"description":"Cobertura 5G parcial"},{"level":4,"value":100,"description":"Cobertura 5G completa"}]'),
  ('c0000000-0000-0000-0000-000000000052', 'b0000000-0000-0000-0000-000000000043', 'TEC_CON_03.NI1', 'Red IoT', 'Existe red de sensores IoT desplegada', 'gradient', '[{"level":0,"value":0,"description":"Sin sensores IoT"},{"level":1,"value":25,"description":"Sensores piloto"},{"level":2,"value":50,"description":"Red parcial desplegada"},{"level":3,"value":75,"description":"Red extensa con cobertura amplia"},{"level":4,"value":100,"description":"Red integral con plataforma de gestión"}]'),
  ('c0000000-0000-0000-0000-000000000053', 'b0000000-0000-0000-0000-000000000043', 'TEC_CON_03.NI2', 'Sensores desplegados', 'Número de sensores IoT desplegados', 'numeric', '[{"unit":"sensores","min":0,"max":null,"description":"Número total de sensores IoT en el destino"}]'),
  ('c0000000-0000-0000-0000-000000000054', 'b0000000-0000-0000-0000-000000000044', 'TEC_CON_04.NI1', 'Conectividad en alojamientos', 'Los alojamientos ofrecen conectividad de calidad', 'numeric', '[{"unit":"%","min":0,"max":100,"description":"Porcentaje de alojamientos con wifi de alta velocidad"}]'),

  -- TEC: SEN (4 indicators)
  ('c0000000-0000-0000-0000-000000000055', 'b0000000-0000-0000-0000-000000000045', 'TEC_SEN_01.NI1', 'Monitorización ambiental', 'Se utilizan sensores ambientales', 'gradient', '[{"level":0,"value":0,"description":"Sin monitorización"},{"level":1,"value":25,"description":"Monitorización básica de temperatura"},{"level":2,"value":50,"description":"Monitorización de calidad del aire"},{"level":3,"value":75,"description":"Monitorización ambiental multiparámetro"},{"level":4,"value":100,"description":"Monitorización ambiental integrada con alertas"}]'),
  ('c0000000-0000-0000-0000-000000000056', 'b0000000-0000-0000-0000-000000000046', 'TEC_SEN_02.NI1', 'Control de aforo', 'Existen sistemas de control de aforo inteligentes', 'gradient', '[{"level":0,"value":0,"description":"Sin control de aforo"},{"level":1,"value":25,"description":"Control manual en puntos clave"},{"level":2,"value":50,"description":"Sensores de aforo en espacios principales"},{"level":3,"value":75,"description":"Sistema integrado de gestión de aforo"},{"level":4,"value":100,"description":"Sistema predictivo con información en tiempo real"}]'),
  ('c0000000-0000-0000-0000-000000000057', 'b0000000-0000-0000-0000-000000000048', 'TEC_SEN_04.NI1', 'Gestión inteligente de recursos', 'Los sensores optimizan la gestión de recursos', 'gradient', '[{"level":0,"value":0,"description":"Sin gestión inteligente"},{"level":1,"value":25,"description":"Riego inteligente"},{"level":2,"value":50,"description":"Iluminación eficiente"},{"level":3,"value":75,"description":"Gestión integrada agua-luz-residuos"},{"level":4,"value":100,"description":"Smart city integrada con eficiencia energética"}]'),

  -- TEC: PLAT (6 indicators)
  ('c0000000-0000-0000-0000-000000000058', 'b0000000-0000-0000-0000-000000000049', 'TEC_PLAT_01.NI1', 'Plataforma DTI', 'El destino dispone de plataforma tecnológica integrada', 'gradient', '[{"level":0,"value":0,"description":"Sin plataforma"},{"level":1,"value":25,"description":"Plataforma básica"},{"level":2,"value":50,"description":"Plataforma con módulos integrados"},{"level":3,"value":75,"description":"Plataforma con API y conexiones"},{"level":4,"value":100,"description":"Plataforma integral con ecosistema de servicios"}]'),
  ('c0000000-0000-0000-0000-000000000059', 'b0000000-0000-0000-0000-000000000050', 'TEC_PLAT_02.NI1', 'App oficial del destino', 'Existe una aplicación móvil oficial', 'gradient', '[{"level":0,"value":0,"description":"Sin app"},{"level":1,"value":25,"description":"App básica informativa"},{"level":2,"value":50,"description":"App con geolocalización y rutas"},{"level":3,"value":75,"description":"App con servicios transaccionales"},{"level":4,"value":100,"description":"App integral con realidad aumentada y servicios inteligentes"}]'),
  ('c0000000-0000-0000-0000-000000000060', 'b0000000-0000-0000-0000-000000000050', 'TEC_PLAT_02.NI2', 'Descargas de la app', 'Número de descargas de la app turística', 'numeric', '[{"unit":"descargas","min":0,"max":null,"description":"Número total de descargas de la app oficial"}]'),
  ('c0000000-0000-0000-0000-000000000061', 'b0000000-0000-0000-0000-000000000051', 'TEC_PLAT_03.NI1', 'Portal web turístico', 'El portal web del destino es completo y accesible', 'gradient', '[{"level":0,"value":0,"description":"Portal básico"},{"level":1,"value":25,"description":"Portal informativo"},{"level":2,"value":50,"description":"Portal con reservas y servicios"},{"level":3,"value":75,"description":"Portal multilingüe y accesible"},{"level":4,"value":100,"description":"Portal inteligente con personalización y accesibilidad total"}]'),
  ('c0000000-0000-0000-0000-000000000062', 'b0000000-0000-0000-0000-000000000053', 'TEC_PLAT_05.NI1', 'APIs turísticas', 'Se exponen APIs de datos turísticos', 'gradient', '[{"level":0,"value":0,"description":"Sin APIs"},{"level":1,"value":25,"description":"API básica interna"},{"level":2,"value":50,"description":"API pública con documentación"},{"level":3,"value":75,"description":"API con autenticación y límites"},{"level":4,"value":100,"description":"API marketplace con ecosistema de desarrolladores"}]'),
  ('c0000000-0000-0000-0000-000000000063', 'b0000000-0000-0000-0000-000000000053', 'TEC_PLAT_05.NI2', 'Consumidores de API', 'Número de aplicaciones que usan las APIs turísticas', 'numeric', '[{"unit":"apps","min":0,"max":null,"description":"Número de aplicaciones que consumen las APIs del destino"}]'),

  -- SOST: MED (7 indicators)
  ('c0000000-0000-0000-0000-000000000064', 'b0000000-0000-0000-0000-000000000054', 'SOST_MED_01.NI1', 'Sistema de gestión ambiental', 'El destino cuenta con SGA', 'gradient', '[{"level":0,"value":0,"description":"Sin SGA"},{"level":1,"value":25,"description":"Política ambiental definida"},{"level":2,"value":50,"description":"SGA implementado (ISO 14001)"},{"level":3,"value":75,"description":"SGA con objetivos y metas"},{"level":4,"value":100,"description":"SGA con certificación y mejora continua"}]'),
  ('c0000000-0000-0000-0000-000000000065', 'b0000000-0000-0000-0000-000000000055', 'SOST_MED_02.NI1', 'Energía renovable', 'Se utiliza energía renovable en servicios turísticos', 'gradient', '[{"level":0,"value":0,"description":"Sin uso de renovables"},{"level":1,"value":25,"description":"Menos del 25%"},{"level":2,"value":50,"description":"Entre 25-50%"},{"level":3,"value":75,"description":"Entre 50-75%"},{"level":4,"value":100,"description":"Más del 75% de energía renovable"}]'),
  ('c0000000-0000-0000-0000-000000000066', 'b0000000-0000-0000-0000-000000000055', 'SOST_MED_02.NI2', 'Consumo energético', 'Consumo energético por turista', 'numeric', '[{"unit":"kWh/turista","min":0,"max":null,"description":"Consumo energético anual por turista"}]'),
  ('c0000000-0000-0000-0000-000000000067', 'b0000000-0000-0000-0000-000000000056', 'SOST_MED_03.NI1', 'Gestión de residuos', 'Existe plan de gestión de residuos turísticos', 'gradient', '[{"level":0,"value":0,"description":"Sin plan de residuos"},{"level":1,"value":25,"description":"Recogida selectiva básica"},{"level":2,"value":50,"description":"Plan de reducción de residuos"},{"level":3,"value":75,"description":"Economía circular implementada"},{"level":4,"value":100,"description":"Destino zero waste certificado"}]'),
  ('c0000000-0000-0000-0000-000000000068', 'b0000000-0000-0000-0000-000000000057', 'SOST_MED_04.NI1', 'Huella de carbono', 'Se mide y compensa la huella de carbono', 'gradient', '[{"level":0,"value":0,"description":"No se mide"},{"level":1,"value":25,"description":"Cálculo de huella básico"},{"level":2,"value":50,"description":"Huella medida anualmente"},{"level":3,"value":75,"description":"Plan de reducción activo"},{"level":4,"value":100,"description":"Compensación de carbono certificada"}]'),
  ('c0000000-0000-0000-0000-000000000069', 'b0000000-0000-0000-0000-000000000057', 'SOST_MED_04.NI2', 'Emisiones CO2', 'Emisiones de CO2 por turista', 'numeric', '[{"unit":"kgCO2/turista","min":0,"max":null,"description":"Emisiones de CO2 por turista al año"}]'),
  ('c0000000-0000-0000-0000-000000000070', 'b0000000-0000-0000-0000-000000000058', 'SOST_MED_05.NI1', 'Protección de recursos naturales', 'El destino protege sus recursos naturales', 'gradient', '[{"level":0,"value":0,"description":"Sin protección"},{"level":1,"value":25,"description":"Espacios protegidos declarados"},{"level":2,"value":50,"description":"Plan de conservación activo"},{"level":3,"value":75,"description":"Turismo sostenible certificado"},{"level":4,"value":100,"description":"Destino modelo en conservación ambiental"}]'),

  -- SOST: SOC (6 indicators)
  ('c0000000-0000-0000-0000-000000000071', 'b0000000-0000-0000-0000-000000000059', 'SOST_SOC_01.NI1', 'Impacto social del turismo', 'Se mide el impacto social del turismo', 'gradient', '[{"level":0,"value":0,"description":"No se mide el impacto social"},{"level":1,"value":25,"description":"Estudios puntuales"},{"level":2,"value":50,"description":"Indicadores sociales definidos"},{"level":3,"value":75,"description":"Medición periódica con informes"},{"level":4,"value":100,"description":"Impacto social medido y gestionado activamente"}]'),
  ('c0000000-0000-0000-0000-000000000072', 'b0000000-0000-0000-0000-000000000060', 'SOST_SOC_02.NI1', 'Turismo inclusivo', 'Se promueve el turismo inclusivo', 'gradient', '[{"level":0,"value":0,"description":"No se promueve"},{"level":1,"value":25,"description":"Iniciativas puntuales"},{"level":2,"value":50,"description":"Programa de turismo inclusivo"},{"level":3,"value":75,"description":"Destino accesible certificado"},{"level":4,"value":100,"description":"Destino modelo en turismo inclusivo"}]'),
  ('c0000000-0000-0000-0000-000000000073', 'b0000000-0000-0000-0000-000000000061', 'SOST_SOC_03.NI1', 'Empleo turístico local', 'El turismo genera empleo local de calidad', 'numeric', '[{"unit":"%","min":0,"max":100,"description":"Porcentaje de empleos turísticos ocupados por residentes locales"}]'),
  ('c0000000-0000-0000-0000-000000000074', 'b0000000-0000-0000-0000-000000000061', 'SOST_SOC_03.NI2', 'Calidad del empleo', 'Porcentaje de empleo turístico con contrato indefinido', 'numeric', '[{"unit":"%","min":0,"max":100,"description":"Porcentaje de contratos indefinidos en turismo"}]'),
  ('c0000000-0000-0000-0000-000000000075', 'b0000000-0000-0000-0000-000000000062', 'SOST_SOC_04.NI1', 'Preservación del patrimonio', 'Se preserva y promociona el patrimonio cultural', 'gradient', '[{"level":0,"value":0,"description":"Sin plan de preservación"},{"level":1,"value":25,"description":"Inventario de patrimonio"},{"level":2,"value":50,"description":"Plan de conservación"},{"level":3,"value":75,"description":"Programa de puesta en valor"},{"level":4,"value":100,"description":"Patrimonio digitalizado y promocionado internacionalmente"}]'),
  ('c0000000-0000-0000-0000-000000000076', 'b0000000-0000-0000-0000-000000000063', 'SOST_SOC_05.NI1', 'Calidad de vida residentes', 'El turismo contribuye a la calidad de vida', 'gradient', '[{"level":0,"value":0,"description":"Impacto negativo en calidad de vida"},{"level":1,"value":25,"description":"Impacto neutral"},{"level":2,"value":50,"description":"Impacto positivo leve"},{"level":3,"value":75,"description":"Impacto positivo significativo"},{"level":4,"value":100,"description":"Turismo como motor de bienestar comunitario"}]'),

  -- SOST: ECON (5 indicators)
  ('c0000000-0000-0000-0000-000000000077', 'b0000000-0000-0000-0000-000000000064', 'SOST_ECON_01.NI1', 'Impacto económico del turismo', 'Se mide el impacto económico del turismo', 'gradient', '[{"level":0,"value":0,"description":"No se mide"},{"level":1,"value":25,"description":"Estimaciones básicas"},{"level":2,"value":50,"description":"Cuenta satélite de turismo"},{"level":3,"value":75,"description":"Análisis input-output"},{"level":4,"value":100,"description":"Impacto económico medido con metodología avanzada"}]'),
  ('c0000000-0000-0000-0000-000000000078', 'b0000000-0000-0000-0000-000000000064', 'SOST_ECON_01.NI2', 'PIB turístico', 'Porcentaje del PIB que representa el turismo', 'numeric', '[{"unit":"%","min":0,"max":100,"description":"Porcentaje del PIB local generado por el turismo"}]'),
  ('c0000000-0000-0000-0000-000000000079', 'b0000000-0000-0000-0000-000000000065', 'SOST_ECON_02.NI1', 'Lucha contra estacionalidad', 'Se implementan medidas contra la estacionalidad', 'gradient', '[{"level":0,"value":0,"description":"Alta estacionalidad sin medidas"},{"level":1,"value":25,"description":"Medidas promocionales básicas"},{"level":2,"value":50,"description":"Programa de desestacionalización"},{"level":3,"value":75,"description":"Productos turísticos para todo el año"},{"level":4,"value":100,"description":"Destino con demanda equilibrada todo el año"}]'),
  ('c0000000-0000-0000-0000-000000000080', 'b0000000-0000-0000-0000-000000000066', 'SOST_ECON_03.NI1', 'Gasto medio por turista', 'Se analiza el gasto turístico', 'numeric', '[{"unit":"€","min":0,"max":null,"description":"Gasto medio por turista durante su estancia"}]'),
  ('c0000000-0000-0000-0000-000000000081', 'b0000000-0000-0000-0000-000000000067', 'SOST_ECON_04.NI1', 'Emprendimiento turístico local', 'Se fomenta el emprendimiento turístico local', 'gradient', '[{"level":0,"value":0,"description":"Sin fomento"},{"level":1,"value":25,"description":"Talleres de emprendimiento"},{"level":2,"value":50,"description":"Líneas de financiación"},{"level":3,"value":75,"description":"Vivero de empresas turísticas"},{"level":4,"value":100,"description":"Ecosistema emprendedor turístico consolidado"}]'),
  ('c0000000-0000-0000-0000-000000000082', 'b0000000-0000-0000-0000-000000000068', 'SOST_ECON_05.NI1', 'Contratación local', 'Se prioriza la contratación de proveedores locales', 'numeric', '[{"unit":"%","min":0,"max":100,"description":"Porcentaje de gasto en proveedores locales"}]'),

  -- ACC: ACC_FIS (8 indicators)
  ('c0000000-0000-0000-0000-000000000083', 'b0000000-0000-0000-0000-000000000069', 'ACC_FIS_01.NI1', 'Accesibilidad urbana', 'El destino cumple normativas de accesibilidad urbana', 'gradient', '[{"level":0,"value":0,"description":"Sin cumplimiento"},{"level":1,"value":25,"description":"Cumplimiento parcial"},{"level":2,"value":50,"description":"Cumplimiento en zonas turísticas"},{"level":3,"value":75,"description":"Cumplimiento general"},{"level":4,"value":100,"description":"Destino accesible certificado"}]'),
  ('c0000000-0000-0000-0000-000000000084', 'b0000000-0000-0000-0000-000000000069', 'ACC_FIS_01.NI2', 'Itinerarios accesibles', 'Porcentaje de itinerarios turísticos accesibles', 'numeric', '[{"unit":"%","min":0,"max":100,"description":"Porcentaje de rutas e itinerarios turísticos accesibles"}]'),
  ('c0000000-0000-0000-0000-000000000085', 'b0000000-0000-0000-0000-000000000070', 'ACC_FIS_02.NI1', 'Alojamientos accesibles', 'Los alojamientos turísticos son accesibles', 'numeric', '[{"unit":"%","min":0,"max":100,"description":"Porcentaje de alojamientos con habitaciones accesibles"}]'),
  ('c0000000-0000-0000-0000-000000000086', 'b0000000-0000-0000-0000-000000000071', 'ACC_FIS_03.NI1', 'Atractivos accesibles', 'Los atractivos turísticos son accesibles', 'gradient', '[{"level":0,"value":0,"description":"Sin accesibilidad"},{"level":1,"value":25,"description":"Accesible parcialmente"},{"level":2,"value":50,"description":"Accesible con ayuda"},{"level":3,"value":75,"description":"Totalmente accesible"},{"level":4,"value":100,"description":"Accesibilidad universal certificada"}]'),
  ('c0000000-0000-0000-0000-000000000087', 'b0000000-0000-0000-0000-000000000072', 'ACC_FIS_04.NI1', 'Transporte accesible', 'El transporte público es accesible', 'gradient', '[{"level":0,"value":0,"description":"Transporte no accesible"},{"level":1,"value":25,"description":"Líneas adaptadas parcialmente"},{"level":2,"value":50,"description":"Flota parcialmente accesible"},{"level":3,"value":75,"description":"Flota mayoritariamente accesible"},{"level":4,"value":100,"description":"Flota 100% accesible"}]'),
  ('c0000000-0000-0000-0000-000000000088', 'b0000000-0000-0000-0000-000000000072', 'ACC_FIS_04.NI2', 'Paradas accesibles', 'Porcentaje de paradas de transporte accesibles', 'numeric', '[{"unit":"%","min":0,"max":100,"description":"Porcentaje de paradas con accesibilidad universal"}]'),
  ('c0000000-0000-0000-0000-000000000089', 'b0000000-0000-0000-0000-000000000073', 'ACC_FIS_05.NI1', 'Señalización turística accesible', 'La señalización es accesible', 'gradient', '[{"level":0,"value":0,"description":"Señalización no accesible"},{"level":1,"value":25,"description":"Señalización con contraste básico"},{"level":2,"value":50,"description":"Señalización braille incluida"},{"level":3,"value":75,"description":"Señalización multiformato"},{"level":4,"value":100,"description":"Señalización inteligente y accesible"}]'),
  ('c0000000-0000-0000-0000-000000000090', 'b0000000-0000-0000-0000-000000000073', 'ACC_FIS_05.NI2', 'Señalización digital', 'Número de puntos con señalización digital accesible', 'numeric', '[{"unit":"puntos","min":0,"max":null,"description":"Número de puntos de información digital accesible"}]'),

  -- ACC: ACC_DIG (4 indicators)
  ('c0000000-0000-0000-0000-000000000091', 'b0000000-0000-0000-0000-000000000074', 'ACC_DIG_01.NI1', 'Accesibilidad web', 'Los canales digitales cumplen con WCAG', 'gradient', '[{"level":0,"value":0,"description":"No cumple WCAG"},{"level":1,"value":25,"description":"Nivel A (básico)"},{"level":2,"value":50,"description":"Nivel AA"},{"level":3,"value":75,"description":"Nivel AAA"},{"level":4,"value":100,"description":"Accesibilidad web auditada y certificada"}]'),
  ('c0000000-0000-0000-0000-000000000092', 'b0000000-0000-0000-0000-000000000074', 'ACC_DIG_01.NI2', 'Cumplimiento WCAG', 'Puntuación de accesibilidad web', 'numeric', '[{"unit":"%","min":0,"max":100,"description":"Porcentaje de cumplimiento de criterios WCAG 2.1"}]'),
  ('c0000000-0000-0000-0000-000000000093', 'b0000000-0000-0000-0000-000000000075', 'ACC_DIG_02.NI1', 'Información multilingüe', 'La información turística está disponible en varios idiomas', 'gradient', '[{"level":0,"value":0,"description":"Solo idioma local"},{"level":1,"value":25,"description":"2 idiomas"},{"level":2,"value":50,"description":"3 idiomas"},{"level":3,"value":75,"description":"4-5 idiomas"},{"level":4,"value":100,"description":"6+ idiomas con traducción automática"}]'),
  ('c0000000-0000-0000-0000-000000000094', 'b0000000-0000-0000-0000-000000000077', 'ACC_DIG_04.NI1', 'Canales de atención accesibles', 'Existen canales de atención accesibles', 'gradient', '[{"level":0,"value":0,"description":"Sin canales accesibles"},{"level":1,"value":25,"description":"Email y teléfono"},{"level":2,"value":50,"description":"Chat online"},{"level":3,"value":75,"description":"App con atención integrada"},{"level":4,"value":100,"description":"Omnicanalidad con accesibilidad total"}]')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- Minimal seed: 1 destination + 1 draft evaluation
-- ============================================================================

-- ── Bariloche destination ──────────────────────────────────────────────
INSERT INTO evaluations_service.destination (id, name, country, subnational_level_id, typology_id, population_range_id, region_id, member_type_id, lat, lng, is_adhered, created_at, updated_at) VALUES
  ('d0000000-0000-0000-0000-000000000001',
   'San Carlos de Bariloche',
   'Argentina',
   uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'snl-arg-municipio'),
   'b0000000-0000-0000-0000-000000000002',
   'c0000000-0000-0000-0000-000000000003',
   uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'region-patagonia-arg'),
   'a0000000-0000-0000-0000-000000000001',
   '-41.1335',
   '-71.3103',
   true,
   NOW(),
   NOW())
ON CONFLICT (id) DO NOTHING;

-- ── Draft evaluation for Bariloche ─────────────────────────────────────
INSERT INTO evaluations_service.evaluation (id, destination_id, name, type, status, start_date, end_date, has_external_evaluator, promoted_from_id, created_by, created_at, updated_at) VALUES
  ('e0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000001',
   'Autodiagnóstico Bariloche 2026',
   'autodiagnostico',
   'borrador',
   '2026-01-01',
   '2026-12-31',
   false,
   NULL,
   'f0000000-0000-0000-0000-000000000001',
   NOW(),
   NOW())
ON CONFLICT (id) DO NOTHING;

