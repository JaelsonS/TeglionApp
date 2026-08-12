# Design System — Auditoria de Adopção

**Depende de:** [`TEGLION_UX_AUDIT.md`](./TEGLION_UX_AUDIT.md).
**Relação com `docs/design/DESIGN_SYSTEM.md`:** esse documento já existe e já define correctamente os tokens, cores, tipografia e a lista de componentes "core" que **deveriam** ser usados em todo o produto — inclui uma nota honesta na própria secção "Arquitectura de componentes": *"Estado actual: Dual layer (design-system + components/ui). Alvo Fase 2: unificar."* Este documento aqui é essa Fase 2 — mede exactamente quão longe o código real está desse alvo já escrito, com números e ficheiros concretos, para que a unificação prometida possa finalmente acontecer. Não repete tokens/cores/tipografia (já bem documentados lá); foca-se só no gap de adopção.

**Estado:** diagnóstico. Nenhum componente foi alterado.

---

## O gap, componente a componente

| Componente | Documentado como "core" em `docs/design/DESIGN_SYSTEM.md` | Realidade no código |
|---|---|---|
| **Select** | "Selecção única" — uso esperado em toda a parte | **Zero usos.** `shared/components/ui/select.jsx` existe (Radix), mas nenhum ficheiro em `src/` o importa de facto. **48 elementos `<select>` nativos reimplementados em 26 ficheiros diferentes**, muitos copiando literalmente a mesma classe Tailwind (`h-10 w-full rounded-md border border-input bg-background px-3 text-sm`). Um único ficheiro (`FirmSettingsTeamSection.tsx`) reimplementa o mesmo dropdown de departamento **3 vezes** dentro de si próprio. |
| **Table** | "Listas tabulares com sorting" — listado como componente "core" | **Não existe.** Não há nenhum `Table.tsx` em `design-system/` nem em `components/ui/` apesar de estar documentado como se existisse. 8 tabelas `<table>` nativas espalhadas, cada uma com o seu próprio CSS de cabeçalho escrito à mão (ex.: `FirmSettingsTeamSection.tsx:618-726`). |
| **Modal** | "Diálogos, confirmações" — um componente | **Três primitivos coexistem** sem regra clara de quando usar qual: `components/ui/dialog.jsx` (Radix Dialog, 6 importadores directos), `components/ui/alert-dialog.jsx` (Radix AlertDialog, 2 importadores), e `components/modals/ConfirmDialog.tsx` (wrapper de mais alto nível, usado nos fluxos de confirmação mais críticos — encerrar conta, excluir cliente). |
| **EmptyState** | "Listas vazias, estados iniciais" — um componente | **Dois componentes com o mesmo nome em pastas diferentes**: `shared/design-system/EmptyState.tsx` (o documentado) e um segundo, independente, `shared/components/portal-cliente/EmptyState.tsx`. Usado em só 7 ficheiros ao todo; entretanto, texto de estado vazio escrito à mão ("Sem…", "Nenhum/Nenhuma… encontrada/o") aparece pelo menos 9 vezes fora do componente — ex.: `FirmSettingsTeamSection.tsx:587`. Ou seja, texto ad-hoc é tão comum quanto o componente que deveria substituí-lo. |
| **`useContabilToast`** | "Notificações de sucesso/erro" — hook documentado como a via oficial | O hook real chama-se **`useApiToast`** (`shared/hooks/useApiToast.ts`) e só é usado em **6 ficheiros**. Os outros **54 ficheiros** chamam `sonner` (`toast.error()/toast.success()`) directamente — 175 chamadas a `toast.error(` e 87 a `toast.success(` no total. `useApiToast` existe precisamente para filtrar mensagens técnicas (códigos HTTP, `TOKEN_INVALID`) antes de mostrar ao utilizador — o que a brief pede explicitamente na Fase 15 (Microcopy) — mas a esmagadora maioria do código não passa por ali, escrevendo `{ description: getErrorMessage(err) }` manualmente em cada chamador. |
| **Tabs** | Não listado explicitamente no doc oficial, mas usado implicitamente em várias telas | **Não existe componente partilhado.** Cada tela com abas inventa a sua própria: `FirmSettingsPage.tsx:119-150` tem uma implementação de tabs lateral com `aria-current` manual; a própria `FirmSettingsTeamSection.tsx:379-407`, dentro da mesma feature, tem uma **segunda** implementação diferente (`role="tablist"`/`aria-selected` manual) para o selector Criar/Convidar/Departamentos/Lista. Duas implementações de abas na mesma página. |
| **Tooltip** | Não mencionado no doc oficial | Não existe em lado nenhum do código (`find -iname "*tooltip*"` sem resultados). |
| **Button** | "Toda acção clicável" | **Cumprido.** `Button.tsx` do design-system é literalmente um re-export de `components/ui/button.tsx` — uma única fonte de verdade, sem reimplementações ad-hoc encontradas. |
| **Input** | "Campos de texto" | **Bem adoptado** — 46 ficheiros importam o componente partilhado. |
| **Card** | "Agrupamento de conteúdo" | **Quase não usado.** Só 2 ficheiros importam `components/ui/card.jsx`. Em vez disso: 27 divs ad-hoc com `rounded-2xl border ...` espalhados por `features/`, mais um terceiro padrão de classes CSS nomeadas à mão (`cb-settings-panel`, `cb-billing-card`) usado em Definições e Faturação. Três formas de "card" coexistem. |
| **Badge** | "Estados (PENDING, APPROVED, OVERDUE)" | Componente único existe (`design-system/Badge.tsx`); não foi medida a taxa de adopção em profundidade nesta ronda — sinalizado para verificação num próximo passo, não é um achado negativo confirmado. |

