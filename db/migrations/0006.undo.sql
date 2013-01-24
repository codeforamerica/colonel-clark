ALTER TABLE user_subscriptions
      DROP CONSTRAINT uk_uuid,
      DROP COLUMN subsribed_on,
      DROP COLUMN uuid;
