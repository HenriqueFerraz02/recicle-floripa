/* eslint-disable no-undef, @typescript-eslint/no-require-imports */
// Envio de e-mail pela API do Brevo (HTTPS, porta 443).
// O Render gratuito bloqueia as portas de e-mail (SMTP 25, 465 e 587),
// por isso o envio é feito pela API web do Brevo, e não por SMTP.
//
// Sem BREVO_API_KEY (ex.: no PC de quem só quer testar), o e-mail não é
// enviado: o código aparece no terminal do backend.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const CHAVE = process.env.BREVO_API_KEY;
const REMETENTE = process.env.EMAIL_REMETENTE;
const NOME_REMETENTE = process.env.EMAIL_REMETENTE_NOME || 'Recicle Floripa';

const escapar = (texto) => String(texto).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const modelo = ({ nome, titulo, texto, codigo }) => `<!doctype html>
<html lang="pt-BR"><body style="margin:0;padding:24px;background:#f4fbf1;font-family:Arial,sans-serif;color:#183d2a">
<table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px">
<tr><td>
<p style="margin:0 0 4px;color:#1e8646;font-weight:bold;letter-spacing:1px;font-size:13px">RECICLE FLORIPA</p>
<h1 style="margin:0 0 16px;font-size:22px">${escapar(titulo)}</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:1.5">Olá, ${escapar(nome)}! ${escapar(texto)}</p>
<p style="margin:0 0 16px;padding:16px;background:#eef8ec;border-radius:12px;text-align:center;font-size:34px;font-weight:bold;letter-spacing:8px">${escapar(codigo)}</p>
<p style="margin:0 0 8px;font-size:14px;color:#3f5848">O código vale por 15 minutos. Não compartilhe com ninguém.</p>
<p style="margin:0;font-size:14px;color:#3f5848">Se não foi você que pediu, pode ignorar este e-mail.</p>
</td></tr></table></body></html>`;

const TEXTOS = {
  confirmar: {
    assunto: 'Seu código de confirmação do Recicle Floripa',
    titulo: 'Confirme seu e-mail',
    texto: 'Use o código abaixo para confirmar seu e-mail e ativar sua conta.',
  },
  senha: {
    assunto: 'Código para criar uma nova senha no Recicle Floripa',
    titulo: 'Crie uma nova senha',
    texto: 'Recebemos um pedido para trocar a senha da sua conta. Use o código abaixo.',
  },
};

// Envia o código. Devolve true se o Brevo aceitou o envio.
const enviarCodigo = async ({ para, nome, tipo, codigo }) => {
  const textos = TEXTOS[tipo];
  if (!CHAVE || !REMETENTE) {
    console.warn(`✉️  [sem BREVO_API_KEY] código de ${tipo} para ${para}: ${codigo}`);
    return true;
  }
  try {
    const resposta = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': CHAVE, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: NOME_REMETENTE, email: REMETENTE },
        to: [{ email: para, name: nome }],
        subject: textos.assunto,
        htmlContent: modelo({ nome, codigo, ...textos }),
        textContent: `Olá, ${nome}! ${textos.texto}\n\nCódigo: ${codigo}\n\nO código vale por 15 minutos.`,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!resposta.ok) {
      console.error('❌ Brevo recusou o envio:', resposta.status, await resposta.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('❌ Falha ao enviar e-mail:', err.message);
    return false;
  }
};

module.exports = { enviarCodigo };
