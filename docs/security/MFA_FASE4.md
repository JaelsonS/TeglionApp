# Fase 4 — MFA (implementação)

**Estado:** implementação em `feature/fase-4-mfa` — **não concluída** até Security Gate + UAT do owner.

## Política

| Função | MFA |
|--------|-----|
| `FIRM_OWNER` | Obrigatório |
| `FIRM_STAFF` | Opcional |
| `FIRM_CONSULTANT` | Opcional (inicialmente) |

## Fluxos

1. Password/SSO válidos → se MFA activo: `MFA_CHALLENGE_REQUIRED`; se owner sem MFA: `MFA_ENROLLMENT_REQUIRED`; senão sessão completa.
2. Challenge JWT (`typ=mfa-challenge`, TTL 5m, `jti`, `firmId`, `purpose`) — rejeitado pelo `authMiddleware`.
3. Enrollment restrito às rotas `/api/auth/mfa/enroll/*` (sem sessão dashboard).
4. Refresh: owner sem MFA → `MFA_ENROLLMENT_REQUIRED` (revoga sessões via `deleteAllForActor`); owner/staff com MFA → refresh normal.
5. Google SSO não bypassa MFA (mesmo gate pós-identidade).

## Endpoints

- `GET /api/auth/mfa/challenge/status`
- `POST /api/auth/mfa/challenge/verify`
- `POST /api/auth/mfa/enroll/begin`
- `POST /api/auth/mfa/enroll/confirm`
- `GET /api/auth/mfa/status` (sessão)
- `POST /api/auth/mfa/disable`
- `POST /api/auth/mfa/recovery/regenerate`

## Crypto

- Segredo TOTP: `encryptField` AES-256-GCM / `DATA_ENCRYPTION_KEY`
- Recovery codes: Argon2id, one-time; regeneração invalida anteriores
- Biblioteca TOTP única: `otplib@13.5.0`

## Produção

Ver `docs/security/MFA_PROD_SCHEMA_INCIDENT.md` — sem DDL/repair/activação nesta fase.
