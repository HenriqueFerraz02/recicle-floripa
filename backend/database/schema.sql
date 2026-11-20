-- =====================================================================
-- Recicle Floripa — Esquema do banco de dados (PostgreSQL / Neon)
-- Rode este arquivo no SQL Editor do Neon (ou no psql) para criar
-- o banco do zero. A ordem importa: "residuos" depende de "usuarios".
-- =====================================================================

-- ---------------------------------------------------------------------
-- Usuários do app
-- A senha é guardada como hash bcrypt (nunca em texto puro).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id              SERIAL PRIMARY KEY,
  nome            VARCHAR(100) NOT NULL,
  email           VARCHAR(150) NOT NULL UNIQUE,
  senha           VARCHAR(255) NOT NULL,
  cpf             VARCHAR(14)  UNIQUE,
  data_nascimento DATE,
  pontos          INTEGER NOT NULL DEFAULT 0,
  criado_em       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- E-mail é salvo em minúsculas pelo backend; o índice garante que
-- Teste01@x.com e teste01@x.com não virem duas contas.
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_lower_unico
  ON usuarios (LOWER(email));

-- ---------------------------------------------------------------------
-- Descartes registrados (pelo scanner com IA ou pela coleta manual)
-- ON DELETE CASCADE: ao excluir um usuário, seus descartes saem junto (LGPD).
-- "quantidade" é texto porque o app envia tanto 1 quanto '1 un'.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS residuos (
  id              SERIAL PRIMARY KEY,
  categoria       VARCHAR(50)  NOT NULL,
  tipo_reciclagem VARCHAR(255),
  quantidade      VARCHAR(30),
  localizacao     VARCHAR(255),
  usuario_id      INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  data_descarte   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- Ecopontos e pontos de coleta de Florianópolis
-- "materiais" é uma lista (TEXT[]); consulte com:
--   SELECT nome FROM ecopontos WHERE 'Eletrônicos' = ANY(materiais);
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ecopontos (
  id         SERIAL PRIMARY KEY,
  nome       VARCHAR(100) NOT NULL,
  endereco   VARCHAR(255) NOT NULL,
  bairro     VARCHAR(60),
  horario    VARCHAR(100),
  materiais  TEXT[] NOT NULL DEFAULT '{}',
  map_query  VARCHAR(150),
  latitude   NUMERIC(9,6),
  longitude  NUMERIC(9,6),
  ativo      BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO ecopontos (nome, endereco, bairro, horario, materiais, map_query) VALUES
('Ecoponto Itacorubi', 'Rodovia Admar Gonzaga, 72 - Itacorubi', 'Itacorubi', 'Segunda a Sábado: 07h às 19h',
  ARRAY['Plástico','Vidro','Metal','Papel','Eletrônicos','Óleo de Cozinha'], 'Ecoponto+Itacorubi+Florianopolis'),
('Ecoponto Capoeiras', 'Rua Professor Egídio Ferreira, s/n - Capoeiras', 'Continente', 'Segunda a Sábado: 07h às 19h',
  ARRAY['Plástico','Vidro','Metal','Papel','Móveis','Entulho'], 'Ecoponto+Capoeiras+Florianopolis'),
('Ecoponto Rio Tavares', 'Rodovia Francisco Magno Vieira (SC-405), 4500 - Rio Tavares', 'Sul da Ilha', 'Segunda a Sábado: 07h às 19h',
  ARRAY['Plástico','Vidro','Metal','Papel','Podas','Eletrônicos'], 'Ecoponto+Rio+Tavares+Florianopolis'),
('Ecoponto Canasvieiras', 'Rua Francisco Faustino Martins, s/n - Canasvieiras', 'Norte da Ilha', 'Segunda a Sábado: 07h às 19h',
  ARRAY['Plástico','Vidro','Metal','Papel','Volumosos'], 'Ecoponto+Canasvieiras+Florianopolis'),
('Ponto de Coleta Centro', 'Avenida Paulo Fontes (Terminal Integrado) - Centro', 'Centro', 'Diariamente: 06h às 22h',
  ARRAY['Plástico','Papel','Metal','Pilhas e Baterias'], 'Terminal+Centro+Florianopolis');
