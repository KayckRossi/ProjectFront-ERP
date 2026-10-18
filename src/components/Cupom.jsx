import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer } from 'lucide-react';
import Modal from '@/components/Modal';
import { formatCurrency, formatDataHora } from '@/lib/format';

const ROTULOS_PAGAMENTO = { dinheiro: 'Dinheiro', cartao: 'Cartão', pix: 'PIX' };

// Largura do papel e regra @page para cada modelo de impressão das Configurações
const FORMATOS = {
  'Térmica 80mm': { largura: '72mm', pagina: '@page { margin: 4mm; }', previa: 'w-[290px]' },
  'Térmica 58mm': { largura: '48mm', pagina: '@page { margin: 3mm; }', previa: 'w-[210px]' },
  A4: { largura: '120mm', pagina: '@page { size: A4; margin: 15mm; }', previa: 'w-full max-w-[420px]' },
};

// ---------------------------------------------------------------- Blocos do papel impresso

export function Linha({ esquerda, direita, negrito = false }) {
  return (
    <div className={`flex justify-between gap-2 ${negrito ? 'font-bold' : ''}`}>
      <span>{esquerda}</span>
      <span className="text-right whitespace-nowrap">{direita}</span>
    </div>
  );
}

export const Divisor = () => <div className="border-t border-dashed border-black/50 my-2" />;

export function CabecalhoLoja({ configuracoes, titulo }) {
  const loja = configuracoes?.loja ?? {};
  return (
    <>
      <div className="text-center">
        <p className="font-bold text-[13px] uppercase">{loja.nome || 'Nexora'}</p>
        {loja.cnpj && <p>CNPJ {loja.cnpj}</p>}
        {loja.endereco && <p>{loja.endereco}</p>}
        {loja.telefone && <p>Tel. {loja.telefone}</p>}
      </div>
      <Divisor />
      <p className="text-center font-bold">{titulo}</p>
    </>
  );
}

export function Cupom({ venda, configuracoes }) {
  return (
    <div className="font-mono text-[11px] leading-snug text-black">
      <CabecalhoLoja configuracoes={configuracoes} titulo="CUPOM NÃO FISCAL" />
      {venda.status === 'Cancelada' && <p className="text-center font-bold">*** VENDA CANCELADA ***</p>}
      <Linha esquerda={`Venda #${venda.numero}`} direita={formatDataHora(venda.data)} />
      <p>Cliente: {venda.cliente}</p>
      {venda.operador && <p>Operador: {venda.operador}</p>}
      <Divisor />
      {venda.itens.map((item) => (
        <div key={item.produtoId} className="mb-1">
          <p>{item.nome}</p>
          <Linha esquerda={`${item.quantidade} x ${formatCurrency(item.precoUnitario)}`} direita={formatCurrency(item.totalItem)} />
        </div>
      ))}
      <Divisor />
      <Linha esquerda="Subtotal" direita={formatCurrency(venda.subtotal)} />
      {venda.desconto > 0 && <Linha esquerda={`Desconto (${venda.descontoPercentual}%)`} direita={`-${formatCurrency(venda.desconto)}`} />}
      <Linha esquerda="TOTAL" direita={formatCurrency(venda.total)} negrito />
      <Linha esquerda="Pagamento" direita={ROTULOS_PAGAMENTO[venda.formaPagamento] ?? venda.formaPagamento} />
      {venda.formaPagamento === 'dinheiro' && venda.valorRecebido != null && (
        <>
          <Linha esquerda="Recebido" direita={formatCurrency(venda.valorRecebido)} />
          <Linha esquerda="Troco" direita={formatCurrency(venda.troco)} />
        </>
      )}
      {configuracoes?.impressao?.mensagemRodape && (
        <>
          <Divisor />
          <p className="text-center">{configuracoes.impressao.mensagemRodape}</p>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Modal com pré-visualização e impressão

// Mostra o `documento` como papel e imprime só ele: uma cópia é renderizada direto no <body>
// para o CSS de impressão (index.css) esconder o restante da tela.
export function ModalImpressao({ titulo, subtitulo, configuracoes, documento, onClose, imprimirAoAbrir = false, rotuloImprimir = 'Imprimir', children }) {
  const formato = FORMATOS[configuracoes?.impressao?.modelo] ?? FORMATOS['Térmica 80mm'];

  useEffect(() => {
    if (!imprimirAoAbrir) return undefined;
    const temporizador = setTimeout(() => window.print(), 350);
    return () => clearTimeout(temporizador);
  }, [imprimirAoAbrir]);

  return (
    <Modal titulo={titulo} subtitulo={subtitulo} onClose={onClose} largura="max-w-lg">
      <div className="bg-onyx rounded-lg p-4 mb-5 max-h-[50vh] overflow-y-auto">
        <div className={`${formato.previa} mx-auto bg-white rounded-md p-4 shadow-md`}>{documento}</div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => window.print()}
          className="flex-1 h-11 rounded-lg border border-pearl/40 text-pearl text-sm font-medium hover:bg-pearl-muted transition-colors inline-flex items-center justify-center gap-2"
        >
          <Printer size={17} /> {rotuloImprimir}
        </button>
        {children}
      </div>
      {createPortal(
        <div className="area-impressao" style={{ width: formato.largura }}>
          <style>{formato.pagina}</style>
          {documento}
        </div>,
        document.body,
      )}
    </Modal>
  );
}

export function CupomModal({ venda, configuracoes, titulo, subtitulo, onClose, imprimirAoAbrir = false, children }) {
  return (
    <ModalImpressao
      titulo={titulo ?? `Venda #${venda.numero}`}
      subtitulo={subtitulo}
      configuracoes={configuracoes}
      documento={<Cupom venda={venda} configuracoes={configuracoes} />}
      onClose={onClose}
      imprimirAoAbrir={imprimirAoAbrir}
      rotuloImprimir="Imprimir cupom"
    >
      {children}
    </ModalImpressao>
  );
}
