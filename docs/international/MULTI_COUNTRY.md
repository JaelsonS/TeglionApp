# TegLion — Multi-País

**Documento oficial · Última actualização: Julho 2026**

Estratégia para o TegLion operar em **múltiplos países** — começando por Portugal e Brasil — sem alterar a arquitectura ao adicionar novos mercados.

**Princípio:** País é uma **configuração**, não um fork de código.

---

## Países suportados

| Código | País | Fase | Estado |
|--------|------|------|--------|
| `PT` | Portugal | Piloto | ✅ Activo (único funcional) |
| `BR` | Brasil | Fase 4 | 🔜 Planeado |
| *futuro* | Angola, Moçambique, etc. | Fase 8+ | Arquitectura preparada |

---

## Modelo conceptual

```
firm.country_code = 'PT' | 'BR'
        │
        ▼
CountryConfig.resolve('PT')
        │
        ├── locale: 'pt-PT'
        ├── currency: 'EUR'
        ├── timezone: 'Europe/Lisbon'
        ├── dateFormat: 'dd/MM/yyyy'
        ├── taxId: { type: 'NIF', validator: validateNif, label: 'NIF' }
        ├── fiscalCalendar: PtFiscalCalendarProvider
        ├── obligationTypes: ['IVA', 'IRC', 'IRS', 'SS', 'DRF', 'IES', ...]
        ├── legalDocuments: ['termos-pt', 'privacidade-pt', 'dpa-pt']
        ├── integrations: { taxAuthority: 'AT', postalLookup: 'geoapi.pt (+ postcode-pt fallback)' }
        ├── aiPrompts: { systemContext: '...' }
        └── stripePriceId: 'price_pt_...'
```

**Regra:** Nenhum `if (country === 'PT')` espalhado no código. Tudo via `CountryConfig`.

---

## CountryConfig — estrutura

### Backend (`backend/src/config/country-configs/`)

```javascript
// country-config.registry.js
const PT = require('./pt.config');
const BR = require('./br.config');

const REGISTRY = { PT, BR };

function resolveCountryConfig(countryCode) {
  const config = REGISTRY[countryCode];
  if (!config) throw new AppError('País não suportado', 400, 'UNSUPPORTED_COUNTRY');
  return config;
}
```

### Frontend (`frontend/src/config/country/`)

```typescript
// countryConfig.ts
export function useCountryConfig() {
  const { firm } = useFirmBranding();
  return resolveCountryConfig(firm?.countryCode ?? 'PT');
}
```

### Campos do config

| Campo | Tipo | Exemplo PT | Exemplo BR |
|-------|------|------------|------------|
| `code` | string | `'PT'` | `'BR'` |
| `locale` | string | `'pt-PT'` | `'pt-BR'` |
| `currency` | string | `'EUR'` | `'BRL'` |
| `currencySymbol` | string | `'€'` | `'R$'` |
| `timezone` | string | `'Europe/Lisbon'` | `'America/Sao_Paulo'` |
| `dateFormat` | string | `'dd/MM/yyyy'` | `'dd/MM/yyyy'` |
| `taxId` | object | NIF (9 dígitos) | CPF (11) / CNPJ (14) |
| `obligationTypes` | string[] | IVA, IRC, IRS, SS | DAS, SPED, FGTS, IRPJ |
| `fiscalCalendarProvider` | class | `PtFiscalCalendar` | `BrFiscalCalendar` |
| `legalDocumentSet` | string[] | termos-pt, ... | termos-br, lgpd-br |
| `integrations` | object | AT, geoapi.pt postal | Receita Federal, ViaCEP |
| `stripePriceId` | string | `price_xxx_pt` | `price_xxx_br` |
| `phoneFormat` | string | `+351` | `+55` |
| `dataProtectionLaw` | string | `'RGPD'` | `'LGPD'` |

---

## Idioma

### Sistema único: i18next

| Namespace | Conteúdo |
|-----------|----------|
| `common` | UI geral (nav, botões, estados) |
| `firm` | Módulos do escritório |
| `client` | Portal do cliente |
| `auth` | Login, registo, recuperação |
| `legal` | Textos legais |
| `fiscal` | Tipos de obrigação, calendário |
| `marketing` | Landing, pricing |
| `errors` | Mensagens de erro |

### Locales

