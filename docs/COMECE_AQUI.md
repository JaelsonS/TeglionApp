# Começa aqui

**Escrito para mim mesmo, 2026-08-06.** Se um dia eu perder o fio à meada do que é o Teglion, para onde vai e o que fazer a seguir, é este o documento que leio primeiro.

---

## O que é isto, em três frases

O Teglion é um sistema para escritórios de contabilidade em Portugal pararem de perseguir documentos por WhatsApp e email. O escritório gere clientes, pede documentos, acompanha prazos fiscais e comunica tudo num único sítio; cada cliente do escritório tem o seu próprio portal para saber exactamente o que falta entregar. É multi-tenant desde o início — cada escritório vive isolado dos outros na mesma plataforma.

Não é um ERP, não é software de facturação, não é mais um CRM genérico. É a base digital de relação entre o escritório e os clientes dele.

---

## Como cheguei aqui (a história curta)

O Teglion nasceu de um pivot. O código tem raízes num produto anterior de marketplace clínico ("SaaSude" — pacientes, médicos, marcações). Em Julho de 2026 esse domínio foi arrancado do código activo (confirmei nesta sessão: zero ficheiros no `backend/src` ou `frontend/src` ainda mencionam paciente/médico/clínica/registo médico) e a base foi reorientada para contabilidade. Ainda há resíduos inofensivos dessa história — nomes de colunas `legacy_*` na base de dados (todas vazias, confirmei com uma query directa: 0 registos em todas) e um mecanismo de desencriptação de dados antigos que nunca chega a ser usado. Não há nada para apagar aí que traga risco; é só arqueologia de código, não uma ferida aberta.

---

## Onde estou agora, sem filtro (2026-08-06)

- **1 escritório piloto real** em produção, a usar o sistema no dia a dia, mais um segundo registo de teste — 2 "firms" e 39 clientes no total na base de dados hoje. É pouco. É o início.
- **Infra toda em plano gratuito** — Render, Vercel, Supabase. O Render em free tier "dorme" depois de inactividade; o primeiro pedido depois de dormir demora. Isto é uma limitação real, não imaginária, e vai pesar assim que houver mais do que um escritório a bater à porta ao mesmo tempo.
- **Stripe ainda em test mode.** Os preços (35€/mês, 359,88€/ano) já estão definidos e documentados, faltam os Price IDs live no Render.
- **Segurança:** auditoria de código completa feita (duas vezes, na verdade — uma sessão anterior a 05/08 e esta sessão a 06/08). Nenhuma vulnerabilidade crítica activa encontrada. Os pontos médios já identificados foram corrigidos e estão em produção desde hoje (heurística de isolamento tenant, alerta activo se o Redis cair, CSP mais restritivo no backend). Detalhe: [`docs/security/SECURITY.md`](security/SECURITY.md) e [`docs/security/AUDIT_2026-08-05.md`](security/AUDIT_2026-08-05.md).
- **Isolamento entre escritórios:** testado a sério (`backend/scripts/tenant-isolation-test.js` simula dois escritórios e tenta cruzar dados) e aprovado, mas ainda não corre sozinho a cada PR — porque `local`, `staging` e `produção` partilham hoje a mesma base Supabase (sem dinheiro extra para uma segunda, por agora). Isto está mapeado e tem um caminho de saída sem custo: [`docs/operations/FREE_PLAN_SETUP.md`](operations/FREE_PLAN_SETUP.md).

Isto não é pouco para um projecto a solo em infra gratuita. É uma base tecnicamente mais sólida do que a maioria dos MVPs neste estágio. O que falta agora não é reescrever nada — é fechar as pontas soltas do comercial e da fiabilidade antes de gastar em marketing.

---

## O que já está sólido 

- Autenticação em cookies `httpOnly` + `Secure`, nunca tokens em `localStorage`.
- CSRF, CORS com lista de origens (nunca wildcard), rate limiting dedicado em login/registo/recuperação de password.
- Hash de password com Argon2id, lockout de força bruta persistido em base de dados.
- RBAC granular por permissão, aplicado por omissão em todas as rotas autenticadas.
- Upload de ficheiros validado por conteúdo real (magic bytes), não só pela extensão.
- Sanitização de logs e de respostas da API (nunca vaza hash de password nem token).

---

## O que falta antes de abrir a porta a sério

Não vou repetir aqui — está sequenciado, sprint a sprint, em [`docs/product/SPRINT_PLAYBOOK.md`](product/SPRINT_PLAYBOOK.md). Resumo de uma linha: fechar staging isolado (grátis, já tem guia), sair de Stripe test mode, ter monitorização de uptime, e só depois investir em marketing.

---

## A minha opinião honesta sobre o que isto pode ser

Perguntaste-me o que acho que o projecto pode se tornar. Aqui vai, sem filtro:

**O produto em si já não é o gargalo.** Documentos, prazos, portal do cliente, mensagens, facturação — está tudo a funcionar, testado, com um piloto real a validar no dia a dia. Comparado com a maioria dos SaaS neste estágio, a fundação técnica está incomumente sólida (RBAC, CSRF, tenant isolation testado, CI a correr). O `ROADMAP.md` que já escreveste é ambicioso e bem pensado — plataforma de crescimento para escritórios, não só ferramenta operacional — e concordo com a tese: um contabilista que "parece premium" para o cliente dele é um posicionamento genuinamente diferenciado num mercado cheio de Excel e WhatsApp.

