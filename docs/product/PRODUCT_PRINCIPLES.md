# Princípios de produto

> Este documento consolida conteúdo antes espalhado em `docs/00-PRODUTO/PRINCIPIOS.md`, `docs/00-PRODUTO/MANIFESTO.md`, `docs/00-PRODUTO/MISSION.md`, `docs/00-PRODUTO/MODELO-DE-NEGOCIO.md`, `docs/01-ESTRATEGIA/POSICIONAMENTO.md`, `docs/01-ESTRATEGIA/DIFERENCIAIS.md` e `docs/00-FOUNDATION/PRODUCT_IDENTITY_AND_LEGAL_RESPONSIBILITY.md` (arquivos removidos nesta reorganização de 19/08/2026, conteúdo preservado aqui e em `PRODUCT.md`, `VISION.md`, `USERS.md` e `BUSINESS_MODEL.md`).

## De onde isso vem

Um escritório de contabilidade pequeno em Portugal roda hoje em cima de WhatsApp, email e uma planilha. O documento do cliente chega numa conversa de celular que se perde no meio de outras cem. O prazo fiscal está na cabeça de quem trabalha lá há mais tempo, não em lugar nenhum que sobreviva se essa pessoa faltar um dia. A ficha do cliente é uma linha numa planilha que só uma pessoa sabe atualizar direito. Cada ferramenta nova que entra — mais um grupo de WhatsApp, mais uma planilha, mais um caderno — não substitui as anteriores, só empilha em cima.

Isso não é falta de organização de quem trabalha ali. É a ausência de uma ferramenta feita para esse trabalho específico. O que existe no mercado ou é genérico demais — um CRM que não sabe o que é uma obrigação de IVA — ou é pesado demais, feito para escritório grande com departamento de TI, não para o contador que atende o telefone e faz a folha de pagamento no mesmo dia.

O Teglion existe para ser o lugar único onde essa operação acontece: cliente, documento, prazo, conversa e agenda amarrados uns aos outros, visíveis para quem precisa, sem depender da memória de uma pessoa ou da paciência de vasculhar um histórico de WhatsApp. Não é sobre adicionar tecnologia por adicionar — é sobre tirar do escritório o trabalho de segurar tudo isso junto manualmente, para que ele gaste esse tempo com o que só um contador consegue fazer: cuidar do cliente.

O produto começou com um escritório real, usando o sistema no dia a dia — não em ambiente de teste — e hoje soma quatro escritórios pilotos nessa mesma condição (ver `docs/ROADMAP.md`). Isso importa mais do que qualquer funcionalidade nova: cada decisão de produto é testada contra o que um contador de verdade precisa amanhã de manhã, não contra o que parece boa ideia numa reunião.

A ambição não para em Portugal — mas essa ambição só vale alguma coisa se o que existe hoje, em Portugal, for sólido o bastante para sustentar o próximo passo. A visão de expansão está detalhada em [VISION.md](./VISION.md).

## Missão

Ajudar escritórios de contabilidade a administrar a própria operação, os próprios clientes e os próprios serviços num único lugar — reduzindo o trabalho manual que hoje consome o dia e melhorando o que o cliente final sente ao lidar com o escritório.

**Menos trabalho manual repetitivo.** Pedir documento, cobrar prazo, organizar ficha de cliente — tarefas que hoje tomam tempo real de quem poderia estar cuidando do cliente em vez de perseguindo informação espalhada em quatro lugares diferentes.

**Uma experiência melhor para quem é atendido pelo escritório.** O cliente final não deveria precisar adivinhar se o documento que mandou chegou, nem depender de ligar para saber se um prazo está próximo. Um portal simples, com o essencial visível, resolve isso sem exigir que o cliente aprenda a usar um sistema complexo.

**Um único lugar, não mais um lugar.** A missão não é "mais uma ferramenta na pilha" — é substituir a pilha. Se o escritório ainda precisa do WhatsApp para o que realmente importa, a missão não foi cumprida naquele ponto.

### O que a missão não é

