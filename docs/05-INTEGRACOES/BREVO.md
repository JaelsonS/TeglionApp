# Brevo (email)

**Status: IMPLEMENTADO**, funcional, mas com um risco real e ativo que precisa ser corrigido antes de operar com múltiplos escritórios — não é uma nota de rodapé, é o achado mais concreto desta integração na auditoria de 12/08/2026.

## O que funciona

Todo email transacional do produto passa por aqui: convite de cliente e de membro da equipe, confirmação de cadastro, redefinição de senha, boas-vindas, aviso de tarefa e obrigação nova, lembrete de prazo, confirmação de agendamento, aviso de documento recebido. Se a chave de configuração do Brevo não estiver definida, o sistema não trava — os envios são simplesmente pulados de forma controlada, sem derrubar o resto do produto.

O conteúdo dos templates escapa corretamente os dados do usuário antes de montar o HTML do email, nos pontos verificados — reduzindo o risco de um nome ou campo malicioso injetar conteúdo indevido no email enviado.

## O risco real: lembrete duplicado

O envio de lembrete de obrigação roda a cada hora, para todo escritório ativo. O canal de SMS tem uma proteção que impede reenviar o mesmo lembrete no mesmo dia. **O canal de email não tem essa mesma proteção.** Na prática, o mesmo lembrete, sobre a mesma obrigação, para o mesmo cliente, pode ser reenviado a cada execução horária enquanto a condição continuar valendo — até várias vezes no mesmo dia.

Hoje isso não gerou problema visível porque o volume de obrigações reais em aberto é baixo. Assim que mais de um escritório estiver operando de verdade, com mais obrigações e mais clientes, esse volume sobe — e esse bug vira reclamação de cliente e risco real de reputação para a conta de Brevo, o que afetaria também os outros emails transacionais essenciais (convite, redefinição de senha) que dependem da mesma reputação de envio. Está listado como bloqueador no [Sprint 0](../02-ROADMAP/SPRINT-0.md).

## Autenticação de domínio

A autenticação SPF/DKIM do domínio de envio de produção ainda não está confirmada como concluída. Sem isso, entregabilidade sofre e a conta fica mais vulnerável a bloqueio, justamente na fase em que mais precisa de confiabilidade — os primeiros escritórios pagantes.

## O que não existe

Sem retry automático em caso de falha de envio — se a chamada para a Brevo falhar, o erro sobe para quem chamou, sem nova tentativa automática. Sem controle de taxa de envio em massa dedicado — o volume de disparo depende inteiramente do padrão de uso do produto, não de um limitador próprio.

## Resposta direta

O sistema pode enviar email real para cliente hoje, mas não com segurança total de reputação até dois pontos serem resolvidos: a deduplicação de lembrete no canal de email, e a confirmação de que o domínio de envio está devidamente autenticado em produção.
