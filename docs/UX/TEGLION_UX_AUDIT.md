# Auditoria de UX/UI do Teglion — Estado Real do Frontend

**Data:** 2026-08-10
**Método:** leitura directa do código (rotas, componentes, chamadas de API), sem alterar nada. Seis frentes de investigação em paralelo cobrindo todo `frontend/src`, mais leitura própria do router e da configuração de navegação. Todas as afirmações abaixo têm referência `ficheiro:linha`.
**Estado do código:** nenhum ficheiro foi alterado nesta etapa. Isto é só diagnóstico.

Este documento é o inventário "como está hoje". A proposta de nova arquitetura vive em [`TEGLION_INFORMATION_ARCHITECTURE.md`](./TEGLION_INFORMATION_ARCHITECTURE.md) e o novo menu concreto em [`TEGLION_NAVIGATION.md`](./TEGLION_NAVIGATION.md).

---

## 0. Como ler este documento

Por área de produto: tabela `ROTA | TELA | FUNCIONALIDADE | API | COMPONENTES | MENU ATUAL`, seguida de achados (funcionalidades escondidas, nomenclaturas inconsistentes, telas sem CTA/estado vazio, duplicações). No fim, uma secção consolidada com os problemas que atravessam várias áreas — esses são os que mais justificam uma reorganização, não pequenos ajustes isolados.

---

## 1. Navegação actual — a fonte de verdade

Configuração central: `frontend/src/features/firm/firmNavConfig.ts`. **Existem 4 configurações de navegação distintas, não sincronizadas entre si**, cada uma servindo uma superfície diferente:

| Superfície | Constante | Itens |
|---|---|---|
| Drawer mobile / sidebar desktop larga | `FIRM_NAV_GROUPS` (linhas 33-145) | 12 itens em 5 grupos: Visão geral, Clientes, Comunicação, Operação, Gestão |
| Rail de ícones desktop | `FIRM_NAV_RAIL_MAIN` + `FIRM_NAV_RAIL_BOTTOM` (150-224) | 11 itens, sem grupos |
| Barra inferior mobile (primária) | `FIRM_NAV_MOBILE_PRIMARY` (227) | primeiros 5 do rail |
| "Mais" mobile | `FIRM_NAV_MOBILE_MORE` (229-232) | restantes 4 do rail + Plano + Definições |

**Achado crítico:** "Notícias" existe em `FIRM_NAV_GROUPS` (grupo "Gestão", linha 118-123) mas **não existe em `FIRM_NAV_RAIL_MAIN` nem em `FIRM_NAV_RAIL_BOTTOM`** — está portanto ausente do rail desktop, da barra inferior mobile e do menu "Mais" mobile. Só é alcançável pelo drawer completo. Um item de menu de primeira classe fica invisível em três das quatro superfícies de navegação do produto.

**Rótulos divergentes para o mesmo item**, dependendo de qual das 4 configurações renderiza: "Central de Alertas" (`FIRM_NAV_GROUPS`, linha 115) vs "Alertas" (`FIRM_NAV_RAIL_MAIN`, linha 199) — mesma rota `/app/firm/alerts`, dois `labelDefault` diferentes na mesma key i18n; se a tradução i18n para essa chave alguma vez faltar, os dois lugares mostram texto diferente para o utilizador.

---

## 2. Clientes, Leads e Central de Serviços

### 2.1 Tabela de ecrãs

