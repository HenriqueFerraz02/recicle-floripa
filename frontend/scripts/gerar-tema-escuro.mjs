// Gera src/tema-escuro.css a partir de src/index.css.
// Para cada regra com cor, cria a versão [data-tema='escuro'] com as cores
// convertidas e confere o contraste do texto (mínimo 4,5:1, padrão WCAG).
//
// Rodar sempre que mudar cores no index.css:
//   node scripts/gerar-tema-escuro.mjs   (dentro da pasta frontend)

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pasta = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const css = readFileSync(join(pasta, 'index.css'), 'utf8');

const COR = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|\bwhite\b/g;
// cor de um cartão no tema escuro: conferir contra ela é mais exigente que contra a página
const FUNDO_PAGINA_ESCURO = '#252d27';
const CONTRASTE_MINIMO = 4.5;

// ---------- conversões de cor ----------
function parse(c) {
  c = c.trim().toLowerCase();
  if (c === 'white') return [255, 255, 255, 1];
  if (c.startsWith('#')) {
    let h = c.slice(1);
    if (h.length <= 4) h = [...h].map((x) => x + x).join('');
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), a];
  }
  const p = c.replace(/rgba?\(|\)/g, '').split(/[\s,/]+/).filter(Boolean).map(Number);
  return [p[0], p[1], p[2], p[3] ?? 1];
}

