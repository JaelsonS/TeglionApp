# Google Calendar — configuração operacional

> Fonte: `docs/operations/GOOGLE_CALENDAR_SETUP.md` (pasta antiga, removida após esta consolidação). Editado para PT-BR, sem reescrita de conteúdo técnico.

Deixo essa integração **separada** do login Google SSO. Uso o mesmo OAuth Client ID/Secret, mas:

- redirect URI diferente;
- escopos diferentes (`calendar.events` + `calendar.calendarlist.readonly` + `openid`/`email`);
- `access_type=offline` + `prompt=consent` (pra obter `refresh_token`).

Deixo aqui o passo a passo que sigo quando preciso mexer nisso de novo.

## Google Cloud Console

1. Ativo a **Google Calendar API** no projeto.
2. No OAuth Client (tipo Aplicativo da Web), configuro os Authorized redirect URIs:

```
https://teglion.com/api/contabil/integrations/google-calendar/callback
https://www.teglion.com/api/contabil/integrations/google-calendar/callback
https://teglionapp.onrender.com/api/contabil/integrations/google-calendar/callback
```

(o SSO continua com `/api/auth/google/callback`.)

3. Origens JavaScript (já usadas pela app): `https://teglion.com`, `https://www.teglion.com`.
4. OAuth consent screen: alinho os escopos; em Testing, adiciono emails de teste.
5. Depois de ampliar escopos, lembro a contadora de **Reconectar Google Calendar** em Agenda → Configurações.

## Variáveis de ambiente (Render / local)

```
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URI=https://teglion.com/api/auth/google/callback
GOOGLE_CALENDAR_REDIRECT_URI=https://teglion.com/api/contabil/integrations/google-calendar/callback
PUBLIC_API_URL=https://teglion.com
FRONTEND_URL=https://teglion.com
DATA_ENCRYPTION_KEY=...   # cifra tokens em firm_google_calendar_connections
```

Se `GOOGLE_CALENDAR_REDIRECT_URI` ficar vazio, o backend infere a partir de `PUBLIC_API_URL`.

## Comportamento no produto

| Estado na UI | Significado |
|-----------|-------------|
| Desligado | Sem linha em `firm_google_calendar_connections` |
| Ligado | `auth_status=ok` — sincronização ativa para o calendário escolhido |
| Precisa reconectar | Refresh token inválido (`invalid_grant`) — booking no Teglion continua funcionando |

- Escolha de calendário: `calendar_id` (não assumo mais só `primary`).
- Agendamentos públicos: se "Sincronizar agendamentos da página pública" estiver ativo, `firms.settings.booking.googleCalendarStaffUserId` aponta para o funcionário conectado.
- Deixei claro que falha do Google **nunca** cancela nem bloqueia o booking (`google_sync_status=failed`).

## Migrations

- `20260915000000_firm_google_calendar_connections.sql` — tabela + `consultations.google_event_id`.
- `20260922000000_google_calendar_production_ready.sql` — `auth_status`, status de sincronização, `calendar_summary`.

## Validação manual rápida

O checklist que rodo quando preciso confirmar que isso ainda está funcionando:

1. Agenda → Configurações → Ligar Google Calendar → consentir escopos.
2. Escolher calendário na lista.
3. Criar consulta no Teglion → verificar evento no Google (timezone Europe/Lisbon).
4. Cancelar consulta → evento removido.
5. Em myaccount.google.com/permissions, revogar o Teglion → na próxima sincronização a UI deve mostrar "precisa ser reconectado".
6. Booking público com sincronização ativa → evento criado; com sincronização desligada → booking OK sem evento.
