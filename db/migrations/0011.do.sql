ALTER TABLE crimes
      ADD COLUMN incident_beat_str VARCHAR(16);
UPDATE crimes SET incident_beat_str = to_char(incident_beat, '999');
ALTER TABLE crimes
      DROP COLUMN incident_beat;
ALTER TABLE crimes
      RENAME COLUMN incident_beat_str TO incident_beat;
