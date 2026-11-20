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

// Mesma conta de dígitos verificadores do backend (backend/src/validacoes.js).
export const cpfValido = (cpf) => {
  const d = String(cpf ?? '').replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digito = (qtd) => {
    let soma = 0;
    for (let i = 0; i < qtd; i += 1) soma += Number(d[i]) * (qtd + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
};

// DD/MM/AAAA de uma data que existe, não está no futuro e tem até 120 anos.
export const dataNascimentoValida = (texto) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!m) return false;
  const [, dia, mes, ano] = m.map(Number);
  const data = new Date(ano, mes - 1, dia);
  const hoje = new Date();
  return (
    data.getFullYear() === ano &&
    data.getMonth() === mes - 1 &&
    data.getDate() === dia &&
    data <= hoje &&
    ano >= hoje.getFullYear() - 120
  );
};
