-- Criar enum para tipo de passagem
CREATE TYPE access_type AS ENUM ('entry', 'exit');

-- Criar enum para status de usuário
CREATE TYPE user_status AS ENUM ('active', 'blocked');

-- Tabela de usuários cadastrados no sistema
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  rfid_card TEXT UNIQUE NOT NULL,
  status user_status NOT NULL DEFAULT 'active',
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de catracas/pontos de acesso
CREATE TABLE public.turnstiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de registros de passagem
CREATE TABLE public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  turnstile_id UUID NOT NULL REFERENCES public.turnstiles(id) ON DELETE CASCADE,
  rfid_card TEXT NOT NULL,
  access_type access_type NOT NULL,
  access_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT true,
  denied_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de perfis de admin (para autenticação)
CREATE TABLE public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_access_logs_user_id ON public.access_logs(user_id);
CREATE INDEX idx_access_logs_turnstile_id ON public.access_logs(turnstile_id);
CREATE INDEX idx_access_logs_access_time ON public.access_logs(access_time DESC);
CREATE INDEX idx_users_rfid ON public.users(rfid_card);
CREATE INDEX idx_users_status ON public.users(status);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnstiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies para admins autenticados

-- Admin pode ver tudo
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update users"
  ON public.users FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all turnstiles"
  ON public.turnstiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage turnstiles"
  ON public.turnstiles FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Admins can view all access logs"
  ON public.access_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert access logs"
  ON public.access_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin profiles are viewable by owner"
  ON public.admin_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admin profiles can be inserted"
  ON public.admin_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Função para criar perfil de admin automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para criar perfil quando admin se cadastra
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_admin();

-- Inserir catracas de exemplo
INSERT INTO public.turnstiles (name, location) VALUES
  ('Catraca Principal - Entrada', 'Recepção'),
  ('Catraca Lateral - Entrada', 'Estacionamento'),
  ('Catraca Saída - Principal', 'Recepção'),
  ('Catraca Academia', 'Área de Fitness');

-- Inserir usuários de exemplo
INSERT INTO public.users (name, email, rfid_card, status) VALUES
  ('João Silva', 'joao@example.com', 'RF001234567', 'active'),
  ('Maria Santos', 'maria@example.com', 'RF002345678', 'active'),
  ('Pedro Costa', 'pedro@example.com', 'RF003456789', 'blocked'),
  ('Ana Oliveira', 'ana@example.com', 'RF004567890', 'active'),
  ('Carlos Ferreira', 'carlos@example.com', 'RF005678901', 'active');

-- Inserir logs de acesso de exemplo (últimas 24h)
INSERT INTO public.access_logs (user_id, turnstile_id, rfid_card, access_type, access_time, success)
SELECT 
  u.id,
  t.id,
  u.rfid_card,
  CASE WHEN random() > 0.5 THEN 'entry'::access_type ELSE 'exit'::access_type END,
  now() - (random() * interval '24 hours'),
  CASE WHEN u.status = 'active' THEN true ELSE false END
FROM public.users u
CROSS JOIN public.turnstiles t
WHERE random() > 0.7
LIMIT 50;

-- Atualizar denied_reason para acessos bloqueados
UPDATE public.access_logs 
SET denied_reason = 'Usuário bloqueado no sistema'
WHERE success = false;

-- Enable realtime para access_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.access_logs;