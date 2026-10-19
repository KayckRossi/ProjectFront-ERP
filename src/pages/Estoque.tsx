import { useState } from 'react';
import { Search, Package, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { mockProducts } from '@/data/mockData';
import { Product } from '@/types';
import { cn } from '@/lib/utils';

export default function Estoque() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'ok'>('all');
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [adjustDialog, setAdjustDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'remove'>('add');
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());

    if (filter === 'low') return matchesSearch && p.stock <= p.minStock;
    if (filter === 'ok') return matchesSearch && p.stock > p.minStock;
    return matchesSearch;
  });

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
  const totalValue = products.reduce((acc, p) => acc + p.stock * p.cost, 0);

  const openAdjustDialog = (product: Product) => {
    setSelectedProduct(product);
    setAdjustType('add');
    setAdjustQuantity('');
    setAdjustReason('');
    setAdjustDialog(true);
  };

  const handleAdjust = () => {
    if (!selectedProduct) return;

    const qty = parseInt(adjustQuantity) || 0;
    const newStock =
      adjustType === 'add'
        ? selectedProduct.stock + qty
        : Math.max(0, selectedProduct.stock - qty);

    setProducts((prev) =>
      prev.map((p) =>
        p.id === selectedProduct.id ? { ...p, stock: newStock } : p
      )
    );

    setAdjustDialog(false);
  };

  const columns = [
    { key: 'code', header: 'Código' },
    { key: 'name', header: 'Produto' },
    { key: 'category', header: 'Categoria', className: 'hidden sm:table-cell' },
    {
      key: 'stock',
      header: 'Estoque',
      render: (product: Product) => (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'font-bold',
              product.stock <= product.minStock
                ? 'text-destructive'
                : 'text-foreground'
            )}
          >
            {product.stock} {product.unit}
          </span>
          {product.stock <= product.minStock && (
            <AlertTriangle className="w-4 h-4 text-destructive" />
          )}
        </div>
      ),
    },
    {
      key: 'minStock',
      header: 'Mínimo',
      className: 'hidden md:table-cell',
      render: (product: Product) => `${product.minStock} ${product.unit}`,
    },
    {
      key: 'value',
      header: 'Valor em Estoque',
      className: 'hidden lg:table-cell',
      render: (product: Product) =>
        `R$ ${(product.stock * product.cost).toFixed(2)}`,
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (product: Product) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            openAdjustDialog(product);
          }}
        >
          Ajustar
        </Button>
      ),
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Controle de Estoque"
        description="Monitore e ajuste o estoque dos produtos"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Produtos</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-destructive/10">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estoque Baixo</p>
              <p className="text-2xl font-bold text-destructive">{lowStockCount}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-success/10">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-2xl font-bold">R$ {totalValue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nome ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            Todos
          </Button>
          <Button
            variant={filter === 'low' ? 'default' : 'outline'}
            onClick={() => setFilter('low')}
            className={filter === 'low' ? '' : 'text-destructive border-destructive/50'}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Estoque Baixo
          </Button>
          <Button
            variant={filter === 'ok' ? 'default' : 'outline'}
            onClick={() => setFilter('ok')}
          >
            Em Dia
          </Button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filteredProducts}
        columns={columns}
        onRowClick={openAdjustDialog}
      />

      {/* Adjust Dialog */}
      <Dialog open={adjustDialog} onOpenChange={setAdjustDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Ajustar Estoque
            </DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="font-medium">{selectedProduct.name}</p>
                <p className="text-sm text-muted-foreground">
                  Código: {selectedProduct.code}
                </p>
                <p className="text-lg font-bold mt-2">
                  Estoque Atual: {selectedProduct.stock} {selectedProduct.unit}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Ajuste</Label>
                <div className="flex gap-2">
                  <Button
                    variant={adjustType === 'add' ? 'default' : 'outline'}
                    onClick={() => setAdjustType('add')}
                    className="flex-1"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Entrada
                  </Button>
                  <Button
                    variant={adjustType === 'remove' ? 'default' : 'outline'}
                    onClick={() => setAdjustType('remove')}
                    className="flex-1"
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Saída
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Motivo</Label>
                <Select value={adjustReason} onValueChange={setAdjustReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Compra</SelectItem>
                    <SelectItem value="return">Devolução</SelectItem>
                    <SelectItem value="loss">Perda/Avaria</SelectItem>
                    <SelectItem value="inventory">Inventário</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {adjustQuantity && (
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">Novo Estoque</p>
                  <p className="text-2xl font-bold text-primary">
                    {adjustType === 'add'
                      ? selectedProduct.stock + (parseInt(adjustQuantity) || 0)
                      : Math.max(
                          0,
                          selectedProduct.stock - (parseInt(adjustQuantity) || 0)
                        )}{' '}
                    {selectedProduct.unit}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdjust} disabled={!adjustQuantity}>
              Confirmar Ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
