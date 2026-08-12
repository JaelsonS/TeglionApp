/* Consent Mode: analytics denied até o utilizador aceitar cookies (carregado via <script src>). */
window.dataLayer = window.dataLayer || []
function gtag() {
  // eslint-disable-next-line prefer-rest-params
  dataLayer.push(arguments)
}
gtag('js', new Date())
gtag('consent', 'default', {
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500,
})
gtag('config', 'G-JHXZ25T7FJ')
