# Multi-tenancy — como construí

> Fonte consolidada: `docs/04-ARQUITETURA/MULTI-TENANCY.md` (removido após esta migração). Este documento é sobre desenho estrutural — como o isolamento entre escritórios foi montado, e como. O veredito de risco (o quão seguro isso é na prática, o que uma auditoria de segurança encontrou) está em [`docs/security/TENANT_ISOLATION.md`](../security/TENANT_ISOLATION.md) — leia os dois juntos; um descreve a intenção, o outro descreve o que foi verificado.

## O que é um tenant, no Teglion

O tenant é o escritório de contabilidade (`firm`). Isolei cada escritório que assina o Teglion dos outros: seus clientes, documentos, obrigações, mensagens, agendamentos e configurações não são visíveis nem acessíveis a outro escritório, sob nenhuma circunstância normal de uso.

Dois tipos de ator pertencem a um `firm`:

- **Usuário (equipe do escritório)** — dono ou membro da equipe, com um papel (`role`) e um conjunto de permissões dentro daquele escritório.
- **Cliente do escritório** — quem usa o portal do cliente. Um cliente pertence a um escritório específico (`firm_id`) e, dentro dele, tem sua própria identidade (`client_id`).

Não existe usuário "global" do Teglion que enxergue mais de um escritório ao mesmo tempo — cada sessão autenticada carrega exatamente um `firmId` (e, quando aplicável, um `clientId`).

## O modelo de dado

Toda tabela que guarda dado pertencente a um escritório carrega uma coluna `firm_id`. Mantenho o padrão de acesso, em toda a camada de repositório, assim: nenhuma consulta busca ou grava dado sem esse filtro, combinado com o `firm_id` extraído da sessão autenticada de quem está fazendo a requisição.

## Como a API resolve e valida o contexto de tenant

Isso acontece em duas etapas, sempre antes do controller:

1. **Extração.** `authMiddleware` (`backend/src/middlewares/auth.middleware.js`) valida o JWT do cookie de sessão e monta `req.user`, que inclui `firmId` (e `clientId`, quando o ator é cliente). Esse valor vem do token assinado pelo servidor no momento do login — nunca de um campo do corpo da requisição ou de um parâmetro de URL que o chamador da API pudesse manipular.
2. **Validação.** `requireActiveFirm` (`backend/src/middlewares/firm-access.middleware.js`) lê esse `firmId`, busca o registro do escritório correspondente e verifica se ele está em condição de uso (ativo ou em período de teste válido). Se não estiver, a requisição é interrompida ali, antes de qualquer controller rodar. O resultado fica disponível como `req.firm` para o resto da cadeia.

Daí em diante, cada função de repositório que busca ou grava dado tenant-scoped recebe o `firm_id` como parâmetro explícito, sempre derivado dessa sessão — nunca de um valor que o cliente da API poderia manipular livremente. É esse padrão, que repito de forma consistente em toda a camada de repositórios, que na prática garante o isolamento.

## Por que meu backend usa a chave de privilégio total do Supabase

Meu backend se conecta ao banco com a `service_role` — uma chave que ignora as políticas de Row Level Security (RLS) que o Postgres do Supabase oferece nativamente. Fiz essa escolha porque o backend precisa executar operação administrativa em nome de qualquer escritório — por exemplo, um agendador que roda lembretes de obrigação para todos os escritórios ativos, na mesma execução. Um modelo de acesso restrito por RLS, pensado para uma sessão de usuário único, não encaixa diretamente nesse tipo de operação em lote.

A consequência direta: a proteção de isolamento entre escritórios **não vem do banco** — vem inteiramente da disciplina que mantenho de sempre incluir `firm_id` em cada consulta, na camada de aplicação. As políticas RLS existem no schema do banco (ver `docs/database/DATABASE.md`), mas são hoje irrelevantes para o tráfego real, porque nada nesse caminho usa uma chave que respeitaria essas políticas. Isso é diferente do que acontece no Supabase Storage, onde o acesso a arquivo passa por um caminho que efetivamente aplica as políticas do serviço — ver [DATA_ARCHITECTURE.md](./DATA_ARCHITECTURE.md).

## O que isso implica para quem desenvolve

Todo código novo que toca dado de escritório precisa seguir esse padrão manualmente — não existe rede de segurança automática no banco que bloquearia uma consulta que esqueça o filtro de `firm_id`. Por isso criei um teste de isolamento entre escritórios (`backend/scripts/tenant-isolation-test.js`) que roda automaticamente no CI e falha o pipeline (fail-closed) se os segredos de staging necessários estiverem ausentes — confirmado em `.github/workflows/ci.yml`. É a única forma real que tenho de pegar esse tipo de erro antes de chegar em produção; ver [`docs/security/SECURITY_TESTING.md`](../security/SECURITY_TESTING.md) para o detalhe de cobertura desse teste.

## País é propriedade do tenant — nunca mecanismo de isolamento

A tabela `firms` tem uma coluna `country_code` (`TEXT DEFAULT 'PT'`) — país é, estruturalmente, uma propriedade do escritório, definida uma vez no cadastro e usada para resolver configuração (moeda, formato de identificação fiscal, fuso horário padrão, quais funcionalidades estão disponíveis para aquele país — ver [INTERNATIONALIZATION.md](./INTERNATIONALIZATION.md)).

Fiz questão de que isso não tenha nenhuma relação com isolamento entre tenants. `country_code` nunca funciona como fronteira de segurança, nunca é usado para decidir se um dado é ou não visível para um ator, e nenhuma consulta de repositório filtra por país como mecanismo de controle de acesso. A única fronteira de isolamento no Teglion é `firm_id` — um escritório português e um escritório brasileiro são isolados um do outro exatamente da mesma forma, e pelo mesmo mecanismo, que dois escritórios portugueses são isolados entre si. País muda o que é mostrado e como é calculado; nunca muda quem pode ver o quê.

## Caminho futuro considerado

Considero, de médio prazo, emitir tokens de autenticação compatíveis com o mecanismo nativo do Supabase, permitindo que RLS realmente proteja consultas feitas com um papel de acesso mais restrito — deixando a `service_role` só para as operações administrativas que genuinamente precisam dela. É uma direção que considero, não trabalho em andamento hoje.

## Onde aprofundar

- [`docs/security/TENANT_ISOLATION.md`](../security/TENANT_ISOLATION.md) — o veredito de risco sobre esse desenho.
- `docs/database/DATABASE.md` — schema, RLS declarado, migrations.
- [DATA_ARCHITECTURE.md](./DATA_ARCHITECTURE.md) — isolamento aplicado a arquivo, não só a linha de banco.
- [INTERNATIONALIZATION.md](./INTERNATIONALIZATION.md) — como `country_code` alimenta configuração, sem nunca tocar em isolamento.
