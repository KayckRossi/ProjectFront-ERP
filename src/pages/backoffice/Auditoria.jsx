import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import FiltroPeriodo from '@/components/FiltroPeriodo';
import Paginacao from '@/components/Paginacao';
import { EstadoConsulta } from '@/components/EstadoConsulta';
import { usePaginacao } from '@/hooks/usePaginacao';
import { useValorAtrasado } from '@/hooks/useValorAtrasado';
import { ENTIDADES_AUDITORIA, useAuditoria } from '@/api/auditoria';
import { useUsuarios } from '@/api/usuarios';
import { periodoRapido } from '@/lib/datas';
import { formatDataHora } from '@/lib/format';

const POR_PAGINA = 25;
const classeCampo = 'h-10 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm';

const CORES_ACAO = {
  criou: 'bg-pearl-muted text-pearl border-pearl/30',
  registrou: 'bg-pearl-muted text-pearl border-pearl/30',
  recebeu: 'bg-pearl-muted text-pearl border-pearl/30',
  abriu: 'bg-pearl-muted text-pearl border-pearl/30',
  atualizou: 'bg-warning/15 text-warning border-warning/30',
  movimentou: 'bg-warning/15 text-warning border-warning/30',
  fechou: 'bg-warning/15 text-warning border-warning/30',
  excluiu: 'bg-danger/15 text-danger border-danger/30',
  cancelou: 'bg-danger/15 text-danger border-danger/30',
};

export default function Auditoria() {
  const [periodo, setPeriodo] = useState(() => periodoRapido('7dias'));
  const [usuarioId, setUsuarioId] = useState('');
  const [entidade, setEntidade] = useState('');
  const [busca, setBusca] = useState('');
  const buscaAtrasada = useValorAtrasado(busca);
  const { data: usuarios = [] } = useUsuarios();

  const filtros = { ...periodo, usuarioId, entidade, busca: buscaAtrasada.trim() };
  const auditoriaQuery = useAuditoria(filtros);
  const registros = useMemo(() => auditoriaQuery.data ?? [], [auditoriaQuery.data]);
  const { pagina, setPagina, totalPaginas, itensPagina } = usePaginacao(registros, POR_PAGINA, JSON.stringify(filtros));

  return (
    <div>
      <PageHeader title="Auditoria" subtitle="Quem fez o quê e quando" />

      <div className="bg-graphite rounded-card p-4 card-shadow mb-4 space-y-4">
        <FiltroPeriodo periodo={periodo} onMudar={setPeriodo} id="auditoria" />
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-snow/40" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar na descrição..." aria-label="Buscar na auditoria" className={`${classeCampo} w-full pl-10`} />
          </div>
          <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)} aria-label="Filtrar por usuário" className={classeCampo}>
            <option value="">Todos os usuários</option>
            {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
          <select value={entidade} onChange={(e) => setEntidade(e.target.value)} aria-label="Filtrar por área" className={classeCampo}>
            <option value="">Todas as áreas</option>
            {Object.entries(ENTIDADES_AUDITORIA).map(([id, rotulo]) => <option key={id} value={id}>{rotulo}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-graphite rounded-card card-shadow overflow-hidden">
        <EstadoConsulta consulta={auditoriaQuery} textoCarregando="Carregando auditoria...">
          {registros.length === 0 ? <EmptyState message="Nenhum registro neste período" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Registros de auditoria">
                <thead>
                  <tr className="text-left text-snow/50 border-b border-[rgba(125,226,209,0.10)]">
                    <th scope="col" className="font-medium py-3 px-4">Data</th>
                    <th scope="col" className="font-medium py-3 px-4">Usuário</th>
                    <th scope="col" className="font-medium py-3 px-4">Ação</th>
                    <th scope="col" className="font-medium py-3 px-4">Área</th>
                    <th scope="col" className="font-medium py-3 px-4">Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  {itensPagina.map((r) => (
                    <tr key={r.id} className="border-b border-[rgba(125,226,209,0.06)] hover:bg-graphite-hover transition-colors">
                      <td className="py-3 px-4 text-snow/70 whitespace-nowrap">{formatDataHora(r.data)}</td>
                      <td className="py-3 px-4 text-snow whitespace-nowrap">{r.usuario}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${CORES_ACAO[r.acao] ?? 'bg-graphite-hover text-snow/70 border-snow/10'}`}>{r.acao}</span>
                      </td>
                      <td className="py-3 px-4 text-snow/70">{ENTIDADES_AUDITORIA[r.entidade] ?? r.entidade}</td>
                      <td className="py-3 px-4 text-snow/80">{r.descricao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Paginacao pagina={pagina} totalPaginas={totalPaginas} onMudar={setPagina} totalItens={registros.length} rotulo="registros" />
        </EstadoConsulta>
      </div>
    </div>
  );
}