function fmt([r, g, b, a]) {
  const hex = (v) => Math.round(v).toString(16).padStart(2, '0');
  if (a >= 0.999) return `#${hex(r)}${hex(g)}${hex(b)}`;
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${+a.toFixed(2)})`;
}

function paraHsl([r, g, b, a]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l, a];
}

function deHsl([h, s, l, a]) {
  l = Math.min(1, Math.max(0, l)); s = Math.min(1, Math.max(0, s));
  const f = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  if (s === 0) return [l * 255, l * 255, l * 255, a];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  return [f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255, a];
}

const luminancia = ([r, g, b]) => {
  const c = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
};
const contraste = (a, b) => {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// ---------- regras de conversão por papel da cor ----------
function corEscura(cor, papel) {
  const rgba = parse(cor);
  const [h, s, l, a] = paraHsl(rgba);
  if (papel === 'sombra') return fmt([0, 0, 0, Math.min(0.6, a * 3)]);
  if (papel === 'texto') {
    if (l < 0.5) return fmt(deHsl([h, s * 0.6, 0.92 - l * 0.4, a]));
    return fmt(rgba);
  }
  if (papel === 'borda') {
    if (l > 0.75) return fmt(deHsl([h, s * 0.5, 0.2 + (1 - l) * 0.9, a]));
    return fmt(deHsl([h, s, l * 0.85, a]));
  }
  // fundo
  if (a < 0.5) return fmt(rgba); // véus e brilhos transparentes ficam como estão
  if (l > 0.75) return fmt(deHsl([h, s * 0.45, 0.1 + (1 - l) * 0.55, a]));
  if (l < 0.3) return fmt(deHsl([h, s, l * 0.9, a]));
  return fmt(deHsl([h, s, l * 0.92, a]));
}

function papelDaPropriedade(prop) {
  if (/^(color|fill|stroke|caret-color|-webkit-text-fill-color|text-decoration-color)$/.test(prop)) return 'texto';
  if (/shadow/.test(prop)) return 'sombra';
  if (/^(border|outline)/.test(prop)) return 'borda';
  if (/^background/.test(prop)) return 'fundo';
  return null;
}

// Troca atalhos (border, background, outline) pela propriedade só de cor.
// Assim o tema escuro muda apenas a cor e não reescreve espessura, estilo etc.,
// que poderiam "vencer" regras do index.css que vêm depois.
function soCor(nome, valor) {
  const cores = valor.match(COR) ?? [];
  COR.lastIndex = 0;
  if (/^(border(-top|-right|-bottom|-left)?|outline)$/.test(nome)) {
    return cores.length ? [[`${nome}-color`, cores[cores.length - 1]]] : [];
  }
  if (nome === 'background') {
    if (/gradient\(/.test(valor)) return [['background-image', valor]];
    if (cores.length === 1 && valor.trim() === cores[0]) return [['background-color', valor]];
    return cores.length ? [['background-color', cores[cores.length - 1]]] : [];
  }
  return [[nome, valor]];
}

function ajustarTexto(texto, fundo) {
  let [h, s, l, a] = paraHsl(parse(texto));
  const fundoRgb = parse(fundo);
  const direcao = luminancia(fundoRgb) < 0.2 ? 1 : -1;
  let cor = parse(texto);
  while (contraste(cor, fundoRgb) < CONTRASTE_MINIMO && l >= 0 && l <= 1) {
    l += 0.01 * direcao;
    cor = deHsl([h, s, l, a]);
  }
  return fmt(cor);
}

// ---------- percorre as regras do index.css ----------
const prefixar = (seletor) =>
  seletor.split(',').map((parte) => {
    const p = parte.trim();
    if (/^(:root|html)/.test(p)) return p.replace(/^(:root|html)/, "$1[data-tema='escuro']");
    return `[data-tema='escuro'] ${p}`;
  }).join(',\n');

let saida = '';
let regras = 0;
let contrastesCorrigidos = 0;
let dentroDeMedia = null;
let mediaAberto = false;

const tokens = css.replace(/\/\*[\s\S]*?\*\//g, '').match(/[^{}]+\{|\}|[^{}]+/g) ?? [];
const pilha = [];
for (let i = 0; i < tokens.length; i += 1) {
  const t = tokens[i];
  if (t.endsWith('{')) {
    const seletor = t.slice(0, -1).trim();
    pilha.push(seletor);
    if (seletor.startsWith('@media')) { dentroDeMedia = seletor; continue; }
    if (seletor.startsWith('@') || /^(from|to|\d+%)$/.test(seletor) || pilha.some((p) => p.startsWith('@keyframes'))) continue;

    const corpo = tokens[i + 1] && !tokens[i + 1].endsWith('{') && tokens[i + 1] !== '}' ? tokens[i + 1] : '';
    const novas = [];
    let corTexto = null, corFundo = null;
    for (const declaracao of corpo.split(';')) {
      const [prop, ...resto] = declaracao.split(':');
      if (!prop || !resto.length) continue;
      const nome = prop.trim(), valor = resto.join(':').trim();
      const papel = papelDaPropriedade(nome);
      if (!papel) continue;
      const temCor = COR.test(valor);
      COR.lastIndex = 0;
      // transparent, none etc. também entram, para manter a ordem do index.css:
      // senão uma regra escura anterior "venceria" uma regra clara posterior
      if (!temCor) {
        if (/^(transparent|none|inherit|currentcolor|initial|unset)$/i.test(valor)) {
          if (/^background$/i.test(nome)) {
            novas.push(['background-color', /none/i.test(valor) ? 'transparent' : valor]);
            if (/none/i.test(valor)) novas.push(['background-image', 'none']);
          } else if (!/^(border|outline)/.test(nome) || /color$/.test(nome)) {
            novas.push([nome, valor]);
          }
        }
        continue;
      }
      const convertido = valor.replace(COR, (c) => corEscura(c, papel));
      for (const par of soCor(nome, convertido)) novas.push(par);
      if (papel === 'texto' && nome === 'color') corTexto = convertido;
      if (papel === 'fundo' && /^(#[0-9a-f]{6}|rgba?\([^)]*\))$/i.test(convertido) && parse(convertido)[3] >= 0.999) corFundo = convertido;
    }

    if (corTexto && /^(#|rgb)/.test(corTexto) && parse(corTexto)[3] >= 0.999) {
      const fundo = corFundo ?? FUNDO_PAGINA_ESCURO;
      // texto claro sem fundo próprio fica como está (pode estar sobre um banner)
      const textoClaroSemFundo = !corFundo && luminancia(parse(corTexto)) > 0.5;
      if (!textoClaroSemFundo && contraste(parse(corTexto), parse(fundo)) < CONTRASTE_MINIMO) {
        const ajustado = ajustarTexto(corTexto, fundo);
        const idx = novas.findIndex(([n]) => n === 'color');
        novas[idx][1] = ajustado;
        contrastesCorrigidos += 1;
      }
    }

    if (novas.length) {
      regras += 1;
      const recuo = dentroDeMedia ? '  ' : '';
      if (dentroDeMedia && !mediaAberto) {
        saida += `${dentroDeMedia} {\n`;
        mediaAberto = true;
      }
      saida += `${recuo}${prefixar(seletor).replace(/\n/g, `\n${recuo}`)} {\n`;
      for (const [n, v] of novas) saida += `${recuo}  ${n}: ${v};\n`;
      saida += `${recuo}}\n\n`;
    }
  } else if (t === '}') {
    const fechado = pilha.pop();
    if (fechado && fechado.startsWith('@media')) {
      if (mediaAberto) saida += '}\n\n';
      dentroDeMedia = null;
      mediaAberto = false;
    }
  }
}

const cabecalho = `/* =====================================================================
   TEMA ESCURO — arquivo gerado por scripts/gerar-tema-escuro.mjs
   Não edite à mão: mude o index.css e rode
     node scripts/gerar-tema-escuro.mjs
   ===================================================================== */

:root[data-tema='escuro'] {
  color-scheme: dark;
}

`;
writeFileSync(join(pasta, 'tema-escuro.css'), cabecalho + saida);
console.log(`tema-escuro.css: ${regras} regras, ${contrastesCorrigidos} contrastes corrigidos`);
