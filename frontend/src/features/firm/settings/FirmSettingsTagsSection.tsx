import { Tag } from 'lucide-react'

import { FirmTagsManager } from '@/features/firm/tags/FirmTagsManager'

export function FirmSettingsTagsSection() {
  return (
    <section className="cb-settings-panel">
      <div className="cb-settings-panel-hd">
        <span className="cb-settings-panel-icon">
          <Tag className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h3 className="cb-settings-panel-title">Etiquetas do escritório</h3>
          <p className="cb-settings-panel-sub">
            Biblioteca única — use em clientes, leads, solicitações e equipa
          </p>
        </div>
      </div>
      <div className="px-1 pb-1 pt-3 sm:px-2">
        <FirmTagsManager />
      </div>
    </section>
  )
}
