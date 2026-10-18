// Gera e baixa um CSV compatível com o Excel em português:
// separador ";" e BOM UTF-8 para preservar a acentuação.
export function montarCsv(colunas, linhas) {
  const escapar = (valor) => {
    if (valor == null) return '';
    if (typeof valor === 'number') return String(valor).replace('.', ',');
    // Texto começando com = + - @ (ou tab/enter) vira fórmula no Excel: o apóstrofo o mantém como texto
    const texto = /^[=+\-@\t\r]/.test(String(valor)) ? `'${valor}` : String(valor);
    return /[;"\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };

  return [
    colunas.map(c => escapar(c.titulo)).join(';'),
    ...linhas.map(linha => colunas.map(c => escapar(linha[c.campo])).join(';')),
  ].join('\r\n');
}

export function exportarCsv(nomeArquivo, colunas, linhas) {
  const blob = new Blob(['﻿' + montarCsv(colunas, linhas)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
