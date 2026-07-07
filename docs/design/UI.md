# UI — design system, padrões e QA

Documento único para interface do TegLion (escritório + portal cliente).

---

## Princípios UX

1. **Máximo 2 cliques** por acção no portal cliente
2. **Mobile-first** no portal (nav inferior)
3. **Escritório = produtividade** (dashboard, split views, KPIs)
4. **Cliente = simples** (pedidos, documentos, mensagens)
5. **pt-PT** em toda a UI visível — cliente/escritório, não paciente/clínica

---

## Design system

**Stack:** React + TypeScript + Tailwind + Radix/shadcn + tokens CSS

### Import

```tsx
import {
  Button,
  Card,
  EmptyState,
  PageLoading,
  SkeletonCard,
  useContabilToast,
  SafeImage,
} from '@/design-system'
```

### Tokens principais

| Token | Uso |
|-------|-----|
| `--cb-brand` | Navy `#0f2942` |
| `--cb-accent` | Azul destaque |
| `--cb-success` / `--warning` / `--danger` | Estados |
| `--text-caption` | Mínimo 12px mobile |

Ficheiros: `frontend/src/styles/globals.css`, `contabil.css`, `design-system/tokens.ts`

### Componentes

| Componente | Uso |
|------------|-----|
| `FirmModuleShell` | Layout de módulo do escritório |
| `EmptyState` | Listas vazias |
| `Badge` | Estados, alertas |
| `SafeImage` | Imagens com fallback |
| `useContabilToast` | Erros com mensagem legível |

### Regras

1. Sem cores hex hardcoded — usar tokens
2. `text-caption` / `.cb-text-*` em vez de `text-[9px]`
3. Botões via `Button` do design system
4. Nunca mostrar UUIDs na UI

---

## CSS e dev

Pipeline em `frontend/src/main.tsx`:

```
globals.css → app-shell.css → animations.css
(contabil.css lazy em rotas /app)
```

```bash
cd frontend
npm run dev:clean   # limpa cache Vite
npm run build
```

PostCSS: `postcss.config.cjs` — se `@tailwind` aparecer literal no browser, reiniciar dev server.

---

## Redesign — estado (Jun 2026)

| Fase | Estado |
|------|--------|
| pt-PT | ✅ |
| Tokens e tipografia | ✅ |
| Componentes unificados | ✅ |
| Layout responsivo escritório | ✅ |
| Portal cliente premium | ✅ |
| QA visual tablet/mobile | 🟡 Pendente |

---

## Checklist QA

### Linguagem
- [x] Menus em pt-PT (Mensagens, Histórico, Ficheiros)
- [x] Toasts e empty states em português

### Layout
- [x] `FirmScrollPage`, `FirmWorkspacePage`, split views
- [ ] Tablet 768px sem overflow — validar manualmente

### Fluxos a regressar
- [ ] Dashboard escritório
- [ ] Tarefas (overview, obrigações, manual)
- [ ] Alertas, agenda, calendário fiscal
- [x] Portal cliente: navegação (alertas, notícias, booking na sidebar)
- [ ] Portal cliente: início, pedidos, mensagens, documentos (tablet/mobile)

### Build
- [x] `npx tsc --noEmit`
- [x] `npm run build`
- [x] CI GitHub Actions

---

## Baseline visual (capturas)

Guardar PNG em `docs/visual-baseline/screenshots/`:

| Ficheiro | Rota |
|----------|------|
| `desktop-dashboard.png` | `/app/firm/dashboard` |
| `desktop-tasks-overview.png` | `/app/firm/tasks/overview` |
| `desktop-alerts.png` | `/app/firm/alerts` |
| `tablet-dashboard.png` | `/app/firm/dashboard` (768×1024) |
| `desktop-client-home.png` | `/app/client` |

Comparar em PRs de UI. Incluir commit no nome do ficheiro.

---

## Rotas UI (referência rápida)

Ver mapa completo em [PRODUCT.md](../product/PRODUCT.md).

| Perfil | Rotas principais |
|--------|------------------|
| Escritório | `/app/firm/dashboard`, `clients`, `documents/*`, `tasks/*`, `messages` |
| Cliente | `/app/client`, `requests`, `documents`, `messages`, `alerts`, `news`, `booking` |
