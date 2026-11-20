import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './tema-escuro.css'
import { iniciarAparencia } from './utils/aparencia'
import App from './App.jsx'

// Aplica tema e tamanho do texto salvos antes de desenhar a tela.
iniciarAparencia()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)