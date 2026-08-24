# UX

Este documento descreve o que existe de verdade em termos de sistema de design e padrões de interface do Teglion — baseado em leitura direta do código-fonte do frontend e do único registro histórico que documenta esse trabalho (`docs/historico/PHASE-1B.md` e `PHASE-1E.md`). Não há, no repositório, nenhum documento de pesquisa de usuário, teste de usabilidade ou processo formal de design — então este documento não afirma que esses processos existem.

## Existe um design system consistente?

Sim, com evidência real de código, não só de intenção. `frontend/src/shared/design-system/` tem um `index.ts` que funciona como ponto único de importação, reunindo:

- Componentes próprios do Teglion: `Button`, `EmptyState`, `PageHeader`, `Chip`, `Badge`, `FormField`, `Skeleton`/`SkeletonCard`, `Progress`, `FirmModuleShell`, `FirmSplitView`, `SegmentedControl`, `MobileBottomNav`, `ModuleHelpDialog`, `RiskMeter`, `EuroInput`, `DurationMinutesField`, `ProfileSectionCard`, `UploadDropzone`, `RichTextEditor`, `SanitizedServiceHtml`, `PageLoading`, entre outros.
- Primitivas reexportadas de `src/shared/components/ui/` (um conjunto no estilo shadcn/ui — `card.tsx`, `button.tsx`, `dialog.jsx`, `sheet.jsx`, `select.jsx`, `dropdown-menu.jsx`, `alert-dialog.jsx`, `checkbox.jsx`, `popover.jsx`, `command.jsx`, `label.jsx`, `textarea.jsx`, `input.jsx`), incluindo `Card`/`CardHeader`/`CardFooter`/`CardTitle`/`CardDescription`/`CardContent`.

Ou seja, o design system real é a combinação dessas duas camadas: primitivas de baixo nível em `components/ui/` e composições/regras de produto em cima, em `design-system/`.

**Adoção real, não só existência**: uma verificação simples de quantos arquivos em `src/features/` (onde vive a maior parte das telas do escritório e do cliente) referenciam esses componentes confirma uso disseminado — `PageHeader` aparece em 20 arquivos, `EmptyState` em 17, `Skeleton`/`PageLoading` em 22. Não é um sistema de design que existe só na pasta e não é usado.

**Migração incompleta, por design (não por descuido)**: ainda existem 8 arquivos no frontend usando classes CSS legadas (`cb-btn-*`), do sistema anterior ao design system atual. Isso bate com o que `docs/historico/PHASE-1B.md` já registrava como decisão explícita — os botões de autenticação (`auth`, `client/recover`) e alguns componentes compartilhados (como `DocumentPreviewModal`) foram deliberadamente deixados de fora do escopo da Fase 1B ("C — deferred"), e o CSS legado (`.cb-*` em `contabil.css`) foi mantido de propósito, para não remover algo que ainda tem chamador. Não é um sistema quebrado — é um sistema em migração gradual e documentada, com a fronteira do que já migrou e do que não migrou registrada no próprio histórico da fase.

## Padrões de estado (loading / vazio / erro)

- **Loading**: existem componentes dedicados (`Skeleton`, `SkeletonCard`, `PageLoading`), usados em 22 arquivos de `features/`. É um padrão real, não um `<div>Carregando...</div>` espalhado ad hoc em cada tela.
- **Vazio**: existe `EmptyState`, com suporte a ação secundária (`secondaryAction`, conforme `PHASE-1B.md`), usado em 17 arquivos.
- **Erro em formulário**: `FormField` tem uma prop `error` que renderiza a mensagem com `role="alert"` e liga o campo ao erro via `aria-describedby` (usando um id gerado, `${fieldId}-error`) — isto é, tem cuidado real de acessibilidade no nível de campo de formulário, verificável lendo `frontend/src/shared/design-system/FormField.tsx`.
- **Erro em página inteira (ex.: "algo deu errado, tentar de novo")**: não encontramos um componente equivalente ao `EmptyState` para esse caso — existe só um `ErrorBoundary`, usado em um único lugar do código. Não há evidência de um padrão consistente de "estado de erro de página" replicado pelas telas do produto. Se esse padrão existir informalmente (cada tela tratando erro à sua maneira), não está unificado num componente do design system hoje.

## Responsividade

Houve um trabalho real e registrado de responsividade, documentado como **Fase 1E — Responsive + Visual Polish** em `docs/historico/PHASE-1E.md`. O estado documentado nesse arquivo, na última atualização visível (14/08/2026):

- **Status: `IN PROGRESS`**, não fechado. O próprio documento é explícito: "Não declarar Fase 1E CLOSED sem QA completo das superfícies."
- **Bloco 1 (shell — a navegação em si: rail de tablet entre 768–1279px, bottom nav abaixo de 768px, sidebar completa a partir de 1280px) está com código feito e QA de staging autenticado aprovado nos 7 breakpoints alvo** (1440, 1280, 1024, 768, 430, 390, 375).
- **Blocos 2 a 7 — que cobrem Dashboard, Serviços/IRS, Agenda/Messages/Settings, editor de página pública, Billing, e a passada de acessibilidade — ainda estavam pendentes** na última atualização do documento, com o checklist de "Critério de CLOSED" totalmente desmarcado.

Este documento (`UX.md`) foi escrito em 19/08/2026, cinco dias depois do último registro em `PHASE-1E.md`. Não há, no repositório, uma atualização mais recente confirmando se os Blocos 2–7 avançaram ou fecharam. Portanto: **responsividade tem uma base real e testada (o shell/navegação), mas não está comprovadamente concluída para o produto inteiro** — qualquer afirmação de "responsivo em todas as telas" seria invenção. O estado correto a declarar é: parcial, com o shell fechado e o restante das superfícies não confirmado.

## O que não temos evidência para afirmar

Para não inventar processo que não existe:

- **Pesquisa de usuário**: não encontramos nenhum artefato de pesquisa (entrevistas, testes de usabilidade, personas) no repositório. Não afirmamos que ela acontece.
- **Processo de design formal** (handoff de design, ferramenta de design tipo Figma referenciada em algum fluxo, revisão de design como etapa antes do código): não há evidência disso no código nem nos documentos históricos. O que existe é o inverso — decisões de UX registradas diretamente como itens de roadmap técnico (`PHASE-1B.md`, `PHASE-1E.md`), escritas por quem implementou, com QA descrito como revisão estrutural de código e, quando citado, teste em navegador. Não há um processo de design separado documentado antes da fase de código.
- **Design tokens versionados como sistema formal** (ex.: um pacote de tokens publicado, um Storybook): `PHASE-1B.md` menciona "Tokens (soft colors, spacing, radius, shadows, tipografia)" como entregue, mas isso descreve valores dentro do próprio código do frontend (presumivelmente CSS/Tailwind), não um sistema de tokens documentado e versionado à parte. Não comprovado atualmente como processo formal — comprovado apenas como convenção de código.

## Referências

- `docs/historico/PHASE-1B.md` — fechamento da Fase 1B (Design System + UX Foundation), `STATUS: CLOSED`.
- `docs/historico/PHASE-1E.md` — Fase de responsividade, `STATUS: IN PROGRESS` na última leitura.
- `frontend/src/shared/design-system/` — implementação real dos componentes.
- `frontend/src/shared/components/ui/` — primitivas de UI reexportadas pelo design system.
