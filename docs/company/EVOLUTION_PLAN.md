# TegLion — Plano de Evolução (Founder OS)

**Documento vivo · Actualizado: 17 Julho 2026**  
**Audiência:** founder (Jaelson) + Cursor / engenharia  
**Princípio:** cada release deixa o sistema **igual ou melhor** — nunca pior.

Este ficheiro é a tua bússola: onde estás, o que fazer a seguir, o que não fazer ainda, e como decidir.

---

## 1. Onde estamos (verdade actual)

| Área | Estado | Notas |
|------|--------|--------|
| Piloto contadora | Em curso | Cadastro fiscal P0 feito; Definições/Equipa polidas |
| Auth | JWT + Google SSO | Confirm e-mail no registo senha; Google já confirmado |
| E-mail | Brevo + templates | Ver [BREVO_DOMAIN_SETUP.md](../operations/BREVO_DOMAIN_SETUP.md) |
| Definições | Hub com abas | Identidade / Escritório / Perfil / Equipa |
| Equipa | Criar + convidar + departamentos | RBAC activo |
| Cobrança | Stripe parcial | Fase B |
| Performance | Limiar slow 1.5s | Fase C: `/bootstrap` |
| Docs | Founder OS | `docs/company/` |

**Pitch de uma frase**  
Fecha o mês sem caçar documentos no WhatsApp — sistema para o escritório e portal para o cliente.

---

## 2. Norte do produto (próximos 90 dias)

### Fase A — Confiança do utilizador ✅ CONCLUÍDA
1. Olho nas senhas + copy humana (Segurança) ✅  
2. Confirmação de e-mail + boas-vindas no registo e-mail/senha ✅  
3. Google: boas-vindas + e-mail já confirmado ✅  
4. Checklist domínio Brevo (DNS) — [BREVO_DOMAIN_SETUP.md](../operations/BREVO_DOMAIN_SETUP.md) ✅ docs; DNS = acção tua no painel  

### Fase B — Vender e cobrar (agora)
1. Stripe: preços mensal 35 € + anual 359,88 € ([STRIPE_SETUP.md](../operations/STRIPE_SETUP.md))  
2. Landing e billing alinhados com esses valores ✅ código  
3. Smoke: signup → trial 14 dias → checkout  
4. Go-live piloto estável  

### Fase C — Performance First (contínuo)
1. Inventário de requests no cold start  
2. `GET /bootstrap`  
3. Deduplicar React Query  
4. Paginação / virtualização  

### Fase D — Escala operacional
1. Preferências de notificação granulares  
2. Responsáveis por cliente  
3. Multi-país (só quando PT estiver sólido)

---

## 3. Performance Charter

Ver [PERFORMANCE_CHARTER.md](./PERFORMANCE_CHARTER.md).

Regra de ouro: cada funcionalidade deixa o Teglion **igual ou melhor**. Nunca pior.

---

## 4. Fluxo Fase A (referência)

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
  → auto-confirma para não bloquear desenvolvimento
```

---

## 5. Como usar este documento

- **Segunda-feira:** ler secção 2.  
- **Antes de feature:** colar Performance Charter.  
- **Limpeza docs:** [DOC_CLEANUP.md](./DOC_CLEANUP.md).  
- **Roadmap longo:** [../product/ROADMAP.md](../product/ROADMAP.md).  
- **Piloto:** [../CLIENTE_PILOTO/](../CLIENTE_PILOTO/).
