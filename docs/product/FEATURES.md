# Inventário de funcionalidades

> Este documento consolida conteúdo antes espalhado em `docs/03-PRODUTO/MODULOS.md`, `docs/03-PRODUTO/ALERTAS.md`, `docs/03-PRODUTO/BOOKING.md`, `docs/03-PRODUTO/CALENDARIO-FISCAL.md`, `docs/03-PRODUTO/CLIENTES.md`, `docs/03-PRODUTO/DOCUMENTOS.md`, `docs/03-PRODUTO/IRS.md`, `docs/03-PRODUTO/MENSAGENS.md`, `docs/03-PRODUTO/PAGINA-PUBLICA.md` e `docs/03-PRODUTO/SERVICOS.md` (arquivos removidos nesta reorganização de 19/08/2026). Estado verificado na auditoria de 12/08/2026, salvo indicação em contrário.

Cada módulo listado aqui foi verificado em código, não copiado de intenção antiga. Os estados usados seguem o padrão do restante da documentação técnica: **IMPLEMENTADO**, **PARCIAL**, **EM DESENVOLVIMENTO**, **PLANEJADO**, **NÃO EXISTE**.

| Módulo | Status |
|---|---|
| Clientes | IMPLEMENTADO |
| Serviços | IMPLEMENTADO |
| Booking / Agendamento | IMPLEMENTADO, com um ponto de risco a verificar (ver seção abaixo) |
| Captação pública ("IRS") | IMPLEMENTADO como ferramenta de captação |
| Calendário Fiscal | PARCIAL |
| Documentos | IMPLEMENTADO |
| Mensagens | IMPLEMENTADO (tempo real é polling, não push) |
| Alertas / Notícias | IMPLEMENTADO |
| Página pública | IMPLEMENTADO para o que foi verificado; alguns pontos fora do escopo desta rodada |

Módulos de infraestrutura de negócio — billing, Stripe Connect, entitlements — estão em [BUSINESS_MODEL.md](./BUSINESS_MODEL.md) e em [`docs/architecture/INTEGRATIONS.md`](../architecture/INTEGRATIONS.md), não aqui, porque não são funcionalidade fim para o usuário, são camada de suporte.

## Clientes — IMPLEMENTADO

O registro central do produto: praticamente todo outro módulo (documento, mensagem, obrigação, agendamento) se conecta a um cliente. Cliente pode ser empresa ou particular, tratado como diferença real de dado, não rótulo cosmético — campo fiscal como regime de IVA só aparece e é exigido para empresa, porque particular não tem IVA.

O escritório cadastra o cliente com identificação fiscal (NIF), contato e dado específico do tipo (CAE e regime de IVA para empresa; regime de IRS para ambos), atribui o cliente a um membro da equipe, ativa ou desativa sem apagar histórico, e acompanha na ficha do cliente a atividade recente ligada a ele — documento, mensagem, obrigação, tarefa — com capacidade de ocultar eventos do feed principal sem perder o rastro.

O acesso ao portal é rastreado separadamente do cadastro em si, e o vínculo entre cliente e conta de portal precisa estar aprovado antes de qualquer operação sensível (como download de documento) ser permitida — o que deixa o escritório cadastrar um cliente antes mesmo dele ter acesso próprio ao sistema.

Toda operação de cliente é filtrada por escritório na camada de repositório, verificado na auditoria de 12/08/2026 como consistente, sem exceção encontrada. Relatório e exportação de dado de cliente em lote não foram escopo dessa auditoria — não presumir que existe ou não existe sem confirmar em código.

## Documentos — IMPLEMENTADO

Um dos módulos mais bem protegidos do sistema, verificado com detalhe na auditoria de 12/08/2026.

Cliente ou escritório sobe um arquivo — categorizado (fatura, extrato bancário, recibo, contrato, declaração, comprovante, entre outros), com período de referência e observação opcional, podendo estar vinculado a um pedido específico, a uma obrigação ou a uma tarefa. O escritório aprova, rejeita com motivo, ou pede reenvio, com histórico auditável de cada mudança. Pedido de documento tem ciclo de vida próprio: criado pelo escritório, marcado como visto pelo cliente, respondido com o arquivo, concluído.

