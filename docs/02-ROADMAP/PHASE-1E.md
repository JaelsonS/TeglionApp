# Fase 1E — Responsive + Visual Polish

**Branch:** `feature/fase-1`  
**Ambiente:** staging only — sem produção / sem merge para `main`.  
**STATUS:** **IN PROGRESS** — Bloco 1 (Shell tablet rail) implementado no código.  
Blocos 2–7 e **browser QA staging** ainda pendentes. Não declarar CLOSED sem QA nos 7 breakpoints.

**Dependências fechadas:** Fase 1A (segurança) · 1B (Design System) · 1C (onboarding/dashboard) · 1D (serviços/IRS captação)

---

## Objectivo

Tornar o Teglion visualmente consistente e profissional em:

| Faixa | Breakpoints | Comportamento desejado |
|-------|-------------|------------------------|
| Mobile | 375–430 (e até 767) | Bottom nav + sheets/forms utilizáveis + safe-area |
| **Tablet** | **768–1279** | **Rail próprio** (não mobile) — ícones + drawer para labels |
| Desktop | 1280–1440+ | Sidebar completa + densidade/hierarquia melhoradas |

Não é “só media queries”: é produto SaaS de escritório, com hierarquia clara e Design System único.

**Critério CLOSED (obrigatório):** código + testes + build + **browser QA real em staging** nos breakpoints 1440 / 1280 / 1024 / 768 / 430 / 390 / 375.  
Não declarar CLOSED só porque Vitest/TypeScript passam.

---

## A. Auditoria do estado actual (1A–1D)

### O que já está fechado (não reabrir)

| Fase | Manter intacto |
|------|----------------|
| **1A** | JWT, CSRF, cookies, tenant isolation, refresh, permissões |
| **1B** | Tokens, Button/Card/EmptyState/PageHeader/FormField/Chip/Progress; firm sem `cb-btn-*` |
| **1C** | `computeFirmProgress`, next-step, onboarding real, Maya `openMaya` estática |
| **1D** | Modelo Solicitações vs Central; publish states; campanha IRS; intake público |

### Shell actual (diagnóstico crítico)

`FirmLayout.tsx` é **binário em `xl` (1280px)**:

- **&lt; 1280:** `cb-firm-mobile-shell` → Topbar + main + **bottom nav** (+ Maya com offset do bottom nav)
- **≥ 1280:** `cb-firm-desktop-frame` → sidebar completa (`--cb-firm-sidebar-width: 16.5rem`) + topbar compacta

Consequência: **tablet 768–1279 = chrome de telemóvel**. Isto está documentado como deferred desde 1B/1C/1D.

Assets já existentes para o rail (reutilizar):

- `firmNavConfig.ts` — `FIRM_NAV_RAIL_MAIN` / `FIRM_NAV_RAIL_BOTTOM`
- CSS legado `.cb-firm-icon-rail*` (sem callers TSX activos)
- `FirmSidebar` `variant="drawer"` (hoje pouco usado no shell firm)
- Token `--cb-firm-rail-width` (hoje alias da sidebar — precisa valor estreito real)

### Conteúdo vs chrome

| Camada | Breakpoints | Estado |
|--------|-------------|--------|
| Shell (nav) | &lt;1280 / ≥1280 | Tablet = mobile ❌ |
| `FirmSplitView` | &lt;768 / 768–1279 / ≥1280 | Já tem sheet em tablet ✅ |
| Grids Tailwind | `sm`/`md`/`lg` | Independentes; por vezes desalinhados do shell |

### Superfícies prioritárias — achados

| Superfície | Prioridade | Problemas |
|------------|------------|-----------|
| **Shell / Maya** | P0 | Sem rail tablet; FAB só “mobile vs xl”; dual Outlet trees |
| **Dashboard** | P0 | `.cb-dash-cols` = `1fr + 300px` **sem stack** → squeeze/overflow; KPI row `lg:grid-cols-6` com 4 KPIs |
| **Serviços hub** | P1 | Tabs overflow; KPIs densos; **Central com PageHeader duplicado** |
| **IRS** | P1 | `headerRight` com demasiados CTAs (wrap agressivo em tablet) |
| **Agenda** | P1 | `.cb-agenda-grid { min-w: 720px }` + sidebar a `lg` (1024) dentro de chrome mobile |
| **Messages** | P2 | Split OK; altura compose sob bottom nav; CSS `.cb-chat-*` |
| **Settings** | P1 | Hub `lg:` (1024) vs shell `xl` (1280) → iPad = side-nav + bottom nav |
| **Billing** | P2 | Cards/banner fora do ritmo DS |
| **Página pública / editor** | P1 | Toolbar + preview sticky `lg:420px` aperta tablet |
| **Onboarding** | P2 | Card grande no dashboard (densidade) — lógica 1C intacta |
| **Maya** | P1 | Offset FAB para bottom nav; sem banda tablet |

