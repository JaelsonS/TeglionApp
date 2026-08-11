-- v9 — Website + Booking Builder (ver plan file da sessão, v9). Introduz o
-- modelo de rascunho/publicação da página pública do escritório, separado de
-- firms.settings porque esse caminho de escrita ("ler o blob inteiro →
-- substituir uma chave → gravar o blob inteiro") não tem atomicidade por
-- chave nem concorrência optimista — um website builder gera muito mais
-- tráfego de escrita (guardar rascunho a cada sessão de edição) do que o
-- botão único "Guardar" que existia até agora, e colidiria com escritas
-- concorrentes a settings.contact/booking/quotePdf/etc. feitas noutro
-- separador. Uma tabela dedicada isola esse tráfego por completo.
--
-- draft/published partilham o mesmo esquema JSON (ver PublicSiteConfig no
-- frontend) — theme, images, sections[] com content por secção. published
-- começa NULL: a página pública cai para o fallback do endpoint (traduzir
-- firms.settings.publicProfile/branding em tempo real) até à primeira
-- publicação real, nunca fica com uma página em branco.
--
-- preview_token/preview_token_expires_at dão à contabilista um link
-- "Pré-visualizar" real e partilhável (não indexável, serve draft em vez de
-- published) sem expor o rascunho a quem não tem o token.

CREATE TABLE IF NOT EXISTS public.firm_public_sites (
  firm_id UUID PRIMARY KEY REFERENCES public.firms(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL DEFAULT 'default',
  schema_version INT NOT NULL DEFAULT 1,
  draft JSONB NOT NULL DEFAULT '{}'::jsonb,
  published JSONB,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  preview_token TEXT,
  preview_token_expires_at TIMESTAMPTZ,
  draft_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  draft_updated_by UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_firm_public_sites_preview_token
  ON public.firm_public_sites (preview_token) WHERE preview_token IS NOT NULL;

-- RLS — mesmo padrão decorativo/defesa-em-profundidade de todo o resto do
-- schema (backend usa service_role, que ignora RLS; a fronteira real de
-- isolamento é o firm_id explícito em cada query da aplicação — ver
-- SECURITY.md). Mantido por consistência.
ALTER TABLE public.firm_public_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY firm_public_sites_firm ON public.firm_public_sites
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());

-- Rollback (não executável, documentação apenas):
-- DROP TABLE IF EXISTS public.firm_public_sites;
