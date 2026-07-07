# TegLion - Sprint 0.9: Gestão de Equipas

**Status:** Plano de implementação, sem execução de código  
**Data:** 06 Jul 2026  
**Objetivo:** transformar a base existente de RBAC, ACL, RLS, convites e guards num módulo completo de Gestão de Equipas para escritórios de contabilidade em Portugal e Brasil.

## 0. Princípios de arquitectura

Este plano parte da referência oficial já produzida para o TegLion: a base técnica é robusta e deve ser preservada. O foco da Sprint 0.9 é **reorganizar o que já existe** em torno de um modelo de negócio claro para equipa, departamentos, roles e permissões, sem multiplicar abstrações desnecessárias.

### Princípios inegociáveis

- Reutilizar ao máximo a infraestrutura já existente do SaaSude/TegLion.
- Evitar criar mecanismos novos quando já houver um padrão reutilizável.
- Preservar a arquitectura actual de monólito modular, backend Express, Supabase e frontend React.
- Manter multi-tenant, RLS, audit trail e guards como defesa em profundidade.
- Não quebrar funcionalidades existentes de clientes, documentos, obrigações, mensagens, billing e portal.

### Resultado esperado da Sprint 0.9

Ao final da sprint, um escritório deve conseguir:

- criar funcionários;
- organizar funcionários por departamentos;
- atribuir roles;
- atribuir permissões;
- enviar convites;
- confirmar e-mail;
- criar senha;
- realizar primeiro acesso;
- auditar todas as ações relevantes.

---

## 1. Fase 1 - Estrutura de domínio

### Objectivo

Definir a modelagem de negócio para equipas sem duplicar o modelo actual de utilizadores, convites e segurança.

### Entidades reutilizadas

- `firms` como tenant root.
- `firm_users` como base de funcionários.
- `client_invites` como padrão operacional de convite e expiração.
- `audit_logs` como trilho de auditoria sensível.
- `auth_refresh_sessions` como sessão e revogação.
- `user_legal_consents` como base para rastreabilidade de consentimento.
- `firm settings` e perfil do escritório como ponto de entrada de gestão.

### Entidades a criar

- `departments` como entidade separada da role.
- `firm_member_permissions` apenas se a matriz de permissões precisar ser customizável por membro.
- `firm_member_invites` apenas se o padrão `client_invites` não for suficiente para convites de funcionários. A recomendação da arquitectura é evitar criar isto se `client_invites` puder ser generalizado conceptualmente.

### Modelo funcional recomendado

#### Roles

Roles representam apenas nível de acesso:

- `FIRM_OWNER`
- `FIRM_ADMIN`
- `FIRM_STAFF`
- `FIRM_READONLY`
- `CLIENT`

#### Departamentos

Departamentos representam organização interna, não acesso:

- Fiscal
- Contabilidade
- Departamento Pessoal
- Administrativo
- outros departamentos personalizados por escritório

#### Relação entre entidades

- `firm_users.role` define nível de acesso.
- `firm_users.department_id` define organização interna.
- permissões podem ser herdadas por role, refinadas por departamento, e auditadas por mutação.

### Saída da fase

- Modelo conceptual fechado.
- Decisão formal sobre se permissões serão apenas por role ou se haverá override por membro.
- Lista mínima de tabelas novas, se inevitáveis.

---

## 2. Fase 2 - Backend

### Objectivo

Reusar a camada atual de auth, RBAC, guards, convites e auditoria para suportar gestão de equipas.

### Endpoints reutilizados

#### Autenticação

- `POST /api/auth/login-firm`
- `POST /api/auth/login-client`
- `POST /api/auth/register-client-invite`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `POST /api/auth/recover`
- `POST /api/auth/reset`
- `POST /api/auth/validate-reset-token`
- `POST /api/auth/complete-onboarding`

#### Escritório

