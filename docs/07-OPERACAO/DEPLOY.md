# Deploy

Visão geral do processo de publicação. Para os passos detalhados, use [../operations/DEPLOY_PRODUCTION.md](../operations/DEPLOY_PRODUCTION.md) e [../operations/DEPLOY_STAGING.md](../operations/DEPLOY_STAGING.md).

## Onde cada parte roda

Frontend na Vercel, backend no Render, banco e storage no Supabase. Cada um com seu próprio ciclo de deploy — não é um "deploy único" que sobe tudo junto.

## O que já é automático

Todo PR e push para as branches principais roda uma esteira de CI: checagem de tipos e testes do frontend, build do frontend, um scan estático de segurança do backend, varredura de segredo, e um único arquivo de teste do backend. Isso é real e roda sozinho — não depende de alguém lembrar de rodar manualmente.

## O que não é automático ainda, e por quê isso importa

A suíte completa de testes de backend e o teste de isolamento entre escritórios não fazem parte dessa esteira (ver [SECURITY-GATES.md](../06-SEGURANCA/SECURITY-GATES.md)). Isso significa que hoje é possível publicar uma mudança em produção sem nenhuma verificação automatizada do risco mais caro do produto.

Isso ficou mais concreto do que uma preocupação abstrata durante a própria auditoria de 12/08/2026: um merge direto para a branch principal aconteceu durante essa sessão, sem revisão de pull request visível neste repositório. Não há evidência de má intenção nisso — mas é exatamente o tipo de caminho que, combinado com a ausência de gate automatizado de isolamento, poderia deixar passar uma regressão séria sem ninguém perceber antes de chegar em produção.

**Recomendação, documentada aqui, não implementada**: proteção de branch na branch principal (exigir PR e checagem de CI passando antes de merge), e os dois testes citados acima entrando na esteira obrigatória — ambos já listados no [Sprint 0](../02-ROADMAP/SPRINT-0.md).

## Rollback

Frontend: reverter para o deploy anterior na Vercel é uma operação de poucos cliques. Backend: redeploy do último commit saudável no Render. Migração de banco não tem processo de rollback automatizado documentado — reforça a importância do item de backup/restore testado, coberto em [DISASTER-RECOVERY.md](../06-SEGURANCA/DISASTER-RECOVERY.md).
