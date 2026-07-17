# TegLion — Onde estou e o que faço a seguir

**Actualizado: 17 Julho 2026 (noite)**  
**Para mim (Jaelson)** — bússola do dia a dia.  
**Regra:** cada release deixa o sistema **igual ou melhor**. Nunca pior.

---

## 1. Onde estou agora

| Área | Estado | Notas |
|------|--------|--------|
| Piloto contadora | Em curso | Cadastro fiscal P0 feito; Definições/Equipa polidas |
| Auth | JWT + Google SSO | Confirmei e-mail no registo senha; Google já vem confirmado |
| E-mail | Brevo + templates | Ainda preciso fechar DNS — [BREVO_DOMAIN_SETUP.md](../operations/BREVO_DOMAIN_SETUP.md) |
| Definições | Hub com abas | Identidade / Escritório / Perfil / Equipa — menu mobile corrigido |
| Equipa | Criar + convidar + departamentos | RBAC activo |
| Documentos | Pedidos formais | Progresso até **Concluído** (marcar / validar ficheiro) |
| Obrigações | Painel direito | Scroll interno a funcionar de novo |
| Telefone | UI internacional | Bandeira + código do país nos campos de telemóvel |
| Cobrança | Stripe parcial | Estou na Fase B |
| Performance | Limiar slow 1.5s | Depois: `/bootstrap` |
| Docs | Founder OS | Eu escrevo em `docs/company/` |

**Pitch de uma frase**  
Fecha o mês sem caçar documentos no WhatsApp — sistema para o escritório e portal para o cliente.

---

## 2. Amanhã — o que faço (checklist)

Trabalho **em cima desta documentação**, não invento sprint novo.

### Bloco 1 — Cobrar (Fase B) — P0
- [ ] Stripe Dashboard: produto TegLion + preço mensal **35,00 €** + anual **359,88 €**
- [ ] Copiar Price IDs para Render (`STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY` ou nomes do [STRIPE_SETUP.md](../operations/STRIPE_SETUP.md))
- [ ] Smoke: registo escritório → trial 14 dias → checkout (cartão teste)

### Bloco 2 — E-mail a chegar (Brevo) — P0
- [ ] DNS Brevo no domínio (SPF/DKIM/DMARC) — [BREVO_DOMAIN_SETUP.md](../operations/BREVO_DOMAIN_SETUP.md)
- [ ] Confirmar `BREVO_API_KEY` + `FROM_EMAIL` no Render
- [ ] Testar: convite cliente + reset password + e-mail de obrigação

### Bloco 3 — Piloto contadora — P0
- [ ] Pedido de documento: criar → cliente envia → escritório conclui (badge Concluído)
- [ ] Obrigação: criar/enviar guia → cliente recebe e-mail
- [ ] Anotar fricções no [../CLIENTE_PILOTO/](../CLIENTE_PILOTO/)

### Bloco 4 — Só se o P0 estiver verde
- [ ] Redis confirmação produção ([REDIS_RENDER_SETUP.md](../operations/REDIS_RENDER_SETUP.md))
- [ ] Inventário cold-start / Performance Charter
- [ ] Não abrir features novas de marketing até Stripe + Brevo estarem vivos

---

## 3. O que eu preciso fazer (próximos 90 dias)

### Fase A — Confiança do utilizador ✅ JÁ FIZ
1. Olho nas senhas + copy humana (Segurança) ✅  
2. Confirmação de e-mail + boas-vindas no registo e-mail/senha ✅  
3. Google: boas-vindas + e-mail já confirmado ✅  
4. Checklist domínio Brevo (DNS) — docs prontos; **ainda preciso** meter o DNS no painel  

### Fase B — Vender e cobrar (estou aqui — foco de amanhã)
1. **Preciso** criar no Stripe os preços mensal 35 € + anual 359,88 € ([STRIPE_SETUP.md](../operations/STRIPE_SETUP.md))  
2. Landing e billing já alinhei com esses valores ✅  
3. E-mail ao cliente quando envio obrigação ✅ (SMS depois)  
4. **Preciso** fazer smoke: signup → trial 14 dias → checkout  
5. Go-live do piloto estável  

### Fase C — Performance (a seguir)
1. Inventário de requests no cold start  
2. `GET /bootstrap`  
3. Deduplicar React Query  
4. Paginação / virtualização onde doer  

### Fase D — Escala (só depois de PT estável)
1. Preferências de notificação granulares  
2. Responsáveis por cliente  
3. Multi-país (Brasil) — só quando Portugal estiver sólido

---

## 4. Performance Charter

Ver [PERFORMANCE_CHARTER.md](./PERFORMANCE_CHARTER.md).

Eu não adiciono feature que deixe o produto mais lento ou mais confuso.

---

## 5. Fluxos que já fechei (Fase A)

```
Registo e-mail/senha
  → cria firm + owner (email_confirmed_at = null)
  → e-mail boas-vindas + link confirmar (48h)
  → utilizador clica → login

Registo Google
  → cria firm + owner (já confirmado)
  → e-mail boas-vindas
  → sessão imediata

Local sem Brevo
  → auto-confirma para eu não ficar bloqueado em desenvolvimento
```

---

## 6. Como eu uso este documento

- **Segunda-feira / início do dia:** leio a secção 2 (amanhã) e escolho 1–2 tarefas.  
- **Antes de feature:** abro o Performance Charter.  
- **Estado técnico:** [../operations/STATUS.md](../operations/STATUS.md).  
- **Limpeza:** [DOC_CLEANUP.md](./DOC_CLEANUP.md).  
- **Roadmap longo:** [../product/ROADMAP.md](../product/ROADMAP.md).  
- **Piloto:** [../CLIENTE_PILOTO/](../CLIENTE_PILOTO/).

### Posso vender já?

Sim — **piloto / early customers**, com honestidade:
- Produto operacional (auth, documentos, portal, billing código).  
- **Ainda preciso:** Stripe Price IDs no Render + DNS Brevo + smoke checkout.  
- Sem casos públicos inventados. Trial 14 dias é o fecho natural.
