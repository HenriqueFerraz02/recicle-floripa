-- =====================================================================
-- Migração: perfil completo (@usuário, bairro e foto opcional)
-- Rodar no SQL Editor do Neon. Pode rodar de novo sem problema.
-- =====================================================================

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS apelido VARCHAR(30);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bairro  VARCHAR(60);
-- Foto já reduzida no celular (320x320, JPEG), em texto "data:image/jpeg;base64,..."
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto    TEXT;

-- Dois usuários não podem ter o mesmo @ (sem diferença de maiúsculas)
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_apelido_unico
  ON usuarios (LOWER(apelido)) WHERE apelido IS NOT NULL;

-- Conferência: as três colunas novas devem aparecer
SELECT column_name, data_type FROM information_schema.columns
 WHERE table_name = 'usuarios' AND column_name IN ('apelido', 'bairro', 'foto');
