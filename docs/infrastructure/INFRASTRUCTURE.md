# Infraestrutura

> Fontes consolidadas: `docs/07-OPERACAO/ENVIRONMENT.md`, `docs/operations/REDIS_RENDER_SETUP.md`, `docs/operations/STORAGE.md` (pasta antiga, removida após esta consolidação).

Visão geral de onde cada parte do Teglion roda e por quê. Não é um "deploy único" que sobe tudo junto — cada serviço abaixo tem seu próprio provedor, seu próprio ciclo de deploy e suas próprias variáveis de ambiente.

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

API Express rodando como Web Service no Render. Variáveis de ambiente configuradas diretamente no painel do Render (Environment), não em arquivo — produção e staging são serviços Render separados, com nomes de referência como `teglion-api` (produção) e `teglion-api-staging` (staging).

Plano: Render Pro está ativo em produção — o plano gratuito "adormece" o backend depois de um tempo sem tráfego, e a primeira requisição paga o custo de acordar o servidor (vários segundos de latência). Isso deixou de ser aceitável assim que existe mais de um escritório pagante dependendo do sistema estar sempre responsivo.

## Frontend — Vercel

SPA Vite/React. Root directory do projeto Vercel é `frontend` (monorepo — não a raiz do repositório). Build command `npm run build`, output `dist`. Produção e staging são configurados como branches diferentes (`main` e `staging`) apontando, via rewrite condicional por host em `frontend/vercel.json`, para o backend Render correspondente. Detalhe completo do isolamento staging/produção no frontend: [`../infrastructure/DEPLOYMENT.md`](./DEPLOYMENT.md).

## Supabase — banco, autenticação (parcial) e storage

Um projeto Supabase por ambiente (produção e staging são projetos separados — nunca compartilhados). O backend usa a `SUPABASE_SERVICE_ROLE_KEY` para acessar o banco com privilégio administrativo; essa chave nunca vai para o frontend.

**Banco de dados.** Postgres gerenciado. RLS existe em parte do schema como defesa em profundidade, mas o tráfego real do produto passa pelo backend com `service_role` (que contorna RLS) — o isolamento entre escritórios é garantido pelo filtro explícito de `firm_id` no código do backend, não pelo RLS sozinho (ver `docs/architecture/DATA_ARCHITECTURE.md` e `docs/database/RLS.md`).

**Autenticação.** O Teglion **não usa o Supabase Auth**. Login, sessão e registro são geridos pelo backend Express, com JWT em cookies e a tabela `firm_users` como fonte de verdade. O Supabase entra aqui só como banco — armazenar credenciais e sessões, não como provedor de auth. Isso é relevante especialmente para SSO Google: as credenciais OAuth vão no backend Render, nunca no painel Authentication do Supabase (ver `docs/operations/setup/GOOGLE_SSO.md`).

**Storage.** Bucket privado `contabil-documents` no Supabase Storage é o único backend de armazenamento de arquivo ativo (um CDN adicional — Cloudinary — foi removido por não estar em uso).

```
Upload (cliente/escritório)
    → Multer (memória)
    → contabil-storage.service.js
    → Supabase Storage: firm/{firmId}/clients/{clientId}/documents/...
    → Postgres (tabela documents): storage_provider='supabase', storage_key='caminho'
```

Path inclui sempre `firm_id` (e `client_id` quando aplicável) — é o mecanismo de isolamento multi-tenant no storage. RLS do bucket restringe cada escritório a `firm/{seu_id}/...` e cada cliente aos seus próprios arquivos; o download, porém, passa sempre pela API backend, que valida permissão antes de servir o arquivo (nunca é servido direto do Storage). URLs assinadas com TTL configurável cobrem casos como logótipo de escritório e links temporários. Validação de magic bytes confirma o tipo real do arquivo depois do upload, não confia só na extensão.

Variáveis relevantes: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (backend, nunca frontend) e opcionalmente `SUPABASE_STORAGE_BUCKET` (default `contabil-documents`). Migration de referência: `supabase/migrations/20260703000000_storage_contabil_documents.sql`.

Validar bucket e fluxo localmente ou em staging:

```bash
cd backend && npm run storage:validate   # confirma que o bucket existe
cd backend && npm run smoke:pilot        # upload + Brevo + Supabase, fim a fim
```

Health check de produção: `GET /api/public/health/integrations` deve responder `supabaseStorage: ready`.

Código principal: `backend/src/services/storage/contabil-storage.service.js` (upload/download/delete), `backend/src/modules/documents/documents.service.js` (download com permissões), `backend/src/modules/firm/firm-branding.service.js` (logótipo), `backend/src/middlewares/upload.middleware.js` (Multer + magic bytes).

## Redis — cache, rate limit e lock

Usado para rate limit de API, lockout de login e locks/filas. Em produção com **múltiplas instâncias** do backend, Redis ativo é obrigatório — sem ele, cada instância teria seu próprio contador de rate limit em memória, o que quebra a garantia. Com uma única instância, existe fallback in-memory, mas ele não é a configuração recomendada para produção.

Duas opções documentadas:

- **Upstash Redis** — tier gratuito com TLS, funciona bem com o Render sem precisar do add-on Redis pago da própria Render. É a opção recomendada quando o backend ainda está em plano sem Redis dedicado.
- **Redis nativo do Render** — serviço pago, na mesma região da API; usa a Internal URL (mais rápida e privada dentro da rede do Render).

Configuração: variável `REDIS_URL` no ambiente do backend (Render), sempre com TLS (`rediss://`) quando o Redis está fora da rede privada. Guia passo a passo completo, incluindo troubleshooting de fallback silencioso: [`docs/operations/setup/REDIS.md`](../operations/setup/REDIS.md).

## Cloudflare R2 — backup externo do Postgres

Segunda camada de recuperação, independente do backup nativo do Supabase (plano Pro, com PITR conforme configuração do projeto). Um Cron Job no Render (`Dockerfile.backup`) roda `pg_dump -Fc` diariamente, calcula SHA-256, sobe o dump para um bucket privado no Cloudflare R2 (`teglion-backups-prod`) com manifesto JSON, e aplica retenção (14 dias diários, 8 domingos, 12 meses). Falhas reportam para o Sentry quando `SENTRY_DSN` está configurado.

Esse backup externo já foi testado com sucesso: dois drills de restauração completos foram executados em 13/08/2026, com RTO observado de ~1,3 a ~2 minutos, restaurando um dump real num Postgres temporário isolado (nunca em produção ou staging). Detalhe completo, incluindo os registros de cada drill, está em `docs/database/` (migrado de `docs/operations/BACKUP_RESTORE.md`) — essa parte do backup/restore não é responsabilidade desta pasta de infraestrutura, é tratada como tema de segurança/dados.

## O que ainda não existe

- **CDN/WAF na frente do domínio**: Cloudflare completo (WAF, rate limit de borda, Turnstile) já está ativo — não é mais um item pendente, é infraestrutura ligada (ver [`docs/ROADMAP.md`](../ROADMAP.md), Sprint 0 item 8).
- **Réplica externa do Storage**: os documentos vivem só no Supabase Storage, sem cópia no R2 — diferente do banco, que já tem a segunda camada descrita acima. Isso é uma lacuna real, não hipotética.
- **Backend multi-instância validado com Redis dedicado em produção**: a necessidade está documentada, mas confirmar o estado atual (Redis do Render pago vs. Upstash vs. fallback in-memory) exige checar a variável `REDIS_URL` de fato configurada no serviço Render de produção — não dá para confirmar isso só pelo repositório.
