# Documentos

**Status: IMPLEMENTADO.** Um dos módulos mais bem protegidos do sistema, verificado com detalhe na auditoria de 12/08/2026.

## O fluxo

Cliente ou escritório sobe um arquivo — categorizado (fatura, extrato bancário, recibo, contrato, declaração, comprovativo, entre outros), com período de referência e observação opcional. Pode estar vinculado a um pedido específico do escritório ("preciso do seu extrato de março"), a uma obrigação, ou a uma tarefa. O escritório valida o documento recebido, podendo aprovar, rejeitar com motivo, ou pedir reenvio — cada mudança registrada com histórico auditável.

Pedido de documento tem o próprio ciclo de vida: criado pelo escritório, marcado como visto pelo cliente, respondido com o arquivo, concluído. O cliente também pode chegar a um pedido através de uma obrigação ou de uma conversa de mensagem, não só de uma lista dedicada.

## Validação de upload

Não confia só na extensão ou no tipo declarado pelo navegador — o conteúdo binário do arquivo é verificado contra a assinatura real do formato (a sequência de bytes que identifica um PDF, uma imagem JPEG, um documento do Office, etc.) antes de aceitar. Isso impede um arquivo malicioso disfarçado de inofensivo só pela extensão.

## Isolamento — a explicação mais importante deste documento

Três camadas independentes, não uma única barreira:

1. **Aplicação**: toda busca de documento exige o `firm_id` da sessão de quem pede, e, se for um cliente pedindo, também exige que o `client_id` bata e que o vínculo dele com o escritório esteja aprovado.
2. **Caminho do arquivo**: a chave de armazenamento já embute o identificador do escritório e do cliente, tornando o caminho não adivinhável por tentativa.
3. **Política de segurança do próprio armazenamento**: diferente do banco de dados relacional (onde essa proteção não se aplica ao tráfego real do backend), essa camada é de fato avaliada no Supabase Storage — uma segunda rede de segurança real, não decorativa.

Download nunca expõe uma URL direta e assinada do armazenamento ao navegador do usuário — o backend baixa o arquivo e devolve o conteúdo diretamente, mantendo controle total sobre quem pode acessar o quê, a cada requisição. A única exceção verificada é o download de documento entregue pelo mini-portal de captação pública (ver [IRS.md](./IRS.md)), que usa uma URL assinada direta — ainda restrita à equipe do escritório e ainda vinculada ao escritório certo antes de ser gerada, mas um padrão diferente do resto, que vale unificar por consistência.

## Resposta direta

**Um cliente de um escritório poderia acessar documento de outro cliente, do mesmo escritório ou de outro?** Não, pelo caminho de código verificado — nenhum endpoint de download aceita identificador de escritório ou cliente vindo de fora da sessão autenticada, condição que seria necessária para esse risco existir.
