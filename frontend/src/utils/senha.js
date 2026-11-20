// Mesmas regras do backend (backend/src/validacoes.js).
export const SENHA_MIN = 8;
export const SENHA_MAX = 64;

const SENHAS_COMUNS = new Set([
  'senha@123', 'senha@1234', 'senha#123', 'senha!123', 'mudar@123',
  'admin@123', 'admin@1234', 'teste@123', 'teste@1234', 'brasil@123',
  'brasil@2026', 'floripa@123', 'floripa@2026', 'recicle@123',
  'recicle@2026', 'password@123', 'p@ssw0rd', 'p@ssword1', 'qwerty@123',
  'abc@1234', 'abcd@1234', 'aa@123456', 'mudar@1234', 'senha@2026',
]);

export const regrasSenha = (senha) => ({
  tamanho: senha.length >= SENHA_MIN && senha.length <= SENHA_MAX,
  maiusculoMinusculo: /[a-z]/.test(senha) && /[A-Z]/.test(senha),
  numero: /[0-9]/.test(senha),
  especial: /[^A-Za-z0-9]/.test(senha),
  naoComum: senha !== '' && !SENHAS_COMUNS.has(senha.toLowerCase()),
});

export const senhaValida = (senha) =>
  Object.values(regrasSenha(senha)).every(Boolean);

export const normalizarEmail = (email) => email.trim().toLowerCase();
