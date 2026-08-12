# Billing — estado técnico real

Complementa [STRIPE.md](../05-INTEGRACOES/STRIPE.md) com o recorte de negócio. Aqui o foco é "o billing está pronto para cobrar cliente real", não os detalhes técnicos de implementação.

## O que já está pronto — IMPLEMENTADO

Fluxo completo de checkout até assinatura ativa, portal de autoatendimento para o escritório gerenciar a própria assinatura, processamento de webhook com verificação de assinatura e proteção real contra reprocessamento duplicado. O acesso ao produto é reavaliado a cada renovação de sessão, então uma mudança de status de pagamento se reflete rápido. Nada disso é maquete — é código funcional, verificado na auditoria de 12/08/2026.

## O que precisa de atenção antes de cobrar em escala

**Sem tolerância em falha de pagamento.** Corte de acesso é imediato, sem aviso prévio ao escritório. Numa base pequena isso é administrável manualmente; numa base maior, vira motivo de reclamação evitável.

**A duração do teste grátis não segue a variável de configuração que parece controlá-la** — está fixa em outro lugar do código. Risco de alguém mudar a configuração errada achando que mudou o comportamento real.

**Segredos de produção do Stripe** estão hoje presentes num ambiente local sem rotação — tratado com prioridade máxima no [Sprint 0](../02-ROADMAP/SPRINT-0.md).

**Sem teste automatizado cobrindo o processamento de webhook** — o caminho mais crítico do billing não tem rede de segurança de teste hoje.

## O modelo comercial vigente

35€/mês, ou 359,88€/ano (equivalente a 29,99€/mês), 14 dias de teste sem cartão, um único plano. A calculadora de preço nunca fica fixa em código — vem de configuração central, o que é o padrão correto para evitar preço divergente entre o site, o app e o Stripe.

## Resposta direta

O código de billing está pronto para cobrar cliente real. O que falta não é código — é confirmação operacional (as chaves de produção certas estão realmente configuradas no ambiente de produção, e foram rotacionadas depois da exposição identificada na auditoria) e a decisão consciente sobre tolerância em falha de pagamento antes de escalar para múltiplos escritórios pagantes.
