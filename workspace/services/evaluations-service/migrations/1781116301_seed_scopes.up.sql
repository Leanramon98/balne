-- Seed: 16 Scopes with acronyms and icons
-- Each scope belongs to one of 5 axes (gob, inn, tec, sost, acc)

SET search_path TO evaluations_service;

INSERT INTO scope (id, axis, acronym, name, description, icon, sort_order) VALUES

-- ── GOB (Gobernanza) ───────────────────────────────────────────────────
('a0000000-0000-0000-0000-000000000001', 'gob', 'ORG', 'Organización',
 'Estructura organizativa del destino turístico inteligente',
 'Building2', 1),
('a0000000-0000-0000-0000-000000000002', 'gob', 'FIN', 'Financiación',
 'Modelo de financiación y sostenibilidad económica del DTI',
 'Wallet', 2),
('a0000000-0000-0000-0000-000000000003', 'gob', 'PLA', 'Planificación',
 'Planificación estratégica y hoja de ruta del DTI',
 'ScrollText', 3),
('a0000000-0000-0000-0000-000000000004', 'gob', 'GEST', 'Gestión',
 'Gestión de procesos y calidad en el destino',
 'Gauge', 4),

-- ── INN (Innovación) ───────────────────────────────────────────────────
('a0000000-0000-0000-0000-000000000005', 'inn', 'ECO', 'Ecosistema',
 'Ecosistema de innovación y emprendimiento turístico',
 'Lightbulb', 5),
('a0000000-0000-0000-0000-000000000006', 'inn', 'DAT', 'Datos',
 'Apertura y gestión de datos turísticos',
 'Database', 6),
('a0000000-0000-0000-0000-000000000007', 'inn', 'EXP', 'Experiencia',
 'Innovación en la experiencia turística',
 'Star', 7),

-- ── TEC (Tecnología) ───────────────────────────────────────────────────
('a0000000-0000-0000-0000-000000000008', 'tec', 'INF', 'Infraestructura',
 'Infraestructura tecnológica del destino',
 'Monitor', 8),
('a0000000-0000-0000-0000-000000000009', 'tec', 'CON', 'Conectividad',
 'Conectividad digital y acceso a internet',
 'Wifi', 9),
('a0000000-0000-0000-0000-000000000010', 'tec', 'SEN', 'Sensorización',
 'IoT y sensorización del destino',
 'Activity', 10),
('a0000000-0000-0000-0000-000000000011', 'tec', 'PLAT', 'Plataforma',
 'Plataforma tecnológica integral del DTI',
 'Globe', 11),

-- ── SOST (Sostenibilidad) ──────────────────────────────────────────────
('a0000000-0000-0000-0000-000000000012', 'sost', 'MED', 'Medio Ambiente',
 'Gestión ambiental y sostenibilidad ecológica',
 'TreePine', 12),
('a0000000-0000-0000-0000-000000000013', 'sost', 'SOC', 'Social',
 'Sostenibilidad social e impacto comunitario',
 'Users', 13),
('a0000000-0000-0000-0000-000000000014', 'sost', 'ECON', 'Económica',
 'Sostenibilidad económica y desarrollo local',
 'TrendingUp', 14),

-- ── ACC (Accesibilidad) ────────────────────────────────────────────────
('a0000000-0000-0000-0000-000000000015', 'acc', 'ACC_FIS', 'Accesibilidad Física',
 'Accesibilidad universal en espacios y servicios turísticos',
 'Accessibility', 15),
('a0000000-0000-0000-0000-000000000016', 'acc', 'ACC_DIG', 'Accesibilidad Digital',
 'Accesibilidad digital y comunicativa del destino',
 'Smartphone', 16)

ON CONFLICT (id) DO NOTHING;

-- Update icons for existing scopes (in case seed already ran with old placeholders)
UPDATE evaluations_service.scope SET icon = 'Building2'   WHERE acronym = 'ORG';
UPDATE evaluations_service.scope SET icon = 'Wallet'      WHERE acronym = 'FIN';
UPDATE evaluations_service.scope SET icon = 'ScrollText'  WHERE acronym = 'PLA';
UPDATE evaluations_service.scope SET icon = 'Gauge'       WHERE acronym = 'GEST';
UPDATE evaluations_service.scope SET icon = 'Lightbulb'   WHERE acronym = 'ECO';
UPDATE evaluations_service.scope SET icon = 'Database'    WHERE acronym = 'DAT';
UPDATE evaluations_service.scope SET icon = 'Star'        WHERE acronym = 'EXP';
UPDATE evaluations_service.scope SET icon = 'Monitor'     WHERE acronym = 'INF';
UPDATE evaluations_service.scope SET icon = 'Wifi'        WHERE acronym = 'CON';
UPDATE evaluations_service.scope SET icon = 'Activity'    WHERE acronym = 'SEN';
UPDATE evaluations_service.scope SET icon = 'Globe'       WHERE acronym = 'PLAT';
UPDATE evaluations_service.scope SET icon = 'TreePine'    WHERE acronym = 'MED';
UPDATE evaluations_service.scope SET icon = 'Users'       WHERE acronym = 'SOC';
UPDATE evaluations_service.scope SET icon = 'TrendingUp'  WHERE acronym = 'ECON';
UPDATE evaluations_service.scope SET icon = 'Accessibility' WHERE acronym = 'ACC_FIS';
UPDATE evaluations_service.scope SET icon = 'Smartphone'  WHERE acronym = 'ACC_DIG';

-- Update icons for Red Iberoamericana scopes (added separately)
UPDATE evaluations_service.scope SET icon = 'Target'        WHERE acronym = 'GOB01';
UPDATE evaluations_service.scope SET icon = 'Gauge'         WHERE acronym = 'GOB02';
UPDATE evaluations_service.scope SET icon = 'Shield'        WHERE acronym = 'GOB03';
UPDATE evaluations_service.scope SET icon = 'CheckCircle'   WHERE acronym = 'GOB04';
UPDATE evaluations_service.scope SET icon = 'Lightbulb'     WHERE acronym = 'INN01';
UPDATE evaluations_service.scope SET icon = 'Rocket'        WHERE acronym = 'INN02';
UPDATE evaluations_service.scope SET icon = 'Network'       WHERE acronym = 'INN03';
UPDATE evaluations_service.scope SET icon = 'Monitor'       WHERE acronym = 'TEC01';
UPDATE evaluations_service.scope SET icon = 'Cloud'         WHERE acronym = 'TEC02';
UPDATE evaluations_service.scope SET icon = 'Cpu'           WHERE acronym = 'TEC03';
UPDATE evaluations_service.scope SET icon = 'Leaf'          WHERE acronym = 'SOS01';
UPDATE evaluations_service.scope SET icon = 'Landmark'      WHERE acronym = 'SOS02';
UPDATE evaluations_service.scope SET icon = 'TreePine'      WHERE acronym = 'SOS03';
UPDATE evaluations_service.scope SET icon = 'TrendingUp'    WHERE acronym = 'SOS04';
UPDATE evaluations_service.scope SET icon = 'Accessibility' WHERE acronym = 'ACC01';
UPDATE evaluations_service.scope SET icon = 'HeartHandshake' WHERE acronym = 'ACC02';
