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

// CPF: confere os dois dígitos verificadores (cálculo módulo 11).
// Isso garante que o número é matematicamente válido, não que ele exista
// na Receita Federal nem que pertença a quem está cadastrando.
const somenteDigitos = (valor) => String(valor ?? '').replace(/\D/g, '');

const cpfValido = (cpf) => {
  const d = somenteDigitos(cpf);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false; // 000.000.000-00, 111..., etc.

  const digito = (qtd) => {
    let soma = 0;
    for (let i = 0; i < qtd; i += 1) soma += Number(d[i]) * (qtd + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
};

// Sempre salva no mesmo formato (000.000.000-00), para o UNIQUE funcionar.
const formatarCpf = (cpf) =>
  somenteDigitos(cpf).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

// Recebe DD/MM/AAAA e devolve AAAA-MM-DD, ou null se a data não existir,
// estiver no futuro ou for de mais de 120 anos atrás.
const converterDataNascimento = (texto) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(texto ?? '').trim());
  if (!m) return null;
  const [, dia, mes, ano] = m.map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  const existe =
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia;
  if (!existe) return null;
  const hoje = new Date();
  if (data > hoje || ano < hoje.getUTCFullYear() - 120) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
};

module.exports = {
  normalizarEmail,
  validarSenha,
  cpfValido,
  formatarCpf,
  converterDataNascimento,
  SENHA_MIN,
  SENHA_MAX,
};
