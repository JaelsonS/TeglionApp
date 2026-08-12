# Google Drive

**Status: IMPLEMENTADO.** Verificado na auditoria de 12/08/2026 como integração real, não um botão que existe mas não faz nada.

## O que funciona

Dentro do fluxo de mensagens, um membro da equipe pode abrir o seletor de arquivos do próprio Google Drive (o "Picker" oficial do Google) e escolher um arquivo para anexar diretamente, sem precisar baixar do Drive e depois subir manualmente no Teglion.

## Por que o desenho de permissão é bom

A integração pede o escopo mais restrito possível do Google Drive — acesso só ao arquivo especificamente escolhido no seletor, não acesso geral à conta do Drive de quem está usando. O token de acesso usado para essa importação é temporário e nunca fica salvo no banco de dados — existe só durante a operação de importar aquele arquivo específico.

## Como o arquivo importado entra no sistema

O arquivo escolhido no Drive passa pelo mesmo caminho de validação que qualquer upload manual — a mesma verificação de tipo de arquivo, o mesmo vínculo obrigatório com o escritório e o cliente certos, extraídos sempre da sessão autenticada de quem está fazendo a importação, nunca de um parâmetro que pudesse ser manipulado. Não existe um caminho separado e menos protegido só porque a origem do arquivo é o Google Drive em vez do computador da pessoa.

## O que isso não inclui

Não é uma sincronização de pasta nem um espelho do Drive dentro do Teglion — é um atalho pontual para trazer um arquivo específico para dentro de uma conversa, no momento em que é preciso.
