# BACKEND_JAVA_BLUEPRINT

Especificação funcional oficial para reescrita do backend Teglion em Java com Spring Boot.

Escopo desta blueprint:
- Engenharia reversa do backend atual (Express + Supabase + integrações).
- Extração de lógica de negócio independente de linguagem.
- Base funcional para implementação limpa em Java.

Fora de escopo desta blueprint:
- Conversão direta de ficheiros JavaScript para Java.
- Geração de código Java, classes, controllers, services ou repositories.

---

# 1. Visão Geral do Sistema

## 1.1 Objetivo do Teglion
O Teglion é uma plataforma B2B2C para escritórios de contabilidade operarem a relação com os seus clientes finais, com foco em:
- gestão de clientes, equipa e permissões;
- gestão de obrigações fiscais e tarefas operacionais;
- gestão documental e pedidos formais de documentos;
- comunicação escritório-cliente (mensagens, alertas, notificações);
- portal self-service para cliente final;
- subscrição e billing por firma;
- automações operacionais e lembretes.
- IA Maya

## 1.2 Arquitetura atual
Arquitetura lógica atual:
- API HTTP: Express.
- Prefixos principais: /api/v1 e /api (legado/deprecated), com áreas /auth, /public, /contabil, /client-portal.
- Camadas: Route -> Controller -> Service -> Repository.
- Persistência: Supabase Postgres (com RLS/policies no SQL) e Supabase Storage.
- Autenticação: JWT access + refresh em cookies HTTP-only, com CSRF.
- Autorização: matriz de permissões por role + overrides por membro.
- Observabilidade e segurança: logs sanitizados, auditoria de segurança, Sentry opcional.
- Scheduling: timers internos + endpoints cron protegidos por segredo.
- Fila assíncrona leve: Redis opcional (com fallback inline).

## 1.3 Principais módulos
- Auth e sessão.
- Billing e acesso da firma.
- Administração da firma (settings, branding, encerramento).
- Clientes e convites.
- Equipa, departamentos e permissões.
- Obrigações fiscais e calendário fiscal.
- Tarefas operacionais.
- Documentos.
- Pedidos de documentos.
- Mensagens e inbox.
- Portal do cliente.
- Catálogo de serviços, booking e consultas.
- Broadcasts e News.
- Notificações, Live polling, Push e Tracking.
- Service Requests.
- Automações, cron e jobs.
- Público, Legal e integrações auxiliares.

## 1.4 Fluxo geral do sistema
Fluxo macro de negócio:
1. Firma regista-se e ativa sessão.
2. Billing define elegibilidade operacional da firma (trial/subscription).
3. Firma configura dados, equipa e catálogo.
4. Firma cadastra clientes e convida para portal.
5. Firma opera obrigações, tarefas, documentos e mensagens.
6. Cliente interage via portal (upload, tarefas, mensagens, aprovações, booking).
7. Sistema dispara notificações, reminders e automações.
8. Gestão acompanha dashboards, tracking e analytics operacionais.

## 1.5 Domínios (Bounded Contexts)
Bounded contexts recomendados para a nova arquitetura Java:
- Identity & Access.
- Subscription & Tenant Lifecycle.
- Firm Administration.
- Client Portfolio.
- Fiscal Operations.
- Work Management.
- Document Management.
- Communication.
- Client Experience Portal.
- Engagement & Notification.
- Service Commerce.
- Automation & Scheduling.
- Public Support & Legal.
- Platform Security & Observability.

---

# 2. Inventário Completo dos Módulos

## 2.1 Auth e Sessão
- Nome: Auth.
- Objetivo: autenticar staff e clientes, gerir sessão, recuperação de password, SSO Google.
- Responsabilidades:
  - login/logout/refresh/me;
  - registo de firma e registo por convite de cliente;
  - reset de password;
  - onboarding;
  - SSO Google.
- Dependências: billing access, legal consents, firm/users/clients repositories, cookies/CSRF, JWT.
- Entidades envolvidas: firm_users, clients, auth_refresh_sessions, password_reset_tokens, auth_login_attempts, user_legal_consents.
- Integrações externas: Google OAuth, Brevo email, Supabase.
- Ordem recomendada Java: 1.

## 2.2 Billing e Acesso da Firma
- Nome: Billing.
- Objetivo: controlar trial/subscription e desbloqueio operacional da firma.
- Responsabilidades:
  - status de billing;
  - checkout e portal Stripe;
  - webhook idempotente de Stripe;
  - mapeamento de estado de subscrição para estado da firma.
- Dependências: firms repository, stripe webhook repository, middleware owner, gate active firm.
- Entidades envolvidas: firms, stripe_webhook_events.
- Integrações externas: Stripe.
- Ordem recomendada Java: 2.

## 2.3 Administração da Firma
- Nome: Firm Administration.
- Objetivo: gerir dados institucionais, perfil e branding.
- Responsabilidades:
  - leitura e edição de settings;
  - edição de perfil do membro;
  - upload/remoção de logo;
  - encerramento da conta.
- Dependências: auth, team, storage, auditoria.
- Entidades envolvidas: firms, firm_users, auth_refresh_sessions.
- Integrações externas: Supabase Storage.
- Ordem recomendada Java: 3.

## 2.4 Clientes e Convites
- Nome: Client Portfolio.
- Objetivo: gerir carteira de clientes e onboarding para portal.
- Responsabilidades:
  - CRUD lógico de clientes;
  - validação NIF;
  - convites de cliente;
  - hub de cliente.
- Dependências: documents, tasks, obligations, messages.
- Entidades envolvidas: clients, client_invites, conversations, messages.
- Integrações externas: Brevo email.
- Ordem recomendada Java: 4.

## 2.5 Equipa, Departamentos e Permissões
- Nome: Team Management.
- Objetivo: gerir membros internos, convites da equipa e permissões granulares.
- Responsabilidades:
  - CRUD de membros;
  - convite/aceitação/confirmação de email;
  - gestão de departamentos;
  - overrides de permissões.
- Dependências: auth, permissions, auditoria, notificações.
- Entidades envolvidas: firm_users, departments, firm_member_invites, email_confirmation_tokens.
- Integrações externas: Brevo email.
- Ordem recomendada Java: 5.

## 2.6 Obrigações Fiscais e Calendário
- Nome: Fiscal Operations.
- Objetivo: gerir obrigações fiscais, templates/recorrências e calendário fiscal.
- Responsabilidades:
  - dashboard e lista de obrigações;
  - CRUD de obrigações;
  - guias e timeline;
  - templates e recorrência;
  - exclusões mensais;
  - calendário e notas.
- Dependências: tasks, documents, notifications, tracking.
- Entidades envolvidas: obligations, obligation_templates, obligation_recurrence_rules, task_month_exclusions, content_views.
- Integrações externas: storage, SMS/email reminders.
- Ordem recomendada Java: 6.

## 2.7 Tarefas Operacionais
- Nome: Work Management.
- Objetivo: gerir tarefas cliente/firma, comentários, anexos e recorrências internas.
- Responsabilidades:
  - workspace e métricas;
  - CRUD operacional de tarefas;
  - comentários e anexos;
  - automação por eventos documentais;
  - scheduler de recorrência.
- Dependências: clients, obligations, documents, notifications.
- Entidades envolvidas: client_tasks, task_comments, task_recurring_rules.
- Integrações externas: storage, SMS/email (conforme regra).
- Ordem recomendada Java: 7.

## 2.8 Documentos
- Nome: Document Management.
- Objetivo: gestão de upload, validação, preview/download e histórico documental.
- Responsabilidades:
  - uploads (portal/firma);
  - validação e revalidação;
  - pedido de reenvio;
  - dedupe;
  - soft delete;
  - detalhe com histórico e views.
- Dependências: obligations, tasks, document-requests, tracking.
- Entidades envolvidas: documents, audit_logs, content_views.
- Integrações externas: Supabase Storage.
- Ordem recomendada Java: 8.

## 2.9 Pedidos de Documento
- Nome: Document Request Management.
- Objetivo: formalizar e seguir pedidos documentais.
- Responsabilidades:
  - criar pedidos;
  - listar por cliente/portal;
  - marcar seen/answered/completed;
  - sincronizar com tasks.
- Dependências: messages, documents, tasks.
- Entidades envolvidas: document_requests, conversations.
- Integrações externas: nenhuma obrigatória.
- Ordem recomendada Java: 9.

## 2.10 Mensagens e Inbox
- Nome: Communication.
- Objetivo: comunicação bilateral e caixa de trabalho operacional da firma.
- Responsabilidades:
  - threads e unread summary;
  - envio/edição de mensagens;
  - conversão para pedido documental;
  - inbox agregada.
- Dependências: clients, document-requests, notifications.
- Entidades envolvidas: conversations, messages.
- Integrações externas: storage para anexos.
- Ordem recomendada Java: 10.

## 2.11 Portal do Cliente
- Nome: Client Experience Portal.
- Objetivo: fachada de autosserviço do cliente.
- Responsabilidades:
  - hub/dashboard;
  - documentos, tarefas, obrigações e mensagens;
  - notificações, alerts/news, service requests, booking;
  - tracking de visualização.
- Dependências: quase todos os módulos core.
- Entidades envolvidas: agregados de client, obligations, tasks, documents, messages, consultations, notifications.
- Integrações externas: storage, push.
- Ordem recomendada Java: 11.

## 2.12 Catálogo, Booking e Consultas
- Nome: Service Catalog & Scheduling.
- Objetivo: gerir portefólio de serviços e marcações.
- Responsabilidades:
  - catálogo de serviços;
  - settings de booking;
  - slots;
  - consultas (portal e backoffice).
- Dependências: clients, firm settings, notifications.
- Entidades envolvidas: accounting_services, consultations, firms.settings.booking.
- Integrações externas: email de notificação.
- Ordem recomendada Java: 12.

## 2.13 Broadcasts e News
- Nome: Engagement Content.
- Objetivo: comunicação massiva e conteúdo editorial para clientes.
- Responsabilidades:
  - broadcasts com analytics e read receipts;
  - news/articles com cover e templates;
  - feed de consumo no portal.
