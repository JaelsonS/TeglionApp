# Como a documentação se mantém viva

**Actualizado:** 28 de outubro de 2026

Documentação desatualizada engana. Eu actualizo o documento na **mesma** entrega em que o código ou o processo muda.

## Regra central

Actualizo o doc correspondente no mesmo PR/dia da mudança. Se a doc “não cabe”, a mudança está grande demais — não adio o documento.

## Onde registo cada tipo de mudança

| Tipo | Onde |
|------|------|
| Arquitectura / decisão | ADR em `docs/decisions/` |
| Produto | `docs/product/` |
| Infra / deploy | `docs/infrastructure/` ou `docs/operations/` |
| Segurança (postura) | `docs/security/` |
| Prioridade | **só** `docs/ROADMAP.md` |

## Repo público — o que **nunca** documento aqui

Este GitHub é **público**. Eu **não** coloco:

- Passos de exploração, playbooks Burp/red-team, listas de endpoints “ainda sem defesa”
- Números exactos de rate-limit, skip-lists, TTLs de denylist, limiares de lockout
- Emails de allowlist ops, SQL de emergência, project refs de cloud
- Narrativas do tipo “antes vazava X pela rota Y” com receita

Isso vive no arquivo **interno** da AfDigital. No repo fica postura, arquitectura e como operar sem dar mapa ao atacante.

Ver stub: [`../historico/README.md`](../historico/README.md).

## Evitar fragmentação

1. Um facto num sítio; os outros linkam.
2. Afirmação ≠ código → corrijo na hora ou marco `A VALIDAR`.
3. Sem listas de tarefas paralelas ao roadmap.
4. Não “corrijo” o passado inventando história — actualizo o estado actual.

## Responsável

Quem muda o código actualiza a doc. Entrada: [`../START_HERE.md`](../START_HERE.md).
