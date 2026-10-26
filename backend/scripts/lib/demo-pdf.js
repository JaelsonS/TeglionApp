/**
 * PDF mínimo válido (1 página A4) com texto Latin-1 — abre em browsers/Acrobat.
 * Sem dependências externas.
 */

function escapePdfString(text) {
  let out = '';
  for (const ch of String(text || '')) {
    const code = ch.charCodeAt(0);
    if (ch === '\\' || ch === '(' || ch === ')') {
      out += `\\${ch}`;
    } else if (code >= 32 && code <= 126) {
      out += ch;
    } else if (code > 126 && code <= 255) {
      out += `\\${code.toString(8).padStart(3, '0')}`;
    } else {
      // fora de Latin-1 — aproximação ASCII
      out += '?';
    }
  }
  return out;
}

function wrapLines(text, maxLen = 78) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxLen && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

/**
 * @param {{ title: string, subtitle?: string, lines?: string[], footer?: string }} opts
 * @returns {Buffer}
 */
function buildDemoPdf(opts = {}) {
  const title = opts.title || 'Documento de demonstração';
  const subtitle = opts.subtitle || 'Teglion · Ambiente de staging';
  const bodyLines = (opts.lines || []).flatMap((l) => wrapLines(l, 82));
  const footer = opts.footer || 'Ficheiro de exemplo — conteúdo fictício para UAT.';

  const contentOps = [];
  let y = 780;

  contentOps.push('BT');
  contentOps.push('/F1 18 Tf');
  contentOps.push('0.08 0.22 0.36 rg');
  contentOps.push(`50 ${y} Td`);
  contentOps.push(`(${escapePdfString(title)}) Tj`);
  y -= 28;

  contentOps.push('/F1 11 Tf');
  contentOps.push('0.35 0.4 0.45 rg');
  contentOps.push(`0 -22 Td`);
  contentOps.push(`(${escapePdfString(subtitle)}) Tj`);
  y -= 22;

  contentOps.push('0.12 0.14 0.18 rg');
  contentOps.push('/F1 10 Tf');
  let firstBody = true;
  for (const line of bodyLines) {
    contentOps.push(firstBody ? '0 -28 Td' : '0 -14 Td');
    contentOps.push(`(${escapePdfString(line)}) Tj`);
    firstBody = false;
    y -= firstBody ? 28 : 14;
  }

  contentOps.push('/F1 9 Tf');
  contentOps.push('0.45 0.48 0.52 rg');
  contentOps.push(`0 -${Math.max(36, y - 80)} Td`);
  contentOps.push(`(${escapePdfString(footer)}) Tj`);
  contentOps.push('ET');

  const stream = `${contentOps.join('\n')}\n`;
  const streamLen = Buffer.byteLength(stream, 'latin1');

  const objects = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  objects.push(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
  );
  objects.push(`4 0 obj\n<< /Length ${streamLen} >>\nstream\n${stream}endstream\nendobj\n`);
  objects.push(
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n',
  );

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += obj;
  }
  const xrefPos = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefPos}\n%%EOF\n`;

  return Buffer.from(pdf, 'latin1');
}

module.exports = { buildDemoPdf, escapePdfString };
