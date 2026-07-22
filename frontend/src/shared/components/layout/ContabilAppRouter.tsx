/**
 * Router Teglion — produto contabilidade (firm + client + auth + landing).
 */
import { Suspense, lazy } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'

import { authProfileChoiceUrl } from '@/shared/constants/authPaths'
import { FIRM_APP_ROLES } from '@/shared/constants/contabilRoles'
import { PublicLandingRoute } from '@/shared/components/layout/PublicLandingRoute'
import { ProtectedRoute } from '@/shared/components/layout/ProtectedRoute'
import { RequireFirmAccess } from '@/shared/components/layout/RequireFirmAccess'
import { RequireRole } from '@/shared/components/layout/RequireRole'
import { RequireClientFirmAccess } from '@/shared/components/layout/RequireClientFirmAccess'
import { PageRouteFallback } from '@/shared/components/layout/PageRouteFallback'

const FirmLoginPage = lazy(() => import('@/features/auth/firm/FirmLoginPage').then((m) => ({ default: m.FirmLoginPage })))
const ClientLoginPage = lazy(() => import('@/features/auth/client/ClientLoginPage').then((m) => ({ default: m.ClientLoginPage })))
const FirmRegisterPage = lazy(() =>
  import('@/features/auth/firm/FirmRegisterPage').then((m) => ({ default: m.FirmRegisterPage })),
)
const FirmRegisterGooglePage = lazy(() =>
  import('@/features/auth/firm/FirmRegisterGooglePage').then((m) => ({ default: m.FirmRegisterGooglePage })),
)
const FirmInviteRegisterPage = lazy(() =>
  import('@/features/auth/firm/FirmInviteRegisterPage').then((m) => ({ default: m.FirmInviteRegisterPage })),
)
const FirmInviteEmailConfirmPage = lazy(() =>
  import('@/features/auth/firm/FirmInviteEmailConfirmPage').then((m) => ({ default: m.FirmInviteEmailConfirmPage })),
)
const AuthProfileChoicePage = lazy(() =>
  import('@/features/auth/AuthProfileChoicePage').then((m) => ({ default: m.AuthProfileChoicePage })),
)
const ClientRegisterPage = lazy(() =>
  import('@/features/auth/client/ClientRegisterPage').then((m) => ({ default: m.ClientRegisterPage })),
)
const ClientInviteRegisterPage = lazy(() =>
  import('@/features/auth/client/ClientInviteRegisterPage').then((m) => ({ default: m.ClientInviteRegisterPage })),
)
const ClientPortalLayout = lazy(() =>
  import('@/features/client/ClientPortalLayout').then((m) => ({ default: m.ClientPortalLayout })),
)
const RecoverPasswordPage = lazy(() => import('@/features/recover-password/RecoverPasswordPage').then((m) => ({ default: m.RecoverPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/features/reset-password/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })))
const TermosPage = lazy(() => import('@/features/termos/TermosPage').then((m) => ({ default: m.TermosPage })))
const PrivacidadePage = lazy(() => import('@/features/privacidade/PrivacidadePage').then((m) => ({ default: m.PrivacidadePage })))
const CookiesPage = lazy(() => import('@/features/cookies/CookiesPage').then((m) => ({ default: m.CookiesPage })))
const DpaPage = lazy(() => import('@/features/dpa/DpaPage').then((m) => ({ default: m.DpaPage })))
const AvisoLegalPage = lazy(() => import('@/features/aviso-legal/AvisoLegalPage').then((m) => ({ default: m.AvisoLegalPage })))

const PricingPage = lazy(() =>
  import('@/features/marketing/PricingPage').then((m) => ({ default: m.PricingPage })),
)
const CaseStudiesPage = lazy(() =>
  import('@/features/marketing/CaseStudiesPage').then((m) => ({ default: m.CaseStudiesPage })),
)
const SupportPage = lazy(() =>
  import('@/features/marketing/SupportPage').then((m) => ({ default: m.SupportPage })),
)
const FirmFiscalCalendarPage = lazy(() =>
  import('@/features/firm/FirmFiscalCalendarPage').then((m) => ({ default: m.FirmFiscalCalendarPage })),
)

const BlogLayout = lazy(() => import('@/features/blog/BlogLayout').then((m) => ({ default: m.BlogLayout })))
const BlogIndexPage = lazy(() => import('@/features/blog/BlogIndexPage').then((m) => ({ default: m.BlogIndexPage })))
const BlogPostPage = lazy(() => import('@/features/blog/BlogPostPage').then((m) => ({ default: m.BlogPostPage })))

const AppShell = lazy(() => import('@/features/app-shell/AppShell').then((m) => ({ default: m.AppShell })))

