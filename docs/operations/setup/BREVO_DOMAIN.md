# Brevo — domínio autenticado (Primary inbox)

> Fonte: `docs/operations/BREVO_DOMAIN_SETUP.md` (pasta antiga, removida após esta consolidação). Editado para PT-BR, sem reescrita de conteúdo técnico. Última atualização do conteúdo-fonte: 17/07/2026.

Sem isso, emails de boas-vindas/confirmação podem cair em Promoções ou Spam.

## Objetivo

Enviar a partir de um endereço do domínio Teglion verificado na Brevo (ex.: `contato@teglion.com`) com **SPF + DKIM** (e idealmente DMARC).

**Importante:** `contato@` / `suporte@` / `comercial@` são **só envio** (senders Brevo). A caixa que **recebe** respostas e formulários é a inbox real (ex. Gmail do operador), configurada em `SUPPORT_NOTIFY_EMAIL` / `BRAND.emails.hello` — não usar o sender Brevo como destino de notificação.

## Checklist (Brevo Console)

1. [ ] Conta Brevo com `BREVO_API_KEY` em staging e produção (Render).
2. [ ] **Senders & IP** → Add a domain → `teglion.com` (ou subdomínio `mail.teglion.com`).
3. [ ] Copiar os registros DNS (SPF, DKIM, e idealmente DMARC) para o DNS do domínio.
4. [ ] Esperar validação verde no Brevo (pode levar de minutos a horas).
5. [ ] Definir o sender verificado como `FROM_EMAIL` (ex.: `contato@teglion.com`).
6. [ ] Definir `FROM_NAME=Teglion`.
7. [ ] Enviar email de teste (registro novo) e confirmar que chega em **Primary**, não em Promoções.
8. [ ] Remover / evitar `FROM_EMAIL` em Gmail pessoal em produção.

## Variáveis no Render (produção / staging)

```
BREVO_API_KEY=...
FROM_EMAIL=contato@teglion.com
FROM_NAME=Teglion
FRONTEND_URL=https://app.teglion.com   # ou a URL real do frontend
EMAIL_ENABLED=true                     # se existir no env; senão ativa-se com BREVO_API_KEY
```

## Como validar no produto

1. Criar conta de escritório com email/senha → deve receber email de **Bem-vindo + confirmar email**.
2. Clicar no link → redireciona para login → entrar.
3. Criar conta com Google → sessão imediata + email de boas-vindas (sem link de confirmação).
4. Convidar colaborador → fluxo de convite + confirmação (já existente).

## Se o DNS ainda não estiver pronto

- Em **local**, sem `BREVO_API_KEY`: o registro por email/senha **auto-confirma** para não bloquear o desenvolvimento.
- Em **produção**, com API key mas domínio não autenticado: os emails saem, mas a entregabilidade sofre — completar o DNS antes de qualquer piloto público.

## Estado

| Item | Estado |
|------|--------|
| Código de confirmação + boas-vindas | Feito |
| Domínio SPF/DKIM no DNS | Ação manual no Brevo + DNS — confirmar se já foi concluída |
| `FROM_EMAIL` de domínio próprio em produção | Verificar no Render |
