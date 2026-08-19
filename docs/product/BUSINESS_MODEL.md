# Modelo de negócio e monetização

> Este documento consolida conteúdo antes espalhado em `docs/08-BUSINESS/BILLING.md`, `docs/08-BUSINESS/MONETIZATION.md`, `docs/08-BUSINESS/PLANS.md` e `docs/08-BUSINESS/FEATURE-GATING.md` (arquivos removidos nesta reorganização de 19/08/2026). Para a lógica de sequenciamento por trás dessas decisões, ver [PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md). Não existe hoje número de MRR, ARR, quantidade de clientes pagantes ou valuation comprovados — nenhum desses dados aparece aqui porque nenhum foi confirmado nos documentos-fonte ou no código; qualquer menção a esse tipo de métrica seria invenção.

## Como o Teglion ganha dinheiro hoje — IMPLEMENTADO

Assinatura mensal ou anual paga pelo escritório de contabilidade — não pelo cliente final dele. É um modelo B2B simples: o escritório paga para usar a plataforma, e o portal do cliente final é incluído nesse acesso, sem cobrança separada.

Hoje existe um único plano, dois ciclos de cobrança: 35€/mês no mensal, 359,88€/ano no anual (equivalente a 29,99€/mês), com 14 dias de teste grátis sem pedir cartão. Sem diferenciação de recurso — todo escritório com assinatura ativa tem acesso ao mesmo conjunto de funcionalidades. O fluxo completo de checkout até assinatura ativa, o portal de autoatendimento para o escritório gerenciar a própria assinatura, o processamento de webhook com verificação de assinatura e proteção real contra reprocessamento duplicado estão implementados e verificados na auditoria de 12/08/2026 — nada disso é maquete. O acesso ao produto é reavaliado a cada renovação de sessão, então uma mudança de status de pagamento se reflete rápido. A calculadora de preço nunca fica fixa em código — vem de configuração central, o padrão correto para evitar preço divergente entre o site, o app e o Stripe.

### O que precisa de atenção antes de cobrar em escala

**Sem tolerância em falha de pagamento.** Corte de acesso é imediato, sem aviso prévio ao escritório. Numa base pequena isso é administrável manualmente; numa base maior, vira motivo de reclamação evitável.

**A duração do teste grátis não segue a variável de configuração que parece controlá-la** — está fixa em outro lugar do código. Risco de alguém mudar a configuração errada achando que mudou o comportamento real.

**Segredos de produção do Stripe** estão hoje presentes num ambiente local sem rotação — tratado com prioridade no Sprint 0 do roadmap técnico — já concluído, ver [`docs/ROADMAP.md`](../ROADMAP.md), item 0.5.

**Sem teste automatizado cobrindo o processamento de webhook** — o caminho mais crítico do billing não tem rede de segurança de teste hoje.

O código de billing está pronto para cobrar cliente real. O que falta não é código — é confirmação operacional (as chaves de produção certas realmente configuradas em produção, rotacionadas depois da exposição identificada na auditoria) e a decisão consciente sobre tolerância em falha de pagamento antes de escalar para múltiplos escritórios pagantes.

## Por que um plano único, por enquanto

Diferenciar por tier (mais clientes, mais usuários, mais armazenamento, recursos avançados) só faz sentido quando existe uma base de clientes grande o bastante para a segmentação ser real, não hipotética. Lançar múltiplos planos cedo demais, sem entender o que cada perfil de escritório realmente valoriza, é mais chute que estratégia.

## A estrutura de planos futuros — PLANEJADO, nada implementado

Sem preço definido. O que se documenta aqui é a lógica de segmentação, não um valor em euros — os nomes abaixo são placeholders, o que importa é o conceito de cada degrau, não o rótulo.

**FREE/TRIAL** — o que já existe hoje: acesso completo por tempo limitado, sem cartão, para o escritório validar o produto antes de decidir.

**STARTER** — o próximo degrau lógico: limite de quantidade de clientes e de usuários mais apertado, sem recursos avançados (página pública customizada, IA, automações), pensado para o escritório pequeno testando o produto como ferramenta principal pela primeira vez.

**PRO** — o plano que hoje já existe, essencialmente: uso completo dos módulos centrais (clientes, documentos, mensagens, obrigações, agenda, captação de serviço), com limites mais generosos de clientes e usuários.

**BUSINESS** — para escritórios maiores: mais usuários, mais armazenamento, relatórios mais avançados, prioridade de suporte.

**ENTERPRISE** — negociado caso a caso, para escritórios com necessidade específica de integração, volume ou processo de compra corporativo.

O que cada tier controlaria, conceitualmente: limite de clientes cadastrados, limite de usuários da equipe, limite de armazenamento de documento, limite de emails enviados por mês, disponibilidade de página pública, domínio personalizado, funcionalidades de IA, quantidade de serviços publicáveis, quantidade de agendamentos por mês, automações, relatórios avançados.

