import { useState, useRef } from 'react';
import { Barcode, Printer, Search, Package } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { mockProducts } from '@/data/mockData';
import { Product } from '@/types';
import { cn } from '@/lib/utils';

export default function CodigosBarras() {
  const [search, setSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const filteredProducts = mockProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search)
  );

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
    if (!quantities[productId]) {
      setQuantities((prev) => ({ ...prev, [productId]: 1 }));
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(1, quantity) }));
  };

  const selectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p) => p.id));
      const newQuantities: Record<string, number> = {};
      filteredProducts.forEach((p) => {
        newQuantities[p.id] = quantities[p.id] || 1;
      });
      setQuantities((prev) => ({ ...prev, ...newQuantities }));
    }
  };

  const handlePrint = () => {
    const printContent = selectedProducts
      .map((id) => {
        const product = mockProducts.find((p) => p.id === id);
        if (!product) return '';
        const qty = quantities[id] || 1;
        return Array(qty)
          .fill(null)
          .map(
            () => `
          <div style="display: inline-block; width: 200px; padding: 10px; margin: 5px; border: 1px solid #ccc; text-align: center;">
            <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">${product.name}</div>
            <div style="font-family: 'Libre Barcode 128', cursive; font-size: 48px; line-height: 1;">
              ${product.barcode}
            </div>
            <div style="font-size: 12px;">${product.barcode}</div>
            <div style="font-size: 16px; font-weight: bold; margin-top: 5px;">R$ ${product.price.toFixed(2)}</div>
          </div>
        `
          )
          .join('');
      })
      .join('');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Etiquetas de Código de Barras</title>
            <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+128&display=swap" rel="stylesheet">
            <style>
              body { font-family: Arial, sans-serif; }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const selectedCount = selectedProducts.length;
  const totalLabels = selectedProducts.reduce(
    (acc, id) => acc + (quantities[id] || 1),
    0
  );

  return (
    <MainLayout>
      <PageHeader
        title="Impressão de Códigos de Barras"
        description="Selecione os produtos e quantidade de etiquetas"
        actions={
          <Button onClick={handlePrint} disabled={selectedProducts.length === 0}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir ({totalLabels} etiquetas)
          </Button>
        }
      />

      {/* Search and Select All */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nome, código ou código de barras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button variant="outline" onClick={selectAll}>
          {selectedProducts.length === filteredProducts.length
            ? 'Desmarcar Todos'
            : 'Selecionar Todos'}
        </Button>
      </div>

      {/* Summary */}
      {selectedCount > 0 && (
        <div className="bg-primary/10 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5 text-primary" />
            <span className="font-medium">
              {selectedCount} produto(s) selecionado(s)
            </span>
          </div>
          <span className="text-primary font-bold">{totalLabels} etiquetas</span>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((product) => {
          const isSelected = selectedProducts.includes(product.id);
          return (
            <div
              key={product.id}
              className={cn(
                'bg-card rounded-xl border-2 p-4 transition-all cursor-pointer',
                isSelected
                  ? 'border-primary shadow-lg'
                  : 'border-border/50 hover:border-primary/30'
              )}
              onClick={() => toggleProduct(product.id)}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleProduct(product.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {product.code}
                    </span>
                  </div>
                  <h3 className="font-medium text-foreground line-clamp-2 mb-2">
                    {product.name}
                  </h3>
                  <div className="bg-muted rounded p-2 text-center mb-2">
                    <p className="text-xs text-muted-foreground">Código de Barras</p>
                    <p className="font-mono text-sm">{product.barcode}</p>
                  </div>
                  <p className="text-lg font-bold text-primary">
                    R$ {product.price.toFixed(2)}
                  </p>

                  {isSelected && (
                    <div className="mt-3 flex items-center gap-2">
                      <Label className="text-sm">Qtd:</Label>
                      <Input
                        type="number"
                        min="1"
                        value={quantities[product.id] || 1}
                        onChange={(e) =>
                          updateQuantity(product.id, parseInt(e.target.value) || 1)
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="w-20 h-8"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Barcode className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum produto encontrado</p>
        </div>
      )}
    </MainLayout>
  );
}
