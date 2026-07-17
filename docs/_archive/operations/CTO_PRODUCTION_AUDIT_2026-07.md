# TegLion - Auditoria CTO para Produção Comercial

**Data:** 06 Jul 2026  
**Âmbito:** revisão documental e leitura dirigida do código, sem alterações funcionais  
**Conclusão curta:** pronto para piloto controlado; ainda não pronto para expansão comercial ampla.

Este documento consolida a leitura do estado actual do TegLion como se eu estivesse a preparar a plataforma para operação comercial contínua. O foco é o que já está sólido, o que ainda é dívida técnica e o que bloqueia uma recomendação de lançamento mais amplo.

## Veredicto Executivo

O TegLion já tem uma base séria de produto SaaS: monólito modular, fronteiras de domínio razoáveis, multi-tenant como princípio central, cookies httpOnly, CSRF, rate limiting, auditoria e validação de upload. A plataforma também mostra sinais de maturidade operacional real, com smoke tests, build de produção e documentação ampla.

O principal problema é que existem falhas de controlo de autenticação e vários pontos de comportamento soft-fail que são aceitáveis em piloto, mas perigosos em produção comercial: falha de login com null-dereference, refresh de utilizador que não falha fechado, emails/SMS/Billing que podem ficar silenciosamente inactivos se faltar configuração e um conjunto grande de rotas e conceitos legados ainda montados no servidor.

### Recomendação

- **Go para piloto controlado** e base de clientes limitada.
- **No-go para rollout comercial amplo** até fechar os itens P0/P1 desta auditoria.

## Pontos Fortes

### Arquitetura e organização

