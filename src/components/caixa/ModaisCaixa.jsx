import { useState } from 'react';
import Modal from '@/components/Modal';
import { CabecalhoLoja, Divisor, Linha, ModalImpressao } from '@/components/Cupom';
import { useToast } from '@/components/ui/use-toast';
import { useAbrirCaixa, useFecharCaixa, useMovimentarCaixa } from '@/api/caixa';
import { arredondar, lerValorMonetario } from '@/lib/dinheiro';
import { formatCurrency, formatDataHora } from '@/lib/format';

const classeCampo = 'w-full h-11 bg-onyx text-snow rounded-lg px-4 border border-transparent focus:border-verdigris focus:outline-none';
const classeBotaoPrincipal = 'w-full h-11 rounded-lg bg-verdigris text-snow text-sm font-semibold hover:bg-verdigris-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

function LinhaResumo({ rotulo, valor, destaque = false, cor = '' }) {
  return (
    <div className={`flex justify-between text-sm ${destaque ? 'font-semibold text-snow' : 'text-snow/70'}`}>
      <span>{rotulo}</span>
      <span className={cor}>{valor}</span>
    </div>
  );
}

export function ModalAbrirCaixa({ onClose }) {
  const { toast } = useToast();
  const abrirCaixa = useAbrirCaixa();
  const [valorInicial, setValorInicial] = useState('');
  const [erro, setErro] = useState('');

  const submit = (e) => {
    e.preventDefault();
    abrirCaixa.mutate({ valorInicial: lerValorMonetario(valorInicial) }, {
      onSuccess: (sessao) => {
        toast({ title: `Caixa #${sessao.numero} aberto`, description: `Fundo de troco: ${formatCurrency(sessao.valorInicial)}` });
        onClose();
      },
      onError: (erroApi) => setErro(erroApi.message),
    });
  };

  return (
    <Modal titulo="Abrir caixa" subtitulo="Informe o dinheiro que está na gaveta para troco" onClose={onClose} largura="max-w-sm">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="caixa-valor-inicial" className="text-sm text-snow/70 block mb-2">Fundo de troco (R$)</label>
          <input id="caixa-valor-inicial" autoFocus inputMode="decimal" placeholder="0,00" value={valorInicial} onChange={(e) => { setValorInicial(e.target.value); setErro(''); }} className={classeCampo} />
        </div>
        {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}
        <button type="submit" disabled={abrirCaixa.isPending} className={classeBotaoPrincipal}>
          {abrirCaixa.isPending ? 'Abrindo...' : 'Abrir caixa'}
        </button>
      </form>
    </Modal>
  );
}

export function ModalMovimentoCaixa({ tipo, sessao, onClose }) {
  const { toast } = useToast();
  const movimentarCaixa = useMovimentarCaixa();
  const [valor, setValor] = useState('');
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState('');
  const sangria = tipo === 'sangria';
  const valorNumerico = lerValorMonetario(valor);
  const acimaDoCaixa = sangria && valorNumerico > sessao.resumo.esperadoEmDinheiro;

  const submit = (e) => {
    e.preventDefault();
    if (!(valorNumerico > 0) || acimaDoCaixa) return;
    movimentarCaixa.mutate({ tipo, valor: valorNumerico, motivo }, {
      onSuccess: () => {
        toast({ title: sangria ? 'Sangria registrada' : 'Suprimento registrado', description: formatCurrency(valorNumerico) });
        onClose();
      },
      onError: (erroApi) => setErro(erroApi.message),
    });
  };

  return (
    <Modal
      titulo={sangria ? 'Sangria' : 'Suprimento'}
      subtitulo={`${sangria ? 'Retirada' : 'Reforço'} de dinheiro · em caixa: ${formatCurrency(sessao.resumo.esperadoEmDinheiro)}`}
      onClose={onClose}
      largura="max-w-sm"
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="caixa-movimento-valor" className="text-sm text-snow/70 block mb-2">Valor (R$)</label>
          <input id="caixa-movimento-valor" autoFocus inputMode="decimal" placeholder="0,00" value={valor} onChange={(e) => { setValor(e.target.value); setErro(''); }} className={classeCampo} />
          {acimaDoCaixa && <p role="alert" className="text-xs text-danger mt-1.5">Maior que o dinheiro em caixa.</p>}
        </div>
        <div>
          <label htmlFor="caixa-movimento-motivo" className="text-sm text-snow/70 block mb-2">Motivo</label>
          <input
            id="caixa-movimento-motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder={sangria ? 'Ex.: depósito no cofre' : 'Ex.: troco extra'}
            className={classeCampo}
          />
        </div>
        {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}
        <button type="submit" disabled={!(valorNumerico > 0) || acimaDoCaixa || movimentarCaixa.isPending} className={classeBotaoPrincipal}>
          {movimentarCaixa.isPending ? 'Salvando...' : 'Confirmar'}
        </button>
      </form>
    </Modal>
  );
}

