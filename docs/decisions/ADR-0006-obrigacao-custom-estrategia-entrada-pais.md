# ADR-0006 — Tipo de obrigação `CUSTOM` como estratégia de entrada em novos países, antes de automação fiscal completa

## Status

Aceito. Decisão já em vigor, documentada retroativamente em 18/08/2026.

## Contexto

O núcleo de valor do Teglion para um escritório de contabilidade é o calendário de obrigações fiscais dos seus clientes — prazos de IVA, IRC, IRS, Segurança Social, etc., no caso de Portugal. Automatizar isso de verdade para um país novo (gerar automaticamente as obrigações certas, nas datas certas, com as regras certas) é um trabalho fiscal e de produto substancial — não é uma tarefa de "só traduzir a interface".

O Teglion quer expandir para o Brasil (ver `docs/ROADMAP.md`, Fase 4) sem esperar que o módulo fiscal brasileiro completo esteja pronto antes de o primeiro escritório brasileiro poder operar.

## Problema

Como permitir que um escritório de um país sem automação fiscal completa (hoje, o Brasil) já use o Teglion para gerenciar obrigações de clientes, sem reescrever o módulo fiscal inteiro antes de ter o primeiro cliente real nesse país?

## Decisão

A tabela `obligations` tem uma constraint de tipo (`obligations_type_check`, `supabase/migrations/20260826000000_obligation_operational.sql`) que inclui `CUSTOM` ao lado dos tipos fiscais portugueses:

```sql
CHECK (type IN ('IVA', 'IRC', 'IRS', 'SS', 'DRF', 'IES', 'DAS', 'PAYROLL', 'SAFT', 'CUSTOM'))
```

`CUSTOM` permite que um escritório crie e gerencie obrigações e tarefas personalizadas, sem depender do calendário fiscal automático. O serviço `backend/src/modules/fiscal/fiscal-calendar.service.js`, na função `listFiscalCalendarForCountry`, verifica `config.features.fiscalCalendar` (vindo de `country-config.registry.js`) e, quando esse recurso não está habilitado para o país, devolve explicitamente:

> "Calendário fiscal para o Brasil está em preparação. Use obrigações e tarefas personalizadas até à disponibilização."

em vez de uma lista vazia sem explicação, ou de um erro.

## Alternativas consideradas

- **Bloquear o cadastro de um escritório em um novo país até o calendário fiscal automático desse país estar pronto.** Rejeitada implicitamente pela decisão de expandir: isso amarraria toda a expansão internacional do Teglion ao ritmo do trabalho fiscal, que é o item mais lento e mais arriscado de acertar (regras fiscais mudam, variam por regime, e errar tem consequência real para o cliente do escritório).
- **Construir automação fiscal brasileira completa antes de aceitar qualquer escritório do Brasil.** Também rejeitada implicitamente — o roadmap (Fase 4) é explícito que o Brasil MVP não depende de automação fiscal brasileira completa, e lista `CUSTOM` como "já funciona hoje, sem trabalho adicional".

## Motivos da decisão

- Desacopla "o escritório pode operar no país X" de "o Teglion já automatizou o calendário fiscal do país X" — são dois marcos diferentes, e o produto pode entregar valor real (gestão de clientes, documentos, tarefas, cobrança) antes do segundo estar pronto.
- `CUSTOM` já existia como tipo de obrigação antes de ser pensado como estratégia de expansão — reaproveitá-lo para esse fim é usar uma peça já construída e testada, não criar mecanismo novo.
- A mensagem explícita de "está em preparação, use obrigações personalizadas" no próprio produto transforma a limitação em uma instrução clara para o usuário, em vez de um vazio silencioso.

## Consequências positivas

- É, na prática, a decisão arquitetural que torna viável entrar em um novo mercado sem reescrever o módulo fiscal inteiro primeiro — o roadmap chama isso diretamente: "o Brasil MVP não precisa esperar por nenhuma automação fiscal brasileira".
- Reduz o risco de lançar automação fiscal malfeita sob pressão de prazo comercial — dá tempo para construir o calendário fiscal brasileiro corretamente, sem bloquear a entrada dos primeiros escritórios.
- O caminho de fallback (`CUSTOM`) já está em produção e testado através do uso normal do Teglion em Portugal — não é um recurso novo e não testado criado só para esse propósito.

## Consequências negativas

- Um escritório operando só com obrigações `CUSTOM` não tem a geração automática de prazos que é boa parte do valor do calendário fiscal do Teglion — é um MVP deliberadamente mais manual, não a experiência completa que o produto oferece em Portugal.
- Cria uma diferença de qualidade de produto perceptível entre escritórios de países com calendário automático e escritórios sem — algo que precisa ser comunicado com clareza ao cliente (o próprio sistema já faz isso via a mensagem "está em preparação"), para não gerar expectativa equivocada.

## Riscos

- Se o calendário fiscal brasileiro demorar muito além do esperado para ser construído, escritórios brasileiros reais podem ficar por tempo prolongado numa experiência inferior à de Portugal, o que é um risco de retenção/satisfação, não de segurança ou de integridade de dados.
- `CUSTOM` depende inteiramente do próprio escritório para não esquecer prazos — sem o calendário automático, um erro humano do escritório em cadastrar uma obrigação `CUSTOM` na data certa tem consequência direta para o cliente dele. Isso é um risco de produto que o Teglion está conscientemente aceitando como trade-off de velocidade de expansão.

## Impacto futuro

- Quando o calendário fiscal brasileiro for construído, ele deve seguir o mesmo padrão já usado em Portugal, com `config.features.fiscalCalendar` passando a `true` para `BR` em `country-config.registry.js` — não deve exigir uma reescrita da mensagem de fallback ou do mecanismo de `CUSTOM`, que continua válido como opção para tipos de obrigação fora do calendário automático mesmo depois disso.
- Qualquer país novo além do Brasil pode seguir exatamente essa mesma estratégia: entrar com `CUSTOM` disponível e a mensagem de "em preparação", sem esperar automação fiscal completa antes do primeiro cliente.

## Relação com outros ADRs

- ADR-0002 (país como propriedade do tenant): é `firm.country_code` que determina, via `country-config.registry.js`, se `features.fiscalCalendar` está ativo — a mesma propriedade de tenant usada aqui, nunca usada para autorização.
- ADR-0005 (Stripe com preço por país): mesma estratégia estrutural — construir o ponto de extensão por país (branch de preço, flag de feature) antes de a automação completa existir para todo país suportado.
