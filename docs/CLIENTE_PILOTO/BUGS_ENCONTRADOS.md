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

## Bug 005
Título: Independentes — CAE principal sem escrita livre.
Descrição: Na ficha do cliente (hub), o CAE principal era um `<select>` com lista curta; independentes (e empresas) não conseguiam escrever um CAE livre como no wizard de criação.
Data: 2026-07-20
Status: Resolvido
Responsável: Frontend / Backend
Correção aplicada: Combobox profissional (pesquisa + sugestões + texto livre) com histórico do escritório (`firms.settings.caeHistory`) reutilizável na ficha e no wizard.
Data da correção: 2026-07-20

## Bug 006
Título: Painel direito de obrigações sem scroll.
Descrição: Ao abrir uma obrigação em Tarefas → Obrigações fiscais, o detalhe à direita não fazia scroll (mesmo tipo de defeito já visto em documentos).
Data: 2026-07-20
Status: Resolvido
Responsável: Frontend
Correção aplicada: Cadeia flex/`min-h-0` corrigida; scroll em `.cb-ob-det-scroll`; removido header duplicado; sheet mobile alinhado ao padrão dos documentos.
Data da correção: 2026-07-20

## Bug 007
Título: Recuperação de senha falha em emails Gmail com pontos.
Descrição: `normalizeEmail()` removia pontos (`colaborador.llcnunes` → `colaboradorllcnunes`); a API respondia sucesso sem enviar email.
Data: 2026-07-20
Status: Resolvido
Responsável: Backend
Correção aplicada: `gmail_remove_dots: false` no recover/login; procura bate com o email real na BD.
Data da correção: 2026-07-20

## Bug 008
Título: CAE principal não fica guardado na ficha.
Descrição: Ao escolher CAE e sair da ficha, o valor desaparecia; histórico do escritório também não preenchia.
Data: 2026-07-20
Status: Resolvido
Responsável: Frontend
Correção aplicada: save imediato do CAE (sem debounce perdido no unmount); flush do debounce no unmount; combobox grava texto ao fechar.
Data da correção: 2026-07-20

## Melhoria 009
Título: Autocomplete CAE com catálogo oficial (INE).
Descrição: Ao criar/editar clientes, o CAE era só lista curta + texto livre; donos de escritório perdiam tempo a escrever códigos.
Data: 2026-07-20
Status: Resolvido
Responsável: Frontend / Backend
Correção aplicada: catálogo local CAE-Rev.3 (~570 classes INE + tokens de pesquisa) com pesquisa por código/descrição; endpoint `GET /firm/cae-search`; enriquecimento opcional via API live do INE; histórico do escritório mantido.
Data da correção: 2026-07-20

## Melhoria 010
Título: Actividade do hub clicável com deep-link.
Descrição: Os cards de Actividade / Actividade recente eram só informativos; o escritório não conseguia saltar para o documento, tarefa, obrigação ou mensagem.
Data: 2026-07-20
Status: Resolvido
Responsável: Frontend
Correção aplicada: `resolveActivityNav` + cards clicáveis em `ClientHubHistory`; obrigações aceitam `?ob=` e `?obligation=`.
Data da correção: 2026-07-20
