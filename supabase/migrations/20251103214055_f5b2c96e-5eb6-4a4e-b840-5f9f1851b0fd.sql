-- Remover políticas RLS antigas
DROP POLICY IF EXISTS "Admins can view all access logs" ON access_logs;
DROP POLICY IF EXISTS "Admins can insert access logs" ON access_logs;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;

-- Remover triggers antigos
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Remover publicação realtime antiga (sem IF EXISTS)
ALTER PUBLICATION supabase_realtime DROP TABLE access_logs;

-- Renomear tabela access_logs para registros_acesso
ALTER TABLE access_logs RENAME TO registros_acesso;

-- Remover colunas antigas que não serão mais usadas
ALTER TABLE registros_acesso 
  DROP COLUMN IF EXISTS turnstile_id,
  DROP COLUMN IF EXISTS rfid_card,
  DROP COLUMN IF EXISTS success,
  DROP COLUMN IF EXISTS denied_reason,
  DROP COLUMN IF EXISTS created_at;

-- Renomear colunas para o novo padrão
ALTER TABLE registros_acesso 
  RENAME COLUMN user_id TO id_usuario;

ALTER TABLE registros_acesso 
  RENAME COLUMN access_time TO data_hora;

ALTER TABLE registros_acesso 
  RENAME COLUMN access_type TO tipo_acesso;

-- Adicionar coluna status (texto para flexibilidade: 'sucesso', 'negado', 'bloqueado', etc)
ALTER TABLE registros_acesso 
  ADD COLUMN status text NOT NULL DEFAULT 'sucesso';

-- Adicionar informações opcionais
ALTER TABLE registros_acesso 
  ADD COLUMN observacao text;

-- Simplificar tabela users - remover campos desnecessários
ALTER TABLE users 
  DROP COLUMN IF EXISTS photo_url,
  DROP COLUMN IF EXISTS updated_at;

-- Recriar políticas RLS para registros_acesso
CREATE POLICY "Admins podem visualizar todos os registros"
  ON registros_acesso
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins podem inserir registros"
  ON registros_acesso
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Recriar políticas RLS para users
CREATE POLICY "Admins podem visualizar usuários"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins podem inserir usuários"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins podem atualizar usuários"
  ON users
  FOR UPDATE
  TO authenticated
  USING (true);

-- Adicionar publicação realtime para nova tabela
ALTER PUBLICATION supabase_realtime ADD TABLE registros_acesso;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_registros_acesso_id_usuario ON registros_acesso(id_usuario);
CREATE INDEX IF NOT EXISTS idx_registros_acesso_data_hora ON registros_acesso(data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_registros_acesso_status ON registros_acesso(status);
