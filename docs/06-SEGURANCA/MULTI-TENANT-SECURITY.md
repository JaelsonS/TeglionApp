# Segurança multi-tenant

A pergunta que este documento responde: **consigo colocar dois escritórios reais usando o Teglion ao mesmo tempo sem risco conhecido de um ver dado do outro?**

Resposta verificada em código na auditoria de 12/08/2026, não presumida: **sim, para vazamento pelas rotas normais do produto — não foi encontrado nenhum caminho explorável hoje. Mas não sem ressalva**, porque existe um risco real de controle de acesso (detalhado abaixo) que se torna mais provável justamente com múltiplos escritórios reais operando ao mesmo tempo.

## Como o isolamento é garantido hoje

O backend acessa o banco de dados com uma chave de acesso total (`service_role`), que ignora as políticas de segurança em nível de linha do Postgres (RLS) por definição. Essas políticas existem no schema do banco, mas são irrelevantes para o tráfego real do produto — nenhuma parte do sistema, frontend ou backend, usa uma chave de acesso restrito que respeitaria essas políticas.

Isso significa que a proteção real de isolamento entre escritórios é 100% de responsabilidade da camada de aplicação: toda consulta que toca dado de um escritório precisa, manualmente, filtrar por `firm_id`. Essa disciplina foi verificada de forma consistente em toda a camada de repositórios do backend — documentos, tarefas, mensagens, clientes, obrigações, consultas/agendamentos, pedidos de serviço, leads, alertas, conexões de Google Calendar, e também pagamentos via Stripe Connect (conta conectada, aceite de termos, registro de pagamento) — sempre combinando o ID do recurso pedido com o `firm_id` do usuário autenticado, nunca aceitando um `firm_id` vindo de fora sem validar contra a sessão. As três tabelas do módulo de pagamento têm, adicionalmente, RLS habilitada no banco — não muda a análise acima (o backend ainda acessa via `service_role`), mas é uma segunda camada presente especificamente ali.

Quatro cenários de ataque foram testados diretamente contra o código: cliente tentando acessar rota exclusiva de escritório (bloqueado); funcionário de um escritório trocando o ID de um recurso na URL ou no corpo da requisição para tentar acessar recurso de outro escritório (bloqueado, sempre com 404 genérico, não um erro que revele a existência do recurso); chamada direta à API com ID de recurso de outro escritório (bloqueado); usuário removido tentando continuar usando uma sessão antiga (ver abaixo — falha para funcionário, funciona corretamente para cliente).

## O risco real: sessão de funcionário desativado não é revogada

Quando o dono de um escritório desativa um membro da equipe, o sistema marca essa pessoa como inativa no banco — e para por aí. O fluxo de renovação de sessão nunca verifica essa marcação antes de emitir um novo token de acesso; ele só confirma que a assinatura do escritório está em dia. O token de renovação daquele funcionário continua válido, se renovando por mais 30 dias a cada uso, indefinidamente.

O padrão correto já existe no código, só não foi replicado para esse caso: quando o acesso de um cliente é revogado, todas as sessões dele são apagadas na mesma operação. O mesmo princípio nunca foi aplicado à desativação de um funcionário.

Isso não é uma falha de isolamento entre escritórios no sentido estrito — é uma falha de controle de acesso que se torna mais séria com múltiplos escritórios reais, porque rotatividade de equipe é cenário normal, não exceção, num piloto pago. É o primeiro item do [Sprint 0](../02-ROADMAP/SPRINT-0.md).

## Pontos de atenção — não são vulnerabilidade hoje, mas são risco de desenho

Algumas funções internas de repositório (comentários/mensagens vinculadas a uma tarefa, ou a um pedido de serviço) filtram só pelo ID do registro pai, sem repetir o filtro de `firm_id` na própria função. Hoje isso não é explorável porque todo lugar que chama essas funções já validou o registro pai antes. Mas é exatamente o tipo de função que um desenvolvedor futuro poderia reaproveitar num endpoint novo sem perceber que falta essa camada — o mesmo padrão de risco que a ausência de rede de segurança no banco (parágrafo anterior) descreve de forma mais ampla.

## Por que a resposta não é um "sim" simples

Zero rede de segurança no banco de dados significa que um único filtro de `firm_id` esquecido, num endpoint novo, é um vazamento silencioso — sem nenhum bloqueio automático que impeça isso de chegar em produção. Some a isso o fato de que o único teste automatizado que pegaria essa regressão não roda sozinho em lugar nenhum hoje (ver [SECURITY-GATES.md](./SECURITY-GATES.md)), e a resposta correta não é "está seguro", é "está seguro hoje, verificado manualmente, sem garantia automática de que continua assim amanhã".
