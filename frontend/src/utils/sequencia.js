// Dias seguidos com pelo menos um descarte registrado (o "foguinho" da Home).
// Conta para trás a partir de hoje. Se hoje ainda não teve descarte, a
// sequência continua valendo a partir de ontem, até o fim do dia.

const chaveDoDia = (data) => `${data.getFullYear()}-${data.getMonth() + 1}-${data.getDate()}`;

export function diasSeguidos(historico, agora = new Date()) {
  const dias = new Set(
    (historico || [])
      .map((item) => new Date(item.data_descarte))
      .filter((data) => !Number.isNaN(data.getTime()))
      .map(chaveDoDia),
  );

  const dia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  if (!dias.has(chaveDoDia(dia))) dia.setDate(dia.getDate() - 1);

  let total = 0;
  while (dias.has(chaveDoDia(dia))) {
    total += 1;
    dia.setDate(dia.getDate() - 1);
  }
  return total;
}
