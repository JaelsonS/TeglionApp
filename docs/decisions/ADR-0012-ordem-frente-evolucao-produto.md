# ADR-0012 — Ordem obrigatória da frente de evolução (produto/segurança)

## Status

Aceito. Decisão em vigor — actualizada em 21/08/2026. Substitui qualquer ordem anterior desta frente em que Google Calendar aparecia imediatamente após Agenda.

## Contexto

A frente de evolução (auditoria 20/08/2026) tinha Google Calendar como fase seguinte à Agenda. Em 21/08/2026 decidi reordenar: fundações de segurança (MFA, step-up), consumo (créditos), entitlements e domínio da Página Pública têm de estabilizar **antes** da integração Google Calendar. O ambiente de staging para Google Calendar ainda será preparado à parte, fora do caminho crítico das fases 3–8.

## Decisão

Ordem obrigatória desta frente (não alterar sem autorização explícita):

1. Tarefas M2M  
2. Serviços (grupos, imagem, oferta+opções, Página Pública agrupada)  
3. Agenda / disponibilidade  
4. MFA  
5. Step-up + acções sensíveis  
6. Créditos / SMS  
7. Entitlements / add-ons / pricing  
8. Página Pública + domínio `{slug}.teglion.com`  
9. Google Calendar (**último**)

Regras de execução:

- Não iniciar a fase N+1 automaticamente ao fechar a fase N — cada avanço exige aprovação explícita (excepto o trabalho contínuo de fecho da fase em curso).
- Na Fase 4/5: **não** criar um segundo mecanismo de step-up; evoluir o já existente.
- Na Fase 9: auditar staging e o estado real das conexões antes de qualquer alteração; distinguir “Google Calendar conectado” de “sincronizando correctamente”.

Fonte de prioridade geral do produto continua a ser `docs/ROADMAP.md` (secção «Frente de evolução»). Este ADR congela a **sequência** autorizada.

## Alternativas consideradas

- Manter Google Calendar como Fase 4 após Agenda. Descartada: staging Google ainda não está pronto para validação segura; MFA e step-up são pré-requisitos de confiança mais urgentes.
- Paralelar MFA e Google Calendar. Descartada: aumenta risco operacional e mistura frentes de auth e integração externa.

## Consequências

- Positivas: caminho claro para fechar Agenda → MFA → consumo/entitlements → domínio → só depois GCal.
- Negativas: o passo «Google Calendar» na UI da Agenda permanece presente como superfície futura; não deve ser tratado como Fase 4 de implementação até à Fase 9.
- A numeração «FASE 3 — Arquitetura multi-país» / «FASE 4 — Brasil MVP» **nesta mesma** `ROADMAP.md` é outra linha histórica (expansão geográfica) — não confundir com os números 1–9 desta frente.

## Relação com outros ADRs

- [ADR-0010](./ADR-0010-agenda-calendario-excepcoes-e-copia-mes.md) — Agenda (fase 3 desta frente); Google Calendar fora do âmbito e agora fase 9.
- Auditoria de origem: `AUDITORIA_FASE0_EVOLUCAO_2026-08-20.md` (achados mantêm-se; a **ordem de execução** passa a seguir este ADR).
