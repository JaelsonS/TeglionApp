# Architecture Decision Records (ADRs)

## O que é um ADR

Aqui eu registro as decisões de arquitetura que já tomei e já implementei — não uma ideia solta, não uma proposta em aberto, não uma preferência pessoal disfarçada de decisão. Cada ADR nesta pasta existe porque encontrei evidência real no código do Teglion sustentando a decisão descrita: um arquivo, uma migration, uma constraint, um comentário, um comportamento observável.

Não escrevo um ADR como documento de venda. Registro a decisão, as alternativas que descartei (quando lembro ou encontro evidência do porquê), os motivos, e — com o mesmo peso — as consequências negativas e os riscos de ter escolhido esse caminho. Um ADR que só lista vantagens não é um registro honesto pra mim, é propaganda; se algum documento aqui parecer assim, está errado e preciso corrigir.

Formato de arquivo: `ADR-NNNN-nome-curto-da-decisao.md`, numeração sequencial, sem reaproveitar números de ADRs que eu remover.

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

## Como eu proponho um novo ADR

1. **Quando eu proponho:** sempre que faço uma mudança de arquitetura relevante — algo que afeta como o sistema é construído de forma duradoura (modelo de dados, isolamento de tenant, escolha de plataforma/fornecedor, padrão de autenticação, estratégia de expansão), não uma escolha de implementação local e reversível sem custo.
2. **Quem pode propor:** qualquer pessoa da minha equipe de engenharia que esteja implementando ou tenha implementado a decisão — hoje, na prática, sou eu mesmo na maior parte do tempo. Um ADR descreve o que já existe no código; não escrevo um ADR para uma ideia ainda não implementada, só quando a decisão já foi tomada e tenho evidência real para documentar.
3. **Onde registro:** um novo arquivo `ADR-NNNN-nome-curto.md` nesta pasta (`docs/decisions/`), seguindo a mesma estrutura dos ADRs que já existem: Contexto, Problema, Decisão, Alternativas consideradas, Motivos da decisão, Consequências positivas, Consequências negativas, Riscos, Impacto futuro, Status, Data, e relação com outros ADRs quando fizer sentido. Escrevo tudo em português do Brasil, com evidência real do código citada explicitamente (caminho de arquivo, nome de função, linha de constraint) — nunca uma afirmação sem lastro.
4. **Como eu mudo o status:**
   - `Proposto` — registrei, mas ainda estou revisando ou discutindo antes de considerar a posição oficial do projeto.
   - `Aceito` — é a decisão vigente. A maioria dos ADRs desta pasta está neste estado.
   - `Substituído por ADR-NNNN` — a decisão mudou; não apago o ADR antigo (perderia o registro histórico do porquê da escolha anterior), só marco como substituído, com um link para o novo.
   - `Rejeitado` — propus e decidi explicitamente não seguir esse caminho; mantenho como registro de que considerei a alternativa.
   - Qualquer mudança de status eu faço atualizando o campo `Status` no topo do arquivo, em um commit ou PR que explique o motivo da mudança — nunca reescrevendo silenciosamente a decisão original sem deixar rastro do que mudou e por quê.
5. **Revisão:** como hoje sou uma equipe pequena, a revisão prática é o próprio processo de PR do repositório — mas a régua que uso para aceitar algo é a mesma da regra de honestidade em `docs/README.md`: só deixo uma afirmação entrar num ADR se confirmei lendo o código real, não copiada de intenção ou de memória.

## Relação com o resto da documentação

Nos ADRs eu documento o "porquê" de uma decisão de arquitetura que já tomei. Eles não substituem `docs/ROADMAP.md` (que é minha única fonte de prioridades futuras do Teglion) nem os documentos de `docs/architecture/` (que descrevem como o sistema funciona hoje, não por que eu construí assim). Quando uma decisão registrada aqui muda, atualizo também qualquer documento de arquitetura que a descreva — um ADR desatualizado é menos grave pra mim do que um documento de arquitetura desatualizado, porque o ADR é explicitamente um registro histórico, mas os dois precisam refletir a realidade.
