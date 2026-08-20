# Backups

> Juntei aqui o que já tinha em `docs/06-SEGURANCA/BACKUPS.md` (12/08/2026), `docs/operations/BACKUP_R2.md`, e a parte de backup de `docs/operations/BACKUP_RESTORE.md`. Corrigi em relação à versão de 12/08: naquela data, eu ainda não tinha testado nenhum restore — hoje já fiz dois drills reais de restauração, em 13/08/2026, com timestamp, object key e RTO que observei. Ver [`DISASTER_RECOVERY.md`](./DISASTER_RECOVERY.md) pro procedimento completo e o registro dos dois drills.

## Duas camadas que montei

**Camada 1 — nativa do Supabase.** Meu banco de produção roda em Supabase **Pro**, com backup automático da plataforma. A janela real de retenção e se PITR (recuperação pontual) está ativo no meu projeto de produção **eu ainda não confirmei diretamente no painel do Supabase** — item pendente, não vou assumir sem checar.

**Camada 2 — lógica, externa, independente.** Fiz um backup diário `pg_dump -Fc` do Postgres de produção, que envio pra um bucket privado no Cloudflare R2. Não depende da infraestrutura do Supabase pra existir — é a camada que garante que, mesmo numa falha total do lado Supabase, eu tenho uma cópia dos dados em outro provedor.

Pros arquivos (documentos de cliente, imagens), o armazenamento vive no Supabase Storage; **ainda não fiz** réplica externa no R2 — fase futura, não implementada.

## Camada 2 em detalhe — Postgres → R2

### Escopo

| Incluído | Excluído (fase posterior) |
|---|---|
| `pg_dump -Fc` do Postgres | Supabase Storage (`contabil-documents`) |
| Upload privado para R2 | Redis |
| SHA-256 + manifesto | Auth / Stripe / Turnstile |
| Retenção configurável | Correção de drift de migration |

**Risco que já conheço, fora do escopo deste backup:** o histórico local de migrations pode não bater exatamente com o `schema_migrations` remoto do Supabase (ver a lacuna de rastreabilidade que documentei em [`MIGRATIONS.md`](./MIGRATIONS.md)). O dump reflete o **estado real do banco**, não o histórico de migrations. Não vou usar um restore pra tentar "corrigir" esse drift sem análise separada.

### Arquitetura

```
Render Cron Job (Dockerfile.backup)
  → pg_dump -Fc
  → SHA-256
  → Cloudflare R2 (teglion-backups-prod)
  → manifesto JSON
  → retenção
  → Sentry se falhar
```

Não roda no Web Service Express. Não uso Redis nisso. Não uso `SUPABASE_SERVICE_ROLE_KEY` pro dump.

### Object keys

```
postgresql/daily/YYYY/MM/YYYY-MM-DD-HHmmss.dump
postgresql/manifests/YYYY/MM/YYYY-MM-DD-HHmmss.json
```

### Variáveis (só no Render Cron Job)

| Nome | Obrigatória | Notas |
|---|---|---|
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

**Nunca** vou colocar essas variáveis no frontend, Vercel ou GitHub Actions.

### Comandos que uso

```bash
# Local / Cron
cd backend
BACKUP_DRY_RUN=true npm run backup:postgres

# Produção (Cron)
npm run backup:postgres
```

Exit codes: `0` sucesso ou dry-run OK; `1` falha; `2` lock em uso (outra execução).

### Dockerfile

```bash
docker build -f Dockerfile.backup -t teglion-backup .
docker run --rm -e BACKUP_DRY_RUN=true ... teglion-backup
```

A imagem inclui `postgresql-client-17` via PGDG (`pg_dump` / `pg_restore`), alinhado com o Postgres 17 do Supabase.

### Checklist que segui pra configurar (deixo aqui pra não esquecer da próxima vez)

1. **New → Cron Job** (não Web Service).
2. **Dockerfile path:** `Dockerfile.backup` (raiz do repo).
3. **Branch:** a mesma do backend de produção (`main`).
4. **Schedule:** `0 3 * * *` (03:00 UTC).
5. **Docker Command:** deixar o `CMD` da imagem (`node scripts/backup-postgres-to-r2.js`) ou definir explicitamente.
6. **Environment** (só neste Cron Job): `BACKUP_DATABASE_URL` (Supabase Dashboard → Project Settings → Database → URI Direct ou Session, porta 5432, role com leitura completa do schema), `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME=teglion-backups-prod`, `R2_ENDPOINT`, retenção (opcional), `SENTRY_DSN`, e `BACKUP_DRY_RUN=true` no primeiro deploy.
7. Rodei o dry-run uma vez e verifiquei os logs: `backup_started` … `backup_verified` com `dryRun: true`.
8. Troquei pra `BACKUP_DRY_RUN=false` e confirmei o primeiro dump + manifesto no R2.
9. Agendei um restore temporário pra validar — ver [`DISASTER_RECOVERY.md`](./DISASTER_RECOVERY.md).

### Segurança

- Token R2: só Object Read & Write no bucket `teglion-backups-prod`.
- Bucket privado; sem `r2.dev` público.
- Logs/Sentry/manifesto: sem passwords, URIs, service role, JWT.
- Lock em arquivo local (não Redis).

### Retenção

Só corre **depois** de SUCCESS do backup novo: diários 14 dias; domingos UTC até 8; dia 1 UTC até 12 meses. `BACKUP_DRY_RUN=true` **não** apaga.

### Observabilidade

Eventos JSON: `backup_started`, `backup_dump_completed`, `backup_checksum_completed`, `backup_upload_completed`, `backup_verified`, `backup_failed`, `backup_retention_completed`. Mando as falhas pro Sentry (`component=postgres-backup`) se `SENTRY_DSN` existir.

## Já validei o restore — duas vezes

Diferente do que eu tinha registrado na documentação de 12/08/2026 ("existe backup nativo não basta — até o primeiro drill, tratar a camada R2 como implementada, restore por validar"), **já fiz dois drills reais de restauração de um dump do R2, em 13/08/2026**, cada um com timestamp UTC, object key do dump usado, verificação de SHA-256, e RTO que observei. Os dois passaram (smoke test OK, contagens de tabela conferidas, dados de negócio intactos). O registro completo — object keys, RTO observado em cada drill, anomalias que encontrei — está em [`DISASTER_RECOVERY.md`](./DISASTER_RECOVERY.md).

O que ainda falta, e que registrei como planejado no [`ROADMAP.md`](../ROADMAP.md) (item 0.7): um RPO/RTO-alvo que eu ainda não defini formalmente (diferente do RTO observado nos dois drills que já fiz) e uma cadência de repetição do drill — pensei em trimestral, mas ainda não formalizei.

## Antes de eu tratar isso como totalmente resolvido

1. Confirmar diretamente no painel do Supabase se PITR está ativo no meu projeto de produção, e qual é a janela de retenção real.
2. Confirmar a política de backup do bucket de Storage separadamente — backup de banco e backup de arquivo não são necessariamente a mesma configuração, e hoje não tenho réplica externa dos arquivos.
3. Formalizar RPO/RTO-alvo e a cadência de repetição do drill — ver [`DISASTER_RECOVERY.md`](./DISASTER_RECOVERY.md) e [`ROADMAP.md`](../ROADMAP.md) item 0.7.