---

## Porque isto interessa para a reorganização (não é só limpeza de código)

A brief pede explicitamente (Fase 12) "não criar dezenas de componentes visualmente diferentes para fazer a mesma coisa" e (Fase 6) formulários com "validação em tempo real" e "mensagens de erro claras". Os dois maiores gaps — **Select 100% reimplementado** e **toast 90% fora do wrapper que filtra mensagens técnicas** — tocam directamente nisto:

- Um `<select>` nativo não tem o mesmo comportamento de acessibilidade, teclado, nem visual consistente que o `Select` Radix já disponível teria — e como há 48 cópias, uma correcção de acessibilidade feita numa não se propaga às outras 47.
- 175 chamadas directas a `toast.error()` sem passar por `useApiToast` significa que mensagens técnicas do tipo "Request failed with status 403" (o exemplo exacto que a brief usa na Fase 15) têm 90% de probabilidade estatística de aparecer nalgum ponto do produto sem filtro — vale a pena uma passagem de auditoria de texto dedicada antes de assumir que isto já está resolvido.

## Recomendação, por ordem de esforço/impacto

1. **Não construir Table/Tabs/Tooltip do zero já** — são investimentos maiores; ficam para uma fase de implementação própria (Fase 12 da brief), depois da reorganização de navegação, para não misturar as duas frentes de risco.
2. **Consolidar o `EmptyState` duplicado num só** — baixo risco, dois ficheiros, decidir qual fica (o de `design-system/` é o documentado oficialmente, faz sentido ser esse) e redireccionar o outro.
3. **Substituir os 48 `<select>` nativos pelo `Select` já existente** — mecânico, ficheiro a ficheiro, sem mudança de comportamento visível ao utilizador se bem feito; maior volume de trabalho desta lista, mas cada ficheiro é isolado e testável por si.
4. **Migrar chamadas de `toast.error/success` directas para `useApiToast`** — também mecânico, mas 54 ficheiros; pode ser feito incrementalmente, começando pelas telas mais visíveis (Serviços, Agenda, Clientes) em vez de tudo de uma vez.
5. **Decidir uma regra única para Modal** (Dialog vs AlertDialog vs ConfirmDialog) e documentá-la no `docs/design/DESIGN_SYSTEM.md` já existente, já que hoje ele lista "Modal" no singular sem distinguir os três primitivos reais.

Nenhum destes pontos bloqueia a reorganização de navegação proposta em [`TEGLION_NAVIGATION.md`](./TEGLION_NAVIGATION.md) — são trabalho de qualidade visual paralelo, correspondendo às Fases 12-15 da brief original, a fazer depois da arquitectura de informação estar implementada (ver ordem completa em [`TEGLION_USER_FLOWS.md`](./TEGLION_USER_FLOWS.md), secção final).