export function ModalFecharCaixa({ sessao, onClose, onFechado }) {
  const fecharCaixa = useFecharCaixa();
  const [valorContado, setValorContado] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [erro, setErro] = useState('');
  const { resumo } = sessao;
  const contado = lerValorMonetario(valorContado);
  const diferenca = arredondar(contado - resumo.esperadoEmDinheiro);

  const submit = (e) => {
    e.preventDefault();
    if (valorContado.trim() === '') return setErro('Informe quanto dinheiro há na gaveta.');
    fecharCaixa.mutate({ valorContado: contado, observacoes }, {
      onSuccess: onFechado,
      onError: (erroApi) => setErro(erroApi.message),
    });
  };

  return (
    <Modal titulo={`Fechar caixa #${sessao.numero}`} subtitulo={`Aberto em ${formatDataHora(sessao.abertaEm)} por ${sessao.operador}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-lg bg-onyx p-4 space-y-1.5">
          <LinhaResumo rotulo="Fundo de troco" valor={formatCurrency(sessao.valorInicial)} />
          <LinhaResumo rotulo="Vendas em dinheiro" valor={formatCurrency(resumo.porFormaPagamento.dinheiro)} />
          <LinhaResumo rotulo="Suprimentos" valor={formatCurrency(resumo.suprimentos)} />
          <LinhaResumo rotulo="Sangrias" valor={`-${formatCurrency(resumo.sangrias)}`} />
          <div className="border-t border-[rgba(125,226,209,0.10)] pt-1.5">
            <LinhaResumo rotulo="Esperado em dinheiro" valor={formatCurrency(resumo.esperadoEmDinheiro)} destaque />
          </div>
          <p className="text-xs text-snow/40 pt-1">
            Cartão: {formatCurrency(resumo.porFormaPagamento.cartao)} · PIX: {formatCurrency(resumo.porFormaPagamento.pix)} · {resumo.quantidadeVendas} vendas
          </p>
        </div>
        <div>
          <label htmlFor="caixa-valor-contado" className="text-sm text-snow/70 block mb-2">Dinheiro contado na gaveta (R$)</label>
          <input id="caixa-valor-contado" autoFocus inputMode="decimal" placeholder="0,00" value={valorContado} onChange={(e) => { setValorContado(e.target.value); setErro(''); }} className={classeCampo} />
          {valorContado.trim() !== '' && (
            <p className={`text-sm mt-2 ${diferenca === 0 ? 'text-pearl' : diferenca < 0 ? 'text-danger' : 'text-warning'}`}>
              {diferenca === 0 ? 'Caixa conferido, sem diferença.' : `${diferenca < 0 ? 'Falta' : 'Sobra'} de ${formatCurrency(Math.abs(diferenca))}`}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="caixa-observacoes" className="text-sm text-snow/70 block mb-2">Observações</label>
          <textarea id="caixa-observacoes" rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className={`${classeCampo} h-auto py-2 resize-none`} />
        </div>
        {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}
        <button type="submit" disabled={fecharCaixa.isPending} className={classeBotaoPrincipal}>
          {fecharCaixa.isPending ? 'Fechando...' : 'Fechar caixa'}
        </button>
      </form>
    </Modal>
  );
}

// Relatório de abertura/fechamento no formato do cupom (impressora térmica)
export function RelatorioCaixa({ sessao, configuracoes }) {
  const { resumo } = sessao;
  const fechado = sessao.status === 'fechada';
  return (
    <div className="font-mono text-[11px] leading-snug text-black">
      <CabecalhoLoja configuracoes={configuracoes} titulo={fechado ? 'FECHAMENTO DE CAIXA' : 'CAIXA EM ABERTO'} />
      <Linha esquerda={`Caixa #${sessao.numero}`} direita={sessao.operador} />
      <Linha esquerda="Abertura" direita={formatDataHora(sessao.abertaEm)} />
      {fechado && <Linha esquerda="Fechamento" direita={formatDataHora(sessao.fechadaEm)} />}
      <Divisor />
      <Linha esquerda={`Vendas (${resumo.quantidadeVendas})`} direita={formatCurrency(resumo.totalVendas)} negrito />
      <Linha esquerda="  Dinheiro" direita={formatCurrency(resumo.porFormaPagamento.dinheiro)} />
      <Linha esquerda="  Cartão" direita={formatCurrency(resumo.porFormaPagamento.cartao)} />
      <Linha esquerda="  PIX" direita={formatCurrency(resumo.porFormaPagamento.pix)} />
      {resumo.vendasCanceladas > 0 && <Linha esquerda="Canceladas" direita={resumo.vendasCanceladas} />}
      <Divisor />
      <Linha esquerda="Fundo de troco" direita={formatCurrency(sessao.valorInicial)} />
      <Linha esquerda="Suprimentos" direita={formatCurrency(resumo.suprimentos)} />
      <Linha esquerda="Sangrias" direita={`-${formatCurrency(resumo.sangrias)}`} />
      <Linha esquerda="Esperado em dinheiro" direita={formatCurrency(resumo.esperadoEmDinheiro)} negrito />
      {fechado && (
        <>
          <Linha esquerda="Contado" direita={formatCurrency(sessao.valorContado)} />
          <Linha esquerda="Diferença" direita={formatCurrency(resumo.diferenca)} negrito />
        </>
      )}
      {sessao.movimentos.length > 0 && (
        <>
          <Divisor />
          {sessao.movimentos.map((m) => (
            <Linha key={m.id} esquerda={`${m.tipo === 'sangria' ? 'Sangria' : 'Suprimento'} ${formatDataHora(m.data).slice(11)}`} direita={formatCurrency(m.valor)} />
          ))}
        </>
      )}
      {sessao.observacoes && (
        <>
          <Divisor />
          <p>Obs.: {sessao.observacoes}</p>
        </>
      )}
      <Divisor />
      <p className="text-center mt-4">______________________________</p>
      <p className="text-center">Assinatura do operador</p>
    </div>
  );
}

export function ModalRelatorioCaixa({ sessao, configuracoes, titulo, onClose, children }) {
  return (
    <ModalImpressao
      titulo={titulo ?? `Caixa #${sessao.numero}`}
      subtitulo={`${sessao.operador} · ${sessao.status === 'fechada' ? 'fechado' : 'aberto'}`}
      configuracoes={configuracoes}
      documento={<RelatorioCaixa sessao={sessao} configuracoes={configuracoes} />}
      onClose={onClose}
      rotuloImprimir="Imprimir relatório"
    >
      {children}
    </ModalImpressao>
  );
}
