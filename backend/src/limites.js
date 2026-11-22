/* eslint-disable no-undef, @typescript-eslint/no-require-imports */
// Limite de tentativas: protege contra adivinhar senhas, contas em massa
// e gasto da cota gratuita do Gemini.
const { rateLimit } = require('express-rate-limit');

const mensagem = (texto) => ({ error: texto, codigo: 'MUITAS_TENTATIVAS' });

// 10 logins ERRADOS a cada 15 minutos por IP (os certos não contam)
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: mensagem('Muitas tentativas de login. Espere 15 minutos e tente de novo.'),
});

// Senha conferida com a pessoa já logada (trocar senha, excluir conta):
// 10 erros a cada 15 minutos por usuário
const limiteSenha = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `senha-${req.usuarioId}`,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: mensagem('Muitas tentativas com a senha errada. Espere 15 minutos e tente de novo.'),
});

// 5 contas novas por hora por IP
const limiteCadastro = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: mensagem('Muitos cadastros feitos daqui. Tente de novo mais tarde.'),
});

// 30 análises de IA a cada 15 minutos por usuário logado
const limiteIA = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  keyGenerator: (req) => `usuario-${req.usuarioId}`,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: mensagem('Você usou a câmera muitas vezes seguidas. Espere alguns minutos.'),
});

// Conferir códigos de 6 dígitos: 15 tentativas a cada 15 minutos por IP
// (além do limite de 5 erros por código, em codigos.js)
const limiteCodigo = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: mensagem('Muitas tentativas de código. Espere 15 minutos.'),
});

// Pedir e-mail com código: 5 por hora por IP (protege a cota do Brevo)
const limiteEnvioEmail = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: mensagem('Muitos e-mails pedidos daqui. Tente de novo mais tarde.'),
});

module.exports = { limiteLogin, limiteCadastro, limiteIA, limiteCodigo, limiteEnvioEmail, limiteSenha };
