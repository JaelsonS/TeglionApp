# Teglion — Módulos

**Documento oficial · Última actualização: Julho 2026**

Inventário de todos os módulos do Teglion, classificados por importância estratégica e estado de maturidade.

**Legenda:**
- ✅ **Essencial** — core do produto; manter e investir
- 🟡 **Precisa melhorar** — funcional mas incompleto, desconectado ou com dívida técnica
- 🔴 **Deve ser removido** — legacy, morto ou fora da proposta de valor

---

## Módulos do escritório (`/app/firm`)

| Módulo | Backend | Frontend | Classificação | Motivo |
|--------|---------|----------|---------------|--------|
| **Auth (escritório)** | `modules/auth` | `app/auth/firm` | ✅ Essencial | Porta de entrada; registo, login, SSO Google, onboarding |
| **Dashboard** | `modules/firm` | `app/firm/pages/FirmDashboardPage` | ✅ Essencial | Primeira impressão; KPIs operacionais |
| **Clientes** | `modules/firm/clients` | `app/firm/clients`, `client-hub` | ✅ Essencial | Carteira de clientes — entidade central do SaaS |
| **Documentos** | `modules/documents`, `document-requests`, `inbox` | `app/firm/documents-hub` | ✅ Essencial | Core da proposta de valor — pedidos, upload, validação |
| **Tarefas** | `modules/tasks` | `app/firm/tasks` | ✅ Essencial | Workspace operacional — kanban, obrigações, calendário |
| **Obrigações fiscais** | `modules/obligations` | `app/firm/tasks/obligations`, `obligations/` | ✅ Essencial | Prazos fiscais — retenção diária do utilizador |
| **Mensagens** | `modules/messages` | `app/firm/chat` | ✅ Essencial | Comunicação auditável escritório ↔ cliente |
| **Calendário fiscal** | `modules/fiscal` | `app/firm/FirmFiscalCalendarPage` | ✅ Essencial | Diferencial PT; datas nacionais com alertas |
| **Alertas / Broadcasts** | `modules/broadcasts` | `app/firm/pages/FirmAlertsPage` | ✅ Essencial | Comunicados do escritório para clientes |
| **Definições** | `modules/firm/firm-settings`, `team` | `app/firm/settings` | ✅ Essencial | Branding, equipa, push, configurações |
| **Billing** | `modules/billing` | `app/firm/pages/FirmBillingPage` | 🟡 Precisa melhorar | Código pronto; Stripe live não activo; UX de trial/expiração a validar |
| **Agenda / Consultorias** | `modules/consultations`, `booking` | `app/firm/pages/FirmAgendaPage` | 🟡 Precisa melhorar | Funcional mas uso secundário |
| **Serviços / Orçamentos** | `modules/service-requests` | `app/firm/pages/FirmServiceRequestsPage` | 🟡 Precisa melhorar | Útil para upsell de serviços; pouco validado no piloto |
| **Notificações firm** | `modules/notifications` | Integrado em várias páginas | 🟡 Precisa melhorar | In-app OK; push instável; sem centro unificado |
| **Automações** | `modules/automations` | `app/firm/settings` (parcial) | 🟡 Precisa melhorar | Backend com regras cron; UI de gestão limitada |
| **Integração AT** | `modules/integrations/at` | Hub cliente (links) | 🟡 Precisa melhorar | Apenas deep-links; sem API certificada — aceitável no piloto |
| **Activity feed** | `services/activity` | Hub cliente / timeline interna | 🟡 Precisa melhorar | Serviço interno activo; endpoint HTTP órfão removido (Etapa 1.4) |
| **SMS logs** | `services/sms` | ❌ Sem UI | 🟡 Precisa melhorar | Envio em schedulers; sem interface de gestão |
| **Tracking / views** | `modules/tracking` | Badges em docs/obrigações | 🟡 Precisa melhorar | Útil mas subutilizado; falta relatório consolidado |
| **News (escritório)** | `modules/news` | Redirect → alerts | 🔴 Deve ser removido | Rota `/app/firm/news` redirecciona para alerts; código duplicado |

---

## Módulos do portal cliente (`/app/client`)

