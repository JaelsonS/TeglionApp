# Auditoria Fase 0 — Evolução do Teglion (20/08/2026)

> Auditoria técnica read-only, feita antes de qualquer implementação, cobrindo os 15 itens funcionais pedidos: tarefas multi-cliente, edição de tarefas, imagem/hierarquia de serviços, organização da página pública, agenda em calendário mensal, MFA (dono e funcionário), step-up authentication, Google Calendar, e a base comercial futura (pricing, add-ons, SMS/créditos). Todo achado abaixo tem evidência de código real (`arquivo:linha`), levantada por 8 investigações paralelas e independentes nesta data. Nenhuma linha de código foi alterada nesta fase.

## Como ler este documento

Cada item tem: **Classificação** (IMPLEMENTAR / CORRIGIR / REUTILIZAR / AUDITAR / ARQUITETAR / DOCUMENTAR — pode ser mais de uma), **o que já existe**, **o que falta**, **riscos**, **componentes reutilizáveis**, e **decisão arquitetural pendente** quando houver.

---

## Sumário executivo

| # | Item | Classificação | Achado principal |
|---|---|---|---|
| 1 | Tarefas — múltiplos clientes | ARQUITETAR + IMPLEMENTAR | `client_id` já é nullable, `ON DELETE SET NULL` — migração pra M2M é aditiva e segura, sem risco de dado existente |
| 2 | Tarefas — edição/modal | CORRIGIR | Hoje só o **Estado** é editável; título/descrição/prioridade/prazo/responsável já são aceitos pelo backend mas são texto somente-leitura no frontend |
| 3 | Serviços — imagem/crop | IMPLEMENTAR | Crop existe, mas é "assado" nos pixels antes do upload — não há dado de posição persistido, não é reeditável |
| 4 | Serviços — hierarquia | ARQUITETAR | Não existe hierarquia real, só um campo de texto livre (`public_group`) sem FK nem tabela própria |
| 5 | Página pública — organização | IMPLEMENTAR + REUTILIZAR | Agrupamento e dropdown nativo já existem parcialmente; drag-and-drop testado existe em outro módulo, pronto pra clonar |
| 6 | Agenda — calendário mensal | IMPLEMENTAR + REUTILIZAR | Modelo de dados já suporta quase tudo pedido; falta só a UI de calendário clicável (componente genérico já existe) |
| 7 | MFA — dono obrigatório | IMPLEMENTAR do zero | MFA não existe em nenhuma camada — schema, backend, frontend. Confirmado, não é suposição |
| 8 | MFA — funcionário opcional | IMPLEMENTAR do zero | Mesma base do item 7 |
| 9 | Step-up para credenciais sensíveis | REUTILIZAR + AUDITAR | **Já existe e funciona** — JWT de 8h, protege credenciais de portais oficiais. É single-factor (senha), não MFA |
| 10 | Outras ações sensíveis | AUDITAR + ARQUITETAR | Nenhuma ação sensível (mudar e-mail, remover admin, exportar CSV) usa o step-up hoje, exceto import de CSV com senha |
| 11 | Google Calendar | CORRIGIR | Dois bugs concretos identificados, não hipóteses — ver item 11 |
| 12 | Pricing futuro | ARQUITETAR (fácil) | Estrutura já centralizada; replicar o padrão é baixo risco |
| 13 | Página pública como add-on | REUTILIZAR (parcial) | `entitlements.can()` já existe, mas é feature global, não por escritório — falta "o outro lado" (o que desbloqueia) |
| 14 | SMS e créditos | IMPLEMENTAR do zero | Sem nenhum contador/saldo hoje; log de auditoria existe mas não agrega |
| 15 | Arquitetura de créditos genérica | ARQUITETAR | Nenhum precedente reaproveitável direto; entitlements como base conceitual, não como implementação pronta |

---

## 1 — Tarefas manuais: múltiplos clientes

**Classificação: ARQUITETAR + IMPLEMENTAR**

