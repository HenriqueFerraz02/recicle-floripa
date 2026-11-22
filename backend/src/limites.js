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

module.exports = { limiteLogin, limiteCadastro, limiteIA };
