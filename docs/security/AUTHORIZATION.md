# Autorização e controle de acesso (RBAC)

> **Fontes que consolidei neste documento:** `docs/04-ARQUITETURA/AUTH.md` (seção de papéis), `docs/06-SEGURANCA/SECURITY.md` (seção de autorização), `docs/historico/FASE-1-PRODUCT-AUDIT.md` (achado SEC-H1, arquivo que preservei como registro histórico) — os demais removi depois desta migração, 19/08/2026. Verificação de código extra que fiz nesta reescrita: `backend/src/utils/permissions.js`, `backend/src/modules/firm/team.service.js`, `backend/src/modules/firm/team.service.test.js`, `backend/src/routes/contabil/firm-domain.routes.js`, `docs/ROADMAP.md` (item 0.2).

## Modelo de papéis

Defini isso em `backend/src/utils/permissions.js`. Quatro papéis com permissão diferenciada:

| Papel | O que é | Nível de acesso |
|---|---|---|
| `FIRM_OWNER` | Dono do escritório | Todas as permissões, incluindo billing, configurações, gestão de equipe e atribuição de outros owners. |
| `FIRM_STAFF` | Funcionário do escritório | Permissões operacionais amplas (clientes, obrigações, documentos, tarefas, mensagens, equipe), mas sem `FIRM_REPORTS_VIEW`, `FIRM_BILLING_MANAGE` nem `USERS_CREATE_ADMIN`. |
| `CONSULTANT` (`FIRM_CONSULTANT`) | Papel mais restrito dentro do escritório | Subconjunto operacional (clientes, obrigações, documentos, tarefas, mensagens) sem gestão de equipe ou configurações. |
| `CLIENT` | Cliente final atendido pelo escritório | Apenas leitura do próprio contexto e gestão de suas consultas — nenhuma permissão de gestão de escritório. Testei e confirmei que não tem acesso a rota exclusiva de gestão. |

A permissão efetiva de um usuário vem de `ROLE_PERMISSIONS[papel]`, salvo quando o usuário tem uma lista de permissões customizada persistida (`user.permissions`) ou `masterAccess` (que herda o conjunto de `FIRM_OWNER`).

## Middleware de aplicação — `IMPLEMENTADO`

Uso `requirePermission`/`requireRole`, aplicado de forma consistente nas rotas de escritório que verifiquei. Cada rota declara a permissão mínima exigida (ex.: `router.patch('/team/:id', requirePermission(PERMISSIONS.USERS_UPDATE), ...)`), e o middleware barra a requisição antes de qualquer lógica de negócio rodar caso o usuário autenticado não tenha essa permissão.

**Ressalva importante, que verifiquei em código:** a permissão no nível da rota é necessária, mas não é a única checagem que tenho. Para a operação específica de atribuir ou remover o papel `FIRM_OWNER`, tenho uma segunda checagem no nível de serviço — ver seção seguinte — porque `requirePermission(USERS_UPDATE)` sozinho, sem essa segunda camada, era exatamente o que permitia a escalação de privilégio descrita abaixo.

## SEC-H1 — Escalação de staff a `FIRM_OWNER`

### O achado original

`docs/FASE-1-PRODUCT-AUDIT.md` (13/08/2026) registrou que um usuário com papel `FIRM_STAFF` e a permissão `USERS_UPDATE` (que `FIRM_STAFF` tem por padrão) podia se autopromover — ou promover outro membro — a `FIRM_OWNER` via `PATCH /team/:id`, porque a rota só exigia `USERS_UPDATE`, sem checagem adicional sobre qual papel estava sendo atribuído. Classifiquei isso como P1 HIGH (P0 se staff malicioso for um cenário realista com múltiplos usuários por escritório — que é exatamente o cenário de um piloto pago com equipe).

### Status que verifiquei nesta reescrita — `IMPLEMENTADO`

Ao ler `backend/src/modules/firm/team.service.js` diretamente pra escrever este documento, encontrei uma correção explícita, não apenas um indício:

