# Prontidão comercial — soft launch 29/10/2026

**Objectivo:** 20–50 gabinetes na 1.ª semana · dezenas de users concurrentes.  
**Não:** campanha ads/viral no dia D.  
**Regra:** nada experimental em `main` no dia da divulgação.

## Checklist P0 (ops)

| # | Item | Como verificar | Estado (27 Out) |
|---|------|----------------|-----------------|
| 1 | API prod healthy | `GET https://www.teglion.com/api/health` → 200 | OK (~0,4–0,5s) |
| 2 | SPA registo/login | `/auth/firm/register` + `/auth/firm/login` → 200 | OK |
| 3 | Staging health burst | 20× paralelo `/api/health` | OK 20/20 |
| 4 | Redis prod | Render env `REDIS_URL`; logs **sem** fallback memória | **CONFIRMAR** — Sentry TEGLION-APP-Q última vez há ~3 dias |
| 5 | Plano Render API | ≥ 1 CPU / 2 GB; sem free spin-down | **CONFIRMAR no dashboard** |
| 6 | Brevo email | 1 e-mail transacional de teste | **CONFIRMAR** |
| 7 | SMS Brevo | Se 400 frequentes → `SMS_ENABLED=false` ou só email no notify | Hardening código: SMS não derruba notify |
| 8 | Turnstile | 1 registo + 1 login reais em teglion.com | Páginas 200; **dry-run humano** |
| 9 | Storage DOCX | Bucket `contabil-documents` inclui wordprocessingml | OK prod+staging (SQL 27 Out) |
| 10 | Plantão 29/10 | Pessoa + Sentry + Render + `/app/ops` staging | **Definir nome** |

### Redis — acção imediata

1. Render → serviço API prod → Environment → existe `REDIS_URL`?
2. Logs recentes: procurar `Redis indisponível`.
3. Se sim → corrigir Upstash/Render Redis **antes** do dia D ([REDIS.md](./setup/REDIS.md)).
4. Sem Redis estável **não** ligar 2ª instância.

### Plantão 29/10 (preencher)

- Responsável técnico: _______________
- Canal suporte contabilista: _______________
- Backup: _______________

## Resultado load drill staging (27 Out 2026)

Comando: `cd backend && node scripts/load-drill-staging.js`

| Métrica | Valor |
|---------|--------|
| Health 40 pedidos (2×20) | 40/40 × 200 · 0×5xx |
| p95 round 1 (frio) | ~2,7s (cold start Render) |
| p95 round 2 (quente) | ~1,0s |
| login/register/csrf ×10 | 0×5xx |

**RESULT:** `PASS_WITH_COLD_START` — aceitável para soft launch; no dia D manter tráfego mínimo antes do pico (warm-up health) ou plano Render sem spin-down.

## Critério GO

- [ ] Redis verde (ou aceite consciente single-instance + monitorização)
- [x] Drill staging documentado OK (`PASS_WITH_COLD_START`)
- [ ] Dry-run registo+Turnstile+email em prod
- [ ] Plantão nomeado
- [ ] Contabilista alinhada (brief comercial)

**NO-GO** → adiar divulgação geral 3–7 dias **ou** lista fechada de escritórios.

## Pós 29/10

| Fase | Volume | Acção |
|------|--------|--------|
| Semana 1 | ≤50 firms | Sentry + tickets |
| Semana 2–4 | 50–150 | 2ª instância **só** com Redis OK |
| Mês 2+ | 150+ | pooling Supabase se preciso; billing Stripe |

## Relacionado

- Canvas: capacidade launch (Cursor canvases)
- Brief contabilista: [GTM_SOFT_LAUNCH_BRIEF_CONTABILISTA.md](./GTM_SOFT_LAUNCH_BRIEF_CONTABILISTA.md)
- Charter Center: `docs/product/TEGLION_CONTROL_CENTER_CHARTER.md`