| ROTA | TELA | FUNCIONALIDADE | API | MENU ATUAL |
|---|---|---|---|---|
| `/app/firm/clients` | `FirmClientsPage.tsx:71`, título "Empresas" (214-216) | Lista/pesquisa/filtra clientes, alterna lista↔grelha, "Nova empresa" | `GET /contabil/clients` | Directo — "Empresas", grupo Clientes |
| `/app/firm/clients/:clientId` | `FirmClientHubPage.tsx:33` — sem `h1` fixo, chamado "cockpit" no menu de contexto (`FirmClientsPage.tsx:421`) e "central desta empresa" numa mensagem de erro (`FirmClientHubPage.tsx:66`) | Cockpit com 7 abas: Resumo, Empresa, Actividade, Obrigações, Documentos, Tarefas, Comunicação | `GET /contabil/clients/:id/hub` + APIs por painel | 1 clique a partir da lista, sem entrada de menu própria |
| `/app/firm/services` (tab central) | `ServicesWorkspace.tsx:64`, "Central de Serviços" | Kanban pós-venda de 6 colunas (Novos→Atribuídos→Orçamentados→Aprovados→Em curso→Concluídos), orçamento com PDF | `api.get/post/patch('/contabil/service-requests...')` **sem módulo de API dedicado** — único domínio do produto sem `infrastructure/api/contabil/*.ts` próprio | Directo — "Serviços", grupo Gestão |
| `/app/firm/services?tab=inquiries` | `ServiceInquiriesWorkspace.tsx:66`, "Solicitações" | Pipeline de captação pública (`service_inquiries`), contacto de Lead/Client, checklist de pendências, sem criação manual | `/contabil/service-inquiries*`, `/contabil/leads/:id` | Aba dentro de "Serviços", sem URL própria |
| (modal) | `CreateCompanyWizard.tsx:52` | Wizard de 4-5 passos para criar `Client` (inclui Empresa, Independente **e Particular**) | `POST /contabil/clients` | Só via botão "Nova empresa" |
| (nenhuma) | — | **Não existe nenhuma tela de lista de Leads** | `contabilLeadsApi` só tem `getById` (`infrastructure/api/contabil/leads.ts:13-17`), nunca `list` | Não existe |

### 2.2 Achados

**Leads são invisíveis como conjunto.** Confirmado por grep exaustivo — a única API é `getById`, usada num único lugar (`ServiceInquiriesWorkspace.tsx:106`) só para mostrar contacto dentro do detalhe de uma Solicitação específica. Não há pesquisa, filtro, nem lista agregada de Leads em lado nenhum. Comentário no próprio código confirma que isto já foi identificado como gap: *"Sem isto, um Lead novo (...) fica sem nenhuma forma de a equipa ver o email/telefone para o contactar"* (linha 101-103).

**"Empresa" é usado mesmo para pessoas singulares.** O tipo `Client` distingue `COMPANY`/`SELF_EMPLOYED`/`INDIVIDUAL` (`clientRegistrationConfig.ts:3`), mas a página chama-se "Empresas", o wizard chama-se "Nova empresa", e a aba do cockpit para editar dados pessoais chama-se "Empresa" (`sections.ts:20`). Uma pessoa singular sem negócio próprio passa pelo mesmo rótulo do início ao fim.

**Dois nomes para o mesmo ecrã de cliente:** "cockpit" (menu de contexto) vs "central desta empresa" (mensagem de erro).

**Dois pipelines de "pedido do cliente" na mesma página, sem ligação entre si.** "Central de Serviços" (`service_requests`, criação manual, exige `Client` já existente) e "Solicitações" (`service_inquiries`, só via captação pública, pode ter `Lead`) resolvem o mesmo problema de negócio — acompanhar um pedido até à conclusão — com modelos de dados, APIs e vocabulário diferentes ("pedido" vs "solicitação"), e **não há acção "converter Solicitação em pedido"**, mesmo sendo o passo seguinte natural quando uma Solicitação é aprovada.

**"Pedido" é usado para duas entidades completamente diferentes**: `service_requests` (Central de Serviços) e os "pedidos de documentos" do módulo Documentos (`DocumentRequest`) são conceitos de negócio distintos com o mesmo substantivo.

**Duplicação de "serviços do cliente".** `ClientHubServicesSection.tsx` (aba Empresa do cockpit) e o passo "Serviços" de `CreateCompanyWizard.tsx:832-857` fazem a mesma coisa (marcar `AccountingService[]` contratados) com dois componentes de checkbox diferentes, sem código partilhado.