**O gargalo real hoje é repetibilidade, não escala.** Tens 1 escritório validado. Antes de qualquer euro em ads ou "marketing forte", o que prova se isto é um negócio é conseguir 3 a 5 escritórios *novos*, sem seres tu a fazer onboarding manual, a pagar o preço real, a ficar mais de 60 dias. Isso é uma pergunta completamente diferente de "quantos escritórios cabem na infra" — é "alguém que não te conhece paga por isto e fica". O `ROADMAP.md` já sabe disto (Fase 1: "50–200 escritórios pagantes com zero incidentes graves"), só reforço: não saltes para Fase 3 (growth machine, ads pagos) sem teres essa resposta com 3-5 clientes pagantes reais primeiro. É mais barato descobrir num Excel de 5 linhas que o onboarding tem fricção do que descobrir depois de gastar em Google Ads.

**A limitação de infra gratuita é a primeira coisa a resolver quando houver o primeiro euro de receita.** Um Render que dorme é aceitável para 1 piloto que já confia em ti. É inaceitável para um escritório novo que testou o produto pela primeira vez e esperou 40 segundos pela API acordar. O upgrade para o plano pago do Render (não é caro, ~7 USD/mês) deve ser praticamente a primeira coisa que a primeira assinatura Stripe paga.

**Onde eu investiria a seguir, por ordem, se fosse eu:** (1) tirar o Stripe de test mode — sem isto não há negócio, só promessa; (2) sair do Render free tier assim que houver a primeira assinatura paga; (3) staging isolado grátis (já tens o guia, é só executar); (4) 3 conversas de venda a sério com outros escritórios de contabilidade, mesmo antes da landing v2 estar perfeita — vais aprender mais sobre objecções reais em 3 conversas do que em 3 meses a polir a landing sozinho.

Não é um projecto parado. É um projecto pronto para o próximo passo, que é sair de "só a contadora piloto" para "mais alguém, que não te conhece, também paga e fica". Isso é uma mudança de tipo de trabalho — de engenharia para validação comercial — não de mais código.

---

## Ordem de leitura recomendada

Depende do que precisas de entender agora. Escolhe o caminho:

### "Quero relembrar o estado técnico e o que fazer a seguir"
1. Este documento (já estás aqui)
2. [`docs/operations/STATUS.md`](operations/STATUS.md) — estado técnico detalhado
3. [`docs/product/SPRINT_PLAYBOOK.md`](product/SPRINT_PLAYBOOK.md) — os próximos passos, em sequência
4. [`docs/company/EVOLUTION_PLAN.md`](company/EVOLUTION_PLAN.md) — o que fazer amanhã, especificamente

### "Quero entender a visão de negócio e para onde isto vai"
1. Este documento
2. [`docs/product/VISION.md`](product/VISION.md) — missão e valores
3. [`docs/product/ROADMAP.md`](product/ROADMAP.md) — plano estratégico de 5 anos
4. [`docs/product/PRODUCT.md`](product/PRODUCT.md) — modelo de negócio e pricing

### "Preciso de mexer no código / fazer deploy"
1. [`README.md`](../README.md) — arranque local
2. [`docs/operations/DEV_LOCAL.md`](operations/DEV_LOCAL.md) — ambiente de desenvolvimento
3. [`docs/engineering/ARCHITECTURE.md`](engineering/ARCHITECTURE.md) — como o sistema está construído
4. [`docs/operations/BRANCHING.md`](operations/BRANCHING.md) — como promover código (`feature → staging → main`)
5. [`docs/operations/DEPLOY_PRODUCTION.md`](operations/DEPLOY_PRODUCTION.md) — deploy de produção

### "Preciso de confiar que isto está seguro"
1. [`docs/security/SECURITY.md`](security/SECURITY.md) — política de segurança viva
2. [`docs/security/AUDIT_2026-08-05.md`](security/AUDIT_2026-08-05.md) — última auditoria completa
3. [`docs/security/TENANT_ISOLATION_REPORT.md`](security/TENANT_ISOLATION_REPORT.md) — prova de que um escritório não vê dados de outro

### "Preciso de saber o que o piloto real está a dizer"
1. [`docs/CLIENTE_PILOTO/ROADMAP.md`](CLIENTE_PILOTO/ROADMAP.md) — diário do piloto
2. [`docs/CLIENTE_PILOTO/PEDIDOS_CONTADORA.md`](CLIENTE_PILOTO/PEDIDOS_CONTADORA.md) — pedidos directos dela
3. [`docs/CLIENTE_PILOTO/BUGS_ENCONTRADOS.md`](CLIENTE_PILOTO/BUGS_ENCONTRADOS.md) — o que já partiu na mão dela

---

## Regra que não quero esquecer

Há um escritório real a usar isto todos os dias, com dados reais dos clientes dele. Qualquer mudança de código segue `feature/staging → staging → main`, nunca directo. Qualquer dúvida sobre "isto pode partir produção?" — a resposta por omissão é parar e verificar em staging primeiro, não assumir que está bem.
