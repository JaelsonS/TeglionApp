-- Palavra-passe só para o cofre de Acessos oficiais (não é login no Teglion).
-- Contas Google (sem password_hash) precisam disto para confirmar identidade
-- ao ver/gravar senhas de portais. Hash no backend, nunca em texto.

ALTER TABLE public.firm_users
  ADD COLUMN IF NOT EXISTS vault_password_hash TEXT;

COMMENT ON COLUMN public.firm_users.vault_password_hash IS
  'Hash da palavra-passe exclusiva do cofre de acessos oficiais. Independente do login.';

-- Rollback (documentação):
-- ALTER TABLE public.firm_users DROP COLUMN IF EXISTS vault_password_hash;
