# Stripe

Este documento é sobre o billing do próprio Teglion — o escritório pagando a assinatura da plataforma. Para o Stripe Connect (escritório recebendo pagamento dos próprios clientes através da plataforma), ver [STRIPE-CONNECT.md](./STRIPE-CONNECT.md) — são duas coisas completamente diferentes, e é fácil confundir uma com a outra.

**Status: IMPLEMENTADO**, com ressalvas reais que precisam ser lidas, não puladas.

## O que funciona

Checkout, criação e busca de cliente no Stripe, portal de autoatendimento para o escritório gerenciar a própria assinatura, e processamento de webhook com verificação de assinatura antes de aceitar qualquer evento — tudo isso está implementado e verificado em código, não é placeholder.

A proteção contra reprocessar o mesmo evento duas vezes é real, não decorativa: existe uma restrição no banco de dados que impede duas gravações do mesmo identificador de evento, e uma tentativa duplicada é descartada de forma segura em vez de causar um efeito colateral duplicado (como cobrar duas vezes ou reativar uma assinatura já processada).

O acesso do escritório ao produto é reavaliado a cada renovação do token de sessão — a cada quinze minutos, aproximadamente — então uma mudança de status de assinatura (cancelamento, pagamento recusado) se reflete rápido, não só no próximo login.

Se a chave do Stripe não estiver configurada em algum ambiente, o sistema não quebra — degrada de forma controlada, recusando a operação específica que dependia do Stripe, sem derrubar o resto do produto.

## Ressalvas reais

**Sem tolerância em falha de pagamento.** Hoje, uma falha de cobrança suspende o acesso do escritório imediatamente, sem uma janela de aviso antes de cortar. Para os primeiros clientes pagantes, essa é uma decisão que vale tomar conscientemente — avisar antes de suspender — em vez de deixar como está por padrão.

**A duração do período de teste grátis não é configurável de fato**, apesar de existir uma variável de ambiente que parece controlar isso — o valor real usado na concessão do teste está fixo no código, independente dessa variável. É um risco de configuração enganosa: alguém pode mudar a variável achando que muda o teste, e nada acontece.

**Nenhum teste automatizado cobre o processamento do webhook** — o caminho financeiro mais crítico do produto, hoje, não tem rede de segurança de teste.

**Segredos de produção**, incluindo a chave real do Stripe, estão hoje presentes num ambiente local, sem rotação — ver [MULTI-TENANT-SECURITY.md](../06-SEGURANCA/MULTI-TENANT-SECURITY.md) e o [Sprint 0](../02-ROADMAP/SPRINT-0.md) para o detalhe completo desse risco.

## O modelo comercial hoje

Um único plano, dois ciclos de cobrança — 35€ por mês, ou 359,88€ por ano (equivalente a 29,99€/mês) — com 14 dias de teste grátis sem pedir cartão. Sem diferenciação de recurso por tier ainda; isso é estratégia futura, documentada em [PLANS.md](../08-BUSINESS/PLANS.md), não implementação atual.