- A função `assertActorCanAssignRole` (linha ~33) tem um comentário no código citando "SEC-H1" pelo nome e descrevendo a regra: staff nunca atribui nem remove `FIRM_OWNER`; alterar o papel de um membro existente exige `FIRM_MEMBER_ROLE_MANAGE` (permissão que só `FIRM_OWNER` tem por padrão).
- Chamo essa função tanto em `createMember` (criação de membro com papel inicial) quanto em `updateMember` (a função por trás de `PATCH /team/:id`) — cobrindo os dois caminhos de exploração descritos no achado original.
- `deactivateMember` tem uma checagem irmã: staff não pode desativar um `FIRM_OWNER` (`OWNER_ROLE_FORBIDDEN`).
- Tenho **8 testes automatizados dedicados** em `team.service.test.js`, todos com nome prefixado `SEC-H1:`, cobrindo: staff tentando se autopromover, staff promovendo outro membro, staff criando um membro já como owner, staff alterando papel sem `FIRM_MEMBER_ROLE_MANAGE`, staff tentando desativar um owner, e o caminho positivo (owner pode promover staff). Rodei esses testes durante esta revisão (`node --test backend/src/modules/firm/team.service.test.js`): **11/11 passando**, incluindo os 8 de SEC-H1.
- Esses testes rodam como parte de `npm run test:backend` (glob `src/**/*.test.js`), que é o step "Backend unit tests" do CI (`.github/workflows/ci.yml`) — ou seja, uma regressão nesse ponto quebraria meu pipeline, não passaria em silêncio.
- Origem da correção: commit `f1c3121` ("fix(security): prevent staff owner escalation and inactive refresh"), 13/08/2026 — o mesmo commit que corrigiu a revogação de sessão de funcionário desativado (ver `AUTHENTICATION.md`).

### Divergência que encontrei com `docs/ROADMAP.md`

O `ROADMAP.md` atual (item 0.2, Fase 0) lista este achado como estado `PRÓXIMO` e afirma "nenhum documento posterior confirma que isso foi corrigido". Essa afirmação está desatualizada: corrigi isso em código desde 13/08/2026 (antes até da data do próprio `ROADMAP.md`), com teste automatizado rodando no CI. A causa provável é que fiz a correção dentro do mesmo commit que fechava outro item do Sprint 0 (revogação de sessão), sem virar uma linha própria rastreada em `SPRINT-0.md` ou em qualquer changelog de segurança — por isso a auditoria que gerou o `ROADMAP.md` não encontrou confirmação explícita, mesmo ela existindo no código.

Este documento (`AUTHORIZATION.md`) reflete o que o código e os testes mostram hoje: **corrigido, com evidência direta**. Isso não substitui a autoridade do `ROADMAP.md` sobre prioridades — só registro, com honestidade, uma divergência factual que encontrei durante esta reescrita, pra atualizar o item 0.2 do roadmap quando eu voltar nele.

## Ponto de atenção arquitetural (SEC-H2, referenciado aqui, detalhado em `TENANT_ISOLATION.md`)

`docs/FASE-1-PRODUCT-AUDIT.md` também registra, como achado irmão de SEC-H1, que o isolamento entre escritórios depende inteiramente da aplicação (`service_role` do Supabase ignora RLS) — ou seja, um `.eq('firm_id')` esquecido num endpoint novo é um vazamento silencioso, sem rede de segurança automática no banco. Esse não é um problema de autorização por papel, é um problema de isolamento entre tenants — coberto em detalhe em [`TENANT_ISOLATION.md`](./TENANT_ISOLATION.md).

## O que não verifiquei nesta revisão

Não fiz um teste de penetração HTTP real (Burp) simulando um usuário staff autenticado tentando as rotas de escalação — a verificação aqui é de código e teste unitário, que é uma evidência forte, mas diferente de uma exploração ponta a ponta contra staging. Ver `SECURITY_TESTING.md` pra o que ainda depende de execução manual.
