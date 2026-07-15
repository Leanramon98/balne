-- =====================================================
-- Migration 002: Update criteria for suma-type indicators
-- 
-- Parsed from: "Red Iberoamericana DTI - Modelo Requisitos
--               e Indicadores_vRev3-Sept25.xlsx"
--
-- Each suma indicator has multiple sub-criteria items,
-- each contributing a percentage value. The total score
-- is the SUM of the checked items' values.
--
-- Idempotent: safe to run multiple times.
-- Only affects rows where type = 'suma'.
-- =====================================================

-- GOB03_08_01: 6 items, total=100%
UPDATE evaluations_service.indicator
SET criteria = '[
  {"value": 30, "description": "Existe un canal online (ej foro) para fomentar el conocimiento y la participacion en la gestion turistica local con los residentes, individualmente u organizados."},
  {"value": 30, "description": "Existen servicios en la oficina o puntos de informacion turistica con orientacion al residente, y/o se realizan reuniones con los residentes con cierta periodicidad."},
  {"value": 20, "description": "Existen reuniones periodicas con tercer sector y residentes."},
  {"value": 10, "description": "Existen y se comunican productos turisticos especificos para los residentes."},
  {"value": 10, "description": "Existe una newsletter periodica especifica para residentes o con una seccion especial para residentes."},
  {"value": 0, "description": "No existen canales de comunicacion con tercer sector y residentes."}
]'::jsonb
WHERE code = 'GOB03_08_01' AND type = 'suma';

-- GOB03_08_02: 6 items, total=100%
UPDATE evaluations_service.indicator
SET criteria = '[
  {"value": 30, "description": "Canales de comunicacion en tiempo real (WhatsApp, chat en web) con los visitantes."},
  {"value": 20, "description": "Encuestas de satisfaccion con relacion al destino."},
  {"value": 20, "description": "Redes sociales actualizadas y en los idiomas de los principales mercados."},
  {"value": 20, "description": "Atencion presencial en oficina o puntos de informacion turistica en los idiomas de los principales mercados."},
  {"value": 10, "description": "Envio de comunicaciones periodicas actualizadas y en los idiomas de los principales mercados."},
  {"value": 0, "description": "Ninguna de las anteriores."}
]'::jsonb
WHERE code = 'GOB03_08_02' AND type = 'suma';

-- GOB03_08_03: 6 items, total=120%
UPDATE evaluations_service.indicator
SET criteria = '[
  {"value": 30, "description": "Canales de comunicacion en tiempo real (whatsapp, chat en web) con sector turistico."},
  {"value": 30, "description": "Existe un foro online para fomentar el conocimiento y la participacion en la gestion turistica local."},
  {"value": 20, "description": "Se manda una newsletter periodica."},
  {"value": 20, "description": "Se realizan reuniones periodicas."},
  {"value": 20, "description": "Encuestas de satisfaccion con relacion a la gestion turistica del destino con sector turistico."},
  {"value": 0, "description": "Ninguna de las anteriores."}
]'::jsonb
WHERE code = 'GOB03_08_03' AND type = 'suma';

-- GOB04_12_01: 6 items, total=100%
UPDATE evaluations_service.indicator
SET criteria = '[
  {"value": 25, "description": "Seguimiento de principales indicadores de demanda turistica (lugar de origen, estancia media, tipo de alojamiento, medio de transporte de acceso, forma de contratacion del viaje, motivo, patrones de movimiento y/o gasto, etc.)"},
  {"value": 25, "description": "Seguimiento para cuantificar y caracterizar la oferta (tipos de establecimientos y servicios, plazas, categorias, etc.)"},
  {"value": 20, "description": "Evaluacion de la satisfaccion del turista."},
  {"value": 15, "description": "Seguimiento de los recursos turisticos mas visitados."},
  {"value": 15, "description": "Monitorizacion de la contribucion economica del turismo al territorio (impacto economico y sobre el empleo."},
  {"value": 0, "description": "Sin proceso de medicion periodico de la actividad turistica."}
]'::jsonb
WHERE code = 'GOB04_12_01' AND type = 'suma';

-- TEC02_11_01: 3 items, total=100%
UPDATE evaluations_service.indicator
SET criteria = '[
  {"value": 50, "description": "Existen sistemas de pago sin contacto fisico y vinculados al turismo."},
  {"value": 50, "description": "Existen sistemas de informacion sin contacto fisico y vinculados con el turismo."},
  {"value": 0, "description": "No existe sistemas de pago ni de informacion sin contacto fisico."}
]'::jsonb
WHERE code = 'TEC02_11_01' AND type = 'suma';

