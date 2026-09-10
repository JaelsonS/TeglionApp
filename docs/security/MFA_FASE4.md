# Autenticação de dois factores (MFA)

Este é o estado real do MFA no Teglion — o que a dona do escritório e a equipa encontram no produto, e o que o código faz por detrás. Não é um plano de fase; é o que está ligado.

## Em uma frase

O login com password (ou Google) não chega sozinho: quem gere o escritório tem de confirmar com um código da aplicação no telemóvel. Se mudar de telemóvel, troca a app sem desligar a protecção.

## Quem é obrigado e quem não

| Função | MFA |
|--------|-----|
| Dona / dono do escritório (`FIRM_OWNER`) | Obrigatório — não dá para desligar |
| Equipa (`FIRM_STAFF`, `FIRM_CONSULTANT`) | Opcional — pode activar e desactivar em Definições → Segurança |

## O que a pessoa vê no produto

1. **Primeiro login do owner sem MFA** — depois da password, o Teglion pede para configurar a app (QR + código de 6 dígitos) e mostra códigos de recuperação para guardar.
2. **Login com MFA já activo** — password (ou SSO) → ecrã do código da app (ou um código de recuperação).
3. **Definições → Segurança** — estado activo/inactivo; regenerar códigos de recuperação; **trocar aplicação de autenticação**; staff pode desactivar.

Os códigos **não** vão por e-mail nem SMS. Vêm da app (Authenticator, Authy, etc.) ou dos códigos de recuperação que a pessoa guardou.

## Trocar de app / telemóvel (rotação)

Isto existia como lacuna: o owner não podia desactivar o MFA, e sem desactivar não conseguia configurar outra app. Agora há um fluxo próprio:

1. Prova que é ela — código da app **actual** ou um **código de recuperação**.
2. Aparece o QR da app **nova**. A antiga continua a valer até confirmar.
3. Confirma com o código da app nova → o secret antigo deixa de servir; saem **novos** códigos de recuperação; as outras sessões de refresh são revogadas.

**Porque não por e-mail:** se alguém entra na caixa de correio e o Teglion deixa resetar o MFA só com isso, o segundo factor deixa de proteger a conta. Recuperação de password por e-mail é outra história; resetar o MFA não.

Se perdeu o telemóvel **e** os códigos de recuperação, não há self-service seguro — aí é processo com prova de identidade (suporte AfDigital), não um link mágico.

## Como está feito por baixo (para quem mexe no código)

- Stack própria com `otplib` + colunas em `firm_users` (segredo cifrado AES-GCM, recovery em Argon2id). **Não** usamos Supabase Auth MFA.
- Depois da password/SSO: challenge JWT (`typ=mfa-challenge`, TTL curto, `jti`) — não é sessão de dashboard.
- SSO Google passa pelo mesmo gate: não contorna o MFA.
- Anti-replay do código TOTP por utilizador; rate limit nas rotas MFA; eventos de auditoria (`mfa.enroll.*`, `mfa.challenge.*`, `mfa.rotate.*`, `mfa.disable`, …).

### Endpoints

| Método | Rota | Notas |
|--------|------|--------|
| GET | `/api/auth/mfa/challenge/status` | Com challenge token |
| POST | `/api/auth/mfa/challenge/verify` | Código app ou recovery |
| POST | `/api/auth/mfa/enroll/begin` | QR / otpauth |
| POST | `/api/auth/mfa/enroll/confirm` | Activa MFA + recovery |
| GET | `/api/auth/mfa/status` | Sessão autenticada |
| POST | `/api/auth/mfa/disable` | Bloqueado para owner |
| POST | `/api/auth/mfa/recovery/regenerate` | Exige TOTP actual |
| POST | `/api/auth/mfa/rotate/begin` | Prova TOTP ou recovery → pending |
| POST | `/api/auth/mfa/rotate/confirm` | App nova → substitui secret |
| POST | `/api/auth/mfa/rotate/cancel` | Limpa pending; antigo mantém-se |

Código: `backend/src/modules/auth/mfa.service.js`, UI em `FirmSettingsSecuritySection.tsx` e `FirmMfaChallengePage.tsx`.

## Schema / produção

As colunas MFA em `firm_users` já existem. Histórico antigo de schema (colunas sem entrada limpa em `schema_migrations`) está em [`MFA_PROD_SCHEMA_INCIDENT.md`](./MFA_PROD_SCHEMA_INCIDENT.md) — é registo de incidente de migração, não um “MFA desligado no produto”.
