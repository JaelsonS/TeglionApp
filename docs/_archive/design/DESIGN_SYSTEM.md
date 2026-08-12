# Teglion — Design System

**Documento oficial · Última actualização: Julho 2026**

Sistema de design do Teglion. Define tokens, componentes, padrões e regras para uma interface consistente, acessível e escalável.

---

## Princípios de design

| Princípio | Aplicação |
|-----------|-----------|
| **Clareza** | O contabilista tem 30 segundos de atenção — hierarquia visual clara |
| **Simplicidade** | Portal cliente: máximo 2 cliques por acção |
| **Consistência** | Um componente, um comportamento, em todo o produto |
| **Acessibilidade** | WCAG 2.1 AA nas rotas críticas |
| **Mobile-first** | Portal cliente desenhado para telemóvel |
| **Profissionalismo** | Tom corporate — escritório de contabilidade, não startup colorida |

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | React 19 + TypeScript |
| Styling | Tailwind CSS 3.4 |
| Tokens | CSS custom properties + `design-system/tokens.ts` |
| Primitivos | Radix UI (uso interno — não exposto directamente) |
| Ícones | Lucide React |
| Animações | Framer Motion (portal cliente, landing, auth) |
| Toasts | Sonner |
| Forms | React Hook Form + Zod |

---

## Arquitectura de componentes

```
design-system/          ← ÚNICA fonte de componentes UI (alvo)
  ├── Button.tsx
  ├── Card.tsx
  ├── Modal.tsx
  ├── Table.tsx
  ├── EmptyState.tsx
  ├── Badge.tsx
  ├── FirmModuleShell.tsx
  ├── MobileBottomNav.tsx
  └── index.ts

components/ui/          ← Primitivos Radix (INTERNO — não importar em pages)
  ├── button.jsx
  ├── dialog.jsx
  └── ...

app/*/pages/            ← Composição de componentes (sem UI primitives directos)
```

**Regra:** Páginas importam de `@/design-system`, nunca de `@/components/ui`.

**Estado actual:** Dual layer (design-system + components/ui). **Alvo Fase 2:** unificar.

---

## Tokens

### Cores

| Token CSS | Valor | Uso |
|-----------|-------|-----|
| `--cb-brand` | `#0f2942` | Navy — primária, headers, sidebar |
| `--cb-accent` | `#C9932E` | Dourado — destaques, CTAs secundários |
| `--cb-success` | Verde | Estados positivos, validado |
| `--cb-warning` | Amarelo | Alertas, prazos próximos |
| `--cb-danger` | Vermelho | Erros, atrasos, rejeitado |
| `--cb-bg` | `#FAFAF7` | Fundo geral |
| `--cb-text` | `#0F2942` | Texto principal |
| `--cb-text-muted` | `#4A5568` | Texto secundário |

**Regra:** Nunca usar hex hardcoded em componentes. Sempre tokens CSS.

Ficheiros: `frontend/src/styles/globals.css`, `tokens.css`, `design-system/tokens.ts`

### Tipografia

| Classe | Tamanho | Uso |
|--------|---------|-----|
| `.cb-text-display` | 2rem+ | Títulos de página |
| `.cb-text-title` | 1.25rem | Títulos de secção |
| `.cb-text-body` | 1rem | Corpo |
| `.cb-text-caption` | 0.75rem (12px min) | Legendas, metadata |

**Regra:** Mínimo 12px em mobile. Nunca `text-[9px]` ou tamanhos arbitrários.

### Espaçamento

- Base: 4px grid (Tailwind default)
- Padding de página: `p-4` mobile, `p-6` desktop
- Gap entre cards: `gap-4`
- Secções: `space-y-6`

