# Segurança — visão geral

> **Fontes consolidadas neste documento:** `docs/06-SEGURANCA/SECURITY.md`, `docs/06-SEGURANCA/MULTI-TENANT-SECURITY.md`, `docs/06-SEGURANCA/SECURITY-GATES.md`, `docs/security/TEGLION_SECURITY_GATE.md` (arquivos removidos após esta migração, 19/08/2026). Verificação de código adicional feita durante esta reescrita: `backend/src/modules/firm/team.service.js`, `backend/src/services/tracking/view-tracking.service.js`, `.github/workflows/ci.yml`.

Este documento é o ponto de entrada da pasta `security/`. Ele resume a postura de segurança do Teglion e aponta para onde cada assunto é tratado em detalhe — não repete o conteúdo dos outros arquivos:

- [`AUTHENTICATION.md`](./AUTHENTICATION.md) — login, sessão, JWT em cookie, senha, bloqueio de força bruta.
- [`AUTHORIZATION.md`](./AUTHORIZATION.md) — papéis, permissões, e o achado de escalação de privilégio (SEC-H1).
- [`TENANT_ISOLATION.md`](./TENANT_ISOLATION.md) — como o isolamento entre escritórios funciona de verdade, o que testa isso, e o risco conhecido em aberto.
- [`DATA_PROTECTION.md`](./DATA_PROTECTION.md) — dados em repouso e em trânsito, gestão de segredos, lacuna de LGPD/GDPR.
- [`SECURITY_TESTING.md`](./SECURITY_TESTING.md) — o que roda automaticamente, o que é manual, o que ainda falta.
- [`INCIDENT_RESPONSE.md`](./INCIDENT_RESPONSE.md) — o que existe hoje para responder a um incidente de segurança, e o que falta formalizar.

Para backup e recuperação de desastre, ver `database/BACKUPS.md` e `database/DISASTER_RECOVERY.md`.

## Regra de honestidade deste documento

Cada afirmação abaixo carrega um destes rótulos: `IMPLEMENTADO` (verificado em código, com evidência), `PARCIAL` (existe, mas incompleto ou sem cobertura total), `A VALIDAR` (existe indício, mas falta confirmação direta — pentest, teste HTTP real, ou revisão independente) ou `NÃO IMPLEMENTADO`. Quando a evidência é uma auditoria anterior, a data dela é citada; quando a verificação foi feita nesta reescrita (19/08/2026), isso também é dito explicitamente.

## O que está bem implementado, com evidência

**CSRF — `IMPLEMENTADO`.** Proteção double-submit com comparação de tempo constante (`timingSafeEqual`) entre cookie e header, aplicada globalmente, com lista restrita de exceções (rotas públicas e webhooks). Verificado por leitura de código na auditoria de 12/08/2026.

**CORS — `IMPLEMENTADO`.** Allowlist estrita por ambiente. Em produção, sem wildcard — só origens `https://` explicitamente permitidas.

**Cabeçalhos de segurança — `IMPLEMENTADO`.** Helmet no backend; no frontend, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, e CSP com hash `sha256` no `script-src` (não `unsafe-inline`).

