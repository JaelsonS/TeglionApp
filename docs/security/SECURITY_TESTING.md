# Testes de segurança — o que o CI faz por mim

**Actualizado:** 28 de outubro de 2026

Eu **não** publico neste repositório playbooks de penetração, listas de casos Burp, nem inventários de falhas históricas. Isso ajudaria um atacante mais do que a equipa. Esse material, se existir, fica no arquivo interno da AfDigital.

## O que corre sozinho em cada PR (quando o CI está activo)

Li `.github/workflows/ci.yml` — job `validate`:

| Passo | O que faz |
|-------|-----------|
| Frontend | `tsc`, testes unitários, build |
| Backend | testes unitários |
| Auditoria estática | `npm run test:security-static -w backend` — padrões de risco no código |
| Isolamento multi-tenant | corre contra **Supabase de staging** (nunca produção); falha se secrets de staging faltarem |
| Limites de ficheiros | `npm run check:file-sizes` |
| Scan de segredos | `npm run security:secrets` |

Se o GitHub Actions estiver bloqueado (billing), eu corro a **mesma bateria localmente** antes de mergear para `main`.

## O que eu ainda trato como trabalho humano

- Confirmar MFA / cofre com conta real em staging ou prod (UAT)
- Revisar `npm audit` periodicamente
- Pentest externo formal (terceiro) — ainda não contratei; quando existir, o relatório **não** entra neste repo público

## Como eu testo isolamento localmente

Ver [`TENANT_ISOLATION.md`](./TENANT_ISOLATION.md). Resumo: apontar env para **staging activo**, nunca produção — o script escreve dados sintéticos.

## Postura

Controlo o que está em [`SECURITY.md`](./SECURITY.md). Se encontrares um problema de segurança, contacta a AfDigital pelo canal de suporte do produto — não abras issue pública com receita de exploração.
