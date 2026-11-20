import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { aoMudarAparencia, definirTema, temaAtual } from '../utils/aparencia';

// Botão sol/lua para alternar entre tema claro e escuro.
export default function BotaoTema({ className = '' }) {
  const [tema, setTema] = useState(temaAtual);

  useEffect(() => aoMudarAparencia(() => setTema(temaAtual())), []);

  const escuro = tema === 'escuro';
  return (
    <button
      type='button'
      className={`theme-toggle ${className}`}
      onClick={() => definirTema(escuro ? 'claro' : 'escuro')}
      aria-label={escuro ? 'Usar tema claro' : 'Usar tema escuro'}
      aria-pressed={escuro}
      title={escuro ? 'Tema claro' : 'Tema escuro'}
    >
      {escuro ? <Sun size={18} aria-hidden='true' /> : <Moon size={18} aria-hidden='true' />}
    </button>
  );
}
