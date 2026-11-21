// Conquistas calculadas a partir dos descartes reais do usuário
// (resumo vindo de GET /usuarios/:id/resumo).

const semAcento = (texto) => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const MATERIAIS = [
  { chave: 'plastico', nome: 'Plástico' },
  { chave: 'papel', nome: 'Papel' },
  { chave: 'vidro', nome: 'Vidro' },
  { chave: 'metal', nome: 'Metal' },
  { chave: 'organico', nome: 'Orgânico' },
  { chave: 'eletronico', nome: 'Eletrônico' },
];

// Junta variações ("Plástico", "plastico") numa chave só
export const chaveMaterial = (categoria) => {
  const texto = semAcento(categoria);
  return MATERIAIS.find((material) => texto.startsWith(material.chave.slice(0, 5)))?.chave || 'rejeito';
};

export const nomeMaterial = (chave) => MATERIAIS.find((material) => material.chave === chave)?.nome || 'Rejeito';

export const contarPorMaterial = (porMaterial = []) => porMaterial.reduce((contagem, linha) => {
  const chave = chaveMaterial(linha.categoria);
  contagem[chave] = (contagem[chave] || 0) + linha.total;
  return contagem;
}, {});

export const calcularConquistas = (resumo) => {
  const total = resumo?.total_descartes || 0;
  const contagem = contarPorMaterial(resumo?.por_material);
  const reciclaveisDiferentes = MATERIAIS.filter((material) => contagem[material.chave] > 0).length;
  const ranking = resumo?.ranking;
  const lider = ranking && ranking.posicao === 1 && ranking.participantes >= 2 && total > 0;

  return [
    { id: 'primeiro', icone: 'Sprout', titulo: 'Primeiro passo', regra: 'Registre seu 1º descarte', atual: total, meta: 1 },
    { id: 'dez', icone: 'Award', titulo: 'Eco-cidadão', regra: 'Registre 10 descartes', atual: total, meta: 10 },
    { id: 'plastico', icone: 'Medal', titulo: 'Ilha sem plástico', regra: '5 descartes de plástico', atual: contagem.plastico || 0, meta: 5 },
    { id: 'vidro', icone: 'GlassWater', titulo: 'Guardião do vidro', regra: '5 descartes de vidro', atual: contagem.vidro || 0, meta: 5 },
    { id: 'papel', icone: 'Newspaper', titulo: 'Papel no lugar', regra: '5 descartes de papel', atual: contagem.papel || 0, meta: 5 },
    { id: 'metal', icone: 'Hammer', titulo: 'Força do metal', regra: '5 descartes de metal', atual: contagem.metal || 0, meta: 5 },
    { id: 'variedade', icone: 'Layers', titulo: 'Separador completo', regra: 'Descarte 4 materiais diferentes', atual: reciclaveisDiferentes, meta: 4 },
    { id: 'bairro', icone: 'Trophy', titulo: 'Destaque do bairro', regra: 'Fique em 1º no ranking do seu bairro', atual: lider ? 1 : 0, meta: 1 },
  ].map((conquista) => ({ ...conquista, atual: Math.min(conquista.atual, conquista.meta), ganhou: conquista.atual >= conquista.meta }));
};
