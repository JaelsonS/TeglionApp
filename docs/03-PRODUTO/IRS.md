# IRS (captação pública de serviço)

**Status: IMPLEMENTADO** como ferramenta de captação — **não é** uma calculadora de imposto, e isso precisa ficar claro antes de qualquer outra coisa neste documento, porque o nome do módulo confunde.

## O que "IRS" realmente é

No código, esse fluxo é chamado de forma genérica de captação pública de serviço. "IRS" é um exemplo de serviço que um escritório pode configurar através dele — não é uma funcionalidade fiscal específica embutida no produto. O Teglion não calcula escalão de imposto, não faz retenção, não simula declaração. O que ele faz é organizar todo o processo ao redor de captar, documentar e agendar um serviço desse tipo — e qualquer outro tipo de serviço de captação que o escritório queira publicar segue o mesmo caminho.

## O fluxo completo, verificado em código

Um visitante chega na página pública do escritório (ou de um serviço específico) sem precisar de login. Preenche uma primeira etapa curta (nome, NIF, contato) — isso já cria um registro com um token de acesso próprio, então mesmo que a pessoa abandone o formulário ali, o contato não se perde. Numa segunda etapa, responde às perguntas configuradas para aquele serviço e, se o serviço exigir, escolhe um horário (reaproveitando o mesmo módulo de [Booking](./BOOKING.md)).

A partir daí, o registro vira uma fila de trabalho para a equipe do escritório: ela decide o que efetivamente pedir ao lead (documento específico, resposta a uma pergunta adicional), e cada pedido novo dispara um email para o lead com um link para um mini-portal — protegido por um token de acesso próprio de 32 bytes, com validade de 180 dias que cai para 30 dias depois que o caso é concluído ou cancelado, e revogável manualmente pela equipe se houver suspeita de vazamento do link.

Existe um campo escondido de proteção contra automação (honeypot) — se preenchido, o envio é aceito silenciosamente sem gravar nada, sem revelar ao remetente que foi identificado como automação.

## Ferramentas para a equipe

Lista de todos os casos em andamento, filtrável por status e por etiqueta. Etiquetas podem ser aplicadas manualmente ou automaticamente, com base em regra configurada por resposta do formulário — por exemplo, uma resposta específica podendo etiquetar o caso automaticamente como um tipo de serviço. Histórico auditável de cada mudança de status.

## Segurança

Token de acesso do lead tem entropia adequada (256 bits) e expiração real, não é um identificador previsível. Documento enviado pelo lead passa pela mesma validação de tipo de arquivo que qualquer upload do sistema — ver [DOCUMENTOS.md](./DOCUMENTOS.md). Nenhum vazamento cross-tenant encontrado nesse fluxo — o escritório sempre é resolvido pelo mesmo padrão seguro descrito em [PAGINA-PUBLICA.md](./PAGINA-PUBLICA.md).

## Risco a observar

Se esse serviço específico exigir agendamento, ele herda o bloqueador de corrida de condição descrito em [BOOKING.md](./BOOKING.md) — vale ter isso em mente ao priorizar aquela correção, já que "IRS" tende a ser justamente o tipo de serviço com maior volume de interesse simultâneo (época de entrega de declaração).
