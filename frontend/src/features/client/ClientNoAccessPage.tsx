import { ShieldAlert } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { authClientLoginUrl } from '@/shared/constants/authPaths'
import { useAuth } from '@/shared/hooks/useAuth'

/** Cliente sem vínculo activo com o escritório. */
export function ClientNoAccessPage() {
  const { user } = useAuth()

  if (!user || user.role !== 'CLIENT' || !user.tenant?.slug) {
    return <Navigate to={authClientLoginUrl()} replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="max-w-lg border-border/80 shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Acesso ainda não autorizado</CardTitle>
          <CardDescription className="text-base">
            O portal do cliente só está disponível depois do escritório confirmar o seu vínculo. Peça ao seu
            contabilista para validar o convite ou aguarde a aprovação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center text-sm text-muted-foreground">
          <p>Se recebeu um link de convite, utilize-o para criar a conta. Caso contrário, contacte o escritório.</p>
          <Link to={authClientLoginUrl()} className="font-medium text-primary hover:underline">
            Voltar ao login do cliente
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
