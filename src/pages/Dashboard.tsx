import {
  ShoppingCart,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { mockProducts, mockSales, mockAccountsReceivable, mockAccountsPayable } from '@/data/mockData';

export default function Dashboard() {
  const totalSales = mockSales.reduce((acc, sale) => acc + sale.total, 0);
  const lowStockProducts = mockProducts.filter((p) => p.stock <= p.minStock);
  const pendingReceivables = mockAccountsReceivable.filter((a) => a.status !== 'paid');
  const pendingPayables = mockAccountsPayable.filter((a) => a.status !== 'paid');

  const totalReceivables = pendingReceivables.reduce((acc, a) => acc + a.value, 0);
  const totalPayables = pendingPayables.reduce((acc, a) => acc + a.value, 0);

  return (
    <MainLayout>
      <PageHeader
        title="Dashboard"
        description="Visão geral do seu negócio"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Vendas Hoje"
          value={`R$ ${totalSales.toFixed(2)}`}
          icon={ShoppingCart}
          variant="primary"
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="Produtos Cadastrados"
          value={mockProducts.length}
          icon={Package}
          variant="success"
        />
        <StatCard
          title="A Receber"
          value={`R$ ${totalReceivables.toFixed(2)}`}
          icon={ArrowDownCircle}
          variant="accent"
        />
        <StatCard
          title="A Pagar"
          value={`R$ ${totalPayables.toFixed(2)}`}
          icon={ArrowUpCircle}
          variant="warning"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="p-4 border-b border-border/50 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <h2 className="font-semibold text-foreground">Produtos com Estoque Baixo</h2>
          </div>
          <div className="p-4">
            {lowStockProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Todos os produtos estão com estoque adequado
              </p>
            ) : (
              <ul className="space-y-3">
                {lowStockProducts.map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Código: {product.code}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-destructive font-bold">{product.stock} un</p>
                      <p className="text-xs text-muted-foreground">
                        Mín: {product.minStock}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="p-4 border-b border-border/50 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success" />
            <h2 className="font-semibold text-foreground">Últimas Vendas</h2>
          </div>
          <div className="p-4">
            {mockSales.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma venda registrada
              </p>
            ) : (
              <ul className="space-y-3">
                {mockSales.slice(0, 5).map((sale) => (
                  <li
                    key={sale.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">Venda #{sale.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {sale.paymentMethod}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-success font-bold">
                        R$ {sale.total.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sale.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Pending Receivables */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="p-4 border-b border-border/50 flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-accent" />
            <h2 className="font-semibold text-foreground">Contas a Receber</h2>
          </div>
          <div className="p-4">
            <ul className="space-y-3">
              {pendingReceivables.map((account) => (
                <li
                  key={account.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-foreground">{account.description}</p>
                    <p className="text-sm text-muted-foreground">
                      Venc: {new Date(account.dueDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-accent font-bold">
                      R$ {account.value.toFixed(2)}
                    </p>
                    <span
                      className={
                        account.status === 'overdue'
                          ? 'badge-danger'
                          : 'badge-warning'
                      }
                    >
                      {account.status === 'overdue' ? 'Vencido' : 'Pendente'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pending Payables */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="p-4 border-b border-border/50 flex items-center gap-2">
            <ArrowUpCircle className="w-5 h-5 text-warning" />
            <h2 className="font-semibold text-foreground">Contas a Pagar</h2>
          </div>
          <div className="p-4">
            <ul className="space-y-3">
              {pendingPayables.map((account) => (
                <li
                  key={account.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-foreground">{account.description}</p>
                    <p className="text-sm text-muted-foreground">
                      Venc: {new Date(account.dueDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-warning font-bold">
                      R$ {account.value.toFixed(2)}
                    </p>
                    <span className="badge-warning">Pendente</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
