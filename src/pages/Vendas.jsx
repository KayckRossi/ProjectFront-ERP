import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Search, X, Ban, Printer, Receipt, ChevronRight } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import DialogoConfirmacao from '@/components/DialogoConfirmacao';
import FiltroPeriodo from '@/components/FiltroPeriodo';
import Paginacao from '@/components/Paginacao';
import { CupomModal } from '@/components/Cupom';
import { EstadoConsulta } from '@/components/EstadoConsulta';
import { useToast } from '@/components/ui/use-toast';
import { usePaginacao } from '@/hooks/usePaginacao';
import { useValorAtrasado } from '@/hooks/useValorAtrasado';
import { useCancelarVenda, useVenda, useVendas } from '@/api/vendas';
import { useClientes } from '@/api/clientes';
import { useConfiguracoes } from '@/api/configuracoes';
import { formatCurrency, formatDataHora } from '@/lib/format';
import { dataLocalISO, periodoRapido, somarDias } from '@/lib/datas';

const POR_PAGINA = 15;
const ROTULOS_PAGAMENTO = { dinheiro: 'Dinheiro', cartao: 'Cartão', pix: 'PIX' };
const FILTROS_STATUS = [
  { id: '', rotulo: 'Todas' },
  { id: 'Concluída', rotulo: 'Concluídas' },
  { id: 'Cancelada', rotulo: 'Canceladas' },
];

const classeSelect = 'h-10 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm';

// Compras de um cliente são buscadas no último ano; o restante começa nos últimos 7 dias
const periodoInicial = (clienteId) => {
  const hoje = dataLocalISO();
  return clienteId ? { dataInicio: somarDias(hoje, -365), dataFim: hoje } : periodoRapido('7dias');
};

function Resumo({ rotulo, valor }) {
  return (
    <div className="bg-graphite rounded-card p-4 card-shadow">
      <p className="text-xs text-snow/50">{rotulo}</p>
      <p className="text-lg font-semibold text-snow mt-1">{valor}</p>
    </div>
  );
}