**O que existe:**
- `client_tasks.client_id` é **FK singular** (`UUID`), não M2M. Tornada `NULLABLE` com `ON DELETE SET NULL` pela migration `supabase/migrations/20261005000000_client_tasks_optional_client.sql` — antes disso o cliente já tinha existido como obrigatório.
- Tarefa sem cliente já é suportada de ponta a ponta (`tasks-workspace.service.js:198`, UI em `TasksManualView.tsx:288-307`).
- O projeto já tem um padrão de M2M consolidado: tabelas `*_tag_links` (`supabase/migrations/20260930000000_firm_entity_tag_links.sql`) — PK composta, `firm_id` redundante pra RLS, política `<tabela>_firm_staff`. Existe também um padrão alternativo (array-coluna: `firm_broadcasts.target_client_ids UUID[]`), usado pra "vários clientes" em difusões.
- Seleção múltipla com busca **já tem um padrão pronto**, usado em `AlertComposer.tsx:192-229`: reaproveita `ClientSearchSelect` (busca single-select) + array de ids + chips removíveis. É esse exato padrão que dá pra generalizar pra "vários clientes por tarefa".

**O que falta:**
- Tabela de junção nova (nome consistente com o padrão do projeto: `client_task_client_links` ou similar), com RLS.
- Endpoint de criar/editar/remover vínculo tarefa↔cliente.
- Extrair o padrão de multi-seleção do `AlertComposer.tsx` pra um componente reutilizável.
- Decidir: tarefa mantém `client_id` legado (deprecated, populado por trigger/aplicação em paralelo por um tempo) ou migra 100% pra M2M imediatamente?

**Risco:** baixo pra dado existente — `client_id` não tem `NOT NULL`/`CASCADE` que impeça uma migração aditiva (criar tabela nova + backfill via `INSERT...SELECT`, manter coluna antiga até decidir remover).

**Decisão arquitetural pendente:** M2M real (tabela de junção) vs. array-coluna (como broadcasts já fazem)? Recomendo M2M — é o padrão dominante no projeto e permite RLS e auditoria por vínculo individual, o que array-coluna não dá de forma limpa.

---

## 2 — Tarefas manuais: edição e UX

**Classificação: CORRIGIR** (não é "criar do zero" — o backend já aceita tudo)

**O que existe:**
- Backend: `PATCH /client-tasks/:id` já aceita título, descrição, prioridade, estado, prazo, responsável (`tasks.repository.js:84-101`) — **exceto `client_id`, que não está no mapa de campos editáveis** (achado extra: seria preciso adicionar).
- Frontend: o painel de detalhe (`TaskDetailPanel.tsx`) abre num **Sheet lateral** (`FirmTasksWorkspacePage.tsx:348-365`), não modal centralizado. Dentro dele, **só o campo Estado é editável de fato** (`TaskDetailPanel.tsx:158-168`) — título, prioridade, prazo e responsável aparecem como `<p>` de texto estático (linhas 170-186), mesmo o backend já aceitando o PATCH desses campos.
- Padrão de modal centralizado **já existe e é usado em 3 lugares reais de edição**: `FiscalEventFormDialog.tsx` (evento fiscal, inclusive com campo de recorrência), `ServiceFullEditorSheet.tsx` (apesar do nome, usa `Dialog` centralizado), `FirmClientAccessManager.tsx` (acesso de cliente). Todos importam de `@/shared/components/ui/dialog`.

**O que falta:** construir o formulário de edição de verdade dentro de um `Dialog` centralizado (seguindo `FiscalEventFormDialog.tsx` como referência direta), reaproveitando os componentes já usados na criação (`ClientSearchSelect`, selects de prioridade/responsável).

**Risco:** baixo — é essencialmente "abrir o formulário que já existe na criação, dentro de um Dialog, pré-preenchido, chamando PATCH em vez de POST".

---

## 3 — Serviços: imagem e posicionamento

**Classificação: IMPLEMENTAR**

**O que existe:**
- Uma única coluna `image_url` (storage key no Supabase Storage, resolvida em signed URL sob demanda, TTL 86400s). Sem CDN, sem `sharp`/transformação no servidor.
- Editor de crop **já existe**: `ImageCropDialog.tsx` — canvas HTML5 próprio (sem lib de terceiros), usado em 3 lugares (logo do escritório, imagem de serviço `aspect=16/9`, seções da página pública com `aspect` configurável, inclusive `free`).
- **Limitação real:** o crop é aplicado nos pixels antes do upload ("assado") — não existe coluna de posição/foco/crop no banco. Depois de enviada, a imagem não pode ser reaberta e reajustada; a imagem original nem é retida.

