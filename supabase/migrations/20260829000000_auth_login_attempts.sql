-- Tentativas de login (lockout por conta + atraso progressivo)
CREATE TABLE IF NOT EXISTS auth_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_key text NOT NULL,
  failed_count integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  last_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_ip text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS auth_login_attempts_account_key_idx
  ON auth_login_attempts (account_key);

CREATE INDEX IF NOT EXISTS auth_login_attempts_locked_until_idx
  ON auth_login_attempts (locked_until)
  WHERE locked_until IS NOT NULL;
