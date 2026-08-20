# ADR-0006 — Tipo de obrigação `CUSTOM` como estratégia de entrada em novos países, antes de automação fiscal completa

## Status

Aceito. Decisão já em vigor — documentei retroativamente em 18/08/2026.

## Contexto

O núcleo de valor que ofereço a um escritório de contabilidade é o calendário de obrigações fiscais dos clientes dele — prazos de IVA, IRC, IRS, Segurança Social, etc., no caso de Portugal. Automatizar isso de verdade para um país novo (gerar automaticamente as obrigações certas, nas datas certas, com as regras certas) é um trabalho fiscal e de produto substancial para mim — não é uma tarefa de "só traduzir a interface".

Quero expandir o Teglion para o Brasil (ver `docs/ROADMAP.md`, Fase 4) sem esperar que o módulo fiscal brasileiro completo esteja pronto antes de o primeiro escritório brasileiro poder operar.

## Problema

Como eu permito que um escritório de um país sem automação fiscal completa (hoje, o Brasil) já use o Teglion para gerenciar obrigações de clientes, sem eu reescrever o módulo fiscal inteiro antes de ter o primeiro cliente real nesse país?

## Decisão

A tabela `obligations` tem uma constraint de tipo (`obligations_type_check`, `supabase/migrations/20260826000000_obligation_operational.sql`) que inclui `CUSTOM` ao lado dos tipos fiscais portugueses:

```sql
CHECK (type IN ('IVA', 'IRC', 'IRS', 'SS', 'DRF', 'IES', 'DAS', 'PAYROLL', 'SAFT', 'CUSTOM'))
```

`CUSTOM` permite que um escritório crie e gerencie obrigações e tarefas personalizadas, sem depender do calendário fiscal automático. No serviço `backend/src/modules/fiscal/fiscal-calendar.service.js`, na função `listFiscalCalendarForCountry`, verifico `config.features.fiscalCalendar` (vindo de `country-config.registry.js`) e, quando esse recurso não está habilitado para um país, devolvo explicitamente:

> "Calendário fiscal para o Brasil está em preparação. Use obrigações e tarefas personalizadas até à disponibilização."

em vez de uma lista vazia sem explicação, ou de um erro.

## Alternativas consideradas

- **Bloquear o cadastro de um escritório em um novo país até o calendário fiscal automático desse país estar pronto.** Descartei isso, ainda que implicitamente, ao decidir expandir: amarraria toda a minha expansão internacional ao ritmo do trabalho fiscal, que é o item mais lento e mais arriscado de acertar (regras fiscais mudam, variam por regime, e errar tem consequência real para o cliente do escritório).
- **Construir automação fiscal brasileira completa antes de aceitar qualquer escritório do Brasil.** Também descartei implicitamente — meu roadmap (Fase 4) é explícito que o Brasil MVP não depende de automação fiscal brasileira completa, e listo `CUSTOM` como "já funciona hoje, sem trabalho adicional".

## Motivos da decisão

- Desacoplo "o escritório pode operar no país X" de "já automatizei o calendário fiscal do país X" — para mim são dois marcos diferentes, e o produto pode entregar valor real (gestão de clientes, documentos, tarefas, cobrança) antes do segundo estar pronto.
- `CUSTOM` já existia como tipo de obrigação antes de eu pensar nele como estratégia de expansão — reaproveitar para esse fim é usar uma peça que já construí e testei, não criar mecanismo novo.
- A mensagem explícita de "está em preparação, use obrigações personalizadas" no próprio produto transforma a limitação numa instrução clara para o usuário, em vez de um vazio silencioso.

## Consequências positivas

- É, na prática, a decisão arquitetural que torna viável eu entrar em um novo mercado sem reescrever o módulo fiscal inteiro primeiro — chamo isso diretamente no roadmap: "o Brasil MVP não precisa esperar por nenhuma automação fiscal brasileira".
- Reduz o risco de eu lançar automação fiscal malfeita sob pressão de prazo comercial — me dá tempo para construir o calendário fiscal brasileiro corretamente, sem bloquear a entrada dos primeiros escritórios.
- O caminho de fallback (`CUSTOM`) já está em produção e testado através do uso normal do Teglion em Portugal — não é um recurso novo e não testado que criei só para esse propósito.

## Consequências negativas

- Um escritório operando só com obrigações `CUSTOM` não tem a geração automática de prazos que é boa parte do valor do calendário fiscal do Teglion — é um MVP deliberadamente mais manual, não a experiência completa que ofereço em Portugal.
- Isso cria uma diferença de qualidade de produto perceptível entre escritórios de países com calendário automático e escritórios sem — algo que preciso comunicar com clareza ao cliente (o próprio sistema já faz isso via a mensagem "está em preparação"), para não gerar expectativa equivocada.

## Riscos

- Se o calendário fiscal brasileiro demorar muito além do esperado para eu construir, escritórios brasileiros reais podem ficar por tempo prolongado numa experiência inferior à de Portugal, o que é um risco de retenção/satisfação para mim, não de segurança ou de integridade de dados.
- `CUSTOM` depende inteiramente do próprio escritório para não esquecer prazos — sem o calendário automático, um erro humano do escritório em cadastrar uma obrigação `CUSTOM` na data certa tem consequência direta para o cliente dele. É um risco de produto que estou aceitando conscientemente como trade-off de velocidade de expansão.

## Impacto futuro

- Quando eu construir o calendário fiscal brasileiro, ele deve seguir o mesmo padrão que já uso em Portugal, com `config.features.fiscalCalendar` passando a `true` para `BR` em `country-config.registry.js` — não deve exigir uma reescrita da mensagem de fallback ou do mecanismo de `CUSTOM`, que continua válido como opção para tipos de obrigação fora do calendário automático mesmo depois disso.
- Qualquer país novo além do Brasil pode seguir exatamente essa mesma estratégia: entrar com `CUSTOM` disponível e a mensagem de "em preparação", sem eu esperar automação fiscal completa antes do primeiro cliente.

## Relação com outros ADRs

- ADR-0002 (país como propriedade do tenant): é `firm.country_code` que determina, via `country-config.registry.js`, se `features.fiscalCalendar` está ativo — a mesma propriedade de tenant que uso aqui, nunca usada para autorização.
- ADR-0005 (Stripe com preço por país): mesma estratégia estrutural que usei — construir o ponto de extensão por país (branch de preço, flag de feature) antes de ter automação completa para todo país que suporto.
