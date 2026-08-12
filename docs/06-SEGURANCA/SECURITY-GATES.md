# Gates de segurança — o que roda automaticamente e o que não roda

Esta é a distinção mais importante deste documento: existe uma diferença grande entre "o teste existe" e "o teste protege alguma coisa". Um teste que só roda quando alguém lembra de digitar o comando não é uma rede de segurança — é um documento com sintaxe de código.

## O que roda sozinho, em todo PR/push

- Checagem de tipos e testes do frontend.
- Build do frontend.
- Um scan estático de segurança do backend (padrões conhecidos de risco no código).
- Varredura de segredos (evita que uma chave real seja commitada por engano).
- Um único arquivo de teste do backend.

Isso é real e roda automaticamente hoje — não é pouco, é a base de um pipeline de CI funcional.

## O que existe mas não roda sozinho

**A suíte completa de testes de backend.** Existem 37 arquivos de teste no backend, incluindo os que cobrem agendamento, cobrança e integração com Google Calendar. O comando que a esteira de CI executa hoje roda apenas 1 desses 37 arquivos. Os outros 36 só rodam se alguém disparar manualmente.

**O teste de isolamento entre escritórios.** Existe um script dedicado, de mais de 500 linhas, que simula exatamente o cenário mais caro para o negócio — um escritório acessando dado de outro. Ele não está ligado a nenhum pipeline automatizado, nem ao CI nem ao processo de release. A última execução registrada é anterior a este marco de documentação, e já estava marcada como desatualizada pelo próprio time antes mesmo de ser revisada de novo agora.

## Por que isso importa mais do que parece

Hoje é fisicamente possível publicar uma mudança de código em produção sem nenhuma verificação automatizada de que ela não introduziu um vazamento de dado entre escritórios. A disciplina de sempre filtrar por `firm_id` é consistente, verificada manualmente — mas consistente não é o mesmo que garantido, e o único mecanismo que transformaria essa garantia em automática não está ativo.

## Recomendação (documentada aqui, não implementada)

Antes de abrir o produto para venda além do piloto controlado, os dois pontos acima — suíte completa de backend e teste de isolamento — precisam rodar automaticamente em todo PR que toca código de backend, contra um ambiente isolado (não a base de produção partilhada, que foi a razão original para o teste de isolamento ter sido desligado do CI). Isso está listado como item do [Sprint 0](../02-ROADMAP/SPRINT-0.md).
