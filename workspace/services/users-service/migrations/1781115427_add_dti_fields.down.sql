-- Migration rollback: Remove DTI fields
ALTER TABLE "user" DROP COLUMN IF EXISTS destination_id;
ALTER TABLE role DROP COLUMN IF EXISTS permissions;

-- Remove DTI roles (only the ones we added)
DELETE FROM role WHERE name IN (
  'admin_destino', 'gestor_destino', 'consultor',
  'auditor', 'gestor_regional', 'gestor_nacional'
);
