-- Revert to previous behavior: only new users get firstlogin=TRUE
UPDATE users_service."user" SET firstlogin = FALSE;