- Dependências: notifications, clients, portal.
- Entidades envolvidas: firm_broadcasts, firm_broadcast_reads, news_articles.
- Integrações externas: storage para covers.
- Ordem recomendada Java: 13.

## 2.14 Notificações, Live, Push e Tracking
- Nome: Engagement Signals.
- Objetivo: distribuição de sinais operacionais e telemetria de consumo.
- Responsabilidades:
  - notificações in-app (firma/cliente);
  - live polling;
  - subscriptions push;
  - tracking de views e logs SMS.
- Dependências: messages, obligations, tasks, documents.
- Entidades envolvidas: in_app_notifications, firm_notifications, push_subscriptions, content_views, sms_logs.
- Integrações externas: Web Push, Brevo SMS.
- Ordem recomendada Java: 14.

## 2.15 Service Requests
- Nome: Service Request Pipeline.
- Objetivo: pipeline de pedidos adicionais com quote e aprovação.
- Responsabilidades:
  - criação e gestão de pedidos;
  - comentários;
  - quote;
  - aprovação no portal.
- Dependências: clients, accounting services, notifications.
- Entidades envolvidas: service_requests, service_request_comments.
- Integrações externas: notificações internas.
- Ordem recomendada Java: 15.

## 2.16 Automações, Cron e Jobs
- Nome: Automation & Scheduling.
- Objetivo: automatizar ações operacionais recorrentes.
- Responsabilidades:
  - regras de automação por firma;
  - execução manual e por cron;
  - scheduler de recorrência interna;
  - reminders de obrigações;
  - fila leve redis.
- Dependências: obligations, tasks, notifications, messaging.
- Entidades envolvidas: task_automation_rules, task_recurring_rules, client_tasks, obligations.
- Integrações externas: Redis, Brevo SMS/email.
- Ordem recomendada Java: 16.

## 2.17 Público, Legal e Integrações Auxiliares
- Nome: Public Support & Legal.
- Objetivo: fornecer endpoints públicos de suporte ao onboarding e operações.
- Responsabilidades:
  - legal versions;
  - countries e postal lookup;
  - branding público;
  - newsletter;
  - health/integration status;
  - estado de integração AT (deep links).
- Dependências: firm branding, legal consents, config de países.
- Entidades envolvidas: user_legal_consents, blog_newsletter_subscribers, firms.
- Integrações externas: GeoAPI PT, ViaCEP BR, Brevo email, deep links AT.
- Ordem recomendada Java: 17.

---

# 3. Catálogo Completo de Casos de Uso

Regra de identificação:
- Caso de uso definido por algoritmo de negócio completo.
- Endpoints semelhantes do mesmo algoritmo foram agrupados para evitar repetição artificial.
- Não há omissão funcional: cada algoritmo abaixo cobre explicitamente os endpoints/ações equivalentes.

## 3.1 Casos de Uso Canónicos
- A1 Autenticação de utilizador (staff ou cliente)
- A2 Registo de firma (password ou Google)
- A3 Onboarding de cliente por convite
- A4 Gestão de sessão (refresh, logout, me)
- A5 Recuperação de password
- A6 SSO Google (status, start, callback, pending)
- B1 Billing da firma e reconciliação Stripe
- F1 Gestão administrativa da firma
- C1 Gestão de clientes e convites
- T1 Gestão de equipa, convites, departamentos e permissões
- O1 Operação fiscal: obrigações, templates, calendário e ações do cliente
- K1 Gestão operacional de tarefas
- D1 Gestão documental
- R1 Pedidos de documentos
- M1 Comunicação e inbox
- P1 Fachada do portal do cliente
- S1 Catálogo, booking e consultas
- E1 Engagement de conteúdo (Broadcasts e News)
- G1 Sinais operacionais: notificações, live, push e tracking
- Q1 Pipeline de Service Requests
- U1 Automações, cron e jobs internos
- V1 Serviços públicos, legal e integrações auxiliares

## 3.2 Matriz de Cobertura (Sem Omissões)

### A1
Cobre: AUTH-UC-001, AUTH-UC-002

### A2
Cobre: AUTH-UC-003, AUTH-UC-004

### A3
Cobre: AUTH-UC-005

### A4
Cobre: AUTH-UC-006, AUTH-UC-007, AUTH-UC-008, AUTH-UC-009

### A5
Cobre: AUTH-UC-010, AUTH-UC-011, AUTH-UC-012

### A6
Cobre: AUTH-UC-013, AUTH-UC-014, AUTH-UC-015

### B1
Cobre: BILL-UC-001, BILL-UC-002, BILL-UC-003, BILL-UC-004

### F1
Cobre: FIRM-UC-001, FIRM-UC-002, FIRM-UC-003, FIRM-UC-004, FIRM-UC-005, FIRM-UC-006, FIRM-UC-007

### C1
Cobre: CLIENT-UC-001, CLIENT-UC-002, CLIENT-UC-003, CLIENT-UC-004, CLIENT-UC-005, CLIENT-UC-006, CLIENT-UC-007, CLIENT-UC-008, CLIENT-UC-009

### T1
Cobre: TEAM-UC-001 até TEAM-UC-018

### O1
Cobre: OBL-UC-001 até OBL-UC-022

### K1
Cobre: TASK-UC-001 até TASK-UC-017

### D1
Cobre: DOC-UC-001 até DOC-UC-012

### R1
Cobre: DREQ-UC-001 até DREQ-UC-005

### M1
Cobre: MSG-UC-001 até MSG-UC-012

### P1
Cobre: PORTAL-UC-001 até PORTAL-UC-009

### S1
Cobre: SCHED-UC-001 até SCHED-UC-015

### E1
Cobre: BRDC-UC-001 até BRDC-UC-006 e NEWS-UC-001 até NEWS-UC-006

### G1
Cobre: SIG-UC-001 até SIG-UC-015

### Q1
Cobre: SRQ-UC-001 até SRQ-UC-010

### U1
Cobre: AUTO-UC-001 até AUTO-UC-009

### V1
Cobre: PUB-UC-001 até PUB-UC-010

---

# 4. Especificação Completa de Cada Caso de Uso

Nota de legibilidade:
- Para manter o documento utilizável, os casos com o mesmo algoritmo e variação apenas de ator/canal foram consolidados em especificações canónicas.
- A cobertura funcional de todos os itens do Catálogo (Secção 3) está mapeada para as especificações abaixo.

## Especificação Canónica A1 (cobre AUTH-UC-001, AUTH-UC-002)

----------------------------------------

Identificador
A1

Nome
Autenticação de utilizador (staff ou cliente)

Objetivo
Autenticar utilizador e iniciar sessão segura com tokens e contexto de tenant.

Descrição
Executa login por credenciais, valida políticas de segurança, calcula escopo de acesso e cria sessão persistente de refresh.

Atores
- Utilizador staff da firma.
- Cliente final do portal.

Entradas
- email
- password
- rememberMe (opcional)
- firmSlug (opcional para cliente)
- contexto HTTP (IP, user-agent)

Saídas
- user público autenticado
- cookies de access/refresh token
- firmAccess (para staff)

Pré-condições
- Conta existente.
- Conta ativa.
- Configuração JWT carregada.

Pós-condições
- Sessão autenticada criada.
- refresh session persistida.
- tentativa de login resetada em caso de sucesso.

Fluxo Principal
1. Receber payload e normalizar email.
2. Aplicar rate-limit e verificar lockout.
3. Resolver conta por tipo de ator.
4. Validar estado da conta e, para staff, confirmação de email.
5. Validar password.
6. Para staff, validar acesso da firma (trial/subscription/status).
7. Gerar access token e refresh token.
8. Persistir refresh session com jti/hash.
9. Definir cookies e devolver utilizador público.
10. Registrar auditoria de sucesso.

Fluxos Alternativos
- Conta inexistente: responder erro genérico e registrar falha.
- Password inválida: incrementar contador e eventualmente bloquear.
- Conta SSO sem password: devolver erro SSO obrigatório.
- Cliente sem firmSlug e com múltiplas firmas: devolver conflito de ambiguidade.

Validações
- formato de email
- password não vazia
- lockout de login
- estado ativo
- email confirmado para staff

Regras de Negócio
- Cookies são o canal primário de autenticação.
- Staff depende do estado operacional da firma.
- Cliente só entra se tiver vínculo válido.

Permissões Necessárias
Acesso público (com rate-limit).

Entidades Utilizadas
- firm_users
- clients
- auth_refresh_sessions
- auth_login_attempts
- firms

Repositórios envolvidos
- firm-users.repository
- clients.repository
- auth-refresh-sessions.repository
- login-attempts.repository
- firms.repository

Integrações externas
- JWT
- Supabase

Eventos disparados
- AUTH_LOGIN_SUCCESS
- AUTH_LOGIN_FAILED

Auditoria
- Registro de sucesso/falha de login com escopo, actor e tenant.

Logs
- warning para falhas de autenticação
- info para sucesso

Exceções possíveis
- credenciais inválidas
- conta inativa
- email não confirmado
- trial expirado
- ambiguidade de firma

Impacto em outros módulos
- Habilita consumo de todos os módulos autenticados.

Observações técnicas
- Implementar como caso de uso transacional curto com policy engine de autenticação.

----------------------------------------

## Especificação Canónica A2 (cobre AUTH-UC-003, AUTH-UC-004)

----------------------------------------

Identificador
A2

Nome
Registo de firma (password ou Google)

Objetivo
Criar tenant de firma, owner inicial, consentimentos legais e sessão autenticada.

Descrição
Onboarding completo da firma com seed operacional inicial.

Atores
- Visitante público

Entradas
- firmName
- ownerName
- email
- password (no fluxo password)
- google identity (no fluxo SSO)
- countryCode
- legalConsents

Saídas
- user autenticado
- sessão ativa

Pré-condições
- email ainda não usado em firm_users
- consentimentos legais válidos

Pós-condições
- firma criada
- owner criado
- consentimentos gravados
- sessão autenticada ativa

