# ADR-0009 — Serviços: grupos de 1 nível (`accounting_service_groups`) e posicionamento reversível de imagem

## Status

Aceito. Decisão em vigor — implementada em 21/08/2026, como Fase 2 da evolução aprovada a partir da auditoria de 20/08/2026 (`docs/decisions/AUDITORIA_FASE0_EVOLUCAO_2026-08-20.md`).

## Contexto

`accounting_services` sempre teve `public_group`, uma coluna de texto livre digitada manualmente em cada serviço para agrupar visualmente na Página Pública (ex.: dois serviços com o mesmo texto "Consultorias" ficavam adjacentes na listagem, via `clusterPublicServices.ts`). Não havia entidade "grupo" real — sem nome canônico, sem ordenação própria, sem controle de visibilidade a nível de grupo, e sujeito a erro de digitação (dois serviços do "mesmo" grupo com texto ligeiramente diferente não agrupavam).

A imagem de banner de um serviço, por sua vez, sempre foi recortada no cliente (`ImageCropDialog.tsx`) e exportada como um novo `File` já cortado — o recorte era "assado" nos pixels da imagem enviada. Isso é irreversível: mudar o enquadramento depois exige reenviar a imagem original, que não fica guardada.

## Decisão 1 — Grupos de serviço como entidade própria, 1 nível

Criei `accounting_service_groups` (`id`, `firm_id`, `name`, `is_active`, `is_publicly_listed`, `sort_order`, `UNIQUE(firm_id, name)`), seguindo o mesmo padrão de categorização de 1 nível que o projeto já usa em `firm_fiscal_categories`. `accounting_services` ganhou `group_id` (FK nullable). `public_group` (texto legado) não foi removida — continua na tabela, mas deixa de ser a fonte de verdade: o campo `publicGroup` que a API expõe agora é resolvido a partir do nome real do grupo (via `resolveGroupNameMap(firmId)`, um mapa `group_id → nome` buscado uma vez por listagem), não do texto legado gravado no próprio serviço.

Descartei hierarquia recursiva (grupo dentro de grupo) — a decisão aprovada foi explícita: 1 nível apenas, "Grupo → serviços", sem aninhamento. Isso elimina a necessidade de proteção contra ciclos, de UI de árvore, e de qualquer query recursiva.

## Decisão 2 — Posicionamento reversível (ponto focal + zoom), não recorte de pixel

Em vez de estender `ImageCropDialog.tsx` (usado também pela logo do escritório e por imagens de seção da Página Pública — fora do escopo desta fase), criei um componente irmão, `ImagePositionEditor.tsx`, e uma função pura, `servicePositionedImageStyle.ts`. A imagem original enviada é guardada sem cortes (`image_original_url`); o enquadramento escolhido é guardado como três números — `image_focus_x` (0-100), `image_focus_y` (0-100), `image_zoom` (1-2.5) — aplicados via CSS puro (`object-position` + `transform: scale()` com `transform-origin` no mesmo ponto focal) tanto no editor administrativo quanto na Página Pública e na página de detalhe do serviço.

## Alternativas consideradas

- **Estender `ImageCropDialog.tsx` para guardar metadado de recorte reversível.** Descartei nesta fase porque esse componente tem dois outros consumidores fora do escopo aprovado (logo do escritório, imagens de seção da Página Pública) — mudar seu contrato arriscaria regressão em fluxos que a Fase 2 não deveria tocar ("não faça alterações não relacionadas a esta fase").
- **Guardar o recorte como um retângulo (x, y, largura, altura) em vez de ponto focal + zoom.** Descartei porque um retângulo fixo não se adapta bem a contêineres de proporções diferentes (card da listagem pública é mais baixo que o banner do editor) sem recalcular a cada breakpoint. Ponto focal + zoom com `object-position`/`transform` é a técnica padrão para "mesmo enquadramento em qualquer proporção de contêiner" — resolve isso nativamente via CSS, sem JavaScript de recálculo.
- **Hierarquia de grupos com múltiplos níveis (grupo > subgrupo).** Rejeitada explicitamente na decisão aprovada — nenhum dos quatro escritórios piloto tem catálogo grande o bastante para justificar isso agora, e adicionaria complexidade de UI (árvore, drag entre níveis) sem necessidade comprovada.

