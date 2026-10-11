import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, PackageCheck, Pencil, Ban, ChevronRight, Receipt } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import DialogoConfirmacao from '@/components/DialogoConfirmacao';
import FiltroPeriodo from '@/components/FiltroPeriodo';
import Paginacao from '@/components/Paginacao';
import { EstadoConsulta } from '@/components/EstadoConsulta';
import { useToast } from '@/components/ui/use-toast';
import { usePaginacao } from '@/hooks/usePaginacao';
import { useValorAtrasado } from '@/hooks/useValorAtrasado';
import { useCancelarCompra, useCompra, useCompras, useReceberCompra, useSalvarCompra } from '@/api/compras';
import { useFornecedores } from '@/api/fornecedores';
import { useProdutos } from '@/api/produtos';
import { arredondar, lerValorMonetario } from '@/lib/dinheiro';
import { dataLocalISO, somarDias } from '@/lib/datas';
import { formatCurrency, formatDataHora, formatDate } from '@/lib/format';

const POR_PAGINA = 15;
const classeCampo = 'w-full h-10 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm';
const STATUS = {
  aberta: { rotulo: 'Aguardando recebimento', classe: 'bg-warning/15 text-warning border-warning/30' },
  recebida: { rotulo: 'Recebida', classe: 'bg-pearl-muted text-pearl border-pearl/30' },
  cancelada: { rotulo: 'Cancelada', classe: 'bg-danger/15 text-danger border-danger/30' },
};

