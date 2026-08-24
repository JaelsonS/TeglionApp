# Documentação do Teglion

Esse diretório é onde eu guardo o registro oficial do Teglion — o SaaS multi-tenant que estou construindo para escritórios de contabilidade. Comecei em Portugal, sou brasileiro, e hoje (agosto de 2026) tenho 4 escritórios pilotos usando o sistema de verdade.

## Por que eu escrevo isso

Porque eu não posso continuar dependendo só da minha própria memória. Escrevo essa documentação pra que, quando eu contratar o primeiro engenheiro, ele consiga entender o sistema sem precisar me perguntar tudo. Pra que, se um dia eu passar por uma auditoria técnica ou uma due diligence de investidor, eu tenha respostas reais escritas, não otimismo genérico. E pra que as decisões de arquitetura que eu tomo não se percam — eu registro o motivo, pra não esquecer nem eu mesmo daqui a um ano.

## A regra que eu sigo

Em cada documento, eu deixo claro o que está **implementado e comprovado**, o que está **parcial**, o que está **planejado** e o que **ainda não existe**. Se eu escrevo que algo funciona, é porque eu confirmei lendo o código de verdade — não copiei de uma versão antiga nem de uma intenção que eu tinha. Quando eu não tenho certeza suficiente, escrevo `Não comprovado atualmente` ou `A validar`, em vez de inventar. Prefiro admitir que não sei do que me enganar.

## Onde está o roadmap

**[`docs/ROADMAP.md`](./ROADMAP.md) é o único roadmap que eu uso.** Toda decisão sobre o que eu vou fazer a seguir — segurança, arquitetura, produto, infraestrutura, expansão pro Brasil — está lá, com prioridade, estado e o que precisa acontecer pra eu considerar concluído. Não deixo nenhum outro documento com uma lista de "próximos passos" concorrente. Se eu esbarrar num documento antigo que ainda tem uma lista dessas, já sei que está desatualizada — o roadmap manda.

## Como eu organizei tudo

| Pasta | O que eu guardo aqui |
|---|---|
| [`product/`](./product/) | O que é o Teglion, pra quem eu construí, que problema eu resolvo, e os princípios que eu sigo pra decidir produto. |
| [`architecture/`](./architecture/) | Como eu construí o sistema — backend, frontend, banco, multi-tenancy, API, integrações — escrito pra eu (ou quem eu contratar) entender rápido, não uma cópia do código. |
| [`decisions/`](./decisions/) | Architecture Decision Records (ADRs) — por que eu escolhi o que escolhi, que alternativas eu considerei, e o que isso me custa. |
| [`security/`](./security/) | Autenticação, autorização, isolamento entre escritórios, proteção de dados, e o que eu já testei de segurança versus o que ainda preciso testar. |
| [`database/`](./database/) | Schema, RLS, migrations, backup e recuperação de desastre. |
| [`infrastructure/`](./infrastructure/) | Ambientes, deploy, CI/CD, observabilidade — como o sistema roda de verdade, hoje. |
| [`operations/`](./operations/) | Meus runbooks — o que eu faço quando algo quebra, como eu faço release, guias de configuração de cada integração que eu uso. |
| [`testing/`](./testing/) | O que eu já testo hoje, o que eu ainda não testo, e o que falta pra fechar essa diferença. |
| [`ux/`](./ux/) | Como eu penso as telas e os fluxos do produto. |
| [`governance/`](./governance/) | Como eu trabalho na engenharia do Teglion e como eu mantenho essa documentação viva. |
| [`investor/`](./investor/) | Meu pitch deck, a narrativa que eu uso com investidor, e o que uma due diligence técnica encontraria hoje se abrisse o meu código. |
| [`historico/`](./historico/) | O que eu já arquivei — sprints que já fechei, auditorias antigas, marcos que já passaram. Não uso isso como fonte de verdade do estado atual, é só memória do que já aconteceu. |

## Como eu uso os ADRs

Um ADR (Architecture Decision Record) registra uma decisão de arquitetura que eu já tomei — não uma ideia solta, não algo que eu ainda estou pensando. Em cada um eu escrevo o contexto, as alternativas que eu considerei, a decisão em si, e as consequências (boas e ruins) de eu ter escolhido esse caminho. Veja [`decisions/README.md`](./decisions/README.md) pra lista completa e pra como eu crio um novo.

## Como eu mantenho isso vivo

1. Mudei algo de arquitetura relevante? Eu crio ou atualizo um ADR.
2. Mudei algo de produto? Eu atualizo o documento certo em `product/`.
3. Mudei infraestrutura ou processo de deploy? Eu atualizo `infrastructure/` ou `operations/`.
4. Mudei algo de segurança? Eu atualizo `security/`.
5. Mudei uma prioridade? Eu atualizo o `ROADMAP.md` — nunca crio uma lista de tarefas paralela, por mais tentador que seja no momento.
6. Encontrei uma afirmação que já não bate com o código? Eu corrijo na hora, não deixo pra depois — documentação errada é pior que documentação ausente, porque me engana em vez de eu simplesmente admitir que não sei.

Mais detalhes em [`governance/DOCUMENTATION_POLICY.md`](./governance/DOCUMENTATION_POLICY.md).
