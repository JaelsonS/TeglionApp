# Modelo de negócio e monetização

> Aqui eu consolidei o conteúdo que antes estava espalhado em `docs/08-BUSINESS/BILLING.md`, `docs/08-BUSINESS/MONETIZATION.md`, `docs/08-BUSINESS/PLANS.md` e `docs/08-BUSINESS/FEATURE-GATING.md` (arquivos que removi nesta reorganização de 19/08/2026). Para a lógica de sequenciamento por trás dessas decisões, ver [PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md). Não tenho hoje número de MRR, ARR, quantidade de clientes pagantes ou valuation comprovados — nenhum desses dados aparece aqui porque nenhum confirmei nos documentos-fonte ou no código; qualquer menção a esse tipo de métrica seria invenção minha.

## Como o Teglion ganha dinheiro hoje — IMPLEMENTADO

Assinatura mensal ou anual paga pelo escritório de contabilidade — não pelo cliente final dele. É um modelo B2B simples: o escritório paga para usar a plataforma, e o portal do cliente final vem incluído nesse acesso, sem cobrança separada.

Hoje tenho um único plano, dois ciclos de cobrança: 35€/mês no mensal, 359,88€/ano no anual (equivalente a 29,99€/mês), com 14 dias de teste grátis sem pedir cartão. Sem diferenciação de recurso — todo escritório com assinatura ativa tem acesso ao mesmo conjunto de funcionalidades. Já implementei e verifiquei na auditoria de 12/08/2026 o fluxo completo de checkout até assinatura ativa, o portal de autoatendimento para o escritório gerenciar a própria assinatura, o processamento de webhook com verificação de assinatura e proteção real contra reprocessamento duplicado — nada disso é maquete. Reavalio o acesso ao produto a cada renovação de sessão, então uma mudança de status de pagamento se reflete rápido. A calculadora de preço nunca fica fixa em código — vem de configuração central, o padrão que considero correto para evitar preço divergente entre o site, o app e o Stripe.

### O que precisa de atenção antes de cobrar em escala

**Sem tolerância em falha de pagamento.** Corte de acesso é imediato, sem aviso prévio ao escritório. Numa base pequena isso ainda dá para administrar manualmente; numa base maior, vira motivo de reclamação evitável.

**A duração do teste grátis não segue a variável de configuração que parece controlá-la** — deixei ela fixa em outro lugar do código. Risco de eu (ou alguém) mudar a configuração errada achando que mudou o comportamento real.

**Segredos de produção do Stripe** estão hoje presentes num ambiente local sem rotação — tratei isso com prioridade no Sprint 0 do roadmap técnico — já concluído, ver [`docs/ROADMAP.md`](../ROADMAP.md), item 0.5.

**Sem teste automatizado cobrindo o processamento de webhook** — o caminho mais crítico do billing ainda não tem rede de segurança de teste.

O código de billing está pronto para cobrar cliente real. O que falta não é código — é confirmação operacional (as chaves de produção certas realmente configuradas em produção, rotacionadas depois da exposição que identifiquei na auditoria) e uma decisão consciente minha sobre tolerância em falha de pagamento antes de escalar para múltiplos escritórios pagantes.

## Por que um plano único, por enquanto

Diferenciar por tier (mais clientes, mais usuários, mais armazenamento, recursos avançados) só faz sentido, pra mim, quando existe uma base de clientes grande o bastante para a segmentação ser real, não hipotética. Lançar múltiplos planos cedo demais, sem entender o que cada perfil de escritório realmente valoriza, é mais chute que estratégia.

## A estrutura de planos futuros — PLANEJADO, nada implementado

Sem preço definido. O que documento aqui é a lógica de segmentação, não um valor em euros — os nomes abaixo são placeholders meus, o que importa é o conceito de cada degrau, não o rótulo.

**FREE/TRIAL** — o que já tenho hoje: acesso completo por tempo limitado, sem cartão, para o escritório validar o produto antes de decidir.

**STARTER** — o próximo degrau lógico: limite de quantidade de clientes e de usuários mais apertado, sem recursos avançados (página pública customizada, IA, automações), pensado para o escritório pequeno testando o produto como ferramenta principal pela primeira vez.

**PRO** — o plano que hoje já tenho, essencialmente: uso completo dos módulos centrais (clientes, documentos, mensagens, obrigações, agenda, captação de serviço), com limites mais generosos de clientes e usuários.

**BUSINESS** — para escritórios maiores: mais usuários, mais armazenamento, relatórios mais avançados, prioridade de suporte.

**ENTERPRISE** — negociado caso a caso, para escritórios com necessidade específica de integração, volume ou processo de compra corporativo.

O que cada tier controlaria, conceitualmente: limite de clientes cadastrados, limite de usuários da equipe, limite de armazenamento de documento, limite de emails enviados por mês, disponibilidade de página pública, domínio personalizado, funcionalidades de IA, quantidade de serviços publicáveis, quantidade de agendamentos por mês, automações, relatórios avançados.

