import { useState } from 'react';
import { Receipt, Printer, Eye, Search } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sale } from '@/types';
import { clientesApi, useLista, vendasApi } from '@/api/recursos';

export default function Recibos() {
  const { data: allSales = [] } = useLista(vendasApi);
  const { data: allCustomers = [] } = useLista(clientesApi);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [receiptDialog, setReceiptDialog] = useState(false);

  const sales = allSales.filter((s) => s.status === 'completed');

  const filteredSales = sales.filter((s) =>
    s.id.includes(search) || s.paymentMethod.toLowerCase().includes(search.toLowerCase())
  );

  const getCustomerName = (customerId?: string) => {
    if (!customerId) return 'Cliente não identificado';
    const customer = allCustomers.find((c) => c.id === customerId);
    return customer?.name || 'Cliente não encontrado';
  };

  const openReceipt = (sale: Sale) => {
    setSelectedSale(sale);
    setReceiptDialog(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const columns = [
    { key: 'id', header: 'Nº Venda' },
    {
      key: 'customer',
      header: 'Cliente',
      className: 'hidden sm:table-cell',
      render: (sale: Sale) => getCustomerName(sale.customerId),
    },
    {
      key: 'total',
      header: 'Total',
      render: (sale: Sale) => (
        <span className="font-bold text-success">R$ {sale.total.toFixed(2)}</span>
      ),
    },
    { key: 'paymentMethod', header: 'Pagamento', className: 'hidden md:table-cell' },
    {
      key: 'createdAt',
      header: 'Data',
      className: 'hidden lg:table-cell',
      render: (sale: Sale) =>
        new Date(sale.createdAt).toLocaleDateString('pt-BR'),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (sale: Sale) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openReceipt(sale);
            }}
          >
            <Eye className="w-4 h-4 mr-1" />
            Ver
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Recibos Não Fiscais"
        description="Visualize e imprima recibos das vendas"
      />

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por número da venda..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filteredSales}
        columns={columns}
        onRowClick={openReceipt}
        emptyMessage="Nenhuma venda encontrada"
      />

      {/* Receipt Dialog */}
      <Dialog open={receiptDialog} onOpenChange={setReceiptDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Recibo Não Fiscal
            </DialogTitle>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-4" id="receipt-content">
              {/* Receipt Header */}
              <div className="text-center border-b border-dashed border-border pb-4">
                <h2 className="text-xl font-bold">nexo365</h2>
                <p className="text-sm text-muted-foreground">
                  Nuvex Tecnologia
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(selectedSale.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>

              {/* Customer */}
              <div className="border-b border-dashed border-border pb-4">
                <p className="text-sm">
                  <span className="text-muted-foreground">Cliente: </span>
                  <span className="font-medium">
                    {getCustomerName(selectedSale.customerId)}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Venda Nº: </span>
                  <span className="font-medium">{selectedSale.id}</span>
                </p>
              </div>

              {/* Items */}
              <div className="border-b border-dashed border-border pb-4">
                <p className="text-sm text-muted-foreground mb-2">Itens:</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Produtos diversos</span>
                    <span>R$ {selectedSale.subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>R$ {selectedSale.subtotal.toFixed(2)}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Desconto:</span>
                    <span className="text-destructive">
                      - R$ {selectedSale.discount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                  <span>TOTAL:</span>
                  <span className="text-primary">
                    R$ {selectedSale.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Forma de Pagamento:</span>
                  <span>{selectedSale.paymentMethod}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-4 border-t border-dashed border-border">
                <p className="text-xs text-muted-foreground">
                  Este documento não possui valor fiscal
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Obrigado pela preferência!
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setReceiptDialog(false)}>
              Fechar
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
