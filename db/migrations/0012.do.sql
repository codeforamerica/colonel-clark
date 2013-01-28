ALTER TABLE crimes
      ADD COLUMN sector_str VARCHAR(16);
UPDATE crimes SET sector_str = to_char(sector, '999');
ALTER TABLE crimes
      DROP COLUMN sector;
ALTER TABLE crimes
      RENAME COLUMN sector_str TO sector;
