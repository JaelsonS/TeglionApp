# TegLion — Estado do projecto

**Última actualização:** 17 Julho 2026

Este documento é a minha fonte de verdade: onde estou, o que já validei e o que preciso fazer a seguir.

**Plano de evolução:** [../company/EVOLUTION_PLAN.md](../company/EVOLUTION_PLAN.md)  
**Performance:** [../company/PERFORMANCE_CHARTER.md](../company/PERFORMANCE_CHARTER.md)  
**Limpeza de docs:** [../company/DOC_CLEANUP.md](../company/DOC_CLEANUP.md)

---

## 1. O que é isto

SaaS B2B multi-tenant para **escritórios de contabilidade**: o escritório gere clientes, documentos, prazos e comunicação; o cliente tem portal próprio.

> Fecha o mês sem caçar documentos no WhatsApp — um sistema para o escritório e um portal para o cliente.

---

## 2. Estado actual (Jul 2026)

### Veredicto

Eu tenho **piloto vendável**. Fase 1 e 2 fechadas no essencial; Fase 3 (robustez) em curso.
Já validei build, testes, tenant isolation, smoke piloto e E2E smoke.

**Posso vender?** Sim, a early customers — com trial de 14 dias.  
**Ainda preciso** antes de cobrar a sério: Price IDs Stripe no Render, DNS Brevo, smoke signup → checkout.

### Status de testes recentes

- **Frontend unitário**: `npm test` ✅ 2/2
- **Frontend build**: `npm run build:spa` ✅
- **Backend unitário**: `npm run test:unit` ✅ 4/4
- **Backend tenant isolation**: ✅ aprovado com avisos
- **Backend security audit**: ✅ aprovado com 1 aviso
- **Backend pilot smoke**: ✅ 6/6 OK
- **Frontend Playwright E2E smoke**: ✅ 5/5

### Stack (híbrido — decisão mantida)

| Camada | Tecnologia | Papel |
|--------|------------|-------|
| Frontend | React 19 + Vite + TS | SPA, blog prerender, PWA |
| **Backend** | Node/Express | Lógica de negócio, auth, integrações |
| Base de dados | Supabase PostgreSQL | Dados + RLS |
| Ficheiros | Supabase Storage | Documentos, logos |
| Email | Brevo API | Convites, lembretes, reset password |
| Pagamentos | Stripe | Subscrição live |
| Cache/rate limit | Redis | Protecção API |
| Deploy | Vercel (FE) + Render (BE) | Produção |

