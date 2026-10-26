import type { FeeCharge } from '@/infrastructure/api/contabil/feeCharges'
import { MONTH_SHORT, formatEuroFromCents, statusLabelPt } from '@/features/firm/payments/paymentsFormat'

function escapeHtml(s: string) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function monthLabel(yearMonth: string) {
  const [y, m] = yearMonth.split('-').map(Number)
  const name = MONTH_SHORT[(m || 1) - 1] || yearMonth
  return `${name} ${y}`
}

function methodLabel(
  id: string | null | undefined,
  methods: Array<{ id: string; label: string }>,
) {
  if (!id) return '—'
  return methods.find((m) => m.id === id)?.label || id
}

export type InternalReceiptInput = {
  charge: FeeCharge
  clientName: string
  clientTaxId?: string | null
  firmName: string
  firmLogoUrl?: string | null
  paymentMethods: Array<{ id: string; label: string }>
}

/** Imprime via iframe oculto — evita pop-up / about:blank / noopener null. */
function printHtmlDocument(html: string): boolean {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('title', 'Recibo interno')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none'
  document.body.appendChild(iframe)

  const win = iframe.contentWindow
  const doc = win?.document
  if (!win || !doc) {
    iframe.remove()
    return false
  }

  doc.open()
  doc.write(html)
  doc.close()

  const cleanup = () => {
    try {
      iframe.remove()
    } catch {
      /* ignore */
    }
  }

  const triggerPrint = () => {
    try {
      win.focus()
      win.print()
    } finally {
      // Dar tempo ao diálogo de impressão antes de remover o iframe
      window.setTimeout(cleanup, 1500)
    }
  }

  // Imagens (logo) podem atrasar o layout
  window.setTimeout(triggerPrint, 400)
  return true
}

/**
 * Abre o diálogo de impressão com recibo interno completo.
 * Não é fatura AT — controlo do gabinete.
 */
