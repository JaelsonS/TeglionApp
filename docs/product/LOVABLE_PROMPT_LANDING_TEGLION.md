# Prompt Lovable — Landing comercial Teglion (página completa)

Cola este prompt **inteiro** no Lovable. O objectivo é uma landing **de conversão** que venda o **produto real** do Teglion (o que o menu do gabinete já tem), não um SaaS genérico de “gestão”.

---

## Papel

És um director criativo + copywriter senior de SaaS B2B para o mercado português (gabinetes de contabilidade). Gera uma **landing page completa, responsiva (mobile / tablet / desktop)**, visualmente premium, persuasiva e honesta. Entrega HTML/CSS/React (ou o stack default do Lovable) pronto a publicar como página de marketing.

---

## Identidade de produto (obrigatório — não inventar)

| | |
|--|--|
| **Produto** | **Teglion** — SaaS multi-tenant para gabinetes de contabilidade em Portugal |
| **Operador** | **AfDigital — Soluções Tecnológicas** (entidade que desenvolve e opera) |
| **Domínio** | teglion.com |
| **Arquitectura de marca** | AfDigital → Teglion → teglion.com |
| **Público** | Sócios / managers de gabinetes de contabilidade em PT (não “empresas genéricas”) |

**Comunicação UI:** «Teglion» ou «Teglion · Um produto da AfDigital — Soluções Tecnológicas».

**Jurídico — NÃO inventar:** NIF, morada, razão social inventada, DPO, CAE, claims de “certificado AT”, “substitui Portal das Finanças”, “emissão oficial”, “garantia fiscal”. Sem overclaim. Se faltar dado legal, omitir ou usar formulação genérica (“operado pela AfDigital — Soluções Tecnológicas”).

---

## Proposta de valor (uma frase)

**Gabinete, portal do cliente e página pública — a mesma operação.** Documentos, prazos, serviços, IRS, agenda, carteira e comunicação no mesmo sistema. A equipa trabalha no painel; o cliente entrega no portal; a oferta vive no site público do gabinete.

---

## O que o Teglion JÁ inclui (vender isto — menu real)

Usa estes módulos como verdade de produto. Agrupa visualmente se quiseres, mas **não omitas** o potencial:

### Hoje
- **Painel** — prioridades do dia, KPIs, atalhos

### Clientes e carteira
- **Clientes** — carteira, NIF, regime, hub por cliente, convites ao portal
- **Pagamentos (carteira)** — matriz de avenças ano×cliente *(≠ Stripe Connect ≠ plano SaaS)*
- **Imóveis e rendas** — imóveis, contratos, recibos
- **SAF-T (consulta)** — importar/ler; **não** emite na AT
- **Obrigações por cliente** — prazos fiscais por empresa

### Trabalho do gabinete
- **Tarefas** — quadro / mês / calendário operativo da equipa
- **Agendamentos** — consultas com clientes (+ Google Calendar opcional)
- **Área IRS** — catálogo (ex. Modelo 3) ligado a solicitações
- **Serviços** — catálogo, leads do site, pedidos in-app
- **Calendário fiscal** — prazos legais *(≠ tarefas ≠ agenda)*
- **Calculadoras** — IVA, IRS, SS, retenção, IMT, IRC — **simulação de apoio**, não declaração oficial

### Comunicar
- **Documentos** — pedidos formais → ficheiros → validação → histórico
- **Mensagens** — chat gabinete↔cliente
- **Alertas** — comunicados urgentes no portal
- **Blog / Notícias** — conteúdo editorial *(≠ alertas)*

### Conta
- **Plano Teglion** — trial / checkout / portal Stripe (billing SaaS)
- **Definições** — identidade, **página pública** (editor completo), Stripe Connect (receber dos clientes), equipa, MFA, etc.

### Três espaços, um sistema
1. **Painel do gabinete** (equipa)
2. **Portal do cliente** (browser, sem app a instalar)
3. **Página pública** (site com a marca do gabinete: serviços, marcação, captação)

---

## Disambiguação (copy obrigatória — nunca confundir)

| Conceito A | Conceito B | Conceito C |
|------------|------------|------------|
| Pagamentos **carteira** (avenças dos clientes) | **Stripe Connect** em Definições (receber) | **Plano Teglion** (SaaS AfDigital) |
| Calendário **fiscal** (legal) | Tarefas / calendário **ops** | **Agendamentos** (consultas) |
| SAF-T **consulta** | *(não existe)* emissão AT | — |
| **Calculadoras** (simulação) | Declaração oficial | — |
| **Alertas** (urgência) | **Notícias** (editorial) | — |

---

## Preços (números reais — não inventar outros)

- **14 dias grátis**, sem cartão no registo, **produto completo** (não trial “limitado”)
- Depois: **35,00 € / mês** por gabinete **ou** **359,88 € / ano** (equiv. **29,99 € / mês** — ~2 meses grátis)
- Sem fidelização; cancela quando quiser
- IVA à parte se aplicável
- Equipa / utilizadores: ilimitados no modelo actual de venda
- Um plano = todo o sistema (não vender “Basic / Pro / Enterprise” inventados)

**Argumento de preço:** um só SaaS em vez de site + portal + pastas + calendários + cobranças + chat espalhados.

---

## Tom e persuasão

