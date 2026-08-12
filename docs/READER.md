# Teglion

Um sistema para escritório de contabilidade organizar clientes, documentos, prazos e comunicação num único lugar — com um portal para o cliente final do escritório usar do outro lado.

Este documento é o ponto de entrada. Se você nunca viu o Teglion antes, leia isto primeiro, depois siga os links para onde precisar ir mais fundo.

## O problema

Um escritório de contabilidade pequeno em Portugal roda hoje em cima de WhatsApp, email e planilha. Documento do cliente chega numa conversa de celular que se perde no meio de outras cem. Prazo fiscal está na cabeça de quem trabalha lá há mais tempo. A ficha do cliente é uma linha numa planilha que só uma pessoa sabe atualizar direito. Cada ferramenta nova que entra não substitui as anteriores — só empilha em cima.

O Teglion existe para ser o lugar único onde essa operação acontece. O manifesto completo está em [00-PRODUTO/MANIFESTO.md](./00-PRODUTO/MANIFESTO.md).

## Para quem

Escritórios de contabilidade pequenos e médios em Portugal, e o dono do escritório que ainda está no dia a dia do atendimento — não uma estrutura corporativa grande com departamento de compras. Do outro lado, o cliente do escritório (empresa ou particular), que usa um portal próprio para enviar documento, conversar e acompanhar prazo. Detalhe completo em [01-ESTRATEGIA/PUBLICO-ALVO.md](./01-ESTRATEGIA/PUBLICO-ALVO.md).

Hoje existe uma contadora real usando o sistema no dia a dia — não é um ambiente de teste.

## Como funciona, por cima

O escritório cadastra cliente, organiza documento, acompanha obrigação fiscal, conversa por mensagem, e pode publicar uma página pública para captar cliente novo e receber agendamento — inclusive com pagamento processado direto na conta do próprio escritório. O cliente final entra por um portal simples, sem curva de aprendizado, para resolver a parte dele: mandar documento, ver prazo, conversar.

Mapa completo dos módulos, com o que funciona e o que é parcial: [03-PRODUTO/MODULOS.md](./03-PRODUTO/MODULOS.md).

## Como o sistema é estruturado

React no navegador, um backend Node/Express próprio, banco de dados e armazenamento de arquivo no Supabase, email transacional via Brevo, pagamento via Stripe (assinatura do escritório e, mais recente, pagamento do cliente final ao escritório via Stripe Connect), agenda sincronizada com Google Calendar, importação de arquivo do Google Drive. Frontend na Vercel, backend no Render.

Visão de arquitetura em alto nível: [04-ARQUITETURA/ARCHITECTURE.md](./04-ARQUITETURA/ARCHITECTURE.md). Cada integração externa tem o próprio documento em [05-INTEGRACOES](./05-INTEGRACOES/).

## Modelo de negócio

Assinatura mensal ou anual paga pelo escritório — hoje um único plano, sem diferenciação de tier. O portal do cliente final vem incluído, sem cobrança separada. A lógica de planos futuros, add-on vendável, e a camada técnica de controle de acesso por funcionalidade (que já existe como scaffold, ainda em modo aberto) estão documentadas em [00-PRODUTO/MODELO-DE-NEGOCIO.md](./00-PRODUTO/MODELO-DE-NEGOCIO.md) e [08-BUSINESS](./08-BUSINESS/).

## Visão, missão, princípios

- [Visão](./00-PRODUTO/VISION.md): virar plataforma global para escritório de contabilidade e serviço profissional, começando em Portugal.
- [Missão](./00-PRODUTO/MISSION.md): ajudar o escritório a administrar operação, cliente e serviço num único lugar, reduzindo trabalho manual.
- [Princípios](./00-PRODUTO/PRINCIPIOS.md): as regras que já guiam decisão de produto hoje, não aspiração solta.

## Onde o produto está agora — 12 de agosto de 2026

Esta é a parte que mais importa para quem está decidindo se aposta no Teglion agora.

Em 12/08/2026, o produto passou por uma auditoria completa de código — não uma checagem superficial, uma leitura linha a linha da arquitetura, segurança, integrações e módulos, feita para responder a uma pergunta direta: **dá para colocar outros escritórios reais pagando pelo sistema amanhã?**

A resposta: **AMARELO — apto para piloto controlado, não apto para venda aberta ainda.**

