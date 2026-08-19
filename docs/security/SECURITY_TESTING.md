# Testes de segurança — o que roda sozinho e o que ainda depende de alguém

> **Fontes consolidadas neste documento:** `docs/06-SEGURANCA/SECURITY-GATES.md`, `docs/security/TEGLION_SECURITY_GATE.md`, `docs/security/BURP_PUBLIC_PORTAL_PLAYBOOK.md`, `docs/security/PUBLIC_SURFACE_AUDIT.md` (arquivos removidos após esta migração, 19/08/2026). Verificação de código adicional feita nesta reescrita (19/08/2026): `.github/workflows/ci.yml`, `package.json`, `backend/package.json`.

A distinção mais importante deste documento: existe uma diferença grande entre "o teste existe" e "o teste protege alguma coisa". Um teste que só roda quando alguém lembra de digitar o comando não é uma rede de segurança — é um documento com sintaxe de código.

## O que roda sozinho, em todo PR/push — `IMPLEMENTADO`

Confirmado por leitura direta de `.github/workflows/ci.yml`, job `validate`:

| Step | O que faz |
|---|---|
| Frontend typecheck + testes + build | `npm run tsc`, `npm test`, `npm run build` |
| Backend unit tests | `npm run test:backend` (glob `src/**/*.test.js`) — inclui os testes de SEC-H1 descritos em `AUTHORIZATION.md` |
| Backend static security audit | `npm run test:security-static -w backend` — padrões conhecidos de risco no código |
| **Tenant isolation test (staging)** | Roda contra o projeto Supabase de staging real; **fail-closed** se os secrets `STAGING_SUPABASE_URL`/`STAGING_SUPABASE_SERVICE_ROLE_KEY` não estiverem cadastrados — detalhe completo em `TENANT_ISOLATION.md` |
| File size limits | `npm run check:file-sizes` |
| Secret scan | `npm run security:secrets` — detalhe em `DATA_PROTECTION.md` |

Isso é real e roda automaticamente hoje, sem depender de ninguém lembrar de rodar manualmente.

## O que existe como checklist, mas depende de execução manual (Burp/HTTP)

Dois playbooks de teste manual existiam nesta pasta antes desta reescrita, cobrindo a superfície pública (portal de clientes, formulários de captação):

**`BURP_PUBLIC_PORTAL_PLAYBOOK.md` (ambiente: staging apenas).** Treze casos de teste HTTP definidos — troca de token entre pedidos, `requestId`/`inquiryId`/`firmId`/`tag` de outro escritório injetados no corpo da requisição, upload com MIME/extensão adulterados, arquivo grande demais, conteúdo polyglot, replay de token Turnstile, spam de reply, POST sem Turnstile. Critério de "nunca deve aparecer": dado privado, stack trace, dado de outro escritório, `storageKey`, token interno. **Status registrado no documento original: `MANUAL / NOT RUN`** — não há evidência de que esses 13 casos já foram executados via Burp real contra staging.

**`PUBLIC_SURFACE_AUDIT.md` (revisão de código, 15/08/2026).** Revisão de código (não teste HTTP) da superfície pública do site/portal. Achados já corrigidos nessa PR, segundo o documento-fonte: vazamento de `storageKey` no JSON público (corrigido — expõe só `id`/`alt`/`url`), draft de serviço visível sem publicação (corrigido), telefone sem código de país no formulário público (corrigido), erro 500 no formulário de IRS por formato de chave de criptografia (corrigido). Controles confirmados por revisão de código: resolução só por slug (sem UUID exposto), Turnstile + honeypot + rate limit nos POSTs públicos, token de 256 bits com expiração no portal de pedidos, DOMPurify em HTML de descrição. **O próprio documento-fonte é explícito: "não está 100% seguro. Nenhuma superfície pública o está só com code review"** — ou seja, revisão de código aprovada não é o mesmo que teste HTTP real confirmado.

**Status consolidado desta linha de teste: `A VALIDAR` / pendente de execução.** Não há evidência, em nenhum documento encontrado, de que os testes HTTP reais (Burp) contra a superfície pública já foram executados e documentados com resultado.

## O gate de segurança amplo (`TEGLION_SECURITY_GATE.md`) — snapshot de 15/08/2026, não um estado atual