### Design System

- Primitives oficiais a usar: Button, Card, PageHeader, EmptyState, FormField, Chip, Skeleton, Progress, Dialog/Sheet, FirmModuleShell, FirmSplitView, SegmentedControl (subutilizado), MobileBottomNav (firm usa CSS próprio).
- Residual firm: layout CSS `.cb-dash-*`, `.cb-agenda-*`, `.cb-settings-*`, `.cb-chat-*`, `.cb-tasks-tabs` — **não apagar `contabil.css`**; evoluir gradualmente.
- Auth/client `cb-btn-*` fora de âmbito 1E.

### Acessibilidade (gaps a fechar na 1E)

- Focus/keyboard nos novos controlos do rail e drawers
- Áreas clicáveis ≥44px no rail e bottom nav
- `aria-expanded` / labels no rail e “Mais”
- Contraste badges/CTAs secundários
- Formulários críticos: `aria-invalid` + mensagem (FormField) onde ainda falte

---

## B. Componentes / rotas a alterar

### Bloco 0–1 — Shell (obrigatório)

| Ficheiro | Alteração prevista |
|----------|-------------------|
| `FirmLayout.tsx` | Introduzir banda tablet 768–1279 (rail); esconder bottom nav nessa faixa |
| `FirmSidebar.tsx` / drawer | Reusar drawer para labels no tablet |
| `FirmMobileNavBar.tsx` | Limitar a &lt;768 (ou &lt;md) |
| `firmNavConfig.ts` | Fonte única de itens do rail |
| `app-shell.css` / `contabil.css` | Classes rail; safe-area; padding main |
| `tokens.css` | `--cb-firm-rail-width` real (~3.5–4.5rem) |
| `MayaAssistant.tsx` | FAB: mobile (acima bottom nav) / tablet+desktop (canto) |

### Bloco 2 — Dashboard

| Ficheiro | Alteração |
|----------|-----------|
| `contabil.css` `.cb-dash-cols` | Stack &lt;1280 (ou &lt;lg) |
| `.cb-dash-kpi-row` | Colunas alinhadas a 4 KPIs |
| `FirmDashboardPage.tsx` / Parts | Densidade; empties → EmptyState onde fizer sentido |
| `FirmOnboardingWizard.tsx` | Compactação visual opcional |

### Bloco 3 — Serviços / IRS

| Ficheiro | Alteração |
|----------|-----------|
| `FirmServiceRequestsPage.tsx` | Tabs/SegmentedControl; densidade KPIs |
| `ServicesWorkspace.tsx` | Remover PageHeader aninhado |
| `FirmIrsPage.tsx` | CTAs: primário + menu «Mais acções» |

### Bloco 4 — Agenda / Messages / Settings

| Ficheiro | Alteração |
|----------|-----------|
| `AgendaWorkspace.tsx` + CSS grid | Affordance scroll; alinhar sidebar ao shell |
| `FirmMessagesPage.tsx` / module | Altura compose / safe-area |
| `FirmSettingsPage.tsx` + CSS hub | Breakpoint hub ↔ `xl` shell |

### Bloco 5 — Public / Billing / polish

| Ficheiro | Alteração |
|----------|-----------|
| `PublicSiteEditor.tsx` | Toolbar stack; preview colapsável em tablet |
| `FirmBillingPage.tsx` | Polish leve DS |
| EmptyStates / tipografia residual | Passo de consistência |

### Não alterar (salvo bug 1E)

- Auth, APIs, RLS, Stripe, Google, Supabase prod
- Lógica `firmProgress` / publish / IRS campaign model
- Maya conteúdo de negócio / LLM
- Blog / marketing landings (salvo overflow crítico na página pública do firm)

---

## C. Plano técnico de implementação (ordem)

```
0. Spec + tokens rail (este doc)          ← AUDITORIA FEITA
1. Shell tablet rail + Maya FAB + safe-area
2. Browser smoke shell (768/1024/1280)     ← antes de polish profundo
3. Dashboard overflow + densidade
4. Serviços/IRS chrome (headers/tabs/CTAs)
5. Agenda + Messages + Settings breakpoints
6. Public editor + Billing light polish
7. A11y pass (focus, aria, hit targets)
8. Testes + build + PWA
9. Browser QA staging completo (obrigatório CLOSED)
10. Actualizar este doc → STATUS CLOSED
```

### Decisão de produto — tablet rail

**Reutilizar e estender**, não inventar terceiro sistema de navegação:

1. **&lt; 768:** bottom nav (telefone) — como hoje  
2. **768–1279:** icon rail esquerdo + drawer/`FirmSidebar drawer` para labels; **sem** bottom nav  
3. **≥ 1280:** sidebar completa com labels  

Evitar: encolher a sidebar de 16.5rem para caber no iPad (auditoria: “não basta encolher desktop”).