Fluxo Principal
1. Validar payload legal e dados base.
2. Resolver país e gerar slug único.
3. Criar firma.
4. Semear configuração inicial de booking.
5. Semear catálogo padrão de serviços.
6. Criar owner (password hash ou vínculo SSO).
7. Gravar consentimentos legais com metadados de origem.
8. Emitir sessão autenticada.

Fluxos Alternativos
- Seed de catálogo/settings falha: continuar registo e sinalizar degradação operacional.
- Sessão Google pendente inválida: exigir reinício de SSO.

Validações
- email válido e único
- password forte (quando aplicável)
- consentimentos obrigatórios

Regras de Negócio
- Registo exige aceitação legal atual.
- Firma nasce com owner e configuração mínima.

Permissões Necessárias
Acesso público com rate-limit.

Entidades Utilizadas
- firms
- firm_users
- user_legal_consents
- accounting_services

Repositórios envolvidos
- firms.repository
- firm-users.repository
- legal-consents.repository
- accounting-services.repository

Integrações externas
- Google OAuth (fluxo SSO)
- Supabase

Eventos disparados
- FIRM_REGISTERED
- LEGAL_CONSENT_RECORDED

Auditoria
- registo de criação de tenant e owner

Logs
- info de bootstrap
- erro de consistência de registo

Exceções possíveis
- email já registado
- consentimento inválido
- password fraca

Impacto em outros módulos
- cria base para billing, clientes, equipa e operação fiscal.

Observações técnicas
- modelar onboarding como saga curta com compensações em falha parcial.

----------------------------------------

## Especificação Canónica A3 (cobre AUTH-UC-005, AUTH-UC-009)

----------------------------------------

Identificador
A3

Nome
Onboarding de cliente por convite

Objetivo
Converter convite válido em conta de portal ativa.

Descrição
Recebe token de convite, valida identidade do cliente, define credenciais e inicia sessão.

Atores
- Cliente convidado

Entradas
- token
- email
- password
- fullName

Saídas
- user cliente autenticado

Pré-condições
- convite ativo e não expirado
- cliente associado ao convite

Pós-condições
- convite marcado como aceite
- credenciais definidas
- sessão de cliente ativa

Fluxo Principal
1. Validar token e carregar convite.
2. Validar email do payload contra convite.
3. Validar password forte.
4. Definir/atualizar credenciais do cliente.
5. Marcar convite como aceite.
6. Realizar login automático do cliente.

Fluxos Alternativos
- convite expirado/revogado/usado: bloquear aceitação.
- email divergente: rejeitar.

Validações
- token comprimento/estado
- email
- password

Regras de Negócio
- convite é single-use e com TTL.
- cliente só pode ativar portal com identidade do convite.

Permissões Necessárias
Acesso público com rate-limit.

Entidades Utilizadas
- client_invites
- clients
- auth_refresh_sessions

Repositórios envolvidos
- invites.repository
- clients.repository
- auth-refresh-sessions.repository

Integrações externas
- nenhuma obrigatória

Eventos disparados
- CLIENT_INVITE_ACCEPTED
- CLIENT_FIRST_LOGIN

Auditoria
- registro de aceite do convite

Logs
- warning para tentativa inválida de token

Exceções possíveis
- token inválido/expirado
- email divergente
- password fraca

Impacto em outros módulos
- desbloqueia acesso ao portal, documentos, tarefas e mensagens.

Observações técnicas
- token deve ser opaco e auditável.

----------------------------------------

## Especificação Canónica A4 (cobre AUTH-UC-006, AUTH-UC-007, AUTH-UC-008)

----------------------------------------

Identificador
A4

Nome
Gestão de sessão (refresh, logout, me)

Objetivo
Manter, encerrar e consultar sessão autenticada.

Descrição
Controla ciclo de vida da sessão com refresh token, logout seguro e endpoint de identidade atual.

Atores
- Staff autenticado
- Cliente autenticado

Entradas
- refresh token cookie
- access token cookie/header (conforme configuração)

Saídas
- sessão renovada, sessão encerrada ou user atual

Pré-condições
- sessão refresh existente para renovar

Pós-condições
- refresh renovado (refresh)
- sessão invalidada (logout)
- user público atualizado (me)

Fluxo Principal
1. Refresh: validar cookie, token e jti.
2. Verificar sessão persistida e expiração.
3. Emitir novos tokens e substituir cookies.
4. Logout: remover sessão por jti e limpar cookies.
5. Me: recarregar utilizador atual e permissões.

Fluxos Alternativos
- refresh ausente/inválido: exigir novo login.
- sessão revogada: limpar cookies e negar.

Validações
- assinatura JWT
- expiração
- existência de jti ativo

Regras de Negócio
- refresh token em cookie é obrigatório no padrão.
- logout remove sessão persistida.

Permissões Necessárias
- refresh: sessão válida
- logout/me: autenticado

Entidades Utilizadas
- auth_refresh_sessions
- firm_users
- clients

Repositórios envolvidos
- auth-refresh-sessions.repository
- firm-users.repository
- clients.repository

Integrações externas
- JWT

Eventos disparados
- SESSION_REFRESHED
- SESSION_LOGOUT

Auditoria
- refresh falhado e logout podem gerar security events.

Logs
- warning para refresh inválido

Exceções possíveis
- REFRESH_TOKEN_MISSING
- REFRESH_TOKEN_INVALID

Impacto em outros módulos
- mantém continuidade de uso de todos os módulos autenticados.

Observações técnicas
- aplicar rotação segura de refresh com invalidation antiga.

----------------------------------------

## Especificação Canónica A5 (cobre AUTH-UC-010, AUTH-UC-011, AUTH-UC-012)

----------------------------------------

Identificador
A5

Nome
Recuperação de password

Objetivo
Permitir redefinição segura de password para staff e clientes.

Descrição
Cria token de reset, valida token e aplica nova password.

Atores
- Utilizador não autenticado

Entradas
- email
- role opcional
- token reset
- newPassword

Saídas
- confirmação de envio/validação/reset

Pré-condições
- conta existente para email

Pós-condições
- password atualizada
- token invalidado
- sessões antigas encerradas quando aplicável

Fluxo Principal
1. Receber pedido de recover.
2. Gerar token e armazenar hash com TTL.
3. Enviar link por email.
4. Validar token quando solicitado.
5. Receber newPassword e validar política.
6. Atualizar hash da password.
7. Invalidar token e sessões relacionadas.

Fluxos Alternativos
- email não encontrado: resposta neutra.
- token expirado/inválido: rejeitar e pedir novo recover.

Validações
- email
- token
- password policy

Regras de Negócio
- token é de uso único.
- não armazenar token em claro.

Permissões Necessárias
Acesso público com rate-limit.

Entidades Utilizadas
- password_reset_tokens
- firm_users
- clients

Repositórios envolvidos
- password-reset.repository
- firm-users.repository
- clients.repository

Integrações externas
- Brevo email

Eventos disparados
- PASSWORD_RESET_REQUESTED
- PASSWORD_RESET_COMPLETED

Auditoria
- eventos de segurança por reset

Logs
- warning para token inválido

Exceções possíveis
- token inválido/expirado
- password fraca

Impacto em outros módulos
- reforça segurança transversal.

Observações técnicas
- separar política de password em componente reutilizável.

----------------------------------------

## Especificação Canónica A6 (cobre AUTH-UC-013, AUTH-UC-014, AUTH-UC-015)

----------------------------------------

Identificador
A6

Nome
SSO Google (status, start, callback, pending)

Objetivo
Autenticar/registrar utilizadores via Google OAuth com fluxo seguro.

Descrição
Inicia fluxo OAuth, recebe callback e converte identidade Google em sessão Teglion.

Atores
- Utilizador público

Entradas
- state OAuth
- code OAuth
- cookie de registo pendente

Saídas
- redirecionamento para frontend
- sessão autenticada ou pending registration

Pré-condições
- credenciais Google configuradas

Pós-condições
- login SSO efetuado ou pending registration atualizado

Fluxo Principal
1. Start: gerar state e redirecionar para consent screen.
2. Callback: validar state e trocar code por token.
3. Ler claims de identidade e email verificado.
4. Tentar ligar a conta existente.
5. Se conta existir, emitir sessão.
6. Se não existir e intenção registo, criar pending registration.
7. Redirecionar para rota de frontend adequada.

Fluxos Alternativos
- state inválido: bloquear callback.
- email não verificado: rejeitar.
- sso_subject mismatch: rejeitar.

Validações
- state
- code
- issuer/claims

Regras de Negócio
- contas SSO podem exigir percurso próprio de login.
- pending registration expira.

Permissões Necessárias
Acesso público.

Entidades Utilizadas
- firm_users
- pending_oauth_cookie (lógico)

Repositórios envolvidos
- firm-users.repository
- firms.repository

Integrações externas
- Google OAuth/OIDC

Eventos disparados
- SSO_LOGIN_SUCCESS
- SSO_LOGIN_FAILED
- SSO_PENDING_CREATED

Auditoria
- log de tentativa SSO com razão de falha/sucesso

Logs
- warning para callbacks inválidos

Exceções possíveis
- SSO_NOT_CONFIGURED
- SSO_STATE_INVALID
- SSO_ACCOUNT_NOT_FOUND

Impacto em outros módulos
- onboarding e login de firma.

Observações técnicas
- encapsular fornecedor OIDC em adapter separado.

----------------------------------------

## Especificação Canónica B1 (cobre BILL-UC-001, BILL-UC-002, BILL-UC-003, BILL-UC-004)

----------------------------------------

Identificador
B1

Nome
Billing da firma e reconciliação Stripe

Objetivo
Controlar elegibilidade da firma por trial/subscrição e sincronizar estado via webhook.

Descrição
Inclui consulta de status, criação de checkout/portal e processamento idempotente de webhook Stripe.

Atores
- Owner da firma
- Sistema Stripe (webhook)

Entradas
- firmId
- assinatura webhook
- payload evento Stripe

Saídas
- status de billing
- URL checkout/portal
- confirmação de webhook processado

Pré-condições
- Stripe configurado para operações pagas
- firma existente

Pós-condições
- estado de billing da firma atualizado conforme eventos

