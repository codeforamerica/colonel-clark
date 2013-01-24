ALTER TABLE user_subscriptions
      ADD CONSTRAINT uk_user_neighborhood UNIQUE(user__key, neighborhood);
