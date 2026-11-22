/* eslint-disable no-undef, @typescript-eslint/no-require-imports */
// Login com token (JWT).
// No login, a API entrega um token assinado com o JWT_SECRET. O app manda
// esse token em todo pedido (cabeçalho "Authorization: Bearer <token>") e a
// API descobre QUEM é o usuário pelo token, nunca pelo número da URL.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const jwt = require('jsonwebtoken');

const SEGREDO = process.env.JWT_SECRET;
const VALIDADE = '7d';

if (!SEGREDO || SEGREDO.length < 32) {
  console.error('❌ JWT_SECRET não definido (ou com menos de 32 caracteres) no backend/.env');
  console.error('   Gere um com: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
  process.exit(1);
}

const gerarToken = (usuario) =>
  jwt.sign({ nome: usuario.nome }, SEGREDO, { subject: String(usuario.id), expiresIn: VALIDADE });

// Exige um token válido. Coloca o id do usuário em req.usuarioId.
const exigirLogin = (req, res, next) => {
  const [tipo, token] = String(req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Faça login para continuar.', codigo: 'SEM_LOGIN' });
  }
  try {
    const dados = jwt.verify(token, SEGREDO);
    req.usuarioId = Number(dados.sub);
    return next();
  } catch {
    return res.status(401).json({ error: 'Sua sessão expirou. Entre de novo.', codigo: 'SESSAO_EXPIRADA' });
  }
};

// Só deixa passar se o :id da URL for o próprio usuário do token.
const exigirDono = (parametro) => (req, res, next) => {
  if (Number(req.params[parametro]) !== req.usuarioId) {
    return res.status(403).json({ error: 'Você só pode acessar os seus próprios dados.' });
  }
  return next();
};

module.exports = { gerarToken, exigirLogin, exigirDono };
