# Autorização e controlo de acesso (RBAC)

**Actualizado:** 28 de outubro de 2026

## Modelo de papéis

Defini isto em `backend/src/utils/permissions.js`:

| Papel | O que é | Acesso |
|-------|---------|--------|
| `FIRM_OWNER` | Dono do escritório | Tudo: billing, definições, equipa, outros owners |
| `FIRM_STAFF` | Equipa | Operacional amplo; sem billing/reports/criar admin |
| `CONSULTANT` | Mais restrito | Clientes, obrigações, documentos, tarefas, mensagens |
| `CLIENT` | Cliente do escritório | Só o próprio contexto no portal |

Permissões vêm de `ROLE_PERMISSIONS[papel]`, salvo lista customizada ou `masterAccess`.

## Middleware

Uso `requirePermission` / `requireRole` nas rotas. Além disso, operações sensíveis de equipa (atribuir ou remover `FIRM_OWNER`) têm **segunda checagem no serviço** (`assertActorCanAssignRole`) — staff não promove a owner.

Testes automatizados cobrem estes cenários em `team.service.test.js` e correm no CI / bateria local.

## Isolamento entre escritórios

Autorização por papel **não** substitui o filtro `firm_id`. Ver [`TENANT_ISOLATION.md`](./TENANT_ISOLATION.md).

## Contas AfDigital Ops

O Control Center usa o mesmo stack de sessão + MFA, com gate de ambiente. Detalhe de produto: [`../product/TEGLION_CONTROL_CENTER_CHARTER.md`](../product/TEGLION_CONTROL_CENTER_CHARTER.md). Configuração exacta fica fora deste repo público.
