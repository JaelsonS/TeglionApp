# Planos

## O que existe hoje — IMPLEMENTADO

Um único plano, dois ciclos de cobrança: 35€/mês no mensal, 359,88€/ano no anual (equivalente a 29,99€/mês), com 14 dias de teste grátis sem pedir cartão. Sem diferenciação de recurso — todo escritório com assinatura ativa tem acesso ao mesmo conjunto de funcionalidades. Detalhe técnico completo em [BILLING.md](./BILLING.md).

## A estrutura de planos futuros — PLANEJADO

Ainda não implementado, sem preço definido. O que se documenta aqui é a lógica de segmentação, não um valor em euros. Os nomes abaixo são placeholders — o que importa é o conceito de cada degrau, não o rótulo.

**FREE/TRIAL** — o que já existe hoje: acesso completo por tempo limitado, sem cartão, para o escritório validar o produto antes de decidir.

**STARTER** — o próximo degrau lógico: limite de quantidade de clientes e de usuários mais apertado, sem recursos avançados (página pública customizada, IA, automações), pensado para o escritório pequeno testando o produto como ferramenta principal pela primeira vez.

**PRO** — o plano que hoje já existe, essencialmente: uso completo dos módulos centrais (clientes, documentos, mensagens, obrigações, agenda, captação de serviço), com limites mais generosos de clientes e usuários.

**BUSINESS** — para escritórios maiores: mais usuários, mais armazenamento, relatórios mais avançados, prioridade de suporte.

**ENTERPRISE** — negociado caso a caso, para escritórios com necessidade específica de integração, volume ou processo de compra corporativo.

## O que cada tier controlaria, conceitualmente

Limite de clientes cadastrados, limite de usuários da equipe, limite de armazenamento de documento, limite de emails enviados por mês, disponibilidade de página pública, domínio personalizado, funcionalidades de IA, quantidade de serviços publicáveis, quantidade de agendamentos por mês, automações, relatórios avançados.

## Add-ons — comprados separadamente do plano base

Página pública, domínio personalizado, geração de conteúdo com IA, pacote adicional de emails, armazenamento extra, usuário adicional além do limite do plano — cada um vendável como módulo avulso sobre qualquer plano base, sem forçar upgrade completo de tier só para acessar um recurso específico.

## Por que isso ainda não está implementado

A segmentação por plano só faz sentido quando existe uma base de clientes real mostrando quais recursos cada perfil de escritório valoriza de verdade. Lançar tiers baseado em suposição, antes disso, é mais chute que estratégia — ver [FEATURE-GATING.md](./FEATURE-GATING.md) para como essa transição deve acontecer tecnicamente quando chegar a hora.
