# Restore de backup PostgreSQL (temporário)

Procedimento para validar um dump R2 **sem tocar na produção**.

## RPO / RTO (esperado)

| Métrica | Esperado | Notas |
|---------|----------|--------|
| **RPO** | ≤ 24 h | Schedule diário 03:00 UTC; pior caso ≈ 1 dia desde o último SUCCESS |
| **RTO** | a medir no 1º drill | Tempo desde “preciso do restore” até smoke test verde no Postgres temporário |

Registar o RTO observado no fim do primeiro drill.

## Pré-requisitos

- Credenciais R2 (read) no ambiente local/seguro — **nunca** no Git.
- `pg_restore` e `psql` instalados (ou usar a imagem `Dockerfile.backup`).
- Postgres **temporário** (Docker local, projecto Supabase de staging, ou VM). **Proibido** apontar para produção.

## 1. Listar e escolher objecto

No Cloudflare R2 → bucket `teglion-backups-prod` → `postgresql/daily/...`

Anotar:

- dump key, ex. `postgresql/daily/2026/08/2026-08-13-030000.dump`
- manifesto correspondente em `postgresql/manifests/...`

## 2. Download

```bash
# Exemplo com AWS CLI S3-compatible (endpoint R2). Não commitar credenciais.
aws s3 cp "s3://teglion-backups-prod/postgresql/daily/YYYY/MM/FILE.dump" ./restore.dump \
  --endpoint-url "https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com"

aws s3 cp "s3://teglion-backups-prod/postgresql/manifests/YYYY/MM/FILE.json" ./restore.json \
  --endpoint-url "https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com"
```

## 3. Verificar SHA-256

```bash
# manifesto.sha256 vs ficheiro
node -e "const fs=require('fs');const c=require('crypto');const m=JSON.parse(fs.readFileSync('restore.json','utf8'));const h=c.createHash('sha256').update(fs.readFileSync('restore.dump')).digest('hex'); if(h!==m.sha256){console.error('MISMATCH',h,m.sha256);process.exit(1)}; console.log('OK',h);"
```

Se falhar: **não restaurar**. Investigar upload/corrupção.

## 4. Postgres temporário

Exemplo Docker:

```bash
docker run --name teglion-restore-tmp -e POSTGRES_PASSWORD=tmp -p 55432:5432 -d postgres:17
export RESTORE_DATABASE_URL='postgresql://postgres:tmp@127.0.0.1:55432/postgres'
```

## 5. pg_restore

```bash
pg_restore --no-owner --no-acl -d "$RESTORE_DATABASE_URL" ./restore.dump
```

Erros de “role does not exist” / ACL são esperados com `--no-owner --no-acl` em ambiente limpo; falhas fatais de schema devem ser investigadas.

## 6. Smoke test (mínimo)

```sql
-- Ligar ao temporário
SELECT count(*) AS firms FROM public.firms;
SELECT count(*) AS clients FROM public.clients;
SELECT count(*) AS firm_users FROM public.firm_users;
SELECT count(*) AS clients_auth FROM public.clients WHERE password_hash IS NOT NULL OR email IS NOT NULL;
SELECT count(*) AS services FROM public.accounting_services;
SELECT count(*) AS consultations FROM public.consultations;
SELECT count(*) AS documents FROM public.documents;
SELECT count(*) AS refresh_sessions FROM public.auth_refresh_sessions;
```

Ajustar nomes se alguma tabela não existir no dump (schema real). O objectivo é confirmar que o dump abre e as tabelas críticas de negócio estão presentes.

## 7. Limpeza

```bash
docker rm -f teglion-restore-tmp
rm -f ./restore.dump ./restore.json
```

## O que NÃO fazer

- Restaurar por cima da BD de produção.
- Expor o dump em bucket público / r2.dev.
- Colar `BACKUP_DATABASE_URL` ou tokens R2 em tickets/Slack sem redacção.
- Assumir que o histórico de migrations do Git bate 100% com o dump (ver drift documentado em [BACKUP_R2.md](./BACKUP_R2.md)).

## Registo do drill

Após o primeiro restore bem-sucedido, anotar:

- data/hora UTC
- object key usado
- duração total (RTO observado)
- queries smoke (pass/fail)
- anomalias (roles, extensions, etc.)

### Drill 1 — 2026-08-13 (Sprint 0)

| Campo | Valor |
|-------|--------|
| Data/hora UTC | 2026-08-13 ~13:16–13:18 UTC |
| Object key | `postgresql/daily/2026/08/2026-08-13-131519.dump` |
| Manifest SHA-256 | `965f8737dbb52610e5dad0ecc1a4b9b2e0b2978ffb0aaf6c3efd205dd1777bad` (match OK) |
| Destino | Docker local `postgres:17` (`teglion-restore-tmp`, porta `55432`) — **não** produção |
| RTO observado | ~2 min (download R2 ~1,4 s + pull/start Postgres 17 + `pg_restore` + smoke) |
| Smoke | PASS — `firms=2`, `clients=39`, `firm_users=5`, `accounting_services=21`, `consultations=2`, `documents=0`, `auth_refresh_sessions=77` |
| Anomalias | `pg_restore` reporta erros esperados em schemas/extensões Supabase (`auth`, `storage`, `supabase_vault`, etc.) ao restaurar num Postgres vanilla; tabelas `public` de negócio OK. Usar `--no-owner --no-acl`. |

Cadência: repetir este drill pelo menos **trimestralmente** (ou após mudança material no schema / pipeline de backup).
