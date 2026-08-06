# UI — checklist QA visual e operacional

Companheiro operacional de [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — tokens, componentes, princípios e regras de código vivem lá (fonte única). Este documento é só o checklist prático de QA visual, baseline de screenshots e estado do redesign.

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

Guardar PNG de referência no teu drive local ou no projeto de design — não versionamos baseline de ecrãs no Git.

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
