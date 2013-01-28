ALTER TABLE crimes
      ADD COLUMN sector_int INTEGER;
UPDATE crimes SET sector_int = to_number(sector, '999');
ALTER TABLE crimes
      DROP COLUMN sector;
ALTER TABLE crimes
      RENAME COLUMN sector_int TO sector;