| Módulo | Backend | Frontend | Classificação | Motivo |
|--------|---------|----------|---------------|--------|
| **Auth (cliente)** | `modules/auth` | `app/auth/client` | ✅ Essencial | Login, convite, registo |
| **Dashboard** | `modules/client/portal` | `app/client/pages/ClientDashboardPage` | ✅ Essencial | Hub do cliente — pedidos, estado, atalhos |
| **Pedidos de documentos** | `modules/document-requests` | `app/client/pages/ClientRequestsPage` | ✅ Essencial | Acção principal do cliente |
| **Documentos** | `modules/documents` | `app/client/pages/ClientDocumentsPage` | ✅ Essencial | Upload e consulta de ficheiros |
| **Obrigações** | `modules/obligations` | `app/client/pages/ClientObligationsPage` | ✅ Essencial | Cliente vê prazos e estado |
| **Mensagens** | `modules/messages` | `app/client/pages/ClientMessagesPage` | ✅ Essencial | Canal de comunicação |
| **Arquivo** | `modules/documents` | `app/client/pages/ClientArchivePage` | 🟡 Precisa melhorar | Funcional; candidato a fusão com Documentos (como no escritório) |
| **Alertas** | `modules/broadcasts` | `app/client/pages/ClientAlertsPage` | ✅ Essencial | Na sidebar e barra mobile; badges de não lidos |
| **Notícias** | `modules/news` | `app/client/pages/ClientNewsPage` | 🟡 Precisa melhorar | Na sidebar; valor a validar no piloto |
| **Marcações / Booking** | `modules/booking` | `app/client/pages/ClientBookingPage` | 🟡 Precisa melhorar | Na sidebar; uso secundário |
| **Push notifications** | `modules/push` | `components/settings/PushNotificationSettings` | 🟡 Precisa melhorar | `scope="client"` implementado mas não usado na UI |

---

## Módulos públicos / marketing

| Módulo | Backend | Frontend | Classificação | Motivo |
|--------|---------|----------|---------------|--------|
| **Landing** | — | `components/landing` | ✅ Essencial | Aquisição; primeira impressão |
| **Pricing** | — | `app/marketing/PricingPage` | ✅ Essencial | Conversão trial → pago |
| **Security page** | — | `app/marketing/SecurityPage` | ✅ Essencial | Confiança B2B; requisito enterprise |
| **Blog** | — | `app/blog`, `content/blog` | ✅ Essencial | SEO — motor de aquisição orgânica |
| **Legal** | `modules/legal` | `app/legal` | ✅ Essencial | RGPD; termos, privacidade, DPA |
| **Case studies** | — | `app/marketing/CaseStudiesPage` | ✅ Essencial | Link no footer da landing |
| **Newsletter blog** | `modules/public/blog-newsletter` | `app/blog` | 🟡 Precisa melhorar | Funcional; integrar com CRM futuro |
| **Postal lookup** | `modules/public/postal-lookup` | Formulários | 🟡 Precisa melhorar | PT: geoapi.pt + fallback postcode-pt (timeout/IPv4); BR ViaCEP no service mas flag off |
| **Firm branding público** | `modules/public/firm-branding` | Login cliente | ✅ Essencial | Branding white-label no login |

---

## Módulos de infraestrutura / plataforma

