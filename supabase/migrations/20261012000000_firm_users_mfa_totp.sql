-- Fase 4 — MFA TOTP (idempotente).
-- Staging já possui estas colunas via migration aplicada `20260821165305_firm_users_mfa_totp`
-- (histórico dessincronizado com o nome do ficheiro no repo — ver docs/ROADMAP e security note).
-- Produção: NÃO aplicar nesta fase sem autorização explícita (colunas órfãs já existem; repair separado).

ALTER TABLE public.firm_users
  ADD COLUMN IF NOT EXISTS mfa_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE public.firm_users
  ADD COLUMN IF NOT EXISTS mfa_totp_secret_enc text;

ALTER TABLE public.firm_users
  ADD COLUMN IF NOT EXISTS mfa_totp_pending_secret_enc text;

ALTER TABLE public.firm_users
  ADD COLUMN IF NOT EXISTS mfa_recovery_codes_hash jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.firm_users
  ADD COLUMN IF NOT EXISTS mfa_enabled_at timestamptz;

ALTER TABLE public.firm_users
  ADD COLUMN IF NOT EXISTS mfa_last_verified_at timestamptz;

COMMENT ON COLUMN public.firm_users.mfa_enabled IS 'TOTP MFA activo apenas após confirmação do primeiro código';
COMMENT ON COLUMN public.firm_users.mfa_totp_secret_enc IS 'Segredo TOTP AES-GCM (crypto-fields enc:v1)';
COMMENT ON COLUMN public.firm_users.mfa_totp_pending_secret_enc IS 'Segredo TOTP pendente durante enrollment';
COMMENT ON COLUMN public.firm_users.mfa_recovery_codes_hash IS 'Hashes one-time dos recovery codes (jsonb array)';
