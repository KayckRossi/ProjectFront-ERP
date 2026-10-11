import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/http';
import { invalidar } from '@/lib/query-client';

export function useUsuarios(opcoes = {}) {
  return useQuery({ queryKey: ['usuarios'], queryFn: () => api('/api/usuarios'), ...opcoes });
}

// { id?, nome, email, role, ativo? }
export function useSalvarUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dados }) =>
      id ? api(`/api/usuarios/${id}`, { method: 'PUT', body: dados }) : api('/api/usuarios', { method: 'POST', body: dados }),
    onSuccess: () => invalidar(queryClient, 'usuarios', 'auditoria'),
  });
}

export function useRedefinirSenhaUsuario() {
  return useMutation({ mutationFn: (id) => api(`/api/usuarios/${id}/redefinir-senha`, { method: 'POST' }) });
}
