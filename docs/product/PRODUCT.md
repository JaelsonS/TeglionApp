# TegLion — Produto

**Documento oficial · Última actualização: Julho 2026**

Este documento descreve o **negócio** do TegLion — quem compra, quem usa, como ganha dinheiro e como cresce. Não descreve código nem rotas técnicas.

---

## O que é o TegLion

SaaS B2B multi-tenant que dá a escritórios de contabilidade um **painel operacional** e aos seus clientes um **portal digital** para documentos, prazos e comunicação.

O TegLion **não é** um ERP, **não é** software de facturação e **não substitui** o trabalho contabilístico. É a camada operacional que elimina o caos entre escritório e cliente.

---

## Quem compra

| Perfil | Motivação de compra |
|--------|---------------------|
| **Dono de micro-escritório** (5–20 clientes) | Parar de perder tempo no WhatsApp; parecer profissional |
| **Gestor de PME contabilística** (20–100 clientes) | Controlar prazos e documentos sem contratar mais administrativos |
| **Contabilista independente em crescimento** | Escalar carteira sem escalar caos |

**Decisor económico:** dono ou sócio-gestor do escritório.  
**Decisor técnico:** contabilista sénior ou responsável de operações.

---

## Quem utiliza

### Lado escritório (B2B)

| Utilizador | Frequência | Acções principais |
|------------|------------|-------------------|
| Dono / gestor | Diária | Dashboard, relatórios, billing, equipa |
| Contabilista | Diária | Validar documentos, gerir obrigações, mensagens |
| Assistente | Diária | Criar pedidos, convidar clientes, organizar ficheiros |
| Consultor externo | Semanal | Consultorias, agenda |

### Lado cliente (B2B2C)

| Utilizador | Frequência | Acções principais |
|------------|------------|-------------------|
| Empresário / ENI | Semanal–mensal | Upload documentos, ver pedidos, mensagens |
| Responsável financeiro PME | Semanal | Obrigações, arquivo, alertas |
| Contabilidade interna (grandes) | Diária | Pedidos, documentos, comunicação |

O cliente **não paga** directamente — o valor percebido justifica a mensalidade do escritório.

---

## Quem administra

| Papel | Responsabilidade |
|-------|------------------|
| **FIRM_OWNER** | Tudo: billing, equipa, definições, fecho de conta |
| **FIRM_STAFF** | Operações: clientes, documentos, tarefas, mensagens |
| **FIRM_CONSULTANT** | Consultorias e clientes atribuídos |
| **Equipa TegLion** (interno) | Infra, suporte L2, billing platform, segurança |

---

## Modelo de receita

### Actual (piloto)

| Elemento | Valor |
|----------|-------|
| **Trial** | 14 dias grátis, sem cartão |
| **Plano anual** | €29,99/mês (equivalente) = €359,88/ano |
| **Plano mensal** | €35,00/mês |
| **Pagamento** | Stripe (subscrição recorrente) |
| **Estado** | Código pronto; modo live pendente de activação |

### Política comercial oficial (documentada)

1. Se o cliente aderir ao plano anual: paga **€359,88 por ano** (equivalente a €29,99/mês).
2. Se o cliente aderir ao plano mensal: paga **€35,00 por mês**.

### Evolução planeada

| Fase | Modelo |
|------|--------|
| Piloto PT | Por utilizador (actual) |
| Escala PT | Plano por escritório (flat até N utilizadores) + add-ons |
| Brasil | Plano flat por escritório (R$99–199/mês) — mercado prefere preço fixo |
| Enterprise | Preço customizado + SLA + integrações |

### Fontes de receita futuras (não prioritárias no piloto)

- WhatsApp Business API (custo repassado ou incluído em plano Pro)
- IA avançada (limite de pedidos/mês no plano base)
- Integrações premium (ERPs, AT certificada)
- Marketplace de templates fiscais por país

---

## Como cresce

### Aquisição

| Canal | Papel | Estado |
|-------|-------|--------|
| **SEO / Blog** | Artigos sobre IRS, IVA, obrigações — atrai micro-escritórios e ENIs | ✅ 27 artigos, prerender |
| **Boca-a-boca** | Cliente do escritório vê portal moderno → recomenda | Piloto |
| **Parcerias** | Ordens profissionais, formadores, ERPs | Futuro |
| **Google Ads** | Keywords fiscais PT/BR | Pós-validação piloto |
| **WhatsApp viral** | Notificação ao cliente → descobre portal | Futuro (Fase 6) |

### Retenção

| Mecanismo | Porquê funciona |
|-----------|-----------------|
| **Calendário fiscal** | Uso diário/semanal — há sempre prazo a vigiar |
| **Documentos pendentes** | Dados do cliente ficam no sistema — switching cost |
| **Portal do cliente** | Escritório não pode remover sem impacto nos clientes |
| **Histórico auditável** | Compliance — não se volta ao WhatsApp |
| **IA** (futuro) | Quanto mais dados, melhor o assistente — efeito rede interno |

