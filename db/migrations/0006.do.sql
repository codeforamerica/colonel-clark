ALTER TABLE user_subscriptions
      ADD COLUMN uuid VARCHAR(40) NOT NULL,
      ADD COLUMN subscribed_on TIMESTAMP WITH TIME ZONE NOT NULL,
      ADD CONSTRAINT uk_user_subscriptions_uuid UNIQUE(uuid);
