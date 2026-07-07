import { useRef, useState } from 'react'
import { FileUp, ImagePlus, Loader2 } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

type Props = {
  onFiles: (files: File[]) => void
  accept?: string
  multiple?: boolean
  loading?: boolean
  label?: string
  hint?: string
  className?: string
}

export function UploadDropzone({
  onFiles,
  accept = 'image/*,application/pdf',
  multiple = true,
  loading = false,
  label = 'Arrastar ficheiros ou clicar para anexar',
  hint = 'Imagens ou PDF',
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  function handleFiles(list: FileList | null) {
    if (!list?.length) return
    onFiles(Array.from(list))
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)
        handleFiles(e.dataTransfer.files)
      }}
      className={cn(
        'cb-upload-zone min-h-[120px]',
        drag && 'cb-upload-zone-active',
        loading && 'pointer-events-none opacity-60',
        className,
      )}
    >
      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      ) : (
        <>
          <div className="flex gap-2 text-primary">
            <ImagePlus className="h-6 w-6" />
            <FileUp className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
