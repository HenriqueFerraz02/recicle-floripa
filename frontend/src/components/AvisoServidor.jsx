import { useEffect, useState } from 'react';
import { EVENTO_SERVIDOR } from '../utils/sessao';

// Faixa no topo da tela enquanto o servidor gratuito acorda.
export default function AvisoServidor() {
  const [acordando, setAcordando] = useState(false);

  useEffect(() => {
    const atualizar = (evento) => setAcordando(evento.detail.acordando);
    window.addEventListener(EVENTO_SERVIDOR, atualizar);
    return () => window.removeEventListener(EVENTO_SERVIDOR, atualizar);
  }, []);

  return (
    <div className={`server-wake ${acordando ? 'is-visible' : ''}`} role='status' aria-live='polite'>
      {acordando && (
        <>
          <span className='server-wake-spinner' aria-hidden='true' />
          <span><strong>Acordando o servidor...</strong> Na primeira vez do dia pode levar até 1 minuto.</span>
        </>
      )}
    </div>
  );
}
