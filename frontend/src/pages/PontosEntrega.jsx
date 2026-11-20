import { ArrowLeft, Clock3, ExternalLink, LocateFixed, MapPin, Navigation, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/api';
import { distanciaKm, formatarDistancia, pedirLocalizacao } from '../utils/distancia';

const MENSAGENS_LOCALIZACAO = {
  negada: 'Você não permitiu o acesso à localização. Para usar, libere a localização deste site nas configurações do navegador.',
  indisponivel: 'Este aparelho não informa a localização.',
  falhou: 'Não foi possível descobrir sua localização agora. Tente de novo em um lugar aberto ou com o GPS ligado.',
};

const temCoordenadas = (ponto) => Number.isFinite(ponto.latitude) && Number.isFinite(ponto.longitude);

const destinoNoMapa = (ponto) => (temCoordenadas(ponto) ? `${ponto.latitude},${ponto.longitude}` : ponto.map_query);

export default function PontosEntrega() {
  const navigate = useNavigate();
  const [ecopontos, setEcopontos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState('');
  const [selecionadoId, setSelecionadoId] = useState(null);
  const [minhaPosicao, setMinhaPosicao] = useState(null);
  const [estadoLocalizacao, setEstadoLocalizacao] = useState('parado'); // parado | buscando | ok | erro
  const [erroLocalizacao, setErroLocalizacao] = useState('');

  useEffect(() => {
    const controle = new AbortController();
    fetch(`${API_BASE_URL}/ecopontos`, { signal: controle.signal })
      .then(async (resposta) => {
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.error || 'Erro ao buscar os ecopontos.');
        setEcopontos(dados);
        setSelecionadoId(dados[0]?.id ?? null);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setErro('Não foi possível carregar os ecopontos. Verifique a internet e tente de novo.');
      })
      .finally(() => {
        if (!controle.signal.aborted) setCarregando(false);
      });
    return () => controle.abort();
  }, []);

  // Distância de cada ponto até o usuário; sem localização, ordem alfabética.
  const pontosOrdenados = useMemo(() => {
    const comDistancia = ecopontos.map((ponto) => ({
      ...ponto,
      distancia: minhaPosicao && temCoordenadas(ponto)
        ? distanciaKm(minhaPosicao.lat, minhaPosicao.lng, ponto.latitude, ponto.longitude)
        : null,
    }));
    if (!minhaPosicao) return comDistancia;
    return comDistancia.sort((a, b) => (a.distancia ?? Infinity) - (b.distancia ?? Infinity));
  }, [ecopontos, minhaPosicao]);

  const termo = filtro.trim().toLowerCase();
  const pontosFiltrados = pontosOrdenados.filter((ponto) => !termo
    || ponto.nome.toLowerCase().includes(termo)
    || (ponto.bairro || '').toLowerCase().includes(termo)
    || ponto.materiais.some((material) => material.toLowerCase().includes(termo)));

  const maisProximos = minhaPosicao ? pontosOrdenados.filter((ponto) => ponto.distancia !== null).slice(0, 3) : [];
  const selecionado = pontosOrdenados.find((ponto) => ponto.id === selecionadoId) || pontosOrdenados[0];

  const usarMinhaLocalizacao = async () => {
    setEstadoLocalizacao('buscando');
    setErroLocalizacao('');
    try {
      const posicao = await pedirLocalizacao();
      setMinhaPosicao(posicao);
      setEstadoLocalizacao('ok');
      const ordenados = ecopontos
        .filter(temCoordenadas)
        .map((ponto) => ({ id: ponto.id, d: distanciaKm(posicao.lat, posicao.lng, ponto.latitude, ponto.longitude) }))
        .sort((a, b) => a.d - b.d);
      if (ordenados[0]) setSelecionadoId(ordenados[0].id);
    } catch (err) {
      setEstadoLocalizacao('erro');
      setErroLocalizacao(MENSAGENS_LOCALIZACAO[err.message] || MENSAGENS_LOCALIZACAO.falhou);
    }
  };

  const cartaoPonto = (ponto) => (
    <button key={ponto.id} className={`point-card ${selecionado?.id === ponto.id ? 'is-selected' : ''}`} onClick={() => setSelecionadoId(ponto.id)}>
      <span className='point-card-icon'><MapPin size={17} /></span>
      <span className='point-card-copy'>
        <strong>{ponto.nome}</strong>
        <small>{ponto.endereco}</small>
        <span className='point-hours'><Clock3 size={12} /> {ponto.horario}</span>
        <span className='point-tags'>{ponto.materiais.slice(0, 4).map((material) => <em key={material}>{material}</em>)}</span>
      </span>
      <span className='point-badge'>{ponto.distancia !== null && ponto.distancia !== undefined ? formatarDistancia(ponto.distancia) : ponto.bairro}</span>
    </button>
  );

  return (
    <main className='points-page'>
      <div className='points-shell'>
        <header className='points-topbar'>
          <button className='scanner-back-button' onClick={() => navigate('/home')} aria-label='Voltar para o início'><ArrowLeft size={18} /></button>
          <div><span className='home-eyebrow'>DESCARTE CORRETO</span><h1>Pontos de entrega</h1></div>
          <MapPin size={19} color='#28a95b' />
        </header>

        <section className='points-content'>
          <p className='points-description'>Encontre um ecoponto perto de você e dê o destino certo aos seus materiais.</p>

          <button type='button' className='auth-button auth-button-primary points-locate-button' onClick={usarMinhaLocalizacao} disabled={estadoLocalizacao === 'buscando' || carregando || ecopontos.length === 0}>
            <LocateFixed size={17} aria-hidden='true' />
            {estadoLocalizacao === 'buscando' ? 'Buscando sua localização...' : estadoLocalizacao === 'ok' ? 'Atualizar minha localização' : 'Mostrar os mais próximos de mim'}
          </button>
          {estadoLocalizacao === 'erro' && <p className='points-locate-error' role='alert'>{erroLocalizacao}</p>}
          {estadoLocalizacao === 'parado' && <p className='points-locate-note'>Sua localização é usada só neste aparelho e não é enviada nem guardada.</p>}

          {maisProximos.length > 0 && (
            <section className='points-nearest' aria-label='Ecopontos mais próximos'>
              <div className='points-section-heading'><div><span className='home-eyebrow'>PERTO DE VOCÊ</span><h2>Os {maisProximos.length} mais próximos</h2></div><Navigation size={18} color='#1e8646' aria-hidden='true' /></div>
              <div className='points-list'>{maisProximos.map(cartaoPonto)}</div>
              <p className='points-locate-note'>Distância em linha reta. O caminho pelas ruas pode ser maior.</p>
            </section>
          )}

          <label className='points-search'><Search size={16} /><input value={filtro} onChange={(event) => setFiltro(event.target.value)} placeholder='Buscar bairro, ponto ou material' /></label>

          {carregando && <div className='points-empty'>Carregando ecopontos...</div>}
          {erro && <div className='points-empty' role='alert'>{erro}</div>}

          {!carregando && !erro && (
            <>
              <div className='points-section-heading'><div><span className='home-eyebrow'>{minhaPosicao ? 'TODOS, DO MAIS PERTO AO MAIS LONGE' : 'FLORIANÓPOLIS'}</span><h2>{pontosFiltrados.length} {pontosFiltrados.length === 1 ? 'local encontrado' : 'locais encontrados'}</h2></div><span className='points-count'>{pontosFiltrados.length}/{ecopontos.length}</span></div>
              {pontosFiltrados.length === 0
                ? <div className='points-empty'>Nenhum ponto encontrado para essa busca.</div>
                : <div className='points-list'>{pontosFiltrados.map(cartaoPonto)}</div>}
            </>
          )}

          {selecionado && (
            <section className='selected-map'>
              <div className='selected-map-heading'><div><span className='home-eyebrow'>LOCALIZAÇÃO SELECIONADA</span><h2>{selecionado.nome}</h2><p>{selecionado.endereco}</p></div><MapPin size={18} color='#28a95b' /></div>
              <div className='map-frame'><iframe title={`Mapa: ${selecionado.nome}`} width='100%' height='100%' frameBorder='0' src={`https://maps.google.com/maps?q=${encodeURIComponent(destinoNoMapa(selecionado))}&t=&z=15&ie=UTF8&iwloc=&output=embed`} allowFullScreen /></div>
              <a className='points-route-button' href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinoNoMapa(selecionado))}`} target='_blank' rel='noopener noreferrer'>Abrir rota no Google Maps <ExternalLink size={14} /></a>
              <p className='points-locate-note'>Horários podem mudar. Na dúvida, confirme com a Comcap antes de ir.</p>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
