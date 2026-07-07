# Relatório — Isolamento Multi-Tenant (TegLion)

**Data:** 2026-05-22  
**Script:** `backend/scripts/tenant-isolation-test.js`  
**Última execução:** APROVADO (0 falhas críticas de isolamento)

---

## Veredito

| Área | Estado |
|------|--------|
| Isolamento cliente A ↔ B (mesmo escritório) | **APROVADO** |
| Isolamento escritório X ↔ Y (tenants) | **APROVADO** |
| Storage via proxy API (`findDocumentForActor`) | **APROVADO** |
| Listagens API/repositório (`firm_id`) | **APROVADO** |
| Deep links (documento, tarefa, cliente) | **APROVADO** (404 sem leak) |
| Activity / timeline por `client_id` | **APROVADO** |
| Testes HTTP end-to-end | **Pendente** — definir `API_BASE` com servidor a correr |

**Conclusão:** O isolamento multi-tenant está **adequado para piloto**, desde que o acesso a ficheiros continue **sempre** pelo proxy autenticado (não expor `storage_key` nem signed URLs Supabase ao browser sem validação).

---

## Cenários executados

### 1. Clientes no mesmo escritório
- Cliente A **não** descarrega documento do Cliente B → `403 Sem permissão`
- Portal: `findTaskById` com `clientId` A **não** devolve tarefa B
- Obrigações/mensagens listadas só para o `clientId` do actor
- Timeline/activity filtrada por `client_id`

### 2. Escritórios diferentes
- Escritório Y **não** faz stream/download do documento X → `404`
- `findDocumentById(id, firmY)` → `null` (sem metadata)
- Cliente/tarefa/obrigação do tenant X **inacessíveis** com token Y

### 3. Storage
- **Proxy:** `documents.service` exige `firm_id` + `client_id` (portal)
- **Service role:** consegue ler qualquer path no bucket (esperado) — risco só se path/URL vazar ao cliente
- Bucket privado + download só via API validada

### 4. API / repositório
- Queries em `documents`, `client_tasks`, `clients`, `obligations`, `messages`, `activity_events` usam `.eq('firm_id', firmId)`
- Detalhe por ID sempre acoplado a `firmId` do JWT (`req.user.clinicId`)

### 5. Deep links
- `/client-tasks/:id` e documentos cross-tenant → **404** (não 200 com dados alheios)

### 6. Timeline
- Eventos do cliente B **não** aparecem na activity do cliente A
- Eventos do firm X **não** aparecem no firm Y

---

## Correções aplicadas durante o teste

| Problema | Severidade | Correção |
|----------|------------|----------|
| `getRepository is not defined` em `tasks-workspace.service.js` | **Alta** (quebra detalhe tarefa) | Import adicionado |
| PostgREST embed ambíguo `documents` ↔ `obligations` | **Média** (quebra listagem/hub) | `obligations!documents_obligation_id_fkey` em `listDocuments` |
| Hub CRM: `listDocuments` devolve `{ items }` | **Média** | `client-hub.service.js` usa `.items` |

---

## Avisos (não bloqueiam isolamento)

1. **Login cliente sem `firmSlug`/`firmId`**  
   Usa `findClientsByEmail` global. Se o mesmo email existir em 2+ escritórios com portal, API devolve `409 MULTIPLE_FIRMS`. Recomendação piloto: login sempre com slug do escritório.

2. **Service role no servidor**  
   Qualquer código com `SUPABASE_SERVICE_ROLE_KEY` pode ler o bucket inteiro. Isto é normal; a barreira é **não** expor paths/URLs ao frontend sem auth.

3. **Testes HTTP**  
   Para validar Express + middlewares + cookies, correr:
   ```bash
   cd backend && API_BASE=http://localhost:4000 FROM_EMAIL=test@iso.local PRODUCT_MODE=contabil node scripts/tenant-isolation-test.js
   ```

4. **RLS Supabase**  
   Este teste validou a **camada da aplicação** (repositórios + proxy). Confirmar em produção que migrations RLS em `documents` e `storage.objects` estão aplicadas (`supabase/migrations/`).

---

## Como repetir o teste

```bash
cd backend
FROM_EMAIL=test@iso.local PRODUCT_MODE=contabil node scripts/tenant-isolation-test.js
```

Com API local:

```bash
API_BASE=http://localhost:4000 FROM_EMAIL=test@iso.local PRODUCT_MODE=contabil node scripts/tenant-isolation-test.js
```

Exit code `0` = aprovado · `1` = falha crítica.

---

## Critério de bloqueio (utilizador)

- **ZERO** dados cross-tenant nas rotas testadas → **cumprido**
- Falhas de **runtime** (imports, embed SQL) foram corrigidas — não eram leaks, mas impediam operação segura

**Pode avançar** para agenda/alertas/UI polish **após** aplicar migrations pendentes e opcionalmente correr o script com `API_BASE` no ambiente de staging.
