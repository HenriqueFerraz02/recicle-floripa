import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import TelaAuth from '../components/TelaAuth';
import { API_BASE_URL } from '../utils/api';
import { normalizarEmail } from '../utils/senha';
import { salvarSessao } from '../utils/sessao';

const ESPERA_REENVIO = 60; // segundos

export default function ConfirmarEmail() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [email, setEmail] = useState(state?.email || '');
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState(state?.emailEnviado === false ? 'Não conseguimos enviar o e-mail agora. Toque em "Reenviar código".' : '');
  const [aviso, setAviso] = useState(state?.aviso || '');
  const [enviando, setEnviando] = useState(false);
  const [espera, setEspera] = useState(ESPERA_REENVIO);

  useEffect(() => {
    if (espera <= 0) return undefined;
    const id = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [espera]);

  const confirmar = async (event) => {
    event.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      const { data } = await axios.post(`${API_BASE_URL}/usuarios/confirmar-email`, { email: normalizarEmail(email), codigo });
      salvarSessao(data);
      navigate('/home');
    } catch (error) {
      setErro(error.response?.data?.error || 'Não foi possível confirmar agora. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  };

  const reenviar = async () => {
    setErro('');
    setAviso('');
    try {
      await axios.post(`${API_BASE_URL}/usuarios/reenviar-codigo`, { email: normalizarEmail(email) });
      setAviso('Enviamos um novo código. O anterior deixou de valer.');
      setEspera(ESPERA_REENVIO);
    } catch (error) {
      setErro(error.response?.data?.error || 'Não foi possível reenviar agora.');
    }
  };

  return (
    <TelaAuth
      titulo='Confirme seu e-mail'
      introducao={state?.email
        ? `Enviamos um código de 6 números para ${state.email}. Digite abaixo para ativar sua conta.`
        : 'Digite seu e-mail e o código de 6 números que enviamos para ele.'}
    >
      {aviso && <p className='auth-success' role='status'>{aviso}</p>}
      {erro && <p className='auth-error' role='alert'>{erro}</p>}

      <form className='auth-form' onSubmit={confirmar}>
        {!state?.email && (
          <label className='auth-field'>
            <span>E-mail</span>
            <input type='email' autoComplete='email' autoCapitalize='none' value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
        )}
        <label className='auth-field'>
          <span>Código</span>
          <input
            className='codigo-input'
            type='text'
            inputMode='numeric'
            autoComplete='one-time-code'
            pattern='[0-9]{6}'
            maxLength={6}
            placeholder='000000'
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
            required
          />
        </label>
        <button type='submit' className='auth-button auth-button-primary' disabled={enviando || codigo.length !== 6}>
          {enviando ? 'Confirmando...' : 'CONFIRMAR E ENTRAR'}
        </button>
        <button type='button' className='auth-button auth-button-secondary' onClick={reenviar} disabled={espera > 0 || !email}>
          {espera > 0 ? `Reenviar código em ${espera}s` : 'Reenviar código'}
        </button>
      </form>

      <p className='auth-note'>Não recebeu? Confira a caixa de <b>spam</b> ou <b>lixo eletrônico</b>. O código vale por 15 minutos.</p>
      <p className='auth-footer'><button type='button' className='auth-text-button' onClick={() => navigate('/login')}>Voltar ao login</button></p>
    </TelaAuth>
  );
}
