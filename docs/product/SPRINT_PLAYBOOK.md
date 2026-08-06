# Teglion — Sprint Playbook: Piloto → Comercial em Escala

**Criado:** 2026-08-06
**Para:** execução sequencial, sprint a sprint, do estado actual (1 escritório piloto real) até estar pronto para abrir vendas a milhares de escritórios com marketing forte.
**Regra de ouro, acima de qualquer sprint:** o escritório piloto está em produção com dados reais. Nenhum sprint pode arriscar esse sistema. Onde uma tarefa exigir tocar produção, isso está marcado explicitamente — o resto é seguro por construção (branch → staging → main, nunca directo).

Este documento é a camada tática que falta entre:
- [`docs/company/EVOLUTION_PLAN.md`](../company/EVOLUTION_PLAN.md) — o que faço amanhã (dias)
- **este Playbook** — o que faço nas próximas semanas, em sequência (sprints)
- [`docs/product/ROADMAP.md`](./ROADMAP.md) — visão de 5 anos (Fases 0–10)
- [`docs/product/SCALE_100K_1M_CHECKLIST.md`](./SCALE_100K_1M_CHECKLIST.md) — os 400 checkpoints de fundo (`F0-XX`, `F1-XX`, …)

Não inventa prioridades novas — sequencia o que já está escrito em `ROADMAP.md` Fase 1 ("Confiança para vender"), nos itens `P0` de `SCALE_100K_1M_CHECKLIST.md` Fase 0, e nos achados de segurança (`docs/security/AUDIT_2026-08-05.md`, `docs/security/SECURITY.md` e a auditoria de 2026-08-06 desta sessão).

---

## Iniciativa paralela: Domínio de Serviços & Captação

Pedido real da contadora piloto (2026-08-06): menu de captação para IRS anual (formulário com lógica condicional) e "Entregas Pontuais" (serviços avulsos), configurável por qualquer escritório — não hardcoded. Corre em paralelo aos sprints numerados acima (é trabalho de produto, não de infra/segurança), em fases próprias:

| Fase | Entrega | Estado (2026-08-06) |
|------|---------|------|
| **1 — Service Domain Foundation** | `accounting_services` estendida (`slug`, `is_publicly_listed`, `requires_booking`, `document_requirements`); tabelas `leads` e `service_inquiries`; resolução de identidade (NIF→email→Lead→novo Lead, sempre `firm_id` scoped); conversão Lead→Client manual e auditada; UI mínima (`/app/firm/leads`) | ✅ Código implementado em `feature/service-domain-foundation`, testado (72 testes backend + typecheck/build frontend verdes), **migration ainda não aplicada em produção** — aguarda aprovação explícita antes de correr |
| 2 — Dynamic Forms Engine | Motor de formulário com ramificação condicional (`visibleIf`), replicando a lógica real do formulário de IRS dela | Não iniciada |
| 3 — Document Requirements Resolution | Base do Service ∪ tags do Form → `document_requests` em lote + email automático (fim do processo manual de 48h dela) | Não iniciada |
| 4 — Public Service Intake | Página pública por serviço (`/:firmSlug/servicos/:serviceSlug`) | Não iniciada |
| 5 — Booking Integration | `ServiceInquiry.consultation_id` ligado ao motor de agendamento já existente | Não iniciada |
| 6 — Google Calendar | Sync bidirecional, `consultations` como fonte de verdade, `calendar_busy_blocks` para eventos externos | Não iniciada |
| 7 — Google Drive | Picker + download server-side validado, staff-only | Não iniciada |

**Achado importante da Fase 1:** já existia uma tabela/módulo `service_requests` em produção ("Central de Serviços" — pipeline de orçamento/pagamento `SUBMITTED→QUOTED→APPROVED→PAID→DONE→RATED` para clientes já existentes, com portal do cliente, comentários, PDF de orçamento). É uma ferramenta diferente e complementar — por isso o pivô novo desta iniciativa chama-se `service_inquiries` (fase de captação/Lead), não `service_requests`. Um Lead convertido pode, mais tarde, gerar um `service_requests` normal na Central de Serviços já existente para o pipeline de orçamento formal.