**Ponteiro para o sítio errado.** Quando um cliente não tem serviços configurados, `ClientHubServicesSection.tsx:29` diz *"Nenhum serviço configurado no escritório. Configure em Definições."* — mas "Definições" aqui significa Consultorias → Definições da agenda, não o item de menu "Definições" (`/app/firm/settings`) que está literalmente ao lado no menu "Gestão". Um utilizador que siga este texto é guiado para o lugar errado.

**Estados vazios inconsistentes entre vistas da mesma página.** `FirmClientsPage`, vista em tabela, mostra "Nenhuma empresa neste filtro" **com** botão "Nova empresa" (357-359); a mesma página em vista de grelha mostra o mesmo texto **sem** CTA (305). Nenhuma das duas distingue "não há clientes de todo" de "o filtro não devolveu nada".

**Duas listagens de actividade sobrepostas na mesma aba.** `FirmClientHubPage.tsx:264-288`, aba "Actividade", empilha `ClientHubHistory` (lista simples sem paginação) directamente sobre `ClientHubActivityHistoryPanel` (lista paginada, com filtros) — mesmos dados, duas UIs.

---

## 3. Serviços, Catálogo, IRS, Booking e Google Calendar — a área mais confusa do produto

Esta é a área com mais achados e a que mais justifica reorganização, porque concentra 4 conceitos de produto (Serviços, IRS, Agendamento, Google Calendar) dentro de uma única página cujo nome no menu não sugere nenhum deles.

### 3.1 O que existe hoje

Rota `/app/firm/agenda` → `AgendaWorkspace.tsx`. Título de menu: **"Consultorias"** (`firmNavConfig.ts:96`). Título `h1` da própria página: **"Agenda"** (`AgendaWorkspace.tsx:217`). Rodapé: "Consultorias / Agenda" (linha 369) — três nomes diferentes para a mesma tela em três lugares diferentes, e o `h1` "Agenda" permanece visível mesmo quando se está dentro da sub-tela de configuração.

Clicar em "Definições" no topo (1 clique) abre `AgendaSettingsView.tsx` (`?panel=settings`, sem URL própria — é o mesmo componente, não uma rota nova), que empilha 3 blocos:

1. **Disponibilidade** (`AgendaAvailabilityPanel.tsx`) — horas/dias de expediente gerais do escritório.
2. **"Catálogo de serviços"** (título do wrapper, `AgendaSettingsView.tsx:73`) que por sua vez tem um `h3` interno chamado **"Catálogo de consultorias"** (`AgendaServicesCatalogPanel.tsx:472`) — dois nomes para a mesma secção, um logo a seguir ao outro.
3. **Integrações** → `GoogleCalendarIntegrationPanel.tsx` — ligar/desligar Google Calendar.

### 3.2 Criar e publicar um Serviço (com formulário estilo IRS) — fluxo real, contado

Não existe botão "criar serviço do zero". As únicas duas vias:
- **Activar do catálogo nacional** (20 entradas fixas em `backend/src/data/consulting-services-catalog.js`): 3 cliques (Definições → popover "Activar do catálogo" → "Activar seleccionados").
- **Duplicar** um serviço já activo: 2-3 cliques.

Configurar o formulário de captação + documentos exigidos + overrides de agendamento de um serviço: mais 2 cliques para abrir uma gaveta **sem título de secção próprio** (só um ícone de engrenagem com tooltip "Definições avançadas (link público, agendamento, documentos)" — não menciona "formulário" nem "perguntas"), preencher, e **1 único botão "Guardar"** para os 4 sub-blocos (slug/publicação, overrides de horário, documentos, formulário) — sem confirmação diferenciada de que isto vai tornar algo público.

**Não existe conceito de rascunho vs. publicado, nem botão "Publicar".** A publicação acontece silenciosamente quando `isPubliclyListed=true` + `slug` preenchido são gravados juntos.

**Preview é um mock que admite, no próprio código, não reflectir a realidade**: `ServiceFormPreview.tsx:21-27` — comentário explícito de que não reaproveita o componente público real, "de propósito". O link "Ver página pública" real só aparece depois de gravar (lê do estado já persistido, não do rascunho em edição) — editar o slug e não ver o link mudar pode fazer o utilizador pensar, erradamente, que não gravou.

