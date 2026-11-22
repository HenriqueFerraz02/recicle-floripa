// Sessão do usuário: guarda o token do login e o envia em todo pedido à API.
import axios from 'axios';
import { API_BASE_URL } from './api';

const CHAVE_TOKEN = 'token';

const ler = (chave) => {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
};

export const tokenAtual = () => ler(CHAVE_TOKEN);

export const salvarSessao = ({ token, user }) => {
  localStorage.setItem(CHAVE_TOKEN, token);
  localStorage.setItem('usuario_id', user.id);
  localStorage.setItem('usuarioNome', user.nome);
  localStorage.setItem('loginData', JSON.stringify({ user }));
};

export const encerrarSessao = () => {
  ['token', 'usuario_id', 'usuarioNome', 'loginData'].forEach((chave) => localStorage.removeItem(chave));
};

// O token tem data de validade dentro dele (campo "exp").
export const temSessao = () => {
  const token = tokenAtual();
  if (!token) return false;
  try {
    const dados = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return !dados.exp || dados.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

const voltarAoLogin = () => {
  encerrarSessao();
  if (!window.location.pathname.startsWith('/login')) window.location.assign('/login?expirou=1');
};

const ehDaApi = (url) => String(url).startsWith(API_BASE_URL);

// Coloca "Authorization: Bearer <token>" em todo fetch e axios para a API e,
// se a API responder 401 a um pedido com token, manda de volta ao login.
export const instalarInterceptadores = () => {
  const fetchOriginal = window.fetch.bind(window);
  window.fetch = async (entrada, opcoes = {}) => {
    const url = entrada instanceof Request ? entrada.url : entrada;
    const token = tokenAtual();
    if (!ehDaApi(url) || !token) return fetchOriginal(entrada, opcoes);
    const cabecalhos = new Headers(opcoes.headers || (entrada instanceof Request ? entrada.headers : undefined));
    if (!cabecalhos.has('Authorization')) cabecalhos.set('Authorization', `Bearer ${token}`);
    const resposta = await fetchOriginal(entrada, { ...opcoes, headers: cabecalhos });
    if (resposta.status === 401) voltarAoLogin();
    return resposta;
  };

  axios.interceptors.request.use((config) => {
    const token = tokenAtual();
    if (token && ehDaApi(config.url)) {
      config.headers = config.headers || {};
      if (!config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  axios.interceptors.response.use(
    (resposta) => resposta,
    (erro) => {
      const pediuComToken = Boolean(erro.config?.headers?.Authorization);
      if (erro.response?.status === 401 && pediuComToken && ehDaApi(erro.config.url)) voltarAoLogin();
      return Promise.reject(erro);
    }
  );
};
