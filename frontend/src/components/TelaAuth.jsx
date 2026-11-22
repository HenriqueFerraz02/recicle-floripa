import logoRecicle from '../assets/png.png';
import BotaoTema from './BotaoTema';

// Moldura das telas de conta (confirmar e-mail, esqueci a senha).
export default function TelaAuth({ titulo, introducao, children }) {
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
          <h1>{titulo}</h1>
          {introducao && <p className='auth-introduction'>{introducao}</p>}
          {children}
        </div>
      </section>
    </main>
  );
}