Fluxo Principal
1. Consultar status: carregar firma e derivar acesso.
2. Checkout: garantir owner, obter/criar customer, criar sessão.
3. Portal: garantir owner e customer existente, criar sessão portal.
4. Webhook: validar assinatura, garantir idempotência por event id.
5. Aplicar mapeamento de eventos para estado da firma.

Fluxos Alternativos
- Stripe não configurado: resposta de indisponibilidade.
- evento duplicado: ignorar sem mutação.
- firma não encontrada no webhook: logar e falhar controlado.

Validações
- owner para checkout/portal
- assinatura stripe
- event type suportado

Regras de Negócio
- webhook é a fonte de verdade da subscrição.
- firma ativa depende de billing/trial.

Permissões Necessárias
- status: autenticado
- checkout/portal: owner
- webhook: assinatura válida

Entidades Utilizadas
- firms
- stripe_webhook_events

Repositórios envolvidos
- firms.repository
- stripe-webhook-events.repository

Integrações externas
- Stripe Checkout
- Stripe Billing Portal
- Stripe Webhooks

Eventos disparados
- BILLING_STATUS_CHANGED
- STRIPE_WEBHOOK_PROCESSED

Auditoria
- registro de alterações de billing e eventos rejeitados.

Logs
- warning em assinatura inválida
- error em falha de reconciliação

Exceções possíveis
- STRIPE_NOT_CONFIGURED
- INVALID_SIGNATURE
- NO_STRIPE_CUSTOMER

Impacto em outros módulos
- gate de acesso da firma a /contabil.

Observações técnicas
- aplicar outbox/event journal para idempotência robusta.

----------------------------------------

## Especificação Canónica F1 (cobre FIRM-UC-001 a FIRM-UC-007)

----------------------------------------

Identificador
F1

Nome
Gestão administrativa da firma

Objetivo
Gerir perfil institucional, branding e ciclo de vida da conta da firma.

Descrição
Consolida leitura/edição de settings e perfil, gestão de logo e encerramento de conta.

Atores
- Staff da firma
- Owner da firma
- Consumidor público de branding

Entradas
- patch de settings/perfil
- ficheiro de logo
- confirmName e NPS para encerramento
- slug para branding público

Saídas
- dados atualizados de firma/perfil/branding

Pré-condições
- firma existente
- ator autenticado para rotas internas

Pós-condições
- dados atualizados
- logo atualizado/removido
- conta cancelada (se encerramento)

Fluxo Principal
1. Ler perfil/settings da firma.
2. Validar payload e aplicar patch de settings.
3. Validar payload e aplicar patch de perfil.
4. Upload logo: validar ficheiro, salvar no storage e persistir chave.
5. Remover logo: remover chave e objeto associado.
6. Encerrar conta: validar confirmação nominal e NPS; cancelar firma e encerrar sessões.
7. Branding público: resolver firma por slug e devolver dados públicos.

Fluxos Alternativos
- logo ausente: retorno idempotente.
- encerramento com nome incorreto: rejeitar.

Validações
- tamanhos de campos
- email válido
- upload image policy
- owner para operações sensíveis

Regras de Negócio
- somente owner encerra conta e gere branding institucional.
- encerramento encerra acesso futuro.

Permissões Necessárias
- settings: FIRM_SETTINGS_MANAGE
- perfil: FIRM_READ
- logo/close: owner
- branding público: sem autenticação

Entidades Utilizadas
- firms
- firm_users
- auth_refresh_sessions

Repositórios envolvidos
- firms.repository
- firm-users.repository
- auth-refresh-sessions.repository

Integrações externas
- Supabase Storage

Eventos disparados
- FIRM_SETTINGS_UPDATED
- FIRM_PROFILE_UPDATED
- FIRM_LOGO_UPDATED
- FIRM_CLOSED

Auditoria
- auditoria de mutações de firma e perfil.

Logs
- info em mutações
- warning para tentativas inválidas

Exceções possíveis
- FIRM_NOT_FOUND
- FORBIDDEN
- INVALID_UPLOAD

Impacto em outros módulos
- afeta identidade visual, acesso e operação global.

Observações técnicas
- tratar cancelamento como estado de domínio e não hard delete.

----------------------------------------

## Especificação Canónica C1 (cobre CLIENT-UC-001 a CLIENT-UC-009)

----------------------------------------

Identificador
C1

Nome
Gestão de clientes e convites

Objetivo
Manter carteira de clientes e habilitar onboarding para portal.

Descrição
Inclui listagem/detalhe/hub, CRUD lógico, validação fiscal e ciclo de convites.

Atores
- Staff da firma
- Cliente convidado (preview público)

Entradas
- filtros/paginação
- dados de cliente
- NIF
- dados de convite
- token público de convite

Saídas
- clientes e hubs
- validação NIF
- convite criado/preview

Pré-condições
- firma ativa
- permissões de gestão de clientes

Pós-condições
- cliente criado/atualizado/arquivado
- convite emitido

Fluxo Principal
1. Listar clientes com enriquecimento operacional.
2. Obter detalhe ou hub por cliente.
3. Criar cliente validando NIF e consistência básica.
4. Atualizar cliente com patch controlado.
5. Arquivar cliente (soft status).
6. Validar NIF sob demanda (checksum + unicidade no tenant).
7. Criar convite de cliente com TTL e envio email.
8. Expor preview público do convite.

Fluxos Alternativos
- NIF duplicado: bloquear.
- cliente já arquivado: operação idempotente de arquivo.
- convite expirado/inválido no preview: not found/erro controlado.

Validações
- nome
- email
- NIF
- escopo tenant

Regras de Negócio
- cliente é sempre tenant-scoped.
- convites são temporários e de uso controlado.

Permissões Necessárias
- operações internas: FIRM_CLIENTS_MANAGE
- preview: público

Entidades Utilizadas
- clients
- client_invites
- obligations
- client_tasks
- documents

Repositórios envolvidos
- clients.repository
- invites.repository
- contabil repositories (agregações)

Integrações externas
- Brevo email

Eventos disparados
- CLIENT_CREATED
- CLIENT_UPDATED
- CLIENT_ARCHIVED
- CLIENT_INVITE_CREATED

Auditoria
- mutações de cliente e acesso ao hub.

Logs
- warning para validações fiscais falhadas

Exceções possíveis
- CLIENT_NOT_FOUND
- NIF_INVALID
- NIF_DUPLICATE

Impacto em outros módulos
- base para obrigações, tarefas, documentos, mensagens e portal.

Observações técnicas
- separar core de cliente de projeções de hub.

----------------------------------------

## Especificação Canónica T1 (cobre TEAM-UC-001 a TEAM-UC-018)

----------------------------------------

Identificador
T1

Nome
Gestão de equipa, convites, departamentos e permissões

Objetivo
Controlar estrutura interna da firma e autorização granular.

Descrição
Consolida ciclo de vida de membros, convites públicos, confirmação de email, departamentos e overrides de permissões.

Atores
- Owner/admin da firma
- Membro convidado

Entradas
- dados de membro
- dados de convite
- token de convite/confirm email
- payload de permissões
- payload de departamento

Saídas
- membros/departamentos/permissões atualizados

Pré-condições
- firma existente
- actor interno com permissões adequadas

Pós-condições
- membros ativos/pendentes atualizados
- convite aceite/confirmado/revogado
- permissões/departamentos persistidos

Fluxo Principal
1. Listar equipa e obter detalhe por membro.
2. Criar/atualizar membro interno.
3. Desativar/reativar membro com regras de proteção.
4. Criar/reenviar/revogar convites de equipa.
5. Expor preview público e aceitar convite com password.
6. Confirmar email do membro por token.
7. Consultar e atualizar permissões efetivas.
8. Listar/criar/atualizar/remover departamentos.

Fluxos Alternativos
- último owner: impedir desativação.
- convite expirado/revogado: rejeitar aceitação.
- departamento em uso: impedir remoção.

Validações
- email
- role permitido
- password policy (convites)
- integridade de departamento
- permissões válidas

Regras de Negócio
- deve existir pelo menos um owner ativo.
- confirmação de email pode ser obrigatória para ativação total.
- permissões podem ser herdadas ou sobrescritas.

Permissões Necessárias
- USERS_READ/CREATE/UPDATE/DELETE
- FIRM_INVITES_MANAGE
- FIRM_MEMBER_PERMISSION_MANAGE
- FIRM_DEPARTMENTS_MANAGE

Entidades Utilizadas
- firm_users
- firm_member_invites
- email_confirmation_tokens
- departments

Repositórios envolvidos
- firm-users.repository
- firm-member-invites.repository
- email-confirmation.repository
- departments.repository

Integrações externas
- Brevo email

Eventos disparados
- TEAM_MEMBER_CREATED
- TEAM_MEMBER_UPDATED
- TEAM_INVITE_CREATED
- TEAM_INVITE_ACCEPTED
- TEAM_EMAIL_CONFIRMED
- TEAM_PERMISSION_UPDATED

Auditoria
- ações administrativas de equipa e permissões.

Logs
- warning para tentativas inválidas de convite/permissão

Exceções possíveis
- MEMBER_NOT_FOUND
- LAST_OWNER_PROTECTION
- INVITE_EXPIRED
- PERMISSION_INVALID

Impacto em outros módulos
- controla autorização efetiva de todo o backoffice.

Observações técnicas
- extrair policy engine de permissões para componente dedicado.

----------------------------------------

## Especificação Canónica O1 (cobre OBL-UC-001 a OBL-UC-022)

----------------------------------------

Identificador
O1

Nome
Operação fiscal: obrigações, templates, calendário e ações do cliente

Objetivo
Gerir ciclo completo das obrigações fiscais do cliente dentro do tenant.

Descrição
Inclui dashboards, CRUD de obrigações, guias, timeline, recorrência, exclusões mensais, calendário fiscal e interações do cliente no portal.

Atores
- Staff da firma
- Cliente do portal

Entradas
- filtros de dashboard/lista
- payload de obrigação/template/regra
- ficheiros de guia/comprovativo
- ações de view/mark-paid/deliver

Saídas
- obrigações e dashboards
- templates/regras
- timeline e estados atualizados

