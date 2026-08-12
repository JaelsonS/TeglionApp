# Monitoramento

## O que existe

Rastreamento de erro (Sentry) integrado no backend, implementado com cuidado real: remove informação sensível (cabeçalho de autenticação, cookie, parâmetro de busca) antes de enviar o evento, e marca cada erro com o escritório e o usuário envolvido, o que ajuda a investigar um problema específico relatado por um cliente.

## A lacuna

A configuração que liga esse rastreamento não é obrigatória para o backend subir — o processo inicia normalmente em produção mesmo sem essa configuração definida, com apenas um aviso no log que ninguém necessariamente vê. Isso significa que é possível estar rodando em produção, hoje, sem nenhum monitoramento de erro ativo, sem que isso seja visível a não ser que alguém confira manualmente.

Fora esse rastreamento de erro, não existe nenhuma outra ferramenta de monitoramento — sem painel de métricas, sem alerta de uptime, sem acompanhamento de performance de API. O que existe são logs brutos do serviço de hospedagem, que exigem alguém procurando ativamente, não um sistema avisando sozinho.

## Resposta direta à pergunta que importa

**Se um cliente disser amanhã "não consegui agendar", conseguimos descobrir o que aconteceu?** Só se a configuração do Sentry estiver de fato ativa em produção — o que não é possível confirmar a partir do repositório, é uma configuração externa. Se estiver, o erro provavelmente aparece lá, com contexto de escritório e usuário. Se não estiver, a única forma de investigar é vasculhar log bruto do Render, sabendo aproximadamente quando o problema aconteceu — muito mais lento, e sujeito a não ter registro nenhum se o erro não tiver sido logado explicitamente naquele ponto do código.

## Recomendação (documentada, não implementada)

Confirmar que a configuração do Sentry está de fato definida no ambiente de produção do Render — hoje. Depois disso, considerar tornar essa configuração obrigatória para o backend subir, para que a ausência de monitoramento nunca seja um estado silencioso possível.
