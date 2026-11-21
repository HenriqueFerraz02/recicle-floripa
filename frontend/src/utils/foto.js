// Reduz a foto escolhida para um quadrado de 320x320 em JPEG, no próprio
// celular, antes de enviar. Assim a foto fica com uns 20 a 40 KB.
const LADO = 320;

export const reduzirFoto = (arquivo) => new Promise((resolve, reject) => {
  if (!arquivo || !arquivo.type.startsWith('image/')) {
    reject(new Error('Escolha um arquivo de imagem.'));
    return;
  }
  const endereco = URL.createObjectURL(arquivo);
  const imagem = new Image();
  imagem.onload = () => {
    const menorLado = Math.min(imagem.naturalWidth, imagem.naturalHeight);
    const x = (imagem.naturalWidth - menorLado) / 2;
    const y = (imagem.naturalHeight - menorLado) / 2;
    const tela = document.createElement('canvas');
    tela.width = LADO;
    tela.height = LADO;
    tela.getContext('2d').drawImage(imagem, x, y, menorLado, menorLado, 0, 0, LADO, LADO);
    URL.revokeObjectURL(endereco);
    resolve(tela.toDataURL('image/jpeg', 0.82));
  };
  imagem.onerror = () => {
    URL.revokeObjectURL(endereco);
    reject(new Error('Não foi possível abrir essa imagem. Tente uma foto em JPG ou PNG.'));
  };
  imagem.src = endereco;
});
