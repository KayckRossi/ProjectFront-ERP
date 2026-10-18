import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, KeyRound, UserX, UserCheck, Check, Minus } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import DialogoConfirmacao from '@/components/DialogoConfirmacao';
import { EstadoConsulta } from '@/components/EstadoConsulta';
import { useToast } from '@/components/ui/use-toast';
import { useRedefinirSenhaUsuario, useSalvarUsuario, useUsuarios } from '@/api/usuarios';
import { backendConfigurado } from '@/api/http';
import { useAuth } from '@/lib/AuthContext';
import { PERFIS, PERMISSOES } from '@/lib/permissoes';
import { EMAIL_VALIDO } from '@/lib/mascaras';
import { formatDataHora, initials } from '@/lib/format';
import { contemTexto } from '@/lib/texto';

const classeCampo = 'w-full h-10 bg-onyx text-snow rounded-lg px-3 border border-transparent focus:border-verdigris focus:outline-none text-sm';
const CORES_PERFIL = {
  admin: 'bg-verdigris-light text-pearl border-pearl/30',
  gerente: 'bg-warning/15 text-warning border-warning/30',
  operador: 'bg-graphite-hover text-snow/80 border-snow/10',
};

const SeloPerfil = ({ role }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${CORES_PERFIL[role] ?? CORES_PERFIL.operador}`}>
    {PERFIS[role] ?? role}
  </span>
);

function ModalFormularioUsuario({ usuario, onClose, onSave }) {
  const [form, setForm] = useState({ nome: usuario?.nome ?? '', email: usuario?.email ?? '', role: usuario?.role ?? 'operador' });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const alterar = (campo, valor) => { setErro(''); setForm((atual) => ({ ...atual, [campo]: valor })); };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) return setErro('Informe o nome do usuário.');
    if (!EMAIL_VALIDO.test(form.email.trim())) return setErro('Informe um e-mail válido.');
    setSalvando(true);
    try {
      await onSave({ ...form, nome: form.nome.trim(), email: form.email.trim() });
    } catch (erroApi) {
      setErro(erroApi.message);
      setSalvando(false);
    }
  };

  return (
    <Modal titulo={usuario ? 'Editar usuário' : 'Novo usuário'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="usuario-nome" className="text-xs text-snow/60 mb-1.5 block">Nome</label>
          <input id="usuario-nome" autoFocus value={form.nome} onChange={(e) => alterar('nome', e.target.value)} className={classeCampo} />
        </div>
        <div>
          <label htmlFor="usuario-email" className="text-xs text-snow/60 mb-1.5 block">E-mail de acesso</label>
          <input id="usuario-email" type="email" value={form.email} onChange={(e) => alterar('email', e.target.value)} className={classeCampo} />
        </div>
        <div>
          <label htmlFor="usuario-perfil" className="text-xs text-snow/60 mb-1.5 block">Perfil</label>
          <select id="usuario-perfil" value={form.role} onChange={(e) => alterar('role', e.target.value)} className={classeCampo}>
            {Object.entries(PERFIS).map(([id, rotulo]) => <option key={id} value={id}>{rotulo}</option>)}
          </select>
        </div>
        {!usuario && (
          <p className="text-xs text-snow/50 rounded-lg bg-onyx px-3 py-2">
            {backendConfigurado
              ? 'O usuário recebe um e-mail para definir a própria senha.'
              : 'No modo demonstração, a senha inicial é nexora123.'}
          </p>
        )}
        {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 h-11 rounded-lg border border-snow/15 text-snow/70 hover:bg-graphite-hover transition-colors text-sm font-medium">Cancelar</button>
          <button type="submit" disabled={salvando} className="flex-1 h-11 rounded-lg bg-verdigris text-snow hover:bg-verdigris-hover transition-colors text-sm font-semibold disabled:opacity-50">
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function MatrizPermissoes() {
  const perfis = Object.keys(PERFIS);
  return (
    <div className="bg-graphite rounded-card card-shadow overflow-hidden mt-6">
      <div className="p-4 border-b border-[rgba(125,226,209,0.10)]">
        <h2 className="font-semibold text-snow">Perfis e permissões</h2>
        <p className="text-xs text-snow/50 mt-1">O que cada perfil pode fazer. As mesmas regras valem no backend.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Permissões por perfil">
          <thead>
            <tr className="text-left text-snow/50 border-b border-[rgba(125,226,209,0.10)]">
              <th scope="col" className="font-medium py-3 px-4">Permissão</th>
              {perfis.map((perfil) => <th key={perfil} scope="col" className="font-medium py-3 px-4 text-center">{PERFIS[perfil]}</th>)}
            </tr>
          </thead>
          <tbody>
            {Object.entries(PERMISSOES).map(([chave, { descricao, perfis: permitidos }]) => (
              <tr key={chave} className="border-b border-[rgba(125,226,209,0.06)]">
                <td className="py-2.5 px-4 text-snow/80">{descricao}</td>
                {perfis.map((perfil) => (
                  <td key={perfil} className="py-2.5 px-4 text-center">
                    {permitidos.includes(perfil)
                      ? <Check size={16} className="inline text-pearl" aria-label="Permitido" />
                      : <Minus size={16} className="inline text-snow/20" aria-label="Não permitido" />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Usuarios() {
  const { toast } = useToast();
  const { user } = useAuth();
  const usuariosQuery = useUsuarios();
  const salvarUsuario = useSalvarUsuario();
  const redefinirSenha = useRedefinirSenhaUsuario();
  const [busca, setBusca] = useState('');
  const [filtroPerfil, setFiltroPerfil] = useState('');
  const [formulario, setFormulario] = useState(null); // { usuario } aberto; usuario null = novo
  const [alterandoStatus, setAlterandoStatus] = useState(null);

  const filtrados = useMemo(() => (usuariosQuery.data ?? []).filter((u) =>
    (!filtroPerfil || u.role === filtroPerfil) && (contemTexto(u.nome, busca) || contemTexto(u.email, busca))
  ), [usuariosQuery.data, busca, filtroPerfil]);

  const salvar = async (dados) => {
    const editando = formulario.usuario;
    await salvarUsuario.mutateAsync(editando ? { ...dados, id: editando.id, ativo: editando.ativo } : dados);
    toast({ title: editando ? 'Usuário atualizado' : 'Usuário criado', description: dados.nome });
    setFormulario(null);
  };

  const confirmarStatus = () => {
    const alvo = alterandoStatus;
    salvarUsuario.mutate({ id: alvo.id, nome: alvo.nome, email: alvo.email, role: alvo.role, ativo: !alvo.ativo }, {
      onSuccess: () => {
        toast({ title: alvo.ativo ? 'Usuário desativado' : 'Usuário reativado', description: alvo.nome });
        setAlterandoStatus(null);
      },
      onError: (erro) => {
        toast({ title: 'Não foi possível alterar o usuário', description: erro.message, variant: 'destructive' });
        setAlterandoStatus(null);
      },
    });
  };

  const enviarRedefinicao = (usuario) => {
    redefinirSenha.mutate(usuario.id, {
      onSuccess: (resposta) => toast({ title: 'Redefinição de senha enviada', description: resposta?.mensagem }),
      onError: (erro) => toast({ title: 'Não foi possível enviar', description: erro.message, variant: 'destructive' }),
    });
  };

  return (
    <div>
      <PageHeader title="Usuários" subtitle="Acesso ao sistema e perfis de permissão">
        <button onClick={() => setFormulario({ usuario: null })} className="h-10 px-4 rounded-lg bg-verdigris text-snow text-sm font-semibold hover:bg-verdigris-hover transition-colors flex items-center gap-2">
          <Plus size={18} /> Novo usuário
        </button>
      </PageHeader>

      <div className="bg-graphite rounded-card card-shadow overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-[rgba(125,226,209,0.10)]">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-snow/40" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou e-mail..." aria-label="Buscar usuários" className={`${classeCampo} pl-10`} />
          </div>
          <select value={filtroPerfil} onChange={(e) => setFiltroPerfil(e.target.value)} aria-label="Filtrar por perfil" className={`${classeCampo} sm:w-56`}>
            <option value="">Todos os perfis</option>
            {Object.entries(PERFIS).map(([id, rotulo]) => <option key={id} value={id}>{rotulo}</option>)}
          </select>
        </div>
        <EstadoConsulta consulta={usuariosQuery} textoCarregando="Carregando usuários...">
          {filtrados.length === 0 ? <EmptyState message="Nenhum usuário encontrado" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-snow/50 border-b border-[rgba(125,226,209,0.10)]">
                    <th scope="col" className="font-medium py-3 px-4">Usuário</th>
                    <th scope="col" className="font-medium py-3 px-4">Perfil</th>
                    <th scope="col" className="font-medium py-3 px-4">Status</th>
                    <th scope="col" className="font-medium py-3 px-4">Último acesso</th>
                    <th scope="col" className="font-medium py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((u) => {
                    const souEu = u.id === user?.id;
                    return (
                      <tr key={u.id} className={`border-b border-[rgba(125,226,209,0.06)] hover:bg-graphite-hover transition-colors ${u.ativo ? '' : 'opacity-60'}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-verdigris flex items-center justify-center text-snow font-semibold text-xs shrink-0">{initials(u.nome)}</div>
                            <div className="min-w-0">
                              <p className="text-snow font-medium truncate">{u.nome}{souEu && <span className="text-xs text-pearl ml-2">(você)</span>}</p>
                              <p className="text-xs text-snow/50 truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4"><SeloPerfil role={u.role} /></td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-medium ${u.ativo ? 'text-pearl' : 'text-snow/50'}`}>{u.ativo ? 'Ativo' : 'Desativado'}</span>
                        </td>
                        <td className="py-3 px-4 text-snow/70 whitespace-nowrap">{u.ultimoAcesso ? formatDataHora(u.ultimoAcesso) : 'Nunca acessou'}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setFormulario({ usuario: u })} className="w-8 h-8 rounded-md hover:bg-verdigris-light text-snow/60 hover:text-pearl flex items-center justify-center transition-colors" aria-label={`Editar ${u.nome}`}><Pencil size={15} /></button>
                            <button onClick={() => enviarRedefinicao(u)} disabled={!u.ativo} title="Enviar redefinição de senha" className="w-8 h-8 rounded-md hover:bg-verdigris-light text-snow/60 hover:text-pearl flex items-center justify-center transition-colors disabled:opacity-30" aria-label={`Redefinir senha de ${u.nome}`}><KeyRound size={15} /></button>
                            <button
                              onClick={() => setAlterandoStatus(u)}
                              disabled={souEu}
                              title={souEu ? 'Você não pode desativar o próprio usuário' : undefined}
                              className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors disabled:opacity-30 ${u.ativo ? 'hover:bg-danger/15 text-snow/60 hover:text-danger' : 'hover:bg-verdigris-light text-snow/60 hover:text-pearl'}`}
                              aria-label={`${u.ativo ? 'Desativar' : 'Reativar'} ${u.nome}`}
                            >
                              {u.ativo ? <UserX size={15} /> : <UserCheck size={15} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </EstadoConsulta>
      </div>

      <MatrizPermissoes />

      <AnimatePresence mode="wait">
        {formulario && (
          <ModalFormularioUsuario key={formulario.usuario?.id ?? 'novo'} usuario={formulario.usuario} onClose={() => setFormulario(null)} onSave={salvar} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {alterandoStatus && (
          <DialogoConfirmacao
            titulo={alterandoStatus.ativo ? `Desativar ${alterandoStatus.nome}?` : `Reativar ${alterandoStatus.nome}?`}
            icone={alterandoStatus.ativo ? UserX : UserCheck}
            rotuloConfirmar={alterandoStatus.ativo ? 'Desativar' : 'Reativar'}
            rotuloProcessando="Salvando..."
            processando={salvarUsuario.isPending}
            onConfirmar={confirmarStatus}
            onCancelar={() => setAlterandoStatus(null)}
          >
            {alterandoStatus.ativo
              ? 'O usuário não conseguirá mais entrar no sistema. O histórico de vendas e caixas dele é mantido.'
              : 'O usuário volta a ter acesso com o perfil atual.'}
          </DialogoConfirmacao>
        )}
      </AnimatePresence>
    </div>
  );
}
