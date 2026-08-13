# Backup PostgreSQL → Cloudflare R2 (Teglion)

Segunda camada de recuperação do Postgres de produção. O backup nativo do **Supabase Pro** permanece activo; o R2 é cópia externa independente.

## Escopo

| Incluído | Excluído (fase posterior) |
|----------|---------------------------|
| `pg_dump -Fc` do Postgres | Supabase Storage (`contabil-documents`) |
| Upload privado para R2 | Redis |
| SHA-256 + manifesto | Auth / Stripe / Turnstile |
| Retenção configurável | Correcção de migration drift |

**Risco conhecido (fora deste trabalho):** o repositório tem ~58 ficheiros em `supabase/migrations/`, mas `schema_migrations` remoto pode listar ~22 versões. O dump reflecte o **estado real da BD**; o histórico local de migrations pode não bater. Não “corrigir” drift via restore sem análise.

## Arquitectura

```
Render Cron Job (Dockerfile.backup)
  → pg_dump -Fc
  → SHA-256
  → Cloudflare R2 (teglion-backups-prod)
  → manifesto JSON
  → retenção
  → Sentry se falhar
```

Não corre no Web Service Express. Não usa Redis. Não usa `SUPABASE_SERVICE_ROLE_KEY` para dump.

## Object keys

```
postgresql/daily/YYYY/MM/YYYY-MM-DD-HHmmss.dump
postgresql/manifests/YYYY/MM/YYYY-MM-DD-HHmmss.json
```

## Variáveis (Render Cron Job only)

| Nome | Obrigatória | Notas |
|------|-------------|--------|
| `BACKUP_DATABASE_URL` | Sim | Direct `:5432` ou Session pooler `:5432`. **Nunca** Transaction `:6543` |
| `R2_ACCOUNT_ID` | Sim | |
| `R2_ACCESS_KEY_ID` | Sim | Token Object Read & Write, só neste bucket |
| `R2_SECRET_ACCESS_KEY` | Sim | Só no Render |
| `R2_BUCKET_NAME` | Sim | `teglion-backups-prod` |
| `R2_ENDPOINT` | Sim | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `BACKUP_RETENTION_DAILY_DAYS` | Não | default `14` |
| `BACKUP_RETENTION_WEEKLY_COUNT` | Não | default `8` (domingos UTC) |
| `BACKUP_RETENTION_MONTHLY_COUNT` | Não | default `12` (dia 1 UTC) |
| `BACKUP_DRY_RUN` | Não | `true` = sem upload/delete |
| `SENTRY_DSN` | Recomendada | falhas `backup_failed` |

**Não** colocar estas vars no frontend, Vercel ou GitHub Actions.

## Comandos

```bash
# Local / Cron
cd backend
BACKUP_DRY_RUN=true npm run backup:postgres

# Produção (Cron)
npm run backup:postgres
```

Exit codes:

| Code | Significado |
|------|-------------|
| 0 | Sucesso ou dry-run OK |
| 1 | Falha |
| 2 | Lock em uso (outra execução) |

## Dockerfile

```bash
docker build -f Dockerfile.backup -t teglion-backup .
docker run --rm -e BACKUP_DRY_RUN=true ... teglion-backup
```

A imagem inclui `postgresql-client` (`pg_dump` / `pg_restore`).

## Checklist Render Cron Job

1. **New → Cron Job** (não Web Service).
2. **Dockerfile path:** `Dockerfile.backup` (raiz do repo).
3. **Branch:** a mesma do backend de produção (`main`).
4. **Schedule:** `0 3 * * *` (03:00 UTC).
5. **Docker Command:** deixar o `CMD` da imagem (`node scripts/backup-postgres-to-r2.js`) ou definir explicitamente.
6. **Environment** (só neste Cron Job):

   - `BACKUP_DATABASE_URL` — Supabase Dashboard → Project Settings → Database → **URI** Direct ou Session (porta **5432**). Preferir role com permissão de leitura completa do schema (tipicamente `postgres`).
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME=teglion-backups-prod`
   - `R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
   - retenção (opcional)
   - `SENTRY_DSN` (mesmo do backend ou dedicado)
   - `BACKUP_DRY_RUN=true` no **primeiro** deploy

7. Correr dry-run uma vez (manual trigger se o Render permitir) e verificar logs: `backup_started` … `backup_verified` com `dryRun: true`.
8. Remover / pôr `BACKUP_DRY_RUN=false` e confirmar o primeiro dump + manifesto no R2.
9. Agendar restore temporário (ver [BACKUP_RESTORE.md](./BACKUP_RESTORE.md)).

## Segurança

- Token R2: só Object Read & Write no bucket `teglion-backups-prod`.
- Bucket privado; sem r2.dev público.
- Logs/Sentry/manifesto: sem passwords, URIs, service role, JWT.
- Lock em ficheiro local (não Redis).

## Retenção

Só corre **depois** de SUCCESS do backup novo:

- diários: 14 dias;
- domingos UTC: até 8;
- dia 1 UTC: até 12 meses.

`BACKUP_DRY_RUN=true` **não** apaga.

## Observabilidade

Eventos JSON: `backup_started`, `backup_dump_completed`, `backup_checksum_completed`, `backup_upload_completed`, `backup_verified`, `backup_failed`, `backup_retention_completed`.

Falhas → Sentry (`component=postgres-backup`) se `SENTRY_DSN` existir.