Pré-condições
- cliente e firma existentes
- permissões válidas

Pós-condições
- obrigação/template/regra persistidos
- estado operacional atualizado
- eventos de comunicação/notification acionados quando aplicável

Fluxo Principal
1. Listar obrigações e dashboards.
2. Criar obrigação e opcionalmente tarefa associada.
3. Atualizar obrigação com patch controlado.
4. Upload de guia e atualização de estado/documentação.
5. Produzir timeline com activity + audit + views.
6. Excluir/restaurar competência mensal.
7. Gerir templates e regras de recorrência.
8. Gerar obrigação recorrente sob demanda.
9. Expor calendário fiscal e notas.
10. No portal: listar obrigações, registrar view, marcar paga e entregar obrigação.

Fluxos Alternativos
- duplicidade de recorrência: não gerar nova ocorrência.
- país sem calendário detalhado: fallback configurado.
- ficheiro inválido: rejeitar upload.

Validações
- clientId
- dueDate/period
- status permitido
- ficheiros e mime types
- itemId para notas

Regras de Negócio
- obrigação é tenant e client scoped.
- prova documental influencia estado da obrigação.
- calendário fiscal é referência parametrizada por país/ano.

Permissões Necessárias
- backoffice: FIRM_CLIENTS_MANAGE ou FIRM_OBLIGATIONS_MANAGE
- portal: cliente autenticado

Entidades Utilizadas
- obligations
- obligation_templates
- obligation_recurrence_rules
- task_month_exclusions
- documents
- content_views

Repositórios envolvidos
- contabil/obligations.repository
- task-month-exclusions.repository
- contabil/firm-dashboard.repository
- documents.repository

Integrações externas
- storage
- SMS/email reminders

Eventos disparados
- OBLIGATION_CREATED
- OBLIGATION_UPDATED
- OBLIGATION_GUIDE_UPLOADED
- OBLIGATION_MARKED_PAID
- OBLIGATION_DELIVERED

Auditoria
- gravação de audit logs de alterações documentais e operacionais.

Logs
- warning para inconsistências de recorrência/calendário

Exceções possíveis
- OBLIGATION_NOT_FOUND
- INVALID_PERIOD
- FILE_VALIDATION_ERROR

Impacto em outros módulos
- tasks, documents, mensagens, notificações, automações.

Observações técnicas
- modelar estado de obrigação como state machine explícita.

----------------------------------------

## Especificação Canónica K1 (cobre TASK-UC-001 a TASK-UC-017)

----------------------------------------

Identificador
K1

Nome
Gestão operacional de tarefas

Objetivo
Orquestrar tarefas cliente/firma durante o ciclo de prestação do serviço.

Descrição
Inclui workspace, CRUD, comentários, anexos, ações do cliente e sincronização por eventos.

Atores
- Staff da firma
- Cliente do portal
- Scheduler interno

Entradas
- filtros workspace
- payload de criação/patch
- comentários
- anexos
- ações do cliente

Saídas
- tarefas e métricas
- timeline/comentários/anexos

Pré-condições
- tarefa e cliente no mesmo tenant
- permissões válidas

Pós-condições
- tarefa criada/atualizada
- comentários/anexos persistidos
- estados sincronizados

Fluxo Principal
1. Listar workspace com filtros e métricas.
2. Obter detalhe com timeline e anexos.
3. Criar tarefa manual/interna com fallback de schema.
4. Atualizar, remover, arquivar, reabrir, duplicar tarefa.
5. Adicionar comentário de firma.
6. Anexar documento de firma.
7. No portal, cliente lista e detalha tarefas.
8. Cliente submete, conclui, pede ajuda e comenta.
9. Event handlers ajustam estado com base em documentos/pedidos.

Fluxos Alternativos
- tarefa inexistente: not found.
- transição inválida de estado: rejeitar.
- sem tarefa correlata em evento automático: ignorar.

Validações
- título obrigatório na criação
- clientId válido
- status/priority permitidos
- ficheiro válido

Regras de Negócio
- tarefas são tenant-scoped.
- ações do cliente disparam notificação ao staff.
- automação não deve duplicar tarefas recorrentes.

Permissões Necessárias
- firma: FIRM_CLIENTS_MANAGE
- portal: cliente autenticado

Entidades Utilizadas
- client_tasks
- task_comments
- task_recurring_rules
- documents

Repositórios envolvidos
- tasks.repository
- clients.repository
- documents.repository

Integrações externas
- storage
- notificações
- SMS/email (quando aplicável)

Eventos disparados
- TASK_CREATED
- TASK_UPDATED
- TASK_ARCHIVED
- TASK_COMMENTED
- TASK_ATTACHMENT_ADDED
- TASK_AUTO_COMPLETED

Auditoria
- activity events para ações-chave de tarefa.

Logs
- warning em fallback de schema e inconsistências

Exceções possíveis
- TASK_NOT_FOUND
- INVALID_TASK_STATUS
- FILE_VALIDATION_ERROR

Impacto em outros módulos
- obrigações, documentos, document requests, notificações.

Observações técnicas
- isolar cálculo de métricas em query model específico.

----------------------------------------

## Especificação Canónica D1 (cobre DOC-UC-001 a DOC-UC-012)

----------------------------------------

Identificador
D1

Nome
Gestão documental

Objetivo
Garantir ciclo seguro de upload, validação, consulta e histórico de documentos.

Descrição
Consolida operações de firma e portal sobre documentos.

Atores
- Staff da firma
- Cliente do portal

Entradas
- ficheiros
- documentId
- validationStatus
- critérios de duplicado

Saídas
- documentos, detalhe, histórico, stream de download/preview

Pré-condições
- documento no tenant
- storage disponível

Pós-condições
- documentos criados/validados/removidos conforme operação

Fluxo Principal
1. Cliente faz upload (single/multi) com validação de conteúdo.
2. Sistema persiste documento com vínculo de contexto.
3. Firma lista, consulta detalhe e histórico do documento.
4. Firma valida/rejeita/põe pendente e sincroniza pedidos/tarefas.
5. Firma solicita reenvio quando necessário.
6. Firma verifica duplicados e remove documento logicamente.
7. Download/preview validam autorização e fazem proxy de storage.

Fluxos Alternativos
- upload inválido por mime/magic bytes: rejeitar.
- documento inexistente: not found.
- acesso fora do escopo: forbidden.

Validações
- tamanho e tipo de ficheiro
- magic bytes
- authorization por tenant

Regras de Negócio
- documentos são sempre tenant-scoped.
- validação documental afeta workflows operacionais.
- remoção é lógica.

Permissões Necessárias
- firma: FIRM_CLIENTS_MANAGE
- portal: cliente autenticado

Entidades Utilizadas
- documents
- audit_logs
- content_views

Repositórios envolvidos
- documents.repository
- contabil.repository
- document-requests.repository

Integrações externas
- Supabase Storage

Eventos disparados
- DOCUMENT_UPLOADED
- DOCUMENT_APPROVED
- DOCUMENT_REJECTED
- DOCUMENT_RESEND_REQUESTED
- DOCUMENT_DELETED

Auditoria
- logs de validação/remoção e acessos críticos.

Logs
- warning para tentativas inválidas de ficheiro/acesso

Exceções possíveis
- DOCUMENT_NOT_FOUND
- FILE_VALIDATION_ERROR
- FORBIDDEN

Impacto em outros módulos
- tasks, obligations, requests, tracking.

Observações técnicas
- separar metadata documental de blobs storage com versão de schema estável.

----------------------------------------

## Especificação Canónica R1 (cobre DREQ-UC-001 a DREQ-UC-005)

----------------------------------------

Identificador
R1

Nome
Pedidos de documentos

Objetivo
Formalizar solicitações documentais e rastrear cumprimento.

Descrição
Gerencia ciclo de pedidos documentais no backoffice e no portal.

Atores
- Staff da firma
- Cliente do portal

Entradas
- clientId
- título/instruções
- documentRequestId
- eventos de mensagem/documento

Saídas
- pedidos criados/listados/atualizados

Pré-condições
- cliente válido no tenant

Pós-condições
- pedido em estado coerente com progresso

Fluxo Principal
1. Criar pedido documental (direto ou convertido de mensagem).
2. Listar pedidos por cliente (backoffice).
3. Listar pedidos do cliente no portal.
4. Cliente marca pedido como visto.
5. Upload/validação documental atualizam pedido para answered/completed.

Fluxos Alternativos
- pedido inexistente: not found.
- pedido fora do escopo do cliente: forbidden.

Validações
- clientId
- estado e transição

Regras de Negócio
- pedido é ligação formal entre comunicação e documentação.
- pedido completo depende de evidência documental válida.

Permissões Necessárias
- backoffice: FIRM_CLIENTS_MANAGE
- portal: cliente autenticado

Entidades Utilizadas
- document_requests
- conversations
- messages
- documents

Repositórios envolvidos
- document-requests.repository
- conversations.repository
- messages.repository

Integrações externas
- nenhuma obrigatória

Eventos disparados
- DOCUMENT_REQUEST_CREATED
- DOCUMENT_REQUEST_SEEN
- DOCUMENT_REQUEST_ANSWERED
- DOCUMENT_REQUEST_COMPLETED

Auditoria
- activity de criação e conclusão.

Logs
- warning para transições inválidas

Exceções possíveis
- REQUEST_NOT_FOUND
- INVALID_TRANSITION

Impacto em outros módulos
- tasks e mensagens.

Observações técnicas
- representar estado de pedido como enum + máquina de transições.

----------------------------------------

## Especificação Canónica M1 (cobre MSG-UC-001 a MSG-UC-012)

----------------------------------------

Identificador
M1

Nome
Comunicação e inbox

Objetivo
Gerir comunicação bidirecional firma-cliente e inbox operacional.

Descrição
Inclui threads, unread, envio/edição e ações de campanha operacional.

Atores
- Staff da firma
- Cliente do portal

Entradas
- clientId
- body/quick reply
- anexos opcionais
- messageId

Saídas
- mensagens, threads, unread summaries

Pré-condições
- cliente no tenant

