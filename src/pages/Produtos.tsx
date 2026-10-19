import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
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
import { mockProducts, categories, mockSuppliers } from '@/data/mockData';
import { Product } from '@/types';

export default function Produtos() {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    barcode: '',
    name: '',
    description: '',
    category: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    unit: 'UN',
    supplierId: '',
  });

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search)
  );

  const openNewDialog = () => {
    setEditingProduct(null);
    setFormData({
      code: '',
      barcode: '',
      name: '',
      description: '',
      category: '',
      price: '',
      cost: '',
      stock: '',
      minStock: '',
      unit: 'UN',
      supplierId: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      code: product.code,
      barcode: product.barcode,
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price.toString(),
      cost: product.cost.toString(),
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      unit: product.unit,
      supplierId: product.supplierId,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const productData: Product = {
      id: editingProduct?.id || Date.now().toString(),
      code: formData.code,
      barcode: formData.barcode,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      cost: parseFloat(formData.cost) || 0,
      stock: parseInt(formData.stock) || 0,
      minStock: parseInt(formData.minStock) || 0,
      unit: formData.unit,
      supplierId: formData.supplierId,
      active: true,
      createdAt: editingProduct?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? productData : p))
      );
    } else {
      setProducts((prev) => [...prev, productData]);
    }

    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir este produto?')) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const columns = [
    { key: 'code', header: 'Código' },
    { key: 'name', header: 'Nome' },
    { key: 'category', header: 'Categoria', className: 'hidden sm:table-cell' },
    {
      key: 'price',
      header: 'Preço',
      render: (product: Product) => `R$ ${product.price.toFixed(2)}`,
    },
    {
      key: 'stock',
      header: 'Estoque',
      render: (product: Product) => (
        <span
          className={
            product.stock <= product.minStock ? 'text-destructive font-bold' : ''
          }
        >
          {product.stock} {product.unit}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (product: Product) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(product);
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
              handleDelete(product.id);
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
        title="Produtos"
        description="Gerencie o cadastro de produtos"
        actions={
          <Button onClick={openNewDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        }
      />

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nome, código ou código de barras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filteredProducts}
        columns={columns}
        onRowClick={openEditDialog}
      />

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="Ex: BEB001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Código de Barras</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) =>
                  setFormData({ ...formData, barcode: e.target.value })
                }
                placeholder="Ex: 7891234567890"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nome do produto"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrição do produto"
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {mockSuppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Custo (R$)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) =>
                  setFormData({ ...formData, cost: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço de Venda (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Estoque Atual</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: e.target.value })
                }
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minStock">Estoque Mínimo</Label>
              <Input
                id="minStock"
                type="number"
                value={formData.minStock}
                onChange={(e) =>
                  setFormData({ ...formData, minStock: e.target.value })
                }
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) =>
                  setFormData({ ...formData, unit: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UN">Unidade</SelectItem>
                  <SelectItem value="KG">Quilograma</SelectItem>
                  <SelectItem value="L">Litro</SelectItem>
                  <SelectItem value="CX">Caixa</SelectItem>
                  <SelectItem value="PCT">Pacote</SelectItem>
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
