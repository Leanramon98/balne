-- Seed: Reference catalog data
-- Uses deterministic UUIDs for stable IDs across environments

SET search_path TO evaluations_service;

-- Helper function for deterministic UUIDs
-- Namespace: 6ba7b810-9dad-11d1-80b4-00c04fd430c8 (DNS)

-- ── Axis Levels (5 axes, 20% each) ─────────────────────────────────────

INSERT INTO axis_level (id, axis, objective_percent, sort_order) VALUES
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'axis-gob'), 'gob', 20.00, 1),
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'axis-inn'), 'inn', 20.00, 2),
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'axis-tec'), 'tec', 20.00, 3),
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'axis-sost'), 'sost', 20.00, 4),
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'axis-acc'), 'acc', 20.00, 5)
ON CONFLICT (axis) DO NOTHING;

-- ── Member Types ───────────────────────────────────────────────────────

INSERT INTO member_type (id, name) VALUES
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'member-destinos'), 'Destinos'),
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'member-ejemplo'), 'Ejemplo')
ON CONFLICT (id) DO NOTHING;

-- ── Destination Typologies ─────────────────────────────────────────────

INSERT INTO destination_typology (id, name) VALUES
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'typology-emergente'), 'Emergente'),
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'typology-consolidado'), 'Consolidado')
ON CONFLICT (id) DO NOTHING;

-- ── Population Ranges ──────────────────────────────────────────────────

INSERT INTO population_range (id, name) VALUES
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'pop-up-to-5000'), 'Hasta 5.000 habitantes'),
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'pop-5001-20000'), '5.001 – 20.000 habitantes'),
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'pop-20001-100000'), '20.001 – 100.000 habitantes'),
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'pop-100001-500000'), '100.001 – 500.000 habitantes'),
  (uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'pop-over-500000'), 'Más de 500.000 habitantes')
ON CONFLICT (id) DO NOTHING;

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
