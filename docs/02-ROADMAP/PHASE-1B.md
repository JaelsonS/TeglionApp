# Fase 1B — Design System + UX Foundation

**Branch:** `feature/fase-1`  
**Ambiente:** staging only — sem produção / sem merge para `main`.  
**STATUS:** fundação implementada; migração progressiva em curso.

---

## Auditoria (diagnóstico)

### O que já existia (reutilizar)

| Primitive | Local | Notas |
|-----------|-------|-------|
| Button | `ui/button.tsx` (+ re-export DS) | Agora com `primary`/`danger`/`loading` |
| PageHeader | `layout/PageHeader.tsx` | Oficial; firm hubs migrados |
| EmptyState | `design-system/EmptyState.tsx` | Unificado + secondaryAction |
| FormField | `design-system/FormField.tsx` | error / required / hint |
| Card | `ui/card.tsx` | Promovido; shadow token |
| Chip | `design-system/Chip.tsx` | Novo — Maya / filtros |
| Tokens | `tokens.css` | soft colors, spacing, radius, shadows |
| Toast | Sonner | Único — mantido |
| ModuleHelpDialog | DS | Mantido (Guia contextual) |

### Duplicações residuais (não apagadas)

- `contabil.css` ~726 `.cb-*` — migrar callers; CSS permanece até 0 usages
- Inline headers em Agenda/Messages/News — próximo passo
- `cb-btn-*` residual em settings/auth

### Decisões

| Decisão | Escolha |
|---------|---------|
| Button oficial | `primary` = brand; `danger` = destructive; `loading` + `fullWidth` |
| Tipografia | Tailwind `text-display|title|body|caption` |
| Maya 1B | FAB + Sheet + chips (sem LLM); assets `/maya/*` preservados |
| Onboarding | Passo invite com estado real (portal); URL pública visível |

---

## Implementado

1. Tokens DS v1 (soft, spacing, radius, icon sizes, shadow-modal)
2. Button / Card / PageHeader / EmptyState / FormField / Chip
3. Firm surfaces: Dashboard, IRS, Serviços (Central), Clientes, Settings, Billing
4. Onboarding: invite real + página pública + copy/open URL
5. Maya foundation no FirmLayout
6. Docs: este ficheiro

---

## Checklist aceitação

- [x] Design tokens oficiais
- [x] Button / Card / PageHeader / EmptyState / FormField
- [x] Toast consistente (Sonner)
- [x] Chip + Maya shell
- [x] Dashboard / IRS / Serviços / Clientes / Settings / Billing
- [x] Onboarding invite fix + URL pública
- [x] Maya assets preservados
- [x] TypeScript PASS / Frontend tests PASS / Security tests PASS
- [ ] Agenda / Messages headers (parcial — auditado)
- [ ] Tablet rail dedicado (Fase 1E)
- [ ] Eliminar todos os `cb-btn-*` (progressivo)
- [ ] Visual QA browser em todos os breakpoints

---

## Próximo passo

**Fase 1C** — Onboarding + Dashboard next-step + empty states restantes  
ou residual 1B (Agenda/Messages PageHeader + menos `cb-*`).
