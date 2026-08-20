# Infraestrutura

> Fontes consolidadas: `docs/07-OPERACAO/ENVIRONMENT.md`, `docs/operations/REDIS_RENDER_SETUP.md`, `docs/operations/STORAGE.md` (pasta antiga, removida após esta consolidação).

Aqui registro onde cada parte do Teglion roda e por quê, pra eu não ter que redescobrir isso da próxima vez. Não é um "deploy único" que sobe tudo junto — montei cada serviço abaixo com seu próprio provedor, seu próprio ciclo de deploy e suas próprias variáveis de ambiente.

## Onde cada parte roda

| Camada | Provedor | O que roda lá |
|--------|----------|----------------|
| Frontend | Vercel | SPA React/Vite, build estático servido via CDN |
| Backend | Render | API Express (Node.js), Web Service |
| Banco de dados | Supabase (Postgres) | Todas as tabelas do produto, RLS como defesa em profundidade |
| Autenticação | Backend próprio (não é Supabase Auth) | JWT em cookies, tabela `firm_users` — ver os guias de SSO em [`docs/operations/setup/`](../operations/setup/GOOGLE_SSO.md) |
| Storage de arquivos | Supabase Storage | Bucket privado `contabil-documents` |
| Cache / rate limit | Redis (Upstash ou Redis do Render) | Rate limit, lockout de login, filas |
| Backup externo | Cloudflare R2 | Cópia diária do dump Postgres, independente do backup nativo do Supabase |

## Backend — Render

API Express rodando como Web Service no Render. Configuro as variáveis de ambiente direto no painel do Render (Environment), não em arquivo — produção e staging são serviços Render separados, que nomeei `teglion-api` (produção) e `teglion-api-staging` (staging).

Plano: ativei o Render Pro em produção — o plano gratuito "adormece" o backend depois de um tempo sem tráfego, e a primeira requisição paga o custo de acordar o servidor (vários segundos de latência). Isso deixou de ser aceitável assim que passei a ter mais de um escritório pagante dependendo do sistema estar sempre responsivo.

## Frontend — Vercel

SPA Vite/React. Configurei o Root directory do projeto Vercel como `frontend` (monorepo — não a raiz do repositório). Build command `npm run build`, output `dist`. Deixei produção e staging configurados como branches diferentes (`main` e `staging`), apontando, via rewrite condicional por host em `frontend/vercel.json`, para o backend Render correspondente. O detalhe completo de como isolei staging de produção no frontend está em [`../infrastructure/DEPLOYMENT.md`](./DEPLOYMENT.md).

## Supabase — banco, autenticação (parcial) e storage

Uso um projeto Supabase por ambiente (produção e staging são projetos separados — nunca compartilho entre si). O backend usa a `SUPABASE_SERVICE_ROLE_KEY` pra acessar o banco com privilégio administrativo; essa chave nunca vai pro frontend.

**Banco de dados.** Postgres gerenciado. Tenho RLS em parte do schema como defesa em profundidade, mas o tráfego real do produto passa pelo backend com `service_role` (que contorna RLS) — garanto o isolamento entre escritórios pelo filtro explícito de `firm_id` no código do backend, não pelo RLS sozinho (ver `docs/architecture/DATA_ARCHITECTURE.md` e `docs/database/RLS.md`).

**Autenticação.** Decidi não usar o Supabase Auth no Teglion. Login, sessão e registro são geridos pelo meu backend Express, com JWT em cookies e a tabela `firm_users` como fonte de verdade. O Supabase entra aqui só como banco — guardo credenciais e sessões nele, não uso como provedor de auth. Isso importa especialmente pro SSO Google: coloco as credenciais OAuth no backend Render, nunca no painel Authentication do Supabase (ver `docs/operations/setup/GOOGLE_SSO.md`).

**Storage.** O bucket privado `contabil-documents` no Supabase Storage é o único backend de armazenamento de arquivo que mantenho ativo (removi um CDN adicional — Cloudinary — porque não estava em uso).

```
Upload (cliente/escritório)
    → Multer (memória)
    → contabil-storage.service.js
    → Supabase Storage: firm/{firmId}/clients/{clientId}/documents/...
    → Postgres (tabela documents): storage_provider='supabase', storage_key='caminho'
```

