import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Truck } from 'lucide-react';
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
import { mockSuppliers } from '@/data/mockData';
import { Supplier } from '@/types';

export default function Fornecedores() {
  const [search, setSearch] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
  });

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.document.includes(search) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  const openNewDialog = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      document: '',
      contact: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      document: supplier.document,
      contact: supplier.contact,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      state: supplier.state,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const supplierData: Supplier = {
      id: editingSupplier?.id || Date.now().toString(),
      ...formData,
      active: true,
      createdAt: editingSupplier?.createdAt || new Date(),
    };

    if (editingSupplier) {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === editingSupplier.id ? supplierData : s))
      );
    } else {
      setSuppliers((prev) => [...prev, supplierData]);
    }

    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir este fornecedor?')) {
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const columns = [
    { key: 'name', header: 'Razão Social' },
    { key: 'document', header: 'CNPJ', className: 'hidden sm:table-cell' },
    { key: 'contact', header: 'Contato', className: 'hidden md:table-cell' },
    { key: 'phone', header: 'Telefone', className: 'hidden lg:table-cell' },
    { key: 'city', header: 'Cidade', className: 'hidden xl:table-cell' },
    {
      key: 'actions',
      header: 'Ações',
      render: (supplier: Supplier) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(supplier);
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
              handleDelete(supplier.id);
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
        title="Fornecedores"
        description="Gerencie o cadastro de fornecedores"
        actions={
          <Button onClick={openNewDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Fornecedor
          </Button>
        }
      />

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por razão social, CNPJ ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filteredSuppliers}
        columns={columns}
        onRowClick={openEditDialog}
      />

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Razão Social</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nome da empresa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document">CNPJ</Label>
              <Input
                id="document"
                value={formData.document}
                onChange={(e) =>
                  setFormData({ ...formData, document: e.target.value })
                }
                placeholder="00.000.000/0001-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Pessoa de Contato</Label>
              <Input
                id="contact"
                value={formData.contact}
                onChange={(e) =>
                  setFormData({ ...formData, contact: e.target.value })
                }
                placeholder="Nome do contato"
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
                placeholder="(00) 0000-0000"
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
                placeholder="email@empresa.com"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Rua, número, complemento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                placeholder="Cidade"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                placeholder="UF"
                maxLength={2}
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
