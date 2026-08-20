# Proteção de dados

> **Fontes que consolidei neste documento:** `docs/06-SEGURANCA/SECURITY.md` (arquivo que removi depois desta migração, 19/08/2026). Verificação de código extra que fiz nesta reescrita (19/08/2026): `backend/src/utils/crypto-fields.js`, `backend/src/utils/crypto-fields.resolve.js`, `backend/src/db/supabase/repositories/client-official-accesses.repository.js`, `backend/src/db/supabase/repositories/google-calendar-connections.repository.js`, `backend/src/config/env.js`, `tools/ci/secret-scan.mjs`, `.gitignore`.

## Dados em repouso

### Criptografia a nível de campo — `IMPLEMENTADO`, escopo limitado

Tenho uma camada de criptografia de campo (`backend/src/utils/crypto-fields.js`), AES-256-GCM, chave vinda de `DATA_ENCRYPTION_KEY` (32 bytes, base64 ou hex). Cada valor cifrado carrega um prefixo de versão (`enc:v1:`), IV aleatório de 12 bytes e authentication tag — formato correto para GCM, não um XOR caseiro.

Onde uso isso hoje, confirmei por leitura de código:

- **Credenciais de portais oficiais do cliente** (`client_official_accesses` — ex.: acesso a Finanças, Segurança Social): cifro a senha antes de ir para o banco (`secret_enc`), nunca gravo em texto plano.
- **Tokens de conexão do Google Calendar** (`firm_google_calendar_connections`): cifro os tokens OAuth em repouso.
- **Dados de pedidos de serviço** (`service_inquiries`/`service_inquiry_requests`): cifro os campos sensíveis do formulário público.

**O que isso não cobre:** minha criptografia é seletiva, campo a campo, não um "banco todo cifrado". A maior parte dos dados (documentos, mensagens, tarefas, dados fiscais estruturados) depende da criptografia de disco gerenciada pelo Supabase/provedor de infraestrutura, não desta camada de aplicação — o que é um modelo comum e razoável, mas é diferente de "todo dado sensível é cifrado duas vezes".

### Criptografia de disco / storage subjacente — `A VALIDAR`

Depende da configuração de infraestrutura do Supabase (Postgres gerenciado) e do bucket de Storage. Não confirmei diretamente nesta rodada de documentação (nem nas anteriores) qual é a configuração exata de criptografia em repouso do provedor — é razoável presumir criptografia de disco padrão de um provedor cloud gerenciado (comum em Postgres/Storage gerenciados), mas não verifiquei isso documento por documento contra o painel do Supabase.

## Dados em trânsito

### HTTPS/TLS — `IMPLEMENTADO`, configuração exata não auditada em profundidade

Todo tráfego de produção e staging passa por HTTPS — sirvo frontend e API atrás de Cloudflare/Render com TLS terminado antes da aplicação. HSTS está presente nos cabeçalhos de resposta (confirmei no health-check de staging numa auditoria anterior).

**O que não verifiquei:** a configuração exata de TLS (versões mínimas, cipher suites, política de renovação de certificado) não passou por uma ferramenta externa dedicada — esse item aparece como pendente ("🌐 EXTERNO") na tabela de gates de segurança que herdei neste projeto (ver `SECURITY_TESTING.md`), sob o rótulo "Infra CF/Render/TLS". Marco como `A VALIDAR`.

## Gestão de segredos e variáveis de ambiente

### Segredos fora do controle de versão — `IMPLEMENTADO`

`.env` e `.env.*` (exceto os arquivos `.example`) estão no `.gitignore` — confirmei (`.gitignore` linhas 12–13). Só versiono `.env.example` e `.env.staging.example` — modelos com placeholders, sem valor real.

### Varredura automática de segredos commitados — `IMPLEMENTADO`

`tools/ci/secret-scan.mjs`, que rodo no CI a cada PR/push (`npm run security:secrets`), varre todos os arquivos rastreados pelo Git procurando padrões de chave real: Stripe live key (`sk_live_`), webhook secret do Stripe, API key da Brevo, client secret OAuth do Google, DSN do Sentry hardcoded, service role key do Supabase, segredo de JWT, URL do Redis com credenciais embutidas. Isso pega o cenário mais comum de vazamento (colar uma chave real num arquivo de código por engano) antes de chegar em produção.

### Rotação de segredos de produção — `CONCLUÍDO (segundo meu registro interno), não reverifiquei de forma independente`

Segundo `docs/historico/SPRINT-0.md` e `docs/ROADMAP.md` (item 0.5), rotacionei as chaves de produção (Stripe, Supabase, JWT, Brevo, Google, Redis) em 13/08/2026, depois de terem ficado em texto plano em arquivos locais não versionados, lidos por várias sessões de auditoria. Já recomendo no `ROADMAP.md` uma verificação independente periódica — repito essa recomendação aqui, sem reverificar por conta própria agora.

### Trilha de auditoria para operações sensíveis — `IMPLEMENTADO`, com redação parcial de log

Tenho um serviço de auditoria de segurança (`backend/src/services/audit/security-audit.service.js`) que registra eventos como login bem-sucedido/falho, conta bloqueada, reset de senha, acesso a documento, mutação de equipe (inclui as tentativas de escalação de SEC-H1), mutação de cliente/obrigação/configurações — com IP e user agent do ator. A função `sanitizeMetadata` redige, antes de gravar, campos como `password`, `token`, `refreshToken`, `secret`, `nif`/`taxId`. Essa redação cobre o que passa por este serviço especificamente — não é a mesma coisa que todo log da aplicação estar sanitizado (ver a ressalva em `SECURITY.md` sobre sanitização de log inconsistente fora deste serviço).

## A lacuna real: LGPD/GDPR — `NÃO IMPLEMENTADO`

Não tenho hoje, em nenhum lugar do backend que verifiquei, uma rota ou serviço para:

- **Exportação de dados pessoais** a pedido do titular (portabilidade) — não tenho endpoint, não tenho job, não tenho mecanismo manual documentado.
- **Apagamento efetivo de dados pessoais** — o que tenho é arquivamento/soft-delete (marcar registro como inativo/removido, mantendo o dado no banco), não uma exclusão real que remova a informação.

Isso é uma lacuna real, não uma hipótese: nenhuma busca por termos como "exportar dados", "LGPD", "GDPR" ou "direito ao esquecimento" no código do backend me retornou qualquer implementação (verifiquei isso nesta revisão, 19/08/2026). Para um SaaS que hoje atende escritórios em Portugal (GDPR aplicável) e que pretendo expandir para o Brasil (LGPD aplicável — ver `docs/ROADMAP.md`, Fase 4), isso é um requisito legal real, não apenas uma boa prática — e hoje não cubro isso. Isso não foi escopo de nenhuma auditoria de segurança anterior que encontrei; nenhum documento-fonte afirmava o contrário.

## O que não verifiquei nesta revisão

Não encontrei documento dedicado a política de retenção de dados (por quanto tempo mantenho um dado de cliente depois de encerrado o contrato com o escritório). Configuração de backup do bucket de Storage (separada do backup do banco) — ver `database/BACKUPS.md` pro que já confirmei ali.