### 3.3 IRS — confirmação exaustiva

Busca por "IRS" em todo `frontend/src` (excluindo o blog de marketing): **não existe nenhum componente, rota ou secção chamada IRS.** As únicas ocorrências reais:
- `ObligationType` (tipo usado no Calendário fiscal / Obrigações — área completamente diferente).
- Labels de ficha fiscal do cliente ("Enquadramento IRS/IRC") — Client Hub, não Consultorias.
- **`AgendaServicesCatalogPanel.tsx:758`** — a única ocorrência dentro desta área: um *placeholder* de exemplo no campo slug (`"ex.: irs-2026"`), não um rótulo estrutural.
- No catálogo nacional fixo, 2-3 entradas têm "IRS" no nome (`simulacao-irs`, `entrega-irs-orcamento`). O campo `category` do catálogo (que já teria "IRS" como categoria) **existe no tipo de dados mas nunca é lido nem exibido** no painel — confirmado por grep, zero ocorrências. A lista é sempre plana, sem agrupamento por categoria, apesar de o catálogo nacional já ter essa estrutura pronta.

**Conclusão: IRS existe apenas como nome literal de 2-3 itens opcionais dentro de um catálogo de 20, nunca como conceito de UI próprio.**

### 3.4 Contagem de cliques a partir do zero (aterrando em "Consultorias")

| Destino | Cliques |
|---|---|
| Abrir "Definições da agenda" | 1 |
| Activar/criar um Serviço | 3 |
| Configurar formulário/IRS de um serviço | 2 (abrir) + 1 (guardar) |
| Ligar Google Calendar | 2 |
| Definir disponibilidade geral | 1 (ver, já visível) + 1 (guardar) |
| Ver preview (mock) da página pública | 2 |
| Ver a página pública real | 2 (+ ter gravado antes) |

Em nenhum destes caminhos aparecem as palavras "IRS", "Booking" ou "Serviços" (como cabeçalho estrutural) — só "Google Calendar" e "Página pública", ambos depois de 1-2 cliques dentro de "Definições".

### 3.5 Outros achados desta área

- `seedCatalog()` corre automaticamente e em silêncio na primeira visita (`AgendaServicesCatalogPanel.tsx:140-159`) — todos os serviços nascem inactivos, exigindo activação manual antes de aparecerem em qualquer lado.
- `POST /contabil/accounting-services` (criar serviço do zero) existe na API mas **nunca é chamado** pelo frontend — reforça que a via "criar do zero" nunca foi construída no UI, só "activar"/"duplicar".
- Duplicação: "Próximas reuniões" aparece tanto no Dashboard (`FirmDashboardPage.tsx:403-433`) como na barra lateral da própria Agenda (`AgendaSidebar.tsx:100-131`) — duas vistas independentes dos mesmos dados.
- O botão superior da Agenda alterna entre os rótulos "Definições" e "Calendário" consoante o estado (`AgendaWorkspace.tsx:229`) — não é uma aba com nome estável, é um verbo que muda.

---

## 4. Documentos e Comunicação

### 4.1 Tabela de ecrãs

| ROTA | TELA | FUNCIONALIDADE | API |
|---|---|---|---|
| `/app/firm/documents/requests` | `FormalRequestsModule.tsx:31`, "Pedidos formais" | Inbox de `DocumentRequest`, detalhe com stepper de 5 passos | `GET /contabil/inbox`, `POST /contabil/document-requests` |
| `/app/firm/documents/files` | `DocumentsFilesWorkspace.tsx` | Tabela de ficheiros, aprovar/rejeitar, mensagem ao cliente | `GET/PATCH /contabil/documents*` |
| `/app/firm/documents/history` | `DocumentsHistoryWorkspace.tsx` | Vista agregada por submissão, exportar CSV, apagar | mesma API de `files` |
| `/app/firm/messages` | `FirmMessagesModule.tsx:59`, "Mensagens" | Chat por cliente, anexo, importar do Google Drive | `GET/POST/PATCH /contabil/messages*` |
| `/app/firm/alerts` | `AlertsWorkspace.tsx`, título interno **"Central de comunicação"** (314) | CRUD de comunicados/broadcasts, segmentação de destinatários, leitura confirmada, analytics | `/contabil/broadcasts*` |
| `/app/firm/news` | `NewsWorkspace.tsx`, "Notícias do portal" | CRUD de artigos longos, sem segmentação, sem analytics | `/contabil/news*` |