**O que falta:**
- Nova(s) coluna(s) na tabela `accounting_services` pra persistir dado de posição/crop (ex.: `image_focus_x/y` ou JSONB `image_crop_data`).
- Decidir se guarda a imagem original (pra permitir re-crop) além da já cortada — hoje só a versão cortada é enviada e guardada.
- Aplicar esse dado no render da página pública (`object-position` dinâmico, hoje é `object-cover` fixo).

**Risco:** baixo/médio — é uma extensão aditiva de schema; não quebra imagens já cadastradas (continuam funcionando com crop "assado", sem dado de posição).

---

## 4 — Serviços dentro de serviços (hierarquia)

**Classificação: ARQUITETAR**

**O que existe:** nada de hierarquia real. `public_group` é texto livre, sem FK, comentado explicitamente na migration como "não é hierarquia pai/filho — só organização visual" (`20261001000000_accounting_services_public_group.sql`). Não existe nenhuma FK auto-referenciada (`parent_id`) em nenhuma tabela do schema inteiro do Teglion — busca exaustiva confirmou isso.

**Padrão que o projeto já usa em problemas análogos:** sempre tabela separada de categoria/grupo + FK de mão única (nunca árvore recursiva) — `firm_fiscal_categories` (calendário fiscal) e `departments` (equipe) são os dois precedentes diretos.

**Recomendação fundamentada no próprio padrão do projeto:** criar `accounting_service_groups` (`id`, `firm_id`, `name`, `sort_order`, `is_active`) e trocar `accounting_services.public_group` (texto) por `accounting_services.group_id` (FK). Evita profundidade arbitrária (que o pedido original também não exige — "serviço principal + serviços dentro dele" é um nível só).

**Decisão arquitetural pendente:** confirmar que 1 nível de agrupamento (grupo → serviços) é suficiente, ou se realmente precisa de hierarquia recursiva (que não teria nenhum precedente no projeto e seria uma escolha nova).

---

## 5 — Página pública: organização dos serviços

**Classificação: IMPLEMENTAR + REUTILIZAR**

**O que existe:**
- `publicGroup` já é usado pra dois propósitos: subtítulo `<h3>` estático (sempre expandido) dentro da lista, e dropdown real (`<details>/<summary>` nativo) no menu "Áreas" do cabeçalho.
- Visibilidade (`isPubliclyListed`) e ordem (`sortOrder`) já existem e são respeitadas pelo endpoint público; UI de reordenação hoje é por setas ▲▼, não drag-and-drop.
- **Drag-and-drop já existe e está testado** em outro módulo: `publicSiteSectionOrder.ts` + `PublicSiteSectionsList.tsx` (via `@dnd-kit`), usado pra ordenar seções inteiras da página. É um padrão clonável pra ordenar serviços/grupos.
- Não há distinção nome interno vs. nome público (`name` único) — precisaria de campo novo se quiser nomes diferentes.
- Página pública é 100% SPA sem pré-renderização — mudar a estrutura de serviços não quebra nenhum artefato de build estático (`prerender-static.ts` não cobre rotas `/:firmSlug`).

**O que falta:** um componente de accordion/dropdown real **dentro da lista de serviços em si** (hoje só existe no menu do header, não na listagem); campo de nome público separado, se decidido; migrar ordenação de serviços de setas pra drag-and-drop (opcional, reaproveitando o padrão já testado).

**Risco:** baixo — os dados (`publicGroup`, `sortOrder`, `isPubliclyListed`) já existem; é principalmente trabalho de frontend.

---

## 6 — Agenda: configuração diária e mensal

**Classificação: IMPLEMENTAR (UI) + REUTILIZAR (dados e componentes)**

**Achado mais importante desta auditoria inteira:** o modelo de dados **já é quase exatamente** o que foi pedido.