> **Não migrar para «só Supabase».** O backend já usa Supabase como BD/Storage; eliminá-lo obrigaria a reescrever auth, schedulers, email, billing e validações — mais lento e mais arriscado que o estado actual. Ver [CRONOGRAMA.md](../_archive/operations/CRONOGRAMA.md#decisão-arquitectural-manter-backend-express).

### O que está pronto

| Área | Detalhe |
|------|---------|
| **Auth** | Registo escritório, login firm/client, convite, recover/reset, cookies httpOnly, Google SSO |
| **Documentos** | Pedidos, upload, validação magic bytes, histórico, storage Supabase |
| **Comunicação** | Mensagens escritório ↔ cliente |
| **Operacional** | Tarefas, obrigações, agenda, calendário fiscal PT |
| **Portal cliente** | Dashboard, alertas, notícias, booking — navegação completa (sidebar + mobile) |
| **Marketing** | Landing, pricing, security, blog SEO (27 artigos) |
| **Segurança** | Multi-tenant, RLS, rate limit, CSRF, tenant isolation test |
| **CI** | Build + `tsc --noEmit` + testes unitários |
| **Documentação** | 13 docs CTO + pastas temáticas + cronograma |

### Atualizações recentes validadas (Jul 2026)

- Obrigações: detalhe aberto em popup (modal) com scroll interno funcional
- Obrigações: hidratação de detalhe com payload completo do endpoint de timeline
- Agenda: bloqueio de submissão concorrente no frontend
- Agenda: deduplicação de criação no backend para evitar eventos repetidos
- Agenda: botões laterais ("Ver todas", "Ver toda a equipa") agora executam ações reais

### Limpeza Fase 1 — concluído (Jul 2026)

| Etapa | Resumo |
|-------|--------|
| 1.1–1.2 | Docs duplicadas removidas; estrutura `docs/product|engineering|…` |
| 1.3 | FE: MetricCard, PageShell, legacy-print, pacotes npm mortos, button.tsx |
| 1.4 | Auth fantasma, BlogAdSense, AppRouter, activity API órfã |
| 1.5 | Permissões `FIRM_*`; removidos login-clinic/patient API |
| 1.6 | Domínio clínica/paciente eliminado; papéis JWT `CLIENT`/`FIRM_*` |
| 1.7 | Nav portal cliente (alertas, notícias, booking) |
| 1.8 | Case-studies linkado no footer |
| 1.2 (deps) | Pacotes npm órfãos removidos (`@dnd-kit/sortable`, `libphonenumber-js`) |
| 1.9–1.10 | Stripe live + QA mobile/tablet |
| Piloto | Escritório real em uso diário |

### Fase 2 — concluída (Jul 2026)

| Entrega | Resumo |
|---------|--------|
| 2.1 | `api.ts` → 75 linhas; `services/http/*` |
| 2.2 | `repositories/contabil/*` por domínio |
| 2.3 | `routes/contabil/*` modular |
| 2.6–2.8 | CountryConfig, `/api/v1`, monorepo root |
| Extra | Playwright E2E smoke, Stripe idempotência, CI file-size gate |

Histórico completo: [CHANGELOG.md](../product/CHANGELOG.md)

### O que falta (Fase 3 — aberto)

| Item | Prioridade |
|------|------------|
| God files restantes (>400 linhas) | Alta |
| Migrar `contabilPt` → `useTranslation('contabil')` | Média |
| Testes E2E fluxo piloto (registo → upload) | Alta |
| Tenant isolation obrigatório em PR | Média |

### O meu foco imediato para robustez

1. Fechar regras de role por tela e por endpoint
2. Manter Redis activo em produção sem fallback
3. Travar promoção para `main` sem checklist de GO
4. Consolidar documentação operacional para execução sem dúvida

Plano operacional ligado a este foco:

- [EXECUCAO_ROLES_TELAS.md](./EXECUCAO_ROLES_TELAS.md)
- [REDIS_RENDER_SETUP.md](./REDIS_RENDER_SETUP.md)
- [GO_PRODUCTION.md](./GO_PRODUCTION.md)

### Métricas de qualidade (Jul 2026)

| Verificação | Estado |
|-------------|--------|
| `tsc --noEmit` (frontend) | ✅ |
| `npm run test` (frontend) | ✅ 2/2 |
| `npm run build:spa` | ✅ |
| `npm run test:unit` (backend) | ✅ |
| `npm run test:tenant-isolation` | ✅ aprovado com avisos |
| `npm run test:security-static` | ✅ aprovado com 1 aviso |
| `npm run smoke:pilot` | ✅ 6/6 |
| Testes E2E Playwright smoke | ✅ 5/5 |
| Itens 🔴 em MODULES.md | ✅ Zero |
| Stripe live | ⬜ Test mode |

## 2.1 Preços (o que vendemos)

| Plano | O que mostramos | Cobrança |
|------|-----------------|----------|
| **Anual** | 29,99 €/mês (equiv.) | **359,88 €** por ano |
| **Mensal** | 35,00 €/mês | **35,00 €** por mês |
| **Teste** | 14 dias grátis | Sem cartão |

Estes números têm de ser iguais no site, na app (Plano) e nos dois Price IDs da Stripe.  
Guia passo a passo: [STRIPE_SETUP.md](./STRIPE_SETUP.md).

Stripe live ainda em **test mode** até colocares as chaves e os dois preços no Render.

## 2.2 Preparação para 100.000 clientes activos

Backlog executivo para escala:

1. Filas assíncronas obrigatórias para tarefas pesadas (email/notificação/processamento)
2. Observabilidade fim-a-fim com SLOs por serviço e alertas ativos
3. Estratégia de escalabilidade de banco (índices, partição lógica e auditoria de queries lentas)
4. Gate de release obrigatório com tenant isolation e smoke de produção
5. DR/BCP com testes periódicos de recuperação
6. Hardening de segurança de borda (WAF, rate limits avançados, proteção bot)

Checklist mestre de execução: [SCALE_100K_1M_CHECKLIST.md](../product/SCALE_100K_1M_CHECKLIST.md)

---

## 3. Piloto no escritório

### Fluxo mínimo validado

```
Registo escritório → Criar cliente → Convite email (Brevo)
→ Cliente aceita → Upload documento → Escritório valida
→ Mensagem / tarefa / obrigação
```

### Smoke test infra

```bash
cd backend && npm run smoke:pilot
```

### Critérios de sucesso do piloto

- [ ] Escritório usa pedidos de documentos sem voltar ao email para o mesmo ficheiro
- [ ] Clientes conseguem enviar documentos sem suporte telefónico
- [ ] Prazos fiscais visíveis no calendário
- [ ] Feedback documentado semanalmente

---

## 4. O que faço a seguir

1. **Stripe** — eu crio o produto + preços 35 €/mês e 359,88 €/ano e meto os Price IDs no Render ([STRIPE_SETUP.md](./STRIPE_SETUP.md))
2. **Brevo** — eu autentico o domínio ([BREVO_DOMAIN_SETUP.md](./BREVO_DOMAIN_SETUP.md))
3. **Piloto** — eu valido o fluxo com a contadora
4. Redis / WAF — só quando o tráfego justificar

Norte diário: [../company/EVOLUTION_PLAN.md](../company/EVOLUTION_PLAN.md)  
(Histórico longo do cronograma: [../_archive/operations/CRONOGRAMA.md](../_archive/operations/CRONOGRAMA.md))

---

## 5. Roadmap de evolução (resumo)

| Fase | Nome | Estado |
|------|------|--------|
| **1** | Limpeza | 🟡 ~60% |
| 2 | Arquitectura | ⬜ |
| 3 | Padronização | ⬜ |
| 4 | Internacionalização PT+BR | ⬜ |
| 5 | IA | ⬜ |
| 6 | Automações | ⬜ |
| 7 | Escalabilidade | ⬜ |
| 8 | Lançamento comercial | ⬜ |

Plano completo: [ROADMAP.md](../product/ROADMAP.md)

---

## 6. Decisões arquitecturais relevantes

| Decisão | Razão |
|---------|-------|
| **Manter backend Express** | ~80 módulos de negócio; auth multi-tenant; Brevo/Stripe/cron; migrar = rewrite de meses |
| **Supabase = BD + Storage** | PostgreSQL gerido, RLS, buckets — não substitui camada de aplicação |
| Auth custom (não Supabase Auth) | `firm_users` + `clients` + convites com controlo total |
| Email via Brevo | Templates, deliverability, SMS futuro |
| Blog em TypeScript | Prerender no build; sem CMS no piloto |
| Monólito modular | Simplicidade > microserviços prematuros |

---

## 7. Variáveis de ambiente críticas (produção)

| Variável | Serviço |
|----------|---------|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Backend |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Backend |
| `BREVO_API_KEY`, `FROM_EMAIL` | Backend |
| `FRONTEND_URL`, `CORS_ORIGINS` | Backend |
| `REDIS_URL` | Backend (rate limits) |
| `VITE_API_URL` | Frontend (Vercel) |

Lista completa: [DEPLOY_PRODUCTION.md](./DEPLOY_PRODUCTION.md)

---

## 8. Histórico de marcos

| Data | Marco |
|------|-------|
| 2025–2026 | Migração stack React + Express + Supabase |
| Jun 2026 | Redesign corporate + portal cliente premium |
| Jun 2026 | Blog SEO: 27 artigos, prerender |
| Jul 2026 | Documentação CTO + auditoria (nota 7.0/10) |
| Jul 2026 | Fase 1 limpeza: etapas 1.1–1.6 concluídas |
| Jul 2026 | Domínio clínica/paciente removido do código activo |
