import type { RentReceipt } from '@/infrastructure/api/contabil/rentals'
import {
  MONTH_SHORT,
  formatEuroFromCents,
  receiptLabelPt,
} from '@/features/firm/rentals/rentalsFormat'

function escapeHtml(s: string) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function monthLabel(yearMonth: string) {
  const [y, m] = yearMonth.split('-').map(Number)
  return `${MONTH_SHORT[(m || 1) - 1] || yearMonth} ${y}`
}

function methodLabel(
  id: string | null | undefined,
  methods: Array<{ id: string; label: string }>,
) {
  if (!id) return '—'
  return methods.find((x) => x.id === id)?.label || id
}

export type InternalRentReceiptInput = {
  receipt: RentReceipt
  propertyLabel: string
  landlordName: string
  landlordTaxId?: string | null
  tenantName: string
  tenantNif?: string | null
  firmName: string
  firmLogoUrl?: string | null
  paymentMethods: Array<{ id: string; label: string }>
}

function printHtmlDocument(html: string): boolean {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('title', 'Recibo interno de renda')
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
  window.setTimeout(() => {
    try {
      win.focus()
      win.print()
    } finally {
      window.setTimeout(() => iframe.remove(), 1500)
    }
  }, 400)
  return true
}

/** Recibo interno de renda — não é documento oficial AT / Portal das Finanças. */
export function printInternalRentReceipt(input: InternalRentReceiptInput) {
  const {
    receipt,
    propertyLabel,
    landlordName,
    landlordTaxId,
    tenantName,
    tenantNif,
    firmName,
    firmLogoUrl,
    paymentMethods,
  } = input

  const receiptNo = `RR-${receipt.yearMonth.replace('-', '')}-${String(receipt.id).slice(0, 8).toUpperCase()}`
  const issuedAt = new Date().toLocaleString('pt-PT', { dateStyle: 'long', timeStyle: 'short' })
  const paidAt = receipt.paidAt
    ? new Date(receipt.paidAt).toLocaleDateString('pt-PT', { dateStyle: 'long' })
    : '—'
  const dueAt = receipt.dueDate
    ? new Date(receipt.dueDate).toLocaleDateString('pt-PT', { dateStyle: 'long' })
    : '—'
  const amount = formatEuroFromCents(receipt.amountCents)
  const status = receiptLabelPt(receipt.status, receipt.overdue)
  const method = methodLabel(receipt.paymentMethod, paymentMethods)
  const logo = firmLogoUrl
    ? `<img src="${escapeHtml(firmLogoUrl)}" alt="" style="max-height:56px;max-width:180px;object-fit:contain" />`
    : ''

  const html = `<!DOCTYPE html>
<html lang="pt"><head><meta charset="utf-8" />
<title>Recibo interno de renda · ${escapeHtml(receiptNo)}</title>
<style>
@page{size:A4;margin:18mm}
*{box-sizing:border-box}
body{margin:0;font-family:"Segoe UI",system-ui,-apple-system,sans-serif;color:#0f172a;background:#fff}
.sheet{position:relative;min-height:240mm;padding:8mm 4mm;overflow:hidden}
.watermark{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:0}
.watermark span{transform:rotate(-32deg);font-size:36px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:rgba(15,23,42,.06);white-space:nowrap;border:4px solid rgba(15,23,42,.06);padding:16px 24px;border-radius:12px}
.content{position:relative;z-index:1}
.banner{display:inline-block;margin-bottom:14px;padding:6px 12px;border-radius:999px;background:#0f172a;color:#fff;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.head{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;border-bottom:2px solid #0f172a;padding-bottom:18px;margin-bottom:22px}
.firm-name{margin:8px 0 0;font-size:20px;font-weight:700}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:22px}
.box{border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;background:#f8fafc}
.box h2{margin:0 0 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b}
.box p{margin:0 0 6px;font-size:14px;line-height:1.45}
.amount{border:2px solid #0f172a;border-radius:14px;padding:18px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:22px}
.amount .value{font-size:28px;font-weight:800;font-variant-numeric:tabular-nums}
table{width:100%;border-collapse:collapse;margin-bottom:22px;font-size:13px}
th,td{border-bottom:1px solid #e2e8f0;padding:10px 8px;text-align:left}
th{width:34%;color:#64748b;font-weight:600;font-size:12px;text-transform:uppercase}
.disclaimer{border-top:1px solid #e2e8f0;padding-top:16px;font-size:11px;line-height:1.55;color:#64748b}
.disclaimer strong{color:#0f172a}
.signatures{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:48px}
.sig{border-top:1px solid #94a3b8;padding-top:8px;font-size:12px;color:#64748b;text-align:center}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="sheet">
  <div class="watermark" aria-hidden="true"><span>Recibo interno</span></div>
  <div class="content">
    <div class="banner">Recibo interno de renda · não é documento AT</div>
    <div class="head">
      <div>${logo}<p class="firm-name">${escapeHtml(firmName || 'Gabinete')}</p>
        <p style="margin:6px 0 0;font-size:12px;color:#64748b">Controlo interno · imóveis e rendas</p></div>
      <div style="text-align:right">
        <p style="margin:0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b">Recibo interno</p>
        <p style="margin:6px 0 0;font-size:18px;font-weight:700">${escapeHtml(receiptNo)}</p>
        <p style="margin:8px 0 0;font-size:12px;color:#64748b">Emitido ${escapeHtml(issuedAt)}</p>
      </div>
    </div>
    <div class="grid">
      <div class="box"><h2>Senhorio (cliente)</h2>
        <p><strong>${escapeHtml(landlordName)}</strong></p>
        <p>NIF ${escapeHtml(landlordTaxId || '—')}</p>
        <p>${escapeHtml(propertyLabel)}</p></div>
      <div class="box"><h2>Inquilino</h2>
        <p><strong>${escapeHtml(tenantName)}</strong></p>
        <p>NIF ${escapeHtml(tenantNif || '—')}</p></div>
    </div>
    <div class="amount">
      <div><div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b">Valor</div>
        <div style="margin-top:4px;font-size:13px;color:#64748b">Período ${escapeHtml(monthLabel(receipt.yearMonth))}</div></div>
      <div class="value">${escapeHtml(amount)}</div>
    </div>
    <table><tbody>
      <tr><th>Referência</th><td>${escapeHtml(receiptNo)}</td></tr>
      <tr><th>Período</th><td>${escapeHtml(monthLabel(receipt.yearMonth))} (${escapeHtml(receipt.yearMonth)})</td></tr>
      <tr><th>Estado</th><td>${escapeHtml(status)}</td></tr>
      <tr><th>Método</th><td>${escapeHtml(method)}</td></tr>
      <tr><th>Vencimento</th><td>${escapeHtml(dueAt)}</td></tr>
      <tr><th>Pagamento</th><td>${escapeHtml(paidAt)}</td></tr>
    </tbody></table>
    ${
      receipt.notes
        ? `<div style="border:1px dashed #cbd5e1;border-radius:12px;padding:14px 16px;margin-bottom:22px;font-size:13px;white-space:pre-wrap"><strong>Notas:</strong>\n${escapeHtml(receipt.notes)}</div>`
        : ''
    }
    <div class="disclaimer">
      <p style="margin:0 0 8px"><strong>Atenção — recibo interno.</strong> Documento só para controlo do gabinete sobre rendas do cliente.</p>
      <p style="margin:0">Não substitui o recibo de renda do Portal das Finanças, nem comunicação à AT, nem qualquer documento fiscal certificado.</p>
    </div>
    <div class="signatures"><div class="sig">O gabinete</div><div class="sig">O senhorio / inquilino (opcional)</div></div>
  </div>
</div>
</body></html>`

  return printHtmlDocument(html)
}