- `schedule` (por dia da semana) e `dateOverrides` (por data específica) já coexistem, com a prioridade correta já implementada (`computeAvailableSlotsTz`, `booking.service.js:186-234`: exceção de data > regra do dia da semana).
- **Múltiplos intervalos no mesmo dia já funciona hoje**, tanto em `schedule` quanto em `dateOverrides` (até 8 intervalos por dia).
- **Disponibilidade por serviço já existe** (`accounting_services.booking_overrides`), inclusive já aceitando `dateOverrides` próprios por serviço no backend — só a UI (`AgendaServiceHoursPanel.tsx`) ainda não expõe essa opção, só `weekdays`/`schedule`.
- Copiar configuração já existe na UI, mas só dia-da-semana → dia-da-semana, client-side, sem persistir "isso foi copiado de X"; não existe cópia de mês inteiro nem endpoint de cópia no backend.
- **Componente de calendário mensal genérico já existe e está pronto pra reuso**: `CalendarMonthGrid.tsx` (comentário no próprio código: "Consumer: Calendário Fiscal; futuro: outros módulos de datas"), já usado em produção com dias clicáveis em `FiscalCalendarWorkspace.tsx`. É exatamente o padrão "clicar num dia do mês pra configurar" pedido.

**O que falta:** trocar a lista textual de `dateOverrides` (input de data manual) por um `CalendarMonthGrid` com dias clicáveis abrindo um dialog de edição (reaproveitando toda a lógica de intervalos que já existe em `AgendaAvailabilityPanel.tsx`); expor `dateOverrides` por serviço na UI (já aceito pelo backend); endpoint/UI de "copiar mês inteiro" (não existe hoje, nem client nem server-side).

**Risco:** baixo — não precisa de migration nova, é reestruturação de UI sobre um modelo de dados já maduro.

---

## 7 e 8 — MFA (dono obrigatório / funcionário opcional)

**Classificação: IMPLEMENTAR DO ZERO**

Busca exaustiva (case-insensitive) por `mfa`, `totp`, `two_factor`, `2fa`, `authenticator`, `otp` em todo o backend e frontend: **nenhuma implementação real encontrada**, em nenhuma camada.

- Único indício é negativo: `backend/src/modules/firm/step-up.service.js:12` tem um comentário explícito — *"MFA/TOTP: não nesta versão"* — e `official-accesses.service.js:97` retorna `mfaRequired: false` hardcoded.
- Sem coluna de MFA em `firm_users`/`clients`. Sem biblioteca TOTP instalada. Sem componente de configuração de segurança no frontend (só Turnstile/CAPTCHA existe em `shared/security/`).

**O que precisa ser construído, do zero, em todas as camadas:**
- Schema: colunas de segredo TOTP (cifrado, mesmo padrão AES-256-GCM já usado em `crypto-fields.js` pra credenciais de cliente) + códigos de recuperação.
- Backend: geração/verificação de TOTP (lib tipo `otplib` — não instalada ainda), fluxo de enrollment, fluxo de verificação no login, política "dono obrigatório vs. funcionário opcional" (nova tabela/coluna de política por firma, já que o pedido explicitamente quer isso configurável no futuro).
- Frontend: tela de configuração (QR code, códigos de recuperação), tela de desafio no login, bloqueio de navegação pro dono sem MFA configurado.
- **Boa notícia:** o step-up authentication (item 9) já resolve o "token de curta duração pós-verificação" — MFA só precisa alimentar esse mecanismo já existente com um segundo fator real, em vez de construir a canalização de step-up também do zero.

**Risco:** alto se malfeito (é código de autenticação crítico) — mas o padrão de criptografia e o step-up token já existentes reduzem bastante a superfície nova.

---

## 9 — Step-up authentication para credenciais sensíveis

**Classificação: REUTILIZAR (já existe) + AUDITAR (lacunas pontuais)**

**Achado principal: isso já existe e funciona de verdade, não precisa ser criado.**

- `client_official_accesses` (credenciais de portais fiscais de clientes) já é cifrada com AES-256-GCM (`crypto-fields.js`), nunca devolvida em texto claro sem desbloqueio prévio.
- Fluxo real: usuário clica "Ver senha" → `StepUpPasswordDialog` pede a "palavra-passe do cofre" (ou senha de login como fallback) → backend verifica via `step-up.service.js:verifyStaffPassword` → emite JWT `typ=vault-stepup`, 8h de validade, guardado em `sessionStorage` por aba/usuário (`vaultStepUpSession.ts`) → desbloqueia a ação.
- Senha revelada some da tela sozinha após 30s (TTL de UI, não reforçado pelo servidor).
- Toda ação (revelar/criar/editar/remover credencial) é auditada (`securityAudit.recordClientMutation`).
- **É step-up de fator único (senha), não step-up-MFA** — o próprio código já documenta essa limitação. Enquanto MFA (itens 7/8) não existir, step-up continua sendo "confirme sua senha de novo", não "confirme com segundo fator".

