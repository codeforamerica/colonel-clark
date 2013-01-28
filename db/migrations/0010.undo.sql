ALTER TABLE crimes
      ADD COLUMN beat_int INTEGER;
UPDATE crimes SET beat_int = to_number(beat, '999');
ALTER TABLE crimes
      DROP COLUMN beat;
ALTER TABLE crimes
      RENAME COLUMN beat_int TO beat;