A validação de upload não confia só na extensão declarada — o conteúdo binário do arquivo é verificado contra a assinatura real do formato antes de aceitar, o que impede um arquivo malicioso disfarçado de inofensivo.

O isolamento entre escritórios roda em três camadas independentes: filtro obrigatório por escritório (e por vínculo aprovado, quando é um cliente pedindo) na aplicação; caminho de armazenamento que já embute o identificador do escritório e do cliente, tornando-o não adivinhável; e política de segurança no próprio armazenamento (Supabase Storage), avaliada de fato no tráfego real — diferente da proteção equivalente no banco relacional, que não se aplica ao tráfego real do backend. Download nunca expõe uma URL direta assinada ao navegador do usuário — o backend baixa o arquivo e devolve o conteúdo, mantendo controle total a cada requisição. A única exceção verificada é o download de documento entregue pelo mini-portal de captação pública (ver seção de Captação pública abaixo), que usa uma URL assinada direta — ainda restrita à equipe do escritório certo, mas um padrão diferente do resto, que vale unificar por consistência.

## Calendário Fiscal — PARCIAL

Antes de qualquer outra coisa: "Calendário Fiscal" e "Obrigações" são dois sistemas diferentes no produto, apesar de tratarem de assunto parecido — isso confundiu até a documentação anterior a este marco.

**Calendário Fiscal** guarda prazos genéricos do escritório ("entrega de IVA trimestral", "IES") sem vínculo a um cliente específico — é a referência de "o que vence quando", não o rastreamento de "o cliente X já entregou o documento para isso". O modelo de dado é sólido: recorrência (semanal, mensal, trimestral, anual) é calculada dinamicamente a cada consulta, não pré-gerada e armazenada, o que evita inconsistência entre a regra e as ocorrências mostradas. Editar uma ocorrência específica de um evento recorrente (adiar só uma vez, sem mudar a série inteira) é suportado corretamente, no mesmo padrão de calendários como o do Google. Existe um calendário nacional de referência para Portugal, já carregado, que o escritório pode importar sem montar do zero.

**Obrigações** é o outro sistema, onde o rastreamento por cliente realmente acontece: cada obrigação pertence a um cliente específico, tem status de andamento (aguardando cliente, em atraso, concluída), e é isso que dispara o lembrete automático por mensagem interna, email e SMS.

Dois gaps conhecidos ficam pendentes: o lembrete configurável do Calendário Fiscal existe só como tabela vazia no banco — a estrutura para configurar quantos dias antes avisar e por qual canal existe, mas nada no sistema lê ou escreve nela; quem realmente envia lembrete hoje é o sistema de Obrigações, não o Calendário Fiscal. E a geração automática da próxima obrigação recorrente está pela metade: o backend sabe gerar a próxima ocorrência a partir de uma regra configurada e o endpoint funciona se chamado, mas o frontend nunca chama esse endpoint — a equipe cria a regra de recorrência pela tela, mas não existe botão nem processo automático que gere a próxima obrigação a partir dela.

O comportamento por país já é resolvido através de configuração central, não regra fixa no código — Portugal está completo, e já existe um registro para o Brasil, com o próprio sistema assumindo explicitamente que o conteúdo fiscal brasileiro "está em preparação" em vez de fingir que já existe.

## Mensagens — IMPLEMENTADO

Conversa entre escritório e cliente, vinculada ao cadastro do cliente — sempre parte do histórico daquele relacionamento, nunca uma mensagem solta. Suporta anexo, reaproveitando a mesma validação de Documentos.

O "tempo real" aqui, na prática, é quase tempo real, não push verdadeiro: o mecanismo é uma verificação periódica consolidada a cada dois minutos, mais uma verificação extra quando a pessoa volta a focar a aba do navegador. É um desenho consciente e razoável — um único agendador por sessão, não um por componente de tela, o que evita sobrecarregar o backend conforme mais gente usa o produto ao mesmo tempo — mas significa que, numa demonstração ao vivo, pode haver alguns instantes de atraso entre enviar uma mensagem de um lado e ela aparecer do outro.

