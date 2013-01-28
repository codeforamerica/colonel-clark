ALTER TABLE crimes
      ADD COLUMN beat_str VARCHAR(16);
UPDATE crimes SET beat_str = to_char(beat, '999');
ALTER TABLE crimes
      DROP COLUMN beat;
ALTER TABLE crimes
      RENAME COLUMN beat_str TO beat;