| Locale | País | Prioridade |
|--------|------|------------|
| `pt-PT` | Portugal | ✅ Actual |
| `pt-BR` | Brasil | Fase 4 |
| `en` | Internacional (futuro) | Baixa |

### Regras

1. **Zero strings visíveis hardcoded** — tudo via `t('key')`
2. **Locale resolvido por:** `firm.country_code` → `CountryConfig.locale`
3. **API:** header `Accept-Language` + `X-User-Language`
4. **Pluralização e género:** usar i18next plural rules
5. **Remover sistemas paralelos:** `contabilPt.ts`, `clientHubI18n.ts` → migrar para namespaces

---

## Moeda

| Aspecto | Implementação |
|---------|---------------|
| Formatação | `formatMoney(amount, { locale, currency })` — nunca `formatEuro()` hardcoded |
| Pricing | Stripe Price ID por país no `CountryConfig` |
| UI | Símbolo e posição via `Intl.NumberFormat` |
| BD | Valores monetários em centavos (integer); moeda no config, não na row |
| Relatórios | Sempre na moeda do escritório |

### Pricing alvo

| País | Modelo | Valor referência |
|------|--------|------------------|
| PT | Por utilizador/mês | €29,99 |
| BR | Flat por escritório/mês | R$149 |

---

## Datas e horas

| Aspecto | Implementação |
|---------|---------------|
| Armazenamento | `TIMESTAMPTZ` (UTC) na BD |
| Exibição | `dayjs`/`date-fns` com timezone do `CountryConfig` |
| Calendário fiscal | Datas locais (DATE, sem timezone) |
| Prazos | `due_date DATE` — interpretado no timezone do escritório |
| Formato | `dd/MM/yyyy` (PT e BR); configurável por locale |

---

## Identificação fiscal

| País | Tipo | Formato | Validação |
|------|------|---------|-----------|
| PT | NIF | 9 dígitos | Algoritmo módulo 11 |
| BR (PF) | CPF | 11 dígitos | Algoritmo CPF |
| BR (PJ) | CNPJ | 14 dígitos | Algoritmo CNPJ |

### Modelo de dados

```sql
-- clients table (evolução)
tax_id TEXT,                    -- valor normalizado (só dígitos)
tax_id_type TEXT,               -- 'NIF' | 'CPF' | 'CNPJ'
entity_type TEXT,               -- 'INDIVIDUAL' | 'COMPANY'
```

Validação no backend via `CountryConfig.taxId.validator`.

---

## Impostos e obrigações

### Portugal

| Tipo | Descrição |
|------|-----------|
| IVA | Declaração periódica |
| IRC | Imposto sobre rendimento colectivo |
| IRS | Imposto sobre rendimento singular |
| SS | Segurança Social |
| DRF | Declaração de rendimentos |
| IES | Informação empresarial simplificada |
| PAYROLL | Folha salarial |
| CUSTOM | Personalizada |

### Brasil

| Tipo | Descrição |
|------|-----------|
| DAS | Documento de Arrecadação do Simples Nacional |
| SPED | Sistema Público de Escrituração Digital |
| FGTS | Fundo de Garantia |
| IRPJ | Imposto de Renda Pessoa Jurídica |
| IRPF | Imposto de Renda Pessoa Física |
| ESOCIAL | Escrituração digital |
| PAYROLL | Folha salarial |
| CUSTOM | Personalizada |

**Regra:** `obligation.type` validado contra `CountryConfig.obligationTypes`. O tipo `DAS` no enum actual (herdado) será restrito a BR.

---

## Calendário fiscal

### Pattern (igual para todos os países)

```
backend/src/data/
├── pt-fiscal-calendar-2026.json
├── pt-fiscal-calendar-2027.json
├── br-fiscal-calendar-2026.json
└── ...

backend/src/modules/fiscal/
├── fiscal-calendar.service.js        # resolve provider por país
├── providers/
│   ├── pt-fiscal-calendar.provider.js
│   └── br-fiscal-calendar.provider.js
```

Cada provider:
1. Carrega JSON do ano (se existir)
2. Gera automaticamente para anos futuros (shift de datas)
3. Expõe `getDeadlines(year, month)` → array de `{ type, date, title }`

---

## Templates