### Border radius

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-sm` | 6px | Inputs, badges |
| `--radius-md` | 12px | Cards |
| `--radius-lg` | 16px | Modais, painéis |
| `--radius-full` | 9999px | Avatares, pills |

---

## Componentes

### Core (usar sempre)

| Componente | Quando usar |
|------------|-------------|
| `Button` | Toda acção clicável |
| `Card` | Agrupamento de conteúdo |
| `EmptyState` | Listas vazias, estados iniciais |
| `Badge` | Estados (PENDING, APPROVED, OVERDUE) |
| `Modal` | Diálogos, confirmações |
| `Table` | Listas tabulares com sorting |
| `SkeletonCard` | Loading states |
| `PageLoading` | Loading de página inteira |
| `SafeImage` | Imagens com fallback |
| `useContabilToast` | Notificações de sucesso/erro |

### Layout

| Componente | Quando usar |
|------------|-------------|
| `FirmModuleShell` | Páginas do escritório (header + content) |
| `MobileBottomNav` | Navegação mobile (portal cliente) |
| `FirmSidebar` | Sidebar escritório |
| `PageRouteFallback` | Suspense fallback em rotas |

### Formulários

| Componente | Quando usar |
|------------|-------------|
| `Input` | Campos de texto |
| `Select` | Selecção única |
| `Checkbox` | Booleanos |
| `PhoneInput` | Telefone (lazy loaded) |
| `ClientSearchSelect` | Pesquisa de cliente com autocomplete |

### Estados de obrigação/tarefa

| Status | Cor (Badge) | Ícone |
|--------|-------------|-------|
| PENDING | warning | Clock |
| IN_PROGRESS | accent | Play |
| WAITING_CLIENT | warning | User |
| DELIVERED / APPROVED | success | Check |
| OVERDUE | danger | AlertTriangle |
| CANCELLED | muted | X |

---

## Padrões de layout

### Escritório (desktop)

```
┌──────────┬────────────────────────────────┐
│ Sidebar  │ Topbar (breadcrumb + actions)  │
│ (nav)    ├────────────────────────────────┤
│          │                                │
│          │  Page content                  │
│          │  (FirmModuleShell)             │
│          │                                │
└──────────┴────────────────────────────────┘
```

### Escritório (mobile/tablet)

```
┌────────────────────────────────┐
│ Topbar (hamburger + title)     │
├────────────────────────────────┤
│                                │
│  Page content                  │
│                                │
├────────────────────────────────┤
│ Bottom nav (5 items + "mais")  │
└────────────────────────────────┘
```

### Portal cliente (mobile-first)

```
┌────────────────────────────────┐
│ Header (logo escritório)       │
├────────────────────────────────┤
│                                │
│  Page content                  │
│                                │
├────────────────────────────────┤
│ Bottom nav (5 items)           │
└────────────────────────────────┘
```

---

## Padrões de interacção

| Padrão | Regra |
|--------|-------|
| **Confirmação** | Acções destrutivas (eliminar, rejeitar) → `ConfirmDialog` |
| **Optimistic UI** | Não — esperar confirmação do servidor |
| **Loading** | `SkeletonCard` para listas; `PageLoading` para páginas |
| **Erro** | Toast com mensagem legível via `useContabilToast` |
| **Empty** | `EmptyState` com acção sugerida ("Criar primeiro cliente") |
| **Paginação** | Botões prev/next + contagem; ou scroll infinito em mobile |
| **Filtros** | Inline na página; estado na URL (query params) |

---

## Acessibilidade

| Requisito | Estado | Alvo |
|-----------|--------|------|
| Skip-to-main | Só blog | Global (Fase 3) |
| Focus visible | Parcial | 100% componentes |
| Aria labels | Parcial | Todos os botões icon-only |
| Contraste | ✅ | WCAG AA |
| Keyboard nav | Parcial | Modais, sidebar, forms |
| Screen reader | Parcial | Landmarks, live regions |

---

## CSS

### Pipeline

```
globals.css → app-shell.css → animations.css
(contabil.css — lazy loaded em rotas /app)
```

### Regras

1. Sem `!important` (excepto overrides documentados)
2. Sem CSS modules — Tailwind + tokens
3. Classes utilitárias Tailwind para layout; tokens CSS para cores
4. `contabil.css` para estilos específicos do app (não marketing)

### Prefixos

| Prefixo | Uso |
|---------|-----|
| `cb-` | ContaBil/Teglion app styles |
| `landing-` | Marketing/landing pages |
| `blog-` | Blog |

---

## Internacionalização (UI)

- Toda string visível via `t('namespace:key')`
- Nunca texto hardcoded em componentes
- Formatação de datas/moedas via `CountryConfig` (ver [MULTI_COUNTRY.md](../international/MULTI_COUNTRY.md))
- Pluralização via i18next

---

## Responsividade

| Breakpoint | Largura | Layout |
|------------|---------|--------|
| Mobile | < 640px | Bottom nav, single column |
| Tablet | 640–1280px | Bottom nav escritório, sidebar drawer |
| Desktop | > 1280px | Sidebar fixa, split views |

**Regra:** Testar em 375px (iPhone SE), 768px (iPad), 1440px (desktop).

---

## Componentes a remover (Fase 1)

_Nenhum pendente neste lote — ver MODULES.md para itens 🔴 restantes._

---

## Checklist para novos componentes

- [ ] TypeScript (`.tsx`)
- [ ] Props tipadas com interface exportada
- [ ] Usa tokens CSS (sem hex hardcoded)
- [ ] Acessível (aria, focus, keyboard)
- [ ] Responsivo (mobile-first)
- [ ] Strings via i18n
- [ ] Exportado em `design-system/index.ts`
- [ ] Documentado neste ficheiro

---

## Relação com outros documentos

| Documento | Conteúdo |
|-----------|----------|
| [UI.md](./UI.md) | Checklist QA visual (operacional) |
| [CODING_STANDARDS.md](../engineering/CODING_STANDARDS.md) | Regras de código para componentes |
| [MULTI_COUNTRY.md](../international/MULTI_COUNTRY.md) | Formatação locale |
| [ARCHITECTURE.md](../engineering/ARCHITECTURE.md) | Onde vive o design system |
