-- ContaBil — bucket de documentos (isolamento por escritório/cliente)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contabil-documents',
  'contabil-documents',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Staff do escritório: acesso a ficheiros do seu firm_id
DROP POLICY IF EXISTS contabil_docs_firm_staff_select ON storage.objects;
CREATE POLICY contabil_docs_firm_staff_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'contabil-documents'
    AND public.is_firm_staff()
    AND (storage.foldername(name))[1] = 'firm'
    AND (storage.foldername(name))[2] = public.current_firm_id()::text
  );

DROP POLICY IF EXISTS contabil_docs_firm_staff_insert ON storage.objects;
CREATE POLICY contabil_docs_firm_staff_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'contabil-documents'
    AND public.is_firm_staff()
    AND (storage.foldername(name))[1] = 'firm'
    AND (storage.foldername(name))[2] = public.current_firm_id()::text
  );

DROP POLICY IF EXISTS contabil_docs_firm_staff_delete ON storage.objects;
CREATE POLICY contabil_docs_firm_staff_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'contabil-documents'
    AND public.is_firm_staff()
    AND (storage.foldername(name))[1] = 'firm'
    AND (storage.foldername(name))[2] = public.current_firm_id()::text
  );

-- Cliente: apenas os seus ficheiros
DROP POLICY IF EXISTS contabil_docs_client_select ON storage.objects;
CREATE POLICY contabil_docs_client_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'contabil-documents'
    AND public.is_client_user()
    AND (storage.foldername(name))[1] = 'firm'
    AND (storage.foldername(name))[2] = public.current_firm_id()::text
    AND (storage.foldername(name))[3] = 'clients'
    AND (storage.foldername(name))[4] = public.current_client_id()::text
  );

DROP POLICY IF EXISTS contabil_docs_client_insert ON storage.objects;
CREATE POLICY contabil_docs_client_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'contabil-documents'
    AND public.is_client_user()
    AND (storage.foldername(name))[1] = 'firm'
    AND (storage.foldername(name))[2] = public.current_firm_id()::text
    AND (storage.foldername(name))[3] = 'clients'
    AND (storage.foldername(name))[4] = public.current_client_id()::text
  );