**Lacunas reais (não é reinventar, é generalizar):**
- Rate limiting existe (`officialAccessStepUpLimiter`), mas vale confirmar tentativas inválidas/backoff.
- Escopo hoje é só credenciais oficiais + import de CSV com senha — nenhuma outra ação sensível usa esse mecanismo (ver item 10).

**Recomendação:** generalizar `step-up.service.js` (hoje acoplado a "vault") pra aceitar um `scope`/`purpose` por chamada, reaproveitável em qualquer ação sensível nova, e trocar a base de "confirmar senha" por "confirmar MFA" assim que o item 7/8 existir.

---

## 10 — Outras ações sensíveis

**Classificação: AUDITAR + ARQUITETAR (política)**

Tabela real do que existe hoje, por ação:

| Ação | Proteção hoje |
|---|---|
| Alterar e-mail da conta | Nenhuma — só sessão normal, sem senha |
| Alterar senha de login | Senha atual exigida + política de senha forte. Sem MFA |
| Criar/alterar senha do cofre | Senha atual exigida se já existir; emite step-up ao final |
| Excluir conta/escritório | Confirmação por digitar o nome do escritório — **sem senha, sem step-up** |
| Remover/desativar outro admin | Só regra de negócio (não pode ser o último owner) — sem senha/step-up |
| Exportar CSV de clientes | Nenhuma fricção (mas o CSV nunca inclui senhas de portal, por design) |
| Importar CSV | Step-up **condicional** — só se o arquivo tiver alguma senha de portal preenchida |

**O que falta:** classificar cada ação (CRÍTICA/ALTA/MÉDIA/BAIXA, como o pedido original já sugere) e decidir uma política consistente — não implementar step-up em tudo cegamente. Minha leitura inicial: excluir escritório e remover admin são as duas ações sem proteção hoje que mais mereceriam step-up, dado o dano potencial (irreversível/alto impacto), mais do que alterar e-mail.

---

## 11 — Google Calendar: auditoria e correção

**Classificação: CORRIGIR** (bugs concretos identificados, não hipóteses)

**Achado #1 — "eventos do Google não aparecem": não é bug de sincronização, é ausência de escopo.** A leitura de eventos do Google (`google-calendar-availability.service.js`) alimenta **exclusivamente** o cálculo de horários livres da página pública de agendamento do cliente. Nenhuma tela de agenda interna do Teglion (`AgendaWorkspace.tsx` e os grids) lê ou desenha eventos do Google — elas só mostram `consultations` do próprio Teglion. Se a expectativa é ver eventos pessoais do Google dentro da agenda interna, isso nunca foi implementado.

Dentro do único uso real (bloqueio de disponibilidade pública), dois pontos frágeis confirmados:
- `getBusyRangesForFirm` chama `listByFirm` **fora de try/catch por conexão** — uma única credencial indecriptável (ex.: rotação de `DATA_ENCRYPTION_KEY`) derruba o bloqueio de **toda** a firma silenciosamente, sem erro visível.
- `authStatus` só é atualizado **reativamente**, quando algo tenta renovar o token. Sem cron de verificação nem probe no health-check, uma conexão revogada no Google continua marcada "Ligado" (verde) indefinidamente — o badge mente sobre o estado real.

**Achado #2 — "agendamentos do Teglion não refletem no Google": causa raiz identificada.** Agendamentos feitos por clientes na página pública só são enviados ao Google se `firm.settings.booking.googleCalendarStaffUserId` (o "assignee" de sync público) estiver definido e saudável. Esse campo é setado automaticamente só na primeira conexão, ou manualmente via um toggle. Se o staff desconectar/reconectar, ou o toggle for desmarcado, `googleCalendarStaffUserId` fica desatualizado/nulo — a consultation nasce com `staffId: null`, o bloco de sincronização **nem executa**, e `googleSyncStatus` fica `null` pra sempre (não aparece como "falhou", só some silenciosamente).

