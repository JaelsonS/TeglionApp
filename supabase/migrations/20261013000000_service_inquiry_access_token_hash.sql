-- Hash do token do mini-portal para lookup sem guardar o valor em texto plano.
-- O valor em access_token passa a ser encriptado (enc:v1) pela aplicação.
ALTER TABLE service_inquiries
  ADD COLUMN IF NOT EXISTS access_token_hash text;

CREATE UNIQUE INDEX IF NOT EXISTS service_inquiries_access_token_hash_uidx
  ON service_inquiries (access_token_hash)
  WHERE access_token_hash IS NOT NULL;
