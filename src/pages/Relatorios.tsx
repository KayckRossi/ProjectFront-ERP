import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Calendar,
  Download,
  FileText,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockProducts, mockSales, mockCustomers } from '@/data/mockData';

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const reportTypes: ReportType[] = [
  {
    id: 'sales',
    name: 'Vendas por Período',
    description: 'Relatório detalhado de vendas realizadas',
    icon: TrendingUp,
    color: 'bg-success/10 text-success',
  },
  {
    id: 'products',
    name: 'Produtos Mais Vendidos',
    description: 'Ranking dos produtos com maior saída',
    icon: Package,
    color: 'bg-primary/10 text-primary',
  },
  {
    id: 'stock',
    name: 'Posição de Estoque',
    description: 'Situação atual do estoque de produtos',
    icon: Package,
    color: 'bg-warning/10 text-warning',
  },
  {
    id: 'customers',
    name: 'Clientes por Compras',
    description: 'Ranking de clientes por valor de compras',
    icon: Users,
    color: 'bg-accent/10 text-accent',
  },
  {
    id: 'financial',
    name: 'Resumo Financeiro',
    description: 'Receitas, despesas e lucro do período',
    icon: DollarSign,
    color: 'bg-chart-4/10 text-chart-4',
  },
  {
    id: 'commission',
    name: 'Comissões de Vendedores',
    description: 'Comissões a pagar por vendedor',
    icon: Users,
    color: 'bg-chart-5/10 text-chart-5',
  },
];

export default function Relatorios() {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerateReport = () => {
    setShowPreview(true);
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    alert(`Exportando relatório em formato ${format.toUpperCase()}...`);
  };

  const getReportPreview = () => {
    switch (selectedReport) {
      case 'sales':
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Vendas por Período</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Vendas</p>
                <p className="text-2xl font-bold text-success">
                  R$ {mockSales.reduce((acc, s) => acc + s.total, 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Qtd. Vendas</p>
                <p className="text-2xl font-bold">{mockSales.length}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">
                  R${' '}
                  {(
                    mockSales.reduce((acc, s) => acc + s.total, 0) /
                    mockSales.length
                  ).toFixed(2)}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Descontos</p>
                <p className="text-2xl font-bold text-destructive">
                  R$ {mockSales.reduce((acc, s) => acc + s.discount, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        );

      case 'products':
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Produtos Mais Vendidos</h3>
            <div className="space-y-2">
              {mockProducts.slice(0, 5).map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{Math.floor(Math.random() * 100) + 20} un</p>
                    <p className="text-sm text-success">
                      R$ {(product.price * (Math.random() * 100 + 20)).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'stock':
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Posição de Estoque</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Produtos</p>
                <p className="text-2xl font-bold">{mockProducts.length}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Valor em Estoque</p>
                <p className="text-2xl font-bold text-primary">
                  R${' '}
                  {mockProducts
                    .reduce((acc, p) => acc + p.stock * p.cost, 0)
                    .toFixed(2)}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {mockProducts.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Mínimo: {product.minStock} {product.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        product.stock <= product.minStock
                          ? 'text-destructive'
                          : 'text-success'
                      }`}
                    >
                      {product.stock} {product.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'customers':
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Clientes por Compras</h3>
            <div className="space-y-2">
              {mockCustomers.map((customer, index) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">{customer.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-success">
                      R$ {(Math.random() * 1000 + 100).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {Math.floor(Math.random() * 20) + 1} compras
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Selecione um tipo de relatório e clique em Gerar</p>
          </div>
        );
    }
  };

  return (
    <MainLayout>
      <PageHeader
        title="Relatórios Gerenciais"
        description="Gere relatórios detalhados para análise do negócio"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="form-section">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Tipo de Relatório
            </h2>
            <div className="space-y-2">
              {reportTypes.map((report) => (
                <button
                  key={report.id}
                  onClick={() => {
                    setSelectedReport(report.id);
                    setShowPreview(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedReport === report.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${report.color}`}>
                      <report.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{report.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="form-section">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Período
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleGenerateReport}
                disabled={!selectedReport}
              >
                Gerar Relatório
              </Button>
            </div>
          </div>
        </div>

        {/* Report Preview */}
        <div className="lg:col-span-2">
          <div className="form-section min-h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Visualização
              </h2>
              {showPreview && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('pdf')}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('excel')}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Excel
                  </Button>
                </div>
              )}
            </div>
            {showPreview ? getReportPreview() : (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Selecione um relatório e clique em Gerar</p>
                <p className="text-sm mt-2">
                  Os dados serão exibidos aqui para visualização
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
