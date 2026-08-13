# Fase 1B — Design System + UX Foundation

**Branch:** `feature/fase-1`  
**Ambiente:** staging only — sem produção / sem merge para `main`.  
**STATUS:** **CLOSED** (1B.1 fecho + Visual QA estrutural)

---

## Completed

### Design System
- Tokens (soft colors, spacing, radius, shadows, tipografia)
- Button (`primary` / `danger` / `loading` / `fullWidth`)
- Card anatomy
- PageHeader oficial
- EmptyState + secondaryAction
- FormField (error / required / hint)
- Chip (Maya intents)

### Firm surfaces migradas
- Dashboard, IRS, Serviços, Clientes, Settings, Billing
- **Agenda** (PageHeader + Button + aria nos controlos)
- **Messages** (PageHeader + EmptyState)

### Onboarding
- Passo invite com estado real (portal)
- Passo página pública + URL copiar/abrir

### Maya v1
- FAB discreto com safe-area + clearance da bottom nav
- Sheet com welcome + intents estáticos + respostas
- Deep-links apenas (sem LLM, sem APIs de negócio)
- Guia (`ModuleHelpDialog`) preservado
- Assets `/maya/*` preservados

### Residual buttons (firm)
- Todos os `cb-btn-*` / `cb-services-btn-*` em `features/firm` migrados para `Button` oficial

---

## Residual legacy components

| Classe | Estado | Notas |
|--------|--------|-------|
| `cb-btn-*` em **auth/client/recover** | **C** — deferred | Auth cards com radius próprio; migrar com polish auth |
| `cb-btn-secondary` client portal | **B** | Fora do escopo firm 1B |
| `DocumentPreviewModal` `cb-btn-primary` | **B** | Compartilhado; não crítico firm shell |
| `.cb-*` em `contabil.css` | **C** | CSS permanece até 0 callers; não apagar |
| Headers `cb-settings-panel-title` etc. | **B** | Secções internas, não page-level |
| Alerts / News / Fiscal calendar page titles | **B** → 1C/1D | Não hubs 1B.1 |
| Tablet rail dedicado | **Deferred 1E** | 768–1279 ainda usa mobile shell |

---

## Visual QA

Método: revisão estrutural do código + TypeScript/build (browser live recomendado em staging).

| Superfície | Desktop | Notas |
|------------|---------|-------|
| Dashboard | OK | PageHeader + filtros Button |
| IRS | OK | Copy captação |
| Serviços | OK | EmptyState + primary Button |
| Clientes | OK | EmptyState grid |
| Agenda | OK | PageHeader migrado |
| Messages | OK | PageHeader + EmptyState |
| Settings / Billing | OK | Já 1B |
| Maya | OK | FAB + Sheet + answers |

---

## Responsive QA

| Breakpoint | Resultado | Issues |
|------------|-----------|--------|
| 1440 / 1280 | PASS (estrutura) | — |
| 1024 / 768 | PASS com caveats | Tablet = mobile shell → **1E** |
| 430 / 390 / 375 | PASS (estrutura) | Maya FAB acima bottom nav + safe-area |

Overflow horizontal: shells firm usam `min-w-0` / `overflow-x-hidden` nos módulos migrados. Live check em staging recomendado.

---

## Maya QA

| Critério | Status |
|----------|--------|
| Sem LLM | PASS |
| Sem fetch/API negócio | PASS |
| Sem dados sensíveis | PASS (só `fullName` do user autenticado no greeting) |
| aria-label / Escape (Sheet Radix) | PASS |
| Mobile FAB vs bottom nav | PASS (offset + safe-area) |
| Guia preservado | PASS |
| Respostas estáticas | PASS (`mayaContent.ts`) |

---

## Accessibility QA

- Maya: `aria-label`, `aria-expanded`, `aria-haspopup`, fechar com label
- Agenda nav: `aria-label` em setas e vista
- PageHeader / EmptyState / Button focus rings existentes
- Sheet: focus trap Radix + Escape

---

## Console QA

- Firm TSX: sem `console.log/debug` nos módulos migrados
- Maya: sem logs
- Logger em Messages usa `logger.warn` com mensagem de erro (não tokens)

---

## Network QA

- Maya: **zero** chamadas de rede
- Agenda/Messages: APIs existentes inalteradas
- Sem alteração de auth / firm_id / CSRF

---

## Security QA

- Sem alterações a JWT/cookies/tenant isolation
- Maya não lê documentos/clientes/NIF/mensagens
- Nenhum finding P0/P1 novo nesta subfase

---

## Known deferred issues

| Item | Fase |
|------|------|
| Tablet rail / sidebar intermédia | **1E** |
| Auth/`cb-btn-*` legado | 1C polish ou sprint auth |
| Alerts/News/Fiscal page headers | 1C/1D |
| Live Visual QA screenshots em staging | UAT |
| Empty states 100% do firm | 1C |
| Remover CSS `.cb-btn-*` do monolito | quando 0 callers |

---

## Testes (fecho)

- Frontend vitest: **28/28 PASS**
- TypeScript: **PASS**
- Backend security 1A: **14/14 PASS**
- Vite build (+ PWA): **PASS**

---

## Próximo passo recomendado

**Fase 1C** — Onboarding + Dashboard “próximo passo” + empty states restantes + polish copy PT  
(depois 1D IRS/Services flows; 1E responsive tablet rail)