function DetalheVenda({ id, onClose }) {
  const { toast } = useToast();
  const vendaQuery = useVenda(id);
  const { data: configuracoes } = useConfiguracoes();
  const cancelarVenda = useCancelarVenda();
  const [cupomAberto, setCupomAberto] = useState(false);
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);
  const [motivo, setMotivo] = useState('');
  const venda = vendaQuery.data;

  const cancelar = () => {
    cancelarVenda.mutate({ id, motivo }, {
      onSuccess: (vendaCancelada) => {
        toast({ title: `Venda #${vendaCancelada.numero} cancelada`, description: 'Estoque devolvido e estorno lançado no financeiro.' });
        setConfirmandoCancelamento(false);
      },
      onError: (erro) => toast({ title: 'Não foi possível cancelar', description: erro.message, variant: 'destructive' }),
    });
  };

  return (
    <>
      <Modal titulo={venda ? `Venda #${venda.numero}` : 'Venda'} subtitulo={venda && formatDataHora(venda.data)} onClose={onClose} largura="max-w-xl">
        <EstadoConsulta consulta={vendaQuery} textoCarregando="Carregando venda...">
          {venda && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div><p className="text-xs text-snow/50">Cliente</p><p className="text-snow">{venda.cliente}</p></div>
                <div><p className="text-xs text-snow/50">Pagamento</p><p className="text-snow">{ROTULOS_PAGAMENTO[venda.formaPagamento]}</p></div>
                <div><p className="text-xs text-snow/50">Status</p><StatusBadge status={venda.status} /></div>
              </div>

              {venda.status === 'Cancelada' && (
                <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-snow/80">
                  Cancelada em {formatDataHora(venda.canceladaEm)}
                  {venda.motivoCancelamento && <> · Motivo: {venda.motivoCancelamento}</>}
                </div>
              )}

              <div className="overflow-x-auto rounded-lg border border-[rgba(125,226,209,0.10)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-snow/50 border-b border-[rgba(125,226,209,0.10)]">
                      <th scope="col" className="font-medium py-2 px-3">Produto</th>
                      <th scope="col" className="font-medium py-2 px-3 text-center">Qtd</th>
                      <th scope="col" className="font-medium py-2 px-3 text-right">Unitário</th>
                      <th scope="col" className="font-medium py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {venda.itens.map((item) => (
                      <tr key={item.produtoId} className="border-b border-[rgba(125,226,209,0.06)] last:border-0">
                        <td className="py-2 px-3 text-snow">{item.nome}</td>
                        <td className="py-2 px-3 text-center text-snow/70">{item.quantidade}</td>
                        <td className="py-2 px-3 text-right text-snow/70">{formatCurrency(item.precoUnitario)}</td>
                        <td className="py-2 px-3 text-right text-snow">{formatCurrency(item.totalItem)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-snow/60"><span>Subtotal</span><span>{formatCurrency(venda.subtotal)}</span></div>
                {venda.desconto > 0 && (
                  <div className="flex justify-between text-warning"><span>Desconto ({venda.descontoPercentual}%)</span><span>-{formatCurrency(venda.desconto)}</span></div>
                )}
                <div className="flex justify-between text-base font-semibold text-snow"><span>Total</span><span className="text-pearl">{formatCurrency(venda.total)}</span></div>
                {venda.formaPagamento === 'dinheiro' && venda.valorRecebido != null && (
                  <div className="flex justify-between text-snow/60"><span>Recebido / troco</span><span>{formatCurrency(venda.valorRecebido)} / {formatCurrency(venda.troco)}</span></div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setCupomAberto(true)}
                  className="flex-1 h-11 rounded-lg border border-pearl/40 text-pearl text-sm font-medium hover:bg-pearl-muted transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Printer size={17} /> Cupom
                </button>
                {venda.status === 'Concluída' && (
                  <button
                    onClick={() => { setMotivo(''); setConfirmandoCancelamento(true); }}
                    className="flex-1 h-11 rounded-lg border border-danger/40 text-danger text-sm font-medium hover:bg-danger/15 transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <Ban size={17} /> Cancelar venda
                  </button>
                )}
              </div>
            </div>
          )}
        </EstadoConsulta>
      </Modal>

      <AnimatePresence>
        {cupomAberto && venda && (
          <CupomModal venda={venda} configuracoes={configuracoes} onClose={() => setCupomAberto(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmandoCancelamento && venda && (
          <DialogoConfirmacao
            titulo={`Cancelar a venda #${venda.numero}?`}
            icone={Ban}
            rotuloConfirmar="Cancelar venda"
            rotuloProcessando="Cancelando..."
            rotuloVoltar="Voltar"
            processando={cancelarVenda.isPending}
            onConfirmar={cancelar}
            onCancelar={() => setConfirmandoCancelamento(false)}
          >
            <p className="mb-3">Os produtos voltam para o estoque e o valor de {formatCurrency(venda.total)} é estornado no financeiro.</p>
            <label htmlFor="motivo-cancelamento" className="sr-only">Motivo do cancelamento</label>
            <textarea
              id="motivo-cancelamento"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Motivo (opcional)"
              rows={2}
              className="w-full bg-onyx text-snow rounded-lg px-3 py-2 border border-transparent focus:border-verdigris focus:outline-none text-sm resize-none"
            />
          </DialogoConfirmacao>
        )}
      </AnimatePresence>
    </>
  );
}

export default function Vendas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const clienteId = searchParams.get('clienteId') ?? '';
  const numero = searchParams.get('numero') ?? '';
  const vendaAberta = searchParams.get('venda');
  const { data: clientes = [] } = useClientes();

  const [periodo, setPeriodo] = useState(() => periodoInicial(clienteId));
  const [status, setStatus] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [busca, setBusca] = useState(() => searchParams.get('busca') ?? '');
  const buscaAtrasada = useValorAtrasado(busca);

  // Vindo de "Ver compras" (Clientes) o período é ampliado para o último ano
  useEffect(() => {
    if (clienteId) setPeriodo(periodoInicial(clienteId));
  }, [clienteId]);

  // Busca pelo número da venda (vinda da busca global) ignora os demais filtros
  const filtros = numero ? { numero } : { ...periodo, status, formaPagamento, clienteId, busca: buscaAtrasada.trim() };
  const vendasQuery = useVendas(filtros);
  const vendas = useMemo(() => vendasQuery.data ?? [], [vendasQuery.data]);

  // Encontrou a venda pelo número: abre o detalhe e volta para a listagem normal
  useEffect(() => {
    if (!numero || !vendasQuery.isSuccess || vendasQuery.isPlaceholderData) return;
    const encontrada = vendasQuery.data.find((v) => String(v.numero) === numero);
    if (!encontrada) return;
    const proximos = new URLSearchParams(searchParams);
    proximos.delete('numero');
    proximos.set('venda', encontrada.id);
    setSearchParams(proximos, { replace: true });
  }, [numero, vendasQuery.isSuccess, vendasQuery.isPlaceholderData, vendasQuery.data, searchParams, setSearchParams]);
  const { pagina, setPagina, totalPaginas, itensPagina } = usePaginacao(vendas, POR_PAGINA, JSON.stringify(filtros));

  const concluidas = vendas.filter((v) => v.status === 'Concluída');
  const totalVendido = concluidas.reduce((soma, v) => soma + v.total, 0);
  const nomeCliente = clientes.find((c) => c.id === clienteId)?.nome;

  const atualizarParametro = (chave, valor) => {
    const proximos = new URLSearchParams(searchParams);
    if (valor) proximos.set(chave, valor);
    else proximos.delete(chave);
    setSearchParams(proximos);
  };

  return (
    <div>
      <PageHeader title="Vendas" subtitle="Histórico de vendas, cupons e cancelamentos" />

      <div className="bg-graphite rounded-card p-4 card-shadow mb-4 space-y-4">
        <FiltroPeriodo periodo={periodo} onMudar={setPeriodo} id="vendas" />
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-snow/40" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por cliente ou número da venda..."
              aria-label="Buscar vendas"
              className="w-full h-10 bg-onyx text-snow placeholder:text-snow/40 rounded-lg pl-10 pr-4 border border-transparent focus:border-verdigris focus:outline-none text-sm"
            />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrar por status" className={classeSelect}>
            {FILTROS_STATUS.map((f) => <option key={f.id} value={f.id}>{f.rotulo}</option>)}
          </select>
          <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} aria-label="Filtrar por forma de pagamento" className={classeSelect}>
            <option value="">Todas as formas de pagamento</option>
            {Object.entries(ROTULOS_PAGAMENTO).map(([id, rotulo]) => <option key={id} value={id}>{rotulo}</option>)}
          </select>
        </div>
        {numero && (
          <button
            onClick={() => atualizarParametro('numero', null)}
            className="inline-flex items-center gap-2 h-8 px-3 mr-2 rounded-full bg-verdigris-light text-pearl text-xs font-medium hover:bg-pearl-muted transition-colors"
            aria-label="Remover busca por número"
          >
            Venda nº {numero} <X size={14} />
          </button>
        )}
        {clienteId && (
          <button
            onClick={() => atualizarParametro('clienteId', null)}
            className="inline-flex items-center gap-2 h-8 px-3 rounded-full bg-verdigris-light text-pearl text-xs font-medium hover:bg-pearl-muted transition-colors"
            aria-label="Remover filtro de cliente"
          >
            Cliente: {nomeCliente ?? clienteId} <X size={14} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Resumo rotulo="Total vendido" valor={formatCurrency(totalVendido)} />
        <Resumo rotulo="Vendas concluídas" valor={concluidas.length} />
        <Resumo rotulo="Ticket médio" valor={formatCurrency(concluidas.length ? totalVendido / concluidas.length : 0)} />
        <Resumo rotulo="Canceladas" valor={vendas.length - concluidas.length} />
      </div>

      <div className="bg-graphite rounded-card card-shadow overflow-hidden">
        <EstadoConsulta consulta={vendasQuery} textoCarregando="Carregando vendas...">
          {vendas.length === 0 ? <EmptyState message={numero ? `Nenhuma venda com o número ${numero}` : 'Nenhuma venda encontrada neste período'} /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-snow/50 border-b border-[rgba(125,226,209,0.10)]">
                    <th scope="col" className="font-medium py-3 px-4">Venda</th>
                    <th scope="col" className="font-medium py-3 px-4">Data</th>
                    <th scope="col" className="font-medium py-3 px-4">Cliente</th>
                    <th scope="col" className="font-medium py-3 px-4 text-center">Itens</th>
                    <th scope="col" className="font-medium py-3 px-4">Pagamento</th>
                    <th scope="col" className="font-medium py-3 px-4 text-right">Total</th>
                    <th scope="col" className="font-medium py-3 px-4">Status</th>
                    <th scope="col" className="py-3 px-4"><span className="sr-only">Detalhes</span></th>
                  </tr>
                </thead>
                <tbody>
                  {itensPagina.map((v) => (
                    <tr
                      key={v.id}
                      onClick={() => atualizarParametro('venda', v.id)}
                      className="border-b border-[rgba(125,226,209,0.06)] hover:bg-graphite-hover transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono text-pearl">#{v.numero}</td>
                      <td className="py-3 px-4 text-snow/70 whitespace-nowrap">{formatDataHora(v.data)}</td>
                      <td className="py-3 px-4 text-snow">{v.cliente}</td>
                      <td className="py-3 px-4 text-center text-snow/70">{v.itens}</td>
                      <td className="py-3 px-4 text-snow/70">{ROTULOS_PAGAMENTO[v.formaPagamento]}</td>
                      <td className={`py-3 px-4 text-right font-medium ${v.status === 'Cancelada' ? 'text-snow/40 line-through' : 'text-snow'}`}>{formatCurrency(v.total)}</td>
                      <td className="py-3 px-4"><StatusBadge status={v.status} /></td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); atualizarParametro('venda', v.id); }}
                          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-xs font-medium text-pearl hover:bg-verdigris-light transition-colors"
                          aria-label={`Ver detalhes da venda ${v.numero}`}
                        >
                          <Receipt size={14} /> Detalhes <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Paginacao pagina={pagina} totalPaginas={totalPaginas} onMudar={setPagina} totalItens={vendas.length} rotulo="vendas" />
        </EstadoConsulta>
      </div>

      <AnimatePresence>
        {vendaAberta && <DetalheVenda key={vendaAberta} id={vendaAberta} onClose={() => atualizarParametro('venda', null)} />}
      </AnimatePresence>
    </div>
  );
}
