# Fluxo Git — Teglion

**Actualizado:** 28 de outubro de 2026

## Branches oficiais

| Branch | Função |
|--------|--------|
| `main` | Só produção aprovada |
| `staging` | Integração + ambiente STAGING |
| `feature/…` ou `fix/…` ou `docs/…` | Trabalho em curso |

**Não uso `develop`.** Não trabalho directamente na `main`.

## Fluxo

```
feature/… → PR → staging → CI ou bateria local + UAT staging → aprovado → PR staging → main → PRODUÇÃO
```

## Regras que eu sigo

1. Se a branch actual for `main`, crio/checkout uma branch de feature **antes** de editar.
2. Não faço push directo / force push / `--no-verify` na `main`.
3. Não aponto testes ou migrations experimentais ao Supabase **PROD**.
4. No dia de divulgação comercial (soft launch), **zero merges de risco** para `main`.

## Documentação

Mudanças de processo ou produto actualizam a doc no mesmo PR — ver [`../governance/DOCUMENTATION_POLICY.md`](../governance/DOCUMENTATION_POLICY.md).
