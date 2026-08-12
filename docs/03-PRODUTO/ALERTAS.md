# Alertas / Notícias

**Status: IMPLEMENTADO.**

## Dois sistemas, um mais novo que o outro

**Alertas (broadcasts)** é o sistema atual e mais completo: o escritório publica um aviso e escolhe o destinatário — todos os clientes, ou uma lista específica selecionada. Suporta agendamento de publicação e acompanhamento de quem já leu.

**Notícias** é o sistema anterior, mais simples — sempre para todos os clientes do escritório, sem segmentação. Continua funcional e em uso, mas o próprio código já sinaliza a preferência pelo sistema de alertas para publicação nova.

## Uma proteção de isolamento que vale destacar

Além do filtro por escritório em toda consulta, o sistema de alertas tem uma segunda camada específica: quando um alerta é publicado para uma lista selecionada de clientes, o registro de "quem pode ler isso" é criado no momento da publicação, para exatamente aqueles destinatários. Um cliente fora dessa lista não consegue nem marcar aquele alerta como lido — a tentativa é recusada, porque não existe registro de que aquele alerta era destinado a ele. Isso é mais rigoroso do que só filtrar por escritório: mesmo dentro do mesmo escritório, um alerta segmentado fica de fato restrito a quem foi de fato incluído.

## Quem pode publicar

Qualquer membro da equipe com permissão de gestão de cliente pode publicar um alerta ou notícia — não existe hoje um papel separado e mais restrito específico para isso.

## Isolamento entre escritórios

Toda consulta de listagem e leitura é filtrada pelo escritório da sessão de quem está pedindo — nenhum caminho encontrado onde um alerta de um escritório pudesse aparecer para cliente de outro.
