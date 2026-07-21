# Teglion — Padrões de Código

**Documento oficial · Última actualização: Julho 2026**

Regras obrigatórias para todo o código do Teglion. Aplicam-se a humanos e a agentes IA. Sem excepções sem aprovação do CTO.

---

## Princípio geral

> Escreve código como se a pessoa que o vai manter cometeu um crime e sabes onde ela vive.

---

## Limites de tamanho

| Elemento | Máximo | Acção se exceder |
|----------|--------|------------------|
| Ficheiro `.ts`/`.tsx`/`.js` | **400 linhas** | Dividir por responsabilidade |
| Ficheiro `.css` | **500 linhas** | Dividir por módulo/scope |
| Função / método | **50 linhas** | Extrair sub-funções |
| Componente React | **200 linhas** | Extrair sub-componentes e hooks |
| Ficheiro de rotas | **150 linhas** | Um router por módulo |
| Repository | **300 linhas** | Um repo por entidade |
| Service | **300 linhas** | Dividir por caso de uso |
| Controller | **200 linhas** | Delegar para service |
| API client (frontend) | **150 linhas** | Um ficheiro por domínio |
| Nesting (indentação) | **4 níveis** | Early return, extrair função |
| Parâmetros de função | **5** | Usar object parameter |

**Excepções documentadas:** migrations SQL, ficheiros de conteúdo blog, `catalog.json`.

---

## Estrutura de ficheiros

### Backend — módulo de domínio

```
modules/{domain}/
├── {domain}.controller.js    # HTTP I/O
├── {domain}.service.js       # Business logic
├── {domain}.validator.js     # Input validation (se complexo)
└── {domain}.events.js        # Domain events (futuro)
```

### Frontend — feature module

```
app/{area}/{feature}/
├── {Feature}Page.tsx          # Route entry (composição)
├── {Feature}Workspace.tsx     # Main UI
├── use{Feature}.ts            # Hook (queries, mutations, state)
├── {feature}Types.ts          # Types locais
└── {feature}Utils.ts          # Pure functions
```

### Nomeação de ficheiros

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Componente React | PascalCase.tsx | `FirmDashboardPage.tsx` |
| Hook | camelCase com `use` | `useDocumentsHub.ts` |
| Util | camelCase.ts | `formatPtDate.ts` |
| Service (BE) | kebab-case.service.js | `documents.service.js` |
| Controller (BE) | kebab-case.controller.js | `documents.controller.js` |
| Repository (BE) | kebab-case.repository.js | `documents.repository.js` |
| Types | camelCase.ts | `contabil.ts` |
| Test | mesmo nome + `.test` | `file-magic-bytes.test.js` |

---

## Nomenclatura

### Geral

| Elemento | Convenção | Exemplo |
|----------|-----------|---------|
| Variáveis | camelCase | `firmId`, `dueDate` |
| Constantes | UPPER_SNAKE | `MAX_FILE_SIZE_MB` |
| Classes | PascalCase | `AppError` |
| Interfaces (TS) | PascalCase | `Obligation`, `Client` |
| Enums / status | UPPER_SNAKE | `PENDING`, `IN_PROGRESS` |
| BD columns | snake_case | `firm_id`, `due_date` |
| API paths | kebab-case | `/document-requests` |
| CSS classes | kebab-case com prefixo | `cb-firm-nav-item` |
| i18n keys | dot.notation | `firm.dashboard.title` |

### Proibido

| Não usar | Usar em vez disso |
|----------|-------------------|
| `clinic`, `clinicId` | `firm`, `firmId` |
| `patient`, `patientId` | `client`, `clientId` |
| `clinicName` | `firmName` |
| `PATIENTS_MANAGE` | `FIRM_CLIENTS_MANAGE` |
| `CLINIC_*`, `APPOINTMENTS_MANAGE` | `FIRM_*`, `FIRM_CONSULTATIONS_MANAGE` |
| `any` (TypeScript) | Tipo específico ou `unknown` |
| `var` | `const` (preferido) ou `let` |
| `console.log` em produção | `logger.info` / `logger.debug` |
| UUIDs na UI | Nome, email, ou label humana |

