# Testes de segurança — o que roda sozinho e o que ainda depende de mim

> **Fontes que consolidei neste documento:** `docs/06-SEGURANCA/SECURITY-GATES.md`, `docs/security/TEGLION_SECURITY_GATE.md`, `docs/security/BURP_PUBLIC_PORTAL_PLAYBOOK.md`, `docs/security/PUBLIC_SURFACE_AUDIT.md` (arquivos que removi depois desta migração, 19/08/2026). Verificação de código extra que fiz nesta reescrita (19/08/2026): `.github/workflows/ci.yml`, `package.json`, `backend/package.json`.

A distinção mais importante deste documento: existe uma diferença grande entre "o teste existe" e "o teste protege alguma coisa". Um teste que só roda quando eu lembro de digitar o comando não é uma rede de segurança — é um documento com sintaxe de código.

## O que roda sozinho, em todo PR/push — `IMPLEMENTADO`

Confirmei por leitura direta de `.github/workflows/ci.yml`, job `validate`:

| Step | O que faz |
|---|---|
| Frontend typecheck + testes + build | `npm run tsc`, `npm test`, `npm run build` |
| Backend unit tests | `npm run test:backend` (glob `src/**/*.test.js`) — inclui os testes de SEC-H1 descritos em `AUTHORIZATION.md` |
| Backend static security audit | `npm run test:security-static -w backend` — padrões conhecidos de risco no código |
| **Tenant isolation test (staging)** | Roda contra o projeto Supabase de staging real; **fail-closed** se os secrets `STAGING_SUPABASE_URL`/`STAGING_SUPABASE_SERVICE_ROLE_KEY` não estiverem cadastrados — detalhe completo em `TENANT_ISOLATION.md` |
| File size limits | `npm run check:file-sizes` |
| Secret scan | `npm run security:secrets` — detalhe em `DATA_PROTECTION.md` |

Isso é real e roda automaticamente hoje, sem depender de eu lembrar de rodar manualmente.

## O que tenho como checklist, mas depende de execução manual (Burp/HTTP)

Tinha dois playbooks de teste manual nesta pasta antes desta reescrita, cobrindo a superfície pública (portal de clientes, formulários de captação):

**`BURP_PUBLIC_PORTAL_PLAYBOOK.md` (ambiente: staging apenas).** Defini treze casos de teste HTTP — troca de token entre pedidos, `requestId`/`inquiryId`/`firmId`/`tag` de outro escritório injetados no corpo da requisição, upload com MIME/extensão adulterados, arquivo grande demais, conteúdo polyglot, replay de token Turnstile, spam de reply, POST sem Turnstile. Critério de "nunca deve aparecer": dado privado, stack trace, dado de outro escritório, `storageKey`, token interno. **Status que tinha registrado no documento original: `MANUAL / NOT RUN`** — não tenho evidência de que já executei esses 13 casos via Burp real contra staging.

**`PUBLIC_SURFACE_AUDIT.md` (revisão de código, 15/08/2026).** Fiz uma revisão de código (não teste HTTP) da superfície pública do site/portal. Achados que já corrigi nessa PR, segundo o documento-fonte: vazamento de `storageKey` no JSON público (corrigido — exponho só `id`/`alt`/`url`), draft de serviço visível sem publicação (corrigido), telefone sem código de país no formulário público (corrigido), erro 500 no formulário de IRS por formato de chave de criptografia (corrigido). Controles que confirmei por revisão de código: resolução só por slug (sem UUID exposto), Turnstile + honeypot + rate limit nos POSTs públicos, token de 256 bits com expiração no portal de pedidos, DOMPurify em HTML de descrição. **No próprio documento-fonte fui explícito: "não está 100% seguro. Nenhuma superfície pública o está só com code review"** — ou seja, revisão de código aprovada não é o mesmo que teste HTTP real confirmado.

**Status consolidado desta linha de teste: `A VALIDAR` / pendente de execução.** Não tenho evidência, em nenhum documento que encontrei, de que já executei e documentei com resultado os testes HTTP reais (Burp) contra a superfície pública.

## O gate de segurança amplo (`TEGLION_SECURITY_GATE.md`) — snapshot de 15/08/2026, não meu estado atual

