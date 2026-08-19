# Fase 1C — Onboarding + Dashboard + Empty States + UX Copy

> **Arquivado em 19/08/2026.** O conteúdo deste documento foi absorvido pelo roadmap único e vivo em `docs/ROADMAP.md`. Este arquivo fica preservado como registro histórico — não é mais fonte de verdade sobre prioridades atuais.

**Branch:** `feature/fase-1`  
**Ambiente:** staging only — sem produção / sem merge para `main`.  
**STATUS:** **CLOSED** (implementação + testes automáticos; browser live recomendado em staging UAT)

---

## Objectivo

Conduzir o Tenant Owner do «escritório criado» ao primeiro valor (página pública + serviço publicado + pedidos), sem nova arquitectura visual e sem LLM.

---

## Auditoria inicial (resumo)

### A. Problemas encontrados
- Onboarding marcava página pública como concluída só com slug ≠ `escritorio` (sem `publishedAt`).
- Faltavam passos de **serviço publicado** e **booking** (opcional); obrigação era caminho pouco alinhado com aquisição.
- Dashboard era KPI-first, sem «próximo passo» dinâmico.
- URL pública pouco clara no painel.
- Empty states ad-hoc (`cb-dash-empty`, `cb-empty-state`) em vários módulos.
- Regras de progresso não partilhadas entre onboarding e dashboard.

### B. Arquivos envolvidos (principais)
- `FirmOnboardingWizard.tsx`
- `FirmDashboardPage.tsx`
- `ServicesCatalogWorkspace.tsx`, `FirmIrsPage.tsx`
- Alerts / News / Documents empty surfaces
- Maya (`MayaAssistant`, intents estáticos)

### C. Componentes reutilizados
- Design System 1B: `Button`, `Card`, `PageHeader`, `EmptyState`, `Progress`, `Chip`, `Skeleton`
- APIs existentes: public-site, accounting-services, booking-settings, clients, inquiries
- Maya v1 estática + `openMaya(intentId)` via CustomEvent

### D. Mudanças propostas (executadas)
1. Helper `computeFirmProgress` + hook `useFirmProgress`
2. Onboarding alinhado ao estado real
3. Dashboard: saudação → próximo passo → URL pública → KPIs → actividade
4. Empty states críticos com quê / porquê / CTA
5. Copy PT-PT concreta; IRS sem prometer cálculo

### E. Riscos
- Queries extra no dashboard (mitigado com staleTime / react-query)
- Confundir «serviço criado» com «publicado no site» (regra: `isPubliclyListed`)
- Não inventar progresso falso (invite/booking opcionais)

### F. Ordem de implementação
Helper → onboarding → dashboard → empties → Maya open → testes → docs

---

## Alterações

### Progresso partilhado
- `frontend/src/features/firm/onboarding/firmProgress.ts`
- `frontend/src/features/firm/onboarding/useFirmProgress.ts`
- `frontend/src/features/firm/onboarding/firmProgress.test.ts`

Passos essenciais: perfil (logo) → página publicada → serviço público → cliente.  
Opcionais: booking, convite portal.

### Onboarding
- Texto: «Acabou de criar o escritório. O que fazer agora?»
- Progresso só com dados reais (`publishedAt`, `isPubliclyListed`, portal real)
- Bloco URL: ver / copiar / configurar + estado publicado

### Dashboard
- Hierarquia: saudação → `FirmNextStepCard` → `FirmPublicUrlCard` → 4 KPIs → painéis
- CTA Maya «Precisa de ajuda?» abre intent contextual (estático)
- Empty states nos painéis com `EmptyState` oficial

### Empty states / copy
- Serviços, IRS, Alertas, Notícias, Pedidos de documentos, Ficheiros
- IRS: captação/campanha; não calcula imposto

### Maya
- Continua 100% estática
- `openMaya()` — sem LLM / sem APIs de negócio

---

## Decisões UX
- Página pública «concluída» = slug válido **e** `publishedAt`
- Serviço «concluído» = `isPubliclyListed` (activo)
- Booking e invite não bloqueiam % dos passos essenciais
- «Marcar como concluído» apenas oculta o guia (`onboardingCompleted`), não inventa ticks

---

## Testes

| Suite | Resultado |
|-------|-----------|
| TypeScript (`tsc --noEmit`) | PASS |
| Vitest frontend | **33/33** PASS (incl. 5 `firmProgress`) |
| Backend tests (security pattern run) | PASS |
| Vite build + PWA + prerender | PASS |

---

## QA

| Item | Estado |
|------|--------|
| Desktop estrutura | PASS (código + build) |
| Mobile não regredido (estrutura) | PASS — cards empilham; FAB Maya intacto |
| Browser live 1440/1280/1024/768/430/390 | **Recomendado em staging UAT** (tooling browser não executado nesta sessão) |

---

## Limitações / deferred
- Redesign profundo IRS/Serviços → **Fase 1D**
- Tablet rail → **Fase 1E**
- Empty states residuais em tabelas de tarefas/agenda mês
- Contagem exacta de inquiries `NEW` depende do filtro backend
- Live Visual QA em staging

---

## Critério de conclusão

- [x] onboarding reflecte estado real
- [x] próximo passo no Dashboard
- [x] Empty States críticos padronizados
- [x] copy PT-PT revista nas superfícies alteradas
- [x] página pública compreensível (ver/copiar/configurar)
- [x] IRS com contexto correcto
- [x] serviços com orientação clara
- [x] Maya estática e segura
- [x] Design System único
- [x] TS / Vitest / backend / build / PWA
- [x] documentação
- [x] sem merge para `main` / produção intacta
- [ ] browser QA live (deferred UAT staging)

---

## Próximo passo: Fase 1D

Aprofundar fluxo **criar → configurar → publicar → receber pedido** em Serviços e IRS (editores, publicação, pedidos), sem alterar segurança/tenant.
