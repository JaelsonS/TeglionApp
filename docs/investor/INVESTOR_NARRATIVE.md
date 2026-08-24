# Minha narrativa para investidores — Teglion

Este é o texto corrido da minha história do Teglion — pra eu mandar antes de uma reunião, deixar depois, ou usar de base pra escrever um e-mail de apresentação. O [`PITCH_DECK.md`](./PITCH_DECK.md) é a versão em slides dessa mesma história; esse documento aqui é o que alguém lê quando quer entender meu argumento completo, sem quebra de slide.

Como em todo documento dessa pasta: onde um número real ainda não existe ou depende de uma decisão minha (mercado, captação, preço), eu escrevo isso com todas as letras em vez de estimar algo que pareça bem na fita.

---

## O problema que eu vi

Um escritório de contabilidade pequeno ou médio, hoje, roda sobre WhatsApp, e-mail e planilha. Não porque a equipe não saiba usar tecnologia — porque nenhuma ferramenta que eles já experimentaram foi feita pro jeito como um escritório de contabilidade de verdade trabalha.

Isso tem uma forma concreta, não abstrata, que eu vi de perto: o documento do cliente chega numa conversa de WhatsApp que se perde entre outras cem. O prazo fiscal de cada cliente fica de cabeça de quem está no escritório há mais tempo — se essa pessoa sai, o conhecimento sai junto. A ficha do cliente é uma linha de planilha que só uma pessoa sabe atualizar direito. Captar cliente novo é, na maioria dos casos, indicação boca a boca sem nenhum processo por trás. E o dono do escritório, no fim do dia, não tem como responder rápido uma pergunta simples: quantos clientes estão com documento pendente essa semana?

O software fiscal certificado que esses escritórios são obrigados por lei a usar resolve a parte declarativa — cálculo, obrigação fiscal formal — mas não toca em nada disso. E as ferramentas genéricas de CRM ou gestão de projeto não falam o vocabulário de um escritório de contabilidade, então a adoção real dentro da equipe nunca acontece de verdade.

## A solução que eu construí

Eu juntei cliente, documento, prazo fiscal e comunicação num único lugar, amarrados uns aos outros — em vez de espalhados por ferramentas que não se conversam. Não tentei substituir o software fiscal certificado; cobri exatamente o que ele não cobre.

Hoje isso já existe em uso real, não como protótipo: gestão de clientes com ficha única e histórico completo; upload e validação de documentos, com verificação real do conteúdo do arquivo (não só da extensão, o que evita um arquivo malicioso disfarçado de inofensivo); um calendário fiscal de referência e um sistema de obrigações que rastreia prazo por cliente com lembrete automático; mensagens sempre vinculadas ao histórico do relacionamento com aquele cliente; e um módulo de serviços, captação pública e agendamento, integrado ao Google Calendar do escritório.

## Por que agora, e por que eu fiz dessa forma

O Teglion nasceu em Portugal. Eu sou brasileiro e vi o problema de perto, num mercado onde o segmento de escritórios pequenos e médios está mal servido pelas opções existentes — grande demais pra ferramentas genéricas, específico demais pra não ter um produto pensado nele.

Minha estratégia de crescimento é deliberadamente contida: Portugal primeiro, sem pressa de sair, porque é onde está meu piloto real, o conhecimento acumulado de regra fiscal local, e o relacionamento com meus primeiros clientes. Abrir um segundo mercado antes de Portugal estar validado dilui minha atenção e meu recurso na fase em que os dois são mais escassos — essa é uma decisão consciente minha, não falta de ambição.

## O que eu já provei, e o que eu ainda não provei

Quatro escritórios de contabilidade pilotos usam o Teglion hoje, na operação real do dia a dia — não em ambiente de teste. Isso é o que existe até este momento. Não tenho hoje MRR, ARR, número de clientes pagantes ou qualquer métrica de receita documentada pra apresentar — se e quando existirem, entram aqui, com a fonte real, não estimada.

Eu desenhei a arquitetura técnica com uma visão maior do que os quatro escritórios de hoje: existe um mecanismo real de configuração por país (idioma, moeda, identificação fiscal, fuso horário, funcionalidades disponíveis), com Portugal e Brasil já cadastrados nele. Isso é capacidade arquitetural que eu já comprovei em código — não é o mesmo que "pronto pra vender no Brasil". A distância entre as duas coisas é conteúdo fiscal local, integrações locais e validação de que meu modelo de negócio funciona lá, e eu documento isso com honestidade no roadmap técnico do produto.

O mesmo padrão de honestidade vale pra segurança: existe hoje um teste automatizado de isolamento entre escritórios (o requisito mais crítico de um sistema multi-tenant) rodando a cada mudança de código, autenticação própria e controle de acesso por papel que eu já implementei. Autenticação multifator e auditoria de segurança por terceiro independente eu ainda não fiz — estão no meu roadmap, não escondidas.

## Pra onde eu quero levar isso

Se minha tese se confirmar, o Teglion deixa de ser "o sistema onde uma contadora organiza clientes e documentos" e passa a ser o sistema operacional do escritório de contabilidade — o lugar de onde o dono enxerga toda a operação, não uma entre várias ferramentas que ele precisa cruzar mentalmente. Portugal é o primeiro capítulo dessa história que eu estou escrevendo. Mercados de língua portuguesa, com o Brasil como extensão mais natural dado que eu já pensei a arquitetura pra isso, são o passo seguinte — não como aposta paralela, mas como consequência de Portugal ter dado certo primeiro.

Isso não é uma previsão de faturamento. É a direção que eu já construí o produto pra seguir, com a disciplina de nunca dizer que algo está pronto antes de estar.

---

*Documentos relacionados: [`PITCH_DECK.md`](./PITCH_DECK.md) pra versão em slides, [`DUE_DILIGENCE.md`](./DUE_DILIGENCE.md) pro que uma investigação técnica encontraria hoje, e [`docs/ROADMAP.md`](../ROADMAP.md) pro estado real e os próximos passos, item por item.*
