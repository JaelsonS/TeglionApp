# Segurança — visão geral

> **Fontes que consolidei neste documento:** `docs/06-SEGURANCA/SECURITY.md`, `docs/06-SEGURANCA/MULTI-TENANT-SECURITY.md`, `docs/06-SEGURANCA/SECURITY-GATES.md`, `docs/security/TEGLION_SECURITY_GATE.md` (arquivos que removi depois desta migração, 19/08/2026). Verificação de código extra que fiz durante essa reescrita: `backend/src/modules/firm/team.service.js`, `backend/src/services/tracking/view-tracking.service.js`, `.github/workflows/ci.yml`.

Este documento é o ponto de entrada da minha pasta `security/`. Aqui eu resumo a postura de segurança do Teglion e aponto pra onde cada assunto está tratado em detalhe — não repito o conteúdo dos outros arquivos:

- [`AUTHENTICATION.md`](./AUTHENTICATION.md) — login, sessão, JWT em cookie, senha, bloqueio de força bruta.
- [`AUTHORIZATION.md`](./AUTHORIZATION.md) — papéis, permissões, e o achado de escalação de privilégio (SEC-H1).
- [`TENANT_ISOLATION.md`](./TENANT_ISOLATION.md) — como o isolamento entre escritórios funciona de verdade, o que testa isso, e o risco conhecido que ainda está em aberto.
- [`DATA_PROTECTION.md`](./DATA_PROTECTION.md) — dados em repouso e em trânsito, gestão de segredos, lacuna de LGPD/GDPR.
- [`SECURITY_TESTING.md`](./SECURITY_TESTING.md) — o que roda automaticamente, o que é manual, o que ainda falta.
- [`INCIDENT_RESPONSE.md`](./INCIDENT_RESPONSE.md) — o que já tenho hoje pra responder a um incidente de segurança, e o que ainda preciso formalizar.

Pra backup e recuperação de desastre, ver `database/BACKUPS.md` e `database/DISASTER_RECOVERY.md`.

## Regra de honestidade que eu sigo neste documento

Cada afirmação abaixo carrega um destes rótulos: `IMPLEMENTADO` (verifiquei em código, com evidência), `PARCIAL` (existe, mas está incompleto ou sem cobertura total), `A VALIDAR` (tenho indício, mas falta eu confirmar direto — pentest, teste HTTP real, ou revisão independente) ou `NÃO IMPLEMENTADO`. Quando a evidência vem de uma auditoria anterior, cito a data dela; quando verifiquei durante esta reescrita (19/08/2026), digo isso explicitamente também.

## O que já está bem implementado, com evidência

**CSRF — `IMPLEMENTADO`.** Tenho proteção double-submit com comparação de tempo constante (`timingSafeEqual`) entre cookie e header, aplicada globalmente, com lista restrita de exceções (rotas públicas e webhooks). Verifiquei isso lendo o código na auditoria de 12/08/2026.

**CORS — `IMPLEMENTADO`.** Allowlist estrita por ambiente. Em produção, sem wildcard — só as origens `https://` que eu liberei explicitamente.

**Cabeçalhos de segurança — `IMPLEMENTADO`.** Uso Helmet no backend; no frontend, tenho HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, e CSP com hash `sha256` no `script-src` (nada de `unsafe-inline`).