---

## Imports

### Ordem (obrigatória)

```typescript
// 1. Node builtins
import path from 'node:path'

// 2. External packages
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

// 3. Internal absolute (@/)
import { Button } from '@/design-system'
import { useAuth } from '@/hooks/useAuth'

// 4. Relative (mesmo módulo)
import { formatDueDate } from './obligationUtils'
import type { ObligationRow } from './obligationTypes'
```

### Regras

- Usar `@/` alias — nunca paths relativos com mais de 2 níveis (`../../../`)
- Type imports com `import type`
- Sem imports circulares entre módulos de domínio
- Sem barrel imports que puxam o mundo inteiro — importar do ficheiro específico
- Backend: `require()` apenas em bootstrap; preferir `import` quando migrar para ESM

---

## TypeScript (frontend)

| Regra | Detalhe |
|-------|---------|
| Strict mode | `strict: true` — sem excepções |
| Props | Interface exportada para todo componente público |
| Return types | Explícitos em hooks e utils exportados |
| Null safety | `?.` e `??` — nunca `!` non-null assertion sem comentário |
| Enums | Preferir union types: `type Status = 'PENDING' \| 'ACTIVE'` |
| Zod | Schemas para validação de forms e API responses |

---

## Componentes React

```typescript
// ✅ Correcto
export function FirmDashboardPage() {
  const { data, isLoading } = useFirmDashboard()
  if (isLoading) return <PageLoading />
  return <FirmModuleShell title={t('firm.dashboard.title')}>...</FirmModuleShell>
}

// ❌ Errado
export function FirmDashboardPage() {
  const [data, setData] = useState(null)
  useEffect(() => { axios.get('/api/contabil/dashboard').then(r => setData(r.data)) }, [])
  // axios directo, sem loading state, sem error handling
}
```

### Regras

- Dados de servidor via TanStack Query — nunca `useEffect` + `fetch`
- Componentes puros para UI sem estado
- Estado UI local com `useState` — mínimo necessário
- Sem prop drilling > 2 níveis — usar context ou query
- Lazy load rotas com `React.lazy()` + `Suspense`
- Keys em listas: ID estável — nunca index

---

## Backend

### Camadas — regras

| Camada | Pode | Não pode |
|--------|------|----------|
| Controller | Validar input, chamar service, formatar response | Lógica de negócio, queries directas |
| Service | Regras de negócio, orquestração | HTTP I/O, queries directas |
| Repository | Queries, mapeamento row→entity | Regras de negócio |
| Middleware | Cross-cutting (auth, csrf, upload) | Lógica de domínio |

### Erros

```javascript
// ✅ Correcto
throw new AppError('Documento não encontrado', 404, undefined, 'DOCUMENT_NOT_FOUND');

// ❌ Errado
res.status(404).json({ error: 'not found' }); // no service
throw new Error('not found'); // sem código
```

- Sempre `AppError` com status, message, code
- Nunca expor stack trace ao cliente
- `error.middleware.js` formata todas as respostas

### Async

- Sempre `async/await` — nunca `.then()` chains
- Try/catch no controller; service pode deixar propagar
- `void` para fire-and-forget (notificações) com `.catch(logger.error)`

---

## Tratamento de erros

### Frontend

```typescript
// API errors
const toast = useContabilToast()
onError: (err) => toast.error(err) // traduz AxiosError → mensagem humana

// Query errors
const { data, error, isError } = useQuery({...})
if (isError) return <EmptyState title={t('errors.loadFailed')} />
```

### Backend

```javascript
// Controller
try {
  const result = await service.doThing(req.body);
  res.json(result);
} catch (err) {
  next(err); // → error.middleware
}
```

---

## Logs

| Nível | Quando | Exemplo |
|-------|--------|---------|
| `error` | Falha que precisa atenção | DB down, Stripe webhook fail |
| `warn` | Anomalia não-bloqueante | Rate limit hit, retry |
| `info` | Eventos de negócio | Login, registo, upload |
| `debug` | Desenvolvimento | Query timing, cache hit |

