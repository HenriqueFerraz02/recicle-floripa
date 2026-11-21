import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Award, CalendarDays, Camera, GlassWater, Hammer, Layers, LogOut, MapPin, Medal,
  Newspaper, Pencil, Settings, Sprout, Trash2, Trophy, UserRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/api';
import { BAIRROS } from '../utils/bairros';
import { calcularConquistas, contarPorMaterial, nomeMaterial } from '../utils/conquistas';
import { reduzirFoto } from '../utils/foto';
import { encerrarSessao } from '../utils/sessao';

const ICONES = { Award, GlassWater, Hammer, Layers, Medal, Newspaper, Sprout, Trophy };

const lerJson = async (resposta) => {
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.error || 'Algo deu errado. Tente de novo.');
  return dados;
};

const mesAno = (data) => (data
  ? new Date(data).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  : '');

export default function Perfil() {
  const navigate = useNavigate();
  const usuarioId = localStorage.getItem('usuario_id') || 1;
  const [usuario, setUsuario] = useState({ nome: localStorage.getItem('usuarioNome') || 'Usuário', pontos: 0 });
  const [resumo, setResumo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ nome: '', apelido: '', bairro: '' });
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState({ texto: '', tipo: '' });
  const entradaFoto = useRef(null);

  const carregarPerfil = useCallback(async () => {
    try {
      const [perfil, dadosResumo] = await Promise.all([
        fetch(`${API_BASE_URL}/usuarios/${usuarioId}`).then(lerJson),
        fetch(`${API_BASE_URL}/usuarios/${usuarioId}/resumo`).then(lerJson),
      ]);
      setUsuario((atual) => ({ ...atual, ...perfil }));
      setResumo(dadosResumo);
    } catch (error) {
      setAviso({ texto: 'Não foi possível carregar o perfil. Verifique a internet.', tipo: 'erro' });
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setCarregando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    const timeoutId = setTimeout(carregarPerfil, 0);
    return () => clearTimeout(timeoutId);
  }, [carregarPerfil]);

  const abrirEdicao = () => {
    setForm({ nome: usuario.nome || '', apelido: usuario.apelido || '', bairro: usuario.bairro || '' });
    setAviso({ texto: '', tipo: '' });
    setEditando(true);
  };

  const salvarPerfil = async (event) => {
    event.preventDefault();
    setSalvando(true);
    setAviso({ texto: '', tipo: '' });
    try {
      const salvo = await fetch(`${API_BASE_URL}/usuarios/${usuarioId}/perfil`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }).then(lerJson);
      setUsuario((atual) => ({ ...atual, ...salvo }));
      localStorage.setItem('usuarioNome', salvo.nome);
      setEditando(false);
      setAviso({ texto: 'Perfil atualizado.', tipo: 'ok' });
      const dadosResumo = await fetch(`${API_BASE_URL}/usuarios/${usuarioId}/resumo`).then(lerJson);
      setResumo(dadosResumo);
    } catch (error) {
      setAviso({ texto: error.message, tipo: 'erro' });
    } finally {
      setSalvando(false);
    }
  };

  const trocarFoto = async (event) => {
    const arquivo = event.target.files?.[0];
    event.target.value = '';
    if (!arquivo) return;
    setSalvando(true);
    setAviso({ texto: '', tipo: '' });
    try {
      const foto = await reduzirFoto(arquivo);
      await fetch(`${API_BASE_URL}/usuarios/${usuarioId}/foto`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foto }),
      }).then(lerJson);
      setUsuario((atual) => ({ ...atual, foto }));
      setAviso({ texto: 'Foto atualizada.', tipo: 'ok' });
    } catch (error) {
      setAviso({ texto: error.message, tipo: 'erro' });
    } finally {
      setSalvando(false);
    }
  };

  const removerFoto = async () => {
    if (!window.confirm('Remover sua foto de perfil?')) return;
    setSalvando(true);
    try {
      await fetch(`${API_BASE_URL}/usuarios/${usuarioId}/foto`, { method: 'DELETE' }).then(lerJson);
      setUsuario((atual) => ({ ...atual, foto: null }));
      setAviso({ texto: 'Foto removida.', tipo: 'ok' });
    } catch (error) {
      setAviso({ texto: error.message, tipo: 'erro' });
    } finally {
      setSalvando(false);
    }
  };

  const sair = () => {
    if (!window.confirm('Tem certeza de que deseja sair da sua conta?')) return;
    encerrarSessao();
    navigate('/login');
  };

  const conquistas = calcularConquistas(resumo);
  const ganhas = conquistas.filter((conquista) => conquista.ganhou).length;
  const contagem = contarPorMaterial(resumo?.por_material);
  const materiais = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
  const maiorQuantidade = materiais[0]?.[1] || 1;
  const ranking = resumo?.ranking;

  const avatar = (
    <div className={`profile-avatar ${usuario.foto ? 'has-photo' : ''}`}>
      {usuario.foto ? <img src={usuario.foto} alt={`Foto de ${usuario.nome}`} /> : <UserRound size={30} aria-hidden='true' />}
    </div>
  );

  return (
    <main className='profile-page'>
      <div className='profile-shell'>
        <section className='profile-content'>
          <div className='profile-hero'>
            <button className='profile-settings-button' onClick={() => navigate('/configuracoes')} aria-label='Abrir configurações'><Settings size={18} /></button>
            {avatar}
            <h2>{carregando ? 'Carregando...' : usuario.nome}</h2>
            <p>{usuario.apelido ? `@${usuario.apelido}` : 'Sem @usuário ainda'}</p>
            <p className='profile-meta'>
              {usuario.bairro && <span><MapPin size={13} aria-hidden='true' /> {usuario.bairro}</span>}
              {resumo?.membro_desde && <span><CalendarDays size={13} aria-hidden='true' /> Desde {mesAno(resumo.membro_desde)}</span>}
            </p>
            {!editando && <button type='button' className='profile-edit-button' onClick={abrirEdicao}><Pencil size={14} aria-hidden='true' /> Editar perfil</button>}
          </div>

          {aviso.texto && <p className={`profile-notice is-${aviso.tipo}`} role={aviso.tipo === 'erro' ? 'alert' : 'status'}>{aviso.texto}</p>}

          {editando && (
            <form className='profile-edit' onSubmit={salvarPerfil}>
              <span className='home-eyebrow'>EDITAR PERFIL</span>
              <div className='profile-photo-row'>
                {avatar}
                <div className='profile-photo-actions'>
                  <button type='button' className='auth-button auth-button-secondary' onClick={() => entradaFoto.current?.click()} disabled={salvando}><Camera size={15} aria-hidden='true' /> {usuario.foto ? 'Trocar foto' : 'Adicionar foto'}</button>
                  {usuario.foto && <button type='button' className='profile-remove-photo' onClick={removerFoto} disabled={salvando}><Trash2 size={14} aria-hidden='true' /> Remover foto</button>}
                  <small>Opcional. A foto aparece só no seu perfil.</small>
                </div>
                <input ref={entradaFoto} type='file' accept='image/*' hidden onChange={trocarFoto} />
              </div>
              <label><span>Nome</span><input type='text' value={form.nome} maxLength={100} onChange={(event) => setForm({ ...form, nome: event.target.value })} required /></label>
              <label><span>@usuário</span><input type='text' value={form.apelido} maxLength={31} autoCapitalize='none' placeholder='ex.: maria_eco' onChange={(event) => setForm({ ...form, apelido: event.target.value })} /><small>Letras sem acento, números, ponto ou _ (3 a 30).</small></label>
              <label><span>Bairro</span>
                <select value={form.bairro} onChange={(event) => setForm({ ...form, bairro: event.target.value })}>
                  <option value=''>Prefiro não informar</option>
                  {BAIRROS.map((bairro) => <option key={bairro} value={bairro}>{bairro}</option>)}
                </select>
                <small>Usado no ranking do bairro.</small>
              </label>
              <div className='profile-edit-actions'>
                <button type='button' className='auth-button auth-button-secondary' onClick={() => setEditando(false)} disabled={salvando}>Cancelar</button>
                <button type='submit' className='auth-button auth-button-primary' disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          )}

          <div className='profile-stats'>
            <div><strong>{resumo?.pontos ?? usuario.pontos ?? 0}</strong><span>Pontos totais</span></div>
            <div><strong>{resumo?.total_descartes ?? 0}</strong><span>Descartes</span></div>
            <div>
              {ranking
                ? <><strong>{ranking.posicao}º de {ranking.participantes}</strong><span>No {ranking.bairro}</span></>
                : <><strong>—</strong><span>{usuario.bairro === 'Fora de Florianópolis' ? 'Sem ranking' : 'Escolha seu bairro'}</span></>}
            </div>
          </div>

          <section className='profile-section'>
            <div className='profile-section-heading'><h2>Meu impacto</h2></div>
            {materiais.length === 0
              ? <p className='profile-empty'>Seus descartes por material aparecem aqui depois do primeiro registro.</p>
              : (
                <ul className='profile-impact'>
                  {materiais.map(([chave, total]) => (
                    <li key={chave}>
                      <span className='profile-impact-label'>{nomeMaterial(chave)}</span>
                      <span className='profile-impact-bar'><span style={{ width: `${Math.max(8, (total / maiorQuantidade) * 100)}%` }} /></span>
                      <strong>{total}</strong>
                    </li>
                  ))}
                </ul>
              )}
          </section>

          <section className='profile-section'>
            <div className='profile-section-heading'><h2>Minhas conquistas <small>{ganhas} de {conquistas.length}</small></h2></div>
            <div className='profile-badges profile-badges-real'>
              {conquistas.map((conquista) => {
                const Icone = ICONES[conquista.icone];
                return (
                  <div key={conquista.id} className={`profile-badge ${conquista.ganhou ? 'is-earned' : 'is-locked'}`} title={conquista.regra}>
                    <Icone size={22} aria-hidden='true' />
                    <small>{conquista.titulo}</small>
                    {conquista.ganhou
                      ? <span className='profile-badge-status'>Conquistada</span>
                      : (
                        <>
                          <span className='profile-badge-progress' role='progressbar' aria-label={`${conquista.titulo}: ${conquista.atual} de ${conquista.meta}`} aria-valuenow={conquista.atual} aria-valuemin={0} aria-valuemax={conquista.meta}><span style={{ width: `${(conquista.atual / conquista.meta) * 100}%` }} /></span>
                          <span className='profile-badge-status'>{conquista.regra}</span>
                        </>
                      )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className='profile-system-settings'><span className='home-eyebrow'>SISTEMA</span><button onClick={() => navigate('/configuracoes')}><span><Settings size={16} /><strong>Configurações do sistema</strong><small>Dados pessoais, segurança e preferências</small></span><span>›</span></button></section>
          <button className='profile-logout' onClick={sair}><LogOut size={15} /><span>Sair da Conta</span><span>›</span></button>
        </section>
        <nav className='home-bottom-nav' aria-label='Navegação principal'><button onClick={() => navigate('/home')}><span>⌂</span><span>Início</span></button><button onClick={() => navigate('/scanner')}><span>◉</span><span>Registrar</span></button><button className='home-nav-main' onClick={() => navigate('/scanner')}><span>+</span></button><button onClick={() => navigate('/historico')}><span>◷</span><span>Histórico</span></button><button className='is-active' onClick={() => navigate('/perfil')}><span>♙</span><span>Perfil</span></button></nav>
      </div>
    </main>
  );
}
