CREATE TABLE users (
       _key           SERIAL        NOT NULL  PRIMARY KEY,
       email_address  VARCHAR(255)  NOT NULL,
CONSTRAINT uk_email_address UNIQUE(email_address)
);

CREATE TABLE user_subscriptions (
       _key             SERIAL        NOT NULL  PRIMARY KEY,
       user__key        INTEGER       NOT NULL  REFERENCES users(_key),
       neighborhood     VARCHAR(80)   NOT NULL
);
