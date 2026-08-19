# Visão

> Este documento consolida conteúdo antes espalhado em `docs/00-PRODUTO/VISION.md`, `docs/02-ROADMAP/VISION-2030.md` e `docs/01-ESTRATEGIA/EXPANSAO-INTERNACIONAL.md` (arquivos removidos nesta reorganização de 19/08/2026). Tudo neste documento é visão de longo prazo, não capacidade ou compromisso atual — onde há algo comprovado hoje, isso está marcado explicitamente; o resto é intenção.

## A visão

Transformar o Teglion numa plataforma global para escritórios de contabilidade e serviços profissionais — começando em Portugal, expandindo para outros países quando o modelo estiver validado o suficiente para justificar o passo.

Todo escritório de contabilidade do mundo lida com a mesma estrutura de problema, ainda que a regra fiscal mude de país para país: cliente recorrente, prazo que não pode ser perdido, documento que precisa ser pedido e organizado, comunicação que precisa ficar registrada. Um produto que resolve isso bem para Portugal tem, na essência, a mesma forma que resolveria para outro mercado — o que muda é o conteúdo local (moeda, idioma, regra fiscal, calendário), não a espinha dorsal do produto.

Isso é visão, não plano de execução imediato. A arquitetura já reflete essa visão de forma concreta — existe hoje um mecanismo real de configuração por país, com Portugal pronto e Brasil já cadastrado como próximo passo natural — mas internacionalizar antes da hora seria trocar foco por ambição vazia. A visão existe para orientar decisão de arquitetura hoje (não fechar porta para o futuro), não para acelerar um lançamento em outro país antes de Portugal estar consolidado.

### O que a arquitetura precisa sustentar para essa visão ser real

Idioma, moeda, regra fiscal, calendário, formato de documento, integrações locais — cada um desses pontos precisa ser configuração, não código reescrito a cada país novo. É esse compromisso que separa "temos clientes em vários países porque forçamos o produto a caber" de "o produto foi desenhado para caber".

Se o Teglion cumprir essa visão, ele deixa de ser identificado como "um sistema português" e passa a ser identificado pelo problema que resolve — a operação e o relacionamento com cliente de um escritório de contabilidade ou serviço profissional — independentemente de onde esse escritório está. Portugal é o primeiro capítulo dessa história, não o único.

## Expansão internacional

### Por que Portugal primeiro, sem pressa de sair

O piloto real, o conhecimento de regra fiscal, o relacionamento com os primeiros clientes pagantes — tudo isso está em Portugal. Abrir um segundo país antes de Portugal estar validado dilui atenção e recurso numa fase em que os dois são escassos. A ordem certa é provar que o modelo funciona e se sustenta num mercado, depois replicar — não os dois ao mesmo tempo.

### O que já existe de base técnica, e o que isso não significa

A arquitetura já tem, hoje, uma forma real de configurar comportamento por país — idioma, moeda, formato de identificação fiscal, timezone, e quais funcionalidades (como o calendário fiscal) estão disponíveis para cada país. Portugal e Brasil já estão cadastrados nesse mecanismo.

Isso é capacidade arquitetural real, verificada em código — não é o mesmo que "pronto para operar no Brasil". Hoje, o Brasil está cadastrado com o calendário fiscal explicitamente marcado como "em preparação" — o sistema sabe que não tem esse conteúdo ainda e não finge que tem. A distância entre "a arquitetura permite" e "está pronto para vender em outro país" é justamente conteúdo fiscal local, integrações locais, suporte no fuso e idioma certos, e validação de que o modelo de negócio funciona lá. Isso é trabalho de produto e de mercado, não só de código — detalhe técnico completo em [`docs/architecture/INTERNATIONALIZATION.md`](../architecture/INTERNATIONALIZATION.md).

### Quando isso entra no roadmap

Só depois de Portugal estar em ritmo de crescimento sustentável — múltiplos escritórios pagantes, retenção validada, operação estável — conforme os itens de internacionalização do roadmap oficial ([`docs/ROADMAP.md`](../ROADMAP.md), Fases 3 a 7). Não antes. O risco de abrir um segundo mercado cedo demais é maior do que o risco de esperar demais: entrar tarde custa tempo, entrar cedo demais custa foco e dinheiro num momento em que a empresa ainda não tem os dois sobrando.

