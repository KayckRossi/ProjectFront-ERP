// Gera e baixa um CSV compatível com o Excel em português:
// separador ";" e BOM UTF-8 para preservar a acentuação.
export function exportarCsv(nomeArquivo, colunas, linhas) {
  const escapar = (valor) => {
    if (valor == null) return '';
    const texto = typeof valor === 'number' ? String(valor).replace('.', ',') : String(valor);
    return /[;"\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };

  const conteudo = [
    colunas.map(c => escapar(c.titulo)).join(';'),
    ...linhas.map(linha => colunas.map(c => escapar(linha[c.campo])).join(';')),
  ].join('\r\n');

  const blob = new Blob(['﻿' + conteudo], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
