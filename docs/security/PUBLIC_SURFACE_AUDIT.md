# Public surface security — Cursor code review (2026-08-15)

**Verdict:** **não** está 100% seguro. Nenhuma superfície pública o está só com code review.  
**Estado Cursor:** hardening parcial aplicado nesta PR; global continua 🟡 até Burp + deploy.

## O que esta PR corrige

1. **Form IRS / intake 500** — `DATA_ENCRYPTION_KEY` hex 64 aceite (antes só base64).
2. **Telefone com país** no form público de serviço.
3. **Leak `storageKey`** no JSON do site público (path incluía `firmId`) → só `id`/`alt`/`url`.
4. **Draft sem preview** no GET do serviço → só `published` ou settings legado.

## Controlos já presentes (PASS code review)

- Resolução só por `firmSlug` / `serviceSlug` (sem firm UUID do cliente)
- Turnstile + honeypot + rate limit nos POSTs de lead/submit
- Portal `/pedidos/:token` com token 256-bit + expiry
- DOMPurify em descrições HTML; termos/FAQ como texto
- CSRF skip em `/api/public` compensado por CORS allowlist + Turnstile nos POSTs principais
- Contacto email/telefone do escritório = intencional (público)

## Achados ainda abertos (não 100%)

| Severidade | Item | Estado |
| --- | --- | --- |
| HIGH residual | Upload/reply no portal **sem** Turnstile (token = única barreira) | Documentado; fix opcional |
| MEDIUM | `consultationId` UUID no submit (preciso para return URL + token) | Aceite com token opaco |
| MEDIUM | Enumeração de slugs | Esperado para marketing; RL only |
| — | Burp: CORS, CSRF portal, fuzz upload, Turnstile live | 🛡️ Pendente |

## Não afirmar

- “100% seguro”
- Aprovado global sem Burp HTTP nas rotas públicas