### 4.2 Achados

**"Notificar cliente" é decorativo.** O botão em `DocumentRequestDetailPanel.tsx:193-207` não chama nenhuma API — só mostra um `toast.message` dizendo que a funcionalidade "em breve" existirá. Está visível e clicável como se fizesse algo.

**Validar documento a partir de um Pedido não valida ali.** O botão "Validar ficheiro" (`DocumentRequestDetailPanel.tsx:154-157`) só navega para a aba "Ficheiros" com `?doc=<id>` — quem só olha para "Pedidos" não percebe que aprovar/rejeitar fica noutra aba.

**Terceiro nome para o mesmo ecrã.** "Central de Alertas" (nav) / "Alertas" (rail) / **"Central de comunicação"** (título dentro da própria página) — três rótulos para o mesmo `AlertsWorkspace.tsx`.

**"Pedido" vs "Solicitação" outra vez.** `/app/firm/documents/requests` chama-se "Pedidos"; `/app/firm/services?tab=inquiries` chama-se "Solicitações" — sinónimos em português corrente, convidando a assumir erradamente que são a mesma coisa.

**Documentos de captação pública são um silo total.** Ficheiros entregues via `service_inquiries` (`ServiceInquiryChecklistItem.documentId`) usam um endpoint de download próprio (`GET /contabil/service-inquiries/:id/documents/:documentId/download`) e **nunca aparecem em `/app/firm/documents/files`** — se um Lead que já enviou documentos pela página pública se tornar Client, esses documentos não migram nem ficam visíveis no módulo de Documentos "normal".

**Leads sem chat.** Confirmado por grep — toda a stack de chat (`features/firm/chat/`) é 100% `clientId`; não existe `leadId` em lado nenhum. A única forma de "contactar" um Lead é sair da app via `mailto:`/`tel:`.

**Alertas e Notícias são uma coisa só do lado do cliente, mas duas do lado do escritório.** O portal do cliente já fundiu os dois num único ecrã "Avisos" com abas (`ClientUpdatesPage.tsx`); o staff mantém duas páginas de nav completamente separadas, dois composers, duas APIs — mesmo partilhando infraestrutura no backend (o mesmo endpoint de upload de capa, `/contabil/news/cover`, é usado por ambos, `AlertComposer.tsx:54`).

**Três implementações diferentes de "escrever ao cliente".** O mesmo `contabilMessagesApi.send` é invocado a partir do composer principal do Chat, do campo "Comentário" no preview de Ficheiros, e indirectamente pela criação de um Pedido formal — três UIs ligeiramente distintas para o mesmo conceito.

**Estados vazios sem CTA:** "Ficheiros" e "Histórico" não têm nenhuma acção sugerida quando vazios (só texto). O chat vazio ("Sem conversas activas") também não tem CTA — e como não existe "iniciar conversa" manual, um escritório novo sem clientes vê uma tela morta.

---

## 5. Tarefas, Dashboard e Calendário Fiscal

### 5.1 Tabela de ecrãs