Um cliente nunca informa de quem é a conversa que quer ver — o sistema deriva isso da própria sessão, então não existe caminho para pedir a conversa de outro cliente por engano ou de propósito. Do lado do escritório, toda operação exige o escritório da sessão combinado com a validação de que aquele cliente pertence a ele. Um ponto pequeno, não crítico: não existe trava explícita no backend contra o mesmo clique duplo criar duas mensagens idênticas — hoje isso é evitado no frontend (botão de enviar desabilitado durante o envio), o que cobre o caso comum, mas não é garantia de nível de banco de dados.

## Serviços — IMPLEMENTADO

O catálogo do que o escritório oferece: cada serviço tem nome, descrição, preço, e pode ser marcado como publicável na página pública. É a peça que conecta a operação interna (o que o escritório faz) com a captação externa (como um cliente novo descobre e contrata isso).

Por serviço, dá para configurar se exige agendamento (conectando com Booking) ou não; se exige pagamento no ato, caso em que o agendamento fica condicionado a um checkout via Stripe Connect antes de ser confirmado, com a reserva expirando automaticamente se o pagamento não se completar em meia hora; e um formulário de captação específico, com pergunta condicional, checklist de documento sugerido e regra de etiquetagem automática do lead conforme a resposta.

Nada disso é fixo para um único tipo de serviço — a prova concreta é que o fluxo hoje rotulado "IRS" não é um caso especial de código, é um serviço configurado através desse mesmo modelo genérico. Serviço é sempre resolvido a partir do escritório identificado pelo endereço da página pública, nunca por um identificador vindo direto do cliente.

## Booking / Agendamento — IMPLEMENTADO, com um ponto de risco a verificar

O motor de disponibilidade combina o horário geral do escritório com uma configuração própria opcional por serviço (que pode restringir dias e intervalos, ou herdar tudo do horário geral quando não definida), calcula os horários possíveis a partir da duração real da consulta (diferente do passo de grade entre horários de início possíveis), e sincroniza com um calendário de staff do escritório no Google Calendar — lê horário ocupado, escreve o evento confirmado. Não é um sistema de disponibilidade individual por contador: é um recurso compartilhado da agenda do escritório.

O fluxo público: a página pública do escritório leva ao serviço, o backend gera os horários disponíveis, o cliente escolhe um horário, entra uma reserva temporária (se o serviço começa pelo calendário) e/ou checkout Stripe Connect (se o pagamento é obrigatório), a consulta fica agendada ou pendente de pagamento, e o evento aparece no Google Calendar de quem atende. O frontend público só agrupa e apresenta os horários que o backend devolve — não recalcula disponibilidade por conta própria.

O banco de dados tem restrições de exclusão desenhadas para impedir duas reservas ativas no mesmo recurso e horário — tanto para consultas confirmadas/pendentes de pagamento quanto para reservas temporárias — convertendo uma violação em erro HTTP 409 nos pontos de criação de agendamento (booking direto, checkout Stripe Connect, reunião manual pela agenda do escritório). Cancelamento hoje só acontece pelo lado do escritório; não há autocancelamento nem reagendamento pelo cliente na página pública.

**Nota importante de rastreabilidade:** a documentação de origem deste módulo descreve tanto uma proteção de banco de dados já em produção contra agendamento duplicado quanto, em outros pontos (inclusive na tabela de módulos e no módulo de captação pública), trata isso como um risco/corrida de condição ainda pendente de correção. `docs/ROADMAP.md`, item 1.6, registra essa mesma contradição diretamente: o documento de origem do Booking descrevia a race condition como ainda não corrigida, enquanto o registro de Sprint 0 marca esse item como resolvido (constraint aplicada em staging e produção) — e sinaliza que um dos dois está errado, com verificação direta em código ainda pendente antes de corrigir a documentação. Este documento preserva esse alerta em vez de decidir por conta própria qual versão é a correta: **não presumir resolvido nem pendente sem checar `docs/ROADMAP.md` item 1.6 e o código atual antes de comunicar isso a um cliente ou investidor.**

## Captação pública ("IRS") — IMPLEMENTADO como ferramenta de captação

