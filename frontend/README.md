# Recicle Floripa — Frontend

Interface em **React 19 + Vite** do Recicle Floripa.

A documentação completa (funcionalidades, como rodar, variáveis de ambiente, rotas da API e segurança) está no [README principal](../README.md).

## Comandos (dentro da pasta `frontend`)

| Comando | O que faz |
|---|---|
| `npm run dev` | Abre o app em http://localhost:5173 |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run lint` | Confere o código com o ESLint |
| `node scripts/gerar-tema-escuro.mjs` | Gera o `src/tema-escuro.css` a partir do `src/index.css` |

O endereço da API fica em `frontend/.env.local` (`VITE_API_URL`). Veja o modelo em `.env.example`.
