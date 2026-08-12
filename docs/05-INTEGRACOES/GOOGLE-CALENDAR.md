# Google Calendar

**Status: IMPLEMENTADO.** Verificado de ponta a ponta na auditoria de 12/08/2026 — não é integração parcial nem estimativa otimista.

## O que funciona

Um membro da equipe conecta o próprio Google Calendar ao Teglion através de um fluxo OAuth padrão, protegido contra CSRF (o estado da requisição é validado antes de trocar o código de autorização). A conexão fica vinculada ao escritório e à pessoa que conectou — não é uma conexão genérica do escritório inteiro.

Os tokens de acesso e renovação ficam cifrados no banco de dados, com o mesmo esquema de criptografia usado em outros dados sensíveis do sistema — não é um mecanismo mais fraco criado só para essa integração.

Quando alguém reconecta, a conexão antiga é substituída de forma limpa, sem duplicar registro. Quando o acesso é revogado do lado do Google, ou o token expira de um jeito que exige nova autorização, o sistema detecta isso explicitamente e mostra um aviso na interface — não falha silenciosamente, deixando o escritório sem saber por que a sincronização parou.

## Como a sincronização funciona

É um envio de mão única: eventos criados no Teglion (agendamentos) são enviados para o Google Calendar da pessoa conectada. Na direção contrária, o sistema lê a disponibilidade ocupada nesse calendário — não sincroniza o conteúdo completo do calendário pessoal, só usa isso para não oferecer, na agenda pública, um horário que já está ocupado em compromissos externos.

Essa leitura de disponibilidade usa um cache curto (alguns minutos). Na prática, isso significa que um bloqueio feito manualmente no Google Calendar pode levar até esse tempo para refletir na página pública de agendamento — uma ressalva operacional a se ter em mente, não um defeito.

A sincronização é protegida contra duplicação: cada agendamento guarda a referência do evento correspondente no Google, e existe um mecanismo de verificação alternativo que evita criar um evento duplicado mesmo se essa referência se perder por algum motivo.

## Fuso horário

Tratado de forma explícita, não presumido. O fuso configurado para o agendamento do escritório é o mesmo propagado até o evento criado no Google Calendar, restrito a um conjunto definido de fusos válidos.

## O que não é

Não é uma sincronização bidirecional completa — o Teglion não importa e reflete tudo que acontece no calendário pessoal de quem conectou, só lê disponibilidade. Isso é uma escolha de escopo, não uma limitação técnica escondida.