Pós-condições
- mensagens persistidas
- leitura atualizada quando aplicável

Fluxo Principal
1. Listar threads e resumo de não lidas.
2. Listar mensagens por cliente.
3. Enviar mensagem da firma com ou sem anexo.
4. Editar mensagem da firma quando permitido.
5. Converter mensagem em pedido documental.
6. Disparar campanhas notify-critical/notify-inactive.
7. Cliente lista mensagens e unread count.
8. Cliente envia e edita mensagem no seu escopo.
9. Inbox agrega mensagens e pedidos de documentos.

Fluxos Alternativos
- mensagem inexistente: not found.
- tentativa de edição sem autoria: forbidden.

Validações
- body não vazio (ou quickReply válida)
- clientId no tenant
- file policy quando anexo

Regras de Negócio
- comunicação é sempre tenant-scoped.
- conversão em pedido documental mantém contexto da thread.

Permissões Necessárias
- firma: FIRM_CLIENTS_MANAGE
- cliente: autenticado

Entidades Utilizadas
- conversations
- messages
- document_requests
- in_app_notifications

Repositórios envolvidos
- conversations.repository
- messages.repository
- document-requests.repository

Integrações externas
- storage para anexos

Eventos disparados
- MESSAGE_SENT
- MESSAGE_EDITED
- MESSAGE_CONVERTED_TO_REQUEST

Auditoria
- activity de mensagens críticas e conversões.

Logs
- warning para envio/edição inválidos

Exceções possíveis
- MESSAGE_NOT_FOUND
- FORBIDDEN
- INVALID_MESSAGE_BODY

Impacto em outros módulos
- document requests, tasks, notifications, live.

Observações técnicas
- projetar unread counters como query model eficiente.

----------------------------------------

## Especificação Canónica P1 (cobre PORTAL-UC-001 a PORTAL-UC-009)

----------------------------------------

Identificador
P1

Nome
Fachada do portal do cliente

Objetivo
Entregar experiência unificada do cliente em autosserviço.

Descrição
Orquestra consultas e ações do cliente sobre múltiplos domínios.

Atores
- Cliente autenticado

Entradas
- ações e filtros do portal

Saídas
- hub/dashboard/feeds/notificações do cliente

Pré-condições
- vínculo cliente-firma aprovado

Pós-condições
- dados agregados entregues
- leituras/flags atualizadas quando aplicável

Fluxo Principal
1. Validar autenticação do cliente.
2. Validar vínculo do cliente com a firma.
3. Construir hub agregando obrigações, tarefas, documentos, mensagens e consultas.
4. Construir dashboard com indicadores operacionais.
5. Expor notificações, alerts e news do cliente.
6. Marcar itens como lidos quando solicitado.

Fluxos Alternativos
- cliente não vinculado: bloquear acesso.
- falha parcial de agregação: fallback parcial controlado.

Validações
- escopo de cliente
- ids de notificação/alerta

Regras de Negócio
- portal é apenas fachada, lógica de domínio permanece nos módulos especializados.

Permissões Necessárias
Cliente autenticado e vinculado.

Entidades Utilizadas
- clients
- firms
- obligations
- client_tasks
- documents
- messages
- in_app_notifications
- firm_broadcasts/news_articles (feeds)

Repositórios envolvidos
- repositórios dos domínios agregados

Integrações externas
- storage (branding/covers)

Eventos disparados
- CLIENT_PORTAL_ITEM_READ

Auditoria
- logs de acesso ao hub e ações relevantes.

Logs
- erro controlado em agregações com fallback

Exceções possíveis
- CLIENT_NOT_LINKED
- FORBIDDEN

Impacto em outros módulos
- consumo transversal de todos os módulos core.

Observações técnicas
- manter camada de orchestration separada dos serviços de domínio.

----------------------------------------

## Especificação Canónica S1 (cobre SCHED-UC-001 a SCHED-UC-015)

----------------------------------------

Identificador
S1

Nome
Catálogo, booking e consultas

Objetivo
Gerir oferta de serviços e agenda de marcações.

Descrição
Inclui administração de catálogo, settings de booking, cálculo de slots e gestão de consultas.

Atores
- Staff da firma
- Cliente do portal

Entradas
- payload de serviço
- payload de booking settings
- filtros de consulta
- pedido de slots e booking

Saídas
- catálogo
- settings
- slots
- consultas

Pré-condições
- firma e cliente válidos

Pós-condições
- serviços/settings/consultas atualizados

Fluxo Principal
1. Listar e gerir catálogo de serviços.
2. Semear e ativar catálogo padrão.
3. Ler e atualizar booking settings.
4. Listar, criar e atualizar consultas no backoffice.
5. No portal, listar serviços e slots disponíveis.
6. Criar booking cliente após validação de disponibilidade.

Fluxos Alternativos
- slot ocupado em concorrência: rejeitar booking.
- serviço inativo: não permitir seleção.

Validações
- preço/duração
- timezone e janelas
- slot livre

Regras de Negócio
- somente serviços ativos são elegíveis.
- disponibilidade depende de settings + ocupação.

Permissões Necessárias
- firma: permissões de serviços/consultas
- cliente: autenticado

Entidades Utilizadas
- accounting_services
- consultations
- firms.settings.booking

Repositórios envolvidos
- accounting-services.repository
- consultations.repository
- firms.repository

Integrações externas
- email de notificação

Eventos disparados
- SERVICE_CATALOG_UPDATED
- BOOKING_CREATED
- CONSULTATION_UPDATED

Auditoria
- mutações de catálogo e consulta devem ser auditáveis.

Logs
- warning em conflitos de slot

Exceções possíveis
- INVALID_SLOT
- SERVICE_INACTIVE
- CONSULTATION_NOT_FOUND

Impacto em outros módulos
- portal, notificações e comunicação com cliente.

Observações técnicas
- engine de slot deve ser determinística e testável isoladamente.

----------------------------------------

## Especificação Canónica E1 (cobre BRDC-UC-001 a BRDC-UC-006, NEWS-UC-001 a NEWS-UC-006)

----------------------------------------

Identificador
E1

Nome
Engagement de conteúdo (Broadcasts e News)

Objetivo
Permitir comunicação massiva e conteúdo editorial da firma para clientes.

Descrição
Inclui CRUD de broadcasts/news, analytics de leitura e feed de consumo.

Atores
- Staff da firma
- Cliente do portal

Entradas
- payload broadcast/news
- id broadcast/news
- ação de leitura

Saídas
- conteúdos e analytics

Pré-condições
- firma existente

Pós-condições
- conteúdo persistido/publicado
- leituras registradas

Fluxo Principal
1. Broadcasts: criar/atualizar/remover/listar.
2. Publicar broadcast e realizar fan-out de destinatários.
3. Coletar analytics de leitura/ack.
4. News: criar/editar/remover/listar conteúdos.
5. Upload de cover de news.
6. Portal consome feed de alerts e news e marca leitura.

Fluxos Alternativos
- conteúdo não publicado: oculto no portal.
- broadcast já lido: leitura idempotente.

Validações
- título/conteúdo
- slug único
- cover image policy

Regras de Negócio
- conteúdo é tenant-scoped.
- analytics baseiam-se em read receipts.

Permissões Necessárias
- firma: FIRM_CLIENTS_MANAGE
- cliente: autenticado para leitura

Entidades Utilizadas
- firm_broadcasts
- firm_broadcast_reads
- news_articles
- in_app_notifications

Repositórios envolvidos
- broadcasts.repository
- news services/repositories

Integrações externas
- storage para cover

Eventos disparados
- BROADCAST_PUBLISHED
- BROADCAST_READ
- NEWS_PUBLISHED

Auditoria
- criação/edição/publicação de conteúdo.

Logs
- warning em inconsistências de targeting

Exceções possíveis
- BROADCAST_NOT_FOUND
- NEWS_NOT_FOUND
- DUPLICATE_SLUG

Impacto em outros módulos
- notificações, portal e comunicação com clientes.

Observações técnicas
- modelar publicação agendada de forma assíncrona.

----------------------------------------

## Especificação Canónica G1 (cobre SIG-UC-001 a SIG-UC-015)

----------------------------------------

Identificador
G1

Nome
Sinais operacionais: notificações, live, push e tracking

Objetivo
Entregar sinalização em tempo quase real e telemetria de consumo.

Descrição
Inclui notificações in-app (firma/cliente), polling live, push subscriptions e tracking de visualizações.

Atores
- Staff da firma
- Cliente do portal

Entradas
- filtros de notificação/live
- subscription push payload
- entityType/entityId para tracking

Saídas
- listas de notificações/live updates
- confirmação de subscriptions
- estatísticas de views/logs SMS

Pré-condições
- ator autenticado

Pós-condições
- flags de leitura atualizadas
- subscriptions persistidas
- views registradas

Fluxo Principal
1. Listar notificações da firma e marcar leitura.
2. Polling live retorna deltas de eventos e badges.
3. Expor chave VAPID e persistir subscriptions push.
4. Registrar início/fim de view de documento/obrigação.
5. Expor stats de views para backoffice.
6. Expor logs SMS.

Fluxos Alternativos
- VAPID ausente: endpoint de subscribe retorna indisponibilidade.
- end-view sem sessão aberta: ignorar/erro leve.

Validações
- escopo por tenant
- payload de push
- entityType suportado

Regras de Negócio
- polling é mecanismo oficial de tempo quase real.
- tracking é evidência operacional, não altera domínio principal.

Permissões Necessárias
- firma: FIRM_CLIENTS_MANAGE
- cliente: autenticado

Entidades Utilizadas
- firm_notifications
- in_app_notifications
- push_subscriptions
- content_views
- sms_logs

Repositórios envolvidos
- notifications services
- push service/repository
- view-tracking.service
- sms-logs.service

Integrações externas
- Web Push
- Brevo SMS

Eventos disparados
- NOTIFICATION_READ
- PUSH_SUBSCRIBED
- CONTENT_VIEW_STARTED
- CONTENT_VIEW_ENDED

Auditoria
- eventos relevantes de interação devem ficar rastreados.

Logs
- warning para subscriptions inválidas e tracking inconsistente.

