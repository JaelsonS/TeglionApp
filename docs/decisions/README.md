# Architecture Decision Records (ADRs)

## O que é um ADR

Um ADR (Architecture Decision Record) registra uma decisão de arquitetura que já foi tomada e já está implementada — não uma ideia, não uma proposta em aberto, não uma preferência pessoal de quem escreveu. Cada ADR neste diretório existe porque há evidência real no código do Teglion sustentando a decisão descrita: um arquivo, uma migration, uma constraint, um comentário, um comportamento observável.

Um ADR não é um documento de venda. Ele registra a decisão, as alternativas que foram descartadas (quando isso é conhecido), os motivos, e — com o mesmo peso — as consequências negativas e os riscos de ter escolhido esse caminho. Um ADR que só lista vantagens não é um registro honesto, é propaganda; se um documento aqui parecer assim, ele está errado e deve ser corrigido.

Formato de arquivo: `ADR-NNNN-nome-curto-da-decisao.md`, numeração sequencial, sem reaproveitar números de ADRs removidos.

## ADRs registrados

| ADR | Decisão |
|---|---|
| [ADR-0001](./ADR-0001-isolamento-multi-tenant-firm-id.md) | Isolamento entre escritórios é garantido por filtro explícito de `firm_id` em cada repositório de dados, com RLS no Postgres como segunda camada de defesa — não a fronteira primária, porque o backend acessa via `service_role`, que ignora RLS. |
| [ADR-0002](./ADR-0002-pais-como-propriedade-do-tenant.md) | País é uma propriedade do escritório (`firms.country_code`), nunca do usuário individual, e nunca é usado como critério de autorização — só `firm_id` isola dados entre tenants. |
| [ADR-0003](./ADR-0003-supabase-como-plataforma.md) | Supabase (Postgres + Auth + Storage + RLS) é a plataforma de dados do Teglion, escolhida para reduzir peças móveis para uma equipe pequena, com o acoplamento a um único fornecedor como custo assumido. |
| [ADR-0004](./ADR-0004-autenticacao-propria-jwt-cookie.md) | Autenticação própria (hash de senha, JWT em cookie `httpOnly`) em vez de usar o Supabase Auth diretamente, com coordenação de renovação de sessão entre abas do navegador via `BroadcastChannel` e lock em `sessionStorage`. |
| [ADR-0005](./ADR-0005-stripe-cobranca-preco-por-pais.md) | Stripe é o provedor de cobrança, com resolução de preço por país centralizada em uma única função — pronta para novos países, mas com a moeda exibida ainda não ligada ao país resolvido em todos os pontos do sistema. |
| [ADR-0006](./ADR-0006-obrigacao-custom-estrategia-entrada-pais.md) | O tipo de obrigação `CUSTOM` permite que um escritório opere em um país sem calendário fiscal automático (hoje, o Brasil), sem bloquear a expansão até a automação fiscal completa desse país estar pronta. |
| [ADR-0007](./ADR-0007-scheduler-central-polling-frontend.md) | Um scheduler central de polling por shell do frontend (escritório/cliente) substitui temporizadores independentes por componente, invalidando cache em um único intervalo em vez de "N intervals" — ainda coexistindo com hooks de badge que mantêm `refetchInterval` próprio. |

## Como propor um novo ADR

1. **Quando propor:** sempre que uma mudança de arquitetura relevante for feita ou decidida — algo que afeta como o sistema é construído de forma duradoura (modelo de dados, isolamento de tenant, escolha de plataforma/fornecedor, padrão de autenticação, estratégia de expansão), não uma escolha de implementação local e reversível sem custo.
2. **Quem pode propor:** qualquer pessoa da engenharia do Teglion que esteja implementando ou tenha implementado a decisão. Um ADR descreve o que já existe no código — não se propõe um ADR para uma ideia ainda não implementada; propõe-se um ADR quando a decisão já foi tomada e tem evidência real para documentar.
3. **Onde registrar:** um novo arquivo `ADR-NNNN-nome-curto.md` neste diretório (`docs/decisions/`), seguindo a mesma estrutura dos ADRs existentes: Contexto, Problema, Decisão, Alternativas consideradas, Motivos da decisão, Consequências positivas, Consequências negativas, Riscos, Impacto futuro, Status, Data, e relação com outros ADRs quando fizer sentido. Todo o conteúdo em português do Brasil, com evidência real do código citada explicitamente (caminho de arquivo, nome de função, linha de constraint) — nunca uma afirmação sem lastro.
4. **Como muda de status:**
   - `Proposto` — registrado, mas ainda em revisão ou discussão antes de ser considerado a posição oficial do projeto.
   - `Aceito` — é a decisão vigente. A maioria dos ADRs deste diretório está neste estado.
   - `Substituído por ADR-NNNN` — a decisão mudou; o ADR antigo não é apagado (perderia o registro histórico do porquê da escolha anterior), só marcado como substituído, com um link para o novo.
   - `Rejeitado` — foi proposto e decidiu-se explicitamente não seguir esse caminho; mantido como registro de que a alternativa foi considerada.
   - Qualquer mudança de status é feita atualizando o campo `Status` no topo do arquivo, em um commit ou PR que explique o motivo da mudança — nunca reescrevendo silenciosamente a decisão original sem deixar rastro do que mudou e por quê.
5. **Revisão:** como o Teglion é hoje uma equipe pequena, a revisão prática é o próprio processo de PR do repositório — mas a régua de aceitação é a mesma descrita na regra de honestidade de `docs/README.md`: uma afirmação só entra em um ADR se foi confirmada lendo o código real, não copiada de intenção ou de memória.

## Relação com o resto da documentação

ADRs documentam o "porquê" de uma decisão de arquitetura já tomada. Eles não substituem `docs/ROADMAP.md` (que é a única fonte de prioridades futuras do Teglion) nem os documentos de `docs/architecture/` (que descrevem como o sistema funciona hoje, não por que foi construído assim). Quando uma decisão registrada aqui muda, atualize também qualquer documento de arquitetura que a descreva — um ADR desatualizado é menos grave do que um documento de arquitetura desatualizado, porque o ADR é explicitamente um registro histórico, mas ambos devem refletir a realidade.
