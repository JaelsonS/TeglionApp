# Internacionalização — estado técnico

Complementa [EXPANSAO-INTERNACIONAL.md](../01-ESTRATEGIA/EXPANSAO-INTERNACIONAL.md), que cobre a narrativa estratégica de quando e por quê. Este documento é o checklist técnico: o que precisa existir, de fato, para o produto operar em outro país.

## Status: PARCIAL — arquitetura pronta, conteúdo pendente

Isso não é a mesma coisa que "planejado" nem "implementado". É uma categoria própria: a capacidade estrutural já existe e foi verificada em código, mas o conteúdo necessário para operar de verdade em outro mercado não existe ainda.

## O que já existe, de forma real

Um mecanismo central que resolve configuração por país — idioma, moeda, formato de identificação fiscal (NIF em Portugal, por exemplo), fuso horário, e quais funcionalidades estão disponíveis para aquele país. Portugal e Brasil já estão cadastrados nesse mecanismo. Para o Brasil, especificamente, o sistema já sinaliza de forma explícita que o calendário fiscal não está disponível ainda — retorna uma resposta de "em preparação" em vez de fingir que tem conteúdo que não tem. Isso é uma decisão de honestidade técnica que vale destacar: o sistema não tenta esconder a lacuna.

## O que falta, país por país, para operar de verdade

- **Conteúdo fiscal completo**: prazos, categorias e regras específicas daquele país (hoje só Portugal está completo).
- **Validação de identificação fiscal local**: cada país tem formato e regra de validação diferentes.
- **Integrações locais**: sistemas de faturação, autoridade tributária, meios de pagamento comuns naquele mercado.
- **Idioma completo da interface**, não só do conteúdo fiscal.
- **Suporte operacional** capaz de atender naquele fuso e naquele idioma.
- **Validação de que o modelo de preço e o modelo de negócio fazem sentido** naquele mercado — moeda, poder de compra, forma de pagamento local.

## Por que isso é PARCIAL e não PLANEJADO

Porque "planejado" sugeriria que nada foi feito ainda. Não é o caso: a decisão arquitetural de tratar país como configuração central, em vez de espalhar `if (pais === 'PT')` pelo código inteiro, já foi tomada e já está em uso — é o tipo de decisão que, se não fosse tomada cedo, teria que ser refeita depois com muito mais custo. O que falta é conteúdo e validação de mercado, não reescrever a base técnica.

## Quando isso avança

Só quando fizer sentido de negócio — ver o Sprint 5 em [LONG-TERM.md](../02-ROADMAP/LONG-TERM.md). Não é uma corrida para preencher o próximo país no registro; é preencher quando o mercado de Portugal justificar o próximo passo.