### Regras

- `logger.safe()` para erros — sanitiza PII
- Nunca logar: passwords, JWT, tokens, NIF completo, conteúdo de documentos
- Request ID em todo log (`request-context.middleware.js`)
- Sentry para erros não tratados em produção

---

## Validação

### Backend

```javascript
// Rotas — express-validator
router.post('/clients', [
  body('displayName').trim().notEmpty().isLength({ max: 200 }),
  body('email').optional().isEmail().normalizeEmail(),
], controller.create);

// Controller
const errors = validationResult(req);
if (!errors.isEmpty()) throw new AppError('Dados inválidos', 400, errors.array());
```

### Frontend

```typescript
const schema = z.object({
  displayName: z.string().min(1).max(200),
  email: z.string().email().optional(),
})
// React Hook Form + zodResolver
```

### Regras

- Validar nos dois lados (frontend UX + backend segurança)
- Nunca confiar apenas no frontend
- UUIDs: validar formato antes de query
- Ficheiros: MIME + magic bytes + tamanho

---

## Testes

### Obrigatório

| Tipo | Quando | Onde |
|------|--------|------|
| Unit | Toda função pura e service | `*.test.js` / `*.test.ts` |
| Integration | Todo repository e endpoint crítico | `scripts/` ou `tests/` |
| E2E | Fluxos de negócio core | Playwright |
| Tenant isolation | Toda alteração em scoping | `test:tenant-isolation` |

### Cobertura mínima (alvo Fase 3)

| Área | Meta |
|------|------|
| Services críticos (auth, documents, obligations) | 80% |
| Repositories | 60% |
| Utils | 90% |
| Frontend hooks | 50% |
| E2E fluxo piloto | 100% (1 teste completo) |

### Convenções

```javascript
// Node test runner (backend)
describe('password-crypto', () => {
  it('hashes with Argon2id', async () => { ... });
});

// Vitest (frontend)
describe('formatDueDate', () => {
  it('formats ISO date to pt-PT', () => { ... });
});
```

---

## Comentários

| Fazer | Não fazer |
|-------|-----------|
| Explicar *porquê* (business rule, workaround) | Explicar *o quê* (óbvio pelo código) |
| `// TODO(TEG-123):` com ticket | `// TODO: fix this` sem contexto |
| JSDoc em funções exportadas públicas | Comentários em cada linha |
| `@deprecated` com alternativa | Código comentado (apagar) |

---

## Git e PRs

| Regra | Detalhe |
|-------|---------|
| Commits | Conventional: `feat:`, `fix:`, `refactor:`, `docs:`, `test:` |
| PR size | < 400 linhas alteradas (ideal < 200) |
| PR description | O quê + porquê + como testar |
| CI | Build + tsc + testes devem passar |
| Review | Toda PR revista antes de merge |

---

## Segurança no código

- Nunca commitar secrets (`.env`, keys, tokens)
- Nunca `eval()`, `Function()`, `dangerouslySetInnerHTML` (excepto HTML sanitizado)
- Nunca SQL string interpolation — usar Supabase client parametrizado
- Sempre scoping `firm_id` em queries de domínio
- Sempre `escapeHtml()` antes de inserir user content em HTML

---

## Checklist pre-commit mental

- [ ] Ficheiro < 400 linhas?
- [ ] Funções < 50 linhas?
- [ ] Sem naming legacy (clinic/patient)?
- [ ] Sem `console.log`?
- [ ] Sem `any`?
- [ ] Erros tratados?
- [ ] Strings via i18n?
- [ ] Tokens CSS (sem hex)?
- [ ] Testes para lógica nova?

---

## Relação com outros documentos

| Documento | Conteúdo |
|-----------|----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Estrutura que estes padrões enforce |
| [DESIGN_SYSTEM.md](../design/DESIGN_SYSTEM.md) | Padrões de UI |
| [SECURITY.md](../security/SECURITY.md) | Regras de segurança |
| [ROADMAP.md](../product/ROADMAP.md) | Fase 3 — enforcement via CI |