-- TEC03_13_02: 5 items, total=100%
UPDATE evaluations_service.indicator
SET criteria = '[
  {"value": 30, "description": "Dispone de sistemas de recomendacion de contenidos personalizados."},
  {"value": 30, "description": "Se actualiza el contenido de alguna seccion de la web (ej.: eventos/agenda) al menos, con frecuencia semanal (ej.: eventos/agenda)."},
  {"value": 20, "description": "Se actualizan los contenidos (ej. fichas de recursos, eventos) de forma distribuida (asociaciones sectoriales, agentes privados)."},
  {"value": 10, "description": "Posibilidad de suscripcion a newsletter."},
  {"value": 10, "description": "Biblioteca de contenidos multimedia."}
]'::jsonb
WHERE code = 'TEC03_13_02' AND type = 'suma';

-- ACC02_10_01: 4 items, total=100%
UPDATE evaluations_service.indicator
SET criteria = '[
  {"value": 40, "description": "Facilidad de comprension y lectura de la informacion."},
  {"value": 30, "description": "Medios/canales accesibles de informacion aparte de la facilitada por el personal de la oficina."},
  {"value": 30, "description": "Informacion de soluciones ante diferentes necesidades imprevistas de accesibilidad."},
  {"value": 0, "description": "No se cumple ninguna de las anteriores."}
]'::jsonb
WHERE code = 'ACC02_10_01' AND type = 'suma';

-- ACC02_11_01: 6 items, total=100%
UPDATE evaluations_service.indicator
SET criteria = '[
  {"value": 20, "description": "Accesos."},
  {"value": 20, "description": "Venta de billetes."},
  {"value": 20, "description": "Zona de espera."},
  {"value": 20, "description": "Aseo de uso publico."},
  {"value": 20, "description": "Zona de embarque."},
  {"value": 0, "description": "Ninguna de las anteriores."}
]'::jsonb
WHERE code = 'ACC02_11_01' AND type = 'suma';

-- ACC02_12_01: 5 items, total=100%
UPDATE evaluations_service.indicator
SET criteria = '[
  {"value": 25, "description": "Espacios de acceso, maniobra y estancia (ej. para silla de ruedas)."},
  {"value": 25, "description": "Posicion de marquesina: no obstaculiza al resto de peatones."},
  {"value": 25, "description": "Informacion de lineas y destinos, horarios, tiempo de espera, incidencias."},
  {"value": 25, "description": "Facilidad de embarque/desembarque (ej. facil aproximacion del bus, sin fila de aparcamientos, buena visibilidad, etc)."},
  {"value": 0, "description": "No se cumple ninguna de las anteriores."}
]'::jsonb
WHERE code = 'ACC02_12_01' AND type = 'suma';

-- ACC02_12_02: 4 items, total=100%
UPDATE evaluations_service.indicator
SET criteria = '[
  {"value": 50, "description": "Piso bajo con rampa //"},
  {"value": 25, "description": "Espacios interiores reservados (sillas de ruedas, mayores, personas con discapacidad visual)."},
  {"value": 25, "description": "Informacion acustica sobre proxima parada."},
  {"value": 0, "description": "No se cumple ninguna delas anteriores."}
]'::jsonb
WHERE code = 'ACC02_12_02' AND type = 'suma';

-- ACC02_12_04: 4 items, total=100%
UPDATE evaluations_service.indicator
SET criteria = '[
  {"value": 50, "description": "Dotacion adecuada de licencias de taxis adaptados (> del 5% del total de licencias)."},
  {"value": 25, "description": "Posibilidad de solicitud previa (por: telefono, app, web)."},
  {"value": 25, "description": "Existencia de ayudas para licencias de taxi adaptado."},
  {"value": 0, "description": "No se cumple ninguna de las anteriores."}
]'::jsonb
WHERE code = 'ACC02_12_04' AND type = 'suma';

-- ACC02_12_05: 6 items, total=100%
UPDATE evaluations_service.indicator
SET criteria = '[
  {"value": 20, "description": "Dotacion: suficiente (>1/40 del total)."},
  {"value": 20, "description": "Senalizacion vertical y en pavimento."},
  {"value": 20, "description": "Con espacios de transferencia y maniobra suficientes en plazas PMR en bateria, segun normativa."},
  {"value": 20, "description": "Con espacios de transferencia y maniobra suficientes en plazas PMR en linea, segun normativa."},
  {"value": 20, "description": "Con vados de acceso a la acera (tanto en plazas en bateria como en linea) o disposicion junto a cruce peatonal equivalente."},
  {"value": 0, "description": "No se cumple ninguna de las anteriores."}
]'::jsonb
WHERE code = 'ACC02_12_05' AND type = 'suma';

