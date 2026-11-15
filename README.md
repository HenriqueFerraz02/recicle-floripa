# ♻️ Recicle Floripa

> Aplicativo web para o **descarte correto de resíduos em Florianópolis/SC**: o usuário aponta a câmera do celular para um objeto, a **IA identifica o material** e indica como descartá-lo, o app mostra os **ecopontos** que aceitam aquele resíduo e recompensa cada descarte comprovado com **pontos**.

Projeto acadêmico do curso de **Análise e Desenvolvimento de Sistemas — UNICESUSC** (Projeto Multidisciplinar Integrador IV).

🌐 **Acesse:** https://recicle-floripa.vercel.app

---

## 📌 Sumário

- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Arquitetura](#-arquitetura)
- [Como a IA funciona](#-como-a-ia-funciona)
- [Banco de dados](#-banco-de-dados)
- [Como rodar o projeto](#-como-rodar-o-projeto)
- [Testando no celular (câmera)](#-testando-no-celular-câmera)
- [API — rotas](#-api--rotas)
- [Segurança](#-segurança)
- [Próximos passos](#-próximos-passos)
- [Equipe](#-equipe)

---

## ✨ Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| **Cadastro e login** | Conta com nome, e-mail, CPF e data de nascimento; senha protegida com hash **bcrypt** |
| **Scanner com IA** | Câmera ao vivo identifica o objeto e retorna categoria, cor da lixeira e instrução de preparo |
| **Comprovação de descarte** | Foto da lixeira/ecoponto validada por IA (anti-fraude) antes de liberar os pontos |
| **Gamificação** | +5 pontos por descarte registrado, com barra de progresso |
| **Ecopontos** | Lista de pontos de coleta de Florianópolis com filtro por bairro ou material e mapa |
| **Coleta manual** | Registro de descarte sem câmera |
| **Histórico** | Lista de todos os descartes do usuário, com opção de excluir |
| **Perfil e configurações** | Edição de nome, troca de senha (com validação da senha atual) e relatório mensal/anual |

---

## 🛠 Tecnologias

| Camada | Tecnologias |
|---|---|
| **Frontend** | React 19, Vite, React Router, Tailwind CSS, Axios, Lucide Icons |
| **Backend** | Node.js, Express 5, bcrypt, cors, dotenv |
| **Banco de dados** | PostgreSQL 18 na nuvem (**Neon**, região São Paulo) |
| **Inteligência Artificial** | Google **Gemini** (Flash-Lite) via `@google/genai` |
| **Ferramentas** | Git/GitHub, ESLint, nodemon, Cloudflare Tunnel (testes em HTTPS) |

---

## 🏗 Arquitetura

```
┌─────────────────────┐      HTTPS / JSON      ┌──────────────────────┐
│  Frontend (React)   │ ─────────────────────▶ │  Backend (Express)   │
│  celular / navegador│ ◀───────────────────── │  API REST            │
└─────────────────────┘                        └──────────┬───────────┘
                                                          │
                                   ┌──────────────────────┼──────────────────────┐
                                   ▼                                             ▼
                        ┌──────────────────────┐                     ┌──────────────────────┐
                        │ PostgreSQL (Neon)    │                     │ Google Gemini (IA)   │
                        │ usuarios, residuos,  │                     │ identificação e      │
                        │ ecopontos            │                     │ validação de imagens │
                        └──────────────────────┘                     └──────────────────────┘
```

```
recicle-floripa/
├── backend/
│   ├── src/
│   │   ├── server.js        # inicia o Express e configura o CORS
│   │   ├── routes.js        # rotas da API (usuários, resíduos, IA)
│   │   └── database.js      # conexão com o PostgreSQL (pool)
│   ├── database/
│   │   └── schema.sql       # criação das tabelas + dados iniciais
│   └── .env.example         # modelo das variáveis de ambiente
├── frontend/
│   ├── src/
│   │   ├── pages/           # telas (Login, Home, Scanner, PontosEntrega...)
│   │   ├── components/      # CameraCapture
│   │   └── utils/           # api.js (endereço da API)
│   └── .env.example
└── package.json             # atalhos para rodar backend e frontend
```

---

## 🤖 Como a IA funciona

1. O app captura um quadro da câmera e envia ao backend (`POST /ia/analisar`).
2. O backend valida a imagem (formato real JPEG/PNG/WebP e limite de 8 MB) e a envia ao **Gemini** junto com um *prompt* de especialista em reciclagem.
3. O Gemini devolve um JSON com `item`, `categoria`, `corLixeira`, `instrucaoPreparo` e `pontosSugeridos`.
4. Na comprovação, uma segunda chamada (`POST /ia/validar-descarte`) confere se a foto mostra de fato uma lixeira ou ecoponto.

**Resiliência:** em falhas temporárias (429, 5xx) o backend tenta novamente com *backoff* exponencial e, se preciso, troca para um modelo reserva.

> A IA traz praticidade, mas pode errar. Por isso o projeto evolui para **combinar a IA com dados oficiais no banco** (catálogo de resíduos e ecopontos) e permitir **busca manual** como alternativa.

---

## 🗄 Banco de dados

| Tabela | Conteúdo |
|---|---|
| `usuarios` | Dados da conta, hash da senha e pontuação |
| `residuos` | Descartes registrados — **FK** para `usuarios` com `ON DELETE CASCADE` |
| `ecopontos` | Pontos de coleta com lista de materiais aceitos (`TEXT[]`) |
| `catalogo_residuos` | **Lista Brasileira de Resíduos Sólidos (IBAMA, IN nº 13/2012)**: 1.010 códigos oficiais (20 capítulos, 112 subcapítulos, 878 resíduos, 449 perigosos), com hierarquia por `codigo_pai` |

Os scripts estão em [`backend/database/`](backend/database/): primeiro o `schema.sql`, depois o `catalogo_ibama.sql`.

**Ligando a lista oficial ao app:** além dos dados do IBAMA, o grupo classificou os itens do dia a dia com três campos próprios: `categoria_app` (a mesma categoria que a IA devolve), `material_ecoponto` (o mesmo texto de `ecopontos.materiais`) e `nomes_populares` (termos da busca manual). Exemplo — onde descartar pilhas:

```sql
SELECT c.codigo, c.descricao, e.nome AS ecoponto
FROM catalogo_residuos c
JOIN ecopontos e ON c.material_ecoponto = ANY(e.materiais)
WHERE c.nomes_populares ILIKE '%pilha%';
```

---

## 🚀 Como rodar o projeto

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão LTS)
- Conta gratuita no [Neon](https://neon.tech/) (PostgreSQL)
- Chave de API do [Google AI Studio](https://aistudio.google.com/) (Gemini)

### 1. Clonar e instalar
```bash
git clone https://github.com/HenriqueFerraz02/recicle-floripa.git
cd recicle-floripa
npm run install:all
```

### 2. Criar o banco
No painel do Neon, abra o **SQL Editor** e rode, nesta ordem, o conteúdo de `backend/database/schema.sql` e de `backend/database/catalogo_ibama.sql`.

### 3. Configurar as variáveis de ambiente
- Copie `backend/.env.example` para **`backend/.env`** e preencha `DATABASE_URL` e `GEMINI_API_KEY`.
- Copie `frontend/.env.example` para **`frontend/.env.local`**.

### 4. Iniciar (dois terminais, na pasta principal)
```bash
npm run dev:backend    # API em http://localhost:3000
npm run dev:frontend   # App em http://localhost:5173
```

Abra **http://localhost:5173** no navegador.

---

## 📱 Testando no celular (câmera)

O navegador do celular só libera a câmera em **HTTPS**. Para testar localmente, use o Cloudflare Tunnel (quatro terminais):

| # | Terminal | Comando |
|---|---|---|
| 1 | Backend | `npm run dev:backend` |
| 2 | Túnel do backend | `npx cloudflared tunnel --url http://localhost:3000` |
| 3 | Frontend | `npm run dev:frontend` *(depois de colocar o link do túnel 2 em `VITE_API_URL` no `frontend/.env.local`)* |
| 4 | Túnel do frontend | `npx cloudflared tunnel --url http://localhost:5173` → **abrir este link no celular** |

> Os links `*.trycloudflare.com` mudam a cada execução.

---

## 🔌 API — rotas

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/` | Status da API |
| `POST` | `/usuarios` | Cadastro |
| `POST` | `/login` | Login |
| `GET` | `/usuarios/:id` | Dados do perfil |
| `PUT` | `/usuarios/:id` | Atualizar nome |
| `PUT` | `/usuarios/:id/senha` | Trocar senha |
| `POST` | `/residuos` | Registrar descarte (+5 pontos) |
| `GET` | `/residuos/:usuario_id` | Histórico do usuário |
| `DELETE` | `/residuos/:id` | Excluir descarte (−5 pontos) |
| `POST` | `/ia/analisar` | Identificar resíduo por imagem |
| `POST` | `/ia/validar-descarte` | Validar foto do descarte |

---

## 🔒 Segurança

- Senhas com **hash bcrypt** (10 *salt rounds*) e regra de senha forte.
- Credenciais apenas em variáveis de ambiente (`.env` fora do Git).
- Conexão com o banco por **TLS** (`sslmode=verify-full`).
- Validação de imagens no servidor (assinatura do arquivo e tamanho máximo).
- Dados hospedados no Brasil (Neon, região São Paulo), em linha com a **LGPD**.

---

## 🧭 Próximos passos

- [ ] Autenticação com **JWT** nas rotas da API
- [x] **Catálogo oficial de resíduos** (Lista Brasileira de Resíduos Sólidos — IBAMA) no banco
- [ ] Tela de busca manual no catálogo
- [ ] Integrar a resposta da IA com o catálogo e os ecopontos do banco
- [x] Hospedagem em produção (backend no Render, frontend na Vercel)
- [ ] Publicação na **Google Play** e na **App Store** (empacotamento com Capacitor)

---

## 👥 Equipe

| Integrante | Papel |
|---|---|
| **Henrique Hoepers Ferraz** | Líder do projeto, backend, banco de dados e QA |
| **Luis Gustavo Angelo** | Frontend e infraestrutura |
| **Lucas de Azevedo Corso** | Integração com Inteligência Artificial (Gemini) |

---

<sub>Projeto acadêmico — Análise e Desenvolvimento de Sistemas · UNICESUSC · Florianópolis/SC · 2026</sub>