- `GET /api/contabil/firm/staff`
- `GET /api/contabil/firm/settings`
- `PATCH /api/contabil/firm/profile`
- `POST /api/contabil/firm/logo`
- `POST /api/contabil/firm/close`
- `POST /api/contabil/invites`
- `GET /api/public/client-invite/:token`

#### Auditoria e segurança já presentes como base

- login success/failure audit
- auth lockout audit
- document access audit
- client hub access audit
- mutation audit para settings, clients, documents, obligations e team-related events

### Endpoints novos

A recomendação é criar o mínimo necessário:

#### Gestão de membros

- `GET /api/contabil/team`
- `POST /api/contabil/team`
- `GET /api/contabil/team/:id`
- `PATCH /api/contabil/team/:id`
- `DELETE /api/contabil/team/:id`
- `POST /api/contabil/team/:id/resend-invite`
- `POST /api/contabil/team/:id/revoke-invite`
- `POST /api/contabil/team/:id/deactivate`
- `POST /api/contabil/team/:id/reactivate`

#### Gestão de departamentos

- `GET /api/contabil/departments`
- `POST /api/contabil/departments`
- `PATCH /api/contabil/departments/:id`
- `DELETE /api/contabil/departments/:id`

#### Permissões

- `GET /api/contabil/team/permissions`
- `PATCH /api/contabil/team/:id/permissions`

#### Convites

- `POST /api/contabil/team/invites`
- `GET /api/contabil/team/invites/:token`
- `POST /api/contabil/team/invites/:token/accept`

### Serviços reutilizados

- `backend/src/modules/auth/contabil-auth.service.js`
- `backend/src/modules/firm/invites.service.js`
- `backend/src/modules/firm/firm-settings.service.js`
- `backend/src/services/audit/security-audit.service.js`
- `backend/src/services/notifications/contabil-notifications.service.js`
- `backend/src/services/email/brevo-email.service.js`
- `backend/src/utils/permissions.js`
- `backend/src/utils/session-user.js`
- `backend/src/utils/contabil-scope.js`
- `backend/src/utils/firm-access.js`

### Repositories reutilizados

- `firm-users.repository.js`
- `firms.repository.js`
- `invites.repository.js`
- `auth-refresh-sessions.repository.js`
- `legal-consents.repository.js`
- `login-attempts.repository.js`
- `audit.repository.js`

### Repositórios novos

Se departamentos forem implementados, será necessário criar:

- `departments.repository.js`
- possivelmente `firm-member-permissions.repository.js` se existir override por membro.

### Middlewares reutilizados

- `auth.middleware.js`
- `role.middleware.js`
- `firm-owner.middleware.js`
- `csrf.middleware.js`
- `upload.middleware.js`
- `rate limiters`
- `contabil-scope` helpers

### Guards reutilizados

- `requirePermission()`
- `requireAnyPermission()`
- `requireRole()`
- `requireFirmOwner()`
- `ProtectedRoute`
- `RequireRole`
- `RequireFirmAccess`
- `RequireClientFirmAccess`

### Policies reutilizadas

- `supabase/rls.sql`
- `supabase/policies.sql`

### Auditoria

A Sprint 0.9 deve reaproveitar `audit_logs` e expandir os eventos para cobrir:

- criação de funcionário;
- convite enviado;
- convite reenviado;
- convite revogado;
- convite aceite;
- role alterada;
- departamento alterado;
- permissões alteradas;
- funcionário desactivado;
- funcionário reactivado;
- acesso inicial concluído;
- reset de senha;
- login bem-sucedido e falhado;
- mudanças de settings associadas a equipa.

---

## 3. Fase 3 - Banco de dados

### Objectivo

Definir a evolução mínima do esquema para suportar departamentos e gestão de membros sem degradar o modelo actual.

### Tabelas reutilizadas

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

### Tabelas novas, se necessário

#### `departments`

Uso: entidade organizacional do escritório.

Campos conceptuais:

- `id`
- `firm_id`
- `name`
- `code`
- `color`
- `is_default`
- `is_active`
- `created_at`
- `updated_at`

#### Extensões possíveis em `firm_users`

- `department_id`
- `invited_by`
- `invited_at`
- `invite_status`
- `permissions_snapshot` apenas se for necessário congelar uma política de acesso no momento do convite

### Migrations

A ordem recomendada é:

1. migration de `departments`;
2. migration de `department_id` em `firm_users`;
3. migration de índices compostos;
4. migration de policies RLS;
5. migration de campos de auditoria e convite, se necessários.

### Índices

Índices recomendados:

- `departments(firm_id, is_active)`
- `departments(firm_id, name)`
- `firm_users(firm_id, role)`
- `firm_users(firm_id, department_id)`
- `firm_users(firm_id, is_active)`
- `client_invites(firm_id, status)`
- `client_invites(firm_id, created_by)`
- `audit_logs(firm_id, actor_role, created_at desc)`
- `audit_logs(firm_id, entity_type, entity_id)`

### RLS

RLS deve continuar a aplicar:

- tenant isolation por `firm_id`;
- acesso de cliente apenas ao seu `client_id`;
- staff do escritório apenas ao seu tenant;
- owner com escopo total do seu tenant;
- departments sempre filtrados por `firm_id`.

### Policies

Novas policies, se a tabela `departments` existir:

- staff do tenant pode ver departamentos do seu escritório;
- owner/admin podem gerir departamentos;
- readonly pode apenas ver;
- cliente não deve ter acesso à entidade de departamentos do escritório.

---

## 4. Fase 4 - Frontend

### Objectivo

Reutilizar a UI do SaaSude/TegLion para criar uma experiência consistente de gestão de equipas.

### Estrutura completa das telas

## Gestão de Funcionários

### Lista

- lista paginada de membros;
- filtros por role;
- filtros por departamento;
- filtros por estado;
- pesquisa por nome/email;
- ações rápidas por linha;
- badges de role e departamento.

### Criar

- wizard de criação;
- nome;
- e-mail;
- role;
- departamento;
- permissões;
- opção de enviar convite imediato.

### Editar

- editar dados do membro;
- alterar role;
- alterar departamento;
- alterar permissões;
- desactivar/reactivar;
- reenviar convite.

### Convite

- estado do convite;
- expiração;
- reenviar;
- revogar;
- copiar link apenas em contexto administrativo.

### Permissões

- matriz visual por módulos;
- marcação por role;
- eventual override por membro, se existir no backend;
- bloqueio de acções irreversíveis sem owner.

### Departamentos

- lista de departamentos;
- criar novo departamento;
- editar nome/cor;
- definir default;
- activar/desactivar;
- número de membros por departamento.

### Detalhes

- resumo do membro;
- role;
- departamento;
- estado do convite;
- auditoria recente;
- permissões atribuídas;
- histórico de alterações.

### Telas reutilizadas

- Settings do escritório;
- Team section;
- diálogo de convite de cliente;
- dashboard cards;
- tabela de membros;
- modais de detalhe;
- side panels já usados em obrigações, tarefas e client hub.

---

## 5. Fase 5 - Fluxo completo

### Fluxo desejado

Owner

↓

Criar Funcionário

↓

Selecionar Departamento

↓

Selecionar Role

↓

Selecionar Permissões

↓

Enviar Convite

↓

Funcionário recebe e-mail

↓

Confirma e-mail

↓

Cria senha

↓

Primeiro acesso

↓

Auditoria registrada

### Fluxo técnico já existente que deve ser reaproveitado

- convite;
- preview do convite;
- expiração de convite;
- validação de e-mail;
- reset de senha;
- login com cookies httpOnly;
- refresh session;
- auditoria de login e mutações sensíveis.

### Observações de arquitectura