**Proteção contra acesso cruzado a recurso (IDOR/BOLA) — `IMPLEMENTADO`, com uma exceção conhecida.** Nos módulos verificados (documentos, tarefas, mensagens, clientes, obrigações, consultas, pedidos de serviço, leads, alertas), toda busca por ID combina o ID do recurso com o `firm_id` do usuário autenticado, retornando 404 genérico em caso de tentativa cruzada. A exceção conhecida — leitura de contador de visualização sem filtro de `firm_id` — está detalhada em [`TENANT_ISOLATION.md`](./TENANT_ISOLATION.md) e é tratada como item P0 no [`ROADMAP.md`](../ROADMAP.md#01--corrigir-vazamento-cross-tenant-confirmado-no-rastreamento-de-visualizações).

**Webhook do Stripe — `IMPLEMENTADO`.** Assinatura verificada antes de processar qualquer evento (`constructEvent`, 400 sem assinatura válida), com proteção contra reprocessamento por constraint única no banco (`event_id`), não só checagem em memória.

**Autenticação e autorização** — cobertas em detalhe em documentos próprios; ver [`AUTHENTICATION.md`](./AUTHENTICATION.md) e [`AUTHORIZATION.md`](./AUTHORIZATION.md).

## Riscos residuais conhecidos

**Isolamento entre escritórios depende de disciplina de código, não de uma barreira do banco de dados por si só.** O backend acessa o Supabase com uma chave (`service_role`) que ignora Row Level Security. A fronteira real é o filtro `firm_id` aplicado manualmente em cada consulta da camada de repositórios. É uma decisão de arquitetura válida e defensável, mas não pode ser descrita como "o banco protege isso" — é a aplicação que protege, com RLS como segunda camada em pontos específicos. Detalhe completo, incluindo o teste que comprova isso e a falha conhecida hoje aberta, em [`TENANT_ISOLATION.md`](./TENANT_ISOLATION.md).

**Vazamento cross-tenant confirmado no rastreamento de visualizações — risco real, em correção.** Duas leituras em `backend/src/services/tracking/view-tracking.service.js` filtram só por `id`, sem `firm_id`. Um usuário CLIENT de um escritório que descubra o UUID de um documento ou obrigação de outro escritório consegue ler `view_count`/`lastViewedAt` desse recurso. Registrado como item P0 (0.1) no [`ROADMAP.md`](../ROADMAP.md). Ver detalhe técnico em [`TENANT_ISOLATION.md`](./TENANT_ISOLATION.md).

**Sanitização de log é inconsistente — `PARCIAL`.** Existe uma função que remove informação sensível antes de logar (usada no tratamento central de erro e no serviço de auditoria de segurança — ver `security-audit.service.js`, que já redige campos como `password`, `token`, `nif`), mas dezenas de chamadas de log espalhadas pelo código não passam por ela.

**Monitoramento de erro é opcional na inicialização — `PARCIAL`.** O sistema sobe em produção mesmo sem a chave de configuração do Sentry definida — silenciosamente, sem travar o processo, mas também sem avisar ninguém que a proteção não está ativa.

**LGPD/GDPR — `NÃO IMPLEMENTADO`.** Não existe hoje exportação de dados pessoais nem apagamento efetivo — só arquivamento/soft-delete. Detalhe em [`DATA_PROTECTION.md`](./DATA_PROTECTION.md).

## Um achado corrigido durante esta revisão (19/08/2026)

Dois "gaps conhecidos" registrados nos documentos antigos (`docs/04-ARQUITETURA/AUTH.md` e `docs/06-SEGURANCA/MULTI-TENANT-SECURITY.md`, ambos de 12/08) foram verificados novamente por leitura direta de código nesta reescrita e **já estão corrigidos**, com teste automatizado passando:

1. Sessão de funcionário desativado não era revogada — corrigido (commit `f1c3121`, `deactivateMember` em `team.service.js` agora chama `authRefreshSessionsRepository.deleteAllForActor`).
2. Escalação de STAFF a FIRM_OWNER via `PATCH /team/:id` (achado SEC-H1 de `docs/FASE-1-PRODUCT-AUDIT.md`) — corrigido (mesmo commit, guarda `assertActorCanAssignRole`).

Detalhe completo, com evidência de teste e uma nota sobre uma divergência encontrada com `docs/ROADMAP.md`, em [`AUTHENTICATION.md`](./AUTHENTICATION.md) e [`AUTHORIZATION.md`](./AUTHORIZATION.md).

## O que não foi verificado nesta revisão

Compliance formal (termos de uso, política de privacidade, requisitos legais específicos de Portugal como o Livro de Reclamações, ou de LGPD para a expansão ao Brasil) não foi escopo desta rodada — não presuma que está adequado só por não estar listado como risco aqui. Testes de penetração HTTP reais (Burp) contra a superfície pública ainda não foram executados — ver [`SECURITY_TESTING.md`](./SECURITY_TESTING.md).
