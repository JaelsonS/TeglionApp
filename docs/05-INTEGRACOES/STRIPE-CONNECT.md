# Stripe Connect

**Status: IMPLEMENTADO** — corrigido depois de uma checagem adicional em 12/08/2026. A primeira leitura da auditoria deste marco havia classificado isto como "não existe"; essa leitura estava errada, porque a busca original não encontrou o módulo dedicado (`backend/src/modules/connect/`) nem as migrations correspondentes. Ficou corrigido aqui assim que o erro apareceu, e é registrado de propósito, porque documentação que esconde o próprio erro de leitura vale menos que uma que o mostra.

Este documento é sobre o cliente final do escritório pagando o escritório através da plataforma — diferente do [Stripe do Teglion](./STRIPE.md), onde o escritório paga a assinatura da plataforma.

## O que está construído

O escritório cria uma conta Stripe Express através de um fluxo de onboarding padrão do Stripe (Account Links) — só o dono do escritório pode iniciar essa conexão, e só depois de aceitar explicitamente uma política de pagamentos online, com o aceite registrado de forma auditável (IP, navegador, versão do texto e hash do texto aceito, não só um checkbox marcado sem rastro).

Uma vez a conta pronta para receber pagamento, um serviço do catálogo pode ser marcado como exigindo pagamento no ato do agendamento. Nesse caso, o cliente final paga através de um Checkout do Stripe processado diretamente na conta do escritório (não da conta do Teglion), com uma taxa de plataforma retida automaticamente sobre o valor — hoje configurada em 2%, ajustável por variável de ambiente. O agendamento fica reservado como "aguardando pagamento" por 30 minutos; se o pagamento não se completar nesse prazo, a reserva expira sozinha e o horário volta a ficar disponível.

O processamento de confirmação de pagamento passa por webhook dedicado (`/api/public/stripe/connect/webhook`, separado do webhook de billing do Teglion), com verificação de assinatura antes de aceitar qualquer evento, e a mesma proteção contra reprocessamento duplicado usada no billing principal (registro do identificador do evento antes de processar). Estorno é tratado: o pagamento é marcado como estornado, mas o agendamento em si permanece confirmado — o cancelamento do agendamento correspondente é uma decisão manual do escritório, não automática. Essa é uma escolha deliberada da primeira versão, não uma lacuna escondida.

## O que ainda precisa de atenção

**Nenhum teste automatizado cobre o fluxo de pagamento nem o processamento do webhook** — existe um teste para a lógica de derivação de status de onboarding, mas não para o caminho financeiro em si. É o mesmo tipo de lacuna já identificada no billing principal do Teglion.

**Compartilha a mesma corrida de condição do agendamento público** descrita em [BOOKING.md](../03-PRODUTO/BOOKING.md) e no [Sprint 0](../02-ROADMAP/SPRINT-0.md): a checagem de disponibilidade e a criação da reserva não são protegidas por transação ou restrição exclusiva no banco. Isso é ainda mais sério aqui do que no agendamento gratuito, porque envolve dinheiro real — se dois clientes tentarem pagar pelo mesmo horário ao mesmo tempo, ambos podem conseguir iniciar um Checkout antes de qualquer um dos dois efetivamente pagar.

**Ativação é por variável de ambiente**, desligada por padrão — hoje é uma decisão consciente de quando ligar isso em produção, não algo que já está ativo silenciosamente.

## Por que isso muda a leitura de "quando isso entra no roadmap"

A [visão de longo prazo](../02-ROADMAP/VISION-2030.md) e o [modelo de negócio](../00-PRODUTO/MODELO-DE-NEGOCIO.md) tratavam isso como categoria de monetização de horizonte distante. Com a base já construída, a decisão real que falta não é "construir isso" — é decidir quando ativar em produção, com que taxa, e depois de resolver os dois pontos acima (teste automatizado e proteção contra corrida de condição, esta segunda compartilhada com o [Sprint 0](../02-ROADMAP/SPRINT-0.md)).
