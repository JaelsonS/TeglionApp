# Redesign Serviços / IRS — Mockups para aprovação

> **Nota de arquivamento (19/08/2026):** este documento foi movido para `historico/` porque ficou obsoleto por sucesso, não por abandono. A proposta descrita abaixo já foi implementada: confirmado em código que existe a rota `/app/firm/irs` e o componente `FirmIrsPage` (`frontend/src/features/firm/pages/FirmIrsPage.tsx`), separando IRS de Serviços exatamente como foi aprovado aqui. O estado atual e verificado desses módulos está em `docs/product/FEATURES.md` e `docs/product/PRODUCT.md`; este arquivo fica preservado só como registro histórico da decisão de design original.

**Estado:** Aprovado · Em implementação (branch `feat/servicos-irs-redesign-approved`)  
**Branding:** tokens actuais (`#0F2942` / `--cb-brand`, tabs underline, sheets, split views)

## Decisões aprovadas

- Catálogo split (activos | modelos Teglion), linhas limpas
- IRS hub dedicado `/app/firm/irs` (fora das tabs de Serviços)
- Editor com descrição fechada + meios de pagamento
- Solicitações / Central com copy clara
- Pack IRS PT expandido no catálogo nacional

## Implementação

Ver commits nesta branch.

## O que estava mal (hoje)

| Problema | Causa |
|----------|--------|
| Catálogo “bagunçado” | Descrição RichText **sempre aberta** em cada linha |
| Confusão Catálogo vs Central | Mesmo sítio, copy fraca |
| IRS fraco | Só 3 templates + filtro por nome dentro de Serviços |
| Sem scroll / sensação horrível | Layout overflow + conteúdo demasiado denso |
| Mockups azuis genéricos | Devíamos ter seguido 100% o sistema Teglion |

## Proposta de IA (navegação)

```
Sidebar
├── IRS                    → /app/firm/irs     (NOVO hub dedicado)
└── Serviços               → /app/firm/services
      tabs: Catálogo | Solicitações | Central
      (IRS sai destas tabs)
```

## Ecrãs (imagens geradas)

1. **Catálogo split** — esquerda: serviços activos do escritório (linhas compactas); direita: modelos Teglion para Activar  
2. **Editar serviço** — descrição **fechada** por defeito; bloco **Meio de pagamento** (Transferência / Multibanco / Stripe Connect em breve)  
3. **IRS hub** — página própria, campanha/ano, modelos PT completos + serviços do escritório  
4. **IRS Modelo 3 + Anexos** — toggles A/B/C/F/G/H/J, IRS Jovem, formulário  
5. **Solicitações** — inbox + etiquetas + pedir multi-item + confirmar agendamento  
6. **Central** — só clientes com app Teglion  
7. **Portal cliente** — serviços que o escritório activou + agendar  

## Catálogo nacional IRS (a enriquecer no código)

Hoje só: Simulação · Entrega/orçamento · e-Fatura.  
Proposta de pack PT (templates activáveis):

- Declaração Modelo 3 (por ano)
- Anexos A, B, C, F, G/G1, H, J
- IRS Jovem
- Classificação e-Fatura
- Declaração de substituição / correcção
- Não residentes / Anexo J
- Simulação IRS
- Prestações / imposto a pagar vs reembolso (perguntas)

## Pagamentos (front pronto, Stripe Connect depois)

No editor de serviço:

- Transferência bancária (activo já — alinhado a orçamentos PDF)
- Multibanco (UI “em breve”)
- Cartão / Stripe Connect (UI “em breve”)

## Como aprovar

Comenta por número (1–7):

- **OK** — implementar idêntico  
- **Ajustar:** …  
- **Não** — preferir outra organização  

Só depois da tua OK começo a codificar (sem inventar UI diferente das imagens aprovadas).
