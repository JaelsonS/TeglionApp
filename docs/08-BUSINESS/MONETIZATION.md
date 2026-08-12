# Monetização

## Hoje — IMPLEMENTADO

Assinatura mensal ou anual, paga pelo escritório, um único plano. É o modelo mais simples possível de SaaS B2B, e é o que está de fato funcionando (ver [BILLING.md](./BILLING.md)).

## Próximas camadas — PLANEJADO, nenhuma implementada ainda

**Planos com diferenciação de recurso.** Detalhado em [PLANS.md](./PLANS.md) — hoje não existe, é o passo mais próximo na fila.

**Add-ons vendáveis separadamente do plano base.** Página pública, domínio personalizado, IA, pacote extra de email, armazenamento adicional, usuário adicional. A lógica: o escritório não deveria precisar subir de tier inteiro só para comprar um recurso específico que ele quer.

**Stripe Connect — transação entre escritório e cliente final.** Diferente do que a primeira leitura deste marco de documentação registrou, isso já está construído: conta Stripe Express por escritório, checkout com taxa de plataforma retida automaticamente (`application_fee_amount`), webhook próprio com idempotência. Está desligado por padrão (ativação por variável de ambiente) e tem lacunas reais — sem teste automatizado no fluxo de pagamento, e compartilha a corrida de condição do agendamento público. Ver [STRIPE-CONNECT.md](../05-INTEGRACOES/STRIPE-CONNECT.md) para o estado completo, já corrigido.

## A ordem importa

Cada camada depende da anterior estar validada. Vender add-on antes de ter um plano segmentado que faça sentido é confuso para o cliente. Buscar receita transacional via Stripe Connect antes da assinatura básica estar madura e estável distrai de resolver o problema mais simples primeiro. A sequência de negócio segue a mesma lógica do [roadmap técnico](../02-ROADMAP/ROADMAP.md): resolver o degrau de baixo antes de construir o de cima.
