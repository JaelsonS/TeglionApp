# Google Calendar — configuração operacional (Teglion)

Integração **separada** do login Google SSO. Usa o mesmo OAuth Client ID/Secret, mas:

- redirect URI diferente
- scopes diferentes (`calendar.events` + `calendar.calendarlist.readonly` + `openid`/`email`)
- `access_type=offline` + `prompt=consent` (para obter `refresh_token`)

## Google Cloud Console

1. Activar **Google Calendar API** no projeto.
2. No OAuth Client (tipo Aplicativo da Web), Authorized redirect URIs:

```
https://teglion.com/api/contabil/integrations/google-calendar/callback
https://www.teglion.com/api/contabil/integrations/google-calendar/callback
https://teglionapp.onrender.com/api/contabil/integrations/google-calendar/callback
```

(SSO continua com `/api/auth/google/callback`.)

3. Origens JavaScript (já usadas pela app): `https://teglion.com`, `https://www.teglion.com`.
4. OAuth consent screen: scopes alinhados; em Testing, adicionar emails de teste.
5. Após alargar scopes, a contadora deve **Reconectar Google Calendar** na Agenda → Definições.

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

Se `GOOGLE_CALENDAR_REDIRECT_URI` estiver vazio, o backend infere a partir de `PUBLIC_API_URL`.

## Comportamento no produto

| Estado UI | Significado |
|-----------|-------------|
| Desligado | Sem linha em `firm_google_calendar_connections` |
| Ligado | `auth_status=ok` — sync activo para o calendário escolhido |
| Precisa reconectar | Refresh token inválido (`invalid_grant`) — booking no Teglion continua |

- Escolha de calendário: `calendar_id` (deixa de assumir só `primary`).
- Agendamentos públicos: se “Sincronizar agendamentos da página pública” estiver activo, `firms.settings.booking.googleCalendarStaffUserId` aponta para o staff ligado.
- Falha do Google **nunca** cancela nem bloqueia o booking (`google_sync_status=failed`).

## Migrations

- `20260915000000_firm_google_calendar_connections.sql` — tabela + `consultations.google_event_id`
- `20260922000000_google_calendar_production_ready.sql` — `auth_status`, sync status, `calendar_summary`

## Validação manual rápida

1. Agenda → Definições → Ligar Google Calendar → consentir scopes.
2. Escolher calendário na lista.
3. Criar consulta no Teglion → verificar evento no Google (timezone Europe/Lisbon).
4. Cancelar consulta → evento removido.
5. Em myaccount.google.com/permissions, revogar Teglion → na próxima sync a UI deve mostrar “precisa ser reconectado”.
6. Booking público com sync activo → evento criado; com sync desligado → booking OK sem evento.
