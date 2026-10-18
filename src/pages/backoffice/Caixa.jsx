import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ChevronRight, Receipt } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import FiltroPeriodo from '@/components/FiltroPeriodo';
import Paginacao from '@/components/Paginacao';
import PainelCaixa from '@/components/caixa/PainelCaixa';
import { ModalRelatorioCaixa } from '@/components/caixa/ModaisCaixa';
import { EstadoConsulta } from '@/components/EstadoConsulta';
import { usePaginacao } from '@/hooks/usePaginacao';
import { useSessaoCaixa, useSessoesCaixa } from '@/api/caixa';
import { useConfiguracoes } from '@/api/configuracoes';
import { useAuth } from '@/lib/AuthContext';
import { periodoRapido } from '@/lib/datas';
import { formatCurrency, formatDataHora } from '@/lib/format';

const POR_PAGINA = 15;
const classeSelect = 'h-10 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm';

function Diferenca({ valor }) {
  if (valor == null) return <span className="text-snow/40">—</span>;
  const cor = valor === 0 ? 'text-pearl' : valor < 0 ? 'text-danger' : 'text-warning';
  const prefixo = valor > 0 ? '+' : '';
  return <span className={`font-medium ${cor}`}>{prefixo}{formatCurrency(valor)}</span>;
}

function DetalheSessao({ id, onClose }) {
  const sessaoQuery = useSessaoCaixa(id);
  const { data: configuracoes } = useConfiguracoes();
  if (sessaoQuery.data) return <ModalRelatorioCaixa sessao={sessaoQuery.data} configuracoes={configuracoes} onClose={onClose} />;
  return (
    <Modal titulo="Caixa" onClose={onClose}>
      <EstadoConsulta consulta={sessaoQuery} textoCarregando="Carregando caixa..." />
    </Modal>
  );
}

