# TegLion — Performance Charter

**Actualizado: 17 Julho 2026**  
Complemento de [EVOLUTION_PLAN.md](./EVOLUTION_PLAN.md).  

---

## Definition of Done (performance)

Uma feature só está pronta se eu conseguir marcar:

- [ ] Contei as requisições HTTP novas (idealmente ≤1; senão justifiquei)
- [ ] Não há segundo fetch da mesma informação (React Query / bootstrap)
- [ ] Listas grandes têm paginação ou virtualização
- [ ] Rotas novas com `React.lazy` quando fizer sentido
- [ ] Ícones importados por nome
- [ ] Modais/drawers só montam quando abertos
- [ ] SQL sem `SELECT *` à toa; sem N+1
- [ ] Sem `console.log` em produção
- [ ] Actualizei EVOLUTION / piloto se mudei comportamento
- [ ] Tenant isolation e segurança respeitados

---

## Bootstrap API (ainda preciso)

```
GET /api/contabil/bootstrap
→ { user, firm, permissions, settingsSummary, branding }
```

Isto deve substituir a cascata típica `/auth/me` + `/firm/settings` no primeiro paint.

**Estado:** planeado — ainda não implementei.

---

## Metas

| Métrica | Meta |
|---------|------|
| JS inicial | < 250 KB gzip |
| CSS inicial | < 100 KB gzip |
| First load | < 2 s (rede boa) |
| Lighthouse Performance | ≥ 95 |
| A11y / SEO / Best Practices | 100 |
| API p95 (rotas críticas) | documentar e baixar sprint a sprint |

---

## Slow requests (Render)

O middleware regista `slow request` acima de `SLOW_REQUEST_MS` (default **1500**).  
Warnings ~600–900ms no cold path com Supabase **não são bugs** — são sinal para eu fazer bootstrap + cache, não para panic.
