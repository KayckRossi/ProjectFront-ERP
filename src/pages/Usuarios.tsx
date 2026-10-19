import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Shield, User } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User as UserType } from '@/types';
import { useColecao, usuariosApi } from '@/api/recursos';

const allPermissions = [
  { id: 'sales', label: 'Vendas (PDV)' },
  { id: 'products', label: 'Cadastro de Produtos' },
  { id: 'customers', label: 'Cadastro de Clientes' },
  { id: 'suppliers', label: 'Cadastro de Fornecedores' },
  { id: 'sellers', label: 'Cadastro de Vendedores' },
  { id: 'stock', label: 'Controle de Estoque' },
  { id: 'receivables', label: 'Contas a Receber' },
  { id: 'payables', label: 'Contas a Pagar' },
  { id: 'receipts', label: 'Recibos' },
  { id: 'barcodes', label: 'Códigos de Barras' },
  { id: 'reports', label: 'Relatórios' },
  { id: 'users', label: 'Usuários' },
];

const roles = [
  { id: 'admin', label: 'Administrador' },
  { id: 'manager', label: 'Gerente' },
  { id: 'seller', label: 'Vendedor' },
  { id: 'cashier', label: 'Caixa' },
];

export default function Usuarios() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useColecao(usuariosApi);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '' as UserType['role'] | '',
    permissions: [] as string[],
  });

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openNewDialog = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: '',
      permissions: [],
    });
    setDialogOpen(true);
  };

  const openEditDialog = (user: UserType) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      permissions: user.permissions,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const userData: UserType = {
      id: editingUser?.id || Date.now().toString(),
      name: formData.name,
      email: formData.email,
      role: formData.role as UserType['role'],
      permissions: formData.role === 'admin' ? ['all'] : formData.permissions,
      active: true,
      createdAt: editingUser?.createdAt || new Date(),
    };

    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? userData : u))
      );
    } else {
      setUsers((prev) => [...prev, userData]);
    }

    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir este usuário?')) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  };

  const togglePermission = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const getRoleLabel = (role: string) => {
    const found = roles.find((r) => r.id === role);
    return found?.label || role;
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-primary/10 text-primary';
      case 'manager':
        return 'bg-success/10 text-success';
      case 'seller':
        return 'bg-accent/10 text-accent';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const columns = [
    { key: 'name', header: 'Nome' },
    { key: 'email', header: 'E-mail', className: 'hidden sm:table-cell' },
    {
      key: 'role',
      header: 'Perfil',
      render: (user: UserType) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
          {getRoleLabel(user.role)}
        </span>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      className: 'hidden md:table-cell',
      render: (user: UserType) => (
        <span className={user.active ? 'badge-success' : 'badge-danger'}>
          {user.active ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (user: UserType) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(user);
            }}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(user.id);
            }}
            disabled={user.role === 'admin'}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Usuários e Permissões"
        description="Gerencie os usuários e controle de acesso ao sistema"
        actions={
          <Button onClick={openNewDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        }
      />

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filteredUsers}
        columns={columns}
        onRowClick={openEditDialog}
      />

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nome do usuário"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label>Perfil</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value as UserType['role'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Permissions */}
            {formData.role && formData.role !== 'admin' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <Label className="text-base font-semibold">Permissões</Label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {allPermissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={permission.id}
                        checked={formData.permissions.includes(permission.id)}
                        onCheckedChange={() => togglePermission(permission.id)}
                      />
                      <Label
                        htmlFor={permission.id}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {permission.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.role === 'admin' && (
              <div className="bg-primary/10 rounded-lg p-4 flex items-center gap-3">
                <Shield className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-medium text-primary">Acesso Total</p>
                  <p className="text-sm text-muted-foreground">
                    Administradores têm acesso a todas as funcionalidades do sistema.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
