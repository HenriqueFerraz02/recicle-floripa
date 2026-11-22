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

// --- Aviso de "servidor acordando" ---
// O Render gratuito "dorme" sem uso e o primeiro pedido pode levar até ~1 min.
// Se algum pedido à API passar de 3 s, a tela mostra o aviso (AvisoServidor).
const ESPERA_AVISO_MS = 3000;
export const EVENTO_SERVIDOR = 'recicle-servidor';
let pedidosLentos = 0;

const acompanharPedido = () => {
  let lento = false;
  const timer = setTimeout(() => {
    lento = true;
    pedidosLentos += 1;
    window.dispatchEvent(new CustomEvent(EVENTO_SERVIDOR, { detail: { acordando: true } }));
  }, ESPERA_AVISO_MS);
  return () => {
    clearTimeout(timer);
    if (!lento) return;
    pedidosLentos = Math.max(0, pedidosLentos - 1);
    if (pedidosLentos === 0) window.dispatchEvent(new CustomEvent(EVENTO_SERVIDOR, { detail: { acordando: false } }));
  };
};

// Chamado ao abrir o app: já acorda o servidor enquanto a pessoa digita.
export const acordarServidor = () => {
  fetch(`${API_BASE_URL}/`).catch(() => {});
};

// Mensagem para quando o pedido nem chegou ao servidor (sem resposta)
export const MENSAGEM_SEM_CONEXAO = 'Não foi possível falar com o servidor. Ele pode estar acordando: espere alguns segundos e tente de novo.';

// Coloca "Authorization: Bearer <token>" em todo fetch e axios para a API e,
// se a API responder 401 a um pedido com token, manda de volta ao login.
export const instalarInterceptadores = () => {
  const fetchOriginal = window.fetch.bind(window);
  window.fetch = async (entrada, opcoes = {}) => {
    const url = entrada instanceof Request ? entrada.url : entrada;
    if (!ehDaApi(url)) return fetchOriginal(entrada, opcoes);
    const token = tokenAtual();
    const cabecalhos = new Headers(opcoes.headers || (entrada instanceof Request ? entrada.headers : undefined));
    if (token && !cabecalhos.has('Authorization')) cabecalhos.set('Authorization', `Bearer ${token}`);
    const terminar = acompanharPedido();
    try {
      const resposta = await fetchOriginal(entrada, { ...opcoes, headers: cabecalhos });
      if (resposta.status === 401 && token) voltarAoLogin();
      return resposta;
    } finally {
      terminar();
    }
  };

  axios.interceptors.request.use((config) => {
    if (!ehDaApi(config.url)) return config;
    const token = tokenAtual();
    if (token) {
      config.headers = config.headers || {};
      if (!config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
    }
    config.terminarAcompanhamento = acompanharPedido();
    return config;
  });
  axios.interceptors.response.use(
    (resposta) => {
      resposta.config.terminarAcompanhamento?.();
      return resposta;
    },
    (erro) => {
      erro.config?.terminarAcompanhamento?.();
      const pediuComToken = Boolean(erro.config?.headers?.Authorization);
      if (erro.response?.status === 401 && pediuComToken && ehDaApi(erro.config.url)) voltarAoLogin();
      return Promise.reject(erro);
    }
  );
};
