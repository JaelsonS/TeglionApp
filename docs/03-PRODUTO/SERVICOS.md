# Serviços

**Status: IMPLEMENTADO.**

## O que é

O catálogo do que o escritório oferece — cada serviço tem nome, descrição, preço, e pode ser marcado como publicável na página pública do escritório. É a peça que conecta a operação interna (o que o escritório faz) com a captação externa (como um cliente novo descobre e contrata isso).

## O que dá para configurar por serviço

Se o serviço exige agendamento (conectando com [BOOKING.md](./BOOKING.md)) ou não. Se exige pagamento no ato — nesse caso, o agendamento fica condicionado a um checkout via Stripe Connect antes de ser confirmado, com a reserva expirando automaticamente se o pagamento não se completar em meia hora (ver [STRIPE-CONNECT.md](../05-INTEGRACOES/STRIPE-CONNECT.md)). Um formulário de captação específico para aquele serviço, com pergunta condicional, checklist de documento sugerido, e regra de etiquetagem automática do lead conforme a resposta.

## Por que o modelo suporta evolução sem precisar ser refeito

Nada disso é hardcoded para um único tipo de serviço. A prova concreta é que o fluxo hoje rotulado "IRS" (ver [IRS.md](./IRS.md)) não é um caso especial de código — é um serviço configurado através desse mesmo modelo genérico. Isso significa que adicionar um tipo de serviço novo, no futuro, é trabalho de configuração dentro do produto, não de desenvolvimento de funcionalidade nova.

## Isolamento

Serviço é sempre resolvido a partir do escritório identificado pelo slug da página pública, nunca por um ID vindo direto do cliente — o mesmo padrão de segurança verificado em [PAGINA-PUBLICA.md](./PAGINA-PUBLICA.md).