Documento de arquitectura completo (modelo de domínio, análise de ameaça, especificação técnica da Fase 1) ficou no plan file da sessão que fez este trabalho — não commitado no repositório (é um artefacto de planeamento, não de produto). Resumo vive aqui e em `docs/security/SECURITY.md` (secção Multi-tenant).

---

## 0. Antes do Sprint 1 — uma pergunta que bloqueia tudo

A auditoria de segurança de **2026-08-05** (`docs/security/AUDIT_2026-08-05.md`, ainda não commitada no repositório) encontrou como achado **Crítico**: `backend/.env` e `backend/.env.local` contêm segredos **live** de produção em texto simples numa máquina local (chave `service_role` do Supabase, `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`, `STRIPE_SECRET_KEY` live, `BREVO_API_KEY`, `GOOGLE_OAUTH_CLIENT_SECRET`, `REDIS_URL` com password, `VAPID_PRIVATE_KEY`). Esse relatório terminou a aguardar aprovação para rodar esses segredos — não encontrei confirmação de que a rotação aconteceu.

**Antes de avançar com qualquer sprint abaixo, confirme:**
1. Os segredos listados em `AUDIT_2026-08-05.md` (secção C1) já foram rodados nas consolas (Stripe, Supabase, Render, Google Cloud, Brevo, Redis)?
2. Se não — isso é a tarefa nº1, antes de tudo o resto. Rodar `JWT_*_SECRET` invalida sessões activas (esperado); `DATA_ENCRYPTION_KEY` precisa de plano de reencriptação, não pode ser rodada às cegas.

Isto não bloqueia os Sprints 1–2 tecnicamente, mas é o item de maior risco real hoje — deve correr em paralelo, o mais cedo possível, feito directamente por si nas consolas (não é algo que um agente de IA deva ou possa fazer).

---

## Sprint 0 — Fechar a auditoria de segurança (3–5 dias, já em curso)

**Objectivo:** os achados Médios da auditoria de 2026-08-06 corrigidos e verificados, sem tocar produção sem passar por staging.

### Já feito nesta sessão (local, não commitado, não deployado)
- [x] Heurística morta em `tenant-isolation-test.js` (`staticAudit()`) — agora deteta e avisa sobre `.eq('id', …)` sem `firm_id`/`client_id` na mesma cadeia. Rodei-a: 17 candidatos encontrados, os mais relevantes (`firm-users.repository.js` `updateFirmUserSso`/`updateFirmUserAuth`) verificados manualmente como seguros (o `id` vem sempre do próprio actor autenticado, nunca de input externo). Os restantes 15 ficam para revisão humana quando conveniente — a lista completa fica no output do script.
- [x] Alerta Sentry activo quando o Redis do rate-limit cai em produção (`rate-limit-store.js`) — antes só havia log passivo.
- [x] `'unsafe-inline'` removido do CSP do backend (`app.js`) — confirmado que o backend nunca serve HTML com script inline (só JSON + streaming binário de documentos).

### Falta
- [ ] Rever o diff (`git diff backend/`), testar em `staging` primeiro (nunca directo a `main`), depois seguir o fluxo normal `staging → main` de [`BRANCHING.md`](../operations/BRANCHING.md).
- [ ] Confirmar manualmente no Render/Vercel que `COOKIE_SECURE=true`, `COOKIE_SAMESITE=none`, `CORS_ORIGINS` exactos e todos os segredos obrigatórios estão configurados lá — e que **não** são os mesmos valores hoje no `.env.local` local (item não verificável localmente, do `AUDIT_2026-08-05.md`).
- [ ] Decisão sobre dados legados de um produto anterior (clínica/"SaaSude") possivelmente ainda na base — purgar ou justificar retenção (achado desta sessão, RGPD).
- [ ] O achado mais sério que já está documentado e **não corrigido** (`SCALE_100K_1M_CHECKLIST.md` F0-20): 7 funções `SECURITY DEFINER` (`current_firm_id`, `is_firm_staff`, `rls_auto_enable`, entre outras) expostas via RPC público (`anon`/`authenticated`) no Supabase. Isto não foi tocado nesta sessão — precisa de revisão dedicada com acesso aos advisors do Supabase, idealmente já com staging isolado (Sprint 1) para testar a correcção sem risco.

