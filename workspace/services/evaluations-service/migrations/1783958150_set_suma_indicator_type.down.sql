-- Revert suma indicators back to numeric type.
SET search_path TO evaluations_service;

UPDATE indicator SET type = 'numeric'
WHERE type = 'suma'
  AND code IN (
    'GOB03_08_01', 'GOB03_08_02', 'GOB03_08_03',
    'GOB04_12_01',
    'TEC02_11_01', 'TEC03_13_02',
    'ACC02_10_01', 'ACC02_11_01',
    'ACC02_12_01', 'ACC02_12_02', 'ACC02_12_04', 'ACC02_12_05',
    'ACC02_13_01', 'ACC02_13_02', 'ACC02_13_03', 'ACC02_13_04',
    'ACC02_13_05', 'ACC02_13_06', 'ACC02_13_07', 'ACC02_13_08'
  );
