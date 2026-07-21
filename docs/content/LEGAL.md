# Pacote legal Teglion (RGPD / Portugal)

## Operador do SaaS

- **Jaelson Silva dos Santos**, NIF 331 759 276, Coimbra, Portugal  
- CAE 62100 — Programação informática  
- Contacto: jaelsonsilva345@gmail.com · +351 916 447 990  

## Documentos (versão actual: `2026.05.22`)

| Documento | Rota | Ficheiro fonte |
|-----------|------|----------------|
| Termos de Utilização | `/termos` | `frontend/src/app/legal/contabil/documents/terms.ts` |
| Política de Privacidade | `/privacidade` | `.../privacy.ts` |
| Política de Cookies | `/cookies` | `.../cookies.ts` |
| Aviso Legal | `/aviso-legal` | `.../notice.ts` |
| DPA (Art. 28 RGPD) | `/dpa` | `.../dpa.ts` |

As versões devem coincidir em:

- `frontend/src/app/legal/contabil/versions.ts`
- `backend/src/constants/legal-versions.js`

## Papéis RGPD

- **Escritório de contabilidade** = Responsável pelo Tratamento (dados dos clientes finais).
- **Teglion (Operador)** = Subcontratante / Processador (software).
- **Cliente final** = Titular; relação contratual com o escritório.

## Consentimento no registo de escritório

Obrigatório aceitar: Termos, Privacidade, DPA e Cookies.

- **Frontend:** `FirmRegisterPage` + `LegalConsentBlock`
- **API:** `POST /api/contabil/auth/register-firm` com `legalConsents`
- **BD:** `user_legal_consents` (histórico imutável) + `firm_users.legal_consent_bundle`

Migração: `supabase/migrations/20260827200000_user_legal_consents.sql`

## Actualizar versões legais

1. Editar textos em `frontend/src/app/legal/contabil/documents/*.ts`
2. Bump em `versions.ts` e `legal-versions.js` (mesmo valor, ex. `2026.06.01`)
3. Utilizadores existentes: `firmUserNeedsReconsent()` — implementar UI de re-aceitação no login (pendente)
4. Deploy migração se alterar esquema

## API pública

`GET /api/public/legal/versions` — versões e metadados do operador.
