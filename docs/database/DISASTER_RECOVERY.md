# Recuperação de desastre

> Juntei aqui o que já tinha em `docs/06-SEGURANCA/DISASTER-RECOVERY.md` (12/08/2026) e a parte de disaster recovery de `docs/operations/BACKUP_RESTORE.md`. Corrigi em relação à versão de 12/08: naquela data a resposta era "nunca foi testado". Hoje já fiz dois drills reais de restauração, em 13/08/2026, com resultado, timestamp e RTO que observei — registrei tudo abaixo. O que continua pendente é diferente: formalizar RPO/RTO como meta e definir uma cadência de repetição do teste (ver [`ROADMAP.md`](../ROADMAP.md), item 0.7).

A pergunta que quero responder aqui pra mim mesmo: **se o banco de dados de produção desaparecer amanhã, eu consigo recuperar?**

## Estado real

**Sim, com um caminho que já testei e validei duas vezes** — não é mais uma suposição minha. Em 13/08/2026, baixei um dump real do backup diário (Postgres → R2, ver [BACKUPS.md](./BACKUPS.md)), verifiquei por checksum, e restaurei com sucesso em dois drills separados, num Postgres temporário isolado de produção. As tabelas de negócio vieram íntegras nos dois casos.

O que **ainda não tenho** é um RPO/RTO formalmente definido como meta (compromisso que eu ainda preciso assumir sobre quanto dado posso perder e quanto tempo posso ficar fora do ar), e uma cadência definida de repetição do drill. Isso é diferente de "nunca testei" — é "já testei, sei que funciona na prática, falta eu formalizar o alvo e a repetição". Ver [`ROADMAP.md`](../ROADMAP.md), item 0.7.

## RPO / RTO — o que observei no drill vs. o alvo formal que ainda falta

Não posso confundir as duas colunas abaixo. Uma é o que aconteceu de fato nas duas vezes em que testei; a outra é uma meta que ainda não defini formalmente.

| Métrica | Observado no drill de 13/08 | Alvo formal |
|---|---|---|
| **RTO** (tempo até recuperar) | Drill 1: **~2 min**. Drill 2: **~1,3 min**. Tempo desde o download do dump no R2 até o smoke test verde no Postgres temporário, com Docker Desktop já disponível localmente. | **A validar** — ainda não defini. Não posso confundir com o RTO observado: um restore em produção real, sem Docker já rodando, com volume de dado maior, ou pra um destino gerenciado (não Docker local), pode levar mais tempo. |
| **RPO** (quanto dado se pode perder) | Não testei isso diretamente por um drill de restore — RPO é uma função da cadência de backup, não do tempo de restauração. Com backup diário às 03:00 UTC, o pior caso teórico é **~24h** de dado perdido desde o último `SUCCESS`. | **A validar** — ainda não defini como meta formal. O valor de "≤24h" é uma decorrência da cadência atual, não uma decisão consciente minha de que 24h é aceitável. |

## Procedimento de restore (validei nos dois drills)

Esse é o procedimento que segui pra validar um dump do R2 **sem tocar em produção** — foi o que fiz nos dois drills abaixo.

### Pré-requisitos

- Credenciais R2 (leitura) num ambiente local/seguro — **nunca** no Git.
- `pg_restore` e `psql` instalados (ou a imagem `Dockerfile.backup`).
- Postgres **temporário** (Docker local, projeto Supabase de staging, ou VM). **Proibido** apontar pra produção.

### 1. Listar e escolher objeto

No Cloudflare R2 → bucket `teglion-backups-prod` → `postgresql/daily/...`. Anoto a chave do dump (ex. `postgresql/daily/2026/08/2026-08-13-030000.dump`) e o manifesto correspondente em `postgresql/manifests/...`.

### 2. Download

