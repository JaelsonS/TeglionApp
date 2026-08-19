# Documentação do Teglion

Este diretório é a documentação oficial do Teglion — um SaaS multi-tenant para escritórios de contabilidade, criado por um fundador brasileiro, nascido em Portugal, com 4 escritórios pilotos usando o sistema hoje (agosto de 2026).

## Por que esta documentação existe

Porque o Teglion não pode continuar dependendo só da memória de quem construiu. Esta documentação existe para que um novo engenheiro entenda o sistema sem depender de perguntar ao fundador, para que uma auditoria técnica ou uma due diligence de investidor encontre respostas reais em vez de otimismo genérico, e para que decisões de arquitetura não se percam — sejam registradas, com o motivo, para sempre.

## Regra de honestidade

Cada documento aqui distingue explicitamente o que está **implementado e comprovado**, o que está **parcial**, o que está **planejado** e o que **não existe ainda**. Se um documento afirmar que algo funciona, isso foi confirmado lendo o código real — não copiado de uma versão antiga ou de uma intenção. Quando não houver certeza suficiente, o documento diz `Não comprovado atualmente` ou `A validar`, em vez de inventar.

## Fonte oficial do roadmap

**[`docs/ROADMAP.md`](./ROADMAP.md) é o único roadmap oficial do Teglion.** Toda decisão sobre o que fazer a seguir — segurança, arquitetura, produto, infraestrutura, expansão para o Brasil — está lá, com prioridade, estado e critério de conclusão. Nenhum outro documento deste repositório tem autoridade para listar prioridades futuras concorrentes. Se algum documento antigo ainda tiver uma lista de "próximos passos", ela está desatualizada por definição — o roadmap manda.

## Como a documentação está organizada

| Pasta | O que encontrar aqui |
|---|---|
| [`product/`](./product/) | O que o Teglion é, para quem existe, que problema resolve, e os princípios que guiam decisões de produto. |
| [`architecture/`](./architecture/) | Como o sistema é construído — backend, frontend, banco, multi-tenancy, API, integrações — explicado para um engenheiro entender rápido, não como cópia do código. |
| [`decisions/`](./decisions/) | Architecture Decision Records (ADRs) — por que escolhemos o que escolhemos, quais alternativas foram consideradas, e o que isso custa. |
| [`security/`](./security/) | Autenticação, autorização, isolamento entre escritórios, proteção de dados, e o que já foi testado de segurança versus o que ainda precisa ser. |
| [`database/`](./database/) | Schema, RLS, migrations, backup e recuperação de desastre. |
| [`infrastructure/`](./infrastructure/) | Ambientes, deploy, CI/CD, observabilidade — como o sistema roda de verdade, hoje. |
| [`operations/`](./operations/) | Runbooks operacionais — o que fazer quando algo quebra, como fazer release, guias de configuração de cada integração. |
| [`testing/`](./testing/) | O que é testado hoje, o que não é, e o plano para fechar a diferença. |
| [`ux/`](./ux/) | Como as telas e fluxos do produto são pensados. |
| [`governance/`](./governance/) | Como a engenharia do Teglion trabalha e como a documentação se mantém viva. |
| [`investor/`](./investor/) | Pitch deck, narrativa para investidores, e o que uma due diligence técnica encontraria hoje. |
| [`historico/`](./historico/) | Registros fechados — sprints concluídas, auditorias antigas, marcos já superados. Não é fonte de verdade sobre o estado atual, é memória do que já aconteceu. |

## Como os ADRs funcionam

Um ADR (Architecture Decision Record) documenta uma decisão de arquitetura já tomada — não uma ideia, não uma sugestão. Cada um tem contexto, alternativas consideradas, a decisão em si, e as consequências (boas e ruins) de ter escolhido esse caminho. Veja [`decisions/README.md`](./decisions/README.md) para a lista completa e o processo de criar um novo.

## Como manter esta documentação viva

1. Mudou algo de arquitetura relevante? Crie ou atualize um ADR.
2. Mudou algo de produto? Atualize o documento correspondente em `product/`.
3. Mudou infraestrutura ou processo de deploy? Atualize `infrastructure/` ou `operations/`.
4. Mudou algo de segurança? Atualize `security/`.
5. Mudou uma prioridade? Atualize `ROADMAP.md` — nunca crie uma lista de tarefas paralela.
6. Encontrou uma afirmação que não bate mais com o código? Corrija na hora, não deixe para depois — documentação errada é pior do que documentação ausente, porque engana em vez de admitir que não sabe.

Mais detalhes em [`governance/DOCUMENTATION_POLICY.md`](./governance/DOCUMENTATION_POLICY.md).
