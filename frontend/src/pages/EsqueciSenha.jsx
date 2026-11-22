import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import axios from 'axios';
import TelaAuth from '../components/TelaAuth';
import { API_BASE_URL } from '../utils/api';
import { normalizarEmail, regrasSenha, senhaValida } from '../utils/senha';

export default function EsqueciSenha() {
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState('email'); // email | codigo | pronto
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const regras = regrasSenha(novaSenha);

  const pedirCodigo = async (event) => {
    event.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await axios.post(`${API_BASE_URL}/senha/esqueci`, { email: normalizarEmail(email) });
      setEtapa('codigo');
    } catch (error) {
      setErro(error.response?.data?.error || 'Não foi possível enviar o código agora.');
    } finally {
      setEnviando(false);
    }
  };

  const trocarSenha = async (event) => {
    event.preventDefault();
    setErro('');
    if (!senhaValida(novaSenha)) {
      setErro('A nova senha precisa cumprir todas as regras.');
      return;
    }
    setEnviando(true);
    try {
      await axios.post(`${API_BASE_URL}/senha/redefinir`, { email: normalizarEmail(email), codigo, novaSenha });
      setEtapa('pronto');
    } catch (error) {
      setErro(error.response?.data?.error || 'Não foi possível trocar a senha agora.');
    } finally {
      setEnviando(false);
    }
  };

  const regra = (ok, texto) => (
    <span className={novaSenha === '' ? 'password-rule' : ok ? 'password-rule is-valid' : 'password-rule is-invalid'}>{ok ? '✓' : '•'} {texto}</span>
  );

  if (etapa === 'pronto') {
    return (
      <TelaAuth titulo='Senha alterada!' introducao='Agora é só entrar com a nova senha.'>
        <button type='button' className='auth-button auth-button-primary' onClick={() => navigate('/login')}>IR PARA O LOGIN</button>
      </TelaAuth>
    );
  }

  return (
    <TelaAuth
      titulo='Esqueci minha senha'
      introducao={etapa === 'email'
        ? 'Digite o e-mail da sua conta. Vamos enviar um código para você criar uma nova senha.'
        : `Se existir uma conta com ${normalizarEmail(email)}, enviamos um código de 6 números.`}
    >
      {erro && <p className='auth-error' role='alert'>{erro}</p>}

      {etapa === 'email' ? (
        <form className='auth-form' onSubmit={pedirCodigo}>
          <label className='auth-field'>
            <span>E-mail</span>
            <input type='email' autoComplete='email' autoCapitalize='none' placeholder='seuemail@exemplo.com' value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <button type='submit' className='auth-button auth-button-primary' disabled={enviando}>{enviando ? 'Enviando...' : 'ENVIAR CÓDIGO'}</button>
        </form>
      ) : (
        <form className='auth-form' onSubmit={trocarSenha}>
          <label className='auth-field'>
            <span>Código</span>
            <input className='codigo-input' type='text' inputMode='numeric' autoComplete='one-time-code' pattern='[0-9]{6}' maxLength={6} placeholder='000000' value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))} required />
          </label>
          <label className='auth-field'>
            <span>Nova senha</span>
            <div className='auth-input-with-icon'>
              <Lock size={15} aria-hidden='true' />
              <input type={mostrarSenha ? 'text' : 'password'} autoComplete='new-password' value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required />
              <button type='button' className='password-toggle' onClick={() => setMostrarSenha(!mostrarSenha)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}>{mostrarSenha ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </div>
          </label>
          <div className='password-rules'>
            {regra(regras.tamanho, 'Pelo menos 8 caracteres')}
            {regra(regras.maiusculoMinusculo, 'Maiúscula e minúscula')}
            {regra(regras.numero, 'Um número')}
            {regra(regras.especial, 'Um caractere especial')}
            {regra(regras.naoComum, 'Não pode ser uma senha comum')}
          </div>
          <button type='submit' className='auth-button auth-button-primary' disabled={enviando || codigo.length !== 6}>{enviando ? 'Salvando...' : 'SALVAR NOVA SENHA'}</button>
          <button type='button' className='auth-button auth-button-secondary' onClick={() => { setEtapa('email'); setCodigo(''); setErro(''); }}>Pedir outro código</button>
        </form>
      )}

      <p className='auth-note'>Não recebeu? Confira a caixa de <b>spam</b> ou <b>lixo eletrônico</b>. O código vale por 15 minutos.</p>
      <p className='auth-footer'><button type='button' className='auth-text-button' onClick={() => navigate('/login')}>Voltar ao login</button></p>
    </TelaAuth>
  );
}
