import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, UserCheck, Percent } from 'lucide-react';
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
import { mockSellers } from '@/data/mockData';
import { Seller } from '@/types';

export default function Vendedores() {
  const [search, setSearch] = useState('');
  const [sellers, setSellers] = useState<Seller[]>(mockSellers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    email: '',
    phone: '',
    commissionRate: '',
  });

  const filteredSellers = sellers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.document.includes(search) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  const openNewDialog = () => {
    setEditingSeller(null);
    setFormData({
      name: '',
      document: '',
      email: '',
      phone: '',
      commissionRate: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (seller: Seller) => {
    setEditingSeller(seller);
    setFormData({
      name: seller.name,
      document: seller.document,
      email: seller.email,
      phone: seller.phone,
      commissionRate: seller.commissionRate.toString(),
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const sellerData: Seller = {
      id: editingSeller?.id || Date.now().toString(),
      name: formData.name,
      document: formData.document,
      email: formData.email,
      phone: formData.phone,
      commissionRate: parseFloat(formData.commissionRate) || 0,
      active: true,
      createdAt: editingSeller?.createdAt || new Date(),
    };

    if (editingSeller) {
      setSellers((prev) =>
        prev.map((s) => (s.id === editingSeller.id ? sellerData : s))
      );
    } else {
      setSellers((prev) => [...prev, sellerData]);
    }

    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir este vendedor?')) {
      setSellers((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const columns = [
    { key: 'name', header: 'Nome' },
    { key: 'document', header: 'CPF', className: 'hidden sm:table-cell' },
    { key: 'phone', header: 'Telefone', className: 'hidden md:table-cell' },
    { key: 'email', header: 'E-mail', className: 'hidden lg:table-cell' },
    {
      key: 'commissionRate',
      header: 'Comissão',
      render: (seller: Seller) => (
        <span className="flex items-center gap-1 text-success font-medium">
          <Percent className="w-3 h-3" />
          {seller.commissionRate}%
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (seller: Seller) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(seller);
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
              handleDelete(seller.id);
            }}
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
        title="Vendedores"
        description="Gerencie o cadastro de vendedores e comissões"
        actions={
          <Button onClick={openNewDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Vendedor
          </Button>
        }
      />

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nome, CPF ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filteredSellers}
        columns={columns}
        onRowClick={openEditDialog}
      />

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              {editingSeller ? 'Editar Vendedor' : 'Novo Vendedor'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nome do vendedor"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document">CPF</Label>
              <Input
                id="document"
                value={formData.document}
                onChange={(e) =>
                  setFormData({ ...formData, document: e.target.value })
                }
                placeholder="000.000.000-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
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
              <Label htmlFor="commissionRate">Comissão (%)</Label>
              <Input
                id="commissionRate"
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={formData.commissionRate}
                onChange={(e) =>
                  setFormData({ ...formData, commissionRate: e.target.value })
                }
                placeholder="5.0"
              />
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
