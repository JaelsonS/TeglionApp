# Arquivo histórico

**Não use esta pasta como fonte do estado actual do Teglion.**

Documentos aqui foram **congelados** no momento em que foram escritos (sprints, auditorias pontuais, gates de release antigos). A verdade de **Set/2026** está em:

- [`../production/CURRENT_STATE.md`](../production/CURRENT_STATE.md)
- [`../ROADMAP.md`](../ROADMAP.md)
- [`../product/FEATURES.md`](../product/FEATURES.md)

---

## O que guardamos aqui

| Subpasta / ficheiro | Conteúdo |
|---------------------|----------|
| `SPRINT-0.md`, `SPRINT-1.md`, `SPRINT-2.md` | Objetivos e fecho de sprints (Ago/2026) |
| `PHASE-1*.md`, `FASE-1-PRODUCT-AUDIT.md` | Auditorias de produto antigas |
| `auditorias/` | Relatórios datados (ex. security audit 20/08/2026) |
| `security-gates/` | Registos de gates MFA/rate-limit/UAT (incidentes de schema) |
| `FINAL_MAIN_RELEASE_GATE_2026-08-21.md` | Gate de release de Agosto/2026 |
| `assets/`, `mockups/` (em `product/mockups`) | Capturas de referência de UI |

---

## Ficheiros removidos (Set/2026)

| Ficheiro | Motivo |
|----------|--------|
| `ROADMAP-ANTIGO-INDICE.md` | Substituído por `docs/ROADMAP.md`; links quebrados para pastas já apagadas |
| `PROMPT-REPAGINACAO-PAGINA-PUBLICA.md` | Prompt interno de design, não documentação de empresa |

---

## Documentos movidos para aqui (Set/2026)

| De | Para |
|----|------|
| `docs/production/FINAL_MAIN_RELEASE_GATE_2026-08-21.md` | `historico/` |
| `docs/security/SECURITY_AUDIT_2026-08-20.md` | `historico/auditorias/` |
| `docs/decisions/AUDITORIA_FASE0_EVOLUCAO_2026-08-20.md` | `historico/auditorias/` |
| `docs/security/GATE*.md`, `MFA_PROD_SCHEMA_INCIDENT.md` | `historico/security-gates/` |

Os **ADRs** em `docs/decisions/` continuam vigentes; só o relatório de auditoria Fase 0 foi arquivado (ADRs 0008–0012 referem-se a decisões já adoptadas).