| Tipo | Por país | Localização |
|------|----------|-------------|
| Email de convite | ✅ | `backend/src/i18n/templates/{country}/` |
| Email de lembrete | ✅ | Idem |
| SMS | ✅ | `services/sms/sms-templates.service.js` + country |
| Pedido de documento | ✅ | Templates de obrigação por país |
| Documentos legais | ✅ | `frontend/src/app/legal/{country}/` |
| Blog | ✅ | `content/blog/posts/` com tag `country:pt` ou `country:br` |

---

## Integrações por país

| Integração | PT | BR |
|------------|----|----|
| Autoridade fiscal | AT (deep-links → API certificada) | Receita Federal |
| Postal lookup | geoapi.pt (+ postcode-pt fallback) | ViaCEP |
| Pagamentos | Stripe EUR | Stripe BRL |
| SMS | Brevo (+351) | Brevo (+55) |
| WhatsApp | Futuro | **Prioritário** — canal principal BR |
| Banco (PIX) | N/A | Futuro (Fase 8) |

---

## Leis e compliance

| Aspecto | PT | BR |
|---------|----|----|
| Lei de protecção de dados | RGPD | LGPD |
| Páginas legais | `/termos`, `/privacidade`, `/dpa` | `/termos`, `/privacidade`, `/lgpd` |
| Consentimento | `user_legal_consents` | Mesma tabela; versão por país |
| Retenção de dados | Configurável por escritório | Idem |
| Auditoria | `audit_logs` | Idem |

---

## Configurações do escritório

```jsonc
// firms.settings (JSONB)
{
  "country": "PT",              // herda de country_code; override futuro
  "locale": "pt-PT",            // override opcional
  "timezone": "Europe/Lisbon",
  "currency": "EUR",
  "branding": { "logoUrl": "...", "primaryColor": "..." },
  "notifications": {
    "emailReminders": true,
    "smsReminders": false,
    "whatsappReminders": false   // Fase 6
  },
  "fiscal": {
    "defaultObligationTypes": ["IVA", "SS"],
    "reminderDaysBefore": 7
  }
}
```

---

## Detecção e selecção de país

| Momento | Como |
|---------|------|
| **Registo escritório** | Selector de país (define tudo) |
| **Convite cliente** | Herda país do escritório |
| **Login cliente** | `firmSlug` → país do escritório |
| **Marketing** | Selector ou geo-detection (Vercel `x-vercel-ip-country`) |
| **API** | `firmId` do JWT → `firms.country_code` → `CountryConfig` |

---

## Adicionar um novo país (checklist)

1. [ ] Criar `backend/src/config/country-configs/{code}.config.js`
2. [ ] Criar `frontend/src/config/country/{code}.ts`
3. [ ] Adicionar locale em i18n (`{locale}/` namespace completo)
4. [ ] Criar calendário fiscal JSON
5. [ ] Definir obligation types
6. [ ] Implementar validador de tax ID
7. [ ] Criar documentos legais
8. [ ] Configurar Stripe Price ID
9. [ ] Postal lookup (se aplicável)
10. [ ] Blog pillar content (SEO)
11. [ ] Testes de CountryConfig
12. [ ] Actualizar `MULTI_COUNTRY.md`

**Nenhuma alteração na arquitectura core.** Apenas novo ficheiro de config + dados.

---

## Migração do estado actual

| Item actual | Acção |
|-------------|-------|
| `firms.country_code DEFAULT 'PT'` | ✅ Já existe — passar a ser fonte de verdade |
| `formatEuro()`, `formatPtDate()` | Renomear para `formatMoney()`, `formatDate()` com CountryConfig |
| `pt-PT` forçado em `appLocale.ts` | Resolver via firm.country_code |
| `DAS` no enum de obligations | Restringir a BR quando CountryConfig activo |
| `contabilPt.ts` | Migrar para i18next namespace `firm` |
| `clientHubI18n.ts` | Migrar para i18next namespace `client` |
| `recover-password/i18n.ts` | Migrar para i18next namespace `auth` |

---

## Relação com outros documentos

| Documento | Conteúdo |
|-----------|----------|
| [ROADMAP.md](../product/ROADMAP.md) | Fase 4 — Internacionalização |
| [ARCHITECTURE.md](../engineering/ARCHITECTURE.md) | Onde CountryConfig vive na arquitectura |
| [DATABASE.md](../engineering/DATABASE.md) | Campos de BD para multi-país |
| [AI.md](../ai/AI.md) | Prompts por país |
