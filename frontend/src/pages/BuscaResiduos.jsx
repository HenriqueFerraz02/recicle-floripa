import { AlertTriangle, ArrowLeft, Clock3, MapPin, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/api';

export default function BuscaResiduos() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const termo = busca.trim();
    if (termo.length < 2) return undefined; // busca curta: não chama a API

    // Espera o usuário parar de digitar (400 ms) antes de chamar a API
    const controle = new AbortController();
    const espera = setTimeout(async () => {
      setCarregando(true);
      setErro('');
      try {
        const resposta = await fetch(`${API_BASE_URL}/catalogo?busca=${encodeURIComponent(termo)}`, { signal: controle.signal });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.error || 'Erro ao buscar.');
        setResultados(dados);
      } catch (err) {
        if (err.name !== 'AbortError') setErro(err.message || 'Servidor indisponível. Tente novamente.');
      } finally {
        if (!controle.signal.aborted) setCarregando(false);
      }
    }, 400);

    return () => {
      clearTimeout(espera);
      controle.abort();
    };
  }, [busca]);

  const termoValido = busca.trim().length >= 2;
  const lista = termoValido ? resultados : [];
  const comuns = lista.filter((item) => item.item_comum);
  const tecnicos = lista.filter((item) => !item.item_comum);

  const renderItem = (item) => (
    <article key={item.codigo} className='point-card catalog-card'>
      <span className='point-card-icon'>{item.perigoso ? <AlertTriangle size={17} /> : <Trash2 size={17} />}</span>
      <span className='point-card-copy'>
        <strong>{item.descricao}</strong>
        <small>Código IBAMA {item.codigo}{item.categoria_app ? ` · ${item.categoria_app}` : ''}</small>
        {item.perigoso && <span className='catalog-warning'>Resíduo perigoso: não descarte no lixo comum</span>}
        {item.ecopontos.length > 0 ? (
          <span className='catalog-ecopontos'>
            {item.ecopontos.length >= 3 ? (
              <span className='point-hours'><MapPin size={12} /> Aceito em {item.ecopontos.length} ecopontos da cidade</span>
            ) : item.ecopontos.map((ponto) => (
              <span key={ponto.nome} className='point-hours'><MapPin size={12} /> {ponto.nome} · <Clock3 size={12} /> {ponto.horario}</span>
            ))}
            <button type='button' className='auth-text-button catalog-near-link' onClick={() => navigate('/pontos')}>Ver os mais próximos de mim</button>
          </span>
        ) : (
          <span className='point-hours'>Nenhum ecoponto cadastrado aceita este item. Procure a coleta especial.</span>
        )}
      </span>
    </article>
  );

  return (
    <main className='points-page'>
      <div className='points-shell'>
        <header className='points-topbar'>
          <button className='scanner-back-button' onClick={() => navigate('/home')} aria-label='Voltar para o início'><ArrowLeft size={18} /></button>
          <div><span className='home-eyebrow'>CATÁLOGO OFICIAL IBAMA</span><h1>Onde descartar?</h1></div>
          <Search size={19} color='#28a95b' />
        </header>

        <section className='points-content'>
          <p className='points-description'>Digite o nome do resíduo e veja a classificação oficial e os ecopontos que aceitam.</p>
          <label className='points-search'>
            <Search size={16} />
            <input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder='Ex.: pilha, garrafa pet, óleo de cozinha' autoFocus />
          </label>

          {!termoValido && <div className='points-empty'>Digite pelo menos 2 letras para buscar.</div>}
          {termoValido && carregando && <div className='points-empty'>Buscando no catálogo...</div>}
          {termoValido && !carregando && erro && <div className='points-empty'>{erro}</div>}
          {termoValido && !carregando && !erro && lista.length === 0 && <div className='points-empty'>Nada encontrado para “{busca.trim()}”.</div>}

          {!carregando && comuns.length > 0 && (
            <>
              <div className='points-section-heading'><div><span className='home-eyebrow'>DO DIA A DIA</span><h2>{comuns.length} {comuns.length === 1 ? 'resultado' : 'resultados'}</h2></div></div>
              <div className='points-list'>{comuns.map(renderItem)}</div>
            </>
          )}

          {!carregando && tecnicos.length > 0 && (
            <>
              <div className='points-section-heading'><div><span className='home-eyebrow'>OUTROS CÓDIGOS DO IBAMA</span><h2>{tecnicos.length} {tecnicos.length === 1 ? 'resultado' : 'resultados'}</h2></div></div>
              <div className='points-list'>{tecnicos.map(renderItem)}</div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