**Cuidado de produção:** nenhuma tarefa deste sprint escreve na base de dados partilhada. As alterações de código já feitas foram verificadas com testes que não tocam Supabase (`test:security-static`, teste unitário isolado de `rate-limit-store`). **Não** correr `npm run test:tenant-isolation`, `npm run smoke:pilot`, `npm run release:gate` ou `npm run release:readiness` localmente nem em CI ainda — todos escrevem na única base Supabase existente, que é a de produção (ver Sprint 1).

---

## Sprint 1 — Ambiente de staging isolado (2 semanas) — desbloqueia tudo o resto

Hoje `local`, `staging` e `produção` apontam para o **mesmo** projecto Supabase (`SCALE_100K_1M_CHECKLIST.md` F0-03, confirmado). Isto é a razão pela qual `test:tenant-isolation` e `release:readiness` não correm em CI — correriam contra dados reais. Este sprint é o bloqueador crítico: enquanto não existir staging isolado, toda automação de teste fica manual e arriscada.

**Objectivo:** um segundo projecto Supabase, só para staging, com o pipeline `staging → main` a bloquear merges sem os checks verdes.

### Tarefas
- [ ] Criar projecto Supabase novo dedicado a staging (`F0-03`) — decisão/custo seu, não posso criar por si.
- [ ] Aplicar `supabase/schema.sql`, `tables.sql`, `rls.sql`, `policies.sql` + todas as migrations nesse projecto novo (mesmo processo manual documentado em `20260701000000_initial_contabil.sql` — aproveitar para finalmente formalizar isto como uma migration real e versionada, não só ficheiros soltos).
- [ ] Configurar `teglion-api-staging` no Render e projecto Vercel de staging apontando para o Supabase novo (`DEPLOY_STAGING.md` já documenta o passo a passo).
- [ ] Branch protection real no GitHub para `main` (`F0-01`, `F0-02`): PR obrigatório, status checks obrigatórios, review obrigatório — hoje só documentado, não activado nas Settings do repositório.
- [ ] **Só depois** disto existir: adicionar `test:tenant-isolation` como step de CI (gate em PRs que tocam `backend/src/db/**` ou `backend/src/modules/**`), usando as credenciais do Supabase de **staging** como GitHub Secret dedicado — nunca as de produção.
- [ ] Automatizar `release:readiness` completo (inclui `pilot-smoke-e2e`, `runbook-incident-drill`) a correr contra staging antes de qualquer promoção para `main`.

**Cuidado de produção:** este sprint é sobre construir um ambiente **paralelo**, não sobre mudar produção. O único ponto de atenção é não confundir credenciais — nunca copiar `SUPABASE_SERVICE_ROLE_KEY`/`JWT_*_SECRET` de produção para o novo projecto staging (regra já escrita em `BRANCHING.md`: "Nunca reutilizar `JWT_*_SECRET` nem `SERVICE_ROLE_KEY` entre ambientes").

### Critério de saída
- `npm run test:tenant-isolation` corre automaticamente em CI contra staging, em modo estrito, sem escrever nada em produção.
- Um PR com uma query sem `firm_id` falha o CI antes de chegar a `main`.

---

## Sprint 2 — Fechar o comercial mínimo (2 semanas, pode correr em paralelo ao Sprint 1)

