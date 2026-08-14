# Identidade do produto, marca e responsabilidades jurídicas

**Estado:** decisão oficial (2026-08-14)  
**Âmbito:** todas as fases futuras do Teglion  
**Não substitui** aconselhamento jurídico profissional quando necessário.

## 1. Identidade

| Nome | Papel |
|------|--------|
| AfDigital — Soluções Tecnológicas | Entidade que desenvolve e opera o produto |
| Teglion | Nome comercial / branding do produto SaaS |
| teglion.com | Domínio do produto |

**Teglion NÃO é** empresa, pessoa jurídica, sociedade, operador ou entidade contratual independente.

Arquitetura: `AfDigital — Soluções Tecnológicas → Teglion → teglion.com`

## 2. Comunicação comercial (UI / marketing)

Permitido:

- «Teglion»
- «Teglion · Um produto da AfDigital — Soluções Tecnológicas»
- «O Teglion é um produto da AfDigital — Soluções Tecnológicas.»
- «plataforma de gestão … desenvolvida e operada pela AfDigital — Soluções Tecnológicas»

Proibido:

- «Teglion, Lda.» / «Teglion, S.A.»
- «Teglion é uma empresa / entidade jurídica»

## 3. Documentos jurídicos

Não atribuir personalidade jurídica ao nome «Teglion».

Evitar formulações do tipo:

- «O Teglion atua como Subcontratante.»
- «O Teglion é o Responsável pelo Tratamento / Processador.»
- «A Teglion é uma empresa.»

Quando for necessária identificação jurídica, usar os **dados legais oficiais da AfDigital** — só depois de confirmados.

Sem inventar: razão social, NIF, morada, CAE, DPO, contactos jurídicos, subprocessadores inventados, retenção inventada, SLA inventado.

Lacuna → `LEGAL_DECISION_REQUIRED` (nunca preencher com suposição).

## 4. Responsabilidades (princípio)

A AfDigital **não** é automaticamente responsável por todos os dados, conteúdos e decisões dos escritórios ou dos seus clientes.

Distinguir sempre:

1. O que a AfDigital determina / controla / presta  
2. O que o escritório determina / controla / fornece  
3. O que os utilizadores / titulares fazem  
4. O que fornecedores terceiros prestam  
5. O que cabe a integrações externas  

Princípio: cada parte responde pelo que efetivamente controla, determina e promete.

## 5. RGPD

Não assumir um papel único (Responsável / Subcontratante / etc.) para todos os tratamentos.

Analisar por fluxo (dados, finalidade, meios, acesso, fornecedores, localização).  
Só depois definir o papel. Se insuficiente → `LEGAL_DECISION_REQUIRED`.

Fluxos mínimos a mapear: conta, autenticação, staff, clientes do escritório, documentos, comunicações, agenda, página pública, pedidos, formulários, pagamentos, Stripe, Google Calendar, email, SMS, analytics, cookies, suporte, logs, storage, backups, monitorização de erros, demais fornecedores reais.

## 6. Terceiros e pagamentos

Auditar fornecedores efetivamente usados (Stripe, Supabase, Google, Cloudflare, Vercel, Render, Brevo, Sentry, …) sem inventar factos.

Separar responsabilidades de integração (AfDigital), serviço do fornecedor, e atividade comercial do escritório.

## 7. Superfícies do produto

| Superfície | Conteúdo |
|------------|----------|
| Landing | Quem somos, produto AfDigital, transparência/confiança, contactos, redes, links legais — **sem** matriz jurídica pesada |
| App autenticado | Footer mínimo; detalhe em Definições → Ajuda / Sobre / legais |
| Docs jurídicos | Identificação AfDigital, papéis por tratamento, matriz, subprocessadores, etc. (bloco Legal & Compliance) |

## 8. Estado actual (produto)

- Identidade comercial e contactos públicos: `frontend/src/shared/config/agency.ts`, `brand.ts`, `supportLinks.ts`
- App: Definições → Ajuda e suporte / Sobre o Teglion
- Landing: secção de transparência + footer institucional
- Reescrita dos textos legais: **pendente** (auditoria / `LEGAL_DECISION_REQUIRED` / `LEGAL_REVIEW_REQUIRED` onde aplicável)
