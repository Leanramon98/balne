ALTER TABLE users_service."user"
  ADD COLUMN IF NOT EXISTS firstlogin BOOLEAN NOT NULL DEFAULT TRUE;

-- Users created before this migration keep firstlogin=TRUE so they'll be
-- prompted to change their password on next login. Reset it to FALSE for
-- existing active users who presumably already have a real password.
UPDATE users_service."user" SET firstlogin = FALSE WHERE firstlogin = TRUE;