Exceções possíveis
- INVALID_SUBSCRIPTION
- FORBIDDEN
- ENTITY_NOT_FOUND

Impacto em outros módulos
- aumenta observabilidade e reatividade da operação.

Observações técnicas
- particionar tabela de tracking para escala.

----------------------------------------

## Especificação Canónica Q1 (cobre SRQ-UC-001 a SRQ-UC-010)

----------------------------------------

Identificador
Q1

Nome
Pipeline de Service Requests

Objetivo
Gerir pedidos adicionais de serviços com orçamento e aprovação.

Descrição
Inclui operações de firma e cliente sobre service requests.

Atores
- Staff da firma
- Cliente do portal

Entradas
- payload de pedido
- comentários
- quote e ação de aprovação

Saídas
- requests e estado do pipeline

Pré-condições
- cliente no tenant

Pós-condições
- request criado/atualizado/aprovado

Fluxo Principal
1. Firma lista requests e detalhe.
2. Firma cria e atualiza request.
3. Firma adiciona comentários e quote.
4. Cliente lista requests e consulta quote.
5. Cliente aprova quote.
6. Sistema atualiza estado e notifica atores envolvidos.

Fluxos Alternativos
- aprovação sem quote: rejeitar.
- request fora do escopo do cliente: forbidden.

Validações
- título obrigatório
- estado válido
- quote consistente

Regras de Negócio
- aprovação só ocorre em estado elegível.
- request é sempre client e tenant scoped.

Permissões Necessárias
- firma: FIRM_CLIENTS_MANAGE
- cliente: autenticado

Entidades Utilizadas
- service_requests
- service_request_comments

Repositórios envolvidos
- service-requests.repository
- clients.repository

Integrações externas
- notificações internas

Eventos disparados
- SERVICE_REQUEST_CREATED
- SERVICE_REQUEST_QUOTED
- SERVICE_REQUEST_APPROVED

Auditoria
- mutações de estado e quote.

Logs
- warning para transição inválida

Exceções possíveis
- REQUEST_NOT_FOUND
- INVALID_TRANSITION

Impacto em outros módulos
- integra com catálogo, portal e notificações.

Observações técnicas
- recomendar state machine explícita de pipeline.

----------------------------------------

## Especificação Canónica U1 (cobre AUTO-UC-001 a AUTO-UC-009)

----------------------------------------

Identificador
U1

Nome
Automações, cron e jobs internos

Objetivo
Automatizar operações recorrentes e processamento assíncrono leve.

Descrição
Inclui regras de automação, execução manual/cron, schedulers e fila redis.

Atores
- Staff da firma (manual)
- Scheduler externo (cron)
- Sistema interno (timers/worker)

Entradas
- regra trigger/action
- firmId para cron específico
- secret cron
- payload de job

Saídas
- execução realizada e resumo de ações

Pré-condições
- regras persistidas
- segredo cron válido

Pós-condições
- tarefas/notificações/mensagens criadas conforme regras
- jobs processados

Fluxo Principal
1. Listar e upsert de regras de automação.
2. Executar regras manualmente para firma.
3. Executar regras via cron para todas ou uma firma.
4. Scheduler de recorrência cria próxima tarefa interna.
5. Scheduler de reminders cria mensagens e envia canais externos.
6. Fila redis enfileira/processa jobs, com fallback inline.

Fluxos Alternativos
- segredo cron inválido: rejeitar.
- redis indisponível: fallback inline.
- falha numa firma: continuar lote global.

Validações
- trigger/action suportados
- firmId válido em cron específico
- payload serializável de job

Regras de Negócio
- automação não deve interromper operação por falha parcial.
- reminders têm janela temporal definida.

Permissões Necessárias
- manual: FIRM_CLIENTS_MANAGE
- cron: secret válido
- scheduler/worker: sistema interno

Entidades Utilizadas
- task_automation_rules
- task_recurring_rules
- client_tasks
- obligations
- messages

Repositórios envolvidos
- automation.repository
- tasks.repository
- obligations repositories
- redis-queue abstractions

Integrações externas
- Redis
- Brevo email/SMS

Eventos disparados
- AUTOMATION_RULE_UPSERTED
- AUTOMATION_EXECUTED
- RECURRING_TASK_GENERATED
- OBLIGATION_REMINDER_SENT

Auditoria
- execução de automações e cron deve gerar trilha operacional.

Logs
- warning/error por falha parcial de execução

Exceções possíveis
- CRON_SECRET_INVALID
- AUTOMATION_EXECUTION_FAILED
- JOB_HANDLER_MISSING

Impacto em outros módulos
- tarefas, obrigações, mensagens, notificações.

Observações técnicas
- separar comando de automação de scheduler infra.

----------------------------------------

## Especificação Canónica V1 (cobre PUB-UC-001 a PUB-UC-010)

----------------------------------------

Identificador
V1

Nome
Serviços públicos, legal e integrações auxiliares

Objetivo
Oferecer endpoints públicos de suporte, compliance e observabilidade.

Descrição
Consolida health, legal versions, countries, postal lookup, branding público, newsletter e status de integrações.

Atores
- Visitante público
- Scheduler cron (integrações seguras)
- Staff da firma (status AT)

Entradas
- country/postalCode
- slug de firma
- payload newsletter
- secret cron

Saídas
- respostas públicas de utilidade e status

Pré-condições
- configuração de ambiente carregada

Pós-condições
- subscrição newsletter persistida

Fluxo Principal
1. Health público retorna disponibilidade base.
2. Health de integrações retorna readiness detalhado.
3. Legal versions retorna pacote de conformidade.
4. Countries e postal lookup retornam suporte local.
5. Branding público resolve firma por slug.
6. Newsletter faz upsert e notificação interna opcional.
7. Status AT retorna links/capabilities informativos.
8. Rota legado de registo mantém compatibilidade.

Fluxos Alternativos
- health/integrations público em produção: ocultar rota.
- lookup externo indisponível: retornar erro controlado.

Validações
- email newsletter
- consentimento newsletter
- secret cron
- parâmetros de lookup

Regras de Negócio
- exposição pública deve minimizar superfície sensível.
- compliance legal deve refletir versões atuais.

Permissões Necessárias
- público (maioria)
- cron secret em rotas protegidas
- FIRM_CLIENTS_VIEW para AT status

Entidades Utilizadas
- blog_newsletter_subscribers
- firms (branding)
- user_legal_consents (fonte de versões via serviço legal)

Repositórios envolvidos
- blog-newsletter.repository
- firms.repository
- legal-consents.repository

Integrações externas
- GeoAPI PT
- ViaCEP BR
- Brevo email
- serviços externos de status

Eventos disparados
- NEWSLETTER_SUBSCRIBED
- PUBLIC_INTEGRATION_HEALTH_QUERIED

Auditoria
- recomendável registrar chamadas cron sensíveis.

Logs
- warning para falha de provider externo.

Exceções possíveis
- NOT_FOUND (branding)
- RATE_LIMIT
- EXTERNAL_PROVIDER_ERROR

Impacto em outros módulos
- onboarding, marketing, operações e suporte.

Observações técnicas
- manter separação entre endpoints públicos e privados por gateway/policies.

----------------------------------------

---

# 5. Fluxo Geral dos Algoritmos

Fluxos textuais (resumo operacional) para os casos canónicos.

A1 - Autenticação de utilizador
Login
↓
Normalizar credenciais
↓
Aplicar rate-limit e lockout
↓
Validar conta/estado/password
↓
Validar acesso da firma (staff)
↓
Gerar JWT
↓
Persistir refresh session
↓
Registrar auditoria
↓
Retornar utilizador

A2 - Registo de firma
Receber dados e consentimentos
↓
Validar legal + password/email
↓
Criar firma e owner
↓
Semear catálogo/settings
↓
Persistir consentimento
↓
Criar sessão
↓
Retornar utilizador

A3 - Onboarding por convite
Receber token e dados
↓
Validar convite e email
↓
Definir credenciais
↓
Marcar convite aceite
↓
Efetuar login
↓
Retornar utilizador

A4 - Sessão (refresh/logout/me)
Receber refresh ou ação
↓
Validar token/sessão
↓
Renovar ou invalidar sessão
↓
Atualizar cookies
↓
Retornar estado de sessão

A5 - Recuperação de password
Receber email
↓
Gerar token de reset
↓
Enviar email
↓
Validar token
↓
Aplicar nova password
↓
Invalidar token/sessões

A6 - SSO Google
Iniciar OAuth
↓
Receber callback
↓
Validar state e claims
↓
Resolver conta ou pending
↓
Criar sessão ou redirecionar registo

B1 - Billing Stripe
Consultar status
↓
Criar checkout/portal (owner)
↓
Receber webhook Stripe
↓
Validar assinatura e idempotência
↓
Sincronizar estado da firma

F1 - Administração da firma
Consultar perfil/settings
↓
Validar patch
↓
Atualizar dados
↓
Gerir logo
↓
Opcional: encerrar conta
↓
Encerrar sessões e acesso

C1 - Clientes e convites
Listar/consultar clientes
↓
Criar/atualizar/arquivar cliente
↓
Validar NIF
↓
Criar convite
↓
Expor preview público

T1 - Equipa e permissões
Gerir membros
↓
Gerir convites de equipa
↓
Aceite/confirm email
↓
Aplicar permissões
↓
Gerir departamentos

O1 - Operação fiscal
Listar dashboard/obrigações
↓
Criar/editar obrigação
↓
Anexar guia e timeline
↓
Gerir templates/recorrência
↓
Portal: view/pago/entrega
↓
Atualizar estado operacional

K1 - Tarefas
Listar workspace e métricas
↓
Criar/atualizar tarefa
↓
Comentar/anexar
↓
Portal: submit/help/complete
↓
Sincronizar por eventos documentais

D1 - Documentos
Receber upload
↓
Validar ficheiro e contexto
↓
Persistir documento + storage
↓
Backoffice valida/rejeita
↓
Sincronizar pedidos/tarefas
↓
Disponibilizar preview/download

R1 - Pedidos documentais
Criar pedido
↓
Cliente visualiza e marca visto
↓
Cliente responde com documento
↓
Firma valida
↓
Pedido concluído

