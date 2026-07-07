export const AUTH_THEME_PATH_PREFIXES = [
  '/auth/firm/login',
  '/auth/firm/register',
  '/auth/firm/register/google',
  '/auth/client/login',
  '/auth/client/register',
  '/login-firm',
  '/login-client',
  '/register-firm',
] as const

export const AUTH_THEME_STORAGE_KEY = 'contabil-auth-theme'

export function pathnameUsesAuthTheme(pathname: string) {
  const path = pathname || ''
  return AUTH_THEME_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
}

export function applyAuthThemeToDocument(theme: 'light' | 'dark') {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
  } else {
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
  }
}
