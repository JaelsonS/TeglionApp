export const CLIENTS_CSV_IMPORT_OPEN_EVENT = 'teglion:clients-csv-import-open'

export function openClientsCsvImport() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(CLIENTS_CSV_IMPORT_OPEN_EVENT))
}
