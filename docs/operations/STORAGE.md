# Armazenamento de ficheiros — TegLion

**Único backend activo:** Supabase Storage (bucket privado `contabil-documents`).

---

## Arquitectura

```
Upload (cliente/escritório)
    → Multer (memória)
    → contabil-storage.service.js
    → Supabase Storage: firm/{firmId}/clients/{clientId}/documents/...
    → Postgres (tabela documents): storage_provider='supabase', storage_key='caminho'

Logótipo escritório  → firm/{firmId}/branding/logo-...
Capa notícias        → firm/{firmId}/news/covers/...
Anexos mensagens     → mesmo path de documentos + attachment_storage_key na mensagem
```

**Postgres** guarda metadados. **Storage** guarda bytes. Não há segundo CDN (Cloudinary foi removido — era legado não utilizado).

---

## Segurança

| Medida | Detalhe |
|--------|---------|
| Bucket privado | `public: false` |
| RLS | Escritório só acede `firm/{seu_id}/...`; cliente só os seus ficheiros |
| Download | Sempre via API backend (valida permissões) |
| URLs assinadas | Logótipos e links temporários (TTL configurável) |
| Magic bytes | Validação de tipo real do ficheiro após upload |
| Path | Inclui `firm_id` + `client_id` — isolamento multi-tenant |

Migration: `supabase/migrations/20260703000000_storage_contabil_documents.sql`

---

## Variáveis de ambiente

| Variável | Onde |
|----------|------|
| `SUPABASE_URL` | Backend (Render) |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend — **nunca** no frontend |
| `SUPABASE_STORAGE_BUCKET` | Opcional (default: `contabil-documents`) |

---

## Validar em local / staging

```bash
cd backend && npm run storage:validate   # bucket existe
cd backend && npm run smoke:pilot          # upload + Brevo + Supabase
```

Health produção: `GET /api/public/health/integrations` → `supabaseStorage: ready`

---

## Backup

- Activar backups automáticos no projeto Supabase (recomendado plano com PITR para piloto sério).
- Não apagar o bucket manualmente no dashboard.
- Documentos na BD têm `is_active`; remoção lógica antes de apagar ficheiros (quando implementado).

---

## Código principal

| Ficheiro | Função |
|----------|--------|
| `backend/src/services/storage/contabil-storage.service.js` | Upload/download/delete |
| `backend/src/modules/documents/documents.service.js` | Download com permissões |
| `backend/src/modules/firm/firm-branding.service.js` | Logótipo |
| `backend/src/middlewares/upload.middleware.js` | Multer + magic bytes |
