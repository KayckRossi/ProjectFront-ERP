import { useState } from 'react';
import { Plus, Search, Check, AlertTriangle, ArrowUpCircle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Account } from '@/types';
import { contasPagarApi, fornecedoresApi, useColecao, useLista } from '@/api/recursos';

export default function ContasPagar() {
  const { data: allSuppliers = [] } = useLista(fornecedoresApi);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all');
  const [accounts, setAccounts] = useColecao(contasPagarApi);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    value: '',
    dueDate: '',
    supplierId: '',
  });

  const filteredAccounts = accounts.filter((a) => {
    const matchesSearch = a.description.toLowerCase().includes(search.toLowerCase());
    if (filter === 'pending') return matchesSearch && a.status === 'pending';
    if (filter === 'overdue') return matchesSearch && a.status === 'overdue';
    if (filter === 'paid') return matchesSearch && a.status === 'paid';
    return matchesSearch;
  });

  const totalPending = accounts
    .filter((a) => a.status !== 'paid')
    .reduce((acc, a) => acc + a.value, 0);
  const totalOverdue = accounts
    .filter((a) => a.status === 'overdue')
    .reduce((acc, a) => acc + a.value, 0);

  const openNewDialog = () => {
    setFormData({
      description: '',
      value: '',
      dueDate: '',
      supplierId: '',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const newAccount: Account = {
      id: Date.now().toString(),
      type: 'payable',
      description: formData.description,
      value: parseFloat(formData.value) || 0,
      dueDate: new Date(formData.dueDate),
      status: 'pending',
      supplierId: formData.supplierId,
      createdAt: new Date(),
    };

    setAccounts((prev) => [...prev, newAccount]);
    setDialogOpen(false);
  };

  const handleMarkPaid = (id: string) => {
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: 'paid' as const, paidDate: new Date() } : a
      )
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return 'badge-success';
      case 'overdue':
        return 'badge-danger';
      default:
        return 'badge-warning';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'overdue':
        return 'Vencido';
      default:
        return 'Pendente';
    }
  };

  const columns = [
    { key: 'description', header: 'Descrição' },
    {
      key: 'value',
      header: 'Valor',
      render: (account: Account) => (
        <span className="font-bold text-warning">R$ {account.value.toFixed(2)}</span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Vencimento',
      className: 'hidden sm:table-cell',
      render: (account: Account) =>
        new Date(account.dueDate).toLocaleDateString('pt-BR'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (account: Account) => (
        <span className={getStatusBadge(account.status)}>
          {getStatusLabel(account.status)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (account: Account) =>
        account.status !== 'paid' && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleMarkPaid(account.id);
            }}
          >
            <Check className="w-4 h-4 mr-1" />
            Pagar
          </Button>
        ),
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Contas a Pagar"
        description="Gerencie as contas a pagar para fornecedores"
        actions={
          <Button onClick={openNewDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Conta
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-warning/10">
              <ArrowUpCircle className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total a Pagar</p>
              <p className="text-2xl font-bold text-warning">
                R$ {totalPending.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-destructive/10">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Vencido</p>
              <p className="text-2xl font-bold text-destructive">
                R$ {totalOverdue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todos
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pendentes
          </Button>
          <Button
            variant={filter === 'overdue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('overdue')}
          >
            Vencidos
          </Button>
          <Button
            variant={filter === 'paid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('paid')}
          >
            Pagos
          </Button>
        </div>
      </div>

      {/* Table */}
      <DataTable data={filteredAccounts} columns={columns} />

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="w-5 h-5" />
              Nova Conta a Pagar
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrição da conta"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Valor (R$)</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Data de Vencimento</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Select
                value={formData.supplierId}
                onValueChange={(value) =>
                  setFormData({ ...formData, supplierId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {allSuppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
