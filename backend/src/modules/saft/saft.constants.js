const INTERNAL_DISCLAIMER =
  'Leitura interna no Teglion: SAF-T PT (.xml/.zip) ou folha Excel (.xlsx sem macros). Extrai metadados/totais em memória — o ficheiro não é guardado, não há download de URLs, não se executam fórmulas nem macros, e nada é enviado à AT. Não substitui software certificado nem o XSD oficial.';

const MAX_SAFT_UPLOAD_BYTES = 25 * 1024 * 1024;

module.exports = {
  INTERNAL_DISCLAIMER,
  MAX_SAFT_UPLOAD_BYTES,
};
