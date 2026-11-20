-- =====================================================================
-- Migração: e-mail sem diferença entre maiúsculas e minúsculas
-- Rodar no SQL Editor do Neon, UM PASSO DE CADA VEZ.
-- =====================================================================

-- PASSO 1: conferir se já existem contas "duplicadas" só por maiúsculas
-- (ex.: Teste01@gmail.com e teste01@gmail.com). Se voltar alguma linha,
-- apague ou ajuste uma delas antes de seguir para o passo 2.
SELECT LOWER(TRIM(email)) AS email, COUNT(*) AS contas, ARRAY_AGG(id) AS ids
FROM usuarios
GROUP BY LOWER(TRIM(email))
HAVING COUNT(*) > 1;

-- PASSO 2: padronizar os e-mails já cadastrados em minúsculas.
UPDATE usuarios
SET email = LOWER(TRIM(email))
WHERE email <> LOWER(TRIM(email));

-- PASSO 3: impedir no próprio banco duas contas com o mesmo e-mail
-- escrito de formas diferentes.
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_lower_unico
  ON usuarios (LOWER(email));