| ROTA | TELA | FUNCIONALIDADE |
|---|---|---|
| `/app/firm/dashboard` | `FirmDashboardPage.tsx:52`, "Painel operacional" | 6 KPIs clicáveis, Prioridade 48h, Obrigações em atraso, Docs pendentes, Estado da carteira, Agenda hoje, Atividade recente, 4 atalhos rápidos |
| `/app/firm/tasks/overview` | `TasksOverviewPanel` | KPIs unificados (obrigações + tarefas manuais), tabela de prioridade, distribuição por responsável |
| `/app/firm/tasks/obligations` | `TasksObligationsTableView` | Obrigações fiscais **reais por cliente**, com estado/responsável/documentos |
| `/app/firm/tasks/manual` | `TasksManualView` | Kanban de tarefas internas (4 colunas visuais: A fazer/Em curso/Em revisão/Concluído) |
| `/app/firm/tasks/calendar` | `TasksOperationsCalendarView` | Calendário mensal combinando obrigações + tarefas |
| `/app/firm/tasks/clients` | `TasksByClientTableView` | Carga de trabalho agregada por empresa |
| `/app/firm/fiscal-calendar` | `FiscalCalendarWorkspace.tsx:141`, "Calendário fiscal" | Almanaque **genérico nacional** de prazos legais (não por cliente), com criação rápida de obrigação a partir de um prazo |

### 5.2 Achado central: "Calendário fiscal" existe em dois lugares com o mesmo nome, dados diferentes

Não é a mesma coisa mostrada duas vezes — `/app/firm/fiscal-calendar` é conteúdo de referência (prazos legais nacionais, iguais para todos os escritórios), enquanto "Tarefas → Obrigações fiscais" são registos operacionais reais por cliente. Mas:
- O item de menu chama-se "Calendário fiscal" **e** o subtítulo da aba "Obrigações fiscais" dentro de Tarefas diz literalmente **"Calendário fiscal automático por empresa"** (`TasksWorkspaceShell.tsx:11`) — a mesma expressão para dois ecrãs de dados totalmente diferentes.
- Ambos têm a mesma metáfora visual (grid mensal com pills coloridas).
- Ambos permitem "criar obrigação fiscal", por 2 caminhos diferentes cada.
- A única ligação entre os dois é textual, dentro do conteúdo ("Compare com as obrigações dos clientes em Tarefas.", rodapé do detalhe do prazo) — nenhuma indicação no menu de que estão relacionados.

### 5.3 Outros achados

- **Botão fantasma**: "Exportar" na tabela de Obrigações fiscais (`TasksObligationsTableView.tsx:196-199`) não tem `onClick`.
- **Toggle fantasma**: Semana/Dia no Calendário de Tarefas muda o botão activo mas não altera nada (só "Mês" está implementado).
- **Estado `BACKLOG` sem coluna**: existe como estado real e é filtrável, mas o Kanban só tem 4 colunas visuais — cai implicitamente em "A fazer".
- **Dashboard nunca menciona Serviços/Solicitações**: zero ocorrências de "Serviç"/"solicita"/"lead" em `FirmDashboardPage.tsx`/`firmDashboardUtils.ts`, apesar de "novas solicitações de clientes" ser conceptualmente do mesmo tipo de "trabalho pendente" que os KPIs já mostrados (Docs p/ validar, Tarefas abertas).
- **Botão "Notificar" desaparece em vez de desactivar**: quando não há itens críticos, o botão simplesmente não é renderizado, nunca sendo descoberto por quem não tem críticos no momento em que abre o Dashboard.
- **`features/firm/obligations/`** não é código morto — é a camada de dados/lógica (`useObligationsHub`, `obligationOperational.ts`, `ObligationCreatePanel`) que sobrevive à consolidação em Tarefas, só sem página própria (a rota antiga `/app/firm/obligations` é hoje um redirect puro).

### 5.4 Tabela de nomenclatura cruzada (Dashboard × Tarefas × Calendário fiscal)

| Conceito | Dashboard | Tarefas | Calendário fiscal |
|---|---|---|---|
| Vencido | "Em atraso" | "Em atraso" | "Em atraso" |
| A vencer em breve | "Críticas 48h" | lane interna "critical" (não exposta) | "Esta semana" (≤7 dias) |
| Não iniciado | — | "A fazer" / "Em fila" (2 termos p/ 2 status distintos: TODO/BACKLOG) | — |
| Vencimento | "vence" | "Vencimento" (tabela) / "Prazo" (painel) | "Prazo" |

---

## 6. Configurações e Design System

