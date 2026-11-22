# ♻️ Recicle Floripa

> Aplicativo web para o **descarte correto de resíduos em Florianópolis/SC**: o usuário aponta a câmera do celular para um objeto, a **IA identifica o material** e indica como descartá-lo, o app mostra os **ecopontos mais próximos** e recompensa cada descarte comprovado com **pontos**.

Projeto acadêmico do curso de **Análise e Desenvolvimento de Sistemas — UNICESUSC** (Projeto Multidisciplinar Integrador IV).

| | |
|---|---|
| 🌐 **App publicado** | https://recicle-floripa.vercel.app |
| 🔌 **API** | https://recicle-floripa-api.onrender.com |
| 📦 **Repositório** | https://github.com/HenriqueFerraz02/recicle-floripa |

> A API está no plano gratuito do Render, que "dorme" sem uso: o primeiro acesso do dia pode levar até 1 minuto. O app avisa com a faixa **"Acordando o servidor..."**.

---

## 📌 Sumário

- [O problema e a solução](#-o-problema-e-a-solução)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Arquitetura](#-arquitetura)
- [Como a IA funciona](#-como-a-ia-funciona)
- [Banco de dados](#-banco-de-dados)
- [Como rodar o projeto](#-como-rodar-o-projeto)
- [Testando no celular (câmera)](#-testando-no-celular-câmera)
- [API — rotas](#-api--rotas)
- [Segurança e LGPD](#-segurança-e-lgpd)
- [Acessibilidade](#-acessibilidade)
- [Organização do trabalho](#-organização-do-trabalho)
- [Status e próximos passos](#-status-e-próximos-passos)
- [Equipe](#-equipe)

---

## 🎯 O problema e a solução

Florianópolis recebe milhões de turistas e cresce rápido. Moradores, visitantes e pequenos comércios muitas vezes **não sabem como nem onde descartar cada resíduo**, e material reciclável acaba no lixo comum, nas praias e nos aterros.

O Recicle Floripa responde a pergunta **"onde isso vai?"** pelo celular: a câmera identifica o resíduo, o app explica como descartar e mostra o ecoponto mais perto, e o descarte comprovado vira pontos.

---

## ✨ Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| **Cadastro com confirmação de e-mail** | Nome, e-mail, CPF (dígitos verificadores) e data de nascimento. A conta só entra depois de digitar o código de 6 dígitos enviado por e-mail |
| **Login e "Esqueci minha senha"** | E-mail sem diferença de maiúsculas, senha forte e recuperação de senha por código no e-mail |
| **Scanner com IA** | Câmera ao vivo identifica o objeto e retorna categoria, cor da lixeira e instrução de preparo |
| **Comprovação de descarte** | Foto da lixeira/ecoponto validada pela IA antes de liberar os pontos (anti-fraude) |
| **Gamificação** | +5 pontos por descarte, barra de progresso e sequência de dias seguidos reciclando |
| **"Onde descartar?"** | Busca no catálogo oficial do IBAMA (1.010 códigos), sem diferença de acentos |
| **Ecopontos** | Os 9 ecopontos oficiais de Florianópolis, com filtro por bairro ou material, mapa, rota no Google Maps e botão **"Mostrar os mais próximos de mim"** |
| **Perfil** | Foto opcional, @usuário, bairro, impacto por material, 8 conquistas e ranking do bairro |
| **Histórico e coleta manual** | Lista dos descartes, com opção de excluir, e registro sem câmera |
| **Configurações** | Troca de senha, relatório mensal/anual, tema escuro, texto maior e **excluir a própria conta** |
| **Termos de Uso e Política de Privacidade** | Telas próprias, em linguagem simples, seguindo a LGPD |

---

## 🛠 Tecnologias

| Camada | Tecnologias |
|---|---|
| **Frontend** | React 19, Vite, React Router, Tailwind CSS, Axios, Lucide Icons |
| **Backend** | Node.js, Express 5, bcrypt, jsonwebtoken (JWT), helmet, express-rate-limit, cors, dotenv |
| **Banco de dados** | PostgreSQL 18 na nuvem (**Neon**, região São Paulo) |
| **Inteligência Artificial** | Google **Gemini** (Flash-Lite) via `@google/genai` |
| **E-mail** | **Brevo** (API HTTPS) para os códigos de confirmação e de nova senha |
| **Hospedagem** | **Vercel** (frontend) e **Render** (backend) |
| **Ferramentas** | Git/GitHub, ESLint, nodemon, Cloudflare Tunnel (testes em HTTPS) |

---

## 🏗 Arquitetura

```
┌─────────────────────┐      HTTPS / JSON      ┌──────────────────────┐
│  Frontend (React)   │ ─────────────────────▶ │  Backend (Express)   │
│  Vercel             │ ◀───────────────────── │  API REST · Render   │
└─────────────────────┘    token JWT no login  └──────────┬───────────┘
                                                          │
                     ┌────────────────────────────────────┼────────────────────────────┐
                     ▼                                    ▼                            ▼
          ┌──────────────────────┐            ┌──────────────────────┐     ┌──────────────────────┐
          │ PostgreSQL (Neon)    │            │ Google Gemini (IA)   │     │ Brevo (e-mail)       │
          │ usuários, descartes, │            │ identificação e      │     │ códigos de 6 dígitos │
          │ ecopontos, catálogo  │            │ validação de imagens │     │                      │
          └──────────────────────┘            └──────────────────────┘     └──────────────────────┘
```

```
recicle-floripa/
├── backend/
│   ├── src/
│   │   ├── server.js        # inicia o Express: helmet, CORS e rotas
│   │   ├── routes.js        # rotas da API (usuários, descartes, IA, ecopontos, catálogo)
│   │   ├── auth.js          # gera e confere o token JWT; cada um só acessa os próprios dados
│   │   ├── limites.js       # limite de tentativas (login, cadastro, IA, códigos, senha)
│   │   ├── codigos.js       # códigos de 6 dígitos (guardados só como hash)
│   │   ├── email.js         # envio de e-mail pelo Brevo
│   │   ├── validacoes.js    # e-mail, senha forte, CPF e data de nascimento
│   │   ├── bairros.js       # bairros de Florianópolis (perfil e ranking)
│   │   └── database.js      # conexão com o PostgreSQL (pool, TLS)
│   ├── database/
│   │   ├── schema.sql       # criação das tabelas + ecopontos oficiais
│   │   ├── catalogo_ibama.sql
│   │   └── migracoes/       # mudanças para bancos que já existiam
│   └── .env.example         # modelo das variáveis de ambiente
├── frontend/
│   ├── src/
│   │   ├── pages/           # telas (Login, Cadastro, Home, Scanner, Perfil, PontosEntrega...)
│   │   ├── components/      # câmera, rota protegida, tema, aviso do servidor
│   │   └── utils/           # sessão (token), API, senha/CPF, distância, conquistas
│   ├── scripts/             # gera o tema escuro a partir do CSS
│   └── .env.example
├── iniciar.bat              # Windows: abre backend e frontend com um clique
└── package.json             # atalhos para instalar e rodar tudo
```

---

## 🤖 Como a IA funciona

1. O app captura um quadro da câmera e envia ao backend (`POST /ia/analisar`), com o token de login.
2. O backend valida a imagem (formato real JPEG/PNG/WebP e limite de 8 MB) e a envia ao **Gemini** junto com um *prompt* de especialista em reciclagem.
3. O Gemini devolve um JSON com `item`, `categoria`, `corLixeira`, `instrucaoPreparo` e `pontosSugeridos`.
4. Na comprovação, uma segunda chamada (`POST /ia/validar-descarte`) confere se a foto mostra de fato uma lixeira ou ecoponto.

**Resiliência:** em falhas temporárias (429, 5xx), o backend tenta de novo com *backoff* exponencial e, se preciso, troca para um modelo reserva.
**Custo:** cada usuário pode fazer até 30 análises a cada 15 minutos, para proteger a cota gratuita.
**Privacidade:** as fotos vão ao Gemini só para a identificação e **não ficam guardadas** no banco.

> A IA traz praticidade, mas pode errar. Por isso o app combina a IA com **dados oficiais** (catálogo do IBAMA e ecopontos) e oferece a **busca manual** como alternativa. Em um teste inicial, a IA acertou **3 de 3 itens** em cerca de 2 s cada; a meta dos requisitos (90% de acerto) ainda precisa de um teste maior.

---

## 🗄 Banco de dados

| Tabela | Conteúdo |
|---|---|
| `usuarios` | Dados da conta, hash da senha, pontos, perfil (@usuário, bairro, foto) e se o e-mail foi confirmado |
| `residuos` | Descartes registrados — **FK** para `usuarios` com `ON DELETE CASCADE` |
| `codigos_email` | Códigos de confirmação e de nova senha: só o hash, validade de 15 min e número de tentativas |
| `ecopontos` | Os 9 ecopontos oficiais, com coordenadas, horário e materiais aceitos (`TEXT[]`) |
| `catalogo_residuos` | **Lista Brasileira de Resíduos Sólidos (IBAMA, IN nº 13/2012)**: 1.010 códigos oficiais (20 capítulos, 112 subcapítulos, 878 resíduos, 449 perigosos), com hierarquia por `codigo_pai` |

Índices únicos em `LOWER(email)` e `LOWER(apelido)` impedem contas repetidas com letras maiúsculas diferentes.

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
- *(Opcional)* Conta gratuita no [Brevo](https://www.brevo.com/) para enviar e-mails de verdade

### 1. Clonar e instalar
```bash
git clone https://github.com/HenriqueFerraz02/recicle-floripa.git
cd recicle-floripa
npm run install:all
```

### 2. Criar o banco
No painel do Neon, abra o **SQL Editor** e rode, nesta ordem, o conteúdo de `backend/database/schema.sql` e de `backend/database/catalogo_ibama.sql`.

> Banco novo não precisa das `migracoes/`: o `schema.sql` já está completo. Elas servem só para atualizar um banco criado antes de cada mudança.

### 3. Configurar as variáveis de ambiente
Copie `backend/.env.example` para **`backend/.env`** e preencha:

| Variável | Obrigatória | Para quê |
|---|---|---|
| `DATABASE_URL` | Sim | Connection string do Neon |
| `JWT_SECRET` | Sim | Assina os tokens de login (mínimo 32 caracteres, um diferente em cada ambiente). Gere com `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `GEMINI_API_KEY` | Sim | Chave do Gemini |
| `BREVO_API_KEY` e `EMAIL_REMETENTE` | Não | Envio de e-mails. **Sem elas, o código de confirmação aparece no terminal do backend** (bom para testes) |
| `CORS_ORIGINS`, `PERMITIR_TUNEL`, `PORT` | Não | Testes no celular e porta da API |

Depois, copie `frontend/.env.example` para **`frontend/.env.local`**.

> **Nunca** envie o `.env` para o GitHub (ele já está no `.gitignore`).

### 4. Iniciar (dois terminais separados, na pasta principal)
```bash
npm run dev:backend    # API em http://localhost:3000
npm run dev:frontend   # App em http://localhost:5173
```

No Windows, dá para usar o **`iniciar.bat`**, que abre os dois e o navegador. Abra **http://localhost:5173**.

---

## 📱 Testando no celular (câmera)

O navegador do celular só libera a câmera em **HTTPS**. O jeito mais simples é usar o app publicado: https://recicle-floripa.vercel.app

Para testar o código local no celular, use o Cloudflare Tunnel (quatro terminais) e coloque `PERMITIR_TUNEL=true` no `backend/.env`:

| # | Terminal | Comando |
|---|---|---|
| 1 | Backend | `npm run dev:backend` |
| 2 | Túnel do backend | `npx cloudflared tunnel --url http://localhost:3000` |
| 3 | Frontend | `npm run dev:frontend` *(depois de colocar o link do túnel 2 em `VITE_API_URL` no `frontend/.env.local`)* |
| 4 | Túnel do frontend | `npx cloudflared tunnel --url http://localhost:5173` → **abrir este link no celular** |

> Os links `*.trycloudflare.com` mudam a cada execução.

---

## 🔌 API — rotas

🔒 = exige login (token JWT no cabeçalho `Authorization: Bearer ...`). 👤 = só o dono dos dados.

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/` | Público | Status da API |
| `GET` | `/catalogo?busca=` | Público | Busca no catálogo do IBAMA |
| `GET` | `/ecopontos` | Público | Ecopontos oficiais com coordenadas |
| `POST` | `/usuarios` | Público | Cadastro (envia o código por e-mail) |
| `POST` | `/usuarios/confirmar-email` | Público | Confirma o e-mail com o código e já faz o login |
| `POST` | `/usuarios/reenviar-codigo` | Público | Manda um novo código |
| `POST` | `/login` | Público | Login (devolve o token) |
| `POST` | `/senha/esqueci` | Público | Manda o código para criar nova senha |
| `POST` | `/senha/redefinir` | Público | Cria a nova senha com o código |
| `GET` | `/usuarios/:id` | 🔒👤 | Dados da conta |
| `PUT` | `/usuarios/:id` | 🔒👤 | Atualizar nome |
| `PUT` | `/usuarios/:id/perfil` | 🔒👤 | Atualizar nome, @usuário e bairro |
| `PUT` / `DELETE` | `/usuarios/:id/foto` | 🔒👤 | Trocar ou remover a foto |
| `GET` | `/usuarios/:id/resumo` | 🔒👤 | Impacto, conquistas e ranking do bairro |
| `PUT` | `/usuarios/:id/senha` | 🔒👤 | Trocar senha (pede a senha atual) |
| `DELETE` | `/usuarios/:id` | 🔒👤 | Excluir a conta e todos os dados (pede a senha) |
| `POST` | `/residuos` | 🔒 | Registrar descarte (+5 pontos) |
| `GET` | `/residuos/:usuario_id` | 🔒👤 | Histórico do usuário |
| `DELETE` | `/residuos/:id` | 🔒👤 | Excluir descarte (−5 pontos) |
| `POST` | `/ia/analisar` | 🔒 | Identificar resíduo por imagem |
| `POST` | `/ia/validar-descarte` | 🔒 | Validar a foto do descarte |

---

## 🔒 Segurança e LGPD

| Proteção | Como funciona |
|---|---|
| **Login com token (JWT)** | Gerado no login, vale 7 dias. Sem ele a API recusa; com ele, cada pessoa só vê e altera **os próprios dados** |
| **Limite de tentativas** | 10 logins errados a cada 15 min, 5 cadastros por hora, 30 análises de IA a cada 15 min, 5 e-mails por hora e 10 senhas erradas a cada 15 min |
| **E-mail confirmado** | Código de 6 dígitos, guardado só como hash, válido por 15 min, com 5 tentativas e uso único. As respostas não revelam se um e-mail está cadastrado |
| **Senhas** | Hash **bcrypt** e senha forte obrigatória (8 a 64 caracteres, maiúscula, minúscula, número, símbolo e bloqueio de senhas comuns) |
| **Validações no servidor** | E-mail, CPF, data de nascimento, imagens (assinatura real e tamanho) e foto de perfil (até 300 KB) |
| **Cabeçalhos e CORS** | `helmet` e lista fechada de sites que podem chamar a API |
| **Segredos** | Só em variáveis de ambiente (`.env` e Render), nunca no GitHub |
| **Banco** | Conexão criptografada (TLS, certificado conferido) e dados hospedados no Brasil (Neon, São Paulo) |
| **LGPD** | Termos de Uso, Política de Privacidade, localização calculada no próprio celular (não vai ao servidor) e **exclusão da conta pelo app**, que apaga conta, descartes e códigos de uma vez |

**Ataques testados antes de publicar:**

| Tentativa | Antes | Agora |
|---|---|---|
| Trocar o número na URL para ver outra conta | Mostrava nome, e-mail e CPF | Recusado (403) |
| Usar a API sem fazer login | Funcionava | Recusado (401) |
| Adivinhar a senha tentando várias | Sem limite | Bloqueio após 10 erros em 15 min |
| Criar conta com e-mail inventado | Entrava direto | Só entra com o código do e-mail |
| Usar a câmera sem parar para gastar a IA | Sem limite | 30 análises a cada 15 min |

Contato para pedidos sobre dados pessoais: **reciclefloripa@gmail.com**

---

## ♿ Acessibilidade

- **Tema escuro** e opção **"Texto maior"** (+18%), salvos no aparelho.
- Contraste de todos os textos no padrão **WCAG AA** (4,5:1), nos temas claro e escuro, medido em 11 telas.
- Menor fonte de 12,5 px, áreas de toque de 40 px e foco visível pelo teclado.

O tema escuro é gerado por `frontend/scripts/gerar-tema-escuro.mjs` a partir do `index.css`. Se as cores mudarem, rode de novo dentro da pasta `frontend`:

```bash
node scripts/gerar-tema-escuro.mjs
```

---

## 🗂 Organização do trabalho

- Metodologia **Scrum**, com backlog e quadro no **Trello**.
- Cada mudança é feita em uma *branch* própria, testada e só depois juntada na `main`, que publica sozinha na Vercel e no Render.
- Mudanças no banco ficam registradas em `backend/database/migracoes/`, com data no nome do arquivo.

---

## 🧭 Status e próximos passos

**Pronto e publicado**
- [x] Cadastro com confirmação de e-mail, login com JWT e "Esqueci minha senha"
- [x] Scanner com IA e comprovação do descarte
- [x] Catálogo oficial do IBAMA e busca "Onde descartar?"
- [x] Ecopontos oficiais com os mais próximos pela localização
- [x] Perfil com foto, conquistas e ranking do bairro
- [x] Tema escuro, texto maior e acessibilidade
- [x] Termos, Política de Privacidade e exclusão da conta (LGPD)
- [x] Hospedagem em produção (Vercel, Render e Neon)

**Próximos passos**
- [ ] Medir o acerto da IA com dezenas de fotos (meta: 90%)
- [ ] Pontos só com a foto aprovada pela IA, com limite por dia
- [ ] Trocar pontos por prêmios com parceiros locais
- [ ] Versões em inglês e espanhol (turistas)
- [ ] Testes automáticos com GitHub Actions
- [ ] Publicação na **Google Play** e na **App Store**

---

## 👥 Equipe

| Integrante | Papel |
|---|---|
| **Henrique Hoepers Ferraz** | Líder do projeto, backend, banco de dados, segurança e QA |
| **Luis Gustavo Angelo** | Frontend e infraestrutura |
| **Lucas de Azevedo Corso** | Integração com Inteligência Artificial (Gemini) |

---

<sub>Projeto acadêmico — Análise e Desenvolvimento de Sistemas · UNICESUSC · Florianópolis/SC · 2026</sub>
