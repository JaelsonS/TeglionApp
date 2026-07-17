# Brevo — domínio autenticado (Primary inbox)

**Actualizado: 17 Julho 2026**  
**Fase A · Ops** — sem isto, e-mails de boas-vindas/confirmação podem ir para Promoções ou Spam.

## Objectivo

Enviar a partir de um endereço do domínio TegLion (ex.: `noreply@teglion.com` ou `ola@teglion.com`) com **SPF + DKIM** (e idealmente DMARC) validados no Brevo.

## Checklist (Brevo Console)

1. [ ] Conta Brevo com `BREVO_API_KEY` em staging e produção (Render).
2. [ ] **Senders & IP** → Add a domain → `teglion.com` (ou subdomínio `mail.teglion.com`).
3. [ ] Copiar registos DNS (SPF, DKIM, eventualmente DMARC) para o DNS do domínio.
4. [ ] Esperar validação verde no Brevo (pode demorar minutos a horas).
5. [ ] Definir sender verificado como `FROM_EMAIL` (ex.: `noreply@teglion.com`).
6. [ ] Definir `FROM_NAME=TegLion`.
7. [ ] Enviar e-mail de teste (registo novo) e confirmar que chega a **Primary**, não Promoções.
8. [ ] Remover/evitar `FROM_EMAIL` em Gmail pessoal em produção.

## Variáveis Render (produção / staging)

```
BREVO_API_KEY=...
FROM_EMAIL=noreply@teglion.com
FROM_NAME=TegLion
FRONTEND_URL=https://app.teglion.com   # ou URL real do FE
EMAIL_ENABLED=true                     # se existir no env; senão activa-se com BREVO_API_KEY
```

## Como validar no produto

1. Criar conta de escritório com e-mail/senha → deve receber **Bem-vindo + confirmar e-mail**.
2. Clicar no link → redirecciona para login → entrar.
3. Criar conta com Google → sessão imediata + e-mail de boas-vindas (sem link de confirmação).
4. Convidar colaborador → fluxo convite + confirmação (já existente).

## Se o DNS ainda não estiver pronto

- Em **local** sem `BREVO_API_KEY`: o registo e-mail/senha **auto-confirma** para não bloquear desenvolvimento.
- Em **produção** com API key mas domínio não autenticado: os e-mails saem, mas a entregabilidade sofre — completar DNS antes do piloto público.

## Estado

| Item | Estado |
|------|--------|
| Código de confirm + welcome | Feito (Fase A) |
| Domínio SPF/DKIM no DNS | **Acção manual no Brevo + DNS** |
| `FROM_EMAIL` de domínio próprio em prod | Verificar no Render |
