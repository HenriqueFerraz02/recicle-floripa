/* eslint-disable no-undef, @typescript-eslint/no-require-imports */
// Códigos de 6 dígitos enviados por e-mail (confirmar conta e trocar senha).
// O banco guarda só o "hash" do código, nunca o código em si.
const crypto = require('crypto');
const pool = require('./database');

const VALIDADE_MINUTOS = 15;
const MAX_TENTATIVAS = 5;

const resumo = (codigo) => crypto.createHash('sha256').update(String(codigo)).digest('hex');

// Cria um código novo e apaga os anteriores do mesmo tipo.
const criarCodigo = async (usuarioId, tipo) => {
  const codigo = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  await pool.query('DELETE FROM codigos_email WHERE usuario_id = $1 AND tipo = $2', [usuarioId, tipo]);
  await pool.query(
    `INSERT INTO codigos_email (usuario_id, tipo, codigo_hash, expira_em)
     VALUES ($1, $2, $3, NOW() + ($4 || ' minutes')::interval)`,
    [usuarioId, tipo, resumo(codigo), String(VALIDADE_MINUTOS)]
  );
  return codigo;
};

// Confere o código. Cada erro gasta uma tentativa; depois de 5, só pedindo outro.
// Devolve { ok: true } ou { ok: false, motivo }.
const conferirCodigo = async (usuarioId, tipo, codigoDigitado) => {
  const { rows } = await pool.query(
    `SELECT id, codigo_hash, tentativas, expira_em < NOW() AS expirou
       FROM codigos_email WHERE usuario_id = $1 AND tipo = $2`,
    [usuarioId, tipo]
  );
  const registro = rows[0];
  if (!registro) return { ok: false, motivo: 'Peça um novo código.' };
  if (registro.expirou) return { ok: false, motivo: 'O código expirou. Peça um novo.' };
  if (registro.tentativas >= MAX_TENTATIVAS) return { ok: false, motivo: 'Muitas tentativas erradas. Peça um novo código.' };

  const digitado = Buffer.from(resumo(String(codigoDigitado || '').trim()), 'hex');
  const certo = Buffer.from(registro.codigo_hash, 'hex');
  if (!crypto.timingSafeEqual(digitado, certo)) {
    await pool.query('UPDATE codigos_email SET tentativas = tentativas + 1 WHERE id = $1', [registro.id]);
    const restam = MAX_TENTATIVAS - registro.tentativas - 1;
    if (restam <= 0) return { ok: false, motivo: 'Muitas tentativas erradas. Peça um novo código.' };
    return { ok: false, motivo: restam === 1 ? 'Código incorreto. Resta 1 tentativa.' : `Código incorreto. Restam ${restam} tentativas.` };
  }
  await pool.query('DELETE FROM codigos_email WHERE id = $1', [registro.id]);
  return { ok: true };
};

module.exports = { criarCodigo, conferirCodigo };
