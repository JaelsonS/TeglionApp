# Arquitetura

## Visão geral

O Teglion é um monólito modular: um único backend Express, organizado em módulos de domínio, servindo uma única aplicação React. Não é microserviços, e essa é uma decisão consciente, não uma limitação — com o tamanho de time e de produto de hoje, dividir em serviços separados criaria custo de coordenação sem benefício real. A modularidade que importa hoje é dentro do próprio backend: cada domínio de negócio (clientes, documentos, agendamento, cobrança, integrações) vive em seu próprio módulo, com fronteira clara, mesmo rodando no mesmo processo.

```
Frontend (React SPA)  →  Backend (Express API)  →  Supabase (Postgres + Storage)
                              │
                              ├── Redis (cache / rate limit)
                              ├── Brevo (email)
                              ├── Stripe (pagamento)
                              └── Google (Calendar / Drive)
```

Frontend e backend são deploys separados — Vercel para o frontend, Render para o backend — comunicando só por API HTTP. O frontend nunca fala diretamente com o Supabase; toda leitura e escrita de dado passa pelo backend. Isso é verificável: não existe, em nenhum lugar do frontend, uma chamada direta ao Supabase — só chamadas à própria API do Teglion.

## Como uma requisição típica flui

`rota → middleware de autenticação/autorização → controller → service → repository → Supabase`

O controller lida com a requisição HTTP (parâmetros, validação de entrada, resposta). O service concentra a regra de negócio. O repository é a única camada que sabe como o dado é armazenado no Supabase — nenhuma outra camada monta consulta ao banco diretamente. Essa separação existe de forma consistente nos módulos verificados na auditoria de 12/08/2026.

## Por que essa decisão de arquitetura, e não outra

O backend já concentra autenticação multi-tenant própria, agendadores internos (schedulers), integração com Brevo, Stripe e Google, e validações específicas do domínio contábil. Migrar isso para "só Supabase" (usando Supabase Auth, funções de borda, etc.) exigiria reescrever praticamente tudo isso do zero — mais lento e mais arriscado do que evoluir o que já está funcionando e validado com cliente real.

## Onde aprofundar

- [FRONTEND.md](./FRONTEND.md) — estrutura da aplicação React.
- [BACKEND.md](./BACKEND.md) — organização dos módulos Express, middlewares, jobs.
- [DATABASE.md](./DATABASE.md) — schema, migrations, índices.
- [MULTI-TENANCY.md](./MULTI-TENANCY.md) — como o isolamento entre escritórios é desenhado estruturalmente (o veredito de risco sobre isso está em [06-SEGURANCA](../06-SEGURANCA/MULTI-TENANT-SECURITY.md)).
- [AUTH.md](./AUTH.md) — autenticação e sessão.
- [STORAGE.md](./STORAGE.md) — armazenamento de arquivo.
