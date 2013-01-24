ALTER TABLE user_subscriptions
      DROP CONSTRAINT uk_user_subscriptions_uuid,
      DROP COLUMN subsribed_on,
      DROP COLUMN uuid;
