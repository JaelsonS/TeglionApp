/**
 * Carrega o Google Identity Services + Picker sob pedido (Fase I — ver plan
 * file da sessão, v3 secção M) e devolve o ficheiro escolhido pelo staff no
 * seu próprio Drive. Scope `drive.file`: o Google só concede acesso ao
 * ficheiro escolhido através deste picker, nunca ao Drive inteiro — o
 * access_token é efémero (vive só nesta aba), nunca é guardado no Teglion.
 */

type TokenResponse = { access_token?: string; error?: string }
type TokenClient = { requestAccessToken: (opts?: { prompt?: string }) => void }
type PickerDoc = { id: string; name: string }
type PickerResponse = { action: string; docs?: PickerDoc[] }
type PickerInstance = { setVisible: (visible: boolean) => void }
type PickerBuilder = {
  addView: (view: string) => PickerBuilder
  setOAuthToken: (token: string) => PickerBuilder
  setDeveloperKey: (key: string) => PickerBuilder
  setCallback: (cb: (data: PickerResponse) => void) => PickerBuilder
  build: () => PickerInstance
}

type GoogleGlobal = {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string
        scope: string
        callback: (response: TokenResponse) => void
      }) => TokenClient
    }
  }
  picker: {
    PickerBuilder: new () => PickerBuilder
    ViewId: { DOCS: string }
    Action: { PICKED: string; CANCEL: string }
  }
}

declare global {
  interface Window {
    google?: GoogleGlobal
    gapi?: { load: (api: string, callback: () => void) => void }
  }
}

const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file'

const loadedScripts = new Map<string, Promise<void>>()

function loadScript(src: string): Promise<void> {
  const cached = loadedScripts.get(src)
  if (cached) return cached
  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Falha ao carregar ${src}`))
    document.head.appendChild(script)
  })
  loadedScripts.set(src, promise)
  return promise
}

async function ensureGoogleScripts(): Promise<void> {
  await Promise.all([
    loadScript('https://accounts.google.com/gsi/client'),
    loadScript('https://apis.google.com/js/api.js'),
  ])
  await new Promise<void>((resolve) => window.gapi!.load('picker', () => resolve()))
}

export type PickedDriveFile = { fileId: string; fileName: string; accessToken: string }

/** Abre o fluxo completo (autorização + picker) e devolve o ficheiro escolhido, ou null se o staff cancelar. */
export async function openGoogleDrivePicker({
  apiKey,
  clientId,
}: {
  apiKey: string
  clientId: string
}): Promise<PickedDriveFile | null> {
  await ensureGoogleScripts()
  const google = window.google
  if (!google) throw new Error('Google Identity Services não carregou')

  const accessToken = await new Promise<string>((resolve, reject) => {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_FILE_SCOPE,
      callback: (response: TokenResponse) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error || 'Autorização Google cancelada'));
          return
        }
        resolve(response.access_token)
      },
    })
    tokenClient.requestAccessToken({ prompt: '' })
  })

  return new Promise<PickedDriveFile | null>((resolve, reject) => {
    try {
      const picker = new google.picker.PickerBuilder()
        .addView(google.picker.ViewId.DOCS)
        .setOAuthToken(accessToken)
        .setDeveloperKey(apiKey)
        .setCallback((data: PickerResponse) => {
          if (data.action === google.picker.Action.PICKED && data.docs?.[0]) {
            resolve({ fileId: data.docs[0].id, fileName: data.docs[0].name, accessToken })
          } else if (data.action === google.picker.Action.CANCEL) {
            resolve(null)
          }
        })
        .build()
      picker.setVisible(true)
    } catch (err) {
      reject(err instanceof Error ? err : new Error('Falha ao abrir o Google Picker'))
    }
  })
}
