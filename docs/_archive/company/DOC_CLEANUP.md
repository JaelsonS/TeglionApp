# Teglion — Limpeza

**Actualizado: 6 Agosto 2026**

## Ronda 6 Agosto 2026 (auditoria completa + COMECE_AQUI)

### Docs apagados
- `docs/operations/EXECUCAO_ROLES_TELAS.md` — plano de RBAC pré-implementação, já 100% implementado e verificado em código (`requirePermission`/`requireRole`); referências actualizadas em `README.md`, `docs/operations/README.md`, `docs/operations/STATUS.md`, `docs/operations/GO_PRODUCTION.md`

### Docs corrigidos (nomenclatura clínica/paciente residual — já removida do código, só faltava a doc)
- `docs/engineering/API.md` — removidas permissões `CLINIC_READ`/`CLINIC_UPDATE` (inexistentes) e alias `/patient-portal` (já removido, Etapa 1.6)
- `docs/product/MODULES.md` — "CLINIC_\* fica para etapa futura" corrigido para "já removido"
- `docs/engineering/ARCHITECTURE.md` — claim JWT `clinicId (= firmId)` corrigido para `firmId` (claim actual)
- `docs/security/TENANT_ISOLATION_REPORT.md` — banner de desactualizado (execução de 2026-05-22) + terminologia `clinicId` → `firmId`

### Docs aparados (duplicação removida, mantendo o que é único)
- `docs/design/UI.md` — removida duplicação de tokens/componentes/princípios (fonte única passa a ser `DESIGN_SYSTEM.md`); mantido checklist QA, baseline visual e estado do redesign

### Docs novos
- `docs/COMECE_AQUI.md` — guia mestre de entrada no projecto, com ordem de leitura por objectivo
- `docs/product/SPRINT_PLAYBOOK.md` — sprints sequenciados do piloto até comercial em escala

### Verificado e mantido (não é lixo, tem propósito distinto apesar de parecer sobreposto à primeira vista)
- `CLIENTE_PILOTO/BACKLOG.md` vs `PEDIDOS_CONTADORA.md` — backlog geral por módulo vs. pedidos priorizados directos da contadora piloto
- `CLIENTE_PILOTO/CHANGELOG.md` vs `product/CHANGELOG.md` — granular/piloto vs. estratégico/arquitectura
- `operations/GO_PRODUCTION.md` vs `operations/GO_LIVE_CHECKLIST.md` — checklist manual detalhado vs. gate automatizado (`release:readiness`)

## O que eu apaguei (ronda 17 Julho 2026)

### Código morto
- `RecoverLanguageDropdown` + `useRecoverLocale` (nunca usados)
- `AuthEasySignIn` (login usa `GoogleAuthButton`)
- `PushNotificationSettings` (nunca montado)
- `ObligationItem` (portal monta linhas sem isto)
- `frontend/tools/log-require.*` (debug Vitest órfão)

### Docs lixo
- `docs/_archive/` inteiro (inventários, sprints, auditorias, blueprint Java, backlog 350+)
- `docs/qa/` (baseline vazio, só `.gitkeep`)

### Sistema
- `.DS_Store` versionados (já estavam no `.gitignore`)

## Documentos que mantenho vivos

| Tema | Documento |
|------|-----------|
| Onde estou | `docs/company/EVOLUTION_PLAN.md` + `docs/operations/STATUS.md` |
| Piloto | `docs/CLIENTE_PILOTO/*` |
| Roadmap | `docs/product/ROADMAP.md` |
| Eng / segurança / deploy | `docs/engineering/*`, `docs/security/*`, `docs/operations/DEPLOY_*` |

## Ainda posso limpar depois

1. `knip` no frontend (exports órfãos)
2. `depcheck` em frontend/backend
3. CSS `cb-*` não referenciado

## Nota

`docs/operations/REDIS_RENDER_SETUP.md` mantém-se — é referência de produção (Render Redis). Não apagar sem actualizar `STATUS.md`, `GO_PRODUCTION.md` e `DEPLOY_PRODUCTION.md`.
