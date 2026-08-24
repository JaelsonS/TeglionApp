-- Posicionamento reversível de imagem de serviço, ROADMAP Fase 2. `image_url` (coluna já
-- existente) fica como "imagem efetiva" (compatibilidade com serviços antigos, cujo
-- recorte já foi assado nos pixels no momento do upload -- nada muda para eles). Serviços
-- novos guardam também a imagem original (sem recorte) + ponto focal + zoom, e a renderização
-- (admin e página pública) aplica isso via CSS (object-position/transform-origin), nunca
-- reprocessando pixel. Sem dado de posição -> comportamento idêntico ao de hoje (object-cover
-- centrado). Ver ADR-0010.

ALTER TABLE public.accounting_services
  ADD COLUMN IF NOT EXISTS image_original_url TEXT,
  ADD COLUMN IF NOT EXISTS image_focus_x NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS image_focus_y NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS image_zoom NUMERIC(4,2);

ALTER TABLE public.accounting_services
  DROP CONSTRAINT IF EXISTS accounting_services_image_focus_x_check,
  DROP CONSTRAINT IF EXISTS accounting_services_image_focus_y_check,
  DROP CONSTRAINT IF EXISTS accounting_services_image_zoom_check;

ALTER TABLE public.accounting_services
  ADD CONSTRAINT accounting_services_image_focus_x_check CHECK (image_focus_x IS NULL OR (image_focus_x >= 0 AND image_focus_x <= 100)),
  ADD CONSTRAINT accounting_services_image_focus_y_check CHECK (image_focus_y IS NULL OR (image_focus_y >= 0 AND image_focus_y <= 100)),
  ADD CONSTRAINT accounting_services_image_zoom_check CHECK (image_zoom IS NULL OR (image_zoom >= 1 AND image_zoom <= 2.5));

COMMENT ON COLUMN public.accounting_services.image_original_url IS
  'Storage key da imagem original, sem recorte. NULL para serviços criados antes desta migration (só têm image_url, já recortada).';
COMMENT ON COLUMN public.accounting_services.image_focus_x IS 'Ponto focal horizontal (0-100), usado como object-position/transform-origin.';
COMMENT ON COLUMN public.accounting_services.image_focus_y IS 'Ponto focal vertical (0-100).';
COMMENT ON COLUMN public.accounting_services.image_zoom IS 'Fator de zoom (1.0-2.5) aplicado via CSS transform, centrado no ponto focal.';

-- Rollback (documentação):
-- ALTER TABLE public.accounting_services
--   DROP COLUMN IF EXISTS image_original_url,
--   DROP COLUMN IF EXISTS image_focus_x,
--   DROP COLUMN IF EXISTS image_focus_y,
--   DROP COLUMN IF EXISTS image_zoom;