| Módulo | Localização | Classificação | Motivo |
|--------|-------------|---------------|--------|
| **Auth + sessões** | `modules/auth`, `middlewares/auth` | ✅ Essencial | JWT cookies, refresh, lockout, CSRF |
| **Multi-tenant** | `utils/contabil-scope`, RLS | ✅ Essencial | Isolamento por `firm_id` |
| **Storage** | `services/storage` | ✅ Essencial | Supabase Storage para documentos |
| **Email (Brevo)** | `services/email` | ✅ Essencial | Convites, lembretes, reset password |
| **Audit logs** | `services/audit` | ✅ Essencial | Compliance e segurança |
| **Rate limiting** | `app.js`, `utils/rate-limit-store` | ✅ Essencial | Protecção contra abuso |
| **Live events** | `modules/live` | 🟡 Precisa melhorar | Long-poll; substituir por WebSocket/Realtime |
| **Schedulers** | `modules/obligations/schedulers`, `server.js` | ✅ Essencial | Lembretes automáticos de prazos |
| **i18n** | `i18n/` (FE + BE) | 🟡 Precisa melhorar | 4 sistemas paralelos; só pt-PT activo |
| **Legacy clinic/patient** | ~~Espalhado~~ | ✅ Removido (Etapa 1.6) | Domínio unificado `firm`/`client`; JWT antigos aceites só na leitura de sessão |
| **Legacy print (exames)** | ~~`styles/legacy-print.css`~~ | ✅ Removido (Etapa 1.3) | Fluxo de impressão da era saúde; sem uso |
| **Legacy API blocks** | `middlewares/legacy-teglion` | 🟡 Precisa melhorar | Necessário temporariamente; remover após período de transição |
| **Permissões clínica** | ~~`PATIENTS_MANAGE`, `EXAM_*`, `DOCTORS_*`~~ | ✅ Renomeado (Etapa 1.5) | Substituído por permissões `FIRM_*`; `CLINIC_*` e `APPOINTMENTS_MANAGE` ficam para etapa futura |
| **Auth API fantasma** | ~~`login()`, `registerAdmin()`~~ | ✅ Removido (Etapa 1.4) | Rotas inexistentes no backend |
| **Design system morto** | ~~`MetricCard`, `PageShell`~~ | ✅ Removido (Etapa 1.3) | Exportados mas nunca usados |
| **PublicAdSense** | ~~`components/ads/PublicAdSense`~~ | ✅ Removido (Etapa 1.4) | Renomeado para `BlogAdSense.tsx` |
| **isTeglionMode()** | ~~`config/productMode.ts`~~ | ✅ Removido (Etapa 1.4) | Sempre `false`; ramo morto |
| **AppRouter wrapper** | ~~`components/layout/AppRouter.tsx`~~ | ✅ Removido (Etapa 1.4) | `App.tsx` usa `ContabilAppRouter` directamente |
| **Activity API órfã** | ~~`GET /contabil/activity`~~ | ✅ Removido (Etapa 1.4) | Sem consumidor UI; serviço interno mantido |

---

## Módulos futuros (não existem — planeados)

| Módulo | Fase roadmap | Prioridade |
|--------|--------------|------------|
| **AI Gateway** | Fase 5 | Alta |
| **WhatsApp Business** | Fase 6 | Alta |
| **Country Config** | Fase 4 | Alta |
| **Relatórios escritório** | Fase 3 | Média |
| **Webhooks / API pública** | Fase 7 | Média |
| **Integração ERP** | Fase 8 | Baixa (piloto) |
| **CMS blog** | Fase 8 | Baixa |

---

## Resumo executivo

| Classificação | Quantidade | Acção |
|---------------|------------|-------|
| ✅ Essencial | ~25 módulos | Investir, testar, documentar |
| 🟡 Precisa melhorar | ~18 módulos | Completar, conectar UI, ou decidir remover |
| 🔴 Deve ser removido | ~10 artefactos | Limpar na Fase 1 do roadmap |

---

## Critério de classificação

Um módulo é **essencial** se:
1. Responde "sim" à pergunta de produto (trabalhar melhor / conquistar / atender)
2. Está no fluxo piloto validado (registo → cliente → documento → validação)
3. Removê-lo quebraria a proposta de valor

Um módulo **precisa melhorar** se:
1. Funciona mas está desconectado (sem nav, sem UI, sem testes)
2. Tem dívida técnica que impede escala
3. Valor de negócio não foi validado com utilizadores

Um módulo **deve ser removido** se:
1. É legacy de produto anterior (clínica/saúde)
2. Não tem consumidores (código morto)
3. Está fora da proposta de valor actual e futura próxima

---

## Relação com outros documentos

| Documento | Conteúdo |
|-----------|----------|
| [ROADMAP.md](./ROADMAP.md) | Quando cada módulo será melhorado ou removido |
| [ARCHITECTURE.md](../engineering/ARCHITECTURE.md) | Como os módulos se organizam tecnicamente |
| [API.md](../engineering/API.md) | Endpoints por módulo |