O desenho geral está correcto para um SaaS de nicho com complexidade fiscal: monólito modular, separação route/controller/service/repository e fronteiras claras entre frontend, backend, Supabase e serviços transversais. Isso aparece de forma consistente na documentação de arquitectura e base de dados ([docs/engineering/ARCHITECTURE.md](../engineering/ARCHITECTURE.md#L11), [docs/engineering/DATABASE.md](../engineering/DATABASE.md#L11)).

### Segurança base

O modelo de segurança é sólido no papel e parcialmente sólido na implementação: cookies httpOnly, CSRF por double-submit, rate limiting, RBAC, audit logs e validação de ficheiros por magic bytes estão todos documentados como controlos centrais ([docs/security/SECURITY.md](../security/SECURITY.md#L39), [docs/security/SECURITY.md](../security/SECURITY.md#L157), [docs/security/SECURITY.md](../security/SECURITY.md#L179)). O serviço de auditoria também sanitiza metadados sensíveis antes de gravar no `audit_logs` ([backend/src/services/audit/security-audit.service.js](../../backend/src/services/audit/security-audit.service.js#L1)).

### Multi-tenant e dados

O isolamento por tenant é tratado como princípio estrutural, não como detalhe. A base de dados exige `firm_id` em dados de domínio, e a arquitectura descreve `firm_id` como regra universal de scoping ([docs/engineering/DATABASE.md](../engineering/DATABASE.md#L11), [docs/engineering/ARCHITECTURE.md](../engineering/ARCHITECTURE.md#L16)). Isto é o ponto mais importante para um SaaS multi-tenant.

### Produto já validado

As áreas essenciais de valor já existem e parecem coerentes com o piloto: auth, documentos, tarefas, obrigações, mensagens, calendário fiscal, portal do cliente e marketing SEO. O estado do projecto confirma o piloto vendável e os smoke tests recentes aprovados ([docs/operations/STATUS.md](./STATUS.md#L23), [docs/operations/STATUS.md](./STATUS.md#L55)).

### UI e consistência visual

Existe uma base de design system e shell visual já suficientemente estruturada para sustentar evolução sem recomeçar do zero. O sistema documenta padrões de interação, tokens e componentes reutilizáveis; o input base e o shell CSS já mostram escolhas consistentes de contraste, foco e comportamento de formulário ([docs/design/DESIGN_SYSTEM.md](../design/DESIGN_SYSTEM.md#L207), [frontend/src/shared/components/ui/input.jsx](../../frontend/src/shared/components/ui/input.jsx#L5), [frontend/src/shared/styles/app-shell.css](../../frontend/src/shared/styles/app-shell.css#L348)).

## Pontos Fracos

### Autenticação com falhas de controlo

Há um bug concreto e de alto risco no login de escritório e de cliente: quando a pesquisa não encontra utilizador, o fluxo continua e ainda tenta aceder a `row.password_hash`, `row.is_active` e `mapped.id` sem short-circuit. Isso pode transformar credenciais inválidas em erro 500 em vez de 401/403 limpo, e em alguns casos até mascarar o comportamento esperado do sistema ([backend/src/modules/auth/contabil-auth.service.js](../../backend/src/modules/auth/contabil-auth.service.js#L264), [backend/src/modules/auth/contabil-auth.service.js](../../backend/src/modules/auth/contabil-auth.service.js#L356)).

### Refresh e revalidação não falham fechado

O middleware de auth revalida utilizador em rotas sensíveis, mas se a chamada ao backend falhar apenas regista warning e segue em frente. Em termos práticos, isso aumenta a janela durante a qual um token ainda válido pode continuar a ser aceite mesmo com alterações de estado no utilizador, sobretudo se a conta foi desactivada ou removida ([backend/src/middlewares/auth.middleware.js](../../backend/src/middlewares/auth.middleware.js#L21)).

### Internacionalização incompleta

O frontend ainda vive numa transição entre `contabilPt`, `useTranslation` e carregamento assíncrono de recursos. O código aponta explicitamente que pt-BR está presente como recurso, mas não como idioma suportado de verdade, e a própria documentação diz que a migração de `contabilPt` para `useTranslation('contabil')` ainda está aberta ([frontend/src/shared/i18n/index.ts](../../frontend/src/shared/i18n/index.ts#L29), [frontend/src/shared/i18n/resources.ts](../../frontend/src/shared/i18n/resources.ts#L5), [docs/operations/STATUS.md](./STATUS.md#L104)).

### Configuração operacional pode falhar em silêncio

Email e SMS fazem no-op quando faltam variáveis de ambiente ou chaves do Brevo. Billing também depende de Stripe e devolve erros só quando o caminho é executado. Isto é aceitável em dev, mas em produção comercial é um risco porque uma configuração incompleta pode não impedir o arranque e só aparecer quando o cliente já está a contar com o fluxo ([backend/src/services/email/brevo-email.service.js](../../backend/src/services/email/brevo-email.service.js#L10), [backend/src/services/email/brevo-sms.service.js](../../backend/src/services/email/brevo-sms.service.js#L10), [backend/src/modules/billing/billing.service.js](../../backend/src/modules/billing/billing.service.js#L29)).

### Legado ainda muito presente

Ainda existem rotas e compatibilidades herdadas do domínio antigo montadas no servidor: `/api/patients`, `/api/doctors`, `/api/appointments`, `/api/medical-records`, `/api/newsletter`, `/api/billing` e outras. Há também normalização de sessão para `PATIENT`/`DOCTOR`/`clinicId` no middleware de compatibilidade. Isto amplia a superfície de manutenção e deixa o produto com conceitos antigos vivos em runtime ([backend/src/app.js](../../backend/src/app.js#L396), [backend/src/utils/session-user.js](../../backend/src/utils/session-user.js#L1)).

### Acessibilidade ainda parcial

O design system admite explicitamente que skip-to-main, focus visible, aria-labels, navegação por teclado e screen reader coverage ainda estão parciais. Em produção comercial isto é relevante tanto por compliance quanto por qualidade percebida ([docs/design/DESIGN_SYSTEM.md](../design/DESIGN_SYSTEM.md#L221)).

## Riscos Prioritários

### P0

1. Falha de login em null-dereference e 500 em vez de resposta segura.
2. Refresh/revalidação que não falha fechado em rotas sensíveis.
3. Dependências operacionais que podem ficar desligadas sem bloqueio de arranque.

### P1

1. Persistência de rotas e conceitos legados no núcleo da API.
2. i18n híbrida e incompleta, especialmente se pt-BR for promessa comercial.
3. Acessibilidade incompleta em rotas críticas da app autenticada.

### P2

1. Agenda, billing, automações, notificações e relatórios ainda não têm a mesma maturidade do core.
2. Escala sem filas, observabilidade forte, DR/BCP e WAF continua dependente do roadmap futuro.
3. Partes do frontend usam padrões de UI consistentes, mas ainda faltam baselines visuais formais para mobile/tablet em produção.

## Prioridades Recomendadas

1. **Fechar auth P0 agora.** O login deve falhar fechado sempre que a lookup não encontrar utilizador ou cliente, e os caminhos de sucesso/erro devem ser mutuamente exclusivos.
2. **Tornar a revalidação de utilizador estrita nas rotas sensíveis.** Se a consulta ao backend falha por qualquer motivo, a decisão deve ser conservadora.
3. **Definir o contrato de configuração de produção.** Email, SMS, Stripe, Redis e webhooks devem falhar no arranque ou em health-check se o ambiente de produção estiver incompleto.
4. **Escolher uma estratégia única de i18n.** Ou pt-PT fica como único idioma comercial agora, ou a camada pt-BR passa a ser real de ponta a ponta.
5. **Eliminar o legado antigo por fases.** Manter compatibilidade só enquanto existir janela de migração, com data de remoção.
6. **Fechar a camada de operação em escala.** Filas, observabilidade, métricas SLO, DR/BCP e WAF precisam de gate antes de publicidade ampla.

## Funcionalidades Inacabadas

### Núcleo do produto

- Billing precisa de validação UX e consistência de estado com Stripe live versus test mode ([docs/product/MODULES.md](../product/MODULES.md#L28), [docs/operations/STATUS.md](./STATUS.md#L126)).
- Agenda / consultorias continua marcada como secundária.
- Serviços / orçamentos, automações, tracking e notificações firm estão funcionais mas ainda incompletos.

### Portal do cliente

- Arquivo parece ser candidato a fusão com Documentos.
- Notícias tem valor comercial ainda por validar.
- Booking é secundário e sem sinais de forte tração.
- Push notifications tem `scope="client"` implementado mas ainda não totalmente usado na UI ([docs/product/MODULES.md](../product/MODULES.md#L51)).

### Operação e escala

- Fila assíncrona robusta para emails, SMS e jobs pesados ainda é backlog.
- Observabilidade fim-a-fim com SLOs e alertas ativos ainda está no roadmap.
- Redis obrigatório em multi-instância, WAF e DR/BCP continuam como trabalho futuro ([docs/product/ROADMAP.md](../product/ROADMAP.md#L68), [docs/operations/STATUS.md](./STATUS.md#L137)).

## Telas Incompletas ou Menos Maduros

Com base no inventário de módulos, as superfícies com maturidade mais baixa são:

- [FirmBillingPage](../product/MODULES.md#L28)
- [FirmAgendaPage](../product/MODULES.md#L29)
- [FirmServiceRequestsPage](../product/MODULES.md#L30)
- [FirmAlertsPage](../product/MODULES.md#L31)
- [FirmSettings](../product/MODULES.md#L32)
- [ClientArchivePage](../product/MODULES.md#L51)
- [ClientNewsPage](../product/MODULES.md#L53)
- [ClientBookingPage](../product/MODULES.md#L54)
- [PushNotificationSettings](../product/MODULES.md#L55)

Na prática, são áreas que funcionam, mas ainda não têm a mesma robustez, validação de negócio e acabamento visual do core de documentos, tarefas, mensagens e obrigações.

## Configurações Sem Implementação Suficiente

1. **WAF e hardening de borda.** A documentação trata Cloudflare WAF como plano, não como condição já consolidada ([docs/security/SECURITY.md](../security/SECURITY.md#L33), [docs/product/ROADMAP.md](../product/ROADMAP.md#L197)).
2. **Redis obrigatório em produção multi-instância.** Está descrito como regra, mas ainda precisa ser tratado como gate operacional e não só infra recomendada ([docs/security/SECURITY.md](../security/SECURITY.md#L165)).
3. **Stripe live consistente com pricing comercial.** Há uma discrepância documental entre Stripe live e test mode, e isso precisa ser resolvido antes de maior aquisição ([docs/operations/STATUS.md](./STATUS.md#L126)).
4. **pt-BR real.** O carregamento e os recursos existem como ponte, mas `supportedLngs` ainda não reflecte uma estratégia multilingue real ([frontend/src/shared/i18n/index.ts](../../frontend/src/shared/i18n/index.ts#L33)).
5. **Centro de notificações unificado.** O produto tem notificações espalhadas por áreas, mas o centro unificado ainda não está no nível de produto principal ([docs/product/MODULES.md](../product/MODULES.md#L31)).

## Funcionalidades Herdadas do SaaSude que Podem Ser Reaproveitadas

O que vale a pena reutilizar do legado antigo não é o domínio em si, mas os padrões transversais que já estão maduros:

- normalização de sessão e claims legadas enquanto durar a migração ([backend/src/utils/session-user.js](../../backend/src/utils/session-user.js#L1));
- auditoria de eventos sensíveis com redacção de dados pessoais ([backend/src/services/audit/security-audit.service.js](../../backend/src/services/audit/security-audit.service.js#L1));
- validação de upload por magic bytes e armazenamento em path tenant-scoped ([docs/security/SECURITY.md](../security/SECURITY.md#L179), [docs/engineering/DATABASE.md](../engineering/DATABASE.md#L155));
- RBAC e tenant scoping como padrão base de toda rota autenticada ([docs/security/SECURITY.md](../security/SECURITY.md#L95), [docs/engineering/ARCHITECTURE.md](../engineering/ARCHITECTURE.md#L173));
- shell visual e componentes reutilizáveis já padronizados no frontend ([frontend/src/shared/components/ui/input.jsx](../../frontend/src/shared/components/ui/input.jsx#L5), [frontend/src/shared/styles/app-shell.css](../../frontend/src/shared/styles/app-shell.css#L348)).

## Funcionalidades Herdadas Que Devem Ser Removidas

Estas partes não devem continuar a crescer. Devem ser removidas ou encerradas por janela de descontinuação:

- rotas legadas de clínica/paciente e equivalentes em `app.js` ([backend/src/app.js](../../backend/src/app.js#L399));
- normalização e compatibilidade que continuam a aceitar `clinicId`, `patientId`, `PATIENT` e `DOCTOR` como domínio activo ([backend/src/utils/session-user.js](../../backend/src/utils/session-user.js#L24));
- chaves e colunas de legado no esquema, como `legacy_clinic_id` e `legacy_patient_id` ([docs/engineering/DATABASE.md](../engineering/DATABASE.md#L92), [docs/engineering/DATABASE.md](../engineering/DATABASE.md#L117));
- `crypto-js` legado para decrypt, que a política de segurança já sinaliza como dívida de migração ([docs/security/SECURITY.md](../security/SECURITY.md#L193));
- News de escritório, que o inventário de módulos já marca como removível ([docs/product/MODULES.md](../product/MODULES.md#L37)).

## Sugestões de Melhoria

1. **Criar gates de produção explícitos.** Se faltarem Stripe, Brevo, Redis ou URLs essenciais, a app deve falhar no arranque ou no health-check de produção.
2. **Adicionar testes regressivos específicos.** O caso de login inválido, utilizador inactivo, cliente não encontrado e refresh-revalidation falhada precisam de cobertura dedicada.
3. **Definir uma política de descontinuação do legado.** Qualquer compatibilidade antiga deve ter data de corte, dono e checklist de remoção.
4. **Uniformizar a i18n.** Um único caminho de tradução, um único namespace dominante e um plano claro de pt-PT/pt-BR.
5. **Fechar acessibilidade das rotas críticas.** Botões icon-only, sidebar, modais e formulários devem chegar a 100% de aria-labels e keyboard nav.
6. **Formalizar observabilidade.** Sentry está presente, mas o próximo nível precisa de métricas, tracing e alertas operacionais por SLO.
7. **Documentar o estado de cada superfície comercial.** Billing, notificações, automações, booking e news devem ter dono, objetivo e critério de saída.

## Conclusão

O TegLion já é um produto real, não um protótipo: tem estrutura, validação operacional e foco claro de SaaS multi-tenant. O que falta para produção comercial mais ampla não é reinventar o produto. É fechar os buracos de autenticação, tornar a configuração de produção fail-fast, cortar legado, completar i18n e preparar a operação para escala.

Em termos práticos: **a base está boa; o nível de risco ainda não está baixo o suficiente para um lançamento comercial amplo sem uma ronda curta de hardening**.

## Matriz Actual de Roles, ACL e Reutilização

Esta é a leitura mais útil para reaproveitamento imediato. O sistema já tem uma hierarquia suficiente para o produto actual; o que falta é só reduzir o legado e fechar alguns gaps de consistência.

### 1. `PLATFORM_OWNER`

Não é uma role de tenant do escritório; é uma role de plataforma no frontend e no modelo de auth. Aparece em [frontend/src/shared/types/auth.ts](../../frontend/src/shared/types/auth.ts) e [frontend/src/shared/constants/contabilRoles.ts](../../frontend/src/shared/constants/contabilRoles.ts), mas não existe como valor nativo em `firm_users.role`.

**Reaproveitar:**
- separation of concerns para suporte interno, segurança e billing da plataforma;
- modelo de usuário público em [backend/src/modules/auth/auth-public-user.js](../../backend/src/modules/auth/auth-public-user.js);
- normalização de papéis no frontend em [frontend/src/shared/utils/authNormalize.ts](../../frontend/src/shared/utils/authNormalize.ts).

**Nota:** é útil para operação interna, mas não deve ser confundida com permissão de tenant.

### 2. `FIRM_OWNER`

É o papel mais completo do tenant. O backend trata-o como dono real do escritório em [backend/src/middlewares/firm-owner.middleware.js](../../backend/src/middlewares/firm-owner.middleware.js) e em várias rotas críticas de [backend/src/routes/contabil/firm-domain.routes.js](../../backend/src/routes/contabil/firm-domain.routes.js).

**Pode fazer hoje:**
- alterar perfil e dados do escritório;
- encerrar conta do escritório;
- gerir equipa;
- billing;
- definições;
- logo;
- convites;
- acesso completo às rotas operacionais permitidas por permission set.

**Reaproveitar:**
- guard explícito de dono;
- labels de role em [backend/src/modules/firm/firm-settings.service.js](../../backend/src/modules/firm/firm-settings.service.js);
- fluxo de encerramento de conta e revogação de sessões;
- matriz de permissões `FIRM_OWNER_PERMISSIONS` em [backend/src/utils/permissions.js](../../backend/src/utils/permissions.js).

### 3. `FIRM_STAFF`

É a role operacional padrão do escritório. Está presente na tabela `firm_users`, no backend e no frontend.

**Pode fazer hoje:**
- operações de clientes;
- documentos;
- tarefas;
- obrigações;
- mensagens;
- calendário fiscal;
- alertas;
- serviços;
- navegação do workspace.

**Restrição relevante:** não deve ter o mesmo alcance que o owner em ações de fecho de conta ou controlo absoluto do escritório. O sistema já reflecte isso em `requireFirmOwner` e na composição das permissões.

**Reaproveitar:**
- `FIRM_STAFF` em [backend/src/utils/permissions.js](../../backend/src/utils/permissions.js);
- `FIRM_STAFF` em [supabase/tables.sql](../../supabase/tables.sql);
- guard de UI em [frontend/src/shared/components/layout/RequireRole.tsx](../../frontend/src/shared/components/layout/RequireRole.tsx).

### 4. `FIRM_CONSULTANT`

Existe como papel canónico e como role de tenant na tabela `firm_users`.

**Pode fazer hoje:**
- trabalhar com clientes atribuídos;
- operar em tarefas, mensagens, documentos e obrigações dentro do escopo;
- ser distinguido na UI e nas labels do settings.

**Reaproveitar:**
- a role já existe sem necessidade de novo modelo;
- a aplicação já mapeia legacy `DOCTOR` para `CONSULTANT` em compatibilidade;
- `firm_users.role` aceita `FIRM_CONSULTANT` diretamente.

### 5. `CLIENT`

É o portal do cliente e o papel mais restrito do sistema. Na base RLS, corresponde a `CLIENT_USER` nas policies de [supabase/rls.sql](../../supabase/rls.sql) e [supabase/policies.sql](../../supabase/policies.sql).

**Pode fazer hoje:**
- ver os seus próprios documentos, obrigações, tarefas, mensagens e consultas;
- aceitar convites;
- fazer upload no portal;
- responder a pedidos;
- aceder ao seu portal próprio.

**Reaproveitar:**
- `CLIENT` no frontend;
- `CLIENT_USER` nas policies do banco;
- `client_invites` como mecanismo de onboarding;
- `RequireClientFirmAccess` e `RequireFirmAccess` como guards de UX.

### 6. `OWNER`, `MASTER`, `ADMIN`, `SECRETARY`, `DOCTOR`, `PATIENT`

Estas não são roles novas do produto actual; são compatibilidade herdada do SaaSude.

**Estado actual:**
- `OWNER` → `FIRM_OWNER`
- `MASTER` → `FIRM_OWNER`
- `ADMIN` → `FIRM_STAFF`
- `SECRETARY` → `FIRM_STAFF`
- `DOCTOR` → `CONSULTANT`
- `PATIENT` → `CLIENT`

**Onde isso existe:**
- backend em [backend/src/utils/session-user.js](../../backend/src/utils/session-user.js);
- frontend em [frontend/src/shared/utils/authNormalize.ts](../../frontend/src/shared/utils/authNormalize.ts);
- auth em [backend/src/modules/auth/contabil-auth.service.js](../../backend/src/modules/auth/contabil-auth.service.js).

**O que reaproveitar:** a lógica de normalização de claims e transição suave.

**O que remover:** manter estas strings como domínio principal. Devem servir apenas como ponte temporária.

## ACL e Policies Já Presentes

O sistema já tem uma ACL funcional em três níveis:

1. **App-level RBAC** em [backend/src/utils/permissions.js](../../backend/src/utils/permissions.js) e [backend/src/middlewares/role.middleware.js](../../backend/src/middlewares/role.middleware.js).
2. **Tenant ownership guard** em [backend/src/middlewares/firm-owner.middleware.js](../../backend/src/middlewares/firm-owner.middleware.js).
3. **Database ACL / RLS** em [supabase/rls.sql](../../supabase/rls.sql) e [supabase/policies.sql](../../supabase/policies.sql).

### Tabelas já cobertas por policies

- `firms`
- `firm_users`
- `clients`
- `obligations`
- `client_tasks`
- `documents`
- `messages`
- `consultations`
- `accounting_services`
- `audit_logs`
- `client_invites`
- `task_month_exclusions`
- `content_views`
- `activity_events`
- `sms_logs`
- `news_articles`
- `in_app_notifications`

### Regras que já existem e valem reaproveitar

- staff do escritório só enxerga o seu `firm_id`;
- cliente só enxerga o seu `firm_id` e o seu `client_id`;
- `firm_users` e `client_invites` são tenant-scoped;
- `audit_logs` são legíveis apenas por staff do tenant;
- storage privado deve continuar a ser acessado por proxy autenticado.

## Departamentos

Não existe entidade de departamento no modelo actual. O que há é:

- equipa/staff (`firm_users`);
- atribuição por responsável (`assigned_staff_id` / `staff_id`);
- filtração por cliente, task e tenant.

Se o negócio quiser departamentos, isso será um novo modelo, não uma reutilização directa.

## Resumo de Reutilização

Se eu tivesse de estimar o que já pode ser reaproveitado imediatamente para qualquer expansão de roles/ACL, eu manteria:

- normalização de roles legados;
- matriz de permissões `FIRM_*`;
- guards de owner e permission;
- RLS por tenant e por cliente;
- convites de cliente;
- labels e modelagem de team member;
- autenticação com cookies httpOnly + refresh;
- auditoria e redacção de PII.

O que ainda falta não é “inventar roles”. É consolidar a semântica já existente e remover o legado que ainda fala a linguagem antiga.

## Matriz Operacional Por Papel

Esta tabela traduz a estrutura actual para uso prático. Não é uma proposta nova; é a leitura do que o sistema já faz hoje.

### `PLATFORM_OWNER`

**Âmbito:** operação interna da plataforma, não do tenant.

**Pode tocar em:**
- billing e suporte da plataforma;
- segurança e observabilidade;
- resolução de incidentes;
- gestão operacional interna.

**Não deve usar como se fosse tenant owner.**

### `FIRM_OWNER`

**Âmbito:** dono do escritório.

**Endpoints e áreas já atribuídos hoje:**
- [`/firm/settings`](../engineering/API.md#api-contabil--escritorio) com `requireFirmOwner`;
- [`/firm/close`](../engineering/API.md#api-contabil--escritorio) com `requireFirmOwner`;
- [`/firm/logo`](../engineering/API.md#api-contabil--escritorio) com `requireFirmOwner`;
- gestão de equipa, billing e definições do escritório;
- todas as rotas operacionais que exigem permissões `FIRM_*` por cima da base de staff.

**Reaproveitamento directo:** owner já existe como papel real, com guard próprio e labels de UI.

### `FIRM_STAFF`

**Âmbito:** operação diária do escritório.

**Pode usar hoje:**
- dashboard e clientes;
- documentos, inbox e previews;
- tarefas e obrigações;
- mensagens e broadcasts;
- notificações;
- serviços e automações;
- calendário fiscal;
- consultorias/agenda;
- tracking e activity views;
- integração AT;
- billing status e portal quando a regra de acesso permitir, mas sem poderes de dono.

**Mapeamento actual no backend:** a maior parte das rotas de escritório usa `requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE)` ou permissões equivalentes em [backend/src/routes/contabil/firm-domain.routes.js](../../backend/src/routes/contabil/firm-domain.routes.js).

### `FIRM_CONSULTANT`

**Âmbito:** colaborador com acesso a clientes atribuídos e trabalho operacional controlado.

**Reutilização actual:**
- já existe na tabela `firm_users`;
- já é reconhecido nas roles canónicas;
- já é suportado pela normalização de sessão legado → actual.

**Leitura prática:** é uma role pronta para sub-permissão e segmentação de carteira, mas não há ainda um sistema de departamentos formal por trás.

### `CLIENT`

**Âmbito:** portal próprio do cliente final.

**Pode usar hoje:**
- ver o seu dashboard;
- ver obrigações, tarefas, documentos, mensagens, alertas e notícias;
- fazer upload;
- responder a pedidos;
- marcar consultas/booking;
- submeter tarefas;
- aceder por convite.

**ACL já aplicada:** RLS e policies por `firm_id` + `client_id` em [supabase/policies.sql](../../supabase/policies.sql) e helpers em [supabase/rls.sql](../../supabase/rls.sql).

## Canais de Autorização Já Em Uso

### 1. Authorization por JWT + middleware

- `auth.middleware.js` valida sessão e popula `req.user`;
- `role.middleware.js` aplica `requirePermission()` e `requireRole()`;
- `firm-owner.middleware.js` fecha a diferença entre staff e owner;
- `contabil-scope` e repositories garantem `firm_id` no query path.

### 2. Authorization por RLS / Policies

Já existe para:
- firms;
- firm_users;
- clients;
- obligations;
- client_tasks;
- documents;
- messages;
- consultations;
- accounting_services;
- audit_logs;
- client_invites;
- task_month_exclusions;
- content_views;
- activity_events;
- sms_logs;
- news_articles;
- in_app_notifications.

### 3. Authorization na UI

O frontend já reaproveita:
- `ProtectedRoute` para auth global;
- `RequireRole` para perfis;
- `RequireFirmAccess` para restrição por estado do tenant;
- `RequireClientFirmAccess` para acesso do cliente;
- router com lazy loading por área autenticada.

## O Que É Reutilizável Sem Mudança Estrutural

Isto pode ser aproveitado já, tal como está:

- `FIRM_OWNER`, `FIRM_STAFF`, `FIRM_CONSULTANT`, `CLIENT`;
- normalização `OWNER` / `MASTER` / `ADMIN` / `SECRETARY` / `DOCTOR` / `PATIENT`;
- matriz `PERMISSIONS` com `FIRM_*`;
- `requirePermission()` e `requireFirmOwner()`;
- RLS helpers `current_firm_id()`, `current_client_id()`, `is_firm_staff()`, `is_client_user()`;
- `client_invites`;
- `firm_users` com `role`, `is_active` e `assigned_staff_id` nos fluxos de negócio;
- `audit_logs`;
- guards de frontend e normalização de auth;
- labels e public auth user shaping.

## O Que Está A Mais Ou É Só Legado

Isto deve ser tratado como transição, não como base futura:

- `PATIENT`, `DOCTOR`, `ADMIN`, `SECRETARY`, `MASTER`, `OWNER` como semântica principal;
- `clinicId`, `patientId` e campos de compatibilidade antigos;
- rotas de clínica/paciente ainda montadas em runtime;
- colunas `legacy_*` no esquema;
- referência a `CLIENT_USER` no banco sem unificação total com o modelo frontend.

## Conclusão Prática

Sim, há muita coisa reaproveitável. O problema não é ausência de roles ou ACL; é excesso de camadas históricas sobre uma base já boa. O melhor próximo passo é manter a matriz actual, eliminar o legado e evitar criar um segundo modelo de autorização paralelo.

## Matriz Por Endpoint E Papel

Esta tabela não substitui o código. Serve para ver, num único bloco, o que cada papel já toca hoje e onde a segurança está realmente ancorada.

### `PLATFORM_OWNER`

- Não é tenant role.
- Não aparece como role nativa em `firm_users`.
- Reaproveita-se para operação interna da plataforma, suporte e billing da própria empresa.

### `FIRM_OWNER`

- `/api/auth/me` e `POST /api/auth/complete-onboarding` como utilizador do escritório autenticado.
- `/api/contabil/firm/settings`, `/api/contabil/firm/profile`, `/api/contabil/firm/logo`, `/api/contabil/firm/close`.
- Billing do escritório: `/api/contabil/billing/status`, `/api/contabil/billing/checkout`, `/api/contabil/billing/portal`.
- Gestão sensível de equipa e identidade do escritório.
- Operações amplas do escritório via `FIRM_*`, mas com guard adicional para decisões irreversíveis.

### `FIRM_STAFF`

- Dashboard e operação do escritório em `/api/contabil/dashboard`.
- Clientes em `/api/contabil/clients`, `/api/contabil/clients/:id`, `/api/contabil/clients/:id/hub`, `POST /api/contabil/clients/:id/invites`.
- Documentos em `/api/contabil/documents`, `/api/contabil/documents/:id`, `/download`, `/preview`, `/validate`.
- Tarefas e obrigações em `/api/contabil/tasks/*`, `/api/contabil/obligations/*`, `/api/contabil/fiscal-calendar*`.
- Mensagens, broadcasts, notícias, consultas, service requests, notifications, automations, integrations e tracking.
- Pode gerir o escritório no dia-a-dia, mas não deve poder encerrar conta nem ultrapassar o limite de owner.

### `FIRM_CONSULTANT`

- Reaproveitável para escopo por carteira de clientes.
- Hoje está preparado no modelo de roles e na compatibilidade de sessão, mas a maior parte das rotas ainda usa permissões operacionais amplas do escritório.
- É o melhor candidato a sub-permissões futuras por cliente, agenda e acompanhamento.

### `CLIENT`

- `/api/client-portal/me/contabil/hub`, `/api/client-portal/me/contabil/dashboard`.
- `/api/client-portal/document-requests`, `/documents`, `/documents/upload`, `/documents/:id/download`.
- `/api/client-portal/obligations`, `/tasks`, `/tasks/:id/submit`, `/messages`, `/broadcasts`, `/news`.
- `/booking/*`, `/service-requests`, `/live/events`, `/push/subscribe`.
- Tudo isto já é reforçado por `firm_id` + `client_id` via JWT e RLS.

### Legado Herdado Que Ainda Aparece Nas Rotas

- `/api/patient-portal` como alias legacy.
- Claims antigas `clinicId`, `patientId`, `MASTER`, `OWNER`, `ADMIN`, `SECRETARY`, `DOCTOR`, `PATIENT`.
- Parte do contrato público e do frontend ainda normaliza esses valores para evitar quebrar sessões antigas.

## Mapa De Reutilização Imediata

Se o objectivo for reduzir trabalho e risco, os blocos mais valiosos são estes:

- `backend/src/utils/permissions.js` e `backend/src/middlewares/role.middleware.js` para RBAC;
- `backend/src/middlewares/firm-owner.middleware.js` para diferença entre staff e owner;
- `backend/src/utils/session-user.js` e `frontend/src/shared/utils/authNormalize.ts` para migração do legado;
- `supabase/rls.sql` e `supabase/policies.sql` para ACL real por tenant;
- `backend/src/modules/firm/invites.service.js` e `backend/src/db/supabase/repositories/invites.repository.js` para onboarding de cliente;
- `backend/src/modules/firm/firm-settings.service.js` para ownership, profile e close-account;
- `frontend/src/shared/components/layout/ProtectedRoute.tsx`, `RequireRole.tsx`, `RequireFirmAccess.tsx`, `RequireClientFirmAccess.tsx` para UX de autorização.

## Fecho

A estrutura actual de roles não precisa ser redesenhada. Precisa ser disciplinada. O que já existe é suficiente para a maior parte do produto; o que falta é uma política consistente para cortar legado, reduzir ambiguidades e não introduzir uma segunda árvore de permissões sem necessidade.

## Proposta De Arquitectura De Negócio

Esta proposta assume o que já existe hoje, mas reorganiza a semântica para servir escritórios de contabilidade como negócio, não como herança técnica.

### 1. Princípio Base

As roles passam a representar apenas **nível de acesso**. A estrutura organizacional passa para entidades separadas.

**Roles finais recomendadas:**

- `FIRM_OWNER` — dono do escritório, controlo total.
- `FIRM_ADMIN` — administrador interno com acesso amplo, mas sem poderes de fecho/controlo absoluto.
- `FIRM_STAFF` — operacional normal.
- `FIRM_READONLY` — leitura sem escrita.
- `CLIENT` — portal do cliente.

**Observação arquitectural:** `PLATFORM_OWNER` pode continuar a existir apenas para operação interna da TegLion, fora do modelo do tenant.

### 2. Departamentos Como Entidade Separada

Departamentos não devem ser roles. Devem ser uma entidade própria, ligada ao tenant.

**Modelo conceptual recomendado:**

- `departments`
	- `id`
	- `firm_id`
	- `name`
	- `code`
	- `color`
	- `is_default`
	- `is_active`
	- `created_at`
	- `updated_at`

- `firm_users`
	- mantém `role`
	- ganha `department_id`
	- mantém `is_active`
	- mantém `full_name`, `email`, `password_hash`

**Leitura de negócio:**

- Portugal pode começar com departamentos base: Fiscal, Contabilidade, Departamento Pessoal, Administrativo.
- Cada escritório pode criar departamentos próprios.
- Um utilizador pertence a um departamento principal; no futuro pode ter múltiplos vínculos se o negócio pedir isso.

### 3. Matriz De Permissões

O inventário actual já cobre a maior parte do produto. O alvo deve ser **menos permissões, mais claras**.

#### Permissões já existentes e reutilizáveis

- `FIRM_READ`
- `FIRM_CONSULTATIONS_MANAGE`
- `USERS_READ`
- `USERS_CREATE`
- `USERS_CREATE_ADMIN`
- `USERS_UPDATE`
- `USERS_DELETE`
- `FIRM_CLIENTS_VIEW`
- `FIRM_CLIENTS_MANAGE`
- `FIRM_ACCOUNTING_SERVICES_VIEW`
- `FIRM_ACCOUNTING_SERVICES_MANAGE`
- `FIRM_OBLIGATIONS_MANAGE`
- `FIRM_DOCUMENTS_MANAGE`
- `FIRM_TASKS_MANAGE`
- `FIRM_MESSAGES_MANAGE`
- `FIRM_BILLING_MANAGE`
- `FIRM_SETTINGS_MANAGE`
- `FIRM_TEAM_MANAGE`
- `FIRM_REPORTS_VIEW`

#### Permissões reutilizáveis com ajuste semântico

- `USERS_CREATE` deve cobrir convite/criação de funcionário.
- `USERS_UPDATE` deve cobrir edição de perfil e atribuição de departamento.
- `USERS_DELETE` deve cobrir desativação/remoção lógica.
- `FIRM_TEAM_MANAGE` pode cobrir gestão estrutural da equipa enquanto não existir permissão própria de departamento.
- `FIRM_CLIENTS_MANAGE` hoje concentra mais do que clientes; deve ser revisto no futuro para não acumular tudo.

#### Permissões que provavelmente precisam de existir

- `FIRM_DEPARTMENTS_MANAGE` — criar, editar, activar/desactivar departamentos.
- `FIRM_INVITES_MANAGE` — enviar, reenviar, revogar convites.
- `FIRM_MEMBER_ROLE_MANAGE` — alterar role de funcionários.
- `FIRM_MEMBER_DEPARTMENT_MANAGE` — mover funcionário entre departamentos.
- `FIRM_PERMISSION_ASSIGN` — alterar matriz de permissões, se o produto permitir perfis customizados.

#### Permissões que eu evitaria criar agora

- dezenas de permissões por submódulo muito granulares;
- permissões específicas por ecrã;
- permissões diferentes para cada tipo de documento ou obrigação.

**Regra:** primeiro consolidar o mínimo necessário para gerir staff e departamentos.

### 4. Matriz De Permissões Por Área

#### Clientes

- visualizar
- criar/editar/excluir
- convidar cliente ao portal

**Base actual reutilizável:** `FIRM_CLIENTS_VIEW`, `FIRM_CLIENTS_MANAGE`, `USERS_CREATE` para criação de contacto interno.

#### Obrigações

- visualizar
- criar
- editar
- concluir
- excluir

**Base actual reutilizável:** `FIRM_OBLIGATIONS_MANAGE`.

#### Agenda Fiscal / Consultorias

- visualizar
- editar
- criar
- cancelar

**Base actual reutilizável:** `FIRM_CONSULTATIONS_MANAGE`.

#### Documentos

- visualizar
- carregar/enviar
- validar
- descarregar
- excluir

**Base actual reutilizável:** `FIRM_DOCUMENTS_MANAGE`.

#### Mensagens / Broadcasts

- visualizar
- enviar
- apagar/revogar

**Base actual reutilizável:** `FIRM_MESSAGES_MANAGE`.

#### Equipa / Funcionários

- visualizar funcionários
- convidar funcionários
- editar papel
- editar departamento
- desactivar funcionário

**Base actual reutilizável:** `USERS_READ`, `USERS_CREATE`, `USERS_UPDATE`, `USERS_DELETE`, `FIRM_TEAM_MANAGE`.

#### Configurações

- visualizar
- editar branding/dados fiscais
- gerir billing
- gerir integrações

**Base actual reutilizável:** `FIRM_SETTINGS_MANAGE`, `FIRM_BILLING_MANAGE`.

#### Relatórios / Auditoria

- visualizar relatórios
- visualizar auditoria
- exportar

**Base actual reutilizável:** `FIRM_REPORTS_VIEW` e `audit_logs`.

### 5. Convites E Primeiro Acesso

O fluxo actual já existe e deve ser reaproveitado quase integralmente.

**Fluxo desejado do negócio:**

Owner → Criar Funcionário → Selecionar Role → Selecionar Departamento → Enviar convite → Funcionário confirma email → Define senha → Primeiro acesso

**Reutilização actual já presente:**

- `client_invites` como padrão de convites;
- `firm_users` como base de utilizadores do escritório;
- `register-client-invite` e `invite preview` como mecanismo já testado;
- `auth` com recovery/reset/password flow;
- notificações por email via Brevo.

**O que precisa ser adaptado conceitualmente:**

- o convite de cliente serve como padrão; o convite de funcionário deve seguir a mesma engenharia, mas com `firm_users` em vez de `clients`;
- o convite deve carregar `role` e `department_id` em vez de depender de texto solto;
- o primeiro acesso precisa assumir `password setup` ou `SSO setup`.

### 6. Estrutura Actual Que Deve Ser Reutilizada

#### Tabelas reutilizadas agora

- `firms`
- `firm_users`
- `clients`
- `client_invites`
- `audit_logs`
- `auth_refresh_sessions`
- `auth_login_attempts`
- `password_reset_tokens`
- `user_legal_consents`
- `documents`
- `messages`
- `obligations`
- `client_tasks`
- `consultations`

#### Endpoints reutilizados agora

- `POST /api/auth/login-firm`
- `POST /api/auth/login-client`
- `POST /api/auth/register-client-invite`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `POST /api/contabil/invites`
- `GET /api/public/client-invite/:token`
- `GET /api/contabil/firm/staff`
- `GET /api/contabil/firm/settings`
- `PATCH /api/contabil/firm/profile`
- `POST /api/contabil/firm/close`

#### Componentes reutilizados agora

- `FirmSettingsTeamSection`
- `FirmClientInviteButton`
- `ProtectedRoute`
- `RequireRole`
- `RequireFirmAccess`
- `RequireClientFirmAccess`
- `FirmSettingsPage`
- `FirmSettingsProfileSection`
- `FirmSettingsDangerZone`
- `ClientInviteRegisterPage`
- `AuthProfileChoicePage`

#### Policies reutilizadas agora

- `supabase/rls.sql`
- `supabase/policies.sql`

#### Guards reutilizados agora

- `auth.middleware.js`
- `role.middleware.js`
- `firm-owner.middleware.js`
- `contabil-scope` helpers
- `RequireRole` / `RequireFirmAccess` / `RequireClientFirmAccess`

### 7. Segurança E Auditoria

Já existe suporte parcial e bom para auditoria, mas ainda não para auditoria de todas as mudanças de acesso.

**Já existe:**

- auditoria de auth em `security-audit.service.js`;
- auditoria de documentos, cliente, mensagens, obligaciones e settings;
- `audit_logs` com `firm_id`, `actor_role`, `actor_id`, `action`, `entity_type`, `entity_id`, `metadata`, `ip_address`;
- histórico por documento e timeline operacional;
- registo de quem convidou no `client_invites.created_by`;
- estado do convite em `PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED`.

**Ainda falta para o novo modelo de negócio:**

- auditoria explícita de alteração de role;
- auditoria explícita de alteração de departamento;
- auditoria explícita de revogação de convite;
- auditoria explícita de concessão/revogação de permissões customizadas;
- uma timeline de membro de equipa mais explícita.

**Conclusão de segurança:**

- o suporte base já existe;
- o que falta é instrumentar as mutações de staff/departamento quando esse módulo nascer.

### 8. Proposta De Tela De Gestão De Funcionários

Sem implementar nada, a tela ideal deve reaproveitar a linguagem visual existente do SaaSude/TegLion:

#### Estrutura de tela sugerida

- cabeçalho com título e CTA principal: `Convidar funcionário`;
- KPI cards curtos: total activos, convites pendentes, por departamento, por role;
- tabela principal de funcionários;
- painel lateral ou modal de detalhe;
- zona de convites pendentes;
- filtro por role, departamento e estado;
- zona de auditoria/histórico do membro.

#### Reutilização visual imediata

- base de layout de [frontend/src/features/firm/pages/FirmSettingsPage.tsx](../../frontend/src/features/firm/pages/FirmSettingsPage.tsx);
- secção de equipa de [frontend/src/features/firm/settings/FirmSettingsTeamSection.tsx](../../frontend/src/features/firm/settings/FirmSettingsTeamSection.tsx);
- componentes de diálogo, tabela e badges já usados no app shell;
- estilo e densidade visual já presentes nas páginas de settings e agenda;
- padrão de botão de convite já usado por [frontend/src/features/firm/components/FirmClientInviteButton.tsx](../../frontend/src/features/firm/components/FirmClientInviteButton.tsx).

#### Comportamento da tela

- criar funcionário abre um wizard simples;
- escolher role antes de departamento para deixar a autorização clara;
- departamento pode vir pré-selecionado no convite se houver default;
- primeiro acesso deve orientar para definição de senha ou SSO;
- readonly deve ver tudo, mas não editar;
- owner deve poder gerir roles e departamentos;
- admin deve poder gerir funcionários, mas não encerrar conta do escritório.

### 9. Decisão Arquitectural Recomendada

Se o objectivo é fazer isso virar produto comercial de escritórios de contabilidade, a melhor arquitectura é:

- **roles mínimas** para acesso;
- **departments como dimensão organizacional**;
- **permissions como capacidade funcional**;
- **convites como onboarding de staff e clientes**;
- **RLS e guards como defesa em profundidade**;
- **auditoria obrigatória em mutações sensíveis**;
- **UI de gestão de funcionários unificada** dentro de settings/organization.

Em outras palavras: manter o que já existe, reduzir a semântica de roles, e mover a complexidade organizacional para departamentos e permissões, não para dezenas de roles novas.