Isso não é uma avaliação ruim. Significa: a base é sólida — isolamento entre escritórios verificado e sem vazamento encontrado, autenticação bem construída, integrações reais e funcionando de ponta a ponta (Google Calendar, Google Drive, a base de Stripe Connect) — mas existem sete riscos concretos, cada um com evidência de código e correção conhecida, que precisam ser fechados antes de abrir para venda além do piloto atual. Nenhum deles é grande o suficiente para dizer "não funciona"; juntos, são grande o suficiente para dizer "não ainda, com múltiplos clientes pagantes ao mesmo tempo".

Esses sete riscos são o [Sprint 0](./02-ROADMAP/SPRINT-0.md) — a prioridade máxima agora, antes de qualquer funcionalidade nova. O veredito completo, módulo por módulo, com o que é IMPLEMENTADO, PARCIAL ou NÃO EXISTE, está em [03-PRODUTO](./03-PRODUTO/), [05-INTEGRACOES](./05-INTEGRACOES/) e [06-SEGURANCA/MULTI-TENANT-SECURITY.md](./06-SEGURANCA/MULTI-TENANT-SECURITY.md).

## O que já está funcionando

Cliente, documento (com validação real de arquivo e três camadas de isolamento contra acesso cruzado), mensagem, calendário fiscal e obrigação (com lembrete automático), captação pública de serviço com formulário e checklist configurável, agendamento integrado ao Google Calendar, importação direta do Google Drive, alerta segmentado para cliente, billing de assinatura via Stripe já cobrando de verdade, e a base de Stripe Connect para o escritório receber pagamento do próprio cliente. Detalhe de cada um em [03-PRODUTO](./03-PRODUTO/).

## O que estamos construindo agora

Fechar o [Sprint 0](./02-ROADMAP/SPRINT-0.md): revogação de sessão de funcionário desativado, proteção contra dois clientes marcando o mesmo horário, teste de restore de banco de dados, teste automatizado de isolamento entre escritórios rodando sozinho, rotação de segredo de produção, correção de duplicidade de lembrete por email, suíte de teste de backend completa no pipeline de CI.

## Roadmap

Sprint 0 (riscos) → Sprint 1 (primeira receita fora do piloto) → Sprint 2 (retenção) → Sprint 3 a 5 (produto, escala, internacionalização). Cada sprint tem critério de saída específico, não lista solta de ideia. Tudo em [02-ROADMAP](./02-ROADMAP/), incluindo a visão até 2030 em [VISION-2030.md](./02-ROADMAP/VISION-2030.md).

## Como desenvolver

Estrutura do monorepo, comando de build/teste, e o padrão de módulo que todo código novo de backend segue: [07-OPERACAO/DEVELOPMENT.md](./07-OPERACAO/DEVELOPMENT.md). Antes de abrir PR que toca dado de escritório, leia [04-ARQUITETURA/MULTI-TENANCY.md](./04-ARQUITETURA/MULTI-TENANCY.md) — é o padrão que protege o isolamento entre escritórios, e não é opcional.

## Onde encontrar cada coisa

| Se você quer saber... | Vá para |
|---|---|
| O que é o Teglion, por que existe | [00-PRODUTO](./00-PRODUTO/) |
| Posicionamento, público, diferencial | [01-ESTRATEGIA](./01-ESTRATEGIA/) |
| O que vem a seguir, em que ordem | [02-ROADMAP](./02-ROADMAP/) |
| O que cada módulo do produto faz de verdade | [03-PRODUTO](./03-PRODUTO/) |
| Como o sistema é construído por dentro | [04-ARQUITETURA](./04-ARQUITETURA/) |
| Google Calendar, Google Drive, Stripe, Brevo | [05-INTEGRACOES](./05-INTEGRACOES/) |
| Segurança, isolamento entre escritórios, backup | [06-SEGURANCA](./06-SEGURANCA/) |
| Como developer, deploy, ambiente | [07-OPERACAO](./07-OPERACAO/) |
| Planos, monetização, billing | [08-BUSINESS](./08-BUSINESS/) |
| De onde o Teglion veio | [09-HISTORICO/MARCO-2026-08-12.md](./09-HISTORICO/MARCO-2026-08-12.md) |

## O marco de 12 de agosto de 2026

Tudo que aconteceu antes dessa data continua fazendo parte da história do Teglion — resumido em [09-HISTORICO](./09-HISTORICO/MARCO-2026-08-12.md), com o material original preservado em [_archive](./_archive/). Mas, a partir de agora, roadmap, arquitetura, decisão de produto, segurança e negócio são acompanhados por esta documentação — não pela antiga. Se algum documento antigo disser algo diferente do que está aqui, esta versão vence.
