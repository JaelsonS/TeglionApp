# Roadmap do Teglion

**Esse é o único roadmap que eu uso.** Se aparecer outra lista de “próximos passos” noutro ficheiro, está desatualizada — corrijo ou apago.

**Última actualização:** 28 de outubro de 2026 (pós-merge soft launch [#291](https://github.com/JaelsonS/TeglionApp/pull/291) `staging` → `main`; documentação pública limpa de exposição).

---

## Como eu uso este documento

Em cada item: **o que preciso fazer**, **porquê**, **prioridade** (P0–P3), **estado**, **como sei que terminei**.

Estados: `CONCLUÍDO` · `EM ANDAMENTO` · `PRÓXIMO` · `PLANEJADO` · `BLOQUEADO` · `A VALIDAR`

Prioridades: **P0** risco activo · **P1** próximo ciclo · **P2** pode esperar · **P3** futuro

Só marco `CONCLUÍDO` com evidência (código, teste, log real).

---

## Visão de longo prazo

Eu criei o Teglion para tirar o contador do WhatsApp e da planilha e dar ao escritório um sítio único: cliente, documento, obrigação e cobrança.

Comecei em **Portugal**. Sou brasileiro; a tese de expansão é natural: o mesmo problema existe noutros países (regras fiscais diferentes) e, mais tarde, noutros **segmentos** de serviços profissionais — desde que a espinha dorsal (multi-tenant, país como propriedade do tenant, config em vez de fork) continue sólida.

Régua: dados do cliente A nunca vazam para o escritório B; o sistema aguenta crescimento; o Teglion evolui sem depender só da minha memória.

---

## Onde eu estou (28 Out 2026)

- Soft launch comercial **29/10/2026** (divulgação gradual, não ads virais).
- **Produção (`main`):** núcleo operacional + V10 Ops+Fiscal (pagamentos/avenças, calculadoras, rendas, SAF-T leitura, Manual `/manual`) + Control Center gated + denylist na API.
- Stack: Node/Express, React/Vite, Postgres/Supabase, Stripe, Google (SSO/Calendar/Drive), Brevo, Redis.
- Isolamento por `firm_id` + teste de isolamento em staging.
- CI GitHub pode estar bloqueado por billing — nesses dias corro a bateria local antes de mergear.

Snapshot: [`production/CURRENT_STATE.md`](./production/CURRENT_STATE.md).

---

## Já feito (fundação — resumo sem receitas de ataque)

| Área | Estado |
|------|--------|
| Isolamento multi-tenant + teste automatizado | `CONCLUÍDO` (manutenção contínua) |
| Auth JWT cookie + CSRF + MFA | `CONCLUÍDO` (UAT vivo pontual `A VALIDAR`) |
| Cofre encriptado + confirmação sensível | `CONCLUÍDO` |
| Escalação de papéis staff→owner bloqueada | `CONCLUÍDO` (testes no CI) |
| Fuso “hoje” nas obrigações (PT) | `CONCLUÍDO` para PT; multi-país → item 3.x |
| V10 Ops+Fiscal ondas 1–7 | `CONCLUÍDO` em produção (UAT contínuo) |
| Control Center ondas 1–3 | `CONCLUÍDO` gated; 3b+ planejado |
| Soft launch harden (notify SMS, DOCX MIME) | `CONCLUÍDO` |

Não reabro aqui narrativas de vulnerabilidades antigas. Postura actual: [`security/SECURITY.md`](./security/SECURITY.md).

---

## Agora — Dia D e semana 1 (a partir de 29/10)

### D.1 — Plantão soft launch

- **Estado:** `PRÓXIMO`
- **Prioridade:** P0
- **O que faço:** warm-up health, Sentry + Render abertos, canal com a contabilista, **zero merges de risco** para `main` no dia D.
- **Done quando:** dia D corrido sem incidente P0; health estável.

### D.2 — Google OAuth em modo Production

- **Estado:** `PRÓXIMO`
- **Prioridade:** P0
- **Porquê:** o consent screen em Testing limita test users; no soft launch preciso que qualquer Gmail autorizado pelo fluxo do produto entre sem eu correr atrás de whitelist.
- **O que faço:** Google Cloud → OAuth consent → Publish app (scopes básicos email/perfil). Alternativa temporária: acrescentar test users — só se Publish atrasar.
- **Done quando:** registo/login Google em produção funciona para um email novo sem estar na lista de teste.

### D.3 — Monitorização e billing de infra

- **Estado:** `PRÓXIMO`
- **Prioridade:** P1
- **O que faço:** alertas Supabase/Render activos; Redis verde nos logs; GitHub Actions billing desbloqueado quando possível (senão continuo com bateria local).
- **Done quando:** consigo ver falhas sem o utilizador me avisar primeiro.

### D.4 — Acompanhar cadastros (humano)

- **Estado:** `PRÓXIMO`
- **Prioridade:** P1
- **O que faço:** lista prioritária da parceira; Control Center para suspender abuso; não forçar avalanche no mesmo IP/Wi‑Fi (protecções anti-abuso existem — detalhes exactos **não** vão para o GitHub público).
- **Done quando:** meta semana 1 (dezenas de gabinetes) sem caos operacional.

---

## Seguinte — Control Center

Carta: [`product/TEGLION_CONTROL_CENTER_CHARTER.md`](./product/TEGLION_CONTROL_CENTER_CHARTER.md)

| # | Item | Prioridade | Estado |
|---|------|------------|--------|
| C.1 | Onda 3b — espelhar defesa na edge (Cloudflare) quando houver conta/token | P2 | `PLANEJADO` |
| C.2 | Sinais de saúde / NPS leve / usabilidade ops | P2 | `PLANEJADO` |
| C.3 | Gate de registo com revisão interna (se o volume exigir) | P3 | `PLANEJADO` |

Regra: **não** documento no repo público limiares, allowlists de email nem SQL de emergência.

---

## Seguinte — Multi-país

ADRs: [`decisions/ADR-0002-pais-como-propriedade-do-tenant.md`](./decisions/ADR-0002-pais-como-propriedade-do-tenant.md), [`ADR-0006`](./decisions/ADR-0006-obrigacao-custom-estrategia-entrada-pais.md)  
Arquitectura: [`architecture/INTERNATIONALIZATION.md`](./architecture/INTERNATIONALIZATION.md)

| # | Item | Prioridade | Estado |
|---|------|------------|--------|
| P.1 | Timezone / país como propriedade estável do tenant (coluna + allow-list) | P1 | `PLANEJADO` |
| P.2 | Conteúdo fiscal BR (calendário) quando PT estiver estável comercialmente | P2 | `BLOQUEADO` por crescimento PT |
| P.3 | Obrigações CUSTOM / entrada noutro país sem fork do monólito | P2 | `PLANEJADO` |
| P.4 | Moeda, idioma UI, formatos fiscais por config | P2 | Parcial (base existe) |

Ordem: **Portugal sólido → mercados lusófonos → outros**. Não abro segundo país por ego.

---

## Seguinte — Multi-segmento (futuro)

Hoje o Teglion é **contabilidade**. A arquitectura (tenant, país, módulos, entitlements) deve permitir, mais tarde, outros segmentos de serviços profissionais **sem** clonar o repo.

| # | Item | Prioridade | Estado |
|---|------|------------|--------|
| S.1 | Separar “núcleo operacional” (clientes, docs, tarefas, mensagens) de “pacotes fiscais PT” | P2 | `PLANEJADO` (já parcialmente verdade no código) |
| S.2 | Feature flags / entitlements por segmento | P3 | `PLANEJADO` |
| S.3 | Primeiro segmento piloto **só** depois de multi-país ou escala PT estável | P3 | `BLOQUEADO` |

Não prometo data. Prometo não pintar o código num canto só de IVA português.

---

## Escala e fiabilidade

| # | Item | Prioridade | Estado |
|---|------|------------|--------|
| E.1 | Redis prod sempre verde antes de 2.ª instância API | P0 | Manutenção |
| E.2 | 2.ª instância Render **só** com Redis partilhado | P1 | `PLANEJADO` |
| E.3 | Filas para lembretes/email pesado (sair do request HTTP) | P2 | `PLANEJADO` |
| E.4 | Drill de restore de backup trimestral | P1 | `A VALIDAR` cadência |
| E.5 | Observabilidade (alertas activos, não só Sentry passivo) | P1 | `PLANEJADO` |

---

## Produto V10 / escritório (polimento)

| # | Item | Prioridade | Estado |
|---|------|------------|--------|
| V.1 | UAT contínuo pagamentos / rendas / SAF-T / calculadoras com contabilista | P1 | `EM ANDAMENTO` |
| V.2 | Maya + Manual — conteúdo e activação | P2 | Parcial |
| V.3 | Agenda / serviços — UX residual | P2 | `PLANEJADO` |

Carta V10: [`product/V10_OPS_FISCAL_CHARTER.md`](./product/V10_OPS_FISCAL_CHARTER.md).

---

## Critério GO comercial (semana 1)

- Health e login estáveis
- Google SSO utilizável sem fricção de Testing
- Control Center disponível para abuso
- Parceira alinhada (lista prioritária + canal)
- Sem merges experimentais no dia D

**NO-GO** → adiar divulgação ampla ou ficar em lista fechada.

---

## O que eu não faço neste roadmap

- Listas paralelas de tarefas noutros markdown
- Documentar no GitHub público como contornar proteções
- Expandir país/segmento antes da base aguentar