export function printInternalFeeReceipt(input: InternalReceiptInput) {
  const { charge, clientName, clientTaxId, firmName, firmLogoUrl, paymentMethods } = input

  const receiptNo = `RI-${charge.yearMonth.replace('-', '')}-${String(charge.id).slice(0, 8).toUpperCase()}`
  const issuedAt = new Date().toLocaleString('pt-PT', {
    dateStyle: 'long',
    timeStyle: 'short',
  })
  const paidAt = charge.paidAt
    ? new Date(charge.paidAt).toLocaleDateString('pt-PT', { dateStyle: 'long' })
    : '—'
  const dueAt = charge.dueDate
    ? new Date(charge.dueDate).toLocaleDateString('pt-PT', { dateStyle: 'long' })
    : '—'
  const amount = formatEuroFromCents(charge.amountCents)
  const status = statusLabelPt(charge.status, charge.overdue)
  const method = methodLabel(charge.paymentMethod, paymentMethods)
  const logo = firmLogoUrl
    ? `<img src="${escapeHtml(firmLogoUrl)}" alt="" style="max-height:56px;max-width:180px;object-fit:contain" />`
    : ''

  const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <title>Recibo interno · ${escapeHtml(receiptNo)}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      color: #0f172a;
      background: #fff;
    }
    .sheet {
      position: relative;
      min-height: 240mm;
      padding: 8mm 4mm;
      overflow: hidden;
    }
    .watermark {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 0;
    }
    .watermark span {
      transform: rotate(-32deg);
      font-size: 42px;
      font-weight: 800;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: rgba(15, 23, 42, 0.06);
      white-space: nowrap;
      border: 4px solid rgba(15, 23, 42, 0.06);
      padding: 18px 28px;
      border-radius: 12px;
    }
    .content { position: relative; z-index: 1; }
    .banner {
      display: inline-block;
      margin-bottom: 14px;
      padding: 6px 12px;
      border-radius: 999px;
      background: #0f172a;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .head {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 18px;
      margin-bottom: 22px;
    }
    .firm-name {
      margin: 8px 0 0;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .doc-title {
      margin: 0;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
      text-align: right;
    }
    .doc-no {
      margin: 6px 0 0;
      font-size: 18px;
      font-weight: 700;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      margin-bottom: 22px;
    }
    .box {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 16px;
      background: #f8fafc;
    }
    .box h2 {
      margin: 0 0 10px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
    }
    .box p { margin: 0 0 6px; font-size: 14px; line-height: 1.45; }
    .box p:last-child { margin-bottom: 0; }
    .amount {
      border: 2px solid #0f172a;
      border-radius: 14px;
      padding: 18px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 22px;
    }
    .amount .label {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
    }
    .amount .value {
      font-size: 28px;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.03em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 22px;
      font-size: 13px;
    }
    th, td {
      border-bottom: 1px solid #e2e8f0;
      padding: 10px 8px;
      text-align: left;
      vertical-align: top;
    }
    th {
      width: 34%;
      color: #64748b;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .notes {
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 22px;
      font-size: 13px;
      white-space: pre-wrap;
      color: #334155;
    }
    .disclaimer {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      font-size: 11px;
      line-height: 1.55;
      color: #64748b;
    }
    .disclaimer strong { color: #0f172a; }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 48px;
    }
    .sig {
      border-top: 1px solid #94a3b8;
      padding-top: 8px;
      font-size: 12px;
      color: #64748b;
      text-align: center;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="watermark" aria-hidden="true"><span>Recibo interno</span></div>
    <div class="content">
      <div class="banner">Recibo interno · não é fatura AT</div>
      <div class="head">
        <div>
          ${logo}
          <p class="firm-name">${escapeHtml(firmName || 'Gabinete')}</p>
          <p style="margin:6px 0 0;font-size:12px;color:#64748b">Controlo interno de honorários / avenças</p>
        </div>
        <div>
          <p class="doc-title">Recibo interno</p>
          <p class="doc-no">${escapeHtml(receiptNo)}</p>
          <p style="margin:8px 0 0;font-size:12px;color:#64748b;text-align:right">Emitido ${escapeHtml(issuedAt)}</p>
        </div>
      </div>

      <div class="grid">
        <div class="box">
          <h2>Emitido por</h2>
          <p><strong>${escapeHtml(firmName || 'Gabinete')}</strong></p>
          <p>Documento interno do escritório</p>
        </div>
        <div class="box">
          <h2>Recebido de</h2>
          <p><strong>${escapeHtml(clientName)}</strong></p>
          <p>NIF ${escapeHtml(clientTaxId || '—')}</p>
        </div>
      </div>

      <div class="amount">
        <div>
          <div class="label">Valor do recibo</div>
          <div style="margin-top:4px;font-size:13px;color:#64748b">Período ${escapeHtml(monthLabel(charge.yearMonth))}</div>
        </div>
        <div class="value">${escapeHtml(amount)}</div>
      </div>

      <table>
        <tbody>
          <tr><th>Referência</th><td>${escapeHtml(receiptNo)}</td></tr>
          <tr><th>Período da avença</th><td>${escapeHtml(monthLabel(charge.yearMonth))} (${escapeHtml(charge.yearMonth)})</td></tr>
          <tr><th>Estado</th><td>${escapeHtml(status)}</td></tr>
          <tr><th>Método</th><td>${escapeHtml(method)}</td></tr>
          <tr><th>Data de vencimento</th><td>${escapeHtml(dueAt)}</td></tr>
          <tr><th>Data de pagamento</th><td>${escapeHtml(paidAt)}</td></tr>
          <tr><th>Moeda</th><td>${escapeHtml(charge.currency || 'EUR')}</td></tr>
        </tbody>
      </table>

      ${
        charge.notes
          ? `<div class="notes"><strong>Notas:</strong>\n${escapeHtml(charge.notes)}</div>`
          : ''
      }

      <div class="disclaimer">
        <p style="margin:0 0 8px"><strong>Atenção — recibo interno.</strong> Este documento serve apenas para controlo interno do gabinete sobre honorários / avenças do cliente.</p>
        <p style="margin:0">Não substitui fatura, fatura-recibo ou qualquer documento fiscal certificado pela Autoridade Tributária. Não constitui prova fiscal perante a AT nem substitui as obrigações legais de faturação.</p>
      </div>

      <div class="signatures">
        <div class="sig">O gabinete</div>
        <div class="sig">O cliente (opcional)</div>
      </div>
    </div>
  </div>
</body>
</html>`

  return printHtmlDocument(html)
}
