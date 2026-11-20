-- =====================================================================
-- Migração: ecopontos reais da Prefeitura/Comcap + coordenadas
-- Fontes: FloripAmanhã (22/04/2026) para a lista dos 9 ecopontos e
-- ND+ (Comcap) para endereços, horários e as coordenadas de Monte Cristo
-- e Ingleses. Rodar no SQL Editor do Neon, UM PASSO DE CADA VEZ.
-- =====================================================================

-- PASSO 1: trocar a lista antiga (5 pontos, alguns sem fonte) pelos 9 ecopontos
-- reais. Nenhuma outra tabela aponta para "ecopontos", então dá para recriar.
TRUNCATE ecopontos RESTART IDENTITY;

INSERT INTO ecopontos (nome, endereco, bairro, horario, materiais, map_query, latitude, longitude) VALUES
('Ecoponto Itacorubi', 'Rodovia Admar Gonzaga, 72 - Itacorubi', 'Itacorubi',
  'Todos os dias: 7h às 19h',
  ARRAY['Plástico','Papel','Metal','Vidro','Eletrônicos','Óleo de Cozinha','Pilhas e Baterias','Móveis','Entulho','Podas'],
  'Ecoponto+Itacorubi+Florianopolis', NULL, NULL),
('Ecoponto Morro das Pedras', 'Rua Francisco Vieira, 198 - Morro das Pedras', 'Morro das Pedras',
  'Todos os dias: 7h às 12h e 13h às 18h30',
  ARRAY['Plástico','Papel','Metal','Vidro','Eletrônicos','Óleo de Cozinha','Pilhas e Baterias','Móveis','Entulho','Podas'],
  'Ecoponto+Morro+das+Pedras+Florianopolis', NULL, NULL),
('Ecoponto Canasvieiras', 'Rua Desembargador Maurílio Coimbra - Canasvieiras', 'Canasvieiras',
  'Seg a sex: 7h30 às 12h e 13h às 17h30; sáb: 7h30 às 11h30',
  ARRAY['Plástico','Papel','Metal','Vidro','Eletrônicos','Óleo de Cozinha','Pilhas e Baterias','Móveis','Entulho','Podas'],
  'Ecoponto+Canasvieiras+Florianopolis', NULL, NULL),
('Ecoponto Capoeiras', 'Rua Professor Egídio Ferreira, s/n (Terminal de Capoeiras)', 'Capoeiras',
  'Todos os dias: 7h às 12h e 13h às 19h',
  ARRAY['Plástico','Papel','Metal','Vidro','Eletrônicos','Óleo de Cozinha','Pilhas e Baterias','Móveis','Entulho','Podas'],
  'Ecoponto+Capoeiras+Florianopolis', NULL, NULL),
('Ecoponto Monte Cristo', 'Rua Professor Joaquim Nabuco, 2948 - Monte Cristo', 'Monte Cristo',
  'Todos os dias: 7h às 19h',
  ARRAY['Plástico','Papel','Metal','Vidro','Eletrônicos','Óleo de Cozinha','Pilhas e Baterias','Móveis','Entulho'],
  'Ecoponto+Monte+Cristo+Florianopolis', -27.590116, -48.603785),
('Ecoponto Rio Vermelho', 'Rua Cândido Pereira dos Anjos, s/n - Rio Vermelho', 'Rio Vermelho',
  'Todos os dias: 7h às 12h e 13h às 19h',
  ARRAY['Plástico','Papel','Metal','Vidro','Eletrônicos','Óleo de Cozinha','Pilhas e Baterias','Móveis','Entulho','Podas'],
  'Ecoponto+Rio+Vermelho+Florianopolis', NULL, NULL),
('Ecoponto Ingleses', 'Rua Via Local Insular, s/n (atrás da subestação da Celesc) - Ingleses', 'Ingleses',
  'Todos os dias: 7h às 12h e 13h às 19h',
  ARRAY['Plástico','Papel','Metal','Vidro','Eletrônicos','Óleo de Cozinha','Pilhas e Baterias','Móveis','Entulho','Podas'],
  'Ecoponto+Ingleses+Florianopolis', -27.433500, -48.408536),
('Ecoponto Costeira', 'Avenida Jorge Lacerda, 1374 (ao lado do NEIM) - Costeira do Pirajubaé', 'Costeira',
  'Todos os dias: 7h às 12h e 13h às 19h',
  ARRAY['Plástico','Papel','Metal','Vidro','Eletrônicos','Óleo de Cozinha','Pilhas e Baterias','Móveis','Entulho','Podas'],
  'Ecoponto+Costeira+Florianopolis', NULL, NULL),
('Ecoponto Coloninha', 'Rua Araci Vaz Callado, 2000 - Coloninha', 'Coloninha',
  'Todos os dias: 7h às 12h e 13h às 19h',
  ARRAY['Plástico','Papel','Metal','Vidro','Eletrônicos','Óleo de Cozinha','Pilhas e Baterias','Móveis','Entulho','Podas'],
  'Ecoponto+Coloninha+Florianopolis', NULL, NULL);

-- PASSO 2: coordenadas que faltam. No Google Maps, procure o ecoponto,
-- clique com o botão direito no local exato e clique nos números que
-- aparecem no topo do menu (ficam copiados, ex.: -27.588123, -48.512345).
-- Troque LAT e LNG pelos números, apague o "--" do começo e rode.
-- UPDATE ecopontos SET latitude = LAT, longitude = LNG WHERE nome = 'Ecoponto Itacorubi';
-- UPDATE ecopontos SET latitude = LAT, longitude = LNG WHERE nome = 'Ecoponto Morro das Pedras';
-- UPDATE ecopontos SET latitude = LAT, longitude = LNG WHERE nome = 'Ecoponto Canasvieiras';
-- UPDATE ecopontos SET latitude = LAT, longitude = LNG WHERE nome = 'Ecoponto Capoeiras';
-- UPDATE ecopontos SET latitude = LAT, longitude = LNG WHERE nome = 'Ecoponto Rio Vermelho';
-- UPDATE ecopontos SET latitude = LAT, longitude = LNG WHERE nome = 'Ecoponto Costeira';
-- UPDATE ecopontos SET latitude = LAT, longitude = LNG WHERE nome = 'Ecoponto Coloninha';

-- PASSO 3 (conferência): todos devem ter latitude e longitude.
SELECT id, nome, latitude, longitude FROM ecopontos ORDER BY id;
