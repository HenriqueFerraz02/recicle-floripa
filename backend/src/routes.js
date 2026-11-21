/* eslint-disable no-undef, @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const express = require('express');
const routes = express.Router();
const pool = require('./database');
const bcrypt = require('bcrypt');
const { GoogleGenAI } = require('@google/genai');
const {
  normalizarEmail,
  validarSenha,
  cpfValido,
  formatarCpf,
  converterDataNascimento,
} = require('./validacoes');

const SALT_ROUNDS = 10;
const MAX_CAMERA_FRAME_BYTES = 8 * 1024 * 1024;
const ASSINATURAS_IMAGEM = {
  'image/jpeg': (buffer) =>
    buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  'image/png': (buffer) =>
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (buffer) =>
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP',
};
const MODELOS_IA = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];
const TENTATIVAS_POR_MODELO = 3;
const ATRASO_BASE_MS = 350;

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const erroTransitorio = (error) => {
  const status = Number(error.status || error.response?.status);
  const codigo = String(error.code || error.status || '').toUpperCase();
  return (
    [429, 500, 502, 503, 504].includes(status) ||
    [
      'UNAVAILABLE',
      'RESOURCE_EXHAUSTED',
      'INTERNAL',
      'DEADLINE_EXCEEDED',
      'ECONNRESET',
      'ETIMEDOUT',
    ].includes(codigo)
  );
};

const gerarConteudoComResiliencia = async (ai, contents, config) => {
  let ultimoErro;

  for (const model of MODELOS_IA) {
    for (
      let tentativa = 1;
      tentativa <= TENTATIVAS_POR_MODELO;
      tentativa += 1
    ) {
      try {
        return await ai.models.generateContent({ model, contents, config });
      } catch (error) {
        ultimoErro = error;
        if (!erroTransitorio(error)) throw error;

        const esgotouTentativas = tentativa === TENTATIVAS_POR_MODELO;
        if (esgotouTentativas) {
          console.warn(
            `Modelo ${model} indisponível após ${tentativa} tentativas; tentando próximo modelo.`
          );
          break;
        }

        const atraso =
          ATRASO_BASE_MS * 2 ** (tentativa - 1) +
          Math.floor(Math.random() * 200);
        console.warn(
          `Erro transitório no modelo ${model}; nova tentativa ${tentativa + 1}/${TENTATIVAS_POR_MODELO} em ${atraso}ms.`
        );
        await esperar(atraso);
      }
    }
  }

  const indisponivel = new Error(
    'O serviço de identificação está temporariamente ocupado. Tente novamente em alguns instantes.'
  );
  indisponivel.status = 503;
  indisponivel.code = 'AI_TEMPORARILY_UNAVAILABLE';
  indisponivel.cause = ultimoErro;
  throw indisponivel;
};

const receberFrameDaCamera = (req, res, next) => {
  const { frame, mimeType } = req.body || {};
  const base64Valido =
    typeof frame === 'string' &&
    frame.length > 0 &&
    frame.length % 4 === 0 &&
    /^[A-Za-z0-9+/]+={0,2}$/.test(frame);

  if (!base64Valido || !ASSINATURAS_IMAGEM[mimeType]) {
    return res.status(400).json({
      error: 'Envie um frame JPEG, PNG ou WebP válido capturado pela câmera.',
    });
  }

  const buffer = Buffer.from(frame, 'base64');
  if (buffer.length > MAX_CAMERA_FRAME_BYTES) {
    return res
      .status(413)
      .json({ error: 'O frame da câmera excede o limite de 8 MB.' });
  }
  if (buffer.length === 0 || buffer.toString('base64') !== frame) {
    return res
      .status(400)
      .json({ error: 'O frame da câmera está corrompido.' });
  }
  if (!ASSINATURAS_IMAGEM[mimeType](buffer)) {
    return res.status(400).json({
      error: 'O formato declarado não corresponde ao conteúdo do frame.',
    });
  }

  req.cameraFrame = { data: frame, mimeType };
  return next();
};

// Rota de teste
routes.get('/', (req, res) => {
  return res.json({ message: 'API Recicle Floripa Online!' });
});

// ==========================================
// BUSCA NO CATÁLOGO OFICIAL DE RESÍDUOS (IBAMA)
// Ex.: GET /catalogo?busca=pilha
// ==========================================
routes.get('/catalogo', async (req, res) => {
  const termo = String(req.query.busca || '').trim();

  if (termo.length < 2) {
    return res
      .status(400)
      .json({ error: 'Digite pelo menos 2 letras para buscar.' });
  }

  // Escapa % e _ para o texto do usuário ser buscado literalmente
  const padrao = `%${termo.replace(/[%_\\]/g, '\\$&')}%`;

  try {
    const resultado = await pool.query(
      `SELECT c.codigo, c.descricao, c.perigoso, c.categoria_app, c.nomes_populares,
              (c.nomes_populares IS NOT NULL) AS item_comum,
              COALESCE(
                json_agg(json_build_object('nome', e.nome, 'endereco', e.endereco, 'bairro', e.bairro, 'horario', e.horario))
                  FILTER (WHERE e.id IS NOT NULL),
                '[]'
              ) AS ecopontos
         FROM catalogo_residuos c
         LEFT JOIN ecopontos e ON e.ativo AND c.material_ecoponto = ANY(e.materiais)
        WHERE c.nivel = 3 AND (unaccent(c.nomes_populares) ILIKE unaccent($1) OR unaccent(c.descricao) ILIKE unaccent($1))
        GROUP BY c.codigo
        ORDER BY (unaccent(c.nomes_populares) ILIKE unaccent($1)) DESC NULLS LAST, c.codigo
        LIMIT 20`,
      [padrao]
    );
    return res.json(resultado.rows);
  } catch (err) {
    console.error('❌ Erro na busca do catálogo:', err);
    return res.status(500).json({ error: 'Erro ao buscar no catálogo.' });
  }
});

// Lista de ecopontos ativos. A distância até o usuário é calculada no
// próprio celular: a localização dele nunca é enviada para o servidor.
routes.get('/ecopontos', async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id, nome, endereco, bairro, horario, materiais, map_query,
              latitude::float AS latitude, longitude::float AS longitude
         FROM ecopontos
        WHERE ativo
        ORDER BY nome`
    );
    return res.json(resultado.rows);
  } catch (err) {
    console.error('❌ Erro ao listar ecopontos:', err);
    return res.status(500).json({ error: 'Erro ao buscar os ecopontos.' });
  }
});

// ==========================================
// ROTA DE IA: ANÁLISE DE RESÍDUOS POR IMAGEM
// ==========================================
routes.post('/ia/analisar', receberFrameDaCamera, async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error(
        '❌ GEMINI_API_KEY não foi encontrada nas variáveis de ambiente (.env).'
      );
      return res
        .status(500)
        .json({ error: 'Chave de API não configurada no servidor.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Você é um especialista em reciclagem e sustentabilidade urbana no Brasil.
      Analise a imagem enviada e retorne estritamente um objeto JSON com o seguinte formato:
      {
        "item": "Nome do item identificado",
        "reciclavel": true,
        "categoria": "Plástico",
        "corLixeira": "Vermelho",
        "instrucaoPreparo": "Instrução prática e curta de como preparar o item antes do descarte",
        "pontosSugeridos": 5
      }
      Categorias válidas: Plástico, Papel, Vidro, Metal, Orgânico, Não Reciclável / Rejeito, Eletrônico.
      Cores válidas: Vermelho, Azul, Verde, Amarelo, Marrom, Cinza.
      Não adicione blocos de markdown nem texto extra fora do JSON.
    `;

    const contents = [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: req.cameraFrame.data,
              mimeType: req.cameraFrame.mimeType,
            },
          },
        ],
      },
    ];

    const response = await gerarConteudoComResiliencia(ai, contents, {
      responseMimeType: 'application/json',
    });

    let textoLimpo = response.text.trim();
    if (textoLimpo.startsWith('```json')) {
      textoLimpo = textoLimpo.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (textoLimpo.startsWith('```')) {
      textoLimpo = textoLimpo.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const resultadoJson = JSON.parse(textoLimpo);
    return res.json(resultadoJson);
  } catch (error) {
    console.error('❌ Erro detalhado ao processar imagem na IA:', error);
    return res.status(error.status === 503 ? 503 : 500).json({
      error: error.message || 'Falha ao analisar a imagem com IA.',
      ...(error.code ? { code: error.code } : {}),
    });
  }
});

// ==========================================================
// ROTA DE IA: VALIDAÇÃO DE DESCARTE NA LIXEIRA (ANTI-FRAUDE)
// ==========================================================
routes.post('/ia/validar-descarte', receberFrameDaCamera, async (req, res) => {
  try {
    const { categoria, item } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Chave de API não configurada.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Você é um auditor de sustentabilidade e descarte correto de resíduos.
      O usuário está tentando comprovar que descartou o item "${item || 'resíduo'}" da categoria "${categoria || 'reciclável'}".
      
      Analise a foto enviada e responda estritamente um JSON no seguinte formato:
      {
        "valido": true,
        "motivo": "Explicação curta se foi aprovado ou reprovado"
      }

      Critérios:
      - "valido": true se a imagem mostrar uma lixeira, ecoponto, saco de lixo, lixeira seletiva ou o ato de descartar/reciclar.
      - "valido": false se a imagem for claramente aleatória (ex: selfie, parede, chão sem lixeira, tela de computador, animal, comida avulsa sem contexto de descarte).
      
      Não inclua markdown ou texto fora do JSON.
    `;

    const contents = [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: req.cameraFrame.data,
              mimeType: req.cameraFrame.mimeType,
            },
          },
        ],
      },
    ];

    const response = await gerarConteudoComResiliencia(ai, contents, {
      responseMimeType: 'application/json',
    });

    let textoLimpo = response.text.trim();
    if (textoLimpo.startsWith('```json')) {
      textoLimpo = textoLimpo.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (textoLimpo.startsWith('```')) {
      textoLimpo = textoLimpo.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const resultadoJson = JSON.parse(textoLimpo);
    return res.json(resultadoJson);
  } catch (error) {
    console.error('❌ Erro ao validar descarte na IA:', error);
    return res.status(error.status === 503 ? 503 : 500).json({
      error: error.message || 'Erro ao validar comprovação.',
      ...(error.code ? { code: error.code } : {}),
    });
  }
});

// 1. Cadastro de Usuário
routes.post('/usuarios', async (req, res) => {
  const { nome, senha } = req.body;
  const email = normalizarEmail(req.body.email);

  if (!email) {
    return res.status(400).json({ error: 'Informe um e-mail.' });
  }

  if (!cpfValido(req.body.cpf)) {
    return res.status(400).json({ error: 'CPF inválido. Confira os números.' });
  }
  const cpf = formatarCpf(req.body.cpf);

  const data_nascimento = converterDataNascimento(req.body.data_nascimento);
  if (!data_nascimento) {
    return res
      .status(400)
      .json({ error: 'Data de nascimento inválida. Use DD/MM/AAAA.' });
  }

  const erroSenha = validarSenha(senha);
  if (erroSenha) {
    return res.status(400).json({ error: erroSenha });
  }

  try {
    const jaExiste = await pool.query(
      'SELECT 1 FROM usuarios WHERE LOWER(email) = $1',
      [email]
    );
    if (jaExiste.rows.length > 0) {
      return res
        .status(409)
        .json({ error: 'Já existe uma conta com esse e-mail.' });
    }

    const cpfEmUso = await pool.query('SELECT 1 FROM usuarios WHERE cpf = $1', [cpf]);
    if (cpfEmUso.rows.length > 0) {
      return res
        .status(409)
        .json({ error: 'Já existe uma conta com esse CPF.' });
    }

    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
    const novoUsuario = await pool.query(
      'INSERT INTO usuarios (nome, email, senha, cpf, data_nascimento, pontos) VALUES ($1, $2, $3, $4, $5, 0) RETURNING id, nome, email',
      [nome, email, senhaHash, cpf, data_nascimento]
    );
    return res.status(201).json(novoUsuario.rows[0]);
  } catch (err) {
    // err.constraint diz qual regra de "valor único" foi quebrada
    console.error('❌ Erro no cadastro:', err.code, err.constraint, err.detail);
    if (err.code === '23505') {
      const regra = err.constraint || '';
      if (regra.includes('cpf')) {
        return res.status(409).json({ error: 'Já existe uma conta com esse CPF.' });
      }
      if (regra.includes('email')) {
        return res.status(409).json({ error: 'Já existe uma conta com esse e-mail.' });
      }
      // ex.: usuarios_pkey, quando a sequência do id fica atrás dos dados
      return res
        .status(500)
        .json({ error: 'Não foi possível criar a conta agora. Tente de novo mais tarde.' });
    }
    return res.status(500).json({ error: 'Erro ao cadastrar.' });
  }
});

// 2. Login Autenticação
routes.post('/login', async (req, res) => {
  const { senha } = req.body;
  const email = normalizarEmail(req.body.email);
  try {
    // LOWER(email) também cobre contas antigas salvas com maiúsculas.
    const resultado = await pool.query(
      'SELECT id, nome, email, senha FROM usuarios WHERE LOWER(email) = $1',
      [email]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const usuario = resultado.rows[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    return res.json({
      message: 'Login realizado!',
      user: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro no servidor ao tentar logar.' });
  }
});

// 3. Registrar Coleta Inteligente + Somar 5 Pontos
routes.post('/residuos', async (req, res) => {
  const { categoria, tipo_reciclagem, quantidade, localizacao, usuario_id } =
    req.body;

  try {
    await pool.query(
      'INSERT INTO residuos (categoria, tipo_reciclagem, quantidade, localizacao, usuario_id, data_descarte) VALUES ($1, $2, $3, $4, $5, NOW())',
      [categoria, tipo_reciclagem, quantidade, localizacao, usuario_id]
    );

    await pool.query(
      'UPDATE usuarios SET pontos = COALESCE(pontos, 0) + 5 WHERE id = $1',
      [usuario_id]
    );

    console.log(
      `✅ Coleta registrada e +5 pontos para o usuário ${usuario_id}`
    );
    return res
      .status(201)
      .json({ message: 'Coleta registrada e +5 pontos ganhos!' });
  } catch (err) {
    console.error('❌ Erro ao registrar coleta/pontos:', err);
    return res.status(500).json({ error: 'Erro ao registrar coleta.' });
  }
});

// 4. Listar Histórico Completo
routes.get('/residuos/:usuario_id', async (req, res) => {
  const { usuario_id } = req.params;
  try {
    const coletas = await pool.query(
      'SELECT id, categoria, tipo_reciclagem, quantidade, localizacao, data_descarte FROM residuos WHERE usuario_id = $1 ORDER BY id DESC',
      [usuario_id]
    );
    return res.json(coletas.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao buscar histórico.' });
  }
});

// 5. Buscar Dados do Usuário
routes.get('/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const usuario = await pool.query(
      'SELECT nome, email, cpf, pontos FROM usuarios WHERE id = $1',
      [id]
    );
    if (usuario.rows.length > 0) {
      return res.json(usuario.rows[0]);
    }
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar dados do perfil.' });
  }
});

// 6. Atualizar Nome do Usuário
routes.put('/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { nome } = req.body;
  if (!nome || nome.trim().length === 0) {
    return res.status(400).json({ error: 'Nome não pode ser vazio.' });
  }
  try {
    await pool.query('UPDATE usuarios SET nome = $1 WHERE id = $2', [
      nome.trim(),
      id,
    ]);
    return res.json({ message: 'Perfil atualizado com sucesso.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
});

// 7. Alterar Senha com Validação da Senha Atual
routes.put('/usuarios/:id/senha', async (req, res) => {
  const { id } = req.params;
  const { senhaAtual, novaSenha } = req.body;

  const erroSenha = validarSenha(novaSenha);
  if (erroSenha) {
    return res.status(400).json({ error: erroSenha });
  }

  try {
    const buscaUsuario = await pool.query(
      'SELECT senha FROM usuarios WHERE id = $1',
      [id]
    );
    if (buscaUsuario.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const senhaCorreta = await bcrypt.compare(
      senhaAtual,
      buscaUsuario.rows[0].senha
    );
    if (!senhaCorreta) {
      return res
        .status(401)
        .json({ error: 'A senha atual informada está incorreta.' });
    }

    const novoHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);
    await pool.query('UPDATE usuarios SET senha = $1 WHERE id = $2', [
      novoHash,
      id,
    ]);

    return res.json({ message: 'Senha alterada com sucesso!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar a senha.' });
  }
});

// 8. Excluir um registro de coleta e subtrair 5 pontos do usuário
routes.delete('/residuos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const buscaResiduo = await pool.query(
      'SELECT usuario_id FROM residuos WHERE id = $1',
      [id]
    );

    if (buscaResiduo.rows.length === 0) {
      return res
        .status(404)
        .json({ error: 'Registro de coleta não encontrado.' });
    }

    const { usuario_id } = buscaResiduo.rows[0];

    await pool.query('DELETE FROM residuos WHERE id = $1', [id]);

    await pool.query(
      'UPDATE usuarios SET pontos = GREATEST(0, COALESCE(pontos, 0) - 5) WHERE id = $1',
      [usuario_id]
    );

    return res.json({
      message: 'Registro de coleta excluído e 5 pontos deduzidos!',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao excluir descarte.' });
  }
});

module.exports = routes;
