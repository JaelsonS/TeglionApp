# Visão de médio prazo — Sprints 3, 4 e 5

> **Arquivado em 19/08/2026.** O conteúdo deste documento foi absorvido pelo roadmap único e vivo em `docs/ROADMAP.md`. Este arquivo fica preservado como registro histórico — não é mais fonte de verdade sobre prioridades atuais.

Continuação de [ROADMAP.md](./ROADMAP.md), depois dos Sprints 0, 1 e 2. Aqui a granularidade é menor de propósito — não faz sentido detalhar tarefa por tarefa para um horizonte que só começa depois de retenção estar resolvida. O objetivo deste documento é direção, não checklist.

## Sprint 3 — Produto

Depois que o escritório usa o Teglion todos os dias (Sprint 2), a pergunta muda para: o que faria esse escritório recomendar o Teglion para outro contador, ou pagar por um plano mais caro?

Os candidatos mais óbvios são os módulos que hoje são parciais e cuja lacuna já está documentada:

- **Calendário Fiscal**: os lembretes configuráveis por evento existem como tabela no banco, mas não estão ligados a nada (ver [CALENDARIO-FISCAL.md](../03-PRODUTO/CALENDARIO-FISCAL.md)). Conectar isso é trabalho de conclusão, não de invenção.
- **Geração automática de obrigação recorrente**: o endpoint já existe no backend; falta o botão no frontend e, possivelmente, um job que dispare sozinho. De novo, é fechar algo que já está 80% pronto.
- **Booking e captação de serviços** (a base do que hoje é rotulado "IRS"): depois que a race condition de agendamento for corrigida no Sprint 0, esse é o módulo com mais superfície para crescer — outros tipos de captação além de IRS, mais controle de disponibilidade, integração mais profunda com o calendário do escritório.

Esse sprint é sobre profundidade nos módulos que já existem, não sobre módulos novos do zero.

## Sprint 4 — Escala

A auditoria de 12/08/2026 identificou, com evidência concreta em código, onde a arquitetura atual começa a sentir fricção: em algum ponto entre 100 e 1.000 escritórios simultâneos (ver a análise completa de performance em [ARCHITECTURE.md](../04-ARQUITETURA/ARCHITECTURE.md)). Os itens deste sprint vêm diretamente desses achados, não de preocupação genérica com "escala":

- Fila assíncrona de verdade para envio de email e outras tarefas que hoje rodam de forma síncrona dentro da requisição HTTP — hoje existe só um mecanismo de fila, usado para um único tipo de tarefa.
- Paginação consistente em listagens que hoje têm um limite fixo sem cursor (mensagens, pedidos de documento) — isso já é uma limitação real hoje, não só uma projeção de escala futura.
- Observabilidade de verdade: nenhum teste de carga foi executado até hoje, não existe um baseline de performance capturado. Antes de prometer um número de escritórios suportados, esse baseline precisa existir.
- Rate limiting que não desaparece quando o Redis está sob estresse — hoje ele "falha aberto" justamente no momento em que a proteção mais importa.
- Billing mais maduro: janela de tolerância antes de suspender por falha de pagamento, mais de um plano com diferenciação real de recursos (ver [08-BUSINESS](../08-BUSINESS/)).

## Sprint 5 — Internacionalização

Só entra na mesa quando o mercado português estiver validado o suficiente para justificar o investimento de abrir outro país — não antes, e não por ambição abstrata.

A base técnica para isso já existe hoje, de forma real: o sistema já resolve configuração por país (idioma, moeda, formato de identificação fiscal, calendário) através de um registro central, com Portugal e Brasil já cadastrados — Brasil com o calendário fiscal marcado explicitamente como "em preparação", não fingindo estar pronto. Isso significa que a decisão de abrir um segundo país é, majoritariamente, uma decisão de conteúdo e regulação local (regras fiscais, integrações locais, suporte no idioma) — não uma reescrita de arquitetura. O detalhe técnico completo está em [INTERNATIONALIZATION.md](../08-BUSINESS/INTERNATIONALIZATION.md); a narrativa de quando e por que está em [EXPANSAO-INTERNACIONAL.md](../01-ESTRATEGIA/EXPANSAO-INTERNACIONAL.md).

---

Depois do Sprint 5, o produto entra numa fase diferente — descrita em [VISION-2030.md](./VISION-2030.md).
