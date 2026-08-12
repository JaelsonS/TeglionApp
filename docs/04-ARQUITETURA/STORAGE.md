# Armazenamento de arquivo

Supabase Storage, com um bucket privado dedicado a documento de cliente — não público, não acessível sem autenticação.

## Estrutura da chave

Cada arquivo é salvo com um caminho que já embute o `firm_id` e o `client_id` do dono do documento, além de um identificador único — o que torna a chave do arquivo não adivinhável por tentativa, mesmo que alguém quisesse tentar acessar um caminho diretamente sem passar pela aplicação.

## Como o download funciona

Sempre por um proxy do próprio backend — o backend baixa o arquivo do Supabase Storage e devolve o conteúdo diretamente na resposta, nunca expondo uma URL assinada do Supabase diretamente ao navegador do usuário. Isso evita um padrão comum de risco (URL assinada vazando por log, histórico de navegador, ou compartilhamento acidental) e mantém o backend como ponto único de decisão sobre quem pode baixar o quê, a cada requisição, não só no momento de gerar um link.

Existe uma exceção pontual verificada na auditoria: o download de documento entregue através do mini-portal de captação de serviço usa uma URL assinada direta, em vez do proxy — ainda restrita à equipe do escritório e ainda vinculada ao `firm_id` correto antes de ser gerada, mas um padrão diferente do resto do sistema. Vale unificar por consistência, embora não configure risco de vazamento cross-tenant confirmado.

## Proteção em camada, não só uma barreira

Três camadas independentes protegem contra acesso cruzado a documento: a aplicação (toda busca de documento exige `firm_id` e, quando o ator é cliente, também `client_id`, extraídos da sessão), o caminho do arquivo (não adivinhável), e as próprias políticas de segurança do Supabase Storage — que, diferente do banco de dados relacional, são de fato aplicadas ao tráfego real, porque o Storage é acessado de um jeito que respeita essas políticas.

## Upload

Validação de tipo de arquivo não se baseia só no que o navegador declara — o conteúdo binário do arquivo é verificado contra a assinatura real do formato antes de aceitar o upload, o que impede um arquivo malicioso disfarçado com uma extensão inofensiva.

## Onde aprofundar

O detalhe do fluxo de documento do ponto de vista de produto (categorização, pedido de documento, validação por parte do escritório) está em [DOCUMENTOS.md](../03-PRODUTO/DOCUMENTOS.md).
