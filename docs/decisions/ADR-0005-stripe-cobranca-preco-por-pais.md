# ADR-0005 — Stripe como provedor de cobrança, com resolução de preço por país

## Status

Aceito, com implementação parcial. Decisão já em vigor — documentei retroativamente em 18/08/2026.

## Contexto

Cobro dos escritórios uma assinatura SaaS (billing) e também processo pagamentos de clientes para escritórios via Stripe Connect (esses são dois usos distintos e independentes do Stripe no meu sistema). Estou me preparando para operar em mais de um país (Portugal hoje, Brasil em preparação — ver ADR-0002 e ADR-0006), o que levanta a questão de que preço e moeda cobrar de um escritório dependendo de onde ele está.

## Problema

Como eu cobro assinaturas via Stripe de forma que o preço (e eventualmente a moeda) cobrado dependa do país do escritório, sem eu precisar reescrever a integração de billing a cada novo país que eu suportar?

## Decisão

Uso Stripe como provedor de cobrança do Teglion. Resolvo qual Price ID do Stripe usar através de uma função dedicada, `resolveSubscriptionPriceId(countryCode, interval)` (`backend/src/services/stripe/stripe-client.js`), que já tem branches condicionais por país:

```
if (cc === 'BR' && env.STRIPE_PRICE_ID_BRL) return env.STRIPE_PRICE_ID_BRL;
if (cc === 'US' && env.STRIPE_PRICE_ID_USD) return env.STRIPE_PRICE_ID_USD;
```

com fallback para os Price IDs em EUR (`STRIPE_PRICE_ID_EUR_MONTHLY`/`STRIPE_PRICE_ID_EUR_YEARLY`/`STRIPE_PRICE_ID_EUR`/`STRIPE_PRICE_ID`) quando o país não tem um price específico configurado. Hoje, não configurei `STRIPE_PRICE_ID_BRL` em nenhum ambiente — o branch existe no código, pronto para ser ativado, mas não está em uso.

## Alternativas consideradas

Não encontrei evidência de uma avaliação documentada de provedores de cobrança alternativos a Stripe. Parece que tomei a decisão de usar Stripe como parte da fundação do produto, não como uma escolha entre opções que registrei. O que documento aqui com evidência direta é a estratégia de resolução de preço por país dentro do uso que já decidi de Stripe.

## Motivos da decisão

- Ter uma função central de resolução de preço por país (em vez de espalhar `if (país === 'BR')` por vários pontos do código de billing) significa que ativar um novo mercado é, na parte de preço, uma questão de configurar variáveis de ambiente (`STRIPE_PRICE_ID_BRL`) e criar o Price correspondente no painel do Stripe — não de alterar lógica.
- Isso segue o mesmo padrão estrutural do ADR-0006 (tipo de obrigação `CUSTOM`): construo o ponto de extensão antes de precisar dele por completo, para que a expansão de mercado não dependa de reescrever módulos inteiros.

## Consequências positivas

- Estender para um novo país no aspecto de preço de assinatura é, em teoria, uma mudança de configuração, não de código, quando o branch já existe (como já é o caso para BR e US).
- Um único ponto de verdade para "qual preço cobrar" reduz o risco de inconsistência entre diferentes telas ou fluxos que precisem saber o preço.

## Consequências negativas

- Implementei essa decisão de forma parcial e isso tem uma consequência concreta que já identifiquei: o campo `currency` retornado pela minha API de billing hoje é fixo em EUR, independentemente do país resolvido pela função de preço. `backend/src/config/pricing-plans.js` tem `CURRENCY = 'EUR'` fixo, e o mesmo padrão (`DEFAULT 'EUR'`) se repete em `service_requests`, `services`, `consultations` e `firm_payments` — nenhum ligado a `firm.country_code`. Na prática, se eu configurasse `STRIPE_PRICE_ID_BRL` hoje, um escritório brasileiro veria o preço exibido em euros mas seria cobrado em reais pelo Stripe — uma divergência visível e ruim de experiência, não um problema de segurança, mas um problema real de produto. Ver `docs/ROADMAP.md`, item 3.1, estado `PLANEJADO`, prioridade P0.
- Essa lacuna não é um defeito da decisão de ter resolução de preço por país — é consequência de eu ainda não ter completado a implementação ponta a ponta (preciso ligar a moeda exibida à mesma fonte que já resolve o preço).

## Riscos

- Enquanto eu não configurar `STRIPE_PRICE_ID_BRL`, o branch de resolução para o Brasil é código morto não testado em produção — o primeiro uso real dele (quando eu ativar o Brasil) vai ser também o primeiro teste real, o que é um risco que preciso mitigar testando antes do lançamento (ver `docs/ROADMAP.md`, Fase 5: "`STRIPE_PRICE_ID_BRL` configurado e testado em ambiente de teste antes de produção").
- Se eu não corrigir a moeda exibida (item 3.1) antes de ativar um novo país com moeda diferente, o problema deixa de ser teórico e passa a afetar escritórios reais sendo cobrados em valor diferente do que viram na tela.

## Impacto futuro

- Antes de ativar qualquer país com moeda diferente de EUR em produção, preciso concluir o item 3.1 do roadmap (ligar `currency` ao país do escritório, em todos os pontos onde hoje está fixo em EUR) — é bloqueador de fato para mim, mesmo que eu não tenha marcado formalmente como dependência técnica do lançamento do Stripe em si.
- Novos países devem seguir o mesmo padrão que usei: adicionar um branch em `resolveSubscriptionPriceId`, configurar o Price ID correspondente no Stripe, e — a partir da correção do item 3.1 — garantir que a moeda exibida também siga essa mesma fonte de verdade.

## Relação com outros ADRs

- ADR-0002 (país como propriedade do tenant): `resolveSubscriptionPriceId` usa `firm.country_code` como entrada — é um exemplo direto de eu usar país para adaptar comportamento sem virar mecanismo de autorização.
- ADR-0006 (tipo de obrigação `CUSTOM`): mesma estratégia arquitetural que usei — construir o ponto de extensão por país antes de ter automação completa para todo país que suporto.
