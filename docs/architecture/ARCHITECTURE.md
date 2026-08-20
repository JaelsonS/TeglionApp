# Arquitetura

> Fontes consolidadas: `docs/04-ARQUITETURA/ARCHITECTURE.md`, `BACKEND.md`, `FRONTEND.md`, `MULTI-TENANCY.md`, `STORAGE.md` (removidos após esta migração).

## Visão geral

Construí o Teglion como um monólito modular: um backend Express único, organizado em módulos de domínio, servindo uma aplicação React única. Não é microsserviços — foi decisão minha, consciente, não limitação. Com o tamanho de time e de produto que tenho hoje (4 escritórios pilotos), separar em serviços distintos criaria custo de coordenação sem benefício real. A modularidade que importa agora acontece dentro do próprio backend: cada domínio de negócio (cliente, documento, agendamento, cobrança, integração) vive no próprio módulo, com fronteira clara, mesmo rodando no mesmo processo.

```
Frontend (React SPA, Vercel)  →  Backend (Express API, Render)  →  Supabase (Postgres + Storage)
                                        │
                                        ├── Redis (cache / rate limit / fila)
                                        ├── Brevo (email e SMS)
                                        ├── Stripe + Stripe Connect (pagamento)
                                        └── Google (Calendar / Drive)
```

Separei frontend e backend em deploys distintos, que só se falam por HTTP. Fiz questão de que o frontend nunca acesse o Supabase diretamente — toda leitura e escrita de dado passa pelo backend. Não existe, em nenhum ponto do código do frontend, uma chamada direta ao Supabase; só chamadas à própria API do Teglion, através da camada `infrastructure/` (ver [FRONTEND.md](./FRONTEND.md)).

## Como as camadas se encaixam

Dentro de um módulo de backend, mantive sempre o mesmo caminho:

```
rota → middleware (autenticação / autorização / tenant) → controller → service → repository → Supabase
```

- **Rota** declara o endpoint e encadeia os middlewares aplicáveis.
- **Middleware** resolve quem está fazendo a requisição e se ela pode prosseguir (autenticação, escritório ativo, papel/permissão, CSRF, limitação de taxa). Detalhe em [BACKEND.md](./BACKEND.md).
- **Controller** lida só com a borda HTTP: lê parâmetros, valida forma de entrada, monta a resposta. Não coloquei regra de negócio nele.
- **Service** é onde concentro a regra de negócio do domínio.
- **Repository** é a única camada que sabe como o dado é lido ou gravado no Supabase — não deixo nenhum controller ou service montar consulta ao banco diretamente.

Mantive essa separação consistente em todos os módulos do backend (`backend/src/modules/*`), cada um com o próprio conjunto de rota, controller, service e repository.

## O fluxo de uma requisição, de ponta a ponta

Um exemplo concreto ajuda mais que um diagrama genérico. Um membro de equipe abre a lista de clientes no painel do escritório:

1. **Frontend.** O React SPA (rodando no navegador, servido pela Vercel) dispara uma chamada HTTP para a API do backend — por exemplo, `GET /api/v1/contabil/clients` — através da camada `infrastructure/` do frontend. Não deixei nenhum acesso direto ao Supabase em nenhum ponto do frontend.
2. **Entrada na API.** A requisição chega ao processo Express, hospedado na Render, no prefixo `/api/v1` (ver [API.md](./API.md) para os grupos de rota e o esquema de versionamento).
3. **Autenticação.** `authMiddleware` (`backend/src/middlewares/auth.middleware.js`) lê o cookie `httpOnly` `accessToken`, valida o JWT e monta `req.user` com `firmId`, `clientId` (quando o ator é um cliente), `role` e `permissions`. Esse `firmId` vem exclusivamente do token assinado pelo servidor — nunca de um parâmetro que o cliente da API pudesse manipular.
4. **Contexto de tenant.** Para rotas do módulo contábil, `requireActiveFirm` (`backend/src/middlewares/firm-access.middleware.js`) lê o `firmId` da sessão, busca o registro do escritório e verifica o status (ativo, em teste, suspenso). Se o escritório não estiver em condição de uso, a requisição para aqui — antes de chegar a qualquer controller. Detalhei como garanto o isolamento entre escritórios em [MULTI_TENANCY.md](./MULTI_TENANCY.md).
5. **Autorização por papel/permissão.** Quando a rota exige um papel ou permissão específica (por exemplo, uma ação restrita ao dono do escritório), `role.middleware.js` verifica isso antes do controller.
6. **Controller → service → repository.** O controller chama o service do módulo `client`, que aplica a regra de negócio e delega ao repository. O repository monta a consulta ao Postgres sempre com `firm_id` como filtro explícito, recebido como parâmetro — nunca inferido livremente.
7. **Banco.** A conexão ao Supabase Postgres usa a `service_role` — uma chave que ignora as políticas de Row Level Security (RLS). Isso significa que a proteção de isolamento entre escritórios, nessa consulta, não vem do banco: vem inteiramente da disciplina que mantenho de sempre incluir `firm_id` na camada de repositório. Esse ponto é central o suficiente pra merecer documento próprio — [MULTI_TENANCY.md](./MULTI_TENANCY.md).
8. **Resposta.** O resultado sobe de volta: repository → service → controller → JSON para o frontend. Se algo falhar em qualquer ponto do caminho, passa pelo handler central de erro que montei, que padroniza a resposta e evita vazar detalhe interno sensível (ver [BACKEND.md](./BACKEND.md)).

O mesmo esqueleto vale para escrita (POST/PUT/PATCH/DELETE), com validação de entrada adicional no controller antes de chegar ao service.

## Por que essa decisão de arquitetura, e não outra

Meu backend já concentra autenticação multi-tenant própria, agendadores internos, integração com Brevo, Stripe e Google, e validação específica do domínio contábil. Migrar isso para "só Supabase" (Supabase Auth, funções de borda, RLS como mecanismo primário) exigiria reescrever praticamente tudo isso do zero — mais lento e mais arriscado do que evoluir o que já está funcionando e validado com escritório real.

## Onde aprofundar

- [FRONTEND.md](./FRONTEND.md) — estrutura da aplicação React.
- [BACKEND.md](./BACKEND.md) — organização dos módulos Express, middlewares, jobs e agendadores.
- [DATA_ARCHITECTURE.md](./DATA_ARCHITECTURE.md) — como dado operacional e arquivo se relacionam, e onde cada um vive.
- [MULTI_TENANCY.md](./MULTI_TENANCY.md) — como o isolamento entre escritórios é desenhado estruturalmente.
- [API.md](./API.md) — grupos de rota da API e os princípios de autorização que se aplicam a cada um.
- [INTEGRATIONS.md](./INTEGRATIONS.md) — Google Calendar, Google Drive, Stripe, Stripe Connect e Brevo.
- [INTERNATIONALIZATION.md](./INTERNATIONALIZATION.md) — como configuração por país é modelada.
- `docs/database/DATABASE.md` — schema, migrations, índices.
- [`docs/security/AUTHENTICATION.md`](../security/AUTHENTICATION.md) — mecanismo de autenticação e sessão em detalhe.
- [`docs/security/TENANT_ISOLATION.md`](../security/TENANT_ISOLATION.md) — o veredito de risco sobre o isolamento entre escritórios (o que a auditoria de segurança encontrou, não só o desenho).
