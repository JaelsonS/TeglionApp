# ADR-0004 — Autenticação própria com JWT em cookie httpOnly, coordenação de refresh entre abas

## Status

Aceito. Decisão já em vigor, documentada retroativamente em 18/08/2026.

## Contexto

O Teglion roda sobre Supabase (ver ADR-0003), que oferece um serviço de Auth pronto. Apesar disso, o Teglion não usa o Supabase Auth diretamente para autenticar usuários de escritório e clientes: existe uma camada de autenticação própria (`backend/src/modules/auth/contabil-auth.service.js`, 752 linhas), com senha armazenada como hash (`password_hash`, verificado via `bcrypt` no mesmo arquivo) diretamente nas tabelas `firm_users` e `clients`, não no sistema de usuários do Supabase Auth.

A sessão é mantida por um JWT de acesso entregue em cookie `httpOnly` (`backend/src/utils/auth-cookies.js`, `httpOnly: true`) e validado em `backend/src/middlewares/auth.middleware.js`. No frontend, várias abas do navegador da mesma pessoa podem estar abertas ao mesmo tempo, e cada uma pode tentar renovar o token de acesso quando ele expira — o que, sem coordenação, causaria corrida entre abas para rotacionar o refresh token.

## Problema

Como autenticar usuários de forma seguindo boas práticas de sessão web (cookie `httpOnly`, não exposto a JavaScript) e como evitar que múltiplas abas da mesma pessoa, cada uma detectando um token expirado, disparem renovações de refresh token em paralelo — o que pode invalidar a sessão de uma das abas, dependendo de como a rotação de refresh token é implementada no backend?

## Decisão

Autenticação própria, com:

- Senha com hash próprio (`bcrypt`) armazenado em `firm_users.password_hash` / `clients.password_hash`, verificado em `contabil-auth.service.js`.
- Sessão via JWT de acesso em cookie `httpOnly` (`auth-cookies.js`), validado em todo request por `auth.middleware.js`, que lê o payload, resolve `firmId`/`clientId` e popula `req.user`.
- Coordenação de refresh entre abas no frontend, em `frontend/src/shared/utils/authRefreshCoordinator.ts` (178 linhas): usa `BroadcastChannel` para comunicação entre abas e um lock em `sessionStorage` (`contabil:auth-refresh-lock`) para garantir que só uma aba por vez execute a renovação do refresh token, evitando rotação dupla.

## Alternativas consideradas

- **Usar o Supabase Auth diretamente**, delegando login, sessão e gestão de usuários à plataforma. Essa era a alternativa natural, dado que o Teglion já usa Supabase para banco, storage e RLS (ver ADR-0003) — mas a decisão foi construir uma camada própria.

O motivo exato dessa escolha não está documentado no código nem em nenhum documento encontrado no repositório. É razoável supor que o motivo tenha sido controle mais fino sobre sessão, cookies, formato do JWT (papéis, `firmId`, `clientId`, permissões embutidas no payload) e possivelmente lockout/tentativas de login (existe uma tabela `auth_login_attempts`, ver `supabase/migrations/20260829000000_auth_login_attempts.sql`) — mas isso é inferência, não confirmação. Se o motivo real for outro, este ADR deveria ser atualizado por quem tomou a decisão original.

## Motivos da decisão

Não confirmados por documentação ou comentário de código explicando o "porquê". Os motivos prováveis (não confirmados) incluem:

- Controle direto sobre o formato da sessão (papel, `firmId`, `clientId`, permissões) sem depender de metadados customizados do Supabase Auth.
- Cookie `httpOnly` reduz superfície de ataque XSS para roubo de token, comparado a manter o token acessível via JavaScript.
- Possível necessidade de lockout de tentativas de login e regras de negócio específicas de autenticação (existência da tabela `auth_login_attempts` é consistente com essa hipótese, mas não prova a motivação original).

## Consequências positivas

- Cookie `httpOnly` é uma prática de segurança sólida contra roubo de token via XSS.
- Coordenação de refresh entre abas evita um bug real e comum em SPAs multi-aba: renovação de token duplicada invalidando a sessão de uma aba.
- Controle total sobre o payload do JWT (papel, `firmId`, `clientId`) sem intermediação de um formato de terceiro.

## Consequências negativas

- Duplicação de responsabilidade: o Teglion mantém sua própria lógica de autenticação e hashing de senha em paralelo a uma plataforma (Supabase) que já oferece isso pronto e mantido — mais código próprio para revisar, testar e manter seguro ao longo do tempo, incluindo qualquer atualização futura de práticas de hashing.
- A motivação original não está documentada, o que dificulta avaliar, hoje, se as razões que levaram a essa escolha ainda se aplicam ou se já poderiam ser revisitadas.

## Riscos

- Qualquer vulnerabilidade em código de autenticação próprio é responsabilidade inteira do Teglion, sem a rede de segurança de um serviço de auth mantido por um fornecedor especializado.
- Se a coordenação entre abas (`BroadcastChannel` + lock em `sessionStorage`) falhar silenciosamente em algum navegador ou modo de navegação (ex.: abas anônimas isolando `sessionStorage` de forma diferente do esperado), o sintoma seria sessões expirando de forma inconsistente entre abas — não há evidência de que isso tenha acontecido, é um risco a observar.

## Impacto futuro

- Se a equipe crescer, vale revisitar explicitamente se autenticação própria continua sendo a escolha certa frente ao custo de mantê-la segura, ou se migrar para Supabase Auth (ou outro provedor de identidade) passa a valer a pena.
- Qualquer mudança nesse mecanismo precisa preservar a coordenação entre abas — removê-la sem substituição reintroduziria o bug de rotação dupla de refresh token.

## Relação com outros ADRs

- Depende de ADR-0003 (Supabase como plataforma): esta decisão é notável precisamente porque contraria o caminho "óbvio" de usar Supabase Auth, já que o Teglion usa Supabase para tudo mais.
- Relaciona-se com ADR-0001: o `firmId` embutido no JWT é o valor que os repositórios usam para filtrar por tenant — a integridade desse valor no token é, portanto, parte da cadeia de confiança do isolamento multi-tenant.
