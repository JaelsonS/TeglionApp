# Setup no plano free — nota histórica

> Fonte: `docs/operations/FREE_PLAN_SETUP.md` (pasta antiga, removida após esta consolidação).

O documento original descrevia um caminho de transição: como fechar proteção de branch e isolamento parcial de staging/produção **sem** contratar Supabase e Render separados para staging, enquanto o projeto ainda estava nos planos gratuitos dessas plataformas. Ele rastreava três itens de uma numeração antiga (`F0-01`, `F0-02`, `F0-03`) que não corresponde à numeração atual do [Sprint 0](../../historico/SPRINT-0.md).

Esse cenário não se aplica mais. Hoje já existe:

- Branch protection real em `main` (PR obrigatório, status checks obrigatórios, `enforce_admins`) — ver [`../../infrastructure/DEPLOYMENT.md`](../../infrastructure/DEPLOYMENT.md).
- Projeto Supabase de staging **separado** do de produção, com Render e Vercel também separados — não é mais isolamento "parcial mitigado por processo", é isolamento real de infraestrutura. Ver [`../../infrastructure/ENVIRONMENTS.md`](../../infrastructure/ENVIRONMENTS.md) e [`../../infrastructure/DEPLOYMENT.md`](../../infrastructure/DEPLOYMENT.md).
- Secrets de staging e produção como GitHub Environments distintos, incluindo os usados pelo teste de isolamento tenant no CI (ver [`../../infrastructure/CI_CD.md`](../../infrastructure/CI_CD.md)).

Não sobrou conteúdo prático único deste guia que não esteja já coberto pelos documentos acima — arquivado aqui só como referência de que essa etapa de transição existiu e foi superada.
