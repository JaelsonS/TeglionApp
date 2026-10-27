# Prontidão comercial — soft launch 29/10/2026

**Objectivo:** 20–50 gabinetes na 1.ª semana · dezenas de users concurrentes.  
**Não:** campanha ads/viral no dia D.  
**Regra:** nada experimental em `main` no dia da divulgação.

## Checklist P0 (ops)

| # | Item | Como verificar | Estado (27 Out) |
|---|------|----------------|-----------------|
| 1 | API prod healthy | `GET https://www.teglion.com/api/health` → 200 | **OK** (~0,9s pós-redeploy Redis) |
| 2 | SPA registo/login | `/auth/firm/register` + `/auth/firm/login` → 200 | **OK** |
| 3 | Staging health burst | 20× paralelo `/api/health` | **OK** 20/20 |
| 4 | Redis prod | Render `REDIS_URL` → Upstash `teglion-prod` (`rediss://`); logs com store partilhado | **OK** 27 Out 11:39Z — `[rate-limit] Redis verificado — store partilhado activo.` |
| 5 | Plano Render API | ≥ 1 CPU / 2 GB; sem free spin-down | **CONFIRMAR no dashboard** |
| 6 | Brevo email | 1 e-mail transacional de teste (registo ou notify) | **CONFIRMAR** dry-run |
| 7 | SMS Brevo | Soft-fail no notify (código em staging) | Código OK em staging; **promover a main** antes do dia D |
| 8 | Turnstile | 1 registo + 1 login reais em teglion.com | Páginas 200; **dry-run humano** |
| 9 | Storage DOCX | Bucket + normalização MIME `.docx` | Bucket OK; normalização em staging → **promover a main** |
| 10 | Plantão 29/10 | Pessoa + Sentry + Render + `/app/ops` | **Definir nome** |

### Redis — fechado (27 Out)

- Upstash: `teglion-prod` · AWS EU-CENTRAL-1 · Free  
- Render redeploy: store ligado + verificado + partilhado  
- Sentry TEGLION-APP-Q: último evento **23 Out** (NOSCRIPT/EVAL) — monitorizar; se voltar, não ligar 2.ª instância

### Plantão 29/10 (preencher)

- Responsável técnico: _______________
- Canal suporte contabilista: _______________
- Backup: _______________

## Release antes do dia D (obrigatório)

Em **staging** (não ainda em `main` a 27 Out ~11:40Z):

1. Soft-fail SMS no notify (TEGLION-APP-V)  
2. Normalização MIME DOCX no upload de pedidos (TEGLION-APP-Y)  
3. Docs GTM + load drill  
4. Control Center onda 3 denylist (migration `ip_denylist`) — só após migration aplicada em **prod**

**Acção:** PR `staging` → `main` **antes** de 29/10 (idealmente 27–28 Out). **No dia D:** zero merges de risco.

## Resultado load drill staging (27 Out 2026)

Comando: `cd backend && node scripts/load-drill-staging.js`

| Métrica | Valor |
|---------|--------|
| Health 40 pedidos (2×20) | 40/40 × 200 · 0×5xx |
| p95 round 1 (frio) | ~2,7s (cold start Render) |
| p95 round 2 (quente) | ~1,0s |
| login/register/csrf ×10 | 0×5xx |

**RESULT:** `PASS_WITH_COLD_START` — aceitável para soft launch; no dia D fazer warm-up health antes do pico.

## Critério GO

- [x] Redis verde (logs 27 Out)
- [x] Drill staging documentado OK (`PASS_WITH_COLD_START`)
- [ ] **Release staging→main** (SMS soft-fail + DOCX MIME ± denylist)
- [ ] Dry-run registo+Turnstile+email em prod
- [ ] Plantão nomeado
- [ ] Contabilista alinhada ([brief](./GTM_SOFT_LAUNCH_BRIEF_CONTABILISTA.md))
- [ ] Plano Render ≥1c/2g confirmado

**NO-GO** → adiar divulgação geral 3–7 dias **ou** lista fechada de escritórios.

## Runbook dia D (29/10)

**Manhã (antes da divulgação)**

1. `curl https://www.teglion.com/api/health` (warm-up; repetir 5×).  
2. Abrir Sentry (prod) + Render logs API.  
3. Confirmar plantão online (WhatsApp/telefone).  
4. **Não** fazer deploy / merge / migration no dia, salvo hotfix crítico acordado.

**Durante**

- Meta: lista prioritária de escritórios; se rate-limit no mesmo Wi‑Fi → dados móveis / 15 min (ver brief).  
- Alerta Sentry Redis / 5xx → pausar novos convites; não escalar instâncias sem Redis verde.

**NO-GO imediato no dia**

- Redis a cair para memória de forma recorrente  
- Health 5xx sustentado  
- Brevo/email a falhar no registo  
→ comunicar adiamento / lista fechada; sem improvisar scale-out

## Pós 29/10

| Fase | Volume | Acção |
|------|--------|--------|
| Semana 1 | ≤50 firms | Sentry + tickets |
| Semana 2–4 | 50–150 | 2ª instância **só** com Redis OK |
| Mês 2+ | 150+ | pooling Supabase se preciso; billing Stripe |

## Relacionado

- Brief contabilista: [GTM_SOFT_LAUNCH_BRIEF_CONTABILISTA.md](./GTM_SOFT_LAUNCH_BRIEF_CONTABILISTA.md)  
- Charter Center: `docs/product/TEGLION_CONTROL_CENTER_CHARTER.md`  
- Redis: [setup/REDIS.md](./setup/REDIS.md)