**Sem Sentry na integração inteira** — tudo é `logger.safe.warn`, nada chega a alerta. `integrations-health.controller.js` não cobre Google Calendar (só cobre Google SSO/login, que é outra coisa).

**Recomendação de próximo passo (ainda sem alterar código):** consultar `firm_google_calendar_connections.auth_status` e `firm.settings.booking.googleCalendarStaffUserId` da(s) firma(s) piloto reais, e contar `consultations` com `source='CLIENT' AND staff_id IS NULL` recentes — isso confirma o achado #2 com dado real antes de eu corrigir.

**Idempotência:** essa parte está bem feita — `google_event_id` + `iCalUID` determinístico evitam duplicação em retry.

---

## 12 — Modelo comercial futuro (pricing)

**Classificação: ARQUITETAR (baixo esforço)**

Preço atual já é bem centralizado (`pricing-plans.js` no backend, `pricingPlans.ts` no frontend, um único endpoint público). **Achado lateral relevante:** o Stripe Checkout **não lê** os centavos de `pricing-plans.js` — usa Price IDs configurados direto no Stripe/env, então os dois precisam ser mantidos manualmente em sincronia (risco de dessincronia se alguém mudar um sem o outro).

O projeto já tem o padrão certo pra "valor existente mas não ativo": `entitlements.service.js` usa `OPEN_LOCKED` (feature existe, mas `can()` retorna sempre `false`). Recomendo replicar essa filosofia pro preço futuro: um segundo par de constantes (`FIRM_PLAN_FUTURE_EUR_*`) que nenhuma rota consulta ainda, em vez de misturar com o preço ativo.

**Aviso lateral (não pedido, mas relevante):** o trial de 14 dias já sofre do mesmo problema que vocês querem evitar — existe uma env var (`FIRM_TRIAL_DAYS`) que o texto usa, mas o código que cria a firma ignora e usa `14 * 24h` hardcoded. É um lembrete de que "ter a env var" não garante que todo caminho a respeite — vale ter isso em mente ao desenhar o preço futuro.

---

## 13 — Página pública como add-on

**Classificação: REUTILIZAR (parcial) + ARQUITETAR**

`entitlements.can(firmId, 'public_page')` já retornaria `true` hoje (modo aberto). Bloquear de verdade é uma linha (`OPEN_LOCKED.add('public_page')`), mesmo padrão já usado pra `hide_teglion_branding`.

**O que falta conceitualmente, não estruturalmente:** hoje `OPEN_LOCKED` é uma trava **global**, não por escritório. Não existe "o outro lado" — nenhuma tabela registra que um escritório específico comprou um add-on, então não há como desbloquear individualmente. Isso precisa de uma tabela nova (`firm_addons` ou similar) e de `entitlements.can()` passar a consultá-la por firma, não só a trava global.

---

## 14 — Sistema de SMS e créditos

**Classificação: IMPLEMENTAR DO ZERO**

SMS hoje é envio direto pra Brevo (`brevo-sms.service.js`), sem nenhum controle de quantidade. `sms_logs` é log de auditoria linha-a-linha (com dedupe de 5 min, não cota) — dá pra basear um contador nele via `COUNT()`, mas não existe nenhum campo de saldo/cota persistido em lugar nenhum do schema.

**Precedente técnico útil pra compra avulsa:** existe um fluxo real de checkout `mode: 'payment'` (não recorrente) com `price_data` ad-hoc e webhook idempotente — mas é do lado do Stripe Connect (cliente final → escritório), semanticamente e estruturalmente amarrado a isso (`firm_payments` tem `CHECK constraint` fechado a `purpose IN ('booking','service_request')`). Pra "+200 SMS por €5" (escritório → Teglion), esse padrão de código serve de modelo a copiar/adaptar rodando na conta Stripe principal, com tabela nova — não é reaproveitável diretamente.

---

## 15 — Arquitetura de créditos genérica

**Classificação: ARQUITETAR**

