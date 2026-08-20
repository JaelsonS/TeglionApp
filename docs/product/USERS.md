# Para quem o Teglion existe

> Aqui eu consolidei o conteúdo que antes estava espalhado em `docs/01-ESTRATEGIA/PUBLICO-ALVO.md` e `docs/01-ESTRATEGIA/PROBLEMAS-QUE-RESOLVE.md` (arquivos que removi nesta reorganização de 19/08/2026).

## Quem usa hoje

Um escritório de contabilidade em Portugal, de porte pequeno a médio, onde o próprio dono ainda está envolvido diretamente no atendimento — não uma estrutura grande com departamentos separados de vendas, operação e suporte. É o perfil que valida o piloto atual do produto: uma pessoa que usa o sistema no dia a dia para a operação real do escritório, não em ambiente de teste.

Dentro do escritório, mapeei dois papéis que usam o Teglion de formas diferentes:

- **Dono / equipe do escritório**: administra clientes, acompanha prazos, troca mensagem, sobe e valida documento, publica serviço na página pública. É quem decide comprar e quem usa o produto o dia inteiro.
- **Equipe do escritório (quando existe)**: acessa o mesmo sistema com permissão mais restrita — atende cliente, organiza documento, sem necessariamente ver configuração de billing ou dado sensível de outro membro da equipe.

Do outro lado, o cliente do escritório — empresa ou particular — usa o portal próprio: recebe pedido de documento, envia arquivo, conversa com o escritório, vê prazo, eventualmente agenda um horário. Esse cliente não escolhe o Teglion; herda o acesso porque o escritório dele usa.

## O perfil de conforto com tecnologia

Desenhei o produto pensando num usuário que não é técnico, mas também não é resistente a usar um sistema web no lugar de planilha e WhatsApp — é o perfil de quem já usa email, já usa alguma ferramenta de faturamento obrigatória por lei, e está disposto a trocar processo manual por processo mais rápido, desde que a curva de aprendizado seja curta. O fluxo de convite simples que fiz (o escritório convida, o cliente aceita e já está dentro) reflete essa aposta: sem etapa de configuração complexa do lado do cliente.

## Quem não é o público hoje

Escritórios grandes, com departamentos formais e processos de compra corporativos, não são o alvo da fase atual — hoje não tenho as camadas de permissão granular, relatório gerencial ou integrações que esse porte normalmente exige. Também não é uma aposta em usuário final individual sem vínculo com um escritório: não vendo o Teglion diretamente para a pessoa física, ela entra através do escritório que a atende.

## Os problemas concretos que esse público enfrenta

**Fragmentação de ferramentas.** Documento chega por WhatsApp. Prazo é lembrado por email ou por memória. Cadastro de cliente vive numa planilha que só uma pessoa sabe atualizar direito. Cada cliente novo é mais uma linha, mais uma conversa espalhada, mais uma chance de esquecer um prazo porque ele não estava em lugar nenhum central. Os módulos de Clientes, Documentos, Calendário Fiscal/Obrigações e Mensagens (ver [PRODUCT.md](./PRODUCT.md)) resolvem cada um a própria parte disso.

**Comunicação sem rastro.** WhatsApp é rápido, mas não fica registrado em lugar nenhum que o escritório controle — se a pessoa que atendeu aquele cliente sai, o histórico vai com ela ou se perde numa conversa pessoal. O módulo de Mensagens resolve isso mantendo a conversa vinculada ao cliente, visível para qualquer membro autorizado da equipe.

**Falta de visibilidade sobre prazo fiscal.** Um escritório com trinta, cinquenta clientes não consegue manter de cabeça quem tem o quê vencendo naquela semana. O módulo de Obrigações rastreia isso por cliente, com lembrete automático em cima do prazo — reduzindo o cenário mais caro do setor, que é perder um prazo fiscal de um cliente por falta de acompanhamento sistemático.

**Captar cliente novo sem processo.** Para muitos escritórios pequenos, captar cliente é indicação boca a boca sem funil algum — quem chega, chega por sorte de conhecer alguém. O módulo de página pública e captação de serviços dá ao escritório uma página onde publica o que oferece, recebe pedido de contato sem intervenção manual, e já entra com o formulário certo, a checklist certa e o agendamento certo — sem precisar montar isso do zero para cada tipo de serviço.

**Zero visibilidade sobre a própria operação.** Sem um sistema central, o dono do escritório não tem como responder rápido "quantos clientes tenho pendente de documento essa semana" ou "quantas mensagens ainda não respondi". Construí o Teglion pra juntar isso numa visão única em vez de depender da memória de quem está no dia a dia.

## Para onde isso aponta

O público de escritórios pequenos/médios em Portugal é o ponto de partida deliberado que escolhi, não o teto. A extensão natural — outros tipos de serviço profissional com a mesma dinâmica de cliente recorrente, prazo e documento, e outros mercados de língua portuguesa — está discutida em [VISION.md](./VISION.md).
