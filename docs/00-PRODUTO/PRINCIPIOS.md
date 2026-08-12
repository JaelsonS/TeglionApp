# Princípios

Estes princípios vêm de decisões já tomadas no produto e no código — não são aspiração solta. Cada um tem um exemplo concreto do que ele significa na prática.

## Um escritório nunca vê dado de outro

Não é um princípio abstrato de segurança — é o que separa o Teglion de ser vendável para múltiplos escritórios ou não. Toda decisão de arquitetura que envolve dado de cliente passa por essa pergunta primeiro. O estado real disso, com evidência de código, está em [MULTI-TENANT-SECURITY.md](../06-SEGURANCA/MULTI-TENANT-SECURITY.md) — inclusive onde ainda há risco residual, porque esconder isso seria violar o próprio princípio.

## Documentar o que existe, não o que a gente gostaria que existisse

Esta própria reconstrução de documentação, a partir de 12/08/2026, nasce desse princípio: a documentação anterior tinha reivindicação otimista demais em alguns pontos. A partir de agora, todo documento técnico usa os estados IMPLEMENTADO, PARCIAL, EM DESENVOLVIMENTO, PLANEJADO ou NÃO EXISTE — nunca descrever uma coisa futura como se já estivesse pronta.

## Simples para quem não é técnico

O cliente final de um escritório não é um usuário de tecnologia por vocação — é uma empresa ou pessoa que só quer resolver a vida fiscal dela. Cada tela pensada para esse público prioriza clareza sobre poder — menos opção, mais óbvio o que fazer a seguir.

## Não inventar funcionalidade por vaidade técnica

Feature gating, Stripe Connect, IA — várias coisas que fariam sentido em algum momento futuro não existem hoje de propósito, porque não resolvem um problema real do estágio atual do produto. Construir antes da necessidade real é desperdício disfarçado de progresso.

## Risco real é dito em voz alta, não escondido atrás de "está tudo bem"

Quando a auditoria de 2026 encontrou um problema — uma sessão que não é revogada corretamente, uma corrida de condição no agendamento — o caminho não foi minimizar. Foi nomear o risco, classificar a gravidade, e tratar como bloqueador antes de vender abertamente. Esse princípio vale tanto para segurança quanto para qualquer parte do produto: sinalizar problema é parte do trabalho, não uma falha em fazer o trabalho.

## O core não muda para acomodar um caso especial de um cliente

Escritório de contabilidade tem particularidade — cada um faz as coisas um pouco diferente. O produto absorve isso através de configuração (categoria de documento, tipo de serviço, template de obrigação) em vez de código específico para um cliente. Isso é o que permite o mesmo sistema atender o escritório piloto de hoje e o centésimo escritório de amanhã sem virar um Frankenstein de exceções.
