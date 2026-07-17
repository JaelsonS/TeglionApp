# Bugs

## Bug 001
Título: Botão Validar NIF não funciona.
Descrição: A validação do NIF no wizard de criação de empresa deve chamar a API e apresentar o estado válido/inválido corretamente.
Data: 2026-07-06
Status: Resolvido
Responsável: Arquitetura / Frontend
Correção aplicada: Preservado o estado de validação ao normalizar o NIF e ajustado o botão para voltar a refletir o resultado da API.
Data da correção: 2026-07-06

## Bug 002
Título: Departamento aparece sempre como “Sem departamento”.
Descrição: Na lista da equipa, membros com departamento atribuído mostravam “Sem departamento”.
Data: 2026-07-17
Status: Resolvido
Responsável: Backend / Frontend
Correção aplicada: API da equipa passa a devolver `departmentName`; UI usa fallback seguro.
Data da correção: 2026-07-17

## Bug 003
Título: Botão “Enviar convite” / reset parece não fazer nada.
Descrição: Validação de palavra-passe falhava em silêncio; botão de reset ficava `disabled` sem feedback claro.
Data: 2026-07-17
Status: Resolvido
Responsável: Frontend
Correção aplicada: Feedback de validação nos formulários de convite e reset.
Data da correção: 2026-07-17

## Bug 004
Título: Labels da sidebar em inglês.
Descrição: Algumas entradas do menu do escritório apareciam em inglês por chaves i18n em falta e `parseMissingKeyHandler` a sobrescrever `defaultValue`.
Data: 2026-07-17
Status: Resolvido
Responsável: Frontend
Correção aplicada: Chaves PT adicionadas e handler ajustado.
Data da correção: 2026-07-17
