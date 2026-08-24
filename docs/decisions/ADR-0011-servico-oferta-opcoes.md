# ADR-0011 — Oferta comercial: serviço principal → opções (serviços reais), sem hierarquia recursiva

## Status

Aceito. Decisão em vigor — implementada em 21/08/2026 como extensão da Fase 2 de Serviços (descoberta após ADR-0009), sem reabrir grupos/imagem/`public_group`.

## Contexto

A contadora precisa apresentar uma oferta comercial única (ex.: «Consultoria Fiscal») e deixar o cliente escolher uma modalidade concreta (Individual, Empresarial, …). Cada modalidade já existe como `accounting_services` com preço, duração, disponibilidade e booking próprios. Não queremos:

- duplicar preço/duração no serviço principal;
- transformar Grupos numa árvore Grupo → Serviço → Subserviço;
- inventar um segundo fluxo de agendamento.

## Decisão

1. **Tabela M2M `accounting_service_option_links`** (`parent_service_id`, `child_service_id`, `firm_id`, `sort_order`), mesmo padrão de `*_tag_links` / `client_task_client_links`: PK composta, `firm_id` redundante, RLS `firm_staff`, `ON DELETE CASCADE`.
2. **Profundidade máxima = 1:** um serviço com opções não pode ser opção de outro; um serviço que já é opção não pode ganhar opções. Impede ciclos e árvores sem precisar de traversal recursivo.
3. **Dados vivos:** a API devolve `options[]` com nome/preço/duração lidos do filho no momento da leitura — zero denormalização.
4. **Booking:** o cliente escolhe a opção e o fluxo público navega para `/:firmSlug/servicos/:childSlug`. Slots/holds/consultations usam o `service_id` do filho. O principal é só a vitrine.
5. **Catálogo público de topo:** serviços que são opções de uma oferta também publicada **não** aparecem como cards independentes (menos poluição). Deep-link directo ao filho continua a funcionar se estiver publicado.
6. **Modo de selecção:** nesta versão só «uma opção» (UX de lista/links). «Várias opções» fica documentado como evolução futura — não acrescentámos coluna/`selection_mode` sem consumidor, para evitar schema morto.

## Alternativas consideradas

- **Hierarquia recursiva `parent_id` em `accounting_services`.** Rejeitada — contradiz ADR-0009 e o pedido explícito de não criar árvore.
- **JSONB `optionServiceIds` no serviço.** Rejeitada — sem RLS por vínculo, sem FK, sem ordenação limpa, sem trigger de mesma firma.
- **Duplicar preço/duração no link.** Rejeitada — fonte de inconsistência.

## Segurança

- Backend: `findByIdsForFirm` + `firm_id` no link; rejeita inexistente/outra firma, auto-referência, profundidade > 1.
- Database: `CHECK (parent <> child)` + trigger `accounting_service_option_links_same_firm` (parent e child têm de partilhar `firm_id` do link).
- RLS: política `*_firm_staff` (defense-in-depth; o backend usa `service_role`).

## Compatibilidade

Serviço sem linhas em `accounting_service_option_links` comporta-se exactamente como antes (`optionServiceIds: []`).

## Relação com outros ADRs

- Complementa ADR-0009 (Grupo → Serviço continua a única hierarquia de categorias).
- Não altera booking/Google Calendar além de garantir que o `service_id` efectivo é o da opção.