const SeloStatus = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${STATUS[status]?.classe}`}>
    {STATUS[status]?.rotulo ?? status}
  </span>
);

const novoItem = () => ({ chave: Math.random().toString(36).slice(2), produtoId: '', quantidade: '', custoUnitario: '' });

function ModalFormularioCompra({ compra, fornecedorInicial, onClose, onSave }) {
  const { data: fornecedores = [] } = useFornecedores();
  const { data: produtos = [] } = useProdutos();
  const [fornecedorId, setFornecedorId] = useState(compra?.fornecedorId ?? fornecedorInicial ?? '');
  const [itens, setItens] = useState(() => compra?.itens.map((i) => ({
    chave: i.produtoId, produtoId: i.produtoId, quantidade: String(i.quantidade), custoUnitario: String(i.custoUnitario).replace('.', ','),
  })) ?? [novoItem()]);
  const [observacoes, setObservacoes] = useState(compra?.observacoes ?? '');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const alterarItem = (chave, campo, valor) => {
    setErro('');
    setItens((atuais) => atuais.map((item) => {
      if (item.chave !== chave) return item;
      const atualizado = { ...item, [campo]: valor };
      // Ao escolher o produto, sugere o custo atual do cadastro
      if (campo === 'produtoId' && !item.custoUnitario) {
        const produto = produtos.find((p) => p.id === valor);
        if (produto) atualizado.custoUnitario = String(produto.custo).replace('.', ',');
      }
      return atualizado;
    }));
  };

  const total = arredondar(itens.reduce((soma, i) => soma + (parseInt(i.quantidade, 10) || 0) * lerValorMonetario(i.custoUnitario), 0));

  const submit = async (e) => {
    e.preventDefault();
    const preenchidos = itens.filter((i) => i.produtoId);
    if (!fornecedorId) return setErro('Escolha o fornecedor.');
    if (!preenchidos.length) return setErro('Adicione ao menos um produto.');
    if (new Set(preenchidos.map((i) => i.produtoId)).size !== preenchidos.length) return setErro('Há produtos repetidos na compra.');
    if (preenchidos.some((i) => !(parseInt(i.quantidade, 10) > 0) || !(lerValorMonetario(i.custoUnitario) > 0))) {
      return setErro('Informe quantidade e custo de todos os itens.');
    }
    setSalvando(true);
    try {
      await onSave({
        fornecedorId,
        observacoes,
        itens: preenchidos.map((i) => ({ produtoId: i.produtoId, quantidade: parseInt(i.quantidade, 10), custoUnitario: lerValorMonetario(i.custoUnitario) })),
      });
    } catch (erroApi) {
      setErro(erroApi.message);
      setSalvando(false);
    }
  };

  return (
    <Modal titulo={compra ? `Editar compra #${compra.numero}` : 'Nova compra'} subtitulo="A mercadoria entra no estoque quando a compra é recebida" onClose={onClose} largura="max-w-2xl">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="compra-fornecedor" className="text-xs text-snow/60 mb-1.5 block">Fornecedor</label>
          <select id="compra-fornecedor" autoFocus value={fornecedorId} onChange={(e) => { setFornecedorId(e.target.value); setErro(''); }} className={classeCampo}>
            <option value="">Selecione...</option>
            {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nomeFantasia || f.razaoSocial}</option>)}
          </select>
        </div>

        <div>
          <p className="text-xs text-snow/60 mb-1.5">Itens</p>
          <div className="space-y-2">
            {itens.map((item, indice) => (
              <div key={item.chave} className="grid grid-cols-[1fr_80px_110px_32px] gap-2 items-center">
                <select value={item.produtoId} onChange={(e) => alterarItem(item.chave, 'produtoId', e.target.value)} aria-label={`Produto do item ${indice + 1}`} className={classeCampo}>
                  <option value="">Produto...</option>
                  {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
                <input type="number" min="1" step="1" placeholder="Qtd" value={item.quantidade} onChange={(e) => alterarItem(item.chave, 'quantidade', e.target.value)} aria-label={`Quantidade do item ${indice + 1}`} className={classeCampo} />
                <input inputMode="decimal" placeholder="Custo R$" value={item.custoUnitario} onChange={(e) => alterarItem(item.chave, 'custoUnitario', e.target.value)} aria-label={`Custo unitário do item ${indice + 1}`} className={classeCampo} />
                <button type="button" onClick={() => setItens((atuais) => (atuais.length > 1 ? atuais.filter((i) => i.chave !== item.chave) : [novoItem()]))} className="w-8 h-8 rounded-md hover:bg-danger/15 text-snow/50 hover:text-danger flex items-center justify-center transition-colors" aria-label={`Remover item ${indice + 1}`}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setItens((atuais) => [...atuais, novoItem()])} className="mt-2 h-8 px-3 rounded-md text-xs font-medium text-pearl border border-pearl/30 hover:bg-pearl-muted transition-colors inline-flex items-center gap-1.5">
            <Plus size={14} /> Adicionar item
          </button>
        </div>

        <div>
          <label htmlFor="compra-observacoes" className="text-xs text-snow/60 mb-1.5 block">Observações</label>
          <input id="compra-observacoes" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className={classeCampo} />
        </div>

        <div className="flex items-center justify-between text-base font-semibold text-snow">
          <span>Total da compra</span>
          <span className="text-pearl">{formatCurrency(total)}</span>
        </div>
        {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 h-11 rounded-lg border border-snow/15 text-snow/70 hover:bg-graphite-hover transition-colors text-sm font-medium">Cancelar</button>
          <button type="submit" disabled={salvando} className="flex-1 h-11 rounded-lg bg-verdigris text-snow hover:bg-verdigris-hover transition-colors text-sm font-semibold disabled:opacity-50">
            {salvando ? 'Salvando...' : compra ? 'Salvar compra' : 'Criar compra'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DetalheCompra({ id, onClose, onEditar }) {
  const { toast } = useToast();
  const compraQuery = useCompra(id);
  const receberCompra = useReceberCompra();
  const cancelarCompra = useCancelarCompra();
  const [confirmando, setConfirmando] = useState(null); // 'receber' | 'cancelar'
  const [atualizarCusto, setAtualizarCusto] = useState(true);
  const [motivo, setMotivo] = useState('');
  const compra = compraQuery.data;

  const receber = () => {
    receberCompra.mutate({ id, atualizarCusto }, {
      onSuccess: (recebida) => {
        setConfirmando(null);
        toast({ title: `Compra #${recebida.numero} recebida`, description: 'Estoque atualizado e despesa lançada no financeiro.' });
        if (recebida.alertasPreco?.length) {
          toast({
            title: 'Revise os preços de venda',
            description: `Custo acima do preço: ${recebida.alertasPreco.map((a) => a.nome).join(', ')}.`,
            variant: 'destructive',
          });
        }
      },
      onError: (erro) => toast({ title: 'Não foi possível receber', description: erro.message, variant: 'destructive' }),
    });
  };

  const cancelar = () => {
    cancelarCompra.mutate({ id, motivo }, {
      onSuccess: (cancelada) => {
        setConfirmando(null);
        toast({ title: `Compra #${cancelada.numero} cancelada` });
      },
      onError: (erro) => toast({ title: 'Não foi possível cancelar', description: erro.message, variant: 'destructive' }),
    });
  };

  return (
    <>
      <Modal titulo={compra ? `Compra #${compra.numero}` : 'Compra'} subtitulo={compra && `${compra.fornecedor} · criada em ${formatDataHora(compra.criadaEm)}`} onClose={onClose} largura="max-w-xl">
        <EstadoConsulta consulta={compraQuery} textoCarregando="Carregando compra...">
          {compra && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div><p className="text-xs text-snow/50">Status</p><SeloStatus status={compra.status} /></div>
                <div><p className="text-xs text-snow/50">Criada por</p><p className="text-snow">{compra.criadaPor || '—'}</p></div>
                {compra.status === 'recebida' && (
                  <>
                    <div><p className="text-xs text-snow/50">Recebida</p><p className="text-snow">{formatDataHora(compra.recebidaEm)}</p></div>
                    <div><p className="text-xs text-snow/50">Vencimento</p><p className="text-snow">{formatDate(compra.vencimento)}</p></div>
                  </>
                )}
              </div>
              {compra.status === 'cancelada' && (
                <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-snow/80">
                  Cancelada em {formatDataHora(compra.canceladaEm)}{compra.motivoCancelamento && <> · Motivo: {compra.motivoCancelamento}</>}
                </div>
              )}
              {compra.observacoes && <p className="text-sm text-snow/70">Obs.: {compra.observacoes}</p>}

              <div className="overflow-x-auto rounded-lg border border-[rgba(125,226,209,0.10)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-snow/50 border-b border-[rgba(125,226,209,0.10)]">
                      <th scope="col" className="font-medium py-2 px-3">Produto</th>
                      <th scope="col" className="font-medium py-2 px-3 text-center">Qtd</th>
                      <th scope="col" className="font-medium py-2 px-3 text-right">Custo unit.</th>
                      <th scope="col" className="font-medium py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compra.itens.map((item) => (
                      <tr key={item.produtoId} className="border-b border-[rgba(125,226,209,0.06)] last:border-0">
                        <td className="py-2 px-3 text-snow">{item.nome}</td>
                        <td className="py-2 px-3 text-center text-snow/70">{item.quantidade}</td>
                        <td className="py-2 px-3 text-right text-snow/70">{formatCurrency(item.custoUnitario)}</td>
                        <td className="py-2 px-3 text-right text-snow">{formatCurrency(item.totalItem)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between text-base font-semibold text-snow"><span>Total</span><span className="text-pearl">{formatCurrency(compra.total)}</span></div>

              {compra.status === 'aberta' && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={() => setConfirmando('receber')} className="flex-1 h-11 rounded-lg bg-verdigris text-snow text-sm font-semibold hover:bg-verdigris-hover transition-colors inline-flex items-center justify-center gap-2">
                    <PackageCheck size={17} /> Receber mercadorias
                  </button>
                  <button onClick={() => onEditar(compra)} className="h-11 px-4 rounded-lg border border-pearl/40 text-pearl text-sm font-medium hover:bg-pearl-muted transition-colors inline-flex items-center justify-center gap-2">
                    <Pencil size={16} /> Editar
                  </button>
                  <button onClick={() => { setMotivo(''); setConfirmando('cancelar'); }} className="h-11 px-4 rounded-lg border border-danger/40 text-danger text-sm font-medium hover:bg-danger/15 transition-colors inline-flex items-center justify-center gap-2">
                    <Ban size={16} /> Cancelar
                  </button>
                </div>
              )}
            </div>
          )}
        </EstadoConsulta>
      </Modal>

      <AnimatePresence>
        {confirmando === 'receber' && compra && (
          <DialogoConfirmacao
            titulo={`Receber a compra #${compra.numero}?`}
            icone={PackageCheck}
            rotuloConfirmar="Receber"
            rotuloProcessando="Recebendo..."
            rotuloVoltar="Voltar"
            processando={receberCompra.isPending}
            onConfirmar={receber}
            onCancelar={() => setConfirmando(null)}
          >
            <p className="mb-3">As quantidades entram no estoque e {formatCurrency(compra.total)} é lançado como despesa em Fornecedores.</p>
            <label className="flex items-center justify-center gap-2 text-snow/80 cursor-pointer">
              <input type="checkbox" checked={atualizarCusto} onChange={(e) => setAtualizarCusto(e.target.checked)} className="w-4 h-4 accent-verdigris" />
              Atualizar o custo dos produtos
            </label>
          </DialogoConfirmacao>
        )}
        {confirmando === 'cancelar' && compra && (
          <DialogoConfirmacao
            titulo={`Cancelar a compra #${compra.numero}?`}
            icone={Ban}
            rotuloConfirmar="Cancelar compra"
            rotuloProcessando="Cancelando..."
            rotuloVoltar="Voltar"
            processando={cancelarCompra.isPending}
            onConfirmar={cancelar}
            onCancelar={() => setConfirmando(null)}
          >
            <p className="mb-3">A compra não poderá mais ser recebida.</p>
            <label htmlFor="motivo-cancelamento-compra" className="sr-only">Motivo do cancelamento</label>
            <textarea id="motivo-cancelamento-compra" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo (opcional)" rows={2} className="w-full bg-onyx text-snow rounded-lg px-3 py-2 border border-transparent focus:border-verdigris focus:outline-none text-sm resize-none" />
          </DialogoConfirmacao>
        )}
      </AnimatePresence>
    </>
  );
}

export default function Compras() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const compraAberta = searchParams.get('compra');
  const salvarCompra = useSalvarCompra();
  const { data: fornecedores = [] } = useFornecedores();
  const [periodo, setPeriodo] = useState(() => ({ dataInicio: somarDias(dataLocalISO(), -89), dataFim: dataLocalISO() }));
  const [status, setStatus] = useState(() => searchParams.get('status') ?? '');
  const [fornecedorId, setFornecedorId] = useState('');
  const [busca, setBusca] = useState('');
  const buscaAtrasada = useValorAtrasado(busca);
  const [formulario, setFormulario] = useState(null); // { compra, fornecedorInicial }

  // Vindo de Fornecedores: abre o formulário já com o fornecedor escolhido
  useEffect(() => {
    const fornecedorDaUrl = searchParams.get('novaCompra');
    if (!fornecedorDaUrl) return;
    setFormulario({ compra: null, fornecedorInicial: fornecedorDaUrl });
    const proximos = new URLSearchParams(searchParams);
    proximos.delete('novaCompra');
    setSearchParams(proximos, { replace: true });
  }, [searchParams, setSearchParams]);

  const filtros = { ...periodo, status, fornecedorId, busca: buscaAtrasada.trim() };
  const comprasQuery = useCompras(filtros);
  const abertasQuery = useCompras({ status: 'aberta' });
  const compras = useMemo(() => comprasQuery.data ?? [], [comprasQuery.data]);
  const { pagina, setPagina, totalPaginas, itensPagina } = usePaginacao(compras, POR_PAGINA, JSON.stringify(filtros));

  const abertas = abertasQuery.data ?? [];
  const recebidas = compras.filter((c) => c.status === 'recebida');

  const atualizarParametro = (chave, valor) => {
    const proximos = new URLSearchParams(searchParams);
    if (valor) proximos.set(chave, valor);
    else proximos.delete(chave);
    setSearchParams(proximos);
  };

  const salvar = async (dados) => {
    const editando = formulario.compra;
    const salva = await salvarCompra.mutateAsync(editando ? { ...dados, id: editando.id } : dados);
    toast({ title: editando ? `Compra #${salva.numero} atualizada` : `Compra #${salva.numero} criada`, description: `${salva.fornecedor} · ${formatCurrency(salva.total)}` });
    setFormulario(null);
    atualizarParametro('compra', salva.id);
  };

  return (
    <div>
      <PageHeader title="Compras" subtitle="Pedidos de compra e entrada de mercadorias">
        <button onClick={() => setFormulario({ compra: null })} className="h-10 px-4 rounded-lg bg-verdigris text-snow text-sm font-semibold hover:bg-verdigris-hover transition-colors flex items-center gap-2">
          <Plus size={18} /> Nova compra
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <button onClick={() => setStatus('aberta')} className="text-left bg-graphite rounded-card p-4 card-shadow border-l-4 border-warning hover:ring-1 hover:ring-warning/40 transition-all">
          <p className="text-xs text-snow/50">Aguardando recebimento</p>
          <p className="text-lg font-semibold text-snow mt-1">{abertas.length} {abertas.length === 1 ? 'compra' : 'compras'}</p>
          <p className="text-xs text-snow/40">{formatCurrency(abertas.reduce((soma, c) => soma + c.total, 0))}</p>
        </button>
        <div className="bg-graphite rounded-card p-4 card-shadow border-l-4 border-verdigris">
          <p className="text-xs text-snow/50">Recebidas no período</p>
          <p className="text-lg font-semibold text-snow mt-1">{recebidas.length}</p>
          <p className="text-xs text-snow/40">{formatCurrency(recebidas.reduce((soma, c) => soma + c.total, 0))}</p>
        </div>
        <div className="bg-graphite rounded-card p-4 card-shadow border-l-4 border-pearl">
          <p className="text-xs text-snow/50">Fornecedores ativos no período</p>
          <p className="text-lg font-semibold text-snow mt-1">{new Set(recebidas.map((c) => c.fornecedorId)).size}</p>
          <p className="text-xs text-snow/40">de {fornecedores.length} cadastrados</p>
        </div>
      </div>

      <div className="bg-graphite rounded-card p-4 card-shadow mb-4 space-y-4">
        <FiltroPeriodo periodo={periodo} onMudar={setPeriodo} id="compras" />
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-snow/40" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por fornecedor ou número..." aria-label="Buscar compras" className={`${classeCampo} pl-10`} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrar por status" className={`${classeCampo} md:w-60`}>
            <option value="">Todos os status</option>
            {Object.entries(STATUS).map(([id, { rotulo }]) => <option key={id} value={id}>{rotulo}</option>)}
          </select>
          <select value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)} aria-label="Filtrar por fornecedor" className={`${classeCampo} md:w-60`}>
            <option value="">Todos os fornecedores</option>
            {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nomeFantasia || f.razaoSocial}</option>)}
          </select>
        </div>
        {status === 'aberta' && <p className="text-xs text-snow/50">Compras aguardando recebimento aparecem independentemente do período.</p>}
      </div>

      <div className="bg-graphite rounded-card card-shadow overflow-hidden">
        <EstadoConsulta consulta={comprasQuery} textoCarregando="Carregando compras...">
          {compras.length === 0 ? <EmptyState message="Nenhuma compra encontrada" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-snow/50 border-b border-[rgba(125,226,209,0.10)]">
                    <th scope="col" className="font-medium py-3 px-4">Compra</th>
                    <th scope="col" className="font-medium py-3 px-4">Criada em</th>
                    <th scope="col" className="font-medium py-3 px-4">Fornecedor</th>
                    <th scope="col" className="font-medium py-3 px-4 text-center">Itens</th>
                    <th scope="col" className="font-medium py-3 px-4 text-right">Total</th>
                    <th scope="col" className="font-medium py-3 px-4">Status</th>
                    <th scope="col" className="py-3 px-4"><span className="sr-only">Detalhes</span></th>
                  </tr>
                </thead>
                <tbody>
                  {itensPagina.map((c) => (
                    <tr key={c.id} onClick={() => atualizarParametro('compra', c.id)} className="border-b border-[rgba(125,226,209,0.06)] hover:bg-graphite-hover transition-colors cursor-pointer">
                      <td className="py-3 px-4 font-mono text-pearl">#{c.numero}</td>
                      <td className="py-3 px-4 text-snow/70 whitespace-nowrap">{formatDataHora(c.criadaEm)}</td>
                      <td className="py-3 px-4 text-snow">{c.fornecedor}</td>
                      <td className="py-3 px-4 text-center text-snow/70">{c.itens}</td>
                      <td className={`py-3 px-4 text-right font-medium ${c.status === 'cancelada' ? 'text-snow/40 line-through' : 'text-snow'}`}>{formatCurrency(c.total)}</td>
                      <td className="py-3 px-4"><SeloStatus status={c.status} /></td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); atualizarParametro('compra', c.id); }}
                          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-xs font-medium text-pearl hover:bg-verdigris-light transition-colors"
                          aria-label={`Ver detalhes da compra ${c.numero}`}
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
          <Paginacao pagina={pagina} totalPaginas={totalPaginas} onMudar={setPagina} totalItens={compras.length} rotulo="compras" />
        </EstadoConsulta>
      </div>

      <AnimatePresence mode="wait">
        {formulario ? (
          <ModalFormularioCompra
            key={formulario.compra?.id ?? 'nova'}
            compra={formulario.compra}
            fornecedorInicial={formulario.fornecedorInicial}
            onClose={() => setFormulario(null)}
            onSave={salvar}
          />
        ) : compraAberta ? (
          <DetalheCompra
            key={compraAberta}
            id={compraAberta}
            onClose={() => atualizarParametro('compra', null)}
            onEditar={(compra) => setFormulario({ compra })}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
