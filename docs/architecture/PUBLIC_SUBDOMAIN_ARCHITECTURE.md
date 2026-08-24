# Arquitectura — Página pública em `{slug}.teglion.com`

**Estado:** proposta (não implementada)  
**Data:** 21/08/2026  
**Proibido nesta fase:** DNS, Cloudflare, Vercel, wildcard SSL, deploy prod  

---

## 1. Estado actual

| Aspecto | Hoje |
|---------|------|
| Resolução de tenant | Path / slug (`/{firmSlug}`, APIs `findFirmBySlugOrLabel`) |
| Host | App Vercel + API Render; cookies via `x-forwarded-host` |
| Subdomínio por escritório | **Não** |

---

## 2. Objectivo futuro

```
https://afdigital.teglion.com     → página pública do firm slug=afdigital
https://app.teglion.com           → SPA autenticada (firm + client)
https://teglion.com               → marketing / landing AfDigital
```

Alternativa: `*.public.teglion.com` se quiser separar cookie domains.

---

## 3. Resolução confiável de tenant (anti Host spoofing)

**Regra:** o tenant **nunca** se deriva só de um header não validado.

Fluxo recomendado:

1. Edge (Cloudflare / Vercel) valida Host contra allowlist `*.teglion.com` (ou apex).  
2. Extrai `slug = host.split('.')[0]` com denylist (`www`, `app`, `api`, `staging`, `cdn`, …).  
3. Backend/API recebe **apenas** um header interno assinado ou rewrite path canónico  
   `X-Teglion-Public-Slug: afdigital` **depois** da validação edge — ou o frontend SSR chama API com slug já resolvido no servidor.  
4. API: `findFirmBySlug(slug)` + status ACTIVE + site publicado.  
5. **Não** confiar em `X-Forwarded-Host` sozinho para isolamento de dados.

Host spoofing entre tenants: se alguém envia `Host: outra-firma.teglion.com` sem passar pelo edge correcto, a edge deve rejeitar ou o backend deve exigir TLS SNI + allowlist.

---

## 4. Cache / CDN

| Risco | Mitigação |
|-------|-----------|
| Cache poisoning por Host | Cache key **inclui** Host (ou slug canónico); nunca partilhar HTML entre tenants |
| Resposta firm A servida a B | `Vary: Host` + `Cache-Control` privado em rotas autenticadas; público só com `s-maxage` + key por slug |
| API | Sem cache CDN de dados tenant-sensitive; ou key `firm_id` |

---

## 5. Cookies / auth

- Cookies de sessão firm: domain `app.teglion.com` (ou host-only), **não** em `*.teglion.com`.  
- Página pública subdomain: tipicamente **sem** cookie de sessão firm.  
- CSRF / CORS: allowlist de origins por ambiente.

---

## 6. SSL

- Wildcard `*.teglion.com` (Cloudflare Universal / ACM) **só** após gate de segurança.  
- Staging: `*.staging.teglion.com` separado.

---

## 7. Slug uniqueness

Já existe unicidade de `firms.slug` (assumir constraint). Reservar slugs de sistema. Renomear slug = invalidar cache + redirects 301.

---

## 8. Fases de implementação (futuro)

1. Documentação + threat model (este doc).  
2. Resolver slug no edge + smoke staging.  
3. Canonical URL + redirects path→subdomain.  
4. Prod DNS wildcard **com** autorização explícita.  
5. Monitorização cache miss / cross-tenant probes.

---

## 9. Relação com ADR-0012

Ordem de produto: subdomain **depois** de MFA, step-up, créditos/SMS entitlements. Google Calendar **depois**.

---

*Não activar wildcard sem Security Gate + autorização explícita.*