- o primeiro acesso deve funcionar com senha ou SSO, conforme política do escritório;
- o convite deve carregar contexto suficiente para ligar membro, role e departamento;
- o fluxo precisa ser idempotente e auditável;
- revogação de convite deve invalidar o token imediatamente.

---

## 6. Fase 6 - Permissões

### Objectivo

Montar a matriz completa por módulo, usando as permissões existentes como base e criando apenas as que realmente faltam para equipa e departamentos.

### Matriz por módulo

#### Clientes

- visualizar
- criar
- editar
- excluir
- convidar ao portal
- ver histórico
- transferir responsável

**Reutiliza:** `FIRM_CLIENTS_VIEW`, `FIRM_CLIENTS_MANAGE`, `USERS_CREATE`.

#### Obrigações

- visualizar
- criar
- editar
- concluir
- excluir
- atribuir responsável
- reabrir

**Reutiliza:** `FIRM_OBLIGATIONS_MANAGE`.

#### Agenda Fiscal

- visualizar
- editar
- criar notas
- validar notas
- gerir alertas

**Reutiliza:** `FIRM_OBLIGATIONS_MANAGE`, `FIRM_CONSULTATIONS_MANAGE`.

#### Documentos

- visualizar
- enviar
- descarregar
- validar
- excluir
- reenviar pedido
- ver auditoria do documento

**Reutiliza:** `FIRM_DOCUMENTS_MANAGE`.

#### Mensagens

- visualizar
- enviar
- editar mensagem própria se permitido
- converter em pedido
- revogar/encaminhar

**Reutiliza:** `FIRM_MESSAGES_MANAGE`.

#### Configurações

- visualizar
- editar dados do escritório
- editar branding
- gerir billing
- gerir integrações
- gerir assinatura

**Reutiliza:** `FIRM_SETTINGS_MANAGE`, `FIRM_BILLING_MANAGE`.

#### Funcionários

- visualizar
- convidar
- editar role
- editar departamento
- editar permissões
- desactivar
- reactivar
- revogar convite
- reenviar convite

**Reutiliza:** `USERS_READ`, `USERS_CREATE`, `USERS_UPDATE`, `USERS_DELETE`, `FIRM_TEAM_MANAGE`.

#### Departamentos

- visualizar
- criar
- editar
- desactivar
- definir default
- atribuir membros

**Provavelmente nova permissão:** `FIRM_DEPARTMENTS_MANAGE`.

#### Relatórios

- visualizar
- exportar
- consultar auditoria
- filtrar por departamento
- filtrar por role

**Reutiliza:** `FIRM_REPORTS_VIEW`.

#### Dashboard

- visualizar KPIs
- filtrar por departamento
- filtrar por utilizador
- ver alertas críticos
- ver pendências

**Reutiliza:** `FIRM_CLIENTS_MANAGE` em parte, mas idealmente o dashboard deve ganhar uma permissão própria de leitura operacional se o produto quiser separar acesso de execução.

#### Notificações

- visualizar
- marcar como lida
- marcar todas como lidas
- configurar canais
- gerir push

**Reutiliza:** `FIRM_CLIENTS_MANAGE` hoje, mas pode vir a merecer permissão própria.

### Permissões novas mínimas recomendadas

- `FIRM_DEPARTMENTS_MANAGE`
- `FIRM_INVITES_MANAGE`
- `FIRM_MEMBER_ROLE_MANAGE`
- `FIRM_MEMBER_DEPARTMENT_MANAGE`
- `FIRM_MEMBER_PERMISSION_MANAGE`
- `FIRM_TEAM_AUDIT_VIEW` se o histórico da equipa ficar separado da auditoria geral

### Recomendação de desenho

- começar com permissões por role;
- permitir override por membro apenas se o mercado pedir;
- não criar granularidade excessiva no arranque.

---

## 7. Fase 7 - UX

### Objectivo