M1 - Mensagens e inbox
Listar threads/unread
↓
Enviar mensagem
↓
Anexar documento opcional
↓
Editar quando permitido
↓
Converter para pedido documental
↓
Atualizar inbox

P1 - Portal fachada
Validar vínculo cliente-firma
↓
Agregar dados de múltiplos domínios
↓
Entregar hub/dashboard/feed
↓
Marcar itens lidos

S1 - Catálogo e booking
Gerir serviços e settings de agenda
↓
Calcular slots
↓
Cliente escolhe serviço/slot
↓
Criar consulta
↓
Notificar firma

E1 - Broadcasts e news
Criar conteúdo
↓
Publicar e fan-out
↓
Cliente consome feed
↓
Registrar leitura/analytics

G1 - Sinais operacionais
Gerar notificações
↓
Polling live
↓
Persistir push subscriptions
↓
Registrar views e métricas

Q1 - Service requests
Criar pedido
↓
Atribuir/quotar
↓
Cliente consulta quote
↓
Cliente aprova
↓
Pipeline evolui até conclusão

U1 - Automações e jobs
Ler regras
↓
Executar manual/cron
↓
Criar ações automáticas
↓
Schedulers periódicos
↓
Fila redis processa jobs

V1 - Serviços públicos
Responder health/legal/countries
↓
Resolver branding/lookup
↓
Subscrever newsletter
↓
Expor status de integrações

---

# 6. Regras Globais de Negócio

## 6.1 Segurança e autenticação
- JWT access/refresh com cookies HTTP-only.
- CSRF obrigatório com rotas de bypass controladas.
- Bearer token opcional por configuração, não padrão.
- Refresh depende de sessão persistida por jti/hash.

## 6.2 Password policy
- Password mínima exigida (>=10) e política de robustez.
- Rehash automático quando algoritmo/padrão estiver desatualizado.

## 6.3 Rate limit e anti-abuso
- Rate-limit global e específico por auth/newsletter/preview.
- Lockout por tentativas falhadas de login por janela temporal.

## 6.4 Autorização e permissões
- RBAC por role + overrides por membro.
- Owner com poderes adicionais para operações críticas.
- Guardas específicos: active firm, owner, permission checks.

## 6.5 Multi-tenancy
- Todas as entidades de negócio relevantes são firm-scoped.
- Cliente final também é client-scoped dentro da firma.
- Acesso cruzado entre tenants é proibido por regra de domínio.

## 6.6 Billing e trial
- Acesso à área operacional depende do estado da firma.
- Trial/subscription determinam elegibilidade.
- Stripe webhook é fonte de verdade para estado de subscrição.

## 6.7 Uploads e documentos
- Upload em memória (sem persistência temporária local).
- Lista branca de tipos/extensões + validação por magic bytes.
- Documentos podem influenciar estados de tarefas/obrigações.

## 6.8 Obrigações e tarefas
- Obrigações têm ciclo operacional com deadlines e overdue.
- Tarefas suportam automação, comentários e anexos.
- Eventos de documento e pedido documental sincronizam tarefas.

## 6.9 Pedidos documentais e mensagens
- Mensagens podem ser convertidas em pedidos formais.
- Pedido documental possui ciclo de estados (open/seen/answered/completed).

## 6.10 Notificações e sinais
- Notificações in-app para firma e cliente.
- Live via polling incremental.
- Push opcional por VAPID.
- Tracking de views como telemetria operacional.

## 6.11 Automações, cron e jobs
- Regras de automação por tenant.
- Execução cron protegida por secret.
- Redis opcional com fallback inline.

## 6.12 Auditoria e logs
- Ações críticas geram atividade e/ou auditoria de segurança.
- Logs sanitizados para evitar vazamento de dados sensíveis.

## 6.13 Integrações externas
- Stripe para billing.
- Google OAuth para SSO.
- Brevo para email/SMS.
- Supabase DB e Storage.
- GeoAPI/ViaCEP para lookup postal.

---

# 7. Dependências Entre Módulos

Mapa textual de dependências principais (A -> B significa A depende de B):

- Auth -> Billing (gating de acesso da firma)
- Auth -> Legal
- Auth -> Team/Users
- Auth -> Clients
- Firm Administration -> Auth
- Firm Administration -> Storage
- Clients -> Auth
- Clients -> Documents
- Clients -> Tasks
- Team -> Auth
- Team -> Permissions
- Obligations -> Clients
- Obligations -> Tasks
- Obligations -> Documents
- Tasks -> Clients
- Tasks -> Documents
- Tasks -> Obligations
- Documents -> Storage
- Documents -> Tasks
- Document Requests -> Messages
- Document Requests -> Documents
- Messages -> Clients
- Messages -> Document Requests
- Portal -> Clients
- Portal -> Obligations
- Portal -> Tasks
- Portal -> Documents
- Portal -> Messages
- Portal -> Notifications
- Catalog/Booking -> Firm Administration
- Catalog/Booking -> Clients
- Broadcasts/News -> Notifications
- Notifications/Live/Push/Tracking -> Messages
- Notifications/Live/Push/Tracking -> Documents
- Service Requests -> Clients
- Service Requests -> Catalog
- Automations/Cron/Jobs -> Obligations
- Automations/Cron/Jobs -> Tasks
- Public/Legal -> Firm Administration
- Public/Legal -> Auth

Dependências de infraestrutura transversal:
- todos os módulos autenticados -> Auth middleware + Permission middleware
- quase todos os módulos -> Supabase repositories
- módulos com ficheiros -> Upload middleware + Storage service

---

# 8. Ordem Recomendada para Desenvolvimento em Java

Roadmap recomendado (incremental, orientado a risco):

Fase 1 - Fundação de plataforma
1. Core de plataforma (config, observabilidade, erro padrão, segurança base).
2. Identity & Access (Auth completo, sessão, password reset, SSO).
3. Billing & tenant gating.

Fase 2 - Núcleo operacional
4. Administração da firma.
5. Clientes e convites.
6. Equipa, departamentos e permissões.
7. Documentos (upload/validação/download).
8. Obrigações fiscais.
9. Tarefas operacionais.
10. Pedidos documentais.
11. Mensagens e inbox.

Fase 3 - Experiência cliente
12. Portal do cliente (fachada agregadora).
13. Catálogo, booking e consultas.
14. Service requests.

Fase 4 - Engajamento e inteligência operacional
15. Broadcasts e News.
16. Notificações, live, push e tracking.
17. Automações, cron e jobs.

Fase 5 - Superfície pública e compliance final
18. Público/legal/integrações auxiliares.
19. Endpoints legados de compatibilidade (se necessário em rollout gradual).

Critérios de aceitação por fase:
- paridade funcional de casos de uso críticos;
- segurança e multi-tenancy validados;
- métricas e auditoria operacionais ativas;
- testes de integração por bounded context.

---

# 9. Considerações Arquiteturais

## 9.1 Decisões a preservar na migração
- Separação por domínios de negócio (bounded contexts).
- Sessão com refresh persistido e revogável.
- Autorização por permissões e não só por role.
- Multi-tenancy estrito em toda a camada de domínio.
- Pipeline seguro de uploads/documentos.
- Idempotência em integrações de webhook.
- Automação resiliente com falha parcial tolerada.

## 9.2 Melhorias recomendadas na nova arquitetura Java
- Introduzir arquitetura hexagonal (ports/adapters) por domínio.
- Modelar state machines explícitas para:
  - billing da firma;
  - obrigações;
  - tarefas;
  - document requests;
  - service requests.
- Criar camada de Application Services com comandos/queries claros.
- Introduzir outbox pattern para eventos de integração e notificações.
- Normalizar auditoria e activity em event model comum.
- Introduzir versionamento de API e contratos de erro padronizados.
- Isolar scheduling em módulo próprio com jobs observáveis.
- Definir anti-corruption layer para integrações externas (Stripe, Brevo, Google).

## 9.3 Persistência e modelagem
- Manter modelagem tenant-first (firm_id obrigatório onde aplicável).
- Tratar soft delete e estados como parte do domínio.
- Criar read models para dashboards e inbox em vez de consultas ad-hoc pesadas.

## 9.4 Segurança
- Manter CSRF, cookies seguros e sanitização de logs.
- Rotacionar secrets e suportar key versioning.
- Reforçar proteção a enumeração de utilizadores em auth/recover.

## 9.5 Estratégia de migração
- Migração por fatias de domínio (strangler por bounded context).
- Começar por auth + billing + cliente + documentos + obrigações + tarefas.
- Usar testes de regressão funcional baseados nos casos de uso desta blueprint.

## 9.6 Definição de pronto para cada módulo Java
- Casos de uso da Secção 3 cobertos.
- Regras globais da Secção 6 aplicadas.
- Dependências da Secção 7 respeitadas.
- Fluxos da Secção 5 reproduzidos com paridade funcional.

---

## Apêndice A - Entidades SQL identificadas no backend atual

Tabelas base e migradas relevantes ao domínio:
- firms
- firm_users
- clients
- obligations
- client_tasks
- documents
- messages
- consultations
- client_invites
- audit_logs
- conversations
- document_requests
- task_recurring_rules
- task_month_exclusions
- stripe_webhook_events
- password_reset_tokens
- auth_refresh_sessions
- accounting_services
- content_views
- activity_events
- sms_logs
- news_articles
- in_app_notifications
- firm_broadcasts
- firm_broadcast_reads
- task_comments
- firm_notifications
- task_automation_rules
- push_subscriptions
- service_requests
- service_request_comments
- obligation_templates
- obligation_recurrence_rules
- user_legal_consents
- blog_newsletter_subscribers
- auth_login_attempts
- departments
- firm_member_invites
- email_confirmation_tokens

## Apêndice B - Endpoints transversais de plataforma

Além dos endpoints de domínio, existem rotas transversais:
- /api/csrf
- /health
- /api/health
- /api/public/stripe/webhook
- prefixos legados bloqueados via middleware anti-legado

Este documento é a referência funcional oficial para a reconstrução Java do backend Teglion.