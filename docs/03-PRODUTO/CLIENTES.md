# Clientes

**Status: IMPLEMENTADO.**

## O que é

O registro central do produto — praticamente todo outro módulo (documento, mensagem, obrigação, agendamento) se conecta a um cliente. Um cliente pode ser uma empresa ou um particular, e o sistema trata isso como diferença real de dado, não um rótulo cosmético: campo fiscal como regime de IVA só aparece e é exigido para empresa, porque particular não tem IVA — decisão de produto documentada como correção de um bug real do início do produto, não uma coincidência de desenho.

## O que o escritório consegue fazer

Cadastrar cliente com identificação fiscal (NIF), contato, e dado específico do tipo (CAE e regime de IVA para empresa; regime de IRS para ambos os tipos). Atribuir um cliente a um membro específico da equipe. Ativar ou desativar um cliente sem apagar o histórico dele. Acompanhar, na ficha do cliente, a atividade recente ligada a ele — documento, mensagem, obrigação, tarefa — num só lugar, com capacidade de ocultar eventos do feed principal sem perder o rastro (histórico continua recuperável).

## Acesso ao portal

Um cliente pode ou não ter acesso ao portal — isso é rastreado separadamente do cadastro em si (`portalAccessStatus`), e o vínculo entre cliente e conta de portal precisa estar aprovado (`linkStatus`) antes de qualquer operação sensível, como download de documento, ser permitida a ele. Essa separação é o que permite ao escritório cadastrar um cliente antes mesmo dele ter acesso próprio ao sistema.

## Isolamento

Toda operação de cliente é filtrada por `firm_id` na camada de repositório — verificado na auditoria de 12/08/2026 como consistente, sem exceção encontrada. Detalhe completo do veredito de isolamento entre escritórios em [MULTI-TENANT-SECURITY.md](../06-SEGURANCA/MULTI-TENANT-SECURITY.md).

## O que não foi aprofundado nesta rodada

Relatório e exportação de dado de cliente em lote não foram escopo desta auditoria — não presuma que existe ou não existe sem confirmar.