Reutilizar o máximo possível das telas já existentes do SaaSude, mantendo identidade visual consistente e reduzindo curva de aprendizagem.

### Componentes e padrões reutilizáveis

- `FirmSettingsPage` como shell inicial da área de gestão;
- `FirmSettingsTeamSection` como base de listagem de equipa;
- `FirmClientInviteButton` como padrão de convite;
- `ProtectedRoute` e `RequireRole` como guards;
- `RequireFirmAccess` para estado do tenant;
- `RequireClientFirmAccess` como referência de controlo por vínculo;
- modais, dialogs, drawers e tables já presentes em documentos, tarefas e client hub;
- badges de estado, pills e cards já consolidados no design system.

### Direcção visual

- manter o mesmo sistema de spacing, cards e bordas do app atual;
- não introduzir uma linguagem visual nova para gestão de equipas;
- usar tabelas densas, legíveis e operacionais;
- usar modais apenas para acções secundárias;
- usar página dedicada para fluxo de criação e edição principal;
- manter consistência de labels, CTAs e estados vazios.

### Mapeamento de reutilização por tela

#### Lista de funcionários

Reutiliza:

- layout de settings;
- tabela já usada em módulos operacionais;
- badges de role;
- filtros inline.

#### Criar/Editar funcionário

Reutiliza:

- form patterns do register/login;
- select e inputs do design system;
- validação já usada no onboarding.

#### Convite

Reutiliza:

- fluxo visual do convite de cliente;
- dialog do link;
- copy-to-clipboard;
- share fallback;
- mensagem de expiração.

#### Permissões

Reutiliza:

- cards e seções do settings;
- checklists e toggles já usados em outras partes do produto.

#### Departamentos

Reutiliza:

- table + modal pattern;
- cores e chips já usados no calendário/tarefas.

### Resultado esperado de UX

- o escritório reconhece a área como parte do TegLion existente;
- não há quebra de linguagem visual;
- o fluxo de convite e primeiro acesso é simples e previsível;
- o owner entende o que é role, o que é departamento e o que é permissão.

---

## 8. Fase 8 - Segurança

### Objectivo

Validar todos os pontos críticos de segurança antes de considerar a funcionalidade pronta para produção.

### Itens de validação

#### Confirmação obrigatória de e-mail

- convite deve exigir confirmação de e-mail;
- o token deve expirar;
- o token deve ser de uso único.

#### Redefinição de senha

- reset já existe e deve ser reaproveitado;
- novo membro deve entrar em fluxo de definição de senha seguro;
- sessões antigas devem ser revogadas quando necessário.

#### Expiração de convites

- convite vencido deixa de funcionar;
- convite revogado deixa de funcionar;
- convite aceite deixa de ser reutilizável.

#### Revogação de acesso

- desactivar utilizador invalida sessão;
- revogar convite invalida o token;
- remover acesso deve ser auditado.

#### Bloqueio de utilizador

- lockout por brute force já existe como conceito;
- deve ser mantido e auditado;
- deve ser compatível com funcionários e clientes.

#### Auditoria

- criação de funcionário;
- convite enviado;
- convite aceite;
- role alterada;
- departamento alterado;
- permissões alteradas;
- acesso desactivado;
- acesso reactivado;
- login falhado;
- login bloqueado;
- reset de senha.

#### Logs

- registar actor;
- registar tenant;
- registar timestamp;
- registar IP / user-agent quando aplicável;
- redigir dados sensíveis.

#### Rastreabilidade

- tudo o que mexe em acesso precisa de trilha consultável;
- histórico do membro deve ficar visível no painel de detalhe;
- alterações de permissão e departamento precisam de contexto de quem alterou e porquê.

#### LGPD / GDPR

- minimização de dados nos logs;
- consentimentos rastreáveis;
- direito ao esquecimento conforme aplicável;
- auditoria sem expor PII desnecessária;
- políticas de retenção e acesso por tenant.

### Reaproveitamento de segurança já existente

