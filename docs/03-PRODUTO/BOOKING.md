# Booking / Agendamento

**Status: IMPLEMENTADO, com um bloqueador confirmado.** Este é o módulo com o achado mais sério de toda a auditoria de 12/08/2026 — não vale suavizar.

## O fluxo completo

Página pública do escritório → serviço escolhido → checagem de disponibilidade (considerando horário configurado do escritório e eventos já bloqueados no Google Calendar de quem atende) → escolha de horário → confirmação → email de confirmação → evento criado no Google Calendar de quem atende. Se o serviço exigir pagamento, um passo de checkout via Stripe Connect entra entre a escolha do horário e a confirmação definitiva (ver [STRIPE-CONNECT.md](../05-INTEGRACOES/STRIPE-CONNECT.md)).

Fuso horário é tratado de forma explícita em todo o fluxo — o horário configurado pelo escritório é o mesmo usado para calcular disponibilidade e propagado até o evento criado no Google Calendar.

## O bloqueador: duas pessoas podem marcar o mesmo horário

A checagem de disponibilidade e a criação do agendamento não acontecem de forma protegida — o sistema lê se o horário está livre, e só depois grava a reserva, sem nenhuma trava no banco de dados que impeça duas requisições simultâneas de passarem pela mesma checagem e ambas gravarem uma reserva para o mesmo horário. Existe um mecanismo que evita duplicata acidental (por exemplo, duplo clique no mesmo formulário), mas ele não cobre o cenário de duas pessoas diferentes, ao mesmo tempo, tentando o mesmo horário.

Isso vale tanto para o agendamento gratuito quanto para o pago via Stripe Connect — no caso pago, é ainda mais sério, porque envolve dinheiro real sendo cobrado por um horário que pode não estar mais disponível quando o pagamento se completa.

É o item de maior prioridade do [Sprint 0](../02-ROADMAP/SPRINT-0.md), com correção conhecida (restrição de exclusividade no banco de dados) documentada lá.

## Cancelamento

Hoje só acontece pelo lado do escritório — não existe um caminho de autocancelamento ou reagendamento pelo próprio cliente ou lead que marcou o horário pela página pública. Quando o escritório cancela, o evento correspondente no Google Calendar é removido corretamente, sem deixar órfão.

## Isolamento entre escritórios

Verificado como sólido: a página pública de agendamento sempre resolve o escritório pelo identificador (slug) na URL, nunca por um ID que pudesse ser trocado, e toda consulta de disponibilidade e criação de reserva usa esse escritório resolvido — nenhum caminho encontrado onde a página de um escritório pudesse mostrar ou aceitar reserva para outro.

## Resposta direta

**O booking aguenta múltiplos clientes tentando marcar o mesmo horário simultaneamente?** Não, hoje não — é um risco real e confirmado, não hipotético, coberto no [Sprint 0](../02-ROADMAP/SPRINT-0.md) como prioridade máxima antes de expor a página pública a volume real de tráfego.
