# Teglion V10 — Carta da frente Ops + Fiscal

**Branch exclusiva:** `feature/fase-v10-ops-fiscal` (base: `staging`)  
**Actualizado:** 25/10/2026 (Ondas 1–3 commitadas na branch; sem push)  
**Estado:** implementação activa na branch `feature/fase-v10-ops-fiscal`

Marca: **Teglion** (produto). Operador: **AfDigital — Soluções Tecnológicas**. Domínio: teglion.com.

---

## 1. Ambção (honesta)

Unir, no Teglion, o melhor do que o mercado português já vende:

| Referência | O que trazem | O que o Teglion absorve |
|---|---|---|
| [ContaCRM](https://contacrm.pt/) | CRM de gabinete: clientes, avenças, tarefas, alertas, cofre, relatórios, manual | Operação comercial do escritório + guia do utilizador |
| [Konta](https://konta.pt/) | SAF-T, calendário AT, recibos/faturas no Portal, extratos → ERP, calculadoras | Operação fiscal + motor de simulação; **sem fingir certificação AT** |

O Teglion **já tem** portal do cliente, documentos com validação, MFA, Stripe Connect, página pública e Maya — peças que esses produtos usam como diferencial. A estratégia é **reutilizar e evoluir**, não copiar ecrãs feios nem inventar um ERP certificado numa sprint.

**Caminho futuro (não é entrega desta branch):** aproximações a software certificado (webservice AT, ATCUD, séries) **só** com investimento, aconselhamento jurídico e processo oficial. Até lá, a UI deixa claro o que é simulação / preparação / atalho vs. declaração oficial.

---

## 2. Princípios de UX/UI (obrigatórios)

1. **Simples primeiro.** Uma tarefa por ecrã; zero dashboards decorativos.
2. **Visual Teglion.** Reutilizar `FirmModuleShell`, design system, tipografia e padrões já usados no escritório — não um “skin ContaCRM”.
3. **Bonito ≠ complexo.** Poucos filtros, estados vazios claros, mobile já suportado pelo shell.
4. **Linguagem do contabilista.** “Avença”, “obrigação”, “documento pendente” — não jargão de engenharia.
5. **Honestidade legal na UI.** Simulação ≠ declaração; honorários do escritório ≠ fatura certificada AT.
6. **Maya e ajuda.** Guia humano + capítulos do Manual; Maya não inventa regras fiscais.

---

## 3. Dinheiro: avenças sempre; Stripe Connect opcional

### 3.1 Registo de honorários (núcleo — Onda 1)

O escritório **gere sempre** avenças e pagamentos dos clientes **sem** Stripe:

- Define a mensalidade na ficha do cliente.
- Gera o mapa anual (cliente × mês) e marca estados à mão: rascunho → confirmada → enviada → paga.
- Vê saldos, atrasos e histórico no Teglion.
- Métodos manuais: transferência, MB Way, Multibanco, numerário, outro.

**Stripe Connect não é obrigatório.** Sem Connect, o produto de avenças funciona a 100% em modo manual.

### 3.2 Stripe Connect (opcional — melhor para o escritório e para a plataforma)

Se o responsável ligar a Stripe Connect:

- Pode cobrar clientes online (já existe para booking/serviços; avenças online = evolução futura na mesma grelha).
- O Teglion retém a **taxa de serviço** (application fee, default **2%**).
- O principal vai para a conta Connect do escritório — **não fica em custódia no Teglion**.

### 3.3 Três fluxos (quando Connect está activo)

| Fluxo | Quem paga | Quem recebe | Onde |
|---|---|---|---|
| **A. Plano Teglion** | Escritório | AfDigital / Teglion (SaaS) | Stripe Billing |
| **B. Cliente → escritório (online)** | Cliente final | Conta Connect do escritório | Stripe Checkout |
| **C. Taxa Teglion Connect** | Retida no pagamento B | Plataforma | `STRIPE_CONNECT_PLATFORM_FEE_BPS` |

### 3.4 Nudge (sem forçar)

Na página **Pagamentos** e na ficha **Faturação**, se Connect não estiver pronto:

- Banner informativo: «Pode activar recebimentos online para cobrar avenças automaticamente.»
- CTA suave para Definições → Pagamentos.
- **Nunca** bloquear gerar mapa, editar estados ou ver saldos.

### 3.5 Copy obrigatória

- Taxa Teglion Connect ≠ taxas Stripe ≠ mensalidade do software.
- Sem Connect: «O Teglion regista e organiza os seus pagamentos; o dinheiro trata-o consigo (transferência, MB Way, etc.).»
- Com Connect: principal na conta do escritório; Teglion só retém a % de serviço.

---

## 4. O que já existe vs. ondas

### Já no Teglion (base)

Clientes + perfil fiscal, documentos, obrigações, calendário fiscal (parcial), tarefas, alertas, cofre, portal, booking, Connect, Maya setup, página pública, CSV clientes, mobile web.

### Fora desta branch até decisão legal

Emissão oficial no Portal das Finanças, comunicação ATCUD/e-Fatura como software certificado, DMR/SS Direta automática, Open Banking (PSD2), “substituir TOConline”.

### Ondas de implementação (ordem fixa)

| Onda | Nome | Resultado | Dependências |
|---|---|---|---|
| **0** | Carta + branch | Este documento + branch isolada | — |
| **1** | Avenças & mapa de pagamentos | **Commitada** (`feat(payments): avenças…`). Manual + Connect opcional | Clientes (+ Connect se quiser) |
| **2** | Motor IVA (simulação) | **Commitada** (`feat(fiscal): motor IVA…`). Cêntimos, `PT-IVA-2026.1`, UI `/calculators/iva` | Onda 1 |
| **3** | Calendário × cliente | **Commitada.** Vista «Mês fiscal» N/M em `/app/firm/tasks/month` | Onda 1–2 |
| **4** | Mais simuladores | IRS escalões, retenção, SS, rendas, IMT, IRC, TA — um a um com fonte | Contabilista revisor |
| **5** | Imóveis / rendas (dados) | Contratos, inquilinos, recibos **internos**, sem comunicação AT | — |
| **6** | SAF-T **leitura** | XML/ZIP → totais; sem envio AT | Isolamento + XSD |
| **7** | Manual do utilizador Teglion | `/manual` (público) + link na app; capítulos + capturas reais | Ondas 1–3 estáveis |
| **8** | Landing repaginada | Mais clara e mais forte que ContaCRM+Konta juntos; só features **reais** | Manual + screenshots |
| **9** | Caminho certificação | ADR + requisitos AT + investimento | Decisão jurídica |

**Landing e Manual vêm depois das ondas de produto** (como pediste: “depois disso tudo”), excepto um **esqueleto** do Manual na onda 7 com capítulos do que já existe.

---

## 5. Manual do utilizador (estrutura alvo)

Rota pública sugerida: `https://teglion.com/manual` (e “Voltar ao site”).

Estilo: índice + capítulos longos, linguagem não técnica, capturas **reais do Teglion** (não mockups de concorrentes).

### Capítulos (mapa ContaCRM → Teglion)

| # | Capítulo | Base no Teglion hoje | Novo / ampliar |
|---|---|---|---|
| 01 | Primeiros passos | Auth, MFA, painel | — |
| 02 | Planos e faturação (SaaS) | Billing Stripe | Copy clara SaaS vs Connect |
| 03 | Gerir clientes | Hub + CSV | — |
| 04 | Documentos | Hub documentos | — |
| 05 | Obrigações fiscais | Tasks/obligations + calendário | Vista N/M |
| 06 | Pagamentos e avenças | — | Onda 1 |
| 07 | Tarefas | Gestor de operações | — |
| 08 | Controlo de caixa | — | Onda posterior ou fora se baixo ROI |
| 09 | Alertas | Broadcasts + (futuro IUC/IMI) | Ampliar tipos |
| 10 | Modelos e assinaturas | Orçamento PDF | Assinatura = futuro |
| 11 | Cofre de credenciais | Official accesses | — |
| 12 | Open Banking | Não existe | Enterprise futuro / LEGAL |
| 13 | Assistente (Maya) | Guia + setup | Limites fiscais explícitos |
| 14 | Atas | Não existe | Baixa prioridade |
| 15 | Equipa | Team + RBAC | — |
| 16 | Relatórios | Permissão sem UI | Após avenças |
| 17 | Definições e integrações | Settings, Google, Connect | — |
| 18 | FAQ | Support pages | Expandir |

Perfis Teglion a documentar: `FIRM_OWNER`, `FIRM_STAFF` (e permissões), cliente portal — **não** inventar “Assistente” se não existir role.

---

## 6. Landing (onda 8) — critérios

- Uma composição hero: marca Teglion dominante, uma frase, um CTA, visual real do produto.
- Secções: problema do gabinete → módulos reais → portal cliente → segurança/MFA → preços → prova (escritórios) → FAQ.
- Mostrar Connect com **transparência de taxas** (letras pequenas).
- **Não** listar emissão AT certificada nem Open Banking até existirem.
- Superar ContaCRM/Konta em clareza e honestidade, não em promessas vazias.

---

## 7. Regras de engenharia desta branch

1. Só commits nesta branch; PR → `staging` quando uma onda fechar.
2. Sem push/PR/merge/deploy sem autorização explícita do owner.
3. Sem migrations em prod; staging só com confirmação.
4. Não alterar auth/CORS/cookies/isolamento sem análise de impacto.
5. Reutilizar componentes; não redesenhar o shell.
6. Testes de isolamento `firm_id` em cada tabela nova.
7. Mensagens de commit **sem** menção a Cursor ou cursor.com.
8. UI avenças: estados `draft | confirmed | sent | paid` (não “emitida AT”).

---

## 8. Critério de sucesso da onda 1

- [x] Mensalidade/avença na ficha do cliente (separador Faturação) — código na branch
- [x] Mapa anual cliente × mês com estados e cores (rascunho / confirmada / enviada / paga)
- [x] Gerar em massa por período a partir da avença
- [x] Funciona **sem** Stripe Connect
- [x] Nudge suave para activar Connect (nunca bloqueia)
- [x] Saldos do ano (pago / em aberto / atrasado) no mapa
- [x] Atraso visual (confirmada/enviada com `due_date` passado)
- [x] Texto taxas Teglion vs Stripe quando Connect está em causa
- [x] Mobile utilizável (grelha com scroll horizontal + shell)
- [x] Testes unitários + isolamento `firm_id` (`fee-charges.service.test.js` — 7 pass)
- [ ] UAT com migration aplicada em ambiente confirmado (staging)
- [x] Nenhuma alteração a produção; migration só no repo até autorização

### Modelo de dados (Onda 1)

- `clients.retainer_*` — avença mensal (cêntimos, activa, dia de vencimento 1–28)
- `client_fee_charges` — uma linha por cliente × `YYYY-MM` (estados, método, pago em, notas, source manual|bulk|stripe)

### APIs

- `GET /contabil/fee-charges/map?year=`
- `POST /contabil/fee-charges/generate`
- `PATCH /contabil/fee-charges/:id`
- `GET|PATCH /contabil/clients/:id/billing`

### UI

- Nav: **Pagamentos** (`/app/firm/payments`)
- Hub cliente: secção **Faturação**

---

## 9. Decisões já tomadas pelo owner (25/10/2026)

1. Branch exclusiva: **sim**.
2. Unir ContaCRM + Konta de forma incremental: **sim**.
3. UX simples Teglion: **sim**.
4. Caminho futuro a certificação: **sim** (não nesta onda).
5. Taxa Connect default 2%: **manter**, copy transparente.
6. Manual + landing: **depois** das ondas de produto.
7. Ordem: **avenças primeiro**.
8. **Avenças manuais sem Connect: obrigatório.** Connect é opcional; nudge informativo, sem forçar.

---

## 10. Estado agora

- Onda 1: commitada nesta branch (sem push).
- Onda 2: motor IVA + UI + migration `20261025010000_fiscal_calculations.sql` no repo (SQL já implantado pelo owner em ambiente de trabalho).
- Onda 3: matriz mês fiscal (API + UI); **sem migration nova**.
- Migrations **não** aplicadas a staging/prod sem autorização.
- Push geral para staging: só no fim do pacote de ondas, por pedido explícito.

### Critério Onda 2

- [x] Motor puro testável (10 € → 12,30 € a 23 %)
- [x] Regras versionadas `PT-IVA-2026.1` (fonte documentada; validação contabilista pendente)
- [x] Persistência com `firm_id` + histórico imutável por versão
- [x] UI simples com disclaimer
- [x] Testes unitários
- [ ] UAT staging após migrations

### Critério Onda 3

- [x] Agregação por tipo + data de vencimento → `tratados/total`
- [x] `GET /api/contabil/obligations/month-matrix?yearMonth=AAAA-MM`
- [x] Tab «Mês fiscal» no gestor de tarefas
- [x] Marcar tratado a partir da lista expandida
- [x] Disclaimer: não inventa prazos AT
- [x] Testes unitários do agregador