- `security-audit.service.js`
- `audit_logs`
- `auth_refresh_sessions`
- `auth_login_attempts`
- `password_reset_tokens`
- `legal consents`
- CSRF + httpOnly cookies
- RLS + policies

---

## 9. Fase 9 - Entrega

### Objectivo

Fechar a Sprint 0.9 com checklist explícita, priorização e dependências.

### Checklist de implementação

#### Domínio

- [ ] definir modelo final de roles
- [ ] definir modelo final de departamentos
- [ ] definir se haverá override de permissões por membro
- [ ] fechar nomenclatura oficial para Portugal e Brasil

#### Backend

- [ ] expor endpoints de gestão de equipa
- [ ] expor endpoints de departamentos
- [ ] integrar convites de funcionários
- [ ] integrar auditoria de mutações de staff
- [ ] integrar expiração e revogação de convites
- [ ] integrar primeiros acessos seguros

#### Banco de dados

- [ ] criar `departments` se necessário
- [ ] adicionar `department_id` em `firm_users` se necessário
- [ ] criar índices adequados
- [ ] ajustar RLS e policies
- [ ] garantir compatibilidade com tenants existentes

#### Frontend

- [ ] tela de lista de funcionários
- [ ] tela de criar funcionário
- [ ] tela de editar funcionário
- [ ] tela de convite
- [ ] tela de permissões
- [ ] tela de departamentos
- [ ] tela de detalhe/histórico
- [ ] manter identidade visual do SaaSude

#### Segurança

- [ ] auditar convite de funcionário
- [ ] auditar alteração de role
- [ ] auditar alteração de departamento
- [ ] auditar alteração de permissões
- [ ] auditar bloqueio/desbloqueio
- [ ] validar expiração de convite
- [ ] validar revogação de acesso
- [ ] validar LGPD/GDPR

### Matriz de priorização

| Item | Prioridade | Impacto | Risco | Dependências |
|------|------------|---------|-------|--------------|
| Modelo de roles finais | P0 | Alto | Médio | Domínio, auth, UX |
| Departamentos | P0 | Alto | Médio | Modelo de domínio |
| Convites de funcionários | P0 | Alto | Médio | Auth, email, auditoria |
| Auditoria de acesso | P0 | Alto | Alto | Logging, data model |
| Lista de funcionários | P0 | Alto | Baixo | UI, backend list endpoint |
| Criar/editar funcionário | P0 | Alto | Médio | RBAC, form validation |
| Alterar role/departamento | P1 | Alto | Médio | Modelo final de permissões |
| Permissões por módulo | P1 | Alto | Médio | Matriz funcional fechada |
| Primeiro acesso seguro | P1 | Alto | Médio | Auth, reset, invite token |
| Revogação e bloqueio | P1 | Alto | Médio | Session mgmt, audit |
| Dashboard de equipa | P2 | Médio | Baixo | Metrics, UX |
| Histórico e relatórios | P2 | Médio | Médio | Audit data, filters |

### Dependências críticas

- modelo final de roles e departamentos;
- decisão sobre permissões por membro;
- compatibilidade com tenants existentes;
- fluxo de email e token;
- critérios de auditoria;
- aceitação visual da área de gestão de equipas.

---

## Conclusão da Sprint 0.9

A Sprint 0.9 deve transformar a infraestrutura já existente em produto de gestão de equipas, sem reinventar a base técnica do TegLion.

A decisão arquitectural recomendada é:

- manter roles poucas e claras;
- separar departamentos de roles;
- reaproveitar convites, auth, audit e guards existentes;
- expor só os endpoints mínimos necessários;
- manter a UI alinhada com o SaaSude/TegLion actual;
- garantir auditoria e rastreabilidade desde o primeiro dia.

Este documento é a base oficial para implementação faseada e validação incremental da funcionalidade de Gestão de Equipas na Sprint 0.9.
