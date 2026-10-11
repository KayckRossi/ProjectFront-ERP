import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { Store, Printer, Bell, Shield, Database, RotateCcw, ShoppingCart } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import DialogoConfirmacao from '@/components/DialogoConfirmacao';
import { Carregando, ErroConsulta } from '@/components/EstadoConsulta';
import { useToast } from '@/components/ui/use-toast';
import { MODELOS_IMPRESSAO, useConfiguracoes, useEncerrarOutrasSessoes, useSalvarConfiguracoes } from '@/api/configuracoes';
import { backendConfigurado } from '@/api/http';
import { mascaraCnpj, mascaraTelefone } from '@/lib/mascaras';

const classeCampo = 'h-9 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm w-full sm:w-56';

function Alternador({ ativo, aoAlternar, rotulo }) {
  return (
    <button
      type="button"
      onClick={() => aoAlternar(!ativo)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-verdigris focus-visible:ring-offset-2 ${
        ativo
          ? 'bg-verdigris shadow-[0_0_10px_rgba(51,153,137,0.35)]'
          : 'bg-slate-300 dark:bg-zinc-700 hover:bg-slate-400 dark:hover:bg-zinc-600'
      }`}
      role="switch"
      aria-checked={ativo}
      aria-label={rotulo}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out ${
          ativo ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function CartaoConfiguracao({ icon: Icon, title, desc, children }) {
  return (
    <div className="bg-graphite rounded-card p-6 card-shadow">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-verdigris-light flex items-center justify-center shrink-0">
          <Icon size={20} className="text-pearl" />
        </div>
        <div>
          <h3 className="font-semibold text-snow">{title}</h3>
          <p className="text-sm text-snow/50">{desc}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function LinhaConfiguracao({ label, htmlFor, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-t border-[rgba(125,226,209,0.08)] first:border-0">
      {htmlFor ? <label htmlFor={htmlFor} className="text-sm text-snow/80">{label}</label> : <span className="text-sm text-snow/80">{label}</span>}
      {children}
    </div>
  );
}

export default function Configuracoes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const configuracoesQuery = useConfiguracoes();
  const salvarConfiguracoes = useSalvarConfiguracoes();
  const encerrarOutrasSessoes = useEncerrarOutrasSessoes();
  const [form, setForm] = useState(null);
  const [erro, setErro] = useState('');
  const [confirmandoRestauracao, setConfirmandoRestauracao] = useState(false);
  const [restaurando, setRestaurando] = useState(false);

  // Preenche o formulário quando as configurações chegam, sem sobrescrever edições em andamento
  useEffect(() => {
    if (configuracoesQuery.data && !form) setForm(configuracoesQuery.data);
  }, [configuracoesQuery.data, form]);

  if (configuracoesQuery.isPending || (!form && !configuracoesQuery.isError)) {
    return <><PageHeader title="Configurações" subtitle="Preferências do sistema e da loja" /><Carregando texto="Carregando configurações..." /></>;
  }
  if (configuracoesQuery.isError) {
    return <><PageHeader title="Configurações" subtitle="Preferências do sistema e da loja" /><ErroConsulta erro={configuracoesQuery.error} onTentarNovamente={configuracoesQuery.refetch} /></>;
  }

  const alterado = JSON.stringify(form) !== JSON.stringify(configuracoesQuery.data);
  const alterar = (secao, campo, valor) => {
    setErro('');
    setForm((atual) => ({ ...atual, [secao]: { ...atual[secao], [campo]: valor } }));
  };

  const salvar = () => {
    salvarConfiguracoes.mutate(form, {
      onSuccess: (salvas) => {
        setForm(salvas);
        toast({ title: 'Configurações salvas' });
      },
      onError: (erroApi) => setErro(erroApi.message),
    });
  };

  const encerrarSessoes = () => {
    encerrarOutrasSessoes.mutate(undefined, {
      onSuccess: (resposta) => toast({
        title: 'Outras sessões encerradas',
        description: resposta?.sessoesEncerradas ? `${resposta.sessoesEncerradas} sessão(ões) encerrada(s).` : 'Não havia outras sessões abertas.',
      }),
      onError: (erroApi) => toast({ title: 'Não foi possível encerrar as sessões', description: erroApi.message, variant: 'destructive' }),
    });
  };

  const restaurar = async () => {
    setRestaurando(true);
    const { restaurarDadosDemo } = await import('@/api/demo/servidor');
    await restaurarDadosDemo();
    await queryClient.resetQueries();
    setForm(null);
    setRestaurando(false);
    setConfirmandoRestauracao(false);
    toast({ title: 'Dados de demonstração restaurados' });
  };

  return (
    <div>
      <PageHeader title="Configurações" subtitle="Preferências do sistema e da loja">
        <button
          onClick={() => { setForm(configuracoesQuery.data); setErro(''); }}
          disabled={!alterado || salvarConfiguracoes.isPending}
          className="h-10 px-4 rounded-lg border border-snow/15 text-snow/70 text-sm font-medium hover:bg-graphite-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Descartar
        </button>
        <button
          onClick={salvar}
          disabled={!alterado || salvarConfiguracoes.isPending}
          className="h-10 px-4 rounded-lg bg-verdigris text-snow text-sm font-semibold hover:bg-verdigris-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {salvarConfiguracoes.isPending ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </PageHeader>

      {erro && <p role="alert" className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-snow">{erro}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CartaoConfiguracao icon={Store} title="Dados da Loja" desc="Informações exibidas no cupom de venda">
          <LinhaConfiguracao label="Nome da loja" htmlFor="cfg-nome">
            <input id="cfg-nome" value={form.loja.nome} onChange={(e) => alterar('loja', 'nome', e.target.value)} className={classeCampo} />
          </LinhaConfiguracao>
          <LinhaConfiguracao label="CNPJ" htmlFor="cfg-cnpj">
            <input id="cfg-cnpj" value={form.loja.cnpj} onChange={(e) => alterar('loja', 'cnpj', mascaraCnpj(e.target.value))} className={`${classeCampo} font-mono`} />
          </LinhaConfiguracao>
          <LinhaConfiguracao label="Telefone" htmlFor="cfg-telefone">
            <input id="cfg-telefone" value={form.loja.telefone} onChange={(e) => alterar('loja', 'telefone', mascaraTelefone(e.target.value))} className={classeCampo} />
          </LinhaConfiguracao>
          <LinhaConfiguracao label="Endereço" htmlFor="cfg-endereco">
            <input id="cfg-endereco" value={form.loja.endereco ?? ''} onChange={(e) => alterar('loja', 'endereco', e.target.value)} className={classeCampo} />
          </LinhaConfiguracao>
        </CartaoConfiguracao>

        <CartaoConfiguracao icon={Bell} title="Notificações" desc="Alertas do sistema">
          <LinhaConfiguracao label="Notificações push">
            <Alternador rotulo="Notificações push" ativo={form.notificacoes.push} aoAlternar={(v) => alterar('notificacoes', 'push', v)} />
          </LinhaConfiguracao>
          <LinhaConfiguracao label="Alerta de estoque baixo">
            <Alternador rotulo="Alerta de estoque baixo" ativo={form.notificacoes.alertaEstoqueBaixo} aoAlternar={(v) => alterar('notificacoes', 'alertaEstoqueBaixo', v)} />
          </LinhaConfiguracao>
        </CartaoConfiguracao>

        <CartaoConfiguracao icon={Printer} title="Impressão" desc="Cupom não fiscal do PDV">
          <LinhaConfiguracao label="Imprimir automaticamente ao finalizar">
            <Alternador rotulo="Imprimir automaticamente ao finalizar" ativo={form.impressao.automatica} aoAlternar={(v) => alterar('impressao', 'automatica', v)} />
          </LinhaConfiguracao>
          <LinhaConfiguracao label="Modelo" htmlFor="cfg-modelo">
            <select id="cfg-modelo" value={form.impressao.modelo} onChange={(e) => alterar('impressao', 'modelo', e.target.value)} className={classeCampo}>
              {MODELOS_IMPRESSAO.map((modelo) => <option key={modelo}>{modelo}</option>)}
            </select>
          </LinhaConfiguracao>
          <LinhaConfiguracao label="Mensagem no rodapé" htmlFor="cfg-rodape">
            <input id="cfg-rodape" value={form.impressao.mensagemRodape ?? ''} onChange={(e) => alterar('impressao', 'mensagemRodape', e.target.value)} className={classeCampo} />
          </LinhaConfiguracao>
        </CartaoConfiguracao>

        <CartaoConfiguracao icon={ShoppingCart} title="PDV" desc="Regras do ponto de venda">
          <LinhaConfiguracao label="Exigir caixa aberto para vender">
            <Alternador
              rotulo="Exigir caixa aberto para vender"
              ativo={form.pdv?.exigirCaixaAberto !== false}
              aoAlternar={(v) => alterar('pdv', 'exigirCaixaAberto', v)}
            />
          </LinhaConfiguracao>
          <p className="text-xs text-snow/40">Com a opção ligada, cada venda entra no caixa do operador e aparece no fechamento.</p>
        </CartaoConfiguracao>

        <CartaoConfiguracao icon={Shield} title="Segurança" desc="Proteção de acesso">
          <LinhaConfiguracao label="Autenticação em dois fatores">
            <Alternador rotulo="Autenticação em dois fatores" ativo={form.seguranca.doisFatores} aoAlternar={(v) => alterar('seguranca', 'doisFatores', v)} />
          </LinhaConfiguracao>
          <LinhaConfiguracao label="Sessão">
            <button onClick={encerrarSessoes} disabled={encerrarOutrasSessoes.isPending} className="text-sm text-pearl hover:underline disabled:opacity-50">
              {encerrarOutrasSessoes.isPending ? 'Encerrando...' : 'Encerrar outras sessões'}
            </button>
          </LinhaConfiguracao>
        </CartaoConfiguracao>

        {!backendConfigurado && (
          <CartaoConfiguracao icon={Database} title="Dados" desc="No modo demonstração os dados ficam salvos neste navegador">
            <LinhaConfiguracao label="Restaurar dados de demonstração">
              <button onClick={() => setConfirmandoRestauracao(true)} className="text-sm text-danger hover:underline">Restaurar</button>
            </LinhaConfiguracao>
          </CartaoConfiguracao>
        )}
      </div>

      <AnimatePresence>
        {confirmandoRestauracao && (
          <DialogoConfirmacao
            titulo="Restaurar dados de demonstração?"
            icone={RotateCcw}
            rotuloConfirmar="Restaurar"
            rotuloProcessando="Restaurando..."
            processando={restaurando}
            onConfirmar={restaurar}
            onCancelar={() => setConfirmandoRestauracao(false)}
          >
            Vendas, produtos, clientes e configurações deste navegador voltam ao estado inicial da demonstração.
          </DialogoConfirmacao>
        )}
      </AnimatePresence>
    </div>
  );
}
