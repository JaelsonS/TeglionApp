-- ContaBil — core tables (multi-tenant: firm_id obrigatório)
-- Executar após schema.sql (extensions + types)

-- Escritórios (tenant root)
CREATE TABLE IF NOT EXISTS public.firms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_clinic_id TEXT UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  country_code TEXT DEFAULT 'PT',
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED')),
  billing_plan TEXT,
  trial_ends_at TIMESTAMPTZ,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Utilizadores do escritório (staff)
CREATE TABLE IF NOT EXISTS public.firm_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  auth_user_id UUID UNIQUE,
  legacy_user_id TEXT,
  email TEXT NOT NULL,
  full_name TEXT,
  password_hash TEXT,
  refresh_token_hash TEXT,
  refresh_token_expires_at TIMESTAMPTZ,
  role TEXT NOT NULL DEFAULT 'FIRM_STAFF' CHECK (role IN ('FIRM_OWNER', 'FIRM_STAFF', 'FIRM_CONSULTANT')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (firm_id, email)
);

-- Clientes do escritório
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  legacy_patient_id TEXT,
  legacy_user_id TEXT,
  display_name TEXT NOT NULL,
  email TEXT,
  password_hash TEXT,
  refresh_token_hash TEXT,
  refresh_token_expires_at TIMESTAMPTZ,
  tax_id TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'PENDING_LINK')),
  link_status TEXT DEFAULT 'APPROVED' CHECK (link_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  last_login_at TIMESTAMPTZ,
  assigned_staff_id UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Obrigações fiscais / mensais
CREATE TABLE IF NOT EXISTS public.obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('IVA', 'IRC', 'IRS', 'SS', 'DRF', 'IES', 'DAS', 'PAYROLL', 'CUSTOM')),
  period TEXT NOT NULL,
  title TEXT,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN (
    'PENDING', 'IN_PROGRESS', 'WAITING_CLIENT', 'DELIVERED', 'OVERDUE', 'CANCELLED'
  )),
  assigned_staff_id UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  notes TEXT,
  delivered_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  legacy_obligation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (firm_id, client_id, type, period)
);

-- Tarefas pedidas ao cliente
CREATE TABLE IF NOT EXISTS public.client_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  obligation_id UUID REFERENCES public.obligations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  schema_json JSONB,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'CANCELLED')),
  due_date DATE,
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  legacy_task_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documentos (metadados; ficheiro em storage externo)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  obligation_id UUID REFERENCES public.obligations(id) ON DELETE SET NULL,
  client_task_id UUID REFERENCES public.client_tasks(id) ON DELETE SET NULL,
  period TEXT,
  title TEXT,
  storage_provider TEXT NOT NULL DEFAULT 'supabase',
  storage_key TEXT NOT NULL,
  storage_url TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  uploaded_by_role TEXT CHECK (uploaded_by_role IN ('FIRM', 'CLIENT')),
  uploaded_by_id UUID,
  legacy_document_id TEXT,
  validation_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (validation_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  document_type TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mensagens escritório ↔ cliente
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('FIRM', 'CLIENT')),
  sender_id UUID NOT NULL,
  body TEXT NOT NULL,
  obligation_id UUID REFERENCES public.obligations(id) ON DELETE SET NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  quick_reply_key TEXT,
  read_at TIMESTAMPTZ,
  legacy_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Consultorias / agenda
CREATE TABLE IF NOT EXISTS public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
  notes TEXT,
  legacy_consultation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Convites de acesso ao portal do cliente
CREATE TABLE IF NOT EXISTS public.client_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  email TEXT,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  actor_role TEXT,
  actor_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