- Português de Portugal (gabinete, não “escritório” como marca; “cliente” = cliente do gabinete)
- Confiante, directo, premium — **não** startup hipster, **não** “AI will replace your accountant”
- Vende **tempo recuperado**, **rasto documental**, **cliente que sabe o que falta**, **oferta pública ligada à operação**
- Prova social genérica OK (“gabinetes em Portugal”) — **não** inventar nomes de clientes reais, números de facturação, “#1 em Portugal”, prémios falsos
- CTAs claros: **Testar 14 dias grátis** / **Começar o teste gratuito**
- Secundário: Ver o produto / Ver preços / FAQ

---

## Estrutura da página (secções — ordem sugerida)

1. **Header sticky** — logo Teglion, âncoras (Produto, Como funciona, Preços, FAQ), Entrar, CTA «Testar 14 dias»
2. **Hero (primeiro viewport = UMA composição)**  
   - Brand Teglion como sinal hero (não só texto de nav)  
   - 1 headline + 1 frase de apoio + 1 grupo de CTAs  
   - 1 visual dominante full-bleed / edge-to-edge (mock do painel OU composição gabinete+portal+site)  
   - **Sem** cards no hero, **sem** stats inventados, **sem** badges flutuantes, **sem** grelha de features no primeiro ecrã  
   - Trust line: Sem cartão · Sem fidelização · Cancela quando quiser
3. **Prova / produto** — três pilares: Painel · Portal · Página pública (com espaço para screenshots reais)
4. **Dor** — 3 dores do gabinete PT (WhatsApp/email caótico; cliente sem sítio; cobranças à parte) → alívio Teglion
5. **O que já inclui** — grelha alinhada ao menu real (agrupar por “Clientes e carteira / Trabalho / Comunicar”)
6. **Como funciona** — 3 passos: cria gabinete → configura oferta/site → opera e cobra
7. **Preços** —  
   - Headline: «Um plano. Todo o sistema do gabinete.»  
   - **Value stack** visível (lista do potencial) **antes** dos 3 cards Trial / Mensal / Anual  
   - Cards com features densas e honestas  
   - Nota: trial = produto completo
8. **FAQ** — o que é; para quem; preço; o que inclui; pagamentos do cliente; mobile/PWA; cancelar; suporte PT
9. **CTA final** — bloco navy forte
10. **Footer** — Teglion · produto AfDigital — Soluções Tecnológicas; links Termos, Privacidade, Cookies; contacto genérico se necessário (sem inventar morada/NIF)

Opcional: Maya (assistente) como menção ligeira — **não** transformar a landing numa página de chatbot.

---

## Direcção visual (design system comercial)

```
--navy: #0B3A6E
--navy-deep: #061428
--gold: #C9932E
--surface: #F4F7FB
--body: #334155
--muted: #64748B
--ice: #E8F0F7
--font: 'Plus Jakarta Sans' (ou equivalente sans expressivo — NÃO Inter/Roboto/Arial default)
```

- Atmosfera: navy + gelo + gold; gradientes subtis / pattern de grelha no hero — **não** purple-on-white, **não** cream+terracotta serif, **não** dark-mode genérico com glow
- Tipografia expressiva; hierarquia clara
- Botão primário: navy (no hero pode ser gold sobre navy)
- Cards: só onde há interação ou lista de valor — **não** cardificar o hero
- Motion: 2–3 animações intencionais (fade/slide ao scroll) — sem noise
- Screenshots: moldura 16:10, `object-fit: cover`, topo alinhado; placeholders com labels «Painel» / «Portal» / «Página pública» se não houver assets
- Mobile-first: CTAs full-width no telemóvel; grelhas 1→2→3 colunas; sem overflow horizontal

### Regras duras de composição
- Primeiro viewport = uma composição (não dashboard de marketing)
- Brand test: se tirar a nav, ainda se percebe que é Teglion
- Uma job por secção: 1 headline + 1 apoio curto
- Sem overlays tipo sticker/badge no hero media

---

## SEO / meta

- Title: `Teglion | Software para gabinetes de contabilidade`
- Description: painel + portal + página pública; documentos, prazos, serviços, pagamentos; 14 dias grátis sem cartão
- Lang: `pt-PT`
- Âncoras: `#produto` `#funcionalidades` `#como-funciona` `#precos` `#faq`

---

## Rotas / CTAs (comportamento)

- Registo: `/auth/firm/register` (ou botão “Começar teste” que aponta para esse path)
- Login: `/auth/login`
- Legais: `/termos` `/privacidade` `/cookies`
- Preços públicos: `/pricing` (opcional link)

---

## Checklist de qualidade antes de entregar

- [ ] Vende o sistema **completo** (não 4 features genéricas)
- [ ] Trial = produto completo, sem cartão
- [ ] Preços exactos (35 €/mês · 359,88 €/ano · 29,99 €/mês equiv.)
- [ ] Zero claims AT / emissão oficial / “substitui contabilista”
- [ ] Disambiguação carteira vs Connect vs Plano SaaS na copy de preços ou FAQ
- [ ] Desktop + tablet + mobile impecáveis
- [ ] Hero limpo (brand + headline + apoio + CTAs + 1 visual)
- [ ] Footer com AfDigital — Soluções Tecnológicas (sem personalidade jurídica inventada para “Teglion”)

---

## Entrega pedida ao Lovable

1. Página única completa (landing) com as secções acima  
2. Componentes reutilizáveis (Header, Hero, ValueStack, Pricing, FAQ, Footer)  
3. CSS com variáveis da marca  
4. Comentários curtos no código onde houver placeholders de screenshot  
5. Texto **todo em português de Portugal**  
6. Versão “pronta a handoff” para um frontend React (Vite) se possível  

**Começa agora.** Não peças confirmações — gera a página completa com copy final, não lorem ipsum.
