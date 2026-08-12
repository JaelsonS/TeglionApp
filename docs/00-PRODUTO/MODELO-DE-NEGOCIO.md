# Modelo de negócio

## Como o Teglion ganha dinheiro hoje

Assinatura mensal ou anual paga pelo escritório de contabilidade — não pelo cliente final dele. É um modelo B2B simples: o escritório paga para usar a plataforma, e o portal do cliente final é incluído nesse acesso, sem cobrança separada.

Hoje existe um único plano, dois ciclos de cobrança: 35€/mês no mensal, 359,88€/ano no anual (equivalente a 29,99€/mês), com 14 dias de teste grátis sem pedir cartão. Isso está implementado e funcionando (checkout, portal de gestão da assinatura, renovação automática — ver [BILLING.md](../08-BUSINESS/BILLING.md)).

## Por que um plano único, por enquanto

Diferenciar por tier (mais clientes, mais usuários, mais armazenamento, recursos avançados) só faz sentido quando existe uma base de clientes grande o bastante para a segmentação ser real, não hipotética. Lançar múltiplos planos cedo demais, sem entender o que cada perfil de escritório realmente valoriza, é mais chute que estratégia. A estrutura de planos futuros já está pensada — ver [PLANS.md](../08-BUSINESS/PLANS.md) — mas não implementada de propósito.

## Como o negócio deve crescer, em ordem

1. **Assinatura do escritório** (hoje) — a base do negócio, já funcionando.
2. **Planos diferenciados por tier** (futuro próximo) — quando a base de clientes justificar a segmentação, com uma camada de entitlements central em vez de checagem de plano espalhada pelo código (ver [FEATURE-GATING.md](../08-BUSINESS/FEATURE-GATING.md)).
3. **Add-ons vendáveis separadamente** (futuro) — página pública, domínio personalizado, IA, mais armazenamento, mais usuários — cada um vendido como extra sobre o plano base.
4. **Stripe Connect** (construído, ainda desligado por padrão) — o escritório recebendo pagamento dos próprios clientes através da plataforma, com taxa de serviço retida automaticamente. Diferente de outros itens desta lista, a base técnica já existe — falta decidir quando ativar em produção e fechar as lacunas conhecidas (teste automatizado, proteção contra corrida de condição no agendamento pago). Ver [STRIPE-CONNECT.md](../05-INTEGRACOES/STRIPE-CONNECT.md).

## O que isso significa para a fase atual

Enquanto o produto está em fase de validação e primeiros clientes pagantes, várias funcionalidades ficam abertas para todo mundo, sem restrição por plano — de propósito, não por esquecimento. Restringir cedo demais atrapalha a validação de qual funcionalidade realmente importa para o escritório pagar mais. A transição para funcionalidade vinculada a plano é uma decisão consciente de fase comercial, documentada com o motivo em [FEATURE-GATING.md](../08-BUSINESS/FEATURE-GATING.md).