```bash
aws s3 cp "s3://teglion-backups-prod/postgresql/daily/YYYY/MM/FILE.dump" ./restore.dump \
  --endpoint-url "https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com"

aws s3 cp "s3://teglion-backups-prod/postgresql/manifests/YYYY/MM/FILE.json" ./restore.json \
  --endpoint-url "https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com"
```

### 3. Verificar SHA-256

```bash
node -e "const fs=require('fs');const c=require('crypto');const m=JSON.parse(fs.readFileSync('restore.json','utf8'));const h=c.createHash('sha256').update(fs.readFileSync('restore.dump')).digest('hex'); if(h!==m.sha256){console.error('MISMATCH',h,m.sha256);process.exit(1)}; console.log('OK',h);"
```

Se falhar: **não restauro**. Vou investigar upload/corrupção.

### 4. Postgres temporário

```bash
docker run --name teglion-restore-tmp -e POSTGRES_PASSWORD=tmp -p 55432:5432 -d postgres:17
export RESTORE_DATABASE_URL='postgresql://postgres:tmp@127.0.0.1:55432/postgres'
```

### 5. `pg_restore`

```bash
pg_restore --no-owner --no-acl -d "$RESTORE_DATABASE_URL" ./restore.dump
```

Erros de "role does not exist" / ACL são esperados com `--no-owner --no-acl` em ambiente limpo; falhas fatais de schema eu preciso investigar.

### 6. Smoke test (mínimo)

```sql
SELECT count(*) AS firms FROM public.firms;
SELECT count(*) AS clients FROM public.clients;
SELECT count(*) AS firm_users FROM public.firm_users;
SELECT count(*) AS services FROM public.accounting_services;
SELECT count(*) AS consultations FROM public.consultations;
SELECT count(*) AS documents FROM public.documents;
SELECT count(*) AS refresh_sessions FROM public.auth_refresh_sessions;
```

Ajusto os nomes se alguma tabela não existir no dump. O objetivo é confirmar que o dump abre e as tabelas críticas de negócio estão presentes.

### 7. Limpeza

```bash
docker rm -f teglion-restore-tmp
rm -f ./restore.dump ./restore.json
```

### O que eu NÃO faço

- Restaurar por cima do banco de produção.
- Expor o dump em bucket público / `r2.dev`.
- Colar `BACKUP_DATABASE_URL` ou tokens R2 em tickets/Slack sem redação.
- Assumir que o histórico de migrations do Git bate 100% com o dump — ver a lacuna que documentei em [`MIGRATIONS.md`](./MIGRATIONS.md).

## Registro dos dois drills que fiz

### Drill 1 — 2026-08-13 (Sprint 0, referência)

| Campo | Valor |
|---|---|
| Data/hora UTC | 2026-08-13 ~13:16–13:18 UTC |
| Object key | `postgresql/daily/2026/08/2026-08-13-131519.dump` |
| Manifest SHA-256 | `965f8737dbb52610e5dad0ecc1a4b9b2e0b2978ffb0aaf6c3efd205dd1777bad` (match OK) |
| Destino | Docker local `postgres:17` (`teglion-restore-tmp`, porta `55432`) — **não** produção |
| RTO observado | ~2 min (download R2 ~1,4 s + pull/start Postgres 17 + `pg_restore` + smoke) |
| Smoke | PASS — `firms=2`, `clients=39`, `firm_users=5`, `accounting_services=21`, `consultations=2`, `documents=0`, `auth_refresh_sessions=77` |
| Anomalias | `pg_restore` reporta erros esperados em schemas/extensões Supabase (`auth`, `storage`, `supabase_vault`, etc.) ao restaurar num Postgres vanilla; tabelas `public` de negócio OK. Usei `--no-owner --no-acl`. |

### Drill 2 — 2026-08-13 (Sprint 0, item 3 — fecho formal)

Pedi o backup operacional real: `2026-08-13-130155.dump` (não artificial).

