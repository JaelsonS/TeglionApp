# TegLion — Inteligência Artificial

**Documento oficial · Última actualização: Julho 2026**

Arquitectura de IA para o TegLion. **Nenhuma implementação neste documento** — apenas desenho, organização e plano de crescimento.

**Princípio:** IA reforça a proposta de valor operacional. Não é um chatbot genérico. É um assistente que conhece o contexto fiscal, o cliente e o histórico do escritório.

---

## Posicionamento

```
❌ "ChatGPT para contabilistas"
✅ "O sistema que sabe o que falta pedir, resume o documento e escreve o email"
```

Cada funcionalidade IA deve responder:

> *"Isto ajuda o escritório a trabalhar melhor, conquistar clientes ou atender melhor os seus clientes?"*

---

## Arquitectura de alto nível

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND                                                        │
│  · Botões "Gerar com IA" em contextos específicos               │
│  · Assistente lateral (firm) · Chatbot (portal cliente)         │
│  · NUNCA chama LLM directamente                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ POST /api/v1/ai/*
┌──────────────────────────▼──────────────────────────────────────┐
│  AI GATEWAY (backend/src/modules/ai/)                            │
│  · Autenticação + RBAC + rate limit + audit                     │
│  · Router de capabilities                                        │
│  · Prompt builder (com contexto de país, firma, cliente)        │
│  · Cost tracking por firma                                       │
└──────┬──────────────┬──────────────┬────────────────────────────┘
       │              │              │
┌──────▼──────┐ ┌─────▼─────┐ ┌─────▼──────────┐
│  Document   │ │  Comms    │ │  Copilot       │
│  Intel.     │ │  Assistant│ │  (RAG)         │
│  OCR·Classify│ │  Email·Msg│ │  Query·Answer  │
│  ·Summarize │ │  ·Template│ │  ·Search       │
└──────┬──────┘ └─────┬─────┘ └─────┬──────────┘
       │              │              │
┌──────▼──────────────▼──────────────▼────────────────────────────┐
│  LLM PROVIDER ADAPTER                                            │
│  · OpenAI (GPT-4o / GPT-4o-mini)                                │
│  · Anthropic (Claude) — fallback                                  │
│  · Abstracção: ai/providers/llm.adapter.js                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  DATA LAYER                                                      │
│  · PostgreSQL (contexto estruturado)                             │
│  · pgvector (embeddings para RAG)                                │
│  · Supabase Storage (documentos para OCR)                          │
│  · ai_requests / ai_usage_logs (auditoria e billing)             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Módulo AI Maya

### Localização

```
backend/src/modules/ai/
├── ai.gateway.js              # Entry point — routing, auth, rate limit
├── ai.controller.js           # HTTP handlers
├── ai.config.js               # Modelos, limites, custos
├── capabilities/
│   ├── document-intelligence.js
│   ├── communication-assistant.js
│   ├── internal-copilot.js
│   └── content-engine.js
├── prompts/
│   ├── system/
│   │   ├── pt-fiscal-context.js
│   │   └── br-fiscal-context.js
│   ├── templates/
│   │   ├── document-request.js
│   │   ├── reminder-email.js
│   │   └── obligation-summary.js
│   └── prompt-builder.js
├── providers/
│   ├── llm.adapter.js         # Interface comum
│   ├── openai.provider.js
│   └── anthropic.provider.js
├── embeddings/
│   ├── embedding.service.js
│   └── vector-search.service.js
└── ocr/
    ├── ocr.service.js
    └── document-classifier.js
```

### Responsabilidades d a IA Maya

| Responsabilidade | Detalhe |
|------------------|---------|
| **Autenticação** | Só utilizadores autenticados; RBAC por capability |
| **Rate limiting** | Por firma: X requests/hora (configurável por plano) |
| **Cost tracking** | Tokens usados → `ai_usage_logs` → billing futuro |
| **Audit** | Toda request IA → `audit_logs` (sem PII no prompt log) |
| **PII filtering** | Remover NIF, emails, telefones antes de enviar a LLM (quando possível) |
| **Country context** | Injectar `CountryConfig` no system prompt |
| **Error handling** | Fallback entre providers; timeout 30s; retry 1× |
| **Response validation** | Schema validation (Zod) na resposta da IA |

---

## Capabilities (funcionalidades IA)

### 1. Document Intelligence

**Onde na UI:** Upload de documento, inbox de documentos, validação.

| Funcionalidade | Input | Output | Prioridade |
|----------------|-------|--------|------------|
| **OCR** | PDF/imagem upload | Texto extraído | Alta |
| **Classificação** | Texto ou ficheiro | `{ type, period, clientId?, confidence }` | Alta |
| **Resumo** | Documento | Resumo em 2-3 frases | Média |
| **Detecção de duplicados** | Embedding do doc | Match com docs existentes | Baixa |

**Fluxo:**
```
Upload → storage → ai/document-intelligence
  ├─ OCR (se imagem/PDF)
  ├─ Classify (tipo: factura, extrato, recibo, contrato...)
  ├─ Extract metadata (data, valor, NIF emitente)
  └─ Sugerir: clientId, obligationId, period
      └─ UI: "Sugestão IA" com aceitar/rejeitar
```

### 2. Communication Assistant

**Onde na UI:** Pedido de documentos, mensagens, lembretes, alertas.

| Funcionalidade | Input | Output | Prioridade |
|----------------|-------|--------|------------|
| **Gerar pedido de documentos** | Obrigação + histórico cliente | Lista de docs + email | Alta |
| **Gerar email de lembrete** | Obrigação + dias até prazo | Email personalizado | Alta |
| **Gerar mensagem** | Contexto da conversa | Sugestão de resposta | Média |
| **Tom de voz** | Config do escritório | Formal / amigável / técnico | Média |

**Fluxo:**
```
Contabilista clica "Gerar pedido com IA"
  → ai/communication-assistant
    → prompt: obrigação IVA Março + cliente X + docs já recebidos
    → LLM gera: lista de docs em falta + email pronto
    → UI: preview editável → enviar
```

### 3. Internal Copilot (RAG)

**Onde na UI:** Painel lateral no escritório (ícone assistente).

| Funcionalidade | Input | Output | Prioridade |
|----------------|-------|--------|------------|
| **Perguntas operacionais** | "Quais clientes têm IVA esta semana?" | Resposta com dados | Alta |
| **Busca inteligente** | "extrato bancário março empresa X" | Documentos + tarefas + mensagens | Alta |
| **Resumo de cliente** | clientId | Resumo fiscal + pendências | Média |
| **Análise de risco** | firmId | Clientes com mais atrasos | Baixa |

**Fluxo (RAG):**
```
Pergunta → embedding → pgvector search (firm_id scoped)
  → top-K documentos/tarefas/obrigações relevantes
  → prompt: system + context + pergunta
  → LLM → resposta com referências
```

**Regra:** Copilot **nunca** inventa dados. Se não encontra no RAG, diz "não encontrei".

### 4. Content Engine

**Onde na UI:** Blog (interno), alertas, notícias para clientes.

| Funcionalidade | Input | Output | Prioridade |
|----------------|-------|--------|------------|
| **Gerar post blog** | Tópico + país | Rascunho artigo SEO | Baixa |
| **Gerar newsletter** | Eventos da semana | Email para clientes | Baixa |
| **Gerar post LinkedIn** | Conquista/marco | Post social | Baixa |
| **Calendário de conteúdo** | Mês + país | 4 tópicos sugeridos | Baixa |

**Prioridade baixa** — só após capabilities 1-3 validadas.

---

## Portal cliente — Chatbot v1

**Onde:** Portal cliente, canto inferior.

| Capacidade | Exemplo |
|------------|---------|
| FAQ fiscal (país) | "Quando vence o IVA?" |
| Estado de pedidos | "O que falta enviar?" |
| Navegação | "Como faço upload?" |
| Escalar para humano | "Quero falar com o contabilista" → mensagem |

**Limitações v1:**
- Sem acesso a dados de outros clientes
- Sem conselho fiscal (disclaimer obrigatório)
- Contexto limitado ao `clientId` do JWT

---

## Integração com WhatsApp (Fase 6)

```
WhatsApp inbound → webhook → ai/document-intelligence
  ├─ Imagem/PDF → OCR + classify
  ├─ Texto → intent detection (pedido, dúvida, saudação)
  └─ Resposta automática ou encaminhar para escritório
```

IA no WhatsApp é **assistente de triagem**, não substituto do contabilista.

---

## Modelo de dados (IA)

### Novas tabelas (Fase 5)

```sql
-- Pedidos de IA (auditoria)
CREATE TABLE ai_requests (
  id UUID PRIMARY KEY,
  firm_id UUID NOT NULL REFERENCES firms(id),
  actor_id UUID,
  capability TEXT NOT NULL,       -- 'document-classify', 'generate-email', etc.
  model TEXT,                       -- 'gpt-4o-mini'
  input_tokens INT,
  output_tokens INT,
  cost_cents INT,                   -- custo estimado
  latency_ms INT,
  status TEXT,                    -- 'success', 'error', 'timeout'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Embeddings para RAG
CREATE TABLE ai_embeddings (
  id UUID PRIMARY KEY,
  firm_id UUID NOT NULL,
  entity_type TEXT NOT NULL,        -- 'document', 'message', 'obligation'
  entity_id UUID NOT NULL,
  embedding VECTOR(1536),           -- pgvector
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice
CREATE INDEX idx_ai_embeddings_firm ON ai_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### Retenção

| Tabela | Retenção |
|--------|----------|
| `ai_requests` | 12 meses |
| `ai_embeddings` | Vida do documento/entidade |
| Prompts logados | Nunca (só metadata) |

---

## Segurança e compliance

| Regra | Implementação |
|-------|---------------|
| LLM nunca no frontend | Tudo via AI Gateway |
| PII minimization | Mascarar NIF/email antes de enviar quando possível |
| Tenant isolation | RAG scoped por `firm_id`; testes de isolamento |
| Consentimento | Escritório aceita termos de uso de IA no onboarding |
| Disclaimer | "IA não substitui aconselhamento profissional" em toda UI IA |
| Opt-out | Escritório pode desactivar IA nas definições |
| Data residency | Preferir provider com EU data processing (OpenAI EU) |
| Audit | Toda request IA em `ai_requests` + `audit_logs` |

---

## Custos e limites

| Plano | Requests IA/mês | Modelo default |
|-------|-----------------|----------------|
| Trial | 50 | gpt-4o-mini |
| Starter | 200 | gpt-4o-mini |
| Pro | 1000 | gpt-4o |
| Enterprise | Ilimitado | gpt-4o + Claude |

**Meta:** Custo IA < 5% da receita por escritório.

**Tracking:**
```
ai_requests.cost_cents → dashboard interno
Alerta se firma > 2× limite do plano
```

---

## Evolução por fase

| Fase | Capabilities | Modelo |
|------|-------------|--------|
| 5.1 | AI Gateway + audit | Infra only |
| 5.2 | Document Intelligence (OCR + classify) | gpt-4o-mini |
| 5.3 | Communication Assistant (pedidos + emails) | gpt-4o-mini |
| 5.4 | Internal Copilot (RAG básico) | gpt-4o + pgvector |
| 5.5 | Chatbot portal cliente v1 | gpt-4o-mini |
| 5.6 | Content Engine | gpt-4o |
| 6.x | WhatsApp triagem | gpt-4o-mini |
| 8.x | Análise preditiva (risco, churn) | Fine-tuned |

---

## Provider abstraction

```javascript
// ai/providers/llm.adapter.js
class LlmAdapter {
  async complete({ system, messages, model, maxTokens, temperature }) {
    // implementação por provider
  }
  async embed({ text, model }) {
    // embeddings
  }
}
```

Trocar de OpenAI para Anthropic (ou modelo open-source) sem alterar capabilities.

---

## Métricas de sucesso

| Métrica | Meta (6 meses pós-lançamento) |
|---------|-------------------------------|
| % uploads classificados automaticamente | > 60% |
| Tempo para criar pedido de documentos | ↓ 50% |
| Uso do copilot (escritórios activos) | > 30% |
| Satisfação com sugestões IA | > 4/5 |
| Custo IA / receita | < 5% |

---

## O que NÃO fazer

- ❌ Chatbot genérico no marketing
- ❌ IA a dar conselho fiscal vinculativo
- ❌ Enviar dados de todos os clientes num prompt
- ❌ Fine-tuning prematuro (RAG primeiro)
- ❌ IA como feature checkbox sem contexto

---

## Relação com outros documentos

| Documento | Conteúdo |
|-----------|----------|
| [VISION.md](../product/VISION.md) | IA como parte da visão 2031 |
| [ROADMAP.md](../product/ROADMAP.md) | Fase 5 — IA |
| [ARCHITECTURE.md](../engineering/ARCHITECTURE.md) | Onde o módulo AI vive |
| [SECURITY.md](../security/SECURITY.md) | Controles de segurança para IA |
| [MULTI_COUNTRY.md](../international/MULTI_COUNTRY.md) | Prompts por país |