Não existe nenhuma tabela `usage`/`quota`/`credits` no projeto hoje (busca exaustiva confirmou). `entitlements.service.js` serve de base **conceitual** (mesmo módulo central, mesma filosofia de "uma função que todo mundo consulta em vez de checar plano espalhado pelo código"), mas sua primitiva atual (`limit`/`assertWithinLimit`) é teto fixo comparado contra contagem externa — não tem armazenamento nem decremento. Um sistema de créditos de verdade (saldo, decremento, histórico com motivo/data/responsável) seria uma extensão nova do mesmo módulo, não algo já pronto.

---

## Componentes de UI reutilizáveis (vale pra todos os itens acima)

| Já existe, reaproveitar direto | Não existe, precisa construir |
|---|---|
| `Dialog` centralizado (`ui/dialog.jsx`), usado em 3+ telas de edição | Multi-select genérico reutilizável (hoje é um padrão inline, não componente) |
| `ImageCropDialog.tsx` (canvas próprio, já parametrizado por aspect) | Accordion/Collapsible (não existe nem como componente nem como lib instalada) |
| `CalendarMonthGrid.tsx` (genérico, já pensado pra reuso futuro) | — |
| Padrão `Popover` + `Command` + `Checkbox` pra seleção com busca (`AgendaServicesCatalogPanel.tsx`) | — |
| `ClientSearchSelect.tsx` (busca single-select, usado em 5 telas) | — |
| Drag-and-drop testado (`@dnd-kit`, `publicSiteSectionOrder.ts`) | — |

---

## Ordem de execução recomendada (ajustada à realidade encontrada, não à suposição original)

A ordem original do pedido (Fase 1 Tarefas → Fase 2 Serviços → ... → Fase 7 Monetização) continua fazendo sentido, com um ajuste: **MFA (item 7/8) é o item de maior esforço real** desta lista inteira — é o único que não tem NADA pronto em nenhuma camada — enquanto **Agenda (item 6)** e **Step-up (item 9)** são os de menor esforço real, porque a base já existe quase pronta. Recomendo:

1. **Tarefas** (itens 1-2) — risco baixo, dado seguro, valor imediato.
2. **Agenda calendário mensal** (item 6) — maior "ganho por esforço" de toda a lista, componente genérico já existe.
3. **Serviços** (itens 3-5) — imagem, hierarquia, página pública.
4. **Google Calendar** (item 11) — são bugs concretos, não features novas; corrigir antes de construir mais em cima de uma integração que já sabemos que falha silenciosamente.
5. **Segurança** (itens 9-10 primeiro — generalizar o step-up que já existe, política de ações sensíveis; depois 7-8, o MFA em si, que é o maior esforço).
6. **Comercial** (itens 12-15) — documentar/arquitetar sem ativar, como pedido.

---

## Decisões que preciso de você antes de implementar qualquer coisa

1. **Tarefas multi-cliente:** confirmar M2M (tabela de junção) como modelagem, e se mantém `client_id` legado por um tempo de transição ou migra de uma vez.
2. **Hierarquia de serviço:** confirmar que 1 nível de agrupamento (grupo → serviços) é suficiente — recomendo isso, seguindo o padrão já usado no projeto (sem precedente de árvore recursiva).
3. **Imagem de serviço:** decidir se guarda a imagem original além da cortada (permite re-crop depois) — isso muda o desenho do schema.
4. **MFA:** confirmar biblioteca TOTP a instalar (nenhuma está instalada hoje) e se o step-up existente deve migrar pra usar MFA assim que ele existir, ou continuar aceitando senha como fallback.
5. **Ações sensíveis (item 10):** validar minha classificação de risco antes de eu aplicar step-up em qualquer uma — especialmente "excluir escritório" e "remover admin", que hoje não têm nenhuma fricção extra.
6. **Google Calendar:** autorizar eu consultar dado real de produção/staging (`firm_google_calendar_connections`, `consultations`) pra confirmar o achado #2 com número antes de corrigir — ou já corrigir direto pela evidência de código, sem essa confirmação extra.
7. **SMS/créditos:** confirmar fornecedor (continua Brevo?) e se a compra avulsa via Stripe roda na conta principal do Teglion antes de eu desenhar a tabela nova.

Não implementei nada além desta auditoria. Aguardando suas decisões acima (ou autorização pra eu decidir com meu melhor julgamento nos pontos que você preferir delegar) antes de começar a Fase 1.
