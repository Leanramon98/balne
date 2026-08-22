-- Seed: demo balneario "Cocodrilo Pinamar" with 10 plan units, 2 tariffs, 1 customer.
-- Fixed UUIDs keep foreign keys deterministic across environments.
SET search_path TO bookings_service, public;

-- Balneario ----------------------------------------------------------------
INSERT INTO balnearios (id, name, slug, location, created_at, updated_at) VALUES
    ('c0c0d211-0000-0000-0000-000000000001',
     'Cocodrilo Pinamar',
     'cocodrilo-pinamar',
     'Pinamar, Buenos Aires, Argentina',
     NOW(), NOW());

-- Plan units (10): zone A (5) and zone B (5), 80x80 rectangles on a grid ---
INSERT INTO plan_units
    (id, balneario_id, unit_number, zone, capacity, position_x, position_y, width, height, shape, is_rentable, status)
VALUES
    ('a0a0a0a0-0000-0000-0000-000000000001', 'c0c0d211-0000-0000-0000-000000000001', 'A1', 'A', 4,  60,  60, 80, 80, 'rectangle', TRUE, 'available'),
    ('a0a0a0a0-0000-0000-0000-000000000002', 'c0c0d211-0000-0000-0000-000000000001', 'A2', 'A', 4, 170,  60, 80, 80, 'rectangle', TRUE, 'available'),
    ('a0a0a0a0-0000-0000-0000-000000000003', 'c0c0d211-0000-0000-0000-000000000001', 'A3', 'A', 4, 280,  60, 80, 80, 'rectangle', TRUE, 'available'),
    ('a0a0a0a0-0000-0000-0000-000000000004', 'c0c0d211-0000-0000-0000-000000000001', 'A4', 'A', 4, 390,  60, 80, 80, 'rectangle', TRUE, 'available'),
    ('a0a0a0a0-0000-0000-0000-000000000005', 'c0c0d211-0000-0000-0000-000000000001', 'A5', 'A', 4, 500,  60, 80, 80, 'rectangle', TRUE, 'available'),
    ('a0a0a0a0-0000-0000-0000-000000000006', 'c0c0d211-0000-0000-0000-000000000001', 'B1', 'B', 4,  60, 180, 80, 80, 'rectangle', TRUE, 'available'),
    ('a0a0a0a0-0000-0000-0000-000000000007', 'c0c0d211-0000-0000-0000-000000000001', 'B2', 'B', 4, 170, 180, 80, 80, 'rectangle', TRUE, 'available'),
    ('a0a0a0a0-0000-0000-0000-000000000008', 'c0c0d211-0000-0000-0000-000000000001', 'B3', 'B', 4, 280, 180, 80, 80, 'rectangle', TRUE, 'available'),
    ('a0a0a0a0-0000-0000-0000-000000000009', 'c0c0d211-0000-0000-0000-000000000001', 'B4', 'B', 4, 390, 180, 80, 80, 'rectangle', TRUE, 'available'),
    ('a0a0a0a0-0000-0000-0000-000000000010', 'c0c0d211-0000-0000-0000-000000000001', 'B5', 'B', 4, 500, 180, 80, 80, 'rectangle', TRUE, 'available');

-- Tariffs: day and week for 'carpa' during the 2026-2027 season ------------
INSERT INTO tariffs
    (id, balneario_id, unit_type, period, price, currency, season)
VALUES
    ('d0d0d0d0-0000-0000-0000-000000000001', 'c0c0d211-0000-0000-0000-000000000001', 'carpa', 'day',  15000, 'ARS', '2026-2027'),
    ('d0d0d0d0-0000-0000-0000-000000000002', 'c0c0d211-0000-0000-0000-000000000001', 'carpa', 'week', 90000, 'ARS', '2026-2027');

-- Sample customer ----------------------------------------------------------
INSERT INTO customers (id, name, email, phone, created_at, updated_at) VALUES
    ('cccccccc-0000-0000-0000-000000000001',
     'Juan Perez',
     'juan.perez@example.com',
     '+54 2234 123456',
     NOW(), NOW());
