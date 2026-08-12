/**
 * Interpola tokens de ano no nome/descrição de um Service, para a contabilista
 * nunca ter de recriar ou reeditar manualmente "IRS 2026" -> "IRS 2027" todo
 * o ano — escreve o token uma vez, o sistema resolve sempre o ano certo em
 * cada leitura pública (nunca gravado interpolado na base de dados).
 *
 * {{ano}} — ano civil actual.
 * {{ano_fiscal}} — ano a que respeitam os rendimentos a declarar (em
 * Portugal, a campanha de IRS de um ano N entrega sempre os rendimentos de
 * N-1 — ex.: em 2026 entrega-se o IRS de 2025).
 *
 * Em HTML, a substituição só opera nos nós de texto (fora de tags), para
 * não corromper atributos ou markup.
 */
function replaceYearTokens(segment, year) {
  return String(segment)
    .replace(/\{\{\s*ano_fiscal\s*\}\}/gi, String(year - 1))
    .replace(/\{\{\s*ano\s*\}\}/gi, String(year));
}

function interpolateServiceTemplate(text, { now = new Date() } = {}) {
  if (!text) return text;
  const year = now.getFullYear();
  const str = String(text);
  if (!str.includes('<')) {
    return replaceYearTokens(str, year);
  }
  return str.replace(/(<[^>]*>)|([^<]+)/g, (match, tag, textNode) => {
    if (tag) return tag;
    return replaceYearTokens(textNode, year);
  });
}

module.exports = { interpolateServiceTemplate };