O path sempre inclui `firm_id` (e `client_id` quando aplicável) — é o mecanismo que uso pra isolamento multi-tenant no storage. A RLS do bucket restringe cada escritório a `firm/{seu_id}/...` e cada cliente aos seus próprios arquivos; o download, porém, faço sempre passar pela API backend, que valida permissão antes de servir o arquivo (nunca sirvo direto do Storage). Uso URLs assinadas com TTL configurável pra casos como logótipo de escritório e links temporários. Também valido magic bytes pra confirmar o tipo real do arquivo depois do upload — não confio só na extensão.

Variáveis relevantes: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (backend, nunca frontend) e opcionalmente `SUPABASE_STORAGE_BUCKET` (default `contabil-documents`). Migration de referência: `supabase/migrations/20260703000000_storage_contabil_documents.sql`.

Pra validar bucket e fluxo localmente ou em staging, rodo:

```bash
cd backend && npm run storage:validate   # confirma que o bucket existe
cd backend && npm run smoke:pilot        # upload + Brevo + Supabase, fim a fim
```

Health check de produção: `GET /api/public/health/integrations` deve responder `supabaseStorage: ready`.

Código principal: `backend/src/services/storage/contabil-storage.service.js` (upload/download/delete), `backend/src/modules/documents/documents.service.js` (download com permissões), `backend/src/modules/firm/firm-branding.service.js` (logótipo), `backend/src/middlewares/upload.middleware.js` (Multer + magic bytes).

## Redis — cache, rate limit e lock

Uso Redis pra rate limit de API, lockout de login e locks/filas. Em produção com **múltiplas instâncias** do backend, manter Redis ativo é obrigatório pra mim — sem ele, cada instância teria seu próprio contador de rate limit em memória, o que quebra a garantia. Com uma única instância, existe fallback in-memory, mas não é a configuração que uso em produção.

Deixei duas opções documentadas:

- **Upstash Redis** — tier gratuito com TLS, funciona bem com o Render sem eu precisar do add-on Redis pago da própria Render. É a opção que escolho quando o backend ainda está em plano sem Redis dedicado.
- **Redis nativo do Render** — serviço pago, na mesma região da API; uso a Internal URL (mais rápida e privada dentro da rede do Render).

Configuração: variável `REDIS_URL` no ambiente do backend (Render), sempre com TLS (`rediss://`) quando o Redis está fora da rede privada. Guia passo a passo completo, incluindo troubleshooting de fallback silencioso, deixei em [`docs/operations/setup/REDIS.md`](../operations/setup/REDIS.md).

## Cloudflare R2 — backup externo do Postgres

Uso isso como segunda camada de recuperação, independente do backup nativo do Supabase (plano Pro, com PITR conforme configuração do projeto). Um Cron Job no Render (`Dockerfile.backup`) roda `pg_dump -Fc` diariamente, calcula SHA-256, sobe o dump pra um bucket privado no Cloudflare R2 (`teglion-backups-prod`) com manifesto JSON, e aplica a retenção que defini (14 dias diários, 8 domingos, 12 meses). Falhas reportam pro Sentry quando `SENTRY_DSN` está configurado.

Já testei esse backup externo com sucesso: rodei dois drills de restauração completos em 13/08/2026, com RTO observado de ~1,3 a ~2 minutos, restaurando um dump real num Postgres temporário isolado (nunca em produção ou staging). O detalhe completo, incluindo os registros de cada drill, está em `docs/database/` (migrado de `docs/operations/BACKUP_RESTORE.md`) — trato essa parte de backup/restore como tema de segurança/dados, não como responsabilidade desta pasta de infraestrutura.

## O que ainda não existe

- **CDN/WAF na frente do domínio**: já deixei o Cloudflare completo ativo (WAF, rate limit de borda, Turnstile) — não é mais um item pendente pra mim, é infraestrutura ligada (ver [`docs/ROADMAP.md`](../ROADMAP.md), Sprint 0 item 8).
- **Réplica externa do Storage**: os documentos vivem só no Supabase Storage, sem cópia no R2 — diferente do banco, que já tem a segunda camada descrita acima. Essa é uma lacuna real que ainda tenho, não hipotética.
- **Backend multi-instância validado com Redis dedicado em produção**: já documentei a necessidade, mas pra confirmar o estado atual (Redis do Render pago vs. Upstash vs. fallback in-memory) eu preciso checar a variável `REDIS_URL` de fato configurada no serviço Render de produção — não dá pra confirmar isso só pelo repositório.