Preferência estrutural: reduzir dual-Outlet se possível ao tocar no layout (risco de estado duplicado) — avaliar no Bloco 1; se arriscado, manter dual DOM e só CSS/visibility.

---

## D. Riscos e dependências

| Risco | Mitigação |
|-------|-----------|
| Dual Outlet (mobile + desktop trees) | Preferir um host de conteúdo; se não, testes manuais de scroll/focus |
| Maya FAB desalinhado | Breakpoints explícitos por banda; sem hardcode só bottom-nav |
| `FirmSplitView` sheets vs rail | Validar z-index/largura em 768–1279 |
| Módulos com `lg:` (1024) vs shell `xl` (1280) | Alinhar Settings/Agenda ao novo modelo |
| Regressão 1C/1D | Só CSS/chrome; sem mudar regras de progresso/publicação |
| Scope creep DS | Não apagar `contabil.css`; migrar classes críticas |
| CLOSED sem UAT | Bloquear CLOSED até QA staging real |

**Dependências:** staging deployável a partir de `feature/fase-1`; browser (Chrome/Safari ou tooling) nos 7 widths.

---

## E. Browser QA (obrigatório)

### Breakpoints

1440 · 1280 · 1024 · 768 · 430 · 390 · 375

### Fluxos a validar

1. Navegação shell (rail / bottom nav / sidebar)  
2. Dashboard + onboarding + próximo passo  
3. Serviços → publicar (smoke) / Solicitações / Central  
4. IRS campanha + CTAs  
5. Agenda (semana/mês) sem overflow “surpresa”  
6. Messages compose  
7. Settings tabs  
8. Billing  
9. Página pública + editor (toolbar)  
10. Maya FAB + sheet  
11. Sheets/dialogs/forms — teclado, focus, botões não cortados  
12. Sem scroll horizontal desnecessário; safe-area OK  

Registar: overflow, console errors, CTA inacessível, layout quebrado.

---

## F. Testes automáticos

- TypeScript · Vitest · Backend security (não regredir 1A) · Vite build · PWA/prerender  
- Testes novos só se houver lógica de breakpoint/helpers (evitar flaky visual snapshots nesta fase)

---

## G. Commits previstos (pequenos)

Exemplos:

- `feat(shell): add tablet icon rail between 768 and 1279`
- `fix(dashboard): stack dash columns below desktop`
- `refactor(services): remove nested central page header`
- `fix(ux): align settings hub breakpoint with firm shell`
- `fix(maya): position fab for tablet without bottom nav`
- `docs(roadmap): close phase 1e after staging browser qa`

---

## H. Deferred (explícito)

- Auth/client `cb-btn-*` migration  
- Apagar monolith `.cb-btn-*` / limpeza total `contabil.css`  
- Maya LLM / dados  
- Redesign profundo editores Serviço/Modelo 3 (além de polish mobile)  
- Full-bleed marketing da página pública  
- MFA / Admin / Blog  

---

## I. Critério de CLOSED (checklist)

- [ ] Tablet 768–1279 com rail próprio (não bottom-nav phone)  
- [ ] Mobile 375–430: nav, sheets, forms, safe-area OK  
- [ ] Desktop 1280+: densidade/hierarquia melhoradas nas superfícies prioritárias  
- [ ] Design System único nas alterações; sem novos `.cb-button` paralelos  
- [ ] 1A–1D intactos (segurança + progresso + captação)  
- [ ] Maya estática; FAB OK em todos os breakpoints  
- [ ] A11y mínima (focus, labels, hit targets, erros)  
- [ ] TypeScript / Vitest / backend / build / PWA PASS  
- [ ] **Browser QA real staging** nos 7 breakpoints  
- [ ] Working tree limpo; commits pequenos; sem merge `main`  
- [ ] Este documento actualizado para **CLOSED**

---

## J. Progresso de implementação

### Bloco 1 — Shell tablet rail (código)

**Feito:**
- Layout unificado (um `Outlet`)
- Mobile &lt;768: bottom nav
- Tablet 768–1279: `FirmTabletRail` + drawer (`FirmSidebar` drawer)
- Desktop ≥1280: sidebar completa
- Maya FAB: offset bottom-nav só &lt;768; `md:bottom-6` a partir de tablet
- Token `--cb-firm-rail-width: 4.25rem`
- Contrato testável `firmShellChrome.ts`

**Smoke browser live 768/1024/1280:** pendente validação humana / staging (sem sessão autenticada nesta execução). Contrato de breakpoints coberto por Vitest.

**Não avançar para Bloco 2** até validação do relatório Bloco 1.

---

## K. Próximo passo

1. Validar Bloco 1 (este relatório)  
2. Bloco 2 — Dashboard overflow/densidade  
3. … até Browser QA staging completo → CLOSED  
