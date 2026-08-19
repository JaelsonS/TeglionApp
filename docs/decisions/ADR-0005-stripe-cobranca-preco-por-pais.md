# ADR-0005 — Stripe como provedor de cobrança, com resolução de preço por país

## Status

Aceito, com implementação parcial. Decisão já em vigor, documentada retroativamente em 18/08/2026.

## Contexto

O Teglion cobra dos escritórios uma assinatura SaaS (billing) e também processa pagamentos de clientes para escritórios via Stripe Connect (esses são dois usos distintos e independentes do Stripe no sistema). O Teglion está se preparando para operar em mais de um país (Portugal hoje, Brasil em preparação — ver ADR-0002 e ADR-0006), o que levanta a questão de que preço e moeda cobrar de um escritório dependendo de onde ele está.

## Problema

Como cobrar assinaturas via Stripe de forma que o preço (e eventualmente a moeda) cobrado dependa do país do escritório, sem exigir uma reescrita da integração de billing a cada novo país suportado?

## Decisão

Stripe é o provedor de cobrança do Teglion. A resolução de qual Price ID do Stripe usar é feita por uma função dedicada, `resolveSubscriptionPriceId(countryCode, interval)` (`backend/src/services/stripe/stripe-client.js`), que já tem branches condicionais por país:

```
if (cc === 'BR' && env.STRIPE_PRICE_ID_BRL) return env.STRIPE_PRICE_ID_BRL;
if (cc === 'US' && env.STRIPE_PRICE_ID_USD) return env.STRIPE_PRICE_ID_USD;
```

com fallback para os Price IDs em EUR (`STRIPE_PRICE_ID_EUR_MONTHLY`/`STRIPE_PRICE_ID_EUR_YEARLY`/`STRIPE_PRICE_ID_EUR`/`STRIPE_PRICE_ID`) quando o país não tem um price específico configurado. Hoje, `STRIPE_PRICE_ID_BRL` não está configurado em nenhum ambiente — o branch existe no código, pronto para ser ativado, mas não está em uso.

## Alternativas consideradas

Não há evidência de uma avaliação documentada de provedores de cobrança alternativos a Stripe. A decisão de usar Stripe parece ter sido tomada como parte da fundação do produto, não como uma escolha entre opções registradas. O que este ADR documenta com evidência direta é a estratégia de resolução de preço por país dentro do uso já decidido de Stripe.

## Motivos da decisão

- Ter uma função central de resolução de preço por país (em vez de espalhar `if (país === 'BR')` por vários pontos do código de billing) significa que ativar um novo mercado é, na parte de preço, uma questão de configurar variáveis de ambiente (`STRIPE_PRICE_ID_BRL`) e criar o Price correspondente no painel do Stripe — não de alterar lógica.
- Isso segue o mesmo padrão estrutural do ADR-0006 (tipo de obrigação `CUSTOM`): construir o ponto de extensão antes de precisar dele por completo, para que a expansão de mercado não dependa de reescrever módulos inteiros.

## Consequências positivas

- Extensão para um novo país no aspecto de preço de assinatura é, em teoria, uma mudança de configuração, não de código, quando o branch já existe (como já é o caso para BR e US).
- Um único ponto de verdade para "qual preço cobrar" reduz o risco de inconsistência entre diferentes telas ou fluxos que precisem saber o preço.

## Consequências negativas

- A decisão está implementada de forma parcial e isso tem uma consequência concreta e já identificada: o campo `currency` retornado pela API de billing hoje é fixo em EUR, independentemente do país resolvido pela função de preço. `backend/src/config/pricing-plans.js` tem `CURRENCY = 'EUR'` fixo, e o mesmo padrão (`DEFAULT 'EUR'`) se repete em `service_requests`, `services`, `consultations` e `firm_payments` — nenhum ligado a `firm.country_code`. Na prática, se `STRIPE_PRICE_ID_BRL` fosse configurado hoje, um escritório brasileiro veria o preço exibido em euros mas seria cobrado em reais pelo Stripe — uma divergência visível e ruim de experiência, não um problema de segurança, mas um problema real de produto. Ver `docs/ROADMAP.md`, item 3.1, estado `PLANEJADO`, prioridade P0.
- Essa lacuna não é um defeito da decisão de ter resolução de preço por país — é uma consequência de a implementação ainda não ter sido completada ponta a ponta (moeda exibida precisa ser ligada à mesma fonte que already resolve o preço).

## Riscos

- Enquanto `STRIPE_PRICE_ID_BRL` não estiver configurado, o branch de resolução para o Brasil é código morto não testado em produção — o primeiro uso real dele (quando o Brasil for ativado) é também o primeiro teste real, o que é um risco a mitigar com teste antes do lançamento (ver `docs/ROADMAP.md`, Fase 5: "`STRIPE_PRICE_ID_BRL` configurado e testado em ambiente de teste antes de produção").
- Se a moeda exibida (item 3.1) não for corrigida antes de ativar um novo país com moeda diferente, o problema deixa de ser teórico e passa a afetar escritórios reais sendo cobrados em valor diferente do que viram na tela.

## Impacto futuro

- Antes de ativar qualquer país com moeda diferente de EUR em produção, o item 3.1 do roadmap (ligar `currency` ao país do escritório, em todos os pontos onde hoje está fixo em EUR) precisa estar concluído — é bloqueador de fato, mesmo que não esteja marcado formalmente como dependência técnica do lançamento do Stripe em si.
- Novos países devem seguir o mesmo padrão: adicionar um branch em `resolveSubscriptionPriceId`, configurar o Price ID correspondente no Stripe, e — a partir da correção do item 3.1 — garantir que a moeda exibida também siga essa mesma fonte de verdade.

## Relação com outros ADRs

- ADR-0002 (país como propriedade do tenant): `resolveSubscriptionPriceId` usa `firm.country_code` como entrada — é um exemplo direto de país sendo usado para adaptar comportamento sem virar mecanismo de autorização.
- ADR-0006 (tipo de obrigação `CUSTOM`): mesma estratégia arquitetural de construir o ponto de extensão por país antes de ter automação completa para todo país suportado.