-- ACC02_13_01: 5 items, total=80%
UPDATE evaluations_service.indicator
SET criteria = '[
  {"value": 20, "description": "Consideraciones de accesibilidad generales de la playa, segun criterios de normativa."},
  {"value": 20, "description": "Punto accesible equipado."},
  {"value": 20, "description": "Existencia de servicio de bano asistido."},
  {"value": 20, "description": "Equipamientos de accesibilidad complementarios."},
  {"value": 0, "description": "No se cumple ninguna de las anteriores."}
]'::jsonb
WHERE code = 'ACC02_13_01' AND type = 'suma';

-- ACC02_13_02: 4 items, total=100%
UPDATE evaluations_service.indicator
SET criteria = '[
  {"value": 35, "description": "Accesibilidad en las acciones previas a la ruta en el espacio natural."},
  {"value": 35, "description": "Accesibilidad en la ruta por el espacio natural."},
  {"value": 30, "description": "Accesibilidad en las ayudas y medios alternativos a la visita."},
  {"value": 0, "description": "No se cumple ninguna de las anteriores."}
]'::jsonb
WHERE code = 'ACC02_13_02' AND type = 'suma';

-- ACC02_13_03: 5 items, total=100%
UPDATE evaluations_service.indicator
SET criteria = '[
  {"value": 25, "description": "Itinerarios peatonales."},
  {"value": 25, "description": "Puntos de cruce peatonal."},
  {"value": 25, "description": "Senalizacion urbana."},
  {"value": 25, "description": "Conexion entre recursos alejados."},
  {"value": 0, "description": "No se cumple ninguna de las anteriores."}
]'::jsonb
WHERE code = 'ACC02_13_03' AND type = 'suma';

-- ACC02_13_04: 5 items, total=100%
UPDATE evaluations_service.indicator
SET criteria = '[
  {"value": 25, "description": "Mobiliario urbano."},
  {"value": 25, "description": "Interaccion con elementos urbanos."},
  {"value": 25, "description": "Zonas estanciales y puntos de descanso."},
  {"value": 25, "description": "Zonas de juego y recreo."},
  {"value": 0, "description": "No se cumple ninguna de las anteriores."}
]'::jsonb
WHERE code = 'ACC02_13_04' AND type = 'suma';

-- ACC02_13_05: 6 items, total=100%
UPDATE evaluations_service.indicator
SET criteria = '[
  {"value": 20, "description": "Identificacion-Localizacion."},
  {"value": 20, "description": "Acceso."},
  {"value": 20, "description": "Punto de atencion."},
  {"value": 20, "description": "Zona de espera."},
  {"value": 20, "description": "Elementos de Interaccion."},
  {"value": 0, "description": "No se cumple ninguna de las anteriores."}
]'::jsonb
WHERE code = 'ACC02_13_05' AND type = 'suma';

-- ACC02_13_06: 4 items, total=100%
UPDATE evaluations_service.indicator
SET criteria = '[
  {"value": 35, "description": "Facil identificacion."},
  {"value": 35, "description": "Aproximacion frontal y alcances horizontal y vertical."},
  {"value": 30, "description": "Facilidad de uso (interaccion)."},
  {"value": 0, "description": "No se cumple ninguna de las anteriores."}
]'::jsonb
WHERE code = 'ACC02_13_06' AND type = 'suma';

-- ACC02_13_07: 5 items, total=100%
UPDATE evaluations_service.indicator
SET criteria = '[
  {"value": 25, "description": "Posibilidad de visita para personas con dificultades de movilidad."},
  {"value": 25, "description": "Posibilidad de visita para personas con dificultades de vision."},
  {"value": 25, "description": "Posibilidad de visita para personas con dificultades de audicion."},
  {"value": 25, "description": "Posibilidad de visita para personas con dificultades de comprension."},
  {"value": 0, "description": "No se cumple ninguna de las anteriores."}
]'::jsonb
WHERE code = 'ACC02_13_07' AND type = 'suma';

-- ACC02_13_08: 3 items, total=100%
UPDATE evaluations_service.indicator
SET criteria = '[
  {"value": 50, "description": "Accesibilidad como publico en actividades y eventos de gran concurrencia."},
  {"value": 50, "description": "Accesibilidad en la participacion activa en actividades y eventos de gran concurrencia."},
  {"value": 0, "description": "No se cumple ninguna de las anteriores."}
]'::jsonb
WHERE code = 'ACC02_13_08' AND type = 'suma';

-- =====================================================
-- Verification
-- =====================================================
SELECT code, type, jsonb_array_length(criteria) AS items
FROM evaluations_service.indicator
WHERE type = 'suma'
ORDER BY code;
