/** Limite de upload alinhado com o backend (MAX_FILE_SIZE_MB / Teglion 25 MB). */
export const MAX_UPLOAD_MB = Number(import.meta.env.VITE_MAX_FILE_SIZE_MB) || 25
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024

export function validateUploadFileSize(file: File): string | null {
  if (file.size <= MAX_UPLOAD_BYTES) return null
  const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
  return `O ficheiro «${file.name}» tem ${sizeMb} MB. O limite é ${MAX_UPLOAD_MB} MB.`
}