export default function Caixa() {
  const { pode } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const sessaoAberta = searchParams.get('sessao');
  const veTodos = pode('caixa.ver-todos');
  const [periodo, setPeriodo] = useState(() => periodoRapido('30dias'));
  const [status, setStatus] = useState('');
  const [operador, setOperador] = useState('');

  const sessoesQuery = useSessoesCaixa({ ...periodo, status }, { enabled: veTodos });
  const sessoes = useMemo(() => sessoesQuery.data ?? [], [sessoesQuery.data]);
  const operadores = useMemo(() => [...new Map(sessoes.map((s) => [s.usuarioId, s.operador])).entries()], [sessoes]);
  const filtradas = useMemo(() => sessoes.filter((s) => !operador || s.usuarioId === operador), [sessoes, operador]);
  const { pagina, setPagina, totalPaginas, itensPagina } = usePaginacao(filtradas, POR_PAGINA, `${periodo.dataInicio}|${periodo.dataFim}|${status}|${operador}`);

  const fechadas = filtradas.filter((s) => s.status === 'fechada');
  const somaDiferencas = fechadas.reduce((soma, s) => soma + s.resumo.diferenca, 0);
  const comDiferenca = fechadas.filter((s) => s.resumo.diferenca !== 0).length;

  const abrirSessao = (id) => {
    const proximos = new URLSearchParams(searchParams);
    if (id) proximos.set('sessao', id);
    else proximos.delete('sessao');
    setSearchParams(proximos);
  };

  return (
    <div>
      <PageHeader title="Caixa" subtitle="Abertura, sangrias, suprimentos e fechamento" />

      <div className="mb-6">
        <PainelCaixa variante="cartao" />
      </div>

      {veTodos && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-graphite rounded-card p-4 card-shadow">
              <p className="text-xs text-snow/50">Vendido nos caixas do período</p>
              <p className="text-lg font-semibold text-snow mt-1">{formatCurrency(filtradas.reduce((soma, s) => soma + s.resumo.totalVendas, 0))}</p>
            </div>
            <div className="bg-graphite rounded-card p-4 card-shadow">
              <p className="text-xs text-snow/50">Caixas com diferença</p>
              <p className="text-lg font-semibold text-snow mt-1">{comDiferenca} de {fechadas.length}</p>
            </div>
            <div className="bg-graphite rounded-card p-4 card-shadow">
              <p className="text-xs text-snow/50">Saldo das diferenças</p>
              <p className="text-lg font-semibold mt-1"><Diferenca valor={Math.round(somaDiferencas * 100) / 100} /></p>
            </div>
          </div>

          <div className="bg-graphite rounded-card p-4 card-shadow mb-4 space-y-4">
            <FiltroPeriodo periodo={periodo} onMudar={setPeriodo} id="caixa" />
            <div className="flex flex-col sm:flex-row gap-3">
              <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrar por status" className={classeSelect}>
                <option value="">Abertos e fechados</option>
                <option value="aberta">Abertos</option>
                <option value="fechada">Fechados</option>
              </select>
              <select value={operador} onChange={(e) => setOperador(e.target.value)} aria-label="Filtrar por operador" className={classeSelect}>
                <option value="">Todos os operadores</option>
                {operadores.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-graphite rounded-card card-shadow overflow-hidden">
            <EstadoConsulta consulta={sessoesQuery} textoCarregando="Carregando caixas...">
              {filtradas.length === 0 ? <EmptyState message="Nenhum caixa neste período" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-snow/50 border-b border-[rgba(125,226,209,0.10)]">
                        <th scope="col" className="font-medium py-3 px-4">Caixa</th>
                        <th scope="col" className="font-medium py-3 px-4">Operador</th>
                        <th scope="col" className="font-medium py-3 px-4">Abertura</th>
                        <th scope="col" className="font-medium py-3 px-4">Fechamento</th>
                        <th scope="col" className="font-medium py-3 px-4 text-right">Vendas</th>
                        <th scope="col" className="font-medium py-3 px-4 text-right">Esperado em dinheiro</th>
                        <th scope="col" className="font-medium py-3 px-4 text-right">Diferença</th>
                        <th scope="col" className="py-3 px-4"><span className="sr-only">Detalhes</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {itensPagina.map((s) => (
                        <tr key={s.id} onClick={() => abrirSessao(s.id)} className="border-b border-[rgba(125,226,209,0.06)] hover:bg-graphite-hover transition-colors cursor-pointer">
                          <td className="py-3 px-4 font-mono text-pearl">#{s.numero}</td>
                          <td className="py-3 px-4 text-snow">{s.operador}</td>
                          <td className="py-3 px-4 text-snow/70 whitespace-nowrap">{formatDataHora(s.abertaEm)}</td>
                          <td className="py-3 px-4 text-snow/70 whitespace-nowrap">
                            {s.fechadaEm ? formatDataHora(s.fechadaEm) : <span className="text-xs font-medium text-pearl">Aberto agora</span>}
                          </td>
                          <td className="py-3 px-4 text-right text-snow">{formatCurrency(s.resumo.totalVendas)}<span className="text-xs text-snow/40"> ({s.resumo.quantidadeVendas})</span></td>
                          <td className="py-3 px-4 text-right text-snow/70">{formatCurrency(s.resumo.esperadoEmDinheiro)}</td>
                          <td className="py-3 px-4 text-right"><Diferenca valor={s.resumo.diferenca} /></td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => { e.stopPropagation(); abrirSessao(s.id); }}
                              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-xs font-medium text-pearl hover:bg-verdigris-light transition-colors"
                              aria-label={`Ver o caixa ${s.numero}`}
                            >
                              <Receipt size={14} /> Relatório <ChevronRight size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Paginacao pagina={pagina} totalPaginas={totalPaginas} onMudar={setPagina} totalItens={filtradas.length} rotulo="caixas" />
            </EstadoConsulta>
          </div>
        </>
      )}

      <AnimatePresence>
        {sessaoAberta && <DetalheSessao key={sessaoAberta} id={sessaoAberta} onClose={() => abrirSessao(null)} />}
      </AnimatePresence>
    </div>
  );
}
