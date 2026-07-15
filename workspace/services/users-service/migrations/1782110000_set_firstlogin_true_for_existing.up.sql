-- Set firstlogin=TRUE for all existing users so they see the
-- password change screen on next login. This is needed because
-- PostUsers was never setting FirstLogin=true (Go zero value = false),
-- ignoring the column DEFAULT TRUE.
UPDATE users_service."user" SET firstlogin = TRUE;