Ver documento dedicado [`TEGLION_DESIGN_SYSTEM.md`](./TEGLION_DESIGN_SYSTEM.md) para o inventário completo de componentes. Resumo dos achados de Configurações (`/app/firm/settings`, `FirmSettingsPage.tsx:23-30`):

- Exactamente 6 abas: Identidade, Escritório, Perfil, Equipa, Notificações, Encerrar conta.
- **RBAC é genuinamente granular** — a aba Equipa tem um painel de permissões por membro com toggle Herdar/Substituir e um catálogo de 26 permissões por área (`FirmSettingsTeamSection.tsx:784-878`). Isto está bem construído, só não é visível de fora de Definições.
- **Confirmado: nenhuma duplicação** de Google Calendar, disponibilidade ou catálogo de serviços dentro de Definições — esses três vivem exclusivamente em Agenda, como já documentado na secção 3.
- **Não existe nenhuma aba "Integrações"** — Google Calendar é a única integração do produto hoje e está fora de Definições por completo.
- **"Plano" (billing) e "Definições" são irmãos no menu**, não pai/filho — ambos no grupo "Gestão" e ambos fixados no fundo do rail desktop, o que os apresenta com o mesmo peso hierárquico que "Encerrar conta", convidando a pergunta "porque é que Faturação não é só mais uma aba de Definições, como Equipa e Notificações são?".

---

## 7. Portal do Cliente

### 7.1 Navegação do cliente (`ClientPortalShell.tsx:30-39`)

6 itens na barra lateral: Início, Pedidos, Mensagens, Documentos, Agenda, Avisos. **Conta** e **Arquivo** não estão na navegação primária — Conta só pelo rodapé (avatar), Arquivo só por um link de texto no fundo da página Documentos.

### 7.2 Achados

**"Agenda" do cliente funde tudo; "Agenda" do staff está fragmentada em 3.** `/app/client/agenda` mistura obrigações fiscais + tarefas + marcação de consultoria numa única página com abas "Visão geral"/"Consultoria". O staff vê a mesma informação espalhada por 3 telas distintas: Consultorias, Calendário fiscal, Tarefas → Obrigações. Não há correspondência 1:1 entre o que o cliente vê e o que o staff vê para o mesmo conceito.

**Deriva "Booking" (código) → "Consultoria" (UI), rename incompleto.** Toda a camada de dados usa "booking" (`bookConsultation`, `ClientBookingPanel.tsx`, `requiresBooking`), mas a UI em todo o lado — staff e cliente — só mostra "Consultoria". Ficheiros órfãos confirmam o rename incompleto: `ClientBookingPage.tsx`, `ClientAlertsPage.tsx`, `ClientNewsPage.tsx` continuam no repositório **sem rota** (substituídos por `ClientObligationsPage`/`ClientUpdatesPage`), com o texto antigo ainda dentro.

**"Ficheiro"/"Ficheiros"/"Documentos" não alinham entre os dois lados.** O staff tem 3 abas: Pedidos/Ficheiros/Histórico. O cliente tem 3 páginas de topo: Pedidos (alinha), **Documentos** (mais perto conceptualmente de "Ficheiros" do staff, mas outro nome) e **Ficheiro** (só documentos aprovados — mais perto de "Histórico", mas usa uma palavra que do lado do staff já significa outra coisa).

**Confirmação Google Calendar é staff-only.** Não existe, em lado nenhum de `features/client/`, iframe do Google Calendar, `.ics`, ou "adicionar ao calendário". A confirmação de marcação do cliente é só um toast + uma lista em app + um ponto colorido num calendário próprio construído à mão (`ClientAgendaCalendar.tsx`).

---

## 8. Onboarding e o gap do URL público

### 8.1 Primeiros 10 minutos de um escritório novo

