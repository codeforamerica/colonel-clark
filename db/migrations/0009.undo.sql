ALTER TABLE users
      DROP CONSTRAINT uk_users_uuid,
      DROP COLUMN uuid;
