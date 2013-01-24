CREATE TYPE user_subscription_status AS ENUM ('UNVERIFIED', 'VERIFIED');
ALTER TABLE user_subscriptions
      ADD COLUMN status user_subscription_status DEFAULT 'UNVERIFIED';
UPDATE user_subscriptions SET status = 'VERIFIED';
