import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logoRecicle from '../assets/png.png';
import { API_BASE_URL } from '../utils/api';
import { normalizarEmail } from '../utils/senha';
import BotaoTema from '../components/BotaoTema';
import { MENSAGEM_SEM_CONEXAO, salvarSessao } from '../utils/sessao';

const Login = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  // ?expirou=1: veio de uma sessão vencida (utils/sessao.js)
  const [erro, setErro] = useState(() => (new URLSearchParams(window.location.search).has('expirou') ? 'Sua sessão expirou. Entre de novo.' : ''));
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, { email: normalizarEmail(email), senha });
      
      if (response.data?.token && response.data.user) {
        // Guarda o token: ele vai em todo pedido à API (utils/sessao.js)
        salvarSessao(response.data);
        navigate('/home');
      }
    } catch (error) {
      console.error("Erro ao efetuar login:", error);
      if (error.response?.data?.codigo === 'EMAIL_NAO_CONFIRMADO') {
        navigate('/confirmar-email', { state: { email: error.response.data.email, aviso: 'Falta confirmar seu e-mail. Enviamos um novo código.' } });
        return;
      }
      setErro(error.response?.data?.error || MENSAGEM_SEM_CONEXAO);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className='auth-page'>
      <section className='auth-shell'>
        <header className='auth-brand'>
          <div className='auth-logo-mark'>
            <img src={logoRecicle} alt='Logo Recicle Floripa' />
          </div>
          <span>Recicle Floripa</span>
          <BotaoTema />
        </header>

        <div className='auth-content'>
          <div className='auth-hero-image'>
            <img src={logoRecicle} alt='Mascote Recicle Floripa' />
          </div>
          <h1>Transforme lixo em pontos que viram benefícios!</h1>
          <p className='auth-introduction'>
            Recicle, ganhe pontos e ajude a construir uma cidade mais limpa.
          </p>
        
        {erro && (
          <p className='auth-error'>
            {erro}
          </p>
        )}

        <form className='auth-form' onSubmit={handleLogin}>
          <label className='auth-field'>
            <span>E-mail</span>
            <input
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className='auth-field'>
            <span>Senha</span>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="********"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </label>

          <button type='button' className='auth-text-button auth-forgot' onClick={() => navigate('/esqueci-senha')}>
            Esqueci minha senha
          </button>

          <button 
            type="submit" 
            disabled={loading}
            className='auth-button auth-button-primary'
          >
            {loading ? 'Entrando...' : 'ENTRAR'}
          </button>

          <button
            type='button'
            className='auth-button auth-button-secondary'
            onClick={() => navigate('/cadastro')}
          >
            Criar conta
          </button>
        </form>
        
        <p className='auth-footer'>
          Ao entrar, você concorda com os{' '}
          <button type='button' className='auth-text-button' onClick={() => navigate('/termos')}>Termos de Uso</button>
          {' '}e a{' '}
          <button type='button' className='auth-text-button' onClick={() => navigate('/privacidade')}>Política de Privacidade</button>.
        </p>
        </div>
      </section>
    </main>
  );
};

export default Login;