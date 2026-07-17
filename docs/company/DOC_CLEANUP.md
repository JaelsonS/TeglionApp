# TegLion — Limpeza de documentação e código morto

**Actualizado: 17 Julho 2026**  
**Regra:** nada é apagado sem o teu OK. Esta lista propõe; tu decides.

Objectivo: documentação de **startup séria** — poucos documentos vivos, resto em arquivo histórico.

---

## 1. Estrutura alvo (documentação viva)

Manter **uma fonte de verdade** por tema:

| Tema | Documento vivo |
|------|----------------|
| Visão / missão | `docs/product/VISION.md` |
| Roadmap estratégico | `docs/product/ROADMAP.md` |
| Onde estou / o que faço a seguir | `docs/company/EVOLUTION_PLAN.md` + `docs/operations/STATUS.md` |
| Piloto contadora | `docs/CLIENTE_PILOTO/*` |
| Arquitectura | `docs/engineering/ARCHITECTURE.md` |
| API | `docs/engineering/API.md` |
| Segurança | `docs/security/SECURITY.md` |
| Deploy / ops | `docs/operations/DEPLOY_*.md`, `GO_LIVE_CHECKLIST.md` |
| Performance / DoD | `docs/company/EVOLUTION_PLAN.md` (charter) |

Tudo o resto → **arquivo** (`docs/_archive/`) ou apagar se for duplicado sem valor.

---

## 2. Candidatos a apagar ou arquivar (docs)

### Pode arquivar (histórico útil, não do dia-a-dia)

| Ficheiro | Motivo |
|----------|--------|
| `TEGLION_INVENTARIO_COMPLETO.md` (raiz) | Snapshot pontual; desactualiza depressa |
| `STRUCTURE.md` (raiz) | Sobreposição com `docs/engineering/*` e READMEs |
| `docs/operations/SPRINT_0_9_*.md` | Sprint fechada |
| `docs/operations/AUDIT_PRODU.md` | Auditoria pontual |
| `docs/operations/CTO_PRODUCTION_AUDIT_2026-07.md` | Auditoria pontual |
| `docs/operations/CRONOGRAMA.md` | Se EVOLUTION_PLAN + STATUS cobrirem |
| `docs/operations/PILOT_ROADMAP.md` | Duplica CLIENTE_PILOTO + product ROADMAP |
| `docs/product/ROADMAP_BACKLOG.md` | Fundir no ROADMAP ou CLIENTE_PILOTO |
| `docs/engineering/ARCHITECTURE_REORGANIZATION.md` | Plano antigo de reorg |
| `docs/BACKEND_JAVA_BLUEPRINT.md` | Futuro Java — arquivar em `docs/_archive/java/` (não apagar) |

### Manter

| Ficheiro | Motivo |
|----------|--------|
| `docs/CLIENTE_PILOTO/*` | Diário do piloto |
| `docs/product/VISION.md`, `ROADMAP.md`, `PRODUCT.md`, `MODULES.md` | Norte do produto |
| `docs/operations/STATUS.md`, deploy, Redis, Stripe, Google SSO | Operação |
| `docs/security/*` | Compliance e isolamento |
| `docs/company/EVOLUTION_PLAN.md` | Founder OS (novo) |

### Duplicação a resolver (não apagar à cega)

- Três “roadmaps”: `product/ROADMAP.md`, `CLIENTE_PILOTO/ROADMAP.md`, `operations/PILOT_ROADMAP.md`  
  → **Decisão proposta:** estratégico = product; operacional piloto = CLIENTE_PILOTO; apagar/arquivar PILOT_ROADMAP.  
- Dois changelogs: `product/CHANGELOG.md` vs `CLIENTE_PILOTO/CHANGELOG.md`  
  → **Proposta:** piloto no CLIENTE_PILOTO; product só releases públicas.

---

## 3. Código morto — como caçar (ainda não apagar)

Checklist para uma sessão dedicada (2–4h):

1. **Frontend:** `knip` ou `ts-prune` — exports / ficheiros sem import.  
2. **Rotas:** páginas sem entrada no router.  
3. **Backend:** handlers sem montagem em `routes/`.  
4. **CSS:** classes `cb-*` não referenciadas (grep).  
5. **Deps:** `depcheck` em `frontend/` e `backend/`.  
6. **Console.log:** grep + regra ESLint `no-console` em produção.  
7. **Imagens:** PNG/JPG grandes → converter WebP e remover originais se não usados.

Não misturar limpeza massiva com features na mesma PR.

---

## 4. Plano de limpeza em 3 passes

| Passo | Acção | Risco |
|-------|--------|-------|
| 1 | Criar `docs/_archive/` e mover candidatos da secção 2 (sem apagar) | Baixo |
| 2 | Actualizar links em README / STATUS / EVOLUTION_PLAN | Baixo |
| 3 | Só depois: apagar arquivos >90 dias sem referência | Médio |

---

## 5. Tom da documentação (padrão startup)

Cada doc vivo deve ter no topo:

1. **Título claro**  
2. **Data de actualização**  
3. **Para quem é** (founder / eng / ops)  
4. **1 parágrafo** “porque existe”  
5. **Próximos passos** ou link para EVOLUTION_PLAN  

Evitar: inventários gigantes, dumps de chat, screenshots colados no meio de blueprints, três roadmaps a dizer coisas diferentes.
