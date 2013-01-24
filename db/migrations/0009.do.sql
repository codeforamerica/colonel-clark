ALTER TABLE users
      ADD COLUMN uuid VARCHAR(40) NOT NULL,
      ADD CONSTRAINT uk_users_uuid UNIQUE(uuid);