| Campo | Valor |
|---|---|
| Data/hora UTC | 2026-08-13 ~15:02–15:08 UTC |
| Object key | `postgresql/daily/2026/08/2026-08-13-130155.dump` |
| Manifest | `postgresql/manifests/2026/08/2026-08-13-130155.json` (`status=SUCCESS`, `createdAt=2026-08-13T13:01:55.123Z`, size `641713` bytes) |
| SHA-256 | `a5588154a5e78b28cb49ed4d06bcbc235136cbd52a125f3790e345842bcd1040` — manifesto vs. arquivo **MATCH OK** |
| Destino | Docker local `postgres:17.10` (`teglion-restore-tmp`, porta `55432`, volume `teglion_restore_tmp_data`) — **não** produção / **não** staging Supabase |
| `pg_restore` | `--no-owner --no-acl`; exit não-zero esperado por extensão `supabase_vault` ausente no Postgres vanilla (`errors ignored: 3`) |
| RTO observado | **~1,3 min** com Docker Desktop já disponível: download R2 ~2 s + start/ready Postgres ~2–4 s + `pg_restore` ~2 s + smoke ~0,2 s. *(Se o daemon Docker estiver parado, o tempo até o socket fica fora do RTO do procedimento e depende da máquina.)* |
| Smoke | **PASS** — PG `17.10`; tabelas `public`=`58`; PKs=`58`; FKs=`142`; colunas `firm_id`=`50`; índices com `firm_id`=`89`; RLS ON=`58` |
| Contagens | `firms=2`, `clients=39`, `firm_users=5`, `documents=0`, `consultations=2`, `accounting_services=21`, `auth_refresh_sessions=76`, `conversations=3`, `document_requests=0`, `messages=0`, `obligations=0`, `service_requests=0` |
| Firms presentes | `LLCNunes` (`llcnunes`), `MayaContabilista` (`jaelson`) — dados de negócio do dump real; **não** modifiquei nada |
| Ausências esperadas | tabela `public.tasks` **não** existe nesse schema (o modelo usa outras entidades) |
| Limpeza | removi container + volume; apaguei dump/manifesto locais de `/tmp`; nada commitado no Git |

**Cadência que recomendo pra mim mesmo** (ainda não formalizei como política): repetir este drill pelo menos trimestralmente, ou depois de mudança material no schema ou no pipeline de backup. Formalizar isso é o item 0.7 do [`ROADMAP.md`](../ROADMAP.md).

## O que ainda falta pra eu ter um plano de recuperação de desastre completo

Com os dois drills feitos, o que resta é menor do que parecia em 12/08/2026, mas é real:

- **RPO-alvo formal** — quanto dado, no máximo, eu aceito perder num incidente. Hoje só tenho o valor implícito da cadência de backup (~24h), não uma decisão consciente que eu tenha tomado.
- **RTO-alvo formal** — quanto tempo, no máximo, o produto pode ficar fora do ar até eu recuperar. Hoje só tenho os RTOs que observei nos dois drills (~1,3–2 min), medidos num ambiente de teste favorável (Docker já rodando, volume de dado pequeno) — não necessariamente o que aconteceria com o banco de produção real fora do ar.
- **Cadência de repetição do drill** — sem isso, a validação de 13/08 vai ficando mais velha e menos representativa do estado atual do schema e do volume de dado.
- **Runbook de incidente dedicado a "banco de produção sumiu"** — quem faz o quê, em que ordem, com qual credencial, quando é uma emergência real (não um drill planejado). O procedimento de restore acima cobre o *como* tecnicamente; não cobre decisão, comunicação e responsabilidade num incidente ao vivo.

## Por que isso importa tanto pra mim

Vender assinatura para múltiplos escritórios é assumir responsabilidade pelos dados fiscais e de cliente de cada um deles. Foi por isso que tratei "testar a restauração" como prioridade máxima no Sprint 0, antes de qualquer trabalho de produto novo — e por isso que, mesmo com os dois drills já feitos, formalizar RPO/RTO e a cadência de repetição continua como item de prioridade P1 no meu roadmap, não como algo encerrado.
