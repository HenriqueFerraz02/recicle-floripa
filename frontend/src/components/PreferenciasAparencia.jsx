import { Moon, Type } from 'lucide-react';
import { useEffect, useState } from 'react';
import { aoMudarAparencia, definirTema, definirTexto, temaAtual, textoAtual } from '../utils/aparencia';

// Seção "Aparência e acessibilidade" da tela de Configurações.
export default function PreferenciasAparencia() {
  const [tema, setTema] = useState(temaAtual);
  const [texto, setTexto] = useState(textoAtual);

  useEffect(() => aoMudarAparencia(() => {
    setTema(temaAtual());
    setTexto(textoAtual());
  }), []);

  const opcao = (Icone, titulo, descricao, ligado, alternar) => (
    <label className='settings-tool settings-switch'>
      <span className='settings-tool-icon'><Icone size={17} aria-hidden='true' /></span>
      <span><strong>{titulo}</strong><small>{descricao}</small></span>
      <input type='checkbox' role='switch' checked={ligado} onChange={alternar} />
      <span className='switch-track' aria-hidden='true'><span className='switch-thumb' /></span>
    </label>
  );

  return (
    <div className='settings-tools'>
      <span className='home-eyebrow'>APARÊNCIA E ACESSIBILIDADE</span>
      {opcao(Moon, 'Tema escuro', 'Fundo escuro, mais confortável à noite.', tema === 'escuro', () => definirTema(tema === 'escuro' ? 'claro' : 'escuro'))}
      {opcao(Type, 'Texto maior', 'Aumenta as letras de todas as telas.', texto === 'grande', () => definirTexto(texto === 'grande' ? 'normal' : 'grande'))}
    </div>
  );
}
