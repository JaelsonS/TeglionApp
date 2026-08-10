-- Fase 1b — encriptação de service_inquiries.answers (ver especificação da sessão, v8).
--
-- As respostas do formulário público podem conter dados pessoais sensíveis
-- (NIF, situação familiar/financeira) definidos livremente pela contabilista —
-- o Teglion não pode saber de antemão quais perguntas são "sensíveis" sem lhe
-- dar mais uma coisa para configurar. Por isso encripta-se o blob inteiro
-- (enc:v1, AES-256-GCM já usado por backend/src/utils/crypto-fields.js), não
-- campo a campo.
--
-- Aditiva e não-destrutiva: a coluna `answers` (JSONB, texto plano) FICA —
-- não é apagada nesta migration. `answers_enc` é nova; o código passa a
-- escrever só nela a partir de agora. Se já existirem linhas reais com
-- `answers` em produção (a confirmar), ficam legíveis pelo código (que sabe
-- ler as duas formas) até uma migração de dados dedicada as converter — só
-- depois disso faz sentido uma migration futura a remover a coluna antiga.

ALTER TABLE public.service_inquiries
  ADD COLUMN IF NOT EXISTS answers_enc TEXT;

-- ============================================================
-- Down-migration (não executado automaticamente — rollback manual):
--
-- ALTER TABLE public.service_inquiries DROP COLUMN IF EXISTS answers_enc;
-- ============================================================
