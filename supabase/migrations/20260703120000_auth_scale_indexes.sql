-- Índices para login/SSO em escala (100k+ utilizadores)
CREATE INDEX IF NOT EXISTS idx_firm_users_email ON firm_users (email);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients (email);

-- Limpeza eficiente de sessões expiradas (cron / manutenção)
CREATE INDEX IF NOT EXISTS idx_auth_refresh_sessions_expires_at ON auth_refresh_sessions (expires_at);
