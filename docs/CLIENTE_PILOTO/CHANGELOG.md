# Changelog

## 2026-07-22
- **Particulares:** Regime de IVA deixa de aparecer / ser obrigatório (wizard + ficha); IRS mantém-se.
- **Morada:** Localidade e Freguesia no cadastro; lookup do código postal preenche a freguesia correctamente.
- Docs piloto actualizados (`PEDIDOS_CONTADORA`, `BACKLOG`, `BUGS_ENCONTRADOS`).

## 2026-07-17
- Hub de **Definições** com abas reais (`?tab=…`): Identidade, Escritório, Perfil, Equipa, Notificações, Encerrar — um painel de cada vez (já não é scroll por âncoras).
- Polimento visual do hub: nav lateral com ícones coloridos, cabeçalhos com gradiente suave, cartões de métrica clicáveis na Equipa, CTAs primários em criar/convidar colaborador.
- **Olhinho** em todos os campos de palavra-passe (`PasswordInput` partilhado).
- Perfil → Segurança: copy clara; contas Google sem palavra-passe local mostram aviso em vez do formulário.
- Equipa: atalhos clicáveis; linhas da lista abrem edição com scroll.
- **Fase A:** registo e-mail/senha exige confirmação de e-mail (boas-vindas + link); Google recebe boas-vindas e fica confirmado; cliente recebe boas-vindas após aceitar convite.
- Checklist domínio Brevo: `docs/operations/BREVO_DOMAIN_SETUP.md`.
- Founder OS: `docs/company/EVOLUTION_PLAN.md` + Performance Charter.
- Limiar de “slow request” no Render: 500ms → 1500ms (latência normal Supabase).
- Perfil: alteração de palavra-passe (`POST /contabil/firm/profile/password`).
- Notificações: activar e testar push no browser.
- Equipa: cartões de resumo clicáveis (lista / departamentos / convites); convite e criar colaborador com feedback de validação.
- E-mails transaccionais (convite, boas-vindas, reset) com layout Teglion via Brevo; falhas de e-mail não bloqueiam o fluxo principal.
- Correcção: lista da equipa passa a mostrar o nome do departamento (já não fica sempre “Sem departamento” por falta de `departmentName` na API).
- Correcção: labels da sidebar em português (chaves i18n + `parseMissingKeyHandler`).
- Formulários de convite / reset: botão deixa de falhar em silêncio quando a palavra-passe é inválida.

## 2026-07-06
- Corrigida a navegação móvel do portal do cliente.
- Ajustado o scroll do dashboard no mobile.
- Simplificada a página de recuperação de senha para o estilo Teglion.
- Removida a duplicação de menus no mobile do escritório.
- Ajustado o composer do chat no desktop.
- Sincronizadas as branches `main` e `staging`.
- Concluído o P0 do onboarding do cliente: Tipo de Cliente, Início de Atividade, Capital Social opcional, Tipo de Contabilidade, Regime IVA, Segurança Social e Identificação.
- Corrigido o botão Validar NIF no wizard de criação de cliente.
- Separadas as Obrigações Fiscais das Tarefas Internas do escritório, com recorrência própria para cada módulo.
