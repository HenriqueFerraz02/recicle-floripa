/* eslint-disable no-undef, @typescript-eslint/no-require-imports */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');

const app = express();

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  ...(process.env.CORS_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean),
]);

// Túneis do Cloudflare (testes no celular) só quando PERMITIR_TUNEL=true no .env.
// Em produção (Render) fica desligado: a API aceita só os sites da lista.
const permitirTunel = process.env.PERMITIR_TUNEL === 'true';

// O Render fica na frente da API (proxy): isso faz o limite de tentativas
// enxergar o IP real de quem acessa.
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const isCloudflareQuickTunnel = permitirTunel && /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/i.test(origin || '');
    callback(null, !origin || allowedOrigins.has(origin) || isCloudflareQuickTunnel);
  },
}));
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});
app.use(express.json({ limit: '12mb' }));
app.use(routes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});