## Motivos da decisão

- Consistência com `firm_fiscal_categories` — mesmo padrão de 1 nível que o resto do projeto já usa para esse tipo de categorização, sem inventar um segundo modelo.
- Reversibilidade real do posicionamento de imagem: o escritório pode reenquadrar um banner quantas vezes quiser sem reenviar o arquivo, porque o original nunca é destruído.
- Isolamento do componente de imagem (`ImagePositionEditor.tsx` novo, `ImageCropDialog.tsx` intocado) respeita o limite de escopo da fase.

## Consequências positivas

- Grupos com nome duplicado por erro de digitação deixam de ser possíveis (`UNIQUE(firm_id, name)` a nível de banco, com HTTP 409 tratado em `accounting-service-groups.service.js`).
- Reordenar, ativar/desativar e controlar visibilidade pública de um grupo inteiro agora é uma operação, não uma edição manual em cada serviço individualmente.
- Serviços antigos (criados antes desta fase, sem `image_focus_x/y/zoom`) continuam renderizando exatamente como antes — `servicePositionedImageStyle()` cai para `object-position: 50% 50%` sem `transform` quando os campos não existem, o comportamento padrão de sempre.

## Consequências negativas

- Serviços com imagem enviada antes desta fase têm `image_original_url` vazio — não há forma de "reposicionar" uma imagem antiga sem reenviá-la (o recorte antigo já foi assado nos pixels pelo fluxo anterior). A UI comunica isso explicitamente ("Imagem antiga (recorte fixo) — envie uma nova para poder reposicionar") em vez de silenciar a limitação.
- `public_group` (coluna legada) permanece na tabela sem uso real a partir de agora — é uma dívida técnica pequena e conhecida, não removida nesta fase pelo mesmo motivo do ADR-0008 (`client_id`): confirmar primeiro que nenhum caminho de escrita antigo ainda depende dela antes de considerar removê-la.
- Apagar um grupo não apaga nem bloqueia os serviços dentro dele — eles ficam com `group_id = NULL` (decisão deliberada, confirmada no diálogo de confirmação da UI: "Os serviços dentro dele ficam sem grupo, não são apagados").

## Riscos

- Se algum caminho de escrita que não revisei inserir `accounting_services` direto sem passar por `accounting-services.service.js`, esse serviço nasce sem qualquer resolução de `publicGroup` a partir do grupo real — cai de volta no texto legado (`public_group`), que ainda funciona como fallback porque a coluna não foi removida.
- `resolveGroupNameMap(firmId)` busca todos os grupos do escritório a cada listagem de serviços (pública e administrativa) — para o volume atual (poucos grupos por escritório) isso é uma query extra desprezível; viraria relevante só com um catálogo muito maior do que os pilotos atuais têm.

## Impacto futuro

- Qualquer nova entidade que precise de "imagem com enquadramento reversível" deve reusar `ImagePositionEditor.tsx` + `servicePositionedImageStyle.ts`, não duplicar a técnica — são funções/componentes genéricos, não amarrados a `accounting_services` na assinatura.
- Se o catálogo de algum escritório crescer a ponto de precisar de subgrupos, esta ADR e a tabela `accounting_service_groups` são o ponto de partida a estender (adicionar `parent_group_id` nullable auto-referenciado), não um novo modelo do zero.

## Relação com outros ADRs

- Segue o princípio de isolamento por `firm_id` do ADR-0001 — `accounting_service_groups.firm_id` obrigatório, política RLS `accounting_service_groups_firm_staff` no mesmo formato das demais tabelas por escritório.
- Segue o mesmo princípio de "coluna legada como ponteiro, nova estrutura como fonte de verdade" estabelecido no ADR-0008 para `client_tasks.client_id` — aqui aplicado a `accounting_services.public_group`.