Esse documento era uma tabela-mestre de ~50 itens de teste de segurança (categorias OWASP API Top 10, controles de infraestrutura, etc.), com veredito **NO-GO para produção** registrado em 15/08/2026. A convenção usada era: 🟢 aprovado com evidência, 🟡 parcial (parte de código/estático já feita, falta HTTP/Burp/externo), 🔴 pendente de ação humana, ⚪ não executado, 🔵 fora de escopo.

**O que era verdade em 15/08/2026, e continua útil como inventário:**

- A maioria dos ~50 itens estava 🟡 — a parte estática/de código (Cursor, na nomenclatura do documento original) fechada, mas dependente de confirmação HTTP real (Burp) ou de uma decisão humana (Jaelson) para fechar globalmente.
- `npm audit`: 6 vulnerabilidades, 4 HIGH em dependências — documentado, não corrigido na data do snapshot. **Status atual: `A VALIDAR`** — não foi rerodado nesta revisão; o número pode ter mudado desde 15/08/2026.
- Secrets: limpo (0 achados). Scan estático: 0 falhas. Isolamento em staging: 24+18 casos PASS (serviço, não HTTP).

**Uma afirmação desse documento que precisa de correção explícita:** o item **P0.03 (Supabase RLS)** afirmava "RLS ON em todas as tabelas public" como veredito da parte de código, citando apenas "0-policy deny-all OK" e avisos de RPC/anon dos advisors do Supabase como ressalva. Essa é uma afirmação mais ampla do que a evidência documentada sustenta: a auditoria mais detalhada de 13/08/2026 (`SECURITY-GATES.md`) só confirma uma matriz nomeada de **4 tabelas críticas** com RLS verificado, mais o módulo de pagamento e o Storage. Não há, em nenhum documento-fonte, uma varredura tabela-por-tabela de todo o schema `public` confirmando RLS ligado em cada uma. Este documento trata essa afirmação como `A VALIDAR`, não como fato confirmado — ver `TENANT_ISOLATION.md` para o detalhe completo.

**O que precisa ficar claro sobre a validade deste snapshot hoje:** pelo menos um item que o gate listava como pendente de decisão humana (P0.01, isolamento multi-tenant, e por extensão a infraestrutura de CI que sustenta esse teste) mudou de estado depois de 15/08/2026 — o teste de isolamento passou a rodar automaticamente e fail-closed no CI a partir de 13/08/2026 (ver `TENANT_ISOLATION.md`), o que o próprio gate, na data em que foi escrito, ainda tratava como parcialmente pendente. **Este documento (`TEGLION_SECURITY_GATE.md` original) não deve ser lido como o estado de segurança atual do produto — é um retrato de um momento específico, útil como inventário de categorias testadas, não como veredito vigente.**

## Resumo do que falta, sem inflar nem esconder

| Frente | Estado |
|---|---|
| Testes automatizados (unit, estático, isolamento, secrets) no CI | `IMPLEMENTADO` |
| Teste HTTP real (Burp) contra superfície pública/portal | `NÃO EXECUTADO` (playbook existe, não rodado) |
| Teste E2E de pagamento em Stripe Test Mode | `NÃO EXECUTADO` (segundo o snapshot de 15/08/2026) |
| Varredura de dependências vulneráveis (`npm audit`) corrigida | `A VALIDAR` — havia 4 HIGH documentados, não corrigidos, em 15/08/2026 |
| RLS confirmado em todo o schema `public` | `A VALIDAR` — só 4 tabelas + módulo de pagamento + Storage têm matriz confirmada |
| Pentest externo formal (terceiro, fora da equipe) | `NÃO REALIZADO` — nenhum documento-fonte menciona um pentest externo contratado |

## O que não foi verificado nesta revisão

Não foi rerodado `npm audit` nem qualquer scanner de dependências durante esta reescrita — o número de vulnerabilidades HIGH citado é o do snapshot de 15/08/2026, pode estar desatualizado para mais ou para menos. Não foi verificado se os playbooks de Burp foram executados depois de 15/08/2026 e simplesmente não documentados — a ausência de registro de resultado é tratada aqui como "não executado", que é a leitura mais segura na ausência de evidência, não uma afirmação de que definitivamente nunca aconteceu.