**Proteção contra acesso cruzado a recurso (IDOR/BOLA) — `IMPLEMENTADO`, com uma exceção que eu já conheço.** Nos módulos que verifiquei (documentos, tarefas, mensagens, clientes, obrigações, consultas, pedidos de serviço, leads, alertas), toda busca por ID combina o ID do recurso com o `firm_id` do usuário autenticado, retornando 404 genérico quando alguém tenta cruzar. A exceção que já conheço — leitura de contador de visualização sem filtro de `firm_id` — está detalhada em [`TENANT_ISOLATION.md`](./TENANT_ISOLATION.md) e eu já registrei como item P0 no [`ROADMAP.md`](../ROADMAP.md#01--corrigir-vazamento-cross-tenant-que-eu-confirmei-no-rastreamento-de-visualizações).

**Webhook do Stripe — `IMPLEMENTADO`.** A assinatura é verificada antes de processar qualquer evento (`constructEvent`, 400 sem assinatura válida), com proteção contra reprocessamento por constraint única no banco (`event_id`) — não só uma checagem em memória.

**Autenticação e autorização** — cobri isso em detalhe em documentos próprios; ver [`AUTHENTICATION.md`](./AUTHENTICATION.md) e [`AUTHORIZATION.md`](./AUTHORIZATION.md).

## Riscos residuais que eu já conheço

**O isolamento entre escritórios depende de disciplina de código minha, não de uma barreira do banco de dados por si só.** O backend acessa o Supabase com uma chave (`service_role`) que ignora Row Level Security. A fronteira real é o filtro `firm_id` que eu aplico manualmente em cada consulta da camada de repositórios. É uma decisão de arquitetura que tomei conscientemente e que defendo, mas não posso descrever isso como "o banco protege" — quem protege é a aplicação, com RLS como segunda camada em pontos específicos. Detalhe completo, incluindo o teste que comprova isso e a falha que ainda está aberta hoje, em [`TENANT_ISOLATION.md`](./TENANT_ISOLATION.md).

**Vazamento cross-tenant confirmado no rastreamento de visualizações — risco real, que estou corrigindo.** Duas leituras em `backend/src/services/tracking/view-tracking.service.js` filtram só por `id`, sem `firm_id`. Um usuário CLIENT de um escritório que descubra o UUID de um documento ou obrigação de outro escritório consegue ler `view_count`/`lastViewedAt` desse recurso. Registrei isso como item P0 (0.1) no [`ROADMAP.md`](../ROADMAP.md). Detalhe técnico em [`TENANT_ISOLATION.md`](./TENANT_ISOLATION.md).

**Sanitização de log é inconsistente — `PARCIAL`.** Tenho uma função que remove informação sensível antes de logar (uso ela no tratamento central de erro e no serviço de auditoria de segurança — ver `security-audit.service.js`, que já redige campos como `password`, `token`, `nif`), mas dezenas de chamadas de log espalhadas pelo código ainda não passam por ela.

**Monitoramento de erro é opcional na inicialização — `PARCIAL`.** O sistema sobe em produção mesmo sem eu ter definido a chave de configuração do Sentry — silenciosamente, sem travar o processo, mas também sem me avisar que a proteção não está ativa.

**LGPD/GDPR — `NÃO IMPLEMENTADO`.** Ainda não tenho exportação de dados pessoais nem apagamento efetivo — só arquivamento/soft-delete. Detalhe em [`DATA_PROTECTION.md`](./DATA_PROTECTION.md).

## Um achado que corrigi durante esta revisão (19/08/2026)

Dois "gaps conhecidos" que eu tinha registrado nos documentos antigos (`docs/04-ARQUITETURA/AUTH.md` e `docs/06-SEGURANCA/MULTI-TENANT-SECURITY.md`, ambos de 12/08) eu verifiquei de novo lendo o código direto nesta reescrita e **já estão corrigidos**, com teste automatizado passando:

1. Sessão de funcionário desativado não era revogada — corrigi isso (commit `f1c3121`, `deactivateMember` em `team.service.js` agora chama `authRefreshSessionsRepository.deleteAllForActor`).
2. Escalação de STAFF a FIRM_OWNER via `PATCH /team/:id` (achado SEC-H1 de `docs/FASE-1-PRODUCT-AUDIT.md`) — corrigi também (mesmo commit, guarda `assertActorCanAssignRole`).

Detalhe completo, com evidência de teste e uma nota sobre uma divergência que encontrei (e já corrigi) com `docs/ROADMAP.md`, em [`AUTHENTICATION.md`](./AUTHENTICATION.md) e [`AUTHORIZATION.md`](./AUTHORIZATION.md).

## O que eu não verifiquei nesta revisão

Compliance formal (termos de uso, política de privacidade, requisitos legais específicos de Portugal como o Livro de Reclamações, ou de LGPD para a expansão ao Brasil) não entrou no escopo desta rodada — não vou presumir que está adequado só porque não listei como risco aqui. Testes de penetração HTTP reais (Burp) contra a superfície pública ainda não rodei — ver [`SECURITY_TESTING.md`](./SECURITY_TESTING.md).
