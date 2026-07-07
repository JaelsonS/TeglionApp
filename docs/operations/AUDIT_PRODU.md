# Auditoria TegLion — backlog aberto

**Última actualização:** Jun 2026  
**Histórico completo:** [STATUS.md](./STATUS.md) · checklist deploy: [DEPLOY_PRODUCTION.md](./DEPLOY_PRODUCTION.md)  
**QA visual:** [UI.md](../design/UI.md) · **Segurança:** [SECURITY.md](../security/SECURITY.md)

---

## Estado actual (resumo)

| Área | Veredicto |
|------|-----------|
| Build + TypeScript | ✅ |
| Redesign escritório + portal cliente | ✅ |
| Auth cookie-only + lockout + magic bytes | ✅ |
| Deploy produção + `/health/integrations` | ✅ |
| QA tablet/mobile em produção | 🟡 Pendente |
| Capturas baseline PNG | 🟡 Pendente |
| WAF Cloudflare | 🟡 Config manual |
| Skip-to-main global (a11y) | ❌ Só blog |
| Frontend Playwright E2E | ⚠️ Falha de runner atual |
| Backend smoke piloto | ✅ 6/6 |

---

## Próximas tarefas (por ordem)

| # | Tarefa | Esforço |
|---|--------|---------|
| 1 | QA tablet/mobile — escritório + portal (checklist em `UI.md`) | 2–4 h |
| 2 | Capturas baseline em `docs/qa/visual-baseline/screenshots/` | 1 h |
| 3 | Skip-to-main link global na app | 1 h |
| 4 | WAF Cloudflare (rate limit edge) | 2 h |
| 5 | Cache headers Vercel `/assets/*` | 30 min |
| 6 | Corrigir runner Playwright / Vitest e rodar smoke E2E | 2 h |

---

## Validação rápida

```bash
cd frontend && npm run build && npx tsc --noEmit
cd backend && npm run test:unit && npm run smoke:pilot
curl -s https://api.teglion.com/api/public/health/integrations | jq .
```

---

## Metodologia

- Uma tarefa de cada vez; commit pequeno após cada entrega
- Testar após alteração (`tsc`, `build`, smoke manual)
- Actualizar `STATUS.md` no fim de cada sprint