Isto é literalmente a "Fase B" já escrita em `EVOLUTION_PLAN.md` — sem isto, não há como cobrar a sério de ninguém, piloto ou cliente novo.

**Objectivo:** sair de Stripe test mode; e-mail transaccional a chegar de forma confiável.

### Tarefas
- [ ] Stripe: criar produto + preços 35,00 €/mês e 359,88 €/ano em modo live; copiar os Price IDs para o Render (`STRIPE_SETUP.md`).
- [ ] Brevo: autenticar domínio (SPF/DKIM/DMARC) para deliverability real (`BREVO_DOMAIN_SETUP.md`).
- [ ] Smoke manual completo: registo escritório → trial 14 dias → checkout com cartão de teste → cartão real uma vez em staging.
- [ ] Validar com o escritório piloto: pedido de documento até "Concluído" + obrigação com e-mail ao cliente a chegar.

**Cuidado de produção:** trocar de Stripe test → live é uma mudança real em produção (afecta cobrança). Fazer isto **depois** de validar em staging (Sprint 1), com o webhook secret de produção configurado e testado antes de activar publicamente. Não activar cobrança live no escritório piloto sem avisá-lo antes — ele já está a operar em confiança.

### Critério de saída
- Um cartão real consegue completar um checkout e a assinatura aparece correcta no Stripe Dashboard e no Teglion.
- `STATUS.md` linha "Stripe live: ⬜ Test mode" passa a `✅`.

---

## Sprint 3 — Observabilidade e resiliência mínima (2 semanas)

Antes de abrir a porta a mais escritórios, é preciso saber quando algo parte — hoje isso é quase todo manual/reactivo.

### Tarefas
- [ ] Monitorização de uptime externa com alerta imediato (UptimeRobot, Better Stack ou equivalente) — `F0-11`, hoje inexistente.
- [ ] Dashboard operacional básico (não o dashboard de produto do cliente) para founder/engenharia acompanhar erros, latência, uso — `F0-22`.
- [ ] Capturar baseline real de performance e taxa de erro a partir do Sentry/logs actuais (SLOs já definidos em `PERFORMANCE_CHARTER.md`, falta só o número real de hoje) — `F0-16`.
- [ ] Confirmar plano de backup/PITR do Supabase no Dashboard → Settings → Database, e fazer **um** teste de restore real (nunca foi feito) — `F0-04`.
- [ ] Redis: confirmar que está sempre activo em produção (já mitigado parcialmente pelo alerta Sentry do Sprint 0) — meta é reduzir janelas de fail-open, não eliminá-las (fail-open continua a decisão correcta para não derrubar o serviço).

**Cuidado de produção:** o teste de restore de backup deve ser feito para um projecto Supabase **separado** (ideal: o de staging do Sprint 1), nunca restaurando por cima da base de produção viva.

### Critério de saída
- Um incidente de indisponibilidade é detectado por alerta automático em menos de 5 minutos, não por o escritório piloto reportar.
- Existe um número real (não estimado) de p95 de API e uptime dos últimos 30 dias.

---

## Sprint 4 — Segurança de borda + validação externa (2–3 semanas)

Este é o sprint que dá confiança para escalar tráfego de marketing sem se preocupar com abuso/scraping/ataques.

### Tarefas
- [ ] WAF na borda (Cloudflare) com regras OWASP básicas e protecção anti-bot — `F0-09`, hoje inexistente.
- [ ] Pentest externo, corrigir achados críticos/altos antes de qualquer campanha de aquisição paga — `F0-21`.
- [ ] Revisão dedicada do achado `F0-20` (funções `SECURITY DEFINER` expostas via RPC público no Supabase, tabelas com RLS sem política) — com o staging do Sprint 1 já disponível para testar a correcção sem risco em produção.
- [ ] Formalizar política de rotação periódica de segredos (trimestral, ou imediata após qualquer suspeita) — hoje reactiva, não agendada.

