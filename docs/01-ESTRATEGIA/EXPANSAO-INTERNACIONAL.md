# Expansão internacional

A visão de longo prazo é clara: o Teglion não pretende ser uma ferramenta só para Portugal para sempre. A visão é virar uma plataforma para escritórios de contabilidade e serviços profissionais que funcione em vários países — começando em Portugal, expandindo quando fizer sentido de negócio, não por ambição abstrata de "ser global".

## Por que Portugal primeiro, sem pressa de sair

O piloto real, o conhecimento de regra fiscal, o relacionamento com o primeiro cliente pagante — tudo isso está em Portugal. Abrir um segundo país antes de Portugal estar validado dilui atenção e recurso numa fase em que os dois são escassos. A ordem certa é: provar que o modelo funciona e se sustenta num mercado, depois replicar — não os dois ao mesmo tempo.

## O que já existe de base técnica (e o que isso não significa)

A arquitetura já tem, hoje, uma forma real de configurar comportamento por país — idioma, moeda, formato de identificação fiscal, timezone, e quais funcionalidades (como o calendário fiscal) estão disponíveis para cada país. Portugal e Brasil já estão cadastrados nesse mecanismo.

Isso é uma capacidade arquitetural real, verificada em código — não é o mesmo que "pronto para operar no Brasil". Hoje, o Brasil está cadastrado com o calendário fiscal explicitamente marcado como "em preparação" — o sistema sabe que não tem esse conteúdo ainda e não finge que tem. A distância entre "a arquitetura permite" e "está pronto para vender em outro país" é justamente conteúdo fiscal local, integrações locais, suporte no fuso e idioma certos, e validação de que o modelo de negócio funciona lá. Isso é trabalho de produto e de mercado, não só de código — está detalhado em [INTERNATIONALIZATION.md](../08-BUSINESS/INTERNATIONALIZATION.md).

## Quando isso entra no roadmap

Só no Sprint 5 (ver [LONG-TERM.md](../02-ROADMAP/LONG-TERM.md)), depois de Portugal estar em ritmo de crescimento sustentável — múltiplos escritórios pagantes, retenção validada, operação estável. Não antes. O risco de abrir um segundo mercado cedo demais é maior do que o risco de esperar demais: entrar tarde custa tempo, entrar cedo demais custa foco e dinheiro num momento em que a empresa ainda não tem os dois sobrando.

## Depois de Portugal, qual é a ordem natural

O caminho mais lógico é começar por mercados de língua portuguesa (Brasil sendo o mais óbvio, já com base técnica iniciada) antes de ir para regras fiscais e idiomas completamente diferentes na Europa. Isso reduz a complexidade de tradução e suporte no primeiro salto internacional, deixando a complexidade regulatória real (que existe de qualquer forma, mesmo entre Portugal e Brasil) como o desafio principal a resolver por vez.
