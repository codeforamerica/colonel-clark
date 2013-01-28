ALTER TABLE crimes
      ADD COLUMN incident_beat_int INTEGER;
UPDATE crimes SET incident_beat_int = to_number(incident_beat, '999');
ALTER TABLE crimes
      DROP COLUMN incident_beat;
ALTER TABLE crimes
      RENAME COLUMN incident_beat_int TO incident_beat;
