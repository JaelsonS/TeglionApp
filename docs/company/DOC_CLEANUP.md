# TegLion — Limpeza de documentação e código morto

**Actualizado: 17 Julho 2026**  
Eu uso isto para não deixar o repo engordar. Objectivo: poucos docs vivos, resto no arquivo.

---

## 1. Documentos que eu mantenho vivos

| Tema | Documento |
|------|-----------|
| Onde estou / o que faço | `docs/company/EVOLUTION_PLAN.md` + `docs/operations/STATUS.md` |
| Piloto | `docs/CLIENTE_PILOTO/*` |
| Roadmap estratégico | `docs/product/ROADMAP.md` |
| Arquitectura / API / Segurança | `docs/engineering/*`, `docs/security/*` |
| Deploy | `docs/operations/DEPLOY_*.md`, `GO_LIVE_CHECKLIST.md` |

---

## 2. O que já arquivei (17 Jul)

Movi para `docs/_archive/` (não apaguei):

- Inventário + STRUCTURE da raiz
- Sprints 0.9, auditorias pontuais, CRONOGRAMA, PILOT_ROADMAP
- ROADMAP_BACKLOG, ARCHITECTURE_REORGANIZATION
- BACKEND_JAVA_BLUEPRINT → `_archive/java/`

---

## 3. Código morto — próximo passo (ainda preciso)

1. Frontend: `knip` / exports órfãos  
2. Rotas sem entrada no router  
3. Backend: handlers sem montagem  
4. CSS `cb-*` não referenciado (já removi `cb-settings-nav` morto)  
5. `depcheck` em frontend/backend  

Não misturo limpeza massiva de código com features na mesma PR.

---

## 4. Tom dos docs

Escrevo como eu: **fiz / preciso / faço**. Data no topo. Um parágrafo “para quê”. Link para EVOLUTION_PLAN.
