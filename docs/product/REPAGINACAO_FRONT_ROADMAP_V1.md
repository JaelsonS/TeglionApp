# Roadmap — Repaginação FRONT completa do Teglion (gabinete)

**Versão:** 1.0  
**Data:** 2026-10-25  
**Âmbito:** frontend do app do gabinete (`/app/firm/*`) + landing comercial (`/`)  
**Fora de âmbito imediato:** alterações de contrato backend / novas APIs DELETE / emissão AT  
**Branch de trabalho:** `feature/fase-repaginacao-paginas` (partir de `staging` limpa)  
**Pré-requisito visual:** tokens e shell da `feature/fase-repaginacao-ui` (já em staging via PR #200)

---

## 1. O que isto é (e o que não é)

Isto **não** é um polish superficial de CSS.

É um programa **página a página** para deixar o front:

1. **Autoexplicativo** — o gabinete percebe em 3 segundos o que a página faz e o que fazer a seguir.
2. **Profissional e único** — mesma pele (navy `#0B3A6E`, Plus Jakarta Sans, `FirmModuleShell` / `PageHeader` / shells), zero “telas órfãs”.
3. **Completo** — todas as acções e dados que já existem continuam a existir; podemos **refatorar, apagar e recriar ficheiros UI**, desde que o comportamento e as rotas públicas se mantenham.
4. **Seguro para backend** — zero mudança de contratos API neste programa; se faltar DELETE/UPDATE no backend, a UI usa o que já existe (create/patch/list/archive) e documenta gaps.

A landing entra como **fase L** (produto real): vende o que o menu já tem, com screenshots alinhados e copy honesta.

---

## 2. Regras inegociáveis

| Regra | Detalhe |
|-------|---------|
| Não perder funcionalidade | Botões, filtros, dialogs, deep-links (`?tab=`, `?open=`, `?create=1`, etc.) mantidos ou melhorados |
| Não quebrar rotas | Paths em `ContabilAppRouter` + redirects legacy OK; sem remover destinos |
| Não quebrar backend | Só frontend; APIs existentes via `frontend/src/infrastructure/api/contabil/*` |
| DS único | Tokens + componentes partilhados; proibido inventar paleta/fonte por ecrã |
| Copy PT gabinete | «gabinete», sem claims AT/emissão oficial; calculadoras = simulação de apoio |
| Refactor permitido | Extrair componentes, renomear, substituir layout interno, apagar CSS morto |
| Commits pequenos | 1 fase (ou 1 subfase pesada) = 1+ commits claros; merge staging por lotes estáveis |
| Inventário antes de código | Cada fase começa com checklist “o que já faz” → só depois UI |

---

## 3. Protocolo obrigatório por fase / subfase

```text
A. Inventário (30–90 min)
   - Rotas, ficheiros, hooks, API
   - Lista de acções UI (criar / editar / filtrar / exportar / …)
   - Gaps reais (ex.: PATCH existe, UI não chama)
   - Dor de layout (scroll aninhado, coluna apertada, copy confusa)

B. Desenho de alvo (escrito no PR / checklist da fase)
   - Hierarquia: título + propósito + 1 área primária + chrome secundário
   - Um scroll principal (ou colunas com min-h-0 explícito)
   - Empty / loading / error states
   - Mobile / tablet / desktop (bandas <768 / 768–1279 / ≥1280)

C. Implementação
   - Preferir FirmScrollPage / FirmWorkspacePage / FirmModuleShell
   - Reutilizar PageHeader, KPIs, tables, dialogs do DS
   - Refactor livre dentro da pasta da feature

D. Definition of Done (DoD)
   - [ ] Todas as acções do inventário funcionam
   - [ ] Copy autoexplicativa (título + 1 frase de propósito)
   - [ ] Sem scroll “apertado” no sítio errado
   - [ ] Smoke: abrir pelo menu, deep-link, mobile
   - [ ] Sem regressão tipada óbvia (tsc/lint no âmbito tocado)
   - [ ] Checklist da fase marcada neste doc
```

---

## 4. Ordem das 18 fases (menu real)

Fonte de navegação: [`firmNavConfig.ts`](../../frontend/src/features/firm/firmNavConfig.ts).

| Fase | Menu | Rota principal | Subfases internas (mínimo) |
|------|------|----------------|----------------------------|
| **1** | Painel | `/app/firm/dashboard` | 1.1 layout · 1.2 KPIs/acções · 1.3 onboarding/activação |
| **2** | Clientes | `/app/firm/clients` + hub | 2.1 lista · 2.2 wizard/CSV · 2.3 hub (9 secções) |
| **3** | Pagamentos (carteira) | `/app/firm/payments` | 3.1 layout matriz · 3.2 dialogs/ano · 3.3 copy vs Stripe/Plano |
| **4** | Imóveis e rendas | `/app/firm/rentals` | 4.1 lista · 4.2 imóvel create/edit · 4.3 contrato · 4.4 recibos |
| **5** | SAF-T (consulta) | `/app/firm/saft` | 5.1 upload/lista · 5.2 detalhe/KPIs · 5.3 banner “só consulta” |
| **6** | Obrigações por cliente | `/app/firm/tasks/obligations` | 6.1 filtros/lanes · 6.2 create/edit · 6.3 detalhe |
| **7** | Tarefas | `/app/firm/tasks/*` | 7.0–7.5 (6 vistas) — ver §5.7 |
| **8** | Agendamentos | `/app/firm/agenda` | 8.1 calendário · 8.2 criar/editar · 8.3 settings/Google |
| **9** | Área IRS | `/app/firm/irs` | 9.1 catálogo IRS · 9.2 Modelo 3 / editor · 9.3 ligação Serviços |
| **10** | Serviços | `/app/firm/services` | 10.1 catálogo · 10.2 solicitações · 10.3 central |
| **11** | Calendário fiscal | `/app/firm/fiscal-calendar` | 11.1 mês/ano · 11.2 eventos · 11.3 obrigação a partir de evento |
| **12** | Calculadoras | `/app/firm/calculators` | **12.0 hub + 12.1–12.6** (IVA…IRC) — ver §5.12 |
| **13** | Documentos | `/app/firm/documents/*` | 13.1 pedidos · 13.2 ficheiros · 13.3 histórico |
| **14** | Mensagens | `/app/firm/messages` | 14.1 lista · 14.2 thread · 14.3 anexos/Drive |
| **15** | Central de alertas | `/app/firm/alerts` | 15.1 lista · 15.2 composer · 15.3 analytics |
| **16** | Notícias | `/app/firm/news` | 16.1 lista · 16.2 composer · 16.3 publish |
| **17** | Plano | `/app/firm/billing` | 17.1 estado · 17.2 checkout/portal · 17.3 copy vs carteira |
| **18** | Definições | `/app/firm/settings` | **18.1–18.12** (12 tabs) — ver §5.18 |

**Fase L (paralela / após Fase 1–3):** Landing produto real — ver §6.

**Fase P (opcional após 18):** Portal cliente polish DS — fora do menu firm; só se o lote firm estiver estável.

---

## 5. Fichas por fase (inventário + alvo)

### Fase 1 — Painel

| | |
|--|--|
| **Ficheiros** | `FirmDashboardPage.tsx`, `dashboard/FirmDashboardParts*`, checklist/activação, onboarding |
| **Já faz** | KPIs período; Nova tarefa; activação; import CSV; notificar clientes; atalhos; Maya |
| **Dor** | Densidade “command center”; cards a competir; onboarding misturado com operação |
| **Alvo** | Hierarquia clara: (1) o que precisa de atenção hoje (2) números (3) atalhos (4) activação colapsável |
| **Subfases** | **1.1** estrutura/scroll · **1.2** KPIs + CTAs · **1.3** onboarding/activação autoexplicativos |
| **Estado** | ✅ 2026-10-25 |

### Fase 2 — Clientes (+ hub)

| | |
|--|--|
| **Ficheiros** | `FirmClientsPage.tsx`, wizard, CSV, bulk invite, `FirmClientHubPage.tsx`, `client-hub/*` |
| **Já faz** | Pesquisa/filtros; lista/grelha; criar; arquivar; convites; hub com 9 secções |
| **Hub secções** | overview · profile · billing · accesses · timeline · obligations · documents · tasks · messages |
| **Dor** | Barra de filtros pesada; hub com muitas tabs e painéis aninhados |
| **Alvo** | Lista legível + hub com propósito por secção; formulários de perfil completos e editáveis (API já patch) |
| **Subfases** | **2.1** lista · **2.2** criar/CSV/convites · **2.3a–2.3i** cada secção do hub |
| **Estado** | ✅ 2026-10-25 |

### Fase 3 — Pagamentos (carteira)

| | |
|--|--|
| **Ficheiros** | `FirmPaymentsPage.tsx`, `PaymentsWorkspace.tsx`, `ChargeEditDialog`, CSS `.cb-payments-layout-page` |
| **Já faz** | Matriz ano×cliente; gerar; editar charge; search; link hub billing; nudge Stripe |
| **Dor** | Duplo scroll; coluna Cliente `max-w-[200px]` truncada; CSS layout em falta |
| **Alvo** | Chrome fixo + grelha `flex-1 min-h-0`; coluna cliente 240–280px + tooltip; copy “carteira ≠ Stripe ≠ Plano” |
| **Subfases** | **3.1** layout/scroll · **3.2** dialogs/gerar · **3.3** copy/disambiguação |
| **Estado** | ✅ 2026-10-25 |

### Fase 4 — Imóveis e rendas

| | |
|--|--|
| **Ficheiros** | `RentalsWorkspace.tsx`, dialogs property/lease/receipt, API `rentals.ts` |
| **Já faz** | Criar imóvel/contrato; gerar recibos; patch receipt; **API já tem patch property/lease** |
| **Gap UI** | Edit completo em falta; forms incompletos vs backend; picker senhorio sem puxar NIF/contacto |
| **Alvo** | CRUD visual completo via create+patch; soft-archive via status; sem inventar DELETE hard |
| **Subfases** | **4.1** lista/ano · **4.2** imóvel · **4.3** contrato + dados cliente · **4.4** recibos |
| **Estado** | ✅ 2026-10-25 |

### Fase 5 — SAF-T (consulta)

| | |
|--|--|
| **Ficheiros** | `FirmSaftPage.tsx`, `SaftWorkspace.tsx` |
| **Já faz** | Upload XML/ZIP; lista; KPIs; remover import; banner “não é AT” |
| **Alvo** | Fluxo óbvio upload → ver totais → detalhe; banner impossível de ignorar; zero overclaim |
| **Subfases** | **5.1** upload/lista · **5.2** detalhe · **5.3** copy legal/produto |
| **Estado** | ✅ 2026-10-25 |

### Fase 6 — Obrigações por cliente

| | |
|--|--|
| **Ficheiros** | `TasksObligationsView`, `obligations/*`, `useObligationsHub` |
| **Já faz** | Filtros; create/edit; detalhe; templates/recorrência |
| **Dor** | Partilha shell com Tarefas; scroll aninhado; confusão conceptual com calendário fiscal |
| **Alvo** | Página que diga “obrigações fiscais por cliente”; lanes claras; create/edit legíveis |
| **Subfases** | **6.1** layout/filtros · **6.2** create/edit · **6.3** detalhe + deep-link `?ob=` |
| **Estado** | ✅ 2026-10-25 |

### Fase 7 — Tarefas (6 vistas = 6 subfases)

| Subfase | Rota | Vista | DoD resumido |
|---------|------|-------|--------------|
| **7.0** | shell | `TasksWorkspaceShell` | Tabs/labels autoexplicativos; um modelo de scroll |
| **7.1** | `/tasks/overview` | Overview | Prioridades do dia/semana claras |
| **7.2** | `/tasks/obligations` | (ponte) | Consistente com Fase 6 |
| **7.3** | `/tasks/month` | Mês fiscal | Distinto do calendário fiscal |
| **7.4** | `/tasks/manual` | Board/grid | Create/edit/delete intactos |
| **7.5** | `/tasks/calendar` + `/tasks/clients` | Ops calendar + por cliente | Filtros + detalhe `?task=` |

**Estado:** ✅ 2026-10-25 (shell + copy por vista)

### Fase 8 — Agendamentos

| | |
|--|--|
| **Ficheiros** | `AgendaWorkspace.tsx`, settings/hours, Google Calendar panel |
| **Já faz** | Calendário; create/edit/cancel; horários; Google sync; `?panel=settings` |
| **Alvo** | Calendário operativo limpo; settings como painel claro; Google opcional e honesto |
| **Subfases** | **8.1** calendário · **8.2** booking dialogs · **8.3** settings/Google |
| **Estado** | ✅ 2026-10-25 |

### Fase 9 — Área IRS

| | |
|--|--|
| **Ficheiros** | `FirmIrsPage.tsx`, Modelo 3 sheet, service editors |
| **Já faz** | Catálogo modelos; activar; editor Modelo 3; stats; link solicitações |
| **Alvo** | Separar mentalmente de “Serviços gerais”; fluxo activar → editar → publicar óbvio |
| **Subfases** | **9.1** lista/catálogo · **9.2** editors · **9.3** ligações Serviços |
| **Estado** | ✅ 2026-10-25 |

### Fase 10 — Serviços (3 tabs)

| Subfase | Tab | Workspace | Notas |
|---------|-----|-----------|-------|
| **10.1** | catalog | `ServicesCatalogWorkspace` | Publicar/editar; IRS fora deste catálogo |
| **10.2** | inquiries | `ServiceInquiriesWorkspace` | Leads públicos |
| **10.3** | central | `ServicesWorkspace` | Pedidos in-app |

**Estado:** ✅ 2026-10-25 (tabs catálogo / solicitações / central)

### Fase 11 — Calendário fiscal

| | |
|--|--|
| **Ficheiros** | `FiscalCalendarWorkspace.tsx`, form/config/detail sheets |
| **Já faz** | Mês/ano; CRUD eventos; templates; criar obrigação a partir de evento |
| **Alvo** | Distinção verbal clara vs Tarefas calendar vs Agenda; mobile usável |
| **Subfases** | **11.1** vistas · **11.2** eventos · **11.3** → obrigação |
| **Estado** | ✅ 2026-10-25 |

### Fase 12 — Calculadoras (hub + 6 ferramentas)

> “Uma entrada no menu, seis ferramentas.” Cada simulador é uma **subfase 100%** própria.

| Subfase | Id | Título | Workspace | API | Notas de produto |
|---------|-----|--------|-----------|-----|------------------|
| **12.0** | hub | Calculadoras | `FirmCalculatorsHubPage` | — | Cards + disclaimer Maya; preferir página completa por tool (não só modal apertado) se melhorar UX |
| **12.1** | `iva` | IVA | `VatCalculatorWorkspace` | `fiscalVat` | Mais usada · líquido↔total 23/13/6 % · PT 2026 |
| **12.2** | `irs` | IRS | `IrsCalculatorWorkspace` | `fiscalIrs` | Estimativas internas |
| **12.3** | `ss` | Segurança Social | `SsCalculatorWorkspace` | `fiscalSs` | TI |
| **12.4** | `retencao` | Retenção na fonte | `WithholdingCalculatorWorkspace` | `fiscalWithholding` | Tabelas salários/recibos verdes |
| **12.5** | `imt` | IMT | `ImtCalculatorWorkspace` | `fiscalImt` | Continente 2026 |
| **12.6** | `irc` | IRC | `IrcCalculatorWorkspace` | `fiscalIrc` | Empresas · uso interno |

**Por cada 12.x (1–6):**

1. Inventário: campos, simular, guardar, histórico, cliente opcional.
2. Layout página (ou shell focado) legível; inputs agrupados; resultado destacado.
3. Guardar + reabrir histórico se `GET :id` / list existir; **não inventar DELETE**.
4. Disclaimer fixo: não substitui declaração oficial; confirmar legislação + revisão do gabinete.
5. Smoke: hub → abrir → simular → guardar → reabrir.

**Rotas:** hub `/app/firm/calculators`; legacy `/calculators/{iva|irs|ss|retencao|imt|irc}` → `?open=`.  
**Estado:** ☐ hub · ☐ IVA · ☐ IRS · ☐ SS · ☐ Retenção · ☐ IMT · ☐ IRC

### Fase 13 — Documentos (3 subrotas)

| Subfase | Path | Módulo |
|---------|------|--------|
| **13.1** | `/documents/requests` | Pedidos formais |
| **13.2** | `/documents/files` | Ficheiros / validação |
| **13.3** | `/documents/history` | Histórico + export |

**Estado:** ✅✅✅

### Fase 14 — Mensagens

| | |
|--|--|
| **Ficheiros** | `FirmMessagesPage.tsx`, `FirmMessagesModule`, Drive picker |
| **Alvo** | Chat full-height limpo; lista + thread; anexos; pins; unread |
| **Subfases** | **14.1** lista · **14.2** thread · **14.3** anexos/Drive |
| **Estado** | ✅ |

### Fase 15 — Central de alertas

| | |
|--|--|
| **Ficheiros** | `AlertsWorkspace.tsx`, composer, preview, analytics |
| **Alvo** | Distinto visualmente de Notícias; publish/draft claros |
| **Subfases** | **15.1** lista · **15.2** composer · **15.3** analytics |
| **Estado** | ✅ |

### Fase 16 — Notícias

| | |
|--|--|
| **Ficheiros** | `NewsWorkspace.tsx`, composer, body renderer |
| **Alvo** | Mesmo padrão de qualidade que Alertas, identidade própria |
| **Subfases** | **16.1** lista · **16.2** composer · **16.3** publish/media |
| **Estado** | ✅ |

### Fase 17 — Plano Teglion

| | |
|--|--|
| **Ficheiros** | `FirmBillingPage.tsx` |
| **Alvo** | Trial/checkout/portal óbvios; **nunca** confundir com Pagamentos carteira nem Stripe Connect |
| **Subfases** | **17.1** estado · **17.2** checkout · **17.3** copy |
| **Estado** | ✅ |

### Fase 18 — Definições (12 tabs = 12 subfases)

| Subfase | `?tab=` | Label |
|---------|---------|-------|
| **18.1** | `identidade` | Identidade (logo/accent) |
| **18.2** | `pagina-publica` | Página pública (editor completo) |
| **18.3** | `escritorio` | Gabinete |
| **18.4** | `pagamentos` | Receber dos clientes (Stripe Connect) |
| **18.5** | `perfil` | O seu perfil |
| **18.6** | `seguranca` | Segurança (MFA) |
| **18.7** | `equipa` | Equipa |
| **18.8** | `etiquetas` | Etiquetas |
| **18.9** | `notificacoes` | Notificações |
| **18.10** | `ajuda` | Ajuda e suporte |
| **18.11** | `sobre` | Sobre o Teglion |
| **18.12** | `encerrar` | Encerrar conta |

**Notas:** página pública é “produto dentro de settings” — tratar 18.2 com o mesmo rigor de uma fase inteira.  
**Estado:** ✅ × 12

---

## 6. Fase L — Landing (produto real)

Não está no menu firm, mas **vende o sistema**. Fazer em paralelo depois da Fase 1 (ou em lote com 1–3).

| | |
|--|--|
| **Ficheiros** | `LandingPage.tsx`, secções, `landingScreens.ts`, `LandingScreenshot`, `public/landing/screens/`, `landing.css` |
| **Problema** | Omite módulos reais (carteira, imóveis, SAF-T, agenda, calendário fiscal, calculadoras); screenshots desalinhados; confunde Stripe/carteira e três “calendários” |
| **Alvo** | Secção “O que o Teglion já inclui” alinhada a `FIRM_NAV_GROUPS`; carrossel com aspect fixo; captions honestas; FAQ sem overclaim AT |
| **Subfases** | **L.1** estrutura/hero · **L.2** grelha de módulos reais · **L.3** carrossel/screenshots · **L.4** pricing/FAQ/CTA |
| **Estado** | ☐ |

---

## 7. Disambiguação conceptual (obrigatória na copy)

| Conceito A | Conceito B | Conceito C |
|------------|------------|------------|
| **Pagamentos (carteira)** avenças dos clientes do gabinete | **Receber (Stripe Connect)** nas Definições | **Plano Teglion** billing da AfDigital/SaaS |
| **Calendário fiscal** obrigações legais do calendário | **Tarefas / calendário ops** trabalho interno | **Agendamentos** consultas com clientes |
| **SAF-T consulta** importação/leitura | *(não existe)* emissão AT | — |
| **Calculadoras** simulação de apoio | Declaração oficial | — |
| **Alertas** broadcast urgência | **Notícias** conteúdo editorial | — |

---

## 8. Contagem de trabalho (ordem de grandeza)

| Bloco | Unidades DoD | Estimativa relativa |
|-------|--------------|---------------------|
| Fases 1–6 | ~20 subfases | Alto (hub cliente + pagamentos + imóveis) |
| Fase 7 | 6 vistas | Alto |
| Fases 8–11 | ~12 | Médio–alto |
| Fase 12 | 1 + 6 | Alto (cada calc = formulário completo) |
| Fases 13–17 | ~15 | Médio |
| Fase 18 | 12 tabs | Alto (esp. página pública) |
| Fase L | 4 | Alto (marketing + assets) |
| **Total** | **~70+ checkboxes** | Programa multi-semana, commits diários |

Isto **não** cabe num único PR. Estratégia:

```text
feature/fase-repaginacao-paginas
  → commits por subfase
  → PR → staging a cada 1–3 fases estáveis
  → UAT gabinete
  → só então PR staging → main
```

---

## 9. Arranque imediato

1. Criar/checkout `feature/fase-repaginacao-paginas` a partir de `staging`.
2. Manter este ficheiro como **fonte de verdade** do progresso (marcar ☐ → ✅).
3. Começar **Fase 1 — Painel** (inventário escrito no PR + implementação 1.1→1.3).
4. Em paralelo opcional: capturar screenshots frescos para Fase L.

Inventário de rotas legado (congelado): [`REPAGINACAO_UI_INVENTORY.md`](./REPAGINACAO_UI_INVENTORY.md) — Wave UI tokens/shell.  
Este roadmap = **Wave páginas / produto**.

---

## 10. Progresso vivo

| Fase | Nome | Estado |
|------|------|--------|
| 1 | Painel | ✅ |
| 2 | Clientes | ✅ |
| 3 | Pagamentos | ✅ |
| 4 | Imóveis e rendas | ✅ |
| 5 | SAF-T | ✅ |
| 6 | Obrigações | ✅ |
| 7 | Tarefas | ✅ |
| 8 | Agendamentos | ✅ |
| 9 | Área IRS | ✅ |
| 10 | Serviços | ✅ |
| 11 | Calendário fiscal | ✅ |
| 12 | Calculadoras (0+6) | ☐ |
| 13 | Documentos | ✅ |
| 14 | Mensagens | ✅ |
| 15 | Alertas | ✅ |
| 16 | Notícias | ✅ |
| 17 | Plano | ✅ |
| 18 | Definições (12) | ✅ |
| L | Landing | ☐ |

**Última actualização:** 2026-10-25 — Fases 1–11 concluídas (copy autoexplicativa + layout leve).