1. **Registo** (`FirmRegisterPage.tsx`/`FirmRegisterGooglePage.tsx`) — pede nome do escritório, nome do dono, email, password. **Não pede nem menciona slug/URL pública em lado nenhum.**
2. **Aterra directamente no Dashboard completo** — não existe rota de onboarding própria; `FirmOnboardingWizard.tsx` é um widget no topo do Dashboard (`FirmDashboardPage.tsx:169`), não um ecrã. Isto significa que a primeira tela de um escritório novo mostra 5 painéis operacionais **todos vazios ao mesmo tempo** ("Nada crítico...", "Sem atrasos...", "Fila de validação vazia", "Sem reuniões hoje", "Sem movimento recente") empilhados atrás do checklist.
3. **Checklist de 4 passos** (`FirmOnboardingWizard.tsx:11-40`): perfil/logo → primeira empresa → "convidar cliente ao portal" → criar obrigação/tarefa.

### 8.2 Bug funcional encontrado (não só UX)

**O passo 3 do checklist ("Convidar um cliente ao portal") nunca pode ficar marcado como concluído** — `completed.invite` está hardcoded a `false` (`FirmOnboardingWizard.tsx:70`), independentemente de o escritório já ter convidado alguém ou não. Isto não é um problema de organização de menu, é um bug de lógica dentro do próprio widget de onboarding — sinalizado aqui separadamente porque está fora do âmbito de "reorganizar", é uma correcção de código real.

### 8.3 O URL público é invisível até ao fim

Nenhum dos 4 passos do checklist menciona Serviços, IRS, página pública ou Google Calendar. `FirmSettingsPage.tsx` (Definições) nunca menciona "slug" nem mostra a URL pública (zero ocorrências, confirmado por grep). **O único lugar do produto inteiro onde o URL público aparece** é dentro de Agenda → Definições → Catálogo de serviços → expandir um serviço → "Definições avançadas" → activar "Aparece na página pública" + preencher um slug manualmente — só então surge o link "Ver página pública" (`AgendaServicesCatalogPanel.tsx:786-795`). Nada — nem onboarding, nem dashboard, nem Definições — aponta para este caminho.

---

## 9. Problemas transversais — os que mais justificam reorganizar, não remendar

Estes são os achados que aparecem repetidos em várias áreas, e por isso são os candidatos mais fortes a resolver estruturalmente na nova IA, em vez de corrigidos um a um:

1. **O item de menu "Serviços" não leva a "gerir serviços"** — leva a um pipeline de vendas pós-venda. A tela real de criar/publicar serviços (incluindo IRS) está 3 cliques dentro de uma página chamada "Consultorias". Isto por si só explica grande parte da frustração original com a navegação.
2. **"Pedido" e "Solicitação" competem pelo mesmo significado** em 3 módulos diferentes (Central de Serviços, Documentos, Solicitações) sem nenhum vocabulário único.
3. **Uma mesma tela tem 2-3 nomes diferentes consoante onde é referida** — acontece com Consultorias/Agenda, Central de Alertas/Alertas/Central de comunicação, Cockpit/Central. Não há uma única fonte de verdade para o nome de um ecrã.
4. **Leads não têm lar** — nem lista, nem chat, só um contacto pontual dentro de uma Solicitação.
5. **Onboarding não aponta para nada do que esta iniciativa pretende resolver** — não fala de Serviços, IRS, página pública nem Google Calendar, e tem um bug que impede um dos 4 passos de ser concluído.
6. **Botões e toggles decorativos** (Notificar cliente, Exportar, Semana/Dia) minam a confiança — algo que parece uma acção mas não faz nada é pior, para a percepção de qualidade, do que a acção não existir de todo.
7. **Estados vazios inconsistentes** — a mesma página (Empresas) mostra CTA numa vista e não na outra; várias páginas (Ficheiros, Histórico, Chat) não sugerem nenhum próximo passo quando vazias.

Estes 7 pontos, mais do que qualquer ajuste visual, são o que faz o Teglion "parecer um sistema com muitas funcionalidades espalhadas" em vez de uma plataforma coerente — e são exactamente o que a nova arquitectura de informação, em [`TEGLION_INFORMATION_ARCHITECTURE.md`](./TEGLION_INFORMATION_ARCHITECTURE.md), foi desenhada para resolver.
