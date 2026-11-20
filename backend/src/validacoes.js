/* eslint-disable no-undef */
// Regras de validação compartilhadas pelas rotas de usuário.

// E-mail é sempre guardado e comparado em minúsculas e sem espaços nas pontas,
// assim "Teste01@Gmail.com" e "teste01@gmail.com" são a mesma conta.
const normalizarEmail = (email) =>
  typeof email === 'string' ? email.trim().toLowerCase() : '';

// Senhas que aparecem no topo das listas de vazamento. Mesmo cumprindo as
// regras de formato, não são aceitas.
const SENHAS_COMUNS = new Set([
  'senha@123', 'senha@1234', 'senha#123', 'senha!123', 'mudar@123',
  'admin@123', 'admin@1234', 'teste@123', 'teste@1234', 'brasil@123',
  'brasil@2026', 'floripa@123', 'floripa@2026', 'recicle@123',
  'recicle@2026', 'password@123', 'p@ssw0rd', 'p@ssword1', 'qwerty@123',
  'abc@1234', 'abcd@1234', 'aa@123456', 'mudar@1234', 'senha@2026',
]);

const SENHA_MIN = 8;
const SENHA_MAX = 64;

// Devolve null se a senha for válida, ou a mensagem de erro.
const validarSenha = (senha) => {
  if (typeof senha !== 'string') return 'Informe uma senha.';
  if (senha.length < SENHA_MIN || senha.length > SENHA_MAX) {
    return `A senha deve ter entre ${SENHA_MIN} e ${SENHA_MAX} caracteres.`;
  }
  if (!/[a-z]/.test(senha) || !/[A-Z]/.test(senha)) {
    return 'A senha deve ter letra maiúscula e minúscula.';
  }
  if (!/[0-9]/.test(senha)) return 'A senha deve ter pelo menos um número.';
  if (!/[^A-Za-z0-9]/.test(senha)) {
    return 'A senha deve ter pelo menos um caractere especial.';
  }
  if (SENHAS_COMUNS.has(senha.toLowerCase())) {
    return 'Essa senha é muito comum e aparece em vazamentos. Escolha outra.';
  }
  return null;
};

module.exports = { normalizarEmail, validarSenha, SENHA_MIN, SENHA_MAX };
