# Ambientes

> Fontes consolidadas: `docs/07-OPERACAO/ENVIRONMENT.md`, `docs/operations/DEV_LOCAL.md` (pasta antiga, removida após esta consolidação).

Três ambientes: desenvolvimento local, staging e produção. Cada um tem projeto Supabase, serviço Render e configuração Vercel próprios — nunca compartilhados entre si. O detalhe de como o deploy move código entre eles está em [`DEPLOYMENT.md`](./DEPLOYMENT.md); este documento cobre como cada ambiente é configurado e no que eles diferem.

## Desenvolvimento local

| Serviço | URL |
|---------|-----|
| Frontend | `http://localhost:3000` |
| Backend | `http://localhost:8001/api` |
| Supabase | Cloud — não roda localmente, aponta para um projeto Supabase real (staging, nunca produção) |

O Vite faz proxy de `/api` para `http://localhost:8001`.

### Setup

```bash
# Backend — copiar backend/.env.example para backend/.env.local e preencher
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev
```

Migrations num projeto Supabase já existente: `supabase db push`. Num banco novo, aplicar em ordem: `supabase/schema.sql` → `tables.sql` → `indexes.sql` → `rls.sql` → `policies.sql`, depois `supabase/migrations/*.sql`, depois `supabase db push`. Validar o bucket de storage com `cd backend && npm run storage:validate`.

Smoke test local:

```bash
cd backend && npm run smoke:pilot
# Ou explicitamente contra a API local:
API_BASE=http://localhost:8001 npm run smoke:pilot
```

Testes antes de abrir PR:

```bash
cd frontend && npx tsc --noEmit && npm run build
cd backend && npm run test:unit
```

### Problemas comuns

| Sintoma | Causa/solução |
|---------|----------------|
| CORS ou API retornando HTML | Backend não está rodando na porta 8001 |
| 429 / logout inesperado | Rate limit — evitar muitas abas simultâneas; confirmar que backend e frontend estão na mesma versão |
| Link de email aponta para lugar errado | `FRONTEND_URL=http://localhost:3000` ausente em `.env.local` |
| Upload falha | Migration de storage (`20260703000000_storage_contabil_documents.sql`) não aplicada nesse projeto Supabase |

## Categorias de variável de ambiente

Sem listar valor real de nenhum segredo em documentação — de propósito. O que existe, por categoria:

- **Banco e storage**: credenciais de conexão ao Supabase, incluindo a chave de acesso administrativo (`SUPABASE_SERVICE_ROLE_KEY`) que o backend usa para tudo — banco, RLS bypass e storage.
- **Autenticação**: segredos usados para assinar e validar os tokens de sessão (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`).
- **Criptografia de dado sensível**: `DATA_ENCRYPTION_KEY`, usada para cifrar campos específicos em banco — por exemplo, tokens de integração Google armazenados em `firm_google_calendar_connections`.
- **Email (Brevo)**: chave de API do provedor de envio transacional (`BREVO_API_KEY`).
- **Pagamento (Stripe)**: chave da conta da plataforma e segredo de verificação de webhook — **separados** para o billing do Teglion (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) e para o Stripe Connect (`STRIPE_CONNECT_WEBHOOK_SECRET`). São dois webhooks distintos com duas variáveis de segredo distintas — nunca reutilizar uma para a outra.
- **Cache e limitação de taxa (Redis)**: `REDIS_URL`.
- **Integração Google**: `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` para SSO e Calendar, `GOOGLE_PICKER_API_KEY` para o Drive Picker.
- **Observabilidade**: `SENTRY_DSN` — hoje **opcional** na inicialização do backend, o que é em si um risco documentado em [`OBSERVABILITY.md`](./OBSERVABILITY.md).

## Onde configurar de verdade

Produção e staging usam as variáveis de ambiente configuradas diretamente no painel do Render (backend) e da Vercel (frontend) — nunca um arquivo `.env` versionado. Um `backend/.env.example` (e equivalente no frontend) existe no repositório sem valor real, servindo só de referência de quais variáveis existem — não de onde os valores reais vivem.

## O lembrete mais importante sobre segredos

A rotação de segredos de produção — item do Sprint 0 (ver [`docs/ROADMAP.md`](../ROADMAP.md), item 0.5) — já foi concluída: as chaves reais (Stripe, Supabase, JWT, Brevo, Google, Redis) foram trocadas depois de terem ficado tempo demais em arquivos locais de desenvolvedor. A regra daqui para frente continua simples: valor de produção nunca deveria estar num ambiente de desenvolvedor. Para desenvolvimento local, usar sempre valor de teste — mesmo que copiar o valor real pareça mais rápido no momento.

## Diferenças entre staging e produção

Staging e produção são isolados por design — projeto Supabase próprio, serviço Render próprio, projeto/domínio Vercel próprio, chaves Stripe de teste (staging) vs. live (produção), e nunca reaproveitar `JWT_*_SECRET` nem `SUPABASE_SERVICE_ROLE_KEY` entre os dois. O detalhe de configuração de cada variável por ambiente (URLs, redirect URIs, `COOKIE_DOMAIN`) está em [`DEPLOYMENT.md`](./DEPLOYMENT.md), porque é conteúdo de deploy, não de definição do ambiente em si.