Não é automatizar o trabalho contábil em si — o Teglion não substitui o software fiscal certificado que o escritório é obrigado a usar por lei, e não pretende. A missão é sobre a relação com o cliente e a organização da operação ao redor desse trabalho, não sobre o trabalho contábil propriamente dito.

Também não é crescer funcionalidade por funcionalidade sem direção. Cada módulo do produto — documentos, mensagens, obrigações, agenda, captação de serviço — existe porque resolve um pedaço concreto dessa missão, documentado em [PRODUCT.md](./PRODUCT.md) e [FEATURES.md](./FEATURES.md). Funcionalidade que não reduz trabalho manual nem melhora a experiência do cliente final não tem lugar natural aqui.

## Princípios

Estes princípios vêm de decisões já tomadas no produto e no código — não são aspiração solta. Cada um tem um exemplo concreto do que significa na prática.

### Um escritório nunca vê dado de outro

Não é um princípio abstrato de segurança — é o que separa o Teglion de ser vendável para múltiplos escritórios ou não. Toda decisão de arquitetura que envolve dado de cliente passa por essa pergunta primeiro. O estado real disso, com evidência de código, está em [`docs/security/TENANT_ISOLATION.md`](../security/TENANT_ISOLATION.md) — inclusive onde ainda há risco residual, porque esconder isso seria violar o próprio princípio.

### Documentar o que existe, não o que a gente gostaria que existisse

A reconstrução de documentação a partir de 12/08/2026 nasceu desse princípio: a documentação anterior tinha reivindicação otimista demais em alguns pontos. Todo documento técnico do Teglion usa os estados IMPLEMENTADO, PARCIAL, EM DESENVOLVIMENTO, PLANEJADO ou NÃO EXISTE — nunca descrever algo futuro como se já estivesse pronto.

### Simples para quem não é técnico

O cliente final de um escritório não é um usuário de tecnologia por vocação — é uma empresa ou pessoa que só quer resolver a vida fiscal dela. Cada tela pensada para esse público prioriza clareza sobre poder: menos opção, mais óbvio o que fazer a seguir.

### Não inventar funcionalidade por vaidade técnica

Feature gating, Stripe Connect, IA — várias coisas que fariam sentido em algum momento futuro não existem hoje de propósito, porque não resolvem um problema real do estágio atual do produto. Construir antes da necessidade real é desperdício disfarçado de progresso.

### Risco real é dito em voz alta, não escondido atrás de "está tudo bem"

Quando a auditoria de 2026 encontrou um problema — uma sessão que não é revogada corretamente, uma possível corrida de condição no agendamento — o caminho não foi minimizar. Foi nomear o risco, classificar a gravidade e tratar como algo a verificar e resolver antes de vender abertamente. Esse princípio vale tanto para segurança quanto para qualquer parte do produto: sinalizar problema é parte do trabalho, não uma falha em fazer o trabalho.

### O core não muda para acomodar um caso especial de um cliente

Escritório de contabilidade tem particularidade — cada um faz as coisas um pouco diferente. O produto absorve isso através de configuração (categoria de documento, tipo de serviço, template de obrigação) em vez de código específico para um cliente. Isso é o que permite o mesmo sistema atender o escritório piloto de hoje e o centésimo escritório de amanhã sem virar um Frankenstein de exceções.

## Posicionamento

O Teglion não é um ERP genérico com módulo de contabilidade encaixado. Não é um CRM genérico adaptado para escritórios. Não é uma ferramenta de gestão de projetos com nome diferente. É construído desde a base para um único tipo de negócio: o escritório de contabilidade e a relação dele com os próprios clientes.

Isso parece um detalhe de marketing, mas muda decisão de produto todo dia. Um CRM genérico não sabe o que é uma obrigação de IVA trimestral. Um ERP genérico não tem como conceito nativo um "cliente" que é ao mesmo tempo uma empresa com CAE e regime fiscal e uma pessoa que precisa de portal próprio para mandar documento. O Teglion tem os dois porque foi desenhado a partir do problema real de um escritório português, não adaptado de outro setor.

