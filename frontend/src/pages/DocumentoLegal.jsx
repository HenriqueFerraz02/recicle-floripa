import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoRecicle from '../assets/png.png';
import BotaoTema from '../components/BotaoTema';

const ATUALIZADO_EM = '20/11/2026';
const REPOSITORIO = 'https://github.com/HenriqueFerraz02/recicle-floripa';

const DOCUMENTOS = {
  termos: {
    titulo: 'Termos de Uso',
    introducao:
      'Ao criar uma conta no Recicle Floripa, você concorda com as regras abaixo. Leia com atenção.',
    secoes: [
      {
        titulo: '1. Sobre o Recicle Floripa',
        paragrafos: [
          'O Recicle Floripa é um projeto acadêmico, sem fins lucrativos, desenvolvido por estudantes do curso de Análise e Desenvolvimento de Sistemas da UNICESUSC, em Florianópolis.',
          'O app ajuda a identificar resíduos, indica onde descartá-los corretamente e registra os seus descartes.',
        ],
      },
      {
        titulo: '2. Sua conta',
        paragrafos: [
          'Você é responsável por informar dados verdadeiros e por manter sua senha em segredo. Não compartilhe sua conta.',
          'Menores de 18 anos devem usar o app com o conhecimento e a autorização de um responsável.',
        ],
      },
      {
        titulo: '3. Identificação por inteligência artificial',
        paragrafos: [
          'A identificação de resíduos pela câmera é feita por inteligência artificial e pode errar. Em caso de dúvida, confira a busca "Onde descartar?" ou as orientações da COMCAP.',
          'Resíduos perigosos, como pilhas, baterias, lâmpadas, remédios e óleo, nunca devem ir para o lixo comum.',
        ],
      },
      {
        titulo: '4. Pontos',
        paragrafos: [
          'Os pontos acumulados no app não têm valor em dinheiro e não podem ser vendidos ou transferidos. A troca de pontos por prêmios ainda não está disponível.',
          'Registrar descartes falsos ou enviar fotos que não mostram o descarte pode levar à remoção dos pontos ou da conta.',
        ],
      },
      {
        titulo: '5. Uso adequado',
        paragrafos: [
          'Não use o app para enviar fotos de pessoas, documentos ou qualquer conteúdo ofensivo ou ilegal. Envie apenas fotos do resíduo ou do local de descarte.',
        ],
      },
      {
        titulo: '6. Disponibilidade',
        paragrafos: [
          'Por ser um projeto acadêmico hospedado em serviços gratuitos, o app pode ficar lento, fora do ar ou mudar sem aviso prévio. Os dados dos ecopontos podem estar desatualizados.',
        ],
      },
      {
        titulo: '7. Mudanças nestes termos',
        paragrafos: [
          'Estes termos podem ser atualizados. A data da última atualização fica no fim desta página.',
        ],
      },
    ],
  },
  privacidade: {
    titulo: 'Política de Privacidade',
    introducao:
      'Esta política explica quais dados o Recicle Floripa coleta, para que usa e quais são os seus direitos, de acordo com a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018).',
    secoes: [
      {
        titulo: '1. Dados que coletamos',
        itens: [
          'Nome completo e e-mail: para identificar sua conta e fazer o login.',
          'Senha: guardada apenas de forma criptografada (hash bcrypt). Nem a equipe consegue ver a sua senha.',
          'CPF: para evitar contas duplicadas.',
          'Data de nascimento: para saber se o usuário é menor de idade.',
          'Descartes registrados: tipo de resíduo, quantidade, local digitado por você e data, além dos pontos acumulados.',
          'Localização: só quando você pede os ecopontos mais próximos. A distância é calculada no seu aparelho; a localização não é enviada ao servidor nem guardada.',
        ],
      },
      {
        titulo: '2. Fotos enviadas pela câmera',
        paragrafos: [
          'As fotos do scanner e da comprovação de descarte são enviadas ao Google Gemini, serviço de inteligência artificial do Google, apenas para identificar o resíduo ou validar o descarte. O Recicle Floripa não guarda essas fotos no banco de dados.',
          'Como usamos o plano gratuito do Gemini, o Google pode usar o conteúdo enviado para melhorar os próprios serviços, conforme os termos dele. Por isso, fotografe só o resíduo, sem pessoas ou documentos.',
        ],
      },
      {
        titulo: '3. Para que usamos os dados',
        itens: [
          'Criar e manter sua conta.',
          'Mostrar seu histórico de descartes e seus pontos.',
          'Melhorar o app e produzir estatísticas gerais, sem identificar ninguém, para fins acadêmicos.',
        ],
        paragrafos: ['Não vendemos nem compartilhamos seus dados com anunciantes.'],
      },
      {
        titulo: '4. Onde os dados ficam',
        paragrafos: [
          'O banco de dados fica no Neon, em servidores em São Paulo. O servidor do app fica no Render, nos Estados Unidos, e as telas são publicadas pela Vercel. Esses serviços seguem padrões de segurança próprios.',
          'No seu aparelho, o navegador guarda o seu nome, e-mail e identificador para manter você conectado. Esses dados são apagados quando você sai da conta ou limpa os dados do navegador.',
        ],
      },
      {
        titulo: '5. Seus direitos (LGPD)',
        paragrafos: [
          'Você pode pedir a qualquer momento para ver, corrigir ou excluir seus dados e sua conta. Ao excluir a conta, os descartes ligados a ela também são apagados.',
          `Para fazer um pedido, entre em contato com a equipe pelo repositório do projeto: ${REPOSITORIO}`,
        ],
      },
      {
        titulo: '6. Por quanto tempo guardamos',
        paragrafos: [
          'Os dados ficam guardados enquanto sua conta existir ou até o fim do projeto acadêmico. Depois disso, são apagados.',
        ],
      },
    ],
  },
};

// Pode ser usada como página (rotas /termos e /privacidade) ou dentro do
// cadastro, recebendo onVoltar, para não perder o que já foi preenchido.
export default function DocumentoLegal({ tipo, onVoltar }) {
  const navigate = useNavigate();
  const doc = DOCUMENTOS[tipo] ?? DOCUMENTOS.termos;

  const voltar = () => {
    if (onVoltar) return onVoltar();
    if (window.history.length > 1) return navigate(-1);
    return navigate('/login');
  };

  return (
    <main className='auth-page'>
      <section className='auth-shell auth-shell-register legal-shell'>
        <header className='auth-brand'>
          <div className='auth-logo-mark'>
            <img src={logoRecicle} alt='Logo Recicle Floripa' />
          </div>
          <span>Recicle Floripa</span>
          <BotaoTema />
        </header>

        <button type='button' className='legal-back' onClick={voltar}>
          <ArrowLeft size={15} aria-hidden='true' /> Voltar
        </button>

        <article className='legal-content'>
          <h1>{doc.titulo}</h1>
          <p className='auth-introduction'>{doc.introducao}</p>

          {doc.secoes.map((secao) => (
            <section key={secao.titulo} className='legal-section'>
              <h2>{secao.titulo}</h2>
              {secao.itens && (
                <ul>
                  {secao.itens.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
              {secao.paragrafos?.map((texto) => <p key={texto}>{texto}</p>)}
            </section>
          ))}

          <p className='legal-updated'>Última atualização: {ATUALIZADO_EM}</p>
        </article>

        <button type='button' className='auth-button auth-button-primary' onClick={voltar}>
          Entendi, voltar
        </button>
      </section>
    </main>
  );
}
