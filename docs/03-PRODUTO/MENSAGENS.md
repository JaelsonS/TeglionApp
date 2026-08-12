# Mensagens

**Status: IMPLEMENTADO**, com uma ressalva de experiência que vale conhecer antes de apresentar o produto ao vivo.

## O que é

Conversa entre o escritório e o cliente, vinculada ao cadastro do cliente — não uma mensagem solta, sempre parte do histórico daquele relacionamento. Suporta anexo (reaproveitando a mesma validação de [Documentos](./DOCUMENTOS.md)).

## "Tempo real" é, na prática, quase tempo real — não é push verdadeiro

O mecanismo por trás não é uma conexão persistente que empurra mensagem nova instantaneamente — é uma verificação periódica consolidada, a cada dois minutos, mais uma verificação extra quando a pessoa volta a focar a aba do navegador. Isso é um desenho consciente e razoável (um único agendador por sessão, não um por componente de tela, o que evita sobrecarregar o backend conforme mais gente usa o produto ao mesmo tempo) — mas significa que, numa demonstração ao vivo, pode haver alguns instantes de atraso entre enviar uma mensagem de um lado e ela aparecer do outro, o que vale explicar antecipadamente para não parecer falha.

## Permissão e isolamento

Um cliente nunca informa de quem é a conversa que quer ver — o sistema sempre deriva isso da própria sessão dele, então não existe caminho onde um cliente peça a conversa de outro cliente por engano ou de propósito. Do lado do escritório, toda operação exige o `firm_id` da sessão combinado com a validação de que aquele cliente pertence ao escritório.

## Um ponto pequeno, não crítico

Não existe uma trava explícita no backend contra o mesmo clique duplo criar duas mensagens idênticas — hoje isso é evitado do lado do frontend (o botão de enviar fica desabilitado durante o envio), o que cobre o caso comum, mas não é uma garantia de nível de banco de dados.