O modelo de dado já nasce com o vocabulário certo: cliente pode ser empresa ou particular, com campos que fazem sentido fiscal para cada um — regime de IVA some da ficha de um particular porque particular não tem IVA, não é um campo genérico "tipo de cliente" com configuração solta. Obrigações têm categoria, prazo e cliente amarrado. O calendário fiscal nacional de Portugal vem pré-carregado, não é uma planilha que o escritório precisa montar.

Isso é o oposto de "plataforma genérica que serve para tudo". É a aposta de que servir bem um tipo de negócio específico vale mais, no início, do que servir mal vários.

### O que o Teglion não tenta ser

Não tenta ser um software de contabilidade que substitui o sistema de faturamento ou o programa de IES/SAF-T que o escritório já usa e é obrigado a usar por lei. O Teglion organiza a operação e o relacionamento — clientes, documentos, prazos, comunicação, captação — não faz a contabilidade em si. É uma diferença que precisa ficar clara para quem conhece o setor: o Teglion não compete com o software fiscal certificado, ele cerca esse software com tudo que ele não faz.

O posicionamento de longo prazo é para escritórios de contabilidade e, na sequência natural, outros serviços profissionais com o mesmo formato de operação (cliente recorrente, prazo, documento, comunicação, agendamento) — não é uma aposta em virar plataforma horizontal de gestão de negócio.

## Diferenciais

Comparado com o que um escritório de contabilidade pequeno ou médio realmente usa hoje — não com concorrência hipotética, com a alternativa real.

**Frente a WhatsApp + email + planilha.** É a comparação mais honesta, porque é o que a esmagadora maioria dos escritórios desse porte usa de fato. Ali, o diferencial do Teglion é estrutural: documento, prazo, cliente e conversa vivem amarrados uns aos outros, não em quatro lugares que ninguém cruza. Isso não é sofisticação técnica — é o motivo mais concreto para um escritório trocar de ferramenta.

**Frente a um CRM genérico.** Um CRM genérico não sabe o que é uma obrigação de IVA, não tem calendário fiscal português pré-carregado, não separa "cliente empresa com CAE" de "cliente particular sem IVA" como conceito nativo. Ele resolveria o pedaço de "cliente e comunicação", mas o escritório teria que adaptar tudo o resto por fora. O Teglion nasce com o vocabulário certo.

**Frente a um software de contabilidade tradicional.** Software de contabilidade certificado (o que gera IES, SAF-T, obrigações declarativas) não é substituído pelo Teglion, nem tenta ser — é o oposto: o Teglion cobre exatamente o que esse tipo de sistema não cobre: relação com cliente, comunicação, captação, organização de documento antes de virar lançamento contábil.

### O que é diferencial real hoje e o que ainda não é

Sendo direto sobre o que a auditoria de 2026 confirmou: isolamento entre escritórios, portal do cliente, integração real com Google Calendar/Drive e a base de pagamento do cliente final via Stripe Connect são concretos hoje — funcionam, foram verificados em código, não são promessa (o Connect está desligado por padrão e com lacuna de teste automatizado, mas a base existe, ver [`docs/architecture/INTEGRATIONS.md`](../architecture/INTEGRATIONS.md)). Já billing com planos diferenciados por tier não é diferencial hoje porque não existe ainda como regra de negócio — existe só a interface técnica que vai sustentar isso no futuro (ver [BUSINESS_MODEL.md](./BUSINESS_MODEL.md)), não é algo para vender como pronto agora.

O maior diferencial potencial do Teglion não é nenhuma funcionalidade isolada — é a experiência de abrir um único lugar e ver tudo que importa sobre a operação do escritório hoje. Isso ainda não está inteiramente entregue; é o objetivo dos itens de retenção e produto do `docs/ROADMAP.md`.

## Identidade de marca e responsabilidade

Decisão oficial de identidade (2026-08-14, com revisão de textos legais em 2026-08-18). Aplica-se a toda comunicação comercial, produto e documento jurídico do Teglion.

### Quem é quem

| Nome | Papel |
|---|---|
| AfDigital — Soluções Tecnológicas | Entidade que desenvolve e opera o produto |
| Teglion | Nome comercial / marca do produto SaaS |
| teglion.com | Domínio do produto |

