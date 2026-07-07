# TegLion — Roadmap de Piloto

**Última actualização:** Julho 2026

## 1. Objetivo

Documento operativo para validar e conduzir o piloto do TegLion com escritórios de contabilidade.
Foca em:
- estabilidade de backend e frontend;
- segurança e isolamento multi-tenant;
- compatibilidade legada controlada;
- experiência mínima de utilizador necessária para vender e reter clientes;
- métricas e checklist de prontidão.

## 2. Estado atual do piloto

### Encontra-se estabilizado em:
- Auth cookie-based com refresh token e fallback Bearer apenas quando `ALLOW_BEARER_AUTH=true`.
- CSRF + CORS configurados no backend para SPA + origin allow list.
- Sentry integrado no backend (`backend/src/app.js`) e frontend (`frontend/src/shared/lib/sentry.ts`).
- Redis para rate limiting e pub/sub de sessões.
- Supabase como PostgreSQL + Storage; backend Express mantém lógica de negócios e convites.
- Google SSO em `firm_user_sso` para login de colaboradores.

### Principais riscos ativos
- `PRODUCT_MODE=contabil` exige bloqueio de rotas legadas; o middleware `backend/src/middlewares/legacy-teglion.middleware.js` já cobre o bloqueio com `410`.
- Compatibilidade legada de JWT (`clinicId` / `patientId`) deve permanecer apenas como fallback em `backend/src/utils/session-user.js`.
- Dependência do `REDIS_URL` e de segredos JWT para produção; sem eles, tokens, rate limit e sessão não são seguros.
- UX cliente/firm está funcional, mas precisa de confirmação através de um smoke test completo (registo → upload → aprovação).

## 3. Critérios de prontidão para piloto

### Segurança e confiança
- [ ] `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET` definidos e rotacionáveis.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` armazenada com acesso restrito.
- [ ] `REDIS_URL` presente em produção e não compartilhado com outros serviços não confiáveis.
- [ ] CSRF activo para todos os POST/PUT/PATCH/DELETE com exceções documentadas apenas para SPA internal.
- [ ] `CORS_ORIGINS` limito ao frontend oficial e ferramentas de QA autorizadas.
- [ ] Legacy routes bloqueadas em modo contabilidade.

### Estabilidade funcional
- [ ] Fluxo de onboarding de escritório estável.
- [ ] Convite de cliente e aceitação funcionam sem erro.
- [ ] Upload de documento do cliente criado e associado ao pedido correto.
- [ ] Sessão de cliente não conflita com sessão de escritório.
- [ ] Refresh token cookie rota sem perda de sessão.

### Operação
- [ ] `health` e/ou smoke endpoint disponível em staging e produção.
- [ ] Staging com dados de piloto e deploy separado.
- [ ] Documentação de ambiente atualizada.

### SaaS e métricas
- [ ] Trial → paid ratio medido.
- [ ] Uptime > 99.5% no período piloto.
- [ ] Incidentes P0 documentados e tratados.

## 4. Ações recomendadas de curto prazo

### P0 — Correções imediatas
- Confirmar e documentar `ALLOW_BEARER_AUTH` somente como fallback de compatibilidade.
- Verificar `legacy-teglion.middleware.js` em todos os deployments `PRODUCT_MODE=contabil`.
- Atualizar `docs/operations/STATUS.md` com o resultado do smoke test do piloto.
- Executar E2E básico: registo escritório → convite cliente → upload → marcação de obrigação.

### P1 — Qualidade de produto
- Revisar navegação cliente/firm para reduzir menus excessivos.
- Garantir feedback visual claro em upload de documento e estado de pedido.
- Adicionar capturas de tela baseline em `docs/qa/visual-baseline/screenshots/`.
- Validar o formulário de convite de cliente e o fluxo de aceitação.

### P2 — Segurança e infra
- Auditar `CORS_ORIGINS` e `FRONTEND_URL` para cada ambiente.
- Garantir headers de segurança e cache para frontend static assets.
- Implementar WAF/edge rate limiting Cloudflare ou equivalente.

## 5. Roadmap de implementação para o piloto

### Semana 1
- Smoke test completo do fluxo piloto.
- Validar bloqueio de rotas legadas e compatibilidade JWT.
- Atualizar documentações `docs/operations/STATUS.md` e `docs/operations/AUDIT_PRODU.md`.

### Semana 2
- Lançar staging de QA com dados reais e testes de cliente.
- Medir métricas de sucesso (uso portal, upload, tempo de resposta).
- Corrigir problemas críticos de UX no portal cliente.

### Semana 3
- Preparar checklist de produção: segredos, Redis, rota 404/410, Sentry, backups.
- Ter pelo menos um escritório piloto ativo e um caso de uso documentado.

### Semana 4
- Reunir feedback do piloto e priorizar ajustes imediatos.
- Validar readiness para vendas: trial → paid, NPS do piloto.

## 6. Notas de compatibilidade legada

- Legado `clinicId` / `patientId` deve ser mapeado para `firmId` / `clientId` apenas se não houver dados modernos.
- Código activo deve usar `firm` / `client` em vez de `clinic` / `patient` sempre que possível.
- Rotas antigas devem retornar `410 LEGACY_ROUTE_DISABLED` em modo contabilidade.

## 7. Onde atualizar depois de cada sprint

- `docs/operations/STATUS.md` — estado do projeto e prioridades.
- `docs/operations/AUDIT_PRODU.md` — tarefas de auditoria e QA.
- `docs/product/ROADMAP.md` — fase e alinhamento de produto.
- `docs/engineering/CODING_STANDARDS.md` — se houver mudanças de regra técnica.

## 8. Referências

- `backend/src/middlewares/legacy-teglion.middleware.js`
- `backend/src/utils/session-user.js`
- `backend/src/app.js`
- `frontend/src/shared/lib/sentry.ts`
- `docs/operations/STATUS.md`
- `docs/operations/AUDIT_PRODU.md`