Esse documento era uma tabela-mestre de ~50 itens de teste de segurança (categorias OWASP API Top 10, controles de infraestrutura, etc.), com veredito **NO-GO para produção** que registrei em 15/08/2026. A convenção que usei era: 🟢 aprovado com evidência, 🟡 parcial (parte de código/estático já feita, falta HTTP/Burp/externo), 🔴 pendente de ação minha, ⚪ não executado, 🔵 fora de escopo.

**O que era verdade em 15/08/2026, e continua útil como inventário:**

- A maioria dos ~50 itens estava 🟡 — a parte estática/de código (Cursor, na nomenclatura do documento original) fechada, mas dependente de confirmação HTTP real (Burp) ou de uma decisão minha para fechar globalmente.
- `npm audit`: 6 vulnerabilidades, 4 HIGH em dependências — documentei, não corrigi na data do snapshot. **Status atual: `A VALIDAR`** — não rerodei nesta revisão; o número pode ter mudado desde 15/08/2026.
- Secrets: limpo (0 achados). Scan estático: 0 falhas. Isolamento em staging: 24+18 casos PASS (serviço, não HTTP).

**Uma afirmação desse documento que preciso corrigir explicitamente:** o item **P0.03 (Supabase RLS)** afirmava "RLS ON em todas as tabelas public" como veredito da parte de código, citando apenas "0-policy deny-all OK" e avisos de RPC/anon dos advisors do Supabase como ressalva. Essa é uma afirmação mais ampla do que a evidência documentada sustenta: a auditoria mais detalhada de 13/08/2026 (`SECURITY-GATES.md`) só confirma uma matriz nomeada de **4 tabelas críticas** com RLS verificado, mais o módulo de pagamento e o Storage. Não tenho, em nenhum documento-fonte, uma varredura tabela-por-tabela de todo o schema `public` confirmando RLS ligado em cada uma. Trato essa afirmação aqui como `A VALIDAR`, não como fato confirmado — ver `TENANT_ISOLATION.md` pro detalhe completo.

**O que preciso deixar claro sobre a validade deste snapshot hoje:** pelo menos um item que o gate listava como pendente de decisão minha (P0.01, isolamento multi-tenant, e por extensão a infraestrutura de CI que sustenta esse teste) mudou de estado depois de 15/08/2026 — coloquei o teste de isolamento pra rodar automaticamente e fail-closed no CI a partir de 13/08/2026 (ver `TENANT_ISOLATION.md`), o que o próprio gate, na data em que escrevi, ainda tratava como parcialmente pendente. **Não devo ler este documento (`TEGLION_SECURITY_GATE.md` original) como o estado de segurança atual do produto — é um retrato de um momento específico, útil como inventário de categorias testadas, não como veredito vigente.**

## Resumo do que falta, sem inflar nem esconder

| Frente | Estado |
|---|---|
| Testes automatizados (unit, estático, isolamento, secrets) no CI | `IMPLEMENTADO` |
| Teste HTTP real (Burp) contra superfície pública/portal | `NÃO EXECUTADO` (playbook existe, não rodei) |
| Teste E2E de pagamento em Stripe Test Mode | `NÃO EXECUTADO` (segundo o snapshot de 15/08/2026) |
| Varredura de dependências vulneráveis (`npm audit`) corrigida | `A VALIDAR` — havia 4 HIGH documentados, não corrigidos, em 15/08/2026 |
| RLS confirmado em todo o schema `public` | `A VALIDAR` — só 4 tabelas + módulo de pagamento + Storage têm matriz confirmada |
| Pentest externo formal (terceiro, fora da equipe) | `NÃO REALIZADO` — nenhum documento-fonte menciona um pentest externo contratado |

## O que não verifiquei nesta revisão

Não rerodei `npm audit` nem qualquer scanner de dependências durante esta reescrita — o número de vulnerabilidades HIGH que cito é o do snapshot de 15/08/2026, pode estar desatualizado para mais ou para menos. Não verifiquei se rodei os playbooks de Burp depois de 15/08/2026 e simplesmente não documentei — trato a ausência de registro de resultado aqui como "não executado", que é a leitura mais segura na ausência de evidência, não uma afirmação de que definitivamente nunca aconteceu.
