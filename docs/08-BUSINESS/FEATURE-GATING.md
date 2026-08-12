# Feature gating e entitlements

## O que existe hoje — correção sobre a primeira leitura

A primeira versão deste documento, ainda em 12/08/2026, dizia que não existia nada além do controle binário de acesso da assinatura. Isso estava incompleto: existe, sim, um módulo de entitlements (`can(firmId, featureKey)` / `limit(firmId, resourceKey)`), já com uma interface real e já sendo consultado por pelo menos um módulo do produto (Stripe Connect, para a funcionalidade `payments.online`). O erro anterior veio de uma busca que não cobriu esse módulo — vale registrar o erro, não só a correção.

O que é verdade, e continua sendo o ponto mais importante: esse módulo está, hoje, em **modo aberto** — toda funcionalidade testada retorna "permitido", sem checagem real de plano ou limite. O próprio comentário no código descreve isso como "camada comercial futura... nesta fase, modo open: tudo permitido". Ou seja, a interface certa já existe — só ainda não tem regra de negócio por trás dela. Isso é EM DESENVOLVIMENTO, não PLANEJADO nem NÃO EXISTE: o encaixe já foi construído, falta preencher.

Fora esse módulo, continua não existindo diferenciação de funcionalidade por plano em nenhum outro ponto do código — o gate de acesso da assinatura (`TRIAL`, `ACTIVE`, `SUSPENDED`, `TRIAL_EXPIRED`) segue sendo binário: usa o produto ou não usa, sem granularidade de recurso.

## Por que está assim de propósito

Restringir funcionalidade por plano antes de entender, com clientes reais, o que cada perfil de escritório realmente valoriza a ponto de pagar mais por isso, é decisão tomada no escuro. Na fase de validação — que é onde o produto está agora — deixar tudo aberto permite descobrir isso com dado real de uso, não com suposição.

**FASE ATUAL: funcionalidades abertas para validação, através de um módulo de entitlements que já existe mas está em modo aberto. FASE COMERCIAL: esse mesmo módulo passa a aplicar regra real de plano e limite.** A transição entre uma e outra é uma decisão de negócio a ser tomada conscientemente — o mecanismo técnico para isso já está parcialmente pronto, o que falta é a regra de negócio e a decisão de quando ativá-la.

## A estratégia, já parcialmente em prática

O padrão certo — que já está em uso, não é só uma recomendação teórica — é: todo ponto sensível do produto consulta a camada central de entitlements (`can`/`limit`) em vez de checar plano diretamente. Isso evita a armadilha de espalhar "se o plano for X, libera Y" por dentro de cada módulo, o que viraria uma teia impossível de manter. O próximo passo natural é estender esse mesmo padrão para outros pontos do produto além de pagamento online, e trocar o modo aberto por regra real quando fizer sentido comercial.

## Exemplos conceituais do que essa camada controlaria, quando sair do modo aberto

Quantidade de clientes cadastrados, quantidade de usuários da equipe, quantidade de emails enviados por mês, disponibilidade de página pública, domínio personalizado, funcionalidades de IA e geração de conteúdo, banners e customização visual, armazenamento de documento, quantidade de serviços publicáveis, quantidade de agendamentos, automações, integrações avançadas, relatórios — além de `payments.online`, que já é o primeiro caso real de uso.

## Quando isso deve sair do modo aberto

Não antes de existir um número real de escritórios pagantes suficiente para a segmentação fazer sentido, e não antes dos [planos](./PLANS.md) terem uma estrutura de tier decidida com alguma base em comportamento real de cliente, não só em teoria.
