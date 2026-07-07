/**
 * Utilitários para filtros PostgREST/Supabase (.or, .ilike).
 * Escapa metacaracteres que permitem manipular a gramática do filtro.
 */

/** Caracteres especiais em filtros PostgREST: vírgula, ponto, parênteses, percent, underscore. */
function escapePostgrestIlikeValue(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/\./g, '\\.')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

/**
 * Monta cláusula .or() segura para busca ilike em múltiplas colunas.
 * @param {string[]} columns - nomes de coluna (controlados pelo código, não pelo utilizador)
 * @param {string} search - termo de pesquisa do utilizador
 */
function buildIlikeOrFilter(columns, search) {
  const term = escapePostgrestIlikeValue(String(search || '').trim());
  if (!term) return null;
  const pattern = `%${term}%`;
  return columns.map((col) => `${col}.ilike.${pattern}`).join(',');
}

module.exports = {
  escapePostgrestIlikeValue,
  buildIlikeOrFilter,
};
