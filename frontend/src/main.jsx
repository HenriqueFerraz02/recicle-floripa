import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './tema-escuro.css'
import { iniciarAparencia } from './utils/aparencia'
import { acordarServidor, instalarInterceptadores } from './utils/sessao'
import App from './App.jsx'

// Aplica tema e tamanho do texto salvos antes de desenhar a tela.
iniciarAparencia()
// Envia o token de login em todo pedido à API.
instalarInterceptadores()
// Já acorda o servidor gratuito (Render) enquanto a pessoa usa a tela.
acordarServidor()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)