### Depois de Portugal, qual é a ordem natural

O caminho mais lógico é começar por mercados de língua portuguesa — Brasil sendo o mais óbvio, já com base técnica iniciada — antes de ir para regras fiscais e idiomas completamente diferentes na Europa. Isso reduz a complexidade de tradução e suporte no primeiro salto internacional, deixando a complexidade regulatória real (que existe de qualquer forma, mesmo entre Portugal e Brasil) como o desafio principal a resolver por vez.

## Visão de mais longo prazo

Sem previsão de faturamento, sem número de clientes inventado. Isto é sobre o tipo de empresa que o Teglion se torna se a tese se confirmar — não uma promessa financeira.

**Produto.** O Teglion deixa de ser "o sistema onde o escritório organiza clientes e documentos" e passa a ser o sistema operacional do escritório de contabilidade — o lugar de onde o dono enxerga tudo: quem são os clientes, o que está pendente, onde está o gargalo da semana. Módulos que hoje são independentes (documentos, obrigações, mensagens, agenda, captação) convergem para uma visão só, em vez de telas separadas que o usuário precisa cruzar mentalmente.

**Tecnologia.** O núcleo técnico amadurece nos pontos que a auditoria de 2026 identificou como dívida consciente, não ignorada: isolamento entre escritórios deixa de depender só de disciplina de código e passa a ter uma segunda camada real no banco de dados; observabilidade deixa de ser "descobrimos pelo Sentry, se estiver configurado" e passa a ter métricas e alertas ativos; processamento pesado (email, sincronização, geração de relatório) sai de dentro da requisição HTTP e vira trabalho assíncrono de verdade, com fila, retentativa e monitoramento. Nenhum desses pontos exige reescrever o sistema — exige terminar de construir o que já foi desenhado corretamente, mas não finalizado.

**Mercado.** Portugal continua sendo a base — é onde o produto nasceu, onde tem cliente real, e onde a regulação fiscal é mais bem compreendida pelo time. Expansão para outros mercados de língua portuguesa e, depois, Europa, acontece quando o modelo em Portugal provar que se sustenta sozinho — não como aposta paralela.

**Automação e IA.** Hoje o Teglion organiza o trabalho manual do escritório; não o substitui. O caminho plausível de médio prazo é IA aplicada a tarefas específicas e verificáveis — sugerir categorização de um documento recebido, rascunhar uma resposta a um cliente para o contador revisar, identificar um prazo em risco antes que vire atraso. Não é automação genérica: é reduzir cliques em tarefas que hoje o contador faz manualmente, mantendo ele no controle da decisão final. Não existe hoje nenhuma dessas funcionalidades implementada — é caminho, não estado atual.

**Ecossistema e integrações.** Google Calendar e Google Drive já mostram o padrão: integrar com as ferramentas que o escritório já usa em vez de forçar migração completa para dentro do Teglion. O próximo passo natural nessa linha é Stripe Connect — permitir que o próprio escritório receba pagamento dos seus clientes através da plataforma — cuja base já está construída, ainda desligada por padrão em produção (ver [`docs/architecture/INTEGRATIONS.md`](../architecture/INTEGRATIONS.md)) — e integrações com sistemas contábeis/fiscais locais conforme cada mercado exigir.

**Escala.** O teste real não é "quantos escritórios cabem tecnicamente" — é "quantos escritórios o produto consegue atender bem, com onboarding que não depende de alguém da equipe explicar por telefone, suporte que responde rápido, e cobrança que funciona sozinha". Chegar a centenas de escritórios de forma saudável é mais sobre operação madura do que sobre servidor maior. Hoje o produto tem quatro escritórios pilotos em uso real — não existe evidência de que o sistema já foi testado além disso (ver `docs/ROADMAP.md`), e qualquer afirmação sobre capacidade de escala além desse número é visão, não fato comprovado.

---

Se der certo, o Teglion não é mais "um sistema que uma contadora usa". É a camada onde escritórios de contabilidade e serviços profissionais administram a relação inteira com os próprios clientes — começando em Portugal, sem pressa de provar isso em nenhum outro lugar antes da hora.