**Add-ons**, comprados separadamente do plano base: página pública, domínio personalizado, geração de conteúdo com IA, pacote adicional de emails, armazenamento extra, usuário adicional além do limite do plano — cada um vendável como módulo avulso sobre qualquer plano base, sem forçar upgrade completo de tier só para acessar um recurso específico.

A segmentação por plano só faz sentido quando existe uma base de clientes real mostrando quais recursos cada perfil de escritório valoriza de verdade. Lançar tiers baseado em suposição, antes disso, é mais chute que estratégia.

## Próximas camadas de monetização — PLANEJADO, exceto Stripe Connect

**Planos com diferenciação de recurso** — hoje não existe, é o passo mais próximo na fila (detalhado acima).

**Add-ons vendáveis separadamente do plano base** — página pública, domínio personalizado, IA, pacote extra de email, armazenamento adicional, usuário adicional. A lógica: o escritório não deveria precisar subir de tier inteiro só para comprar um recurso específico que quer.

**Stripe Connect — transação entre escritório e cliente final.** Diferente das outras camadas listadas aqui, isso já está construído: conta Stripe Express por escritório, checkout com taxa de plataforma retida automaticamente, webhook próprio com idempotência. Está desligado por padrão (ativação por variável de ambiente) e tem lacunas reais — sem teste automatizado no fluxo de pagamento, e compartilha o ponto de risco de corrida de condição no agendamento público descrito em [FEATURES.md](./FEATURES.md). Ver [`docs/architecture/INTEGRATIONS.md`](../architecture/INTEGRATIONS.md) para o estado completo.

Cada camada depende da anterior estar validada. Vender add-on antes de ter um plano segmentado que faça sentido é confuso para o cliente. Buscar receita transacional via Stripe Connect antes da assinatura básica estar madura e estável distrai de resolver o problema mais simples primeiro. A sequência de negócio segue a mesma lógica do roadmap técnico (`docs/ROADMAP.md`): resolver o degrau de baixo antes de construir o de cima.

## Feature gating e entitlements

Existe hoje um módulo de entitlements real — uma função central que responde se um escritório pode usar uma funcionalidade ou está dentro de um limite de recurso — já com interface definida e já consultada por pelo menos um módulo do produto: Stripe Connect, para a funcionalidade de pagamento online. Isso é **EM DESENVOLVIMENTO**, não PLANEJADO nem inexistente: o encaixe já foi construído, falta preencher a regra.

O ponto mais importante: esse módulo está, hoje, em **modo aberto** — toda funcionalidade testada retorna "permitido", sem checagem real de plano ou limite. O comentário no próprio código descreve isso como "camada comercial futura... nesta fase, modo open: tudo permitido". Fora desse módulo, não existe diferenciação de funcionalidade por plano em nenhum outro ponto do código — o controle de acesso da assinatura (ativa, em teste, suspensa, teste expirado) segue binário: usa o produto ou não usa, sem granularidade de recurso.

Isso está assim de propósito. Restringir funcionalidade por plano antes de entender, com clientes reais, o que cada perfil de escritório realmente valoriza a ponto de pagar mais por isso, é decisão tomada no escuro. Na fase de validação — que é onde o produto está agora — deixar tudo aberto permite descobrir isso com dado real de uso, não com suposição.

O padrão certo, já em uso e não só recomendação teórica, é todo ponto sensível do produto consultar essa camada central de entitlements em vez de checar plano diretamente em cada módulo — o que evita espalhar "se o plano for X, libera Y" por dentro do código, uma teia impossível de manter depois. Exemplos conceituais do que essa camada controlaria quando sair do modo aberto: quantidade de clientes cadastrados, quantidade de usuários da equipe, quantidade de emails enviados por mês, disponibilidade de página pública, domínio personalizado, funcionalidades de IA, banners e customização visual, armazenamento de documento, quantidade de serviços publicáveis, quantidade de agendamentos, automações, integrações avançadas, relatórios — além do pagamento online, que já é o primeiro caso real de uso.

A transição do modo aberto para regra real de negócio não deve acontecer antes de existir um número real de escritórios pagantes suficiente para a segmentação fazer sentido, e não antes dos planos terem uma estrutura de tier decidida com alguma base em comportamento real de cliente, não só em teoria.

## O que isso significa para a fase atual

Enquanto o produto está em fase de validação e primeiros clientes pagantes, várias funcionalidades ficam abertas para todo mundo, sem restrição por plano — de propósito, não por esquecimento. Restringir cedo demais atrapalha a validação de qual funcionalidade realmente importa para o escritório pagar mais. A transição para funcionalidade vinculada a plano é uma decisão consciente de fase comercial, não um acidente de implementação incompleta.
