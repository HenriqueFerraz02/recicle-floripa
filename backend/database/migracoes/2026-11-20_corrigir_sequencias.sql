-- =====================================================================
-- Corrige as sequências de id quando ficam atrás dos dados
-- Sintoma: todo cadastro novo falha com "duplicate key ... _pkey".
-- Pode rodar de novo sem problema: só ajusta para o maior id + 1.
-- =====================================================================

-- PASSO 1 (diagnóstico): se "sequencia" < "maior_id", está atrasada.
SELECT 'usuarios' AS tabela, (SELECT MAX(id) FROM usuarios) AS maior_id,
       (SELECT last_value FROM usuarios_id_seq) AS sequencia
UNION ALL
SELECT 'residuos', (SELECT MAX(id) FROM residuos),
       (SELECT last_value FROM residuos_id_seq);

-- PASSO 2 (correção): o próximo id passa a ser o maior id + 1.
SELECT setval(pg_get_serial_sequence('usuarios', 'id'), COALESCE((SELECT MAX(id) FROM usuarios), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('residuos', 'id'), COALESCE((SELECT MAX(id) FROM residuos), 0) + 1, false);
