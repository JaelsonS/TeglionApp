# Roadmap

Este roadmap parte de um ponto concreto: uma auditoria completa do código feita em 12/08/2026 (resumida em [MULTI-TENANT-SECURITY.md](../06-SEGURANCA/MULTI-TENANT-SECURITY.md) e nos documentos de [03-PRODUTO](../03-PRODUTO/)), não de uma lista de desejos. Cada item de Sprint 0 e Sprint 1 existe porque foi encontrado em código, com arquivo e linha — não porque "seria bom ter".

A lógica de sequência é simples: primeiro fecha o que é risco real (Sprint 0), depois o que falta para vender (Sprint 1), depois o que faz quem comprou continuar usando (Sprint 2). Só depois disso faz sentido falar em expandir produto, escalar infraestrutura ou pensar em outro país — nessa ordem, não ao contrário.

## A sequência

| Sprint | Objetivo | Documento |
|---|---|---|
| 0 | Fechar os riscos que a auditoria encontrou — sem isso, nada abaixo importa | [SPRINT-0.md](./SPRINT-0.md) |
| 1 | Conseguir colocar o próximo escritório pagante, do cadastro ao primeiro uso, sem intervenção manual | [SPRINT-1.md](./SPRINT-1.md) |
| 2 | Fazer o escritório que já pagou continuar abrindo o produto todos os dias | [SPRINT-2.md](./SPRINT-2.md) |
| 3 | Expandir os módulos que aumentam valor percebido pelo escritório | [LONG-TERM.md](./LONG-TERM.md) |
| 4 | Escalar infraestrutura, observabilidade e billing para muitos escritórios simultâneos | [LONG-TERM.md](./LONG-TERM.md) |
| 5 | Internacionalização — só quando o mercado de Portugal justificar o próximo passo | [LONG-TERM.md](./LONG-TERM.md) |

Visão de mais longo prazo, sem data: [VISION-2030.md](./VISION-2030.md).

## Por que não misturar tudo numa lista só

Uma lista de 80 funcionalidades desejáveis não é um roadmap, é um backlog. Cada sprint aqui tem um critério de saída específico — uma pergunta que ou tem resposta "sim" ou não tem, sem meio-termo:

- Sprint 0: os sete riscos da auditoria estão fechados? Sim ou não.
- Sprint 1: um escritório novo consegue se cadastrar, pagar e usar sem ajuda da equipe? Sim ou não.
- Sprint 2: o escritório que já paga volta ao produto todos os dias, sem lembrete? Sim ou não.

Isso é proposital. É fácil confundir "quanto o produto pode fazer" com "quão pronto o produto está" — este roadmap separa as duas coisas.

## Como isso se conecta com o resto da documentação

- O estado real de cada módulo (o que funciona, o que é parcial) está em [03-PRODUTO](../03-PRODUTO/).
- O veredito de segurança e os riscos detalhados estão em [06-SEGURANCA](../06-SEGURANCA/).
- A estratégia de monetização e planos futuros — sem confundir com o que já existe — está em [08-BUSINESS](../08-BUSINESS/).
