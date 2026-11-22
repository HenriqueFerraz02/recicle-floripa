import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Home from './pages/Home';
import Scanner from './pages/Scanner';
import ComprovarDescarte from './pages/ComprovarDescarte';
import PontosEntrega from './pages/PontosEntrega';
import Configuracoes from './pages/Configuracoes';
import Servicos from './pages/Servicos';
import Historico from './pages/Historico';
import Perfil from './pages/Perfil';
import Coleta from './pages/Coleta';
import BuscaResiduos from './pages/BuscaResiduos';
import DocumentoLegal from './pages/DocumentoLegal';
import RotaProtegida from './components/RotaProtegida';
import AvisoServidor from './components/AvisoServidor';
import ConfirmarEmail from './pages/ConfirmarEmail';
import EsqueciSenha from './pages/EsqueciSenha';

export default function App() {
  return (
    <BrowserRouter>
      <AvisoServidor />
      <Routes>
        {/* Rota inicial redireciona para login */}
        <Route path='/' element={<Navigate to='/login' replace />} />

        {/* Autenticação */}
        <Route path='/login' element={<Login />} />
        <Route path='/cadastro' element={<Cadastro />} />

        {/* Confirmação de e-mail e troca de senha (sem login) */}
        <Route path='/confirmar-email' element={<ConfirmarEmail />} />
        <Route path='/esqueci-senha' element={<EsqueciSenha />} />

        {/* Documentos legais (LGPD) */}
        <Route path='/termos' element={<DocumentoLegal tipo='termos' />} />
        <Route path='/privacidade' element={<DocumentoLegal tipo='privacidade' />} />

        {/* Painel Principal */}
        <Route path='/home' element={<RotaProtegida><Home /></RotaProtegida>} />

        {/* Fluxo de IA e Descarte */}
        <Route path='/scanner' element={<RotaProtegida><Scanner /></RotaProtegida>} />
        <Route path='/comprovar-descarte' element={<RotaProtegida><ComprovarDescarte /></RotaProtegida>} />

        {/* Ecopontos e Mapa */}
        <Route path='/pontos' element={<RotaProtegida><PontosEntrega /></RotaProtegida>} />

        {/* Configurações da Conta */}
        <Route path='/configuracoes' element={<RotaProtegida><Configuracoes /></RotaProtegida>} />

        {/* Guia de descarte e coleta especial */}
        <Route path='/servicos' element={<RotaProtegida><Servicos /></RotaProtegida>} />
        <Route path='/historico' element={<RotaProtegida><Historico /></RotaProtegida>} />
        <Route path='/perfil' element={<RotaProtegida><Perfil /></RotaProtegida>} />
        <Route path='/coleta' element={<RotaProtegida><Coleta /></RotaProtegida>} />

        {/* Busca no catálogo oficial de resíduos (IBAMA) */}
        <Route path='/busca' element={<RotaProtegida><BuscaResiduos /></RotaProtegida>} />

        {/* Rota coringa para rotas não encontradas */}
        <Route path='*' element={<Navigate to='/home' replace />} />
      </Routes>
    </BrowserRouter>
  );
}
