-- =====================================================================
-- Migração: confirmação de e-mail e "esqueci minha senha"
-- Rodar no SQL Editor do Neon. Pode rodar de novo sem problema.
-- =====================================================================

-- Contas que já existem ficam como confirmadas (ninguém perde o acesso).
-- Só as contas criadas daqui para frente precisam confirmar o e-mail.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE usuarios ALTER COLUMN email_verificado SET DEFAULT FALSE;

-- Códigos de 6 dígitos enviados por e-mail (guardados só como hash)
CREATE TABLE IF NOT EXISTS codigos_email (
  id           SERIAL PRIMARY KEY,
  usuario_id   INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo         VARCHAR(20) NOT NULL CHECK (tipo IN ('confirmar', 'senha')),
  codigo_hash  CHAR(64) NOT NULL,
  expira_em    TIMESTAMP NOT NULL,
  tentativas   INTEGER NOT NULL DEFAULT 0,
  criado_em    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Conferência: as contas antigas devem aparecer como confirmadas (true)
SELECT id, email, email_verificado FROM usuarios ORDER BY id;