Apesar do nome, não é uma calculadora de imposto. No código, esse fluxo é chamado de forma genérica de captação pública de serviço — "IRS" é um exemplo de serviço que um escritório pode configurar através dele, não uma funcionalidade fiscal embutida no produto. O Teglion não calcula escalão de imposto, não faz retenção, não simula declaração; organiza o processo de captar, documentar e agendar um serviço desse tipo, e qualquer outro tipo de captação que o escritório queira publicar segue o mesmo caminho.

Um visitante chega na página pública sem login, preenche uma primeira etapa curta (nome, NIF, contato) que já cria um registro com token de acesso próprio — então mesmo que a pessoa abandone o formulário, o contato não se perde. Numa segunda etapa, responde às perguntas configuradas para aquele serviço e, se exigir, escolhe um horário (reaproveitando o Booking). Daí em diante o registro vira uma fila de trabalho para a equipe, que decide o que pedir ao lead; cada pedido novo dispara um email com link para um mini-portal protegido por token de acesso próprio de 32 bytes, com validade de 180 dias que cai para 30 dias depois que o caso é concluído ou cancelado, revogável manualmente pela equipe se houver suspeita de vazamento do link. Existe um campo escondido de proteção contra automação (honeypot): se preenchido, o envio é aceito silenciosamente sem gravar nada.

A equipe tem lista de todos os casos em andamento, filtrável por status e etiqueta, com etiquetagem manual ou automática por regra configurada, e histórico auditável de cada mudança de status. Token do lead tem entropia adequada (256 bits) e expiração real, não é identificador previsível; documento enviado pelo lead passa pela mesma validação de upload do restante do sistema.

**Risco herdado do Booking:** se o serviço exigir agendamento, esse fluxo herda o mesmo ponto de risco de corrida de condição descrito na seção de Booking acima — vale ter isso em mente ao priorizar a verificação, já que este é justamente o tipo de serviço com maior volume de interesse simultâneo (época de entrega de declaração). Ver a nota de rastreabilidade acima sobre `docs/ROADMAP.md` item 1.6.

## Alertas / Notícias — IMPLEMENTADO

Dois sistemas coexistem, um mais novo que o outro. **Alertas (broadcasts)** é o sistema atual e mais completo: o escritório publica um aviso e escolhe o destinatário — todos os clientes, ou uma lista específica — com agendamento de publicação e acompanhamento de quem já leu. **Notícias** é o sistema anterior, mais simples, sempre para todos os clientes do escritório, sem segmentação; continua funcional e em uso, mas o próprio código já sinaliza preferência pelo sistema de Alertas para publicação nova.

Além do filtro por escritório em toda consulta, o sistema de Alertas tem uma segunda camada específica: quando um alerta é publicado para uma lista selecionada, o registro de "quem pode ler isso" é criado no momento da publicação, só para aqueles destinatários — um cliente fora da lista não consegue nem marcar aquele alerta como lido, porque não existe registro de que era destinado a ele. Qualquer membro da equipe com permissão de gestão de cliente pode publicar; não existe hoje um papel separado e mais restrito para isso.

## Página pública — IMPLEMENTADO para o que foi verificado

A vitrine pública de cada escritório, identificada por endereço próprio (slug), com marca, cor, serviços publicados e os pontos de entrada para captação e agendamento sem exigir login do visitante.

Toda página pública resolve primeiro qual escritório está sendo servido através do identificador na própria URL — nunca aceita um identificador vindo direto de um parâmetro manipulável. A partir desse escritório resolvido, toda consulta seguinte (serviço, disponibilidade, formulário) herda esse contexto; verificado como consistente, sem caminho encontrado onde a página de um escritório pudesse mostrar serviço, preço ou disponibilidade de outro.

SEO, performance de carregamento, domínio personalizado e conteúdo legal específico de Portugal (termos, política de privacidade, Livro de Reclamações) não foram aprofundados na auditoria de 12/08/2026 — isso não significa que estão com problema, significa que não foram checados com o mesmo rigor do resto, e não deveriam ser presumidos como prontos sem essa checagem específica.