### Expansão (land and expand)

1. **Land:** escritório adopta para pedidos de documentos
2. **Expand:** obrigações, tarefas, mensagens, alertas
3. **Upsell:** IA, WhatsApp, relatórios, integrações

---

## Dores que resolve

| Dor | Solução TegLion | Métrica de sucesso |
|-----|-----------------|-------------------|
| "Onde está o extrato de Março?" | Pedidos estruturados + portal | Tempo para obter documento ↓ 70% |
| Cliente não sabe o que falta | Dashboard cliente com pedidos pendentes | % clientes autónomos ↑ |
| Prazos na cabeça de uma pessoa | Calendário fiscal + alertas + tarefas | Obrigações em atraso ↓ |
| WhatsApp sem registo | Mensagens auditáveis no sistema | Disputas com registo ↓ |
| Parecer amador perante clientes | Portal branded com logo do escritório | NPS cliente ↑ |
| Fecho do mês caótico | Workspace de tarefas + obrigações | Horas de fecho ↓ |

---

## Posicionamento competitivo

```
                    Operações do dia-a-dia
                            ▲
                            │
              TegLion ★     │
                            │
    ◄───────────────────────┼───────────────────────►
    Simples                 │                 Complexo
                            │
              Excel/WhatsApp│    Primavera/Omie
                            │
                            ▼
                    Contabilidade profunda
```

**TegLion ocupa o quadrante superior-esquerdo:** operações simples e modernas, sem competir com ERPs na contabilidade profunda.

### Concorrentes indirectos

| Concorrente | O que faz | O que não faz |
|-------------|-----------|---------------|
| Email + WhatsApp | Grátis, familiar | Sem registo, sem prazos, sem portal |
| Google Drive / Dropbox | Armazenamento | Sem workflow, sem prazos |
| Primavera / PHC / Sage | Contabilidade completa | Portal cliente fraco ou inexistente |
| Conta Azul / Omie (BR) | ERP cloud | Foco em facturação, não em recolha de docs |
| Notion / Trello | Organização genérica | Sem fiscalidade, sem portal cliente |

### O que nos diferencia

1. **Portal do cliente nativo** — não add-on
2. **Foco em documentos + prazos** — o core do dia-a-dia
3. **IA operacional** (futuro) — não chatbot genérico
4. **Multi-país** — PT e BR na mesma plataforma
5. **Preço acessível** — para micro-escritórios

---

## Jornada do cliente (escritório)

```
Descobre (blog/SEO)
    → Regista trial (14 dias)
        → Cria primeiro cliente
            → Envia convite por email
                → Cliente faz upload
                    → Escritório valida
                        → "Não volto ao WhatsApp para isto"
                            → Subscreve (Stripe)
                                → Adopta mais módulos (obrigações, tarefas, IA)
```

**Critério de activação:** escritório valida primeiro documento recebido via portal.  
**Critério de retenção:** escritório usa pedidos de documentos 4 semanas seguidas sem voltar ao email para o mesmo ficheiro.

---

## Jornada do cliente (portal)

```
Recebe convite por email
    → Cria conta (ou aceita convite)
        → Vê pedidos pendentes
            → Faz upload
                → Recebe confirmação
                    → Volta quando há novo pedido ou alerta
```

**Meta UX:** máximo 2 cliques para completar um pedido de documento.

---

## Estado actual do produto

| Área | Maturidade |
|------|------------|
| Auth + multi-tenant | Produção |
| Documentos (pedidos, upload, validação) | Produção |
| Mensagens | Produção |
| Tarefas + obrigações | Produção |
| Calendário fiscal PT | Produção |
| Portal cliente | Produção |
| Blog SEO | Produção |
| Billing Stripe | Código pronto, live pendente |
| WhatsApp | Não implementado |
| IA | Não implementado |
| Multi-país (BR) | Não implementado |
| Integração AT real | Apenas deep-links |

**Fase:** Piloto vendável — validação com utilizadores reais em curso.

---

## Mapa de rotas (referência técnica)

Para rotas canónicas e paths da aplicação, ver [MODULES.md](./MODULES.md). A documentação de API está em [API.md](../engineering/API.md).

---

## Relação com outros documentos

| Documento | Conteúdo |
|-----------|----------|
| [VISION.md](./VISION.md) | Missão, visão, valores |
| [ROADMAP.md](./ROADMAP.md) | Plano de evolução |
| [MODULES.md](./MODULES.md) | Módulos e prioridades |
| [AI.md](../ai/AI.md) | Estratégia de IA |