**Add-ons**, comprados separadamente do plano base: página pública, domínio personalizado, geração de conteúdo com IA, pacote adicional de emails, armazenamento extra, usuário adicional além do limite do plano — cada um vendável como módulo avulso sobre qualquer plano base, sem forçar upgrade completo de tier só para acessar um recurso específico.

A segmentação por plano só vai fazer sentido, na minha visão, quando eu tiver uma base de clientes real mostrando quais recursos cada perfil de escritório valoriza de verdade. Lançar tiers baseado em suposição, antes disso, é mais chute que estratégia.

## Próximas camadas de monetização — PLANEJADO, exceto Stripe Connect

**Planos com diferenciação de recurso** — hoje não tenho, é o passo mais próximo na minha fila (detalhado acima).

**Add-ons vendáveis separadamente do plano base** — página pública, domínio personalizado, IA, pacote extra de email, armazenamento adicional, usuário adicional. A lógica que sigo: o escritório não deveria precisar subir de tier inteiro só para comprar um recurso específico que quer.

**Stripe Connect — transação entre escritório e cliente final.** Diferente das outras camadas listadas aqui, já construí isso: conta Stripe Express por escritório, checkout com taxa de plataforma retida automaticamente, webhook próprio com idempotência. Deixei desligado por padrão (ativação por variável de ambiente) e ainda tenho lacunas reais — sem teste automatizado no fluxo de pagamento, e compartilha o ponto de risco de corrida de condição no agendamento público que descrevi em [FEATURES.md](./FEATURES.md). Ver [`docs/architecture/INTEGRATIONS.md`](../architecture/INTEGRATIONS.md) para o estado completo.

Cada camada depende da anterior estar validada. Vender add-on antes de ter um plano segmentado que faça sentido é confuso para o cliente. Buscar receita transacional via Stripe Connect antes da assinatura básica estar madura e estável me distrai de resolver o problema mais simples primeiro. A sequência de negócio que escolhi segue a mesma lógica do roadmap técnico (`docs/ROADMAP.md`): resolver o degrau de baixo antes de construir o de cima.

## Feature gating e entitlements

Já construí um módulo de entitlements real — uma função central que responde se um escritório pode usar uma funcionalidade ou está dentro de um limite de recurso — já com interface definida e já consultada por pelo menos um módulo do produto: Stripe Connect, para a funcionalidade de pagamento online. Isso está **EM DESENVOLVIMENTO**, não PLANEJADO nem inexistente: já construí o encaixe, falta preencher a regra.

O ponto mais importante: deixei esse módulo, hoje, em **modo aberto** — toda funcionalidade testada retorna "permitido", sem checagem real de plano ou limite. O comentário que deixei no próprio código descreve isso como "camada comercial futura... nesta fase, modo open: tudo permitido". Fora desse módulo, não tenho diferenciação de funcionalidade por plano em nenhum outro ponto do código — o controle de acesso da assinatura (ativa, em teste, suspensa, teste expirado) segue binário: usa o produto ou não usa, sem granularidade de recurso.

Deixei assim de propósito. Restringir funcionalidade por plano antes de entender, com clientes reais, o que cada perfil de escritório realmente valoriza a ponto de pagar mais por isso, seria decisão tomada no escuro. Na fase de validação — que é onde estou agora — deixar tudo aberto me permite descobrir isso com dado real de uso, não com suposição.

O padrão certo, que já uso e não é só recomendação teórica, é todo ponto sensível do produto consultar essa camada central de entitlements em vez de checar plano diretamente em cada módulo — o que evita espalhar "se o plano for X, libera Y" por dentro do código, uma teia impossível de manter depois. Exemplos conceituais do que essa camada controlaria quando eu tirar ela do modo aberto: quantidade de clientes cadastrados, quantidade de usuários da equipe, quantidade de emails enviados por mês, disponibilidade de página pública, domínio personalizado, funcionalidades de IA, banners e customização visual, armazenamento de documento, quantidade de serviços publicáveis, quantidade de agendamentos, automações, integrações avançadas, relatórios — além do pagamento online, que já é o primeiro caso real de uso.

Não pretendo fazer a transição do modo aberto para regra real de negócio antes de ter um número real de escritórios pagantes suficiente para a segmentação fazer sentido, e antes dos planos terem uma estrutura de tier decidida com alguma base em comportamento real de cliente, não só em teoria.

## O que isso significa para a fase atual

Enquanto estou na fase de validação e primeiros clientes pagantes, deixo várias funcionalidades abertas para todo mundo, sem restrição por plano — de propósito, não por esquecimento. Restringir cedo demais atrapalharia a validação de qual funcionalidade realmente importa para o escritório pagar mais. A transição para funcionalidade vinculada a plano é uma decisão consciente minha de fase comercial, não um acidente de implementação incompleta.
