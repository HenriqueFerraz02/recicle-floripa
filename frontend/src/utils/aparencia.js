// Preferências de aparência (tema escuro e texto maior), salvas no aparelho.
// O tema fica em <html data-tema="escuro"> e o texto em <html data-texto="grande">;
// o CSS reage a esses atributos (tema-escuro.css e --escala-texto no index.css).

const CHAVE_TEMA = 'recicle-tema';
const CHAVE_TEXTO = 'recicle-texto';
const EVENTO = 'recicle-aparencia';

const ler = (chave) => {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
};

const salvar = (chave, valor) => {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    // navegador sem armazenamento: a escolha vale só até fechar a página
  }
};

export const temaAtual = () => document.documentElement.dataset.tema || 'claro';
export const textoAtual = () => document.documentElement.dataset.texto || 'normal';

const aplicar = () => {
  const raiz = document.documentElement;
  raiz.dataset.tema = ler(CHAVE_TEMA) === 'escuro' ? 'escuro' : 'claro';
  raiz.dataset.texto = ler(CHAVE_TEXTO) === 'grande' ? 'grande' : 'normal';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', raiz.dataset.tema === 'escuro' ? '#141a16' : '#28a95b');
  window.dispatchEvent(new Event(EVENTO));
};

export const iniciarAparencia = aplicar;

export const definirTema = (tema) => {
  salvar(CHAVE_TEMA, tema);
  aplicar();
};

export const definirTexto = (tamanho) => {
  salvar(CHAVE_TEXTO, tamanho);
  aplicar();
};

// Para componentes reagirem quando a aparência muda em outra tela.
export const aoMudarAparencia = (callback) => {
  window.addEventListener(EVENTO, callback);
  return () => window.removeEventListener(EVENTO, callback);
};
