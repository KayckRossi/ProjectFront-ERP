import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Lock, LockOpen, ArrowDownToLine, ArrowUpFromLine, Wallet } from 'lucide-react';
import { Carregando, ErroConsulta } from '@/components/EstadoConsulta';
import { ModalAbrirCaixa, ModalFecharCaixa, ModalMovimentoCaixa, ModalRelatorioCaixa } from '@/components/caixa/ModaisCaixa';
import { useCaixaAtual } from '@/api/caixa';
import { useConfiguracoes } from '@/api/configuracoes';
import { formatCurrency, formatDataHora } from '@/lib/format';

const classeBotao = 'h-9 px-3 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5';

// Caixa do usuário logado. "barra" é a faixa do PDV; "cartao" é o bloco da tela Caixa (e do PDV com caixa fechado).
export default function PainelCaixa({ variante = 'barra' }) {
  const caixaQuery = useCaixaAtual();
  const { data: configuracoes } = useConfiguracoes();
  const [modal, setModal] = useState(null); // 'abrir' | 'sangria' | 'suprimento' | 'fechar'
  const [fechado, setFechado] = useState(null); // sessão recém-fechada, para o relatório
  const sessao = caixaQuery.data;

  if (caixaQuery.isPending) return variante === 'cartao' ? <Carregando texto="Verificando o caixa..." /> : null;
  if (caixaQuery.isError) return <ErroConsulta erro={caixaQuery.error} onTentarNovamente={caixaQuery.refetch} />;

  const acoes = sessao ? (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => setModal('sangria')} className={`${classeBotao} border border-pearl/30 text-pearl hover:bg-pearl-muted`}>
        <ArrowUpFromLine size={15} /> Sangria
      </button>
      <button onClick={() => setModal('suprimento')} className={`${classeBotao} border border-pearl/30 text-pearl hover:bg-pearl-muted`}>
        <ArrowDownToLine size={15} /> Suprimento
      </button>
      <button onClick={() => setModal('fechar')} className={`${classeBotao} bg-verdigris text-snow hover:bg-verdigris-hover`}>
        <Lock size={15} /> Fechar caixa
      </button>
    </div>
  ) : (
    <button onClick={() => setModal('abrir')} className={`${classeBotao} bg-verdigris text-snow hover:bg-verdigris-hover`}>
      <LockOpen size={15} /> Abrir caixa
    </button>
  );

  const conteudo = variante === 'barra' ? (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-card px-4 py-3 mb-4 border ${sessao ? 'bg-graphite border-[rgba(125,226,209,0.10)]' : 'bg-warning/10 border-warning/30'}`}>
      <div className="flex items-center gap-3 text-sm">
        <span className={`w-2.5 h-2.5 rounded-full ${sessao ? 'bg-verdigris' : 'bg-warning'}`} />
        {sessao ? (
          <span className="text-snow/80">
            <strong className="text-snow">Caixa #{sessao.numero}</strong> aberto às {formatDataHora(sessao.abertaEm).slice(11)}
            <span className="text-snow/50"> · em dinheiro {formatCurrency(sessao.resumo.esperadoEmDinheiro)} · {sessao.resumo.quantidadeVendas} vendas</span>
          </span>
        ) : (
          <span className="text-snow/80"><strong className="text-snow">Caixa fechado.</strong> As vendas não ficam vinculadas a um caixa.</span>
        )}
      </div>
      {acoes}
    </div>
  ) : (
    <div className="bg-graphite rounded-card card-shadow p-6 w-full max-w-xl">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${sessao ? 'bg-verdigris-light' : 'bg-warning/15'}`}>
          <Wallet size={22} className={sessao ? 'text-pearl' : 'text-warning'} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-snow">{sessao ? `Caixa #${sessao.numero} aberto` : 'Seu caixa está fechado'}</h2>
          <p className="text-sm text-snow/50 mt-0.5">
            {sessao
              ? `Desde ${formatDataHora(sessao.abertaEm)} · fundo de ${formatCurrency(sessao.valorInicial)}`
              : 'Abra o caixa informando o fundo de troco para começar a vender.'}
          </p>
          {sessao && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
              <div><p className="text-xs text-snow/50">Vendas</p><p className="text-snow font-medium">{formatCurrency(sessao.resumo.totalVendas)}</p></div>
              <div><p className="text-xs text-snow/50">Em dinheiro</p><p className="text-pearl font-medium">{formatCurrency(sessao.resumo.esperadoEmDinheiro)}</p></div>
              <div><p className="text-xs text-snow/50">Sangrias</p><p className="text-snow font-medium">{formatCurrency(sessao.resumo.sangrias)}</p></div>
              <div><p className="text-xs text-snow/50">Suprimentos</p><p className="text-snow font-medium">{formatCurrency(sessao.resumo.suprimentos)}</p></div>
            </div>
          )}
          <div className="mt-5">{acoes}</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {conteudo}
      <AnimatePresence mode="wait">
        {modal === 'abrir' && <ModalAbrirCaixa key="abrir" onClose={() => setModal(null)} />}
        {(modal === 'sangria' || modal === 'suprimento') && sessao && (
          <ModalMovimentoCaixa key={modal} tipo={modal} sessao={sessao} onClose={() => setModal(null)} />
        )}
        {modal === 'fechar' && sessao && (
          <ModalFecharCaixa key="fechar" sessao={sessao} onClose={() => setModal(null)} onFechado={(sessaoFechada) => { setModal(null); setFechado(sessaoFechada); }} />
        )}
        {!modal && fechado && (
          <ModalRelatorioCaixa key="relatorio" sessao={fechado} configuracoes={configuracoes} titulo={`Caixa #${fechado.numero} fechado`} onClose={() => setFechado(null)}>
            <button autoFocus onClick={() => setFechado(null)} className="flex-1 h-11 rounded-lg bg-verdigris text-snow text-sm font-semibold hover:bg-verdigris-hover transition-colors">
              Concluir
            </button>
          </ModalRelatorioCaixa>
        )}
      </AnimatePresence>
    </>
  );
}
