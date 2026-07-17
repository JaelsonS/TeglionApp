# TegLion — Engineering Performance Charter

**Actualizado: 17 Julho 2026**  
Complemento operacional de [EVOLUTION_PLAN.md](./EVOLUTION_PLAN.md).  
O Cursor e qualquer contribuinte **devem** seguir isto em PRs de produto.

---

## Definition of Done (performance)

Uma feature só está “pronta” se:

- [ ] Contámos as requisições HTTP que introduz (idealmente ≤1 nova; senão justificado)
- [ ] Não há segundo fetch da mesma informação (usar cache React Query / bootstrap)
- [ ] Listas grandes usam paginação ou virtualização
- [ ] Rotas novas entram com `React.lazy` / code split quando fizer sentido
- [ ] Ícones importados por nome
- [ ] Modais/drawers só montam quando abertos
- [ ] Queries SQL sem `SELECT *` desnecessário; sem N+1
- [ ] Sem `console.log` em caminhos de produção
- [ ] Docs do piloto / EVOLUTION actualizados se mudar comportamento
- [ ] Segurança e tenant isolation respeitados

---

## Bootstrap API (alvo)

```
GET /api/contabil/bootstrap
→ { user, firm, permissions, settingsSummary, branding }
```

Substitui cascata típica: `/auth/me` + `/firm/settings` + pedaços de permissões no primeiro paint.

**Estado:** planeado — ainda não implementado.

---

## Metas numéricas

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
Warnings ~600–900ms em cold path com Supabase **não são bugs** por si — são sinal para bootstrap + cache, não para panic.
