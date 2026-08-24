# Fase 1D — IRS + Serviços (captação e conversão)

> **Arquivado em 19/08/2026.** O conteúdo deste documento foi absorvido pelo roadmap único e vivo em `docs/ROADMAP.md`. Este arquivo fica preservado como registro histórico — não é mais fonte de verdade sobre prioridades atuais.

**Branch:** `feature/fase-1`  
**Ambiente:** staging only — sem produção / sem merge para `main`.  
**STATUS:** **CLOSED** no código + testes automáticos. Browser QA live em staging UAT recomendado.

---

## Objectivo

Tornar Serviços e IRS o fluxo principal de captação:

criar → configurar → publicar → cliente vê → solicita → escritório recebe → acompanha

Sem inventar entidades; reutilizar `accounting_services`, `service_inquiries`, `service_requests` e o Design System 1B/1C.

---

## Auditoria (resumo A–H)

### A. Fluxo actual
Catálogo / IRS → `ServiceFullEditorSheet` / Modelo 3 → `isPubliclyListed`+slug → página pública → intake → **Solicitações** (`service_inquiries`). **Central** = pedidos de clientes na app (`service_requests`).

### B. Confusão
- Solicitações vs Central  
- Activo vs publicado  
- IRS desligado de «ver página» / pedidos  
- Secções públicas com nomes pouco claros; empty silencioso  
- Editor com 5 tabs sem hierarquia de passos  

### C. Duplicações
- Editores órfãos (`ServiceEditorSheet`, `AgendaServicesCatalogPanel`) — não ligados nesta fase  
- «Pedido» em vários sentidos (inquiry vs central vs checklist)

### D. APIs
- `/contabil/accounting-services*`, `/contabil/service-inquiries*`, `/contabil/service-requests*`, public intake por slug

### E. Reutilizável
- DS: EmptyState, Button, FirmModuleShell, ModuleHelpDialog  
- `computeFirmProgress` / Maya `openMaya`  
- `ServiceFullEditorSheet`, `IrsModelo3EditorSheet`

### F. Estados
- Serviço: `isActive`, `isPubliclyListed`, `slug` (sem enum draft)  
- Apresentação 1D: Inactivo / Só interno / Quase publicado / Publicado  

### G. Riscos
- Não fundir schemas; não inventar campanha persistida  
- Heurística IRS por nome/catalogKey  

### H. Proposta (executada)
Camada de apresentação de publicação; hub Serviços com KPIs e copy; editor em passos; empty públicos; hub IRS com estado de campanha; Maya `irs-campaign`.

---

## Alterações

| Área | Mudança |
|------|---------|
| `servicePublishState.ts` | Apresentação clara do estado de publicação + testes |
| Hub Serviços | Título/subtítulo, KPIs, link página pública, badge pedidos novos |
| Catálogo | Badges + texto «só interno»; empty «comece pelos serviços…» |
| Editor | Passos numerados, estado de publicação, Maya, pré-visualização |
| Solicitações / Central | Empty states que explicam onde tratar o pedido |
| Página pública | Empty quando zero serviços; labels «com marcação» / «sob pedido» |
| IRS | «Campanha IRS», estado pronto/não, CTAs publicar / pedidos / página |
| Maya | Intent `irs-campaign` + copy actualizada |

---

## Segurança

- Sem alterações JWT/CSRF/RLS/Stripe/Google  
- APIs firm continuam com `requireUserFirmId` / `findByIdForFirm`  
- Public intake por slug + `isPubliclyListed`  
- Maya continua sem network / sem dados sensíveis  

---

## Testes

| Suite | Resultado |
|-------|-----------|
| TypeScript | PASS |
| Vitest | **38/38** PASS (+5 publish state) |
| Backend (accounting/inquiries/security pattern) | PASS |
| Vite + PWA + prerender | PASS |

---

## Browser QA

**Não executado com browser tooling nesta sessão.**  
Critério de «Browser QA real em staging» fica **parcial / deferred UAT**:

Checklist para staging:
- [ ] Criar → publicar → página pública  
- [ ] Pedido público → Solicitações  
- [ ] Campanha IRS → publicar → página  
- [ ] Empty states + Maya + mobile editor (430/390/375)

---

## Limitações / deferred

- Wizard de 3 ecrãs (em vez de 5 tabs) — tabs reetiquetadas, estrutura de dados igual  
- `bookingOverrides` por serviço — UI órfã não reactivada  
- Remoção de editores órfãos  
- Persistência de `category` IRS no DB  
- Tablet rail → **Fase 1E**  
- Browser QA live  

---

## Critério CLOSED

- [x] Publicado vs interno claro  
- [x] Fluxo criar/configurar/publicar mais compreensível  
- [x] Pedidos: Solicitações vs Central explícito  
- [x] IRS posicionamento campanha + ligação publicar/pedidos/página  
- [x] Empty states + copy PT-PT  
- [x] Maya estática + `irs-campaign`  
- [x] DS único  
- [x] TS / Vitest / backend / build / PWA  
- [ ] Browser QA live staging  
- [x] Docs  
- [x] Sem merge main / produção intacta  

---

## Próximo passo: Fase 1E

Responsive tablet rail (768–1279), sem reabrir o modelo de captação salvo ajustes finos pós-UAT.