**Teglion não é** empresa, pessoa jurídica, sociedade, operador ou entidade contratual independente. A arquitetura de identidade é: AfDigital — Soluções Tecnológicas → Teglion → teglion.com.

### O que pode e o que não pode ser dito

Permitido: "Teglion", "Teglion · Um produto da AfDigital — Soluções Tecnológicas", "O Teglion é um produto da AfDigital — Soluções Tecnológicas", "plataforma de gestão … desenvolvida e operada pela AfDigital — Soluções Tecnológicas".

Proibido: "Teglion, Lda." / "Teglion, S.A.", ou qualquer afirmação de que "Teglion é uma empresa" ou "entidade jurídica". Documento jurídico nunca atribui personalidade jurídica ao nome "Teglion" — quando a identificação jurídica for necessária, usa-se os dados legais oficiais da AfDigital, só depois de confirmados. Nenhum dado legal é inventado (razão social, NIF, endereço, CAE, encarregado de dados, subprocessador, prazo de retenção, SLA): lacuna vira decisão jurídica pendente, nunca suposição preenchida.

### Responsabilidade: cada parte responde pelo que controla

A AfDigital não é automaticamente responsável por todos os dados, conteúdos e decisões dos escritórios ou dos clientes deles. O princípio distingue sempre: o que a AfDigital determina e presta; o que o escritório determina e fornece; o que os usuários e titulares de dados fazem; o que fornecedores terceiros prestam; e o que cabe a integrações externas. Cada parte responde pelo que efetivamente controla, determina e promete — nada mais.

### RGPD é analisado por fluxo, não como papel único

Em vez de assumir um papel fixo (Responsável pelo Tratamento, Subcontratante etc.) para todo tipo de dado tratado, cada fluxo — conta, autenticação, clientes do escritório, documentos, comunicações, agenda, página pública, pagamentos, integrações (Stripe, Google, email, SMS) — é analisado individualmente por finalidade, meios, acesso e fornecedor envolvido, e só então se define o papel. Fornecedores efetivamente usados (Stripe, Supabase, Google, Cloudflare, Vercel, Render, Brevo, Sentry, entre outros) são auditados sem inventar fato sobre eles.

### Onde isso aparece no produto

Identidade comercial e contatos públicos ficam centralizados em configuração de frontend (não espalhados em texto solto); a landing traz uma seção de transparência e rodapé institucional; o app autenticado mantém rodapé mínimo, com detalhe em Configurações → Ajuda / Sobre o Teglion. Revisão jurídica profissional continua recomendada para o conjunto de textos legais.

## Como o negócio deve crescer, em ordem

O modelo comercial do Teglion segue uma sequência deliberada — não é uma lista de recursos a implementar quando der tempo, é uma ordem de prioridade que existe porque pular uma etapa custa mais caro do que cumpri-la:

1. **Assinatura do escritório** (hoje) — a base do negócio, já funcionando.
2. **Planos diferenciados por tier** (futuro próximo) — quando a base de clientes justificar a segmentação, com uma camada de entitlements central em vez de checagem de plano espalhada pelo código.
3. **Add-ons vendáveis separadamente** (futuro) — página pública, domínio personalizado, IA, mais armazenamento, mais usuários — cada um vendido como extra sobre o plano base.
4. **Stripe Connect** (construído, ainda desligado por padrão) — o escritório recebendo pagamento dos próprios clientes através da plataforma, com taxa de serviço retida automaticamente. Diferente dos outros itens desta lista, a base técnica já existe — falta decidir quando ativar em produção e fechar as lacunas conhecidas (teste automatizado, proteção contra corrida de condição no agendamento pago).

Diferenciar por tier — mais clientes, mais usuários, mais armazenamento, recursos avançados — só faz sentido quando existe uma base de clientes grande o bastante para a segmentação ser real, não hipotética. Lançar múltiplos planos cedo demais, sem entender o que cada perfil de escritório realmente valoriza, é mais chute que estratégia. Detalhe completo do estado atual em [BUSINESS_MODEL.md](./BUSINESS_MODEL.md).
