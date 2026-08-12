# Calendário Fiscal

**Status: PARCIAL.** Antes de qualquer outra coisa, uma clarificação de nome que vale entender: "Calendário Fiscal" e "Obrigações" são dois sistemas diferentes no produto, apesar de tratarem de assunto parecido. Isso confundiu até a documentação anterior a este marco.

## Calendário Fiscal — o que é

Prazos genéricos do escritório — "entrega de IVA trimestral", "IES", esse tipo de coisa — sem vínculo a um cliente específico. É a referência de "o que vence quando", não o rastreamento de "o cliente X já entregou o documento para isso".

O modelo de dado é sólido: recorrência (semanal, mensal, trimestral, anual) é calculada dinamicamente a cada consulta, não pré-gerada e armazenada — o que evita inconsistência entre a regra e as ocorrências mostradas. Editar uma ocorrência específica de um evento recorrente (adiar só uma vez, sem mudar a série inteira) é suportado de forma correta, no mesmo padrão usado por calendários como o do Google. Existe também um calendário nacional de referência para Portugal, já carregado, que o escritório pode importar para o próprio calendário sem precisar montar do zero.

## Obrigações — o outro sistema, esse com client_id

É aqui que o rastreamento por cliente realmente acontece: cada obrigação pertence a um cliente específico, tem status de andamento (aguardando cliente, em atraso, concluída), e é isso que dispara o lembrete automático por mensagem interna, email e SMS — descrito com o achado de bug relevante em [BREVO.md](../05-INTEGRACOES/BREVO.md).

## Os dois gaps conhecidos

**Lembrete configurável do Calendário Fiscal existe só como tabela vazia.** O banco de dados já tem a estrutura para configurar lembrete por evento do calendário fiscal (quantos dias antes avisar, por qual canal) — mas nada no sistema lê ou escreve nessa tabela. Quem realmente envia lembrete hoje é o sistema de Obrigações, não o Calendário Fiscal.

**Geração automática da próxima obrigação recorrente está pela metade.** O backend já sabe gerar a próxima ocorrência de uma obrigação recorrente a partir de uma regra configurada — o endpoint existe e funciona se chamado. Só que o frontend nunca chama esse endpoint: a equipe consegue criar a regra de recorrência pela tela, mas não existe botão nem processo automático que efetivamente gere a próxima obrigação a partir dela. Fica parado depois do primeiro passo.

## Preparado para evoluir

A parte mais sólida deste módulo, olhando para o futuro: o comportamento por país já é resolvido através de uma configuração central, não de regra fixa no código — Portugal está completo, e já existe um registro para o Brasil, com o próprio sistema assumindo explicitamente que o conteúdo fiscal brasileiro "está em preparação" em vez de fingir que já existe. Isso é exatamente o tipo de base que permite adicionar um país novo como trabalho de conteúdo, não de arquitetura — ver [INTERNATIONALIZATION.md](../08-BUSINESS/INTERNATIONALIZATION.md).

## Isolamento

Toda tabela desse módulo tem RLS habilitada no banco, além do filtro de aplicação por `firm_id` — mesmo com a ressalva de que RLS não é o que protege o tráfego real hoje (ver [MULTI-TENANCY.md](../04-ARQUITETURA/MULTI-TENANCY.md)), é um sinal de cuidado consistente nas migrations mais recentes desse módulo.
