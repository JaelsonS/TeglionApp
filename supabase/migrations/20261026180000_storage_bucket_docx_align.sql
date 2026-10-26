-- Produção ainda tinha o bucket antigo (10 MB, sem Word/GIF/ZIP).
-- Alinha com a API (upload.middleware ALLOWED_MIMES) e com 20261003000000.
UPDATE storage.buckets
SET
  file_size_limit = 26214400,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed'
  ]::text[]
WHERE id = 'contabil-documents';
