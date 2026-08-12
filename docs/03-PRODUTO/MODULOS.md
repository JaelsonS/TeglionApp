# Módulos do produto

Mapa de todos os módulos, com status verificado na auditoria de 12/08/2026 e link para o detalhe de cada um.

| Módulo | Status | Documento |
|---|---|---|
| Clientes | IMPLEMENTADO | [CLIENTES.md](./CLIENTES.md) |
| Serviços | IMPLEMENTADO | [SERVICOS.md](./SERVICOS.md) |
| Booking / Agendamento | IMPLEMENTADO, com bloqueador de corrida de condição | [BOOKING.md](./BOOKING.md) |
| Captação pública ("IRS") | IMPLEMENTADO como ferramenta de captação | [IRS.md](./IRS.md) |
| Calendário Fiscal | PARCIAL | [CALENDARIO-FISCAL.md](./CALENDARIO-FISCAL.md) |
| Documentos | IMPLEMENTADO | [DOCUMENTOS.md](./DOCUMENTOS.md) |
| Mensagens | IMPLEMENTADO (tempo real é polling, não push) | [MENSAGENS.md](./MENSAGENS.md) |
| Alertas / Notícias | IMPLEMENTADO | [ALERTAS.md](./ALERTAS.md) |
| Página pública | IMPLEMENTADO, alguns pontos não verificados nesta rodada | [PAGINA-PUBLICA.md](./PAGINA-PUBLICA.md) |

Módulos de infraestrutura de negócio — billing, Stripe Connect, entitlements — estão documentados em [05-INTEGRACOES](../05-INTEGRACOES/) e [08-BUSINESS](../08-BUSINESS/), não aqui, porque não são funcionalidade fim para o usuário, são camada de suporte.

## Como esses módulos se relacionam

Cliente é o registro central — documento, mensagem, obrigação, agendamento, tudo se conecta a um cliente. Serviço é o que o escritório publica para ser contratado, seja via booking direto, seja via o fluxo de captação pública mais elaborado (documentado como "IRS", mas genérico para qualquer tipo de serviço). Calendário Fiscal e Documentos são as duas peças que sustentam o trabalho recorrente do escritório depois que o cliente já está cadastrado.