const FirmLayout = lazy(() => import('@/features/firm/FirmLayout').then((m) => ({ default: m.FirmLayout })))
const FirmSettingsPage = lazy(() =>
  import('@/features/firm/pages/FirmSettingsPage').then((m) => ({ default: m.FirmSettingsPage })),
)
const FirmMessagesPage = lazy(() =>
  import('@/features/firm/pages/FirmMessagesPage').then((m) => ({ default: m.FirmMessagesPage })),
)
const FirmAgendaPage = lazy(() => import('@/features/firm/pages/FirmAgendaPage').then((m) => ({ default: m.FirmAgendaPage })))
const FirmBillingPage = lazy(() =>
  import('@/features/firm/pages/FirmBillingPage').then((m) => ({ default: m.FirmBillingPage })),
)
const FirmDashboardPage = lazy(() => import('@/features/firm/pages/FirmDashboardPage').then((m) => ({ default: m.FirmDashboardPage })))
const FirmTasksPage = lazy(() =>
  import('@/features/firm/pages/FirmTasksWorkspacePage').then((m) => ({ default: m.FirmTasksWorkspacePage })),
)
const FirmDocumentsLayout = lazy(() =>
  import('@/features/firm/pages/FirmDocumentsLayout').then((m) => ({ default: m.FirmDocumentsLayout })),
)
const FormalRequestsModule = lazy(() =>
  import('@/features/firm/documents-hub/requests/FormalRequestsModule').then((m) => ({ default: m.FormalRequestsModule })),
)
const FirmFilesModule = lazy(() =>
  import('@/features/firm/documents-hub/files/FirmFilesModule').then((m) => ({ default: m.FirmFilesModule })),
)
const FirmDocumentsHistoryModule = lazy(() =>
  import('@/features/firm/documents-hub/history/FirmDocumentsHistoryModule').then((m) => ({
    default: m.FirmDocumentsHistoryModule,
  })),
)
const FirmClientsPage = lazy(() => import('@/features/firm/pages/FirmClientsPage').then((m) => ({ default: m.FirmClientsPage })))
const FirmClientHubPage = lazy(() =>
  import('@/features/firm/pages/FirmClientHubPage').then((m) => ({ default: m.FirmClientHubPage })),
)
const FirmServiceRequestsPage = lazy(() =>
  import('@/features/firm/pages/FirmServiceRequestsPage').then((m) => ({ default: m.FirmServiceRequestsPage })),
)
const FirmAlertsPage = lazy(() => import('@/features/firm/pages/FirmAlertsPage').then((m) => ({ default: m.FirmAlertsPage })))
const FirmNewsPage = lazy(() => import('@/features/firm/pages/FirmNewsPage').then((m) => ({ default: m.FirmNewsPage })))
const ClientDashboardPage = lazy(() =>
  import('@/features/client/pages/ClientDashboardPage').then((m) => ({ default: m.ClientDashboardPage })),
)
const ClientRequestsPage = lazy(() =>
  import('@/features/client/pages/ClientRequestsPage').then((m) => ({ default: m.ClientRequestsPage })),
)
const ClientMessagesPage = lazy(() =>
  import('@/features/client/pages/ClientMessagesPage').then((m) => ({ default: m.ClientMessagesPage })),
)
const ClientDocumentsPage = lazy(() =>
  import('@/features/client/pages/ClientDocumentsPage').then((m) => ({ default: m.ClientDocumentsPage })),
)
const ClientArchivePage = lazy(() =>
  import('@/features/client/pages/ClientArchivePage').then((m) => ({ default: m.ClientArchivePage })),
)
const ClientObligationsPage = lazy(() =>
  import('@/features/client/pages/ClientObligationsPage').then((m) => ({ default: m.ClientObligationsPage })),
)
const ClientAlertsPage = lazy(() =>
  import('@/features/client/pages/ClientAlertsPage').then((m) => ({ default: m.ClientAlertsPage })),
)
const ClientNewsPage = lazy(() =>
  import('@/features/client/pages/ClientNewsPage').then((m) => ({ default: m.ClientNewsPage })),
)
const ClientBookingPage = lazy(() =>
  import('@/features/client/pages/ClientBookingPage').then((m) => ({ default: m.ClientBookingPage })),
)
const ClientAccountPage = lazy(() =>
  import('@/features/client/pages/ClientAccountPage').then((m) => ({ default: m.ClientAccountPage })),
)
const NotFoundPage = lazy(() => import('@/features/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))
const ClientNoAccessPage = lazy(() =>
  import('@/features/client/ClientNoAccessPage').then((m) => ({ default: m.ClientNoAccessPage })),
)

export function ContabilAppRouter() {
  return (
    <Suspense fallback={<PageRouteFallback />}>
      <Routes>
        <Route path="/" element={<PublicLandingRoute />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/security" element={<Navigate to="/termos" replace />} />
        <Route path="/case-studies" element={<CaseStudiesPage />} />
        <Route path="/suporte" element={<SupportPage />} />

        <Route path="/blog" element={<BlogLayout />}>
          <Route index element={<BlogIndexPage />} />
          <Route path=":slug" element={<BlogPostPage />} />
        </Route>

        <Route path="/auth" element={<AuthProfileChoicePage />} />
        <Route path="/auth/firm/login" element={<FirmLoginPage />} />
        <Route path="/auth/firm/register" element={<FirmRegisterPage />} />
        <Route path="/auth/firm/register/google" element={<FirmRegisterGooglePage />} />
        <Route path="/auth/firm/convite/:token" element={<FirmInviteRegisterPage />} />
        <Route path="/auth/firm/team-invite/:token" element={<FirmInviteRegisterPage />} />
        <Route path="/auth/firm/confirm-email/:token" element={<FirmInviteEmailConfirmPage />} />
        <Route path="/auth/client/login" element={<ClientLoginPage />} />
        <Route
          path="/auth/client/login/:legacyFirmId"
          element={<Navigate to="/auth/client/login" replace />}
        />
        <Route path="/auth/client/register" element={<ClientRegisterPage />} />
        <Route path="/auth/client/convite/:token" element={<ClientInviteRegisterPage />} />

        <Route path="/login" element={<Navigate to={authProfileChoiceUrl('login')} replace />} />
        <Route path="/login-firm" element={<Navigate to="/auth/firm/login" replace />} />
        <Route path="/login-client" element={<Navigate to="/auth/client/login" replace />} />
        <Route path="/register-firm" element={<Navigate to="/auth/firm/register" replace />} />
        <Route path="/register-firm/google" element={<Navigate to="/auth/firm/register/google" replace />} />
        <Route path="/auth/login-firm" element={<Navigate to="/auth/firm/login" replace />} />
        <Route path="/auth/login-client" element={<Navigate to="/auth/client/login" replace />} />
        <Route path="/auth/register-firm" element={<Navigate to="/auth/firm/register" replace />} />
        <Route path="/auth/register-firm/google" element={<Navigate to="/auth/firm/register/google" replace />} />
        <Route path="/register" element={<Navigate to={authProfileChoiceUrl('register')} replace />} />

        <Route path="/recover-password" element={<RecoverPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route path="/termos" element={<TermosPage />} />
        <Route path="/privacidade" element={<PrivacidadePage />} />
        <Route path="/cookies" element={<CookiesPage />} />
        <Route path="/dpa" element={<DpaPage />} />
        <Route path="/aviso-legal" element={<AvisoLegalPage />} />

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route index element={<AppShell />} />

          <Route
            path="firm"
            element={
              <RequireRole roles={[...FIRM_APP_ROLES]}>
                <Outlet />
              </RequireRole>
            }
          >
            <Route element={<FirmLayout />}>
              <Route
                element={
                  <RequireFirmAccess>
                    <Outlet />
                  </RequireFirmAccess>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<FirmDashboardPage />} />
                <Route path="clients" element={<FirmClientsPage />} />
                <Route path="clients/:clientId" element={<FirmClientHubPage />} />
                <Route path="documents" element={<FirmDocumentsLayout />}>
                  <Route index element={<Navigate to="requests" replace />} />
                  <Route path="requests" element={<FormalRequestsModule />} />
                  <Route path="files" element={<FirmFilesModule />} />
                  <Route path="history" element={<FirmDocumentsHistoryModule />} />
                </Route>
                <Route path="obligations" element={<Navigate to="/app/firm/tasks/obligations" replace />} />
                <Route path="tasks/*" element={<FirmTasksPage />} />
                <Route path="agenda" element={<FirmAgendaPage />} />
                <Route path="fiscal-calendar" element={<FirmFiscalCalendarPage />} />
                <Route path="messages" element={<FirmMessagesPage />} />
                <Route path="alerts" element={<FirmAlertsPage />} />
                <Route path="news" element={<FirmNewsPage />} />
                <Route path="services" element={<FirmServiceRequestsPage />} />
                <Route path="settings" element={<FirmSettingsPage />} />
              </Route>
              <Route path="billing" element={<FirmBillingPage />} />
            </Route>
          </Route>

          <Route
            path="client"
            element={
              <RequireRole roles={['CLIENT']}>
                <Outlet />
              </RequireRole>
            }
          >
            <Route path="no-access" element={<ClientNoAccessPage />} />
            <Route
              element={
                <RequireClientFirmAccess>
                  <ClientPortalLayout />
                </RequireClientFirmAccess>
              }
            >
              <Route index element={<ClientDashboardPage />} />
              <Route path="requests" element={<ClientRequestsPage />} />
              <Route path="messages" element={<ClientMessagesPage />} />
              <Route path="documents" element={<ClientDocumentsPage />} />
              <Route path="archive" element={<ClientArchivePage />} />
              <Route path="agenda" element={<ClientObligationsPage />} />
              <Route path="obligations" element={<Navigate to="/app/client/agenda" replace />} />
              <Route path="alerts" element={<ClientAlertsPage />} />
              <Route path="news" element={<ClientNewsPage />} />
              <Route path="booking" element={<ClientBookingPage />} />
              <Route path="account" element={<ClientAccountPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/app/*" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
