# TegLion — Cronograma de execução

**Última actualização:** Julho 2026  
**Modo de trabalho:** Uma melhoria de cada vez → compilar → testar → documentar → próxima.

Este documento complementa [ROADMAP.md](../product/ROADMAP.md) com **estado actual**, **dívida técnica em curso** e **próximos passos concretos**.

---

## Legenda de estado

| Símbolo | Significado |
|---------|-------------|
| ✅ | Concluído e validado |
| 🟡 | Em curso ou parcial |
| ⬜ | Pendente |
| ⏸ | Bloqueado (dependência externa) |

---

## Modo actual: Dívida técnica (Tech Lead)

**Prioridade:** limpar, organizar e acelerar **antes** de novas funcionalidades.

Ordem de trabalho (ver regras no ROADMAP secção 11):

1. Dividir arquivos gigantes
2. Remover código morto
3. Eliminar duplicações
4. Padronizar estrutura
5. Otimizar queries e carregamento
6. React: memo, lazy, virtualização
7. Reduzir bundles
8. Erros e logs
9. Testes em partes críticas refatoradas
10. **Só depois** — Fase 1 do roadmap (confiança para vender)

### God files — fila de divisão

| Ficheiro | Linhas | Estado | Próximo passo |
|----------|--------|--------|---------------|
| `backend/.../portal.service.js` | ~270 | ✅ | Facade; docs/mensagens extraídos |
| `portal-documents.service.js` | ~330 | ✅ | Upload, listagem, pedidos |
| `portal-messages.service.js` | ~50 | ✅ | Chat cliente |
| `portal-notifications.helper.js` | ~75 | ✅ | In-app notifications |
| `frontend/.../FirmDashboardPage.tsx` | ~480 | ✅ | Utils + parts extraídos |
| `backend/.../contabil-auth.service.js` | ⬜ medir | ⬜ | Separar registo vs login |
| `backend/.../documents.service.js` | ⬜ medir | ⬜ | Separar upload vs validação |

---

## Fase 0 — Fundação ✅

Antigas Fases 1 (Limpeza) + 2 (Arquitectura). **Concluídas Jul 2026.**

| Entrega | Estado |
|---------|--------|
| Legacy removido; domínio contabilidade | ✅ |
| Stripe live; piloto real | ✅ |
| `api.ts` modular; repositories/routes facades | ✅ |
| CountryConfig PT + BR stub | ✅ |
| `/api/v1`; CI file-size gate; tenant isolation | ✅ |
| E2E Playwright smoke | ✅ |

---

## Fase 1 — Confiança para vender (Meses 1–3)

**Objectivo:** 50–200 escritórios pagantes, zero incidentes P0.  
**Início:** após fila de dívida técnica P0.

| # | Entrega | Estado | Notas |
|---|---------|--------|-------|
| 1.1 | Google SSO login + registo | 🟡 | Código local; deploy + migration pendente |
| 1.2 | Migration SSO Supabase | 🟡 | `20260702120000_firm_user_sso.sql` |
| 1.3 | WAF Cloudflare + rate limit edge | ⬜ | |
| 1.4 | Redis obrigatório; multi-instance | ⬜ | |
| 1.5 | Job queue BullMQ | ⬜ | |
| 1.6 | Paginação dashboard; índices email | ⬜ | |
| 1.7 | Pentest externo | ⬜ | |
| 1.8 | E2E registo → upload → obrigação | 🟡 | Smoke 5/5; fluxo completo pendente |
| 1.9 | Staging real (Vercel + Render) | ⬜ | `www.teglion.vercel.app` bloqueado |
| 1.10 | Dividir god files | 🟡 | `portal.service.js` primeiro |
| 1.11 | 10 testemunhos + 3 case studies | ⬜ | |
| 1.12 | Landing v2 (vídeo + ROI) | ⬜ | |

**Critérios de saída:** 100+ registados · 50+ pagantes · uptime 99.5% · trial→paid >25%

---

## Fase 2 — Experiência que retém (Meses 3–6)

| Entrega prioritária | Estado |
|---------------------|--------|
| Dashboard «Hoje» | ⬜ |
| Mapa fecho de mês v1 | ⬜ |
| Onboarding wizard 3 passos | ⬜ |
| Portal «O que falta entregar» | ⬜ |
| Design system unificado | 🟡 |
| Import CSV clientes | ⬜ |

---

## Fases 3–10 — resumo

| Fase | Nome | Timing |
|------|------|--------|
| 3 | Motor de crescimento | Meses 6–9 |
| 4 | Inteligência operacional (IA) | Meses 9–12 |
| 5 | Escala técnica | Meses 6–18 (paralelo) |
| 6 | Brasil & lusófono | Meses 12–18 |
| 7 | Europa Sul (ES) | Meses 18–24 |
| 8 | Marketplace | Meses 24–36 |
| 9 | Enterprise | Meses 30–48 |
| 10 | Referência mundial | Meses 48–60 |

Detalhe completo: [ROADMAP.md](../product/ROADMAP.md) · Backlog 350 itens: [ROADMAP_BACKLOG.md](../product/ROADMAP_BACKLOG.md)

---

## Calendário orientativo (próximas semanas)

| Semana | Foco | Entregas alvo |
|--------|------|----------------|
| **S1 (agora)** | Dívida técnica | Dividir `portal.service.js`; testes helpers |
| **S2** | Dívida técnica | `FirmDashboardPage.tsx`; código morto FE |
| **S3** | Dívida técnica + F1 | BullMQ; paginação dashboard |
| **S4** | Fase 1 confiança | Google SSO deploy; staging real; E2E completo |

---

## Decisão arquitectural: manter backend Express

**Veredicto (Jul 2026):** **Não** eliminar o backend Node. **Sim** Supabase como BD + Storage.

Detalhe: [ARCHITECTURE.md](../engineering/ARCHITECTURE.md).

---

## Fluxo de trabalho por tarefa

```
1. Uma melhoria pequena (comportamento preservado)
2. node --check / tsc / npm test / build
3. Actualizar este cronograma + CHANGELOG se relevante
4. Resumo + propor próxima tarefa de maior impacto
```

---

## Referências

- Estado detalhado: [STATUS.md](./STATUS.md)
- Histórico: [CHANGELOG.md](../product/CHANGELOG.md)
- Módulos: [MODULES.md](../product/MODULES.md)