**Cuidado de produção:** mudanças de permissões/RLS no Supabase (F0-20) só devem ser aplicadas primeiro em staging, validadas com o teste de isolamento tenant, e só depois replicadas em produção — nunca directo.

### Critério de saída
- Pentest concluído, zero achado crítico/alto em aberto.
- WAF activo e a bloquear tráfego malicioso mensurável.

---

## Sprint 5 — Motor de vendas: a parte "marketing forte" (2–3 semanas)

Só faz sentido investir em aquisição paga depois dos Sprints 0–4 — caso contrário está a comprar tráfego para um sistema sem rede de segurança.

### Tarefas
- [ ] Landing v2: vídeo de 90s + calculadora de ROI (`ROADMAP.md` 1.12).
- [ ] 10 testemunhos em vídeo + 3 case studies reais do escritório piloto (`ROADMAP.md` 1.11) — precisa do piloto satisfeito e disposto a aparecer.
- [ ] Manter cadência do blog SEO (já tem 27 artigos publicados) — conteúdo fiscal PT contínuo.
- [ ] Página de preços com comparativo claro vs. alternativas (Excel/WhatsApp/concorrentes).

### Critério de saída
- Landing converte visitante → trial a uma taxa mensurável (definir baseline antes de investir em ads).
- Pelo menos 3 case studies publicáveis.

---

## Sprint 6 — Onboarding self-serve sem fricção (2 semanas)

Sem isto, cada escritório novo precisa de ajuda manual sua para começar — não escala.

### Tarefas
- [ ] Assistente de onboarding do escritório em 3–5 passos (`ROADMAP.md` 2.3).
- [ ] E2E automatizado do fluxo completo: registo → cliente → pedido documento → upload → obrigação (`ROADMAP.md` 1.8) — correr em staging (Sprint 1).
- [ ] Fechar os "god files" mais críticos que ainda tornam mudanças arriscadas (`ROADMAP.md` 1.10, parcial — não é bloqueante, mas reduz risco de regressão à medida que o ritmo de mudança acelera).

### Critério de saída
- Um escritório novo completa sozinho, sem suporte, o fluxo registo → 1º cliente → 1º pedido de documento em menos de 15 minutos (meta já definida em `ROADMAP.md` Fase 2).

---

## Sprint 7 em diante — Abrir para vender, escalar com dados

A partir daqui deixa de ser uma lista fixa de sprints e passa a ser o ciclo normal do `ROADMAP.md` Fase 1 (e depois Fase 2/3), guiado pelos critérios de saída já definidos lá:

- 100+ escritórios registados; 50+ pagantes
- Uptime 99.5%; zero incidentes P0
- Tenant isolation + security audit aprovados (Sprints 0–1 acima)
- Trial → paid > 25%
- NPS piloto > 35

Só depois de bater estes números é que faz sentido escalar investimento em ads (`ROADMAP.md` 3.12, €5–10k/mês) — antes disso, qualquer euro em aquisição paga está a testar um funil que ainda não se sabe se converte.

---

## Como usar este documento

- Um sprint = ~2 semanas, mas ajuste à sua capacidade real (é founder + engenharia, não uma equipa de 10).
- Sprints 0–1 podem sobrepor-se com Sprint 2 (segurança/infra vs. comercial não competem pelo mesmo trabalho).
- Antes de cada sprint, reveja a secção correspondente em `SCALE_100K_1M_CHECKLIST.md` para os itens `F0-XX`/`F1-XX` detalhados — este Playbook só dá a sequência e o porquê, o checklist mestre tem o detalhe item a item.
- Depois de cada sprint, actualize `docs/operations/STATUS.md` (fonte de verdade do estado técnico) e `docs/company/EVOLUTION_PLAN.md` (bússola do dia a dia) — este Playbook não substitui nenhum dos dois, é a ponte entre eles.
