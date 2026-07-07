# GO Produção — Execução Final

**Data base:** Julho 2026
**Responsável:** Jaelson Silva dos Santos

Este documento é o meu plano operativo para colocar o TegLion em produção com controlo, segurança e rollback pronto.

---

## 1. Pré-GO (eu valido antes de abrir tráfego)

- [ ] Eu confirmo que `npm run release:readiness` passou localmente sem falhas.
- [ ] Eu confirmo que `npm run tsc`, `npm run build` e `npm test` passaram no último commit.
- [ ] Eu confirmo que `npm run security:secrets` não encontrou credenciais expostas.
- [ ] Eu confirmo que as variáveis de produção estão no provider (Render/Vercel), não no Git.
- [ ] Eu confirmo que Stripe está em modo live com preços oficiais.
- [ ] Eu confirmo que DSN do Sentry do frontend está no Vercel (`VITE_SENTRY_DSN`).
- [ ] Eu confirmo que as telas críticas estão alinhadas com regras de role.

## 2. Segurança obrigatória (repositório público)

- [ ] Eu rodo rotação de chaves para qualquer segredo que tenha sido usado em ambiente não seguro.
- [ ] Eu removo valores reais de ficheiros locais antes de push.
- [ ] Eu verifico `.gitignore` e mantenho `.env*` fora do versionamento.
- [ ] Eu ativo branch protection em `main` e `staging` com CI obrigatório.

## 3. Deploy controlado

1. Eu faço deploy backend (Render) e verifico `/health` e `/api/public/health`.
2. Eu faço deploy frontend (Vercel) e verifico rotas públicas e privadas.
3. Eu executo smoke piloto contra ambiente alvo.
4. Eu monitorizo logs de erro (Sentry + provider logs) por 30 minutos.

## 3.1 Redis em produção

- [ ] Eu confirmo `REDIS_URL` configurada no backend de produção.
- [ ] Eu confirmo ausência de fallback in-memory nos logs.
- [ ] Eu valido limitação de requests em rota protegida.

Guia: [REDIS_RENDER_SETUP.md](./REDIS_RENDER_SETUP.md)

## 4. Gate funcional pós-deploy

- [ ] Eu faço registo de escritório.
- [ ] Eu crio cliente e envio convite por email.
- [ ] Eu valido login cliente e upload de documento.
- [ ] Eu valido mensagens escritório/cliente.
- [ ] Eu valido rota de billing/Stripe.
- [ ] Eu valido bloqueios de permissão para role sem acesso.

Plano de execução: [EXECUCAO_ROLES_TELAS.md](./EXECUCAO_ROLES_TELAS.md)

## 5. Rollback (se necessário)

1. Eu faço rollback frontend no Vercel para o deploy anterior estável.
2. Eu faço rollback backend no Render para o último release saudável.
3. Eu comunico incidente e causa raiz no runbook.

## 6. Definição de GO

Eu considero o GO aprovado quando:

- Todos os checks técnicos passaram.
- Fluxo crítico do piloto foi executado sem falha.
- Não existe erro crítico novo em produção.
- Plano de rollback está pronto e validado.
