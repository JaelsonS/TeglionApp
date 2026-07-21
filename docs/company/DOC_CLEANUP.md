# Teglion — Limpeza

**Actualizado: 17 Julho 2026**

## O que eu apaguei (esta ronda)

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
