# Observabilidade

> Fonte consolidada: `docs/07-OPERACAO/MONITORING.md` (pasta antiga, removida após esta consolidação). Confirmações adicionais de código citadas explicitamente abaixo, quando iam além do que o documento-fonte afirmava.

## O que existe

**Rastreamento de erro no backend — Sentry.** Integrado com cuidado real: remove informação sensível (cabeçalho de autenticação, cookie, parâmetro de busca) antes de enviar o evento, e marca cada erro com o escritório e o usuário envolvido, o que ajuda a investigar um problema específico relatado por um cliente. Configurado via `SENTRY_DSN` (`backend/src/instrument.js`, `backend/src/config/env.js`).

**Rastreamento de erro no frontend — Sentry também.** Isso não estava documentado no `MONITORING.md` original, mas está confirmado diretamente em `frontend/src/shared/lib/sentry.ts`: DSN via `VITE_SENTRY_DSN`, com `browserTracingIntegration` (amostragem de performance de 10% em build de produção/staging) e `replayIntegration` (sessão gravada só quando há erro, sem gravação de sessões normais). Também faz scrub de query string da URL antes de enviar (`event.request.url` sem `?...`) e ignora erros conhecidos de chunk stale pós-deploy (`Failed to fetch dynamically imported module`). `sendDefaultPii: false` está explícito no código.

Isso significa que existe, sim, uma forma de tracing de performance — mas é tracing de frontend (carregamento de página, navegação), amostrado a 10%, não uma ferramenta de APM do backend.

## A lacuna

A configuração que liga o Sentry no **backend** não é obrigatória para o processo subir — ele inicia normalmente em produção mesmo sem `SENTRY_DSN` definida, com apenas um aviso no log (`env.js`) que ninguém necessariamente vê. Isso significa que é possível estar rodando em produção, hoje, sem nenhum monitoramento de erro de backend ativo, sem que isso seja visível a não ser que alguém confira manualmente o ambiente do Render.

Fora o rastreamento de erro (backend) e o tracing de frontend descrito acima, não existe nenhuma outra ferramenta de monitoramento confirmada: sem painel de métricas de negócio, sem alerta de uptime automático, sem acompanhamento de performance de API no backend (latência de endpoint, taxa de erro agregada, throughput). O que existe são logs brutos do serviço de hospedagem (Render), que exigem alguém procurando ativamente — não um sistema avisando sozinho.

**A validar** (não confirmável só pelo repositório, precisa checagem externa no painel de cada serviço):

- Se `SENTRY_DSN` está de fato definida hoje no ambiente de produção do Render (backend) e no da Vercel (frontend, `VITE_SENTRY_DSN`) — a variável existir no código é uma coisa, estar configurada no provedor é outra.
- Se existe algum Alert Rule configurado no painel do Sentry (email/Slack) para os erros capturados — o código só garante que o erro *chega* ao Sentry quando o DSN existe, não que alguém é avisado ativamente.
- Se o backup diário para R2 realmente reporta falha ao Sentry via `SENTRY_DSN` do Cron Job (`backend/src/backup/run.js` usa a variável, mas isso depende do mesmo "está configurada de verdade" acima).

## Resposta direta à pergunta que importa

**Se um cliente disser "não consegui agendar", conseguimos descobrir o que aconteceu?** Depende diretamente do item "a validar" acima. Se o `SENTRY_DSN` do backend estiver de fato ativo em produção, o erro provavelmente aparece lá, com contexto de escritório e usuário — investigação rápida. Se não estiver, a única forma de investigar é vasculhar log bruto do Render, sabendo aproximadamente quando o problema aconteceu — muito mais lento, e sujeito a não ter registro nenhum se o erro não tiver sido logado explicitamente naquele ponto do código.

## O que não existe hoje (não confundir com "a validar")

Estas capacidades não estão implementadas — não é uma questão de configuração externa faltando, é ausência de funcionalidade:

- Painel de métricas de negócio ou de produto (ex.: quantos agendamentos por dia, taxa de conversão de convite).
- Alerta automático de uptime/disponibilidade (algo como "backend fora do ar há 5 minutos, notificar").
- Tracing de performance de API no backend (latência por endpoint, percentis).
- Dashboard central que junte erro + performance + uptime num único lugar.

## Recomendação (documentada, não implementada)

1. Confirmar hoje, diretamente nos painéis do Render e da Vercel, que `SENTRY_DSN` / `VITE_SENTRY_DSN` estão de fato definidas em produção — isso não dá para verificar só pelo Git.
2. Configurar Alert Rules no Sentry (email ou Slack) para que a ausência de monitoramento nunca dependa de alguém abrir o painel manualmente.
3. Considerar tornar `SENTRY_DSN` obrigatória para o backend subir em produção, para que a ausência de monitoramento nunca seja um estado silencioso possível.
4. Uptime e métricas de API seguem como lacuna real de implementação, não só de configuração — avaliar se compensa antes de crescer a base de escritórios pagantes (ver [`docs/ROADMAP.md`](../ROADMAP.md)).
