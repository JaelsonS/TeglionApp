# TegLion — Onde estou e o que faço a seguir

**Actualizado: 17 Julho 2026**  
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
| Cobrança | Stripe parcial | Estou na Fase B |
| Performance | Limiar slow 1.5s | Depois: `/bootstrap` |
| Docs | Founder OS | Eu escrevo em `docs/company/` |

**Pitch de uma frase**  
Fecha o mês sem caçar documentos no WhatsApp — sistema para o escritório e portal para o cliente.

---

## 2. O que eu preciso fazer (próximos 90 dias)

### Fase A — Confiança do utilizador ✅ JÁ FIZ
1. Olho nas senhas + copy humana (Segurança) ✅  
2. Confirmação de e-mail + boas-vindas no registo e-mail/senha ✅  
3. Google: boas-vindas + e-mail já confirmado ✅  
4. Checklist domínio Brevo (DNS) — docs prontos; **ainda preciso** meter o DNS no painel  

### Fase B — Vender e cobrar (estou aqui)
1. **Preciso** criar no Stripe os preços mensal 35 € + anual 359,88 € ([STRIPE_SETUP.md](../operations/STRIPE_SETUP.md))  
2. Landing e billing já alinhei com esses valores ✅  
3. **Preciso** fazer smoke: signup → trial 14 dias → checkout  
4. Go-live do piloto estável  

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

## 3. Performance Charter

Ver [PERFORMANCE_CHARTER.md](./PERFORMANCE_CHARTER.md).

Eu não adiciono feature que deixe o produto mais lento ou mais confuso.

---

## 4. Fluxos que já fechei (Fase A)

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

## 5. Como eu uso este documento

- **Segunda-feira:** leio a secção 2 e escolho 1–2 tarefas.  
- **Antes de feature:** abro o Performance Charter.  
- **Limpeza:** [DOC_CLEANUP.md](./DOC_CLEANUP.md).  
- **Roadmap longo:** [../product/ROADMAP.md](../product/ROADMAP.md).  
- **Piloto:** [../CLIENTE_PILOTO/](../CLIENTE_PILOTO/).

### Posso vender já?

Sim — **piloto / early customers**, com honestidade:
- Produto operacional (auth, documentos, portal, billing código).  
- **Ainda preciso:** Stripe Price IDs no Render + DNS Brevo + smoke checkout.  
- Sem casos públicos inventados. Trial 14 dias é o fecho natural.
