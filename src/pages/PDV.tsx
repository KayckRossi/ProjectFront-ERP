import { useState } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  User,
  ShoppingCart,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockProducts, mockCustomers, paymentMethods } from '@/data/mockData';
import { Product, CartItem } from '@/types';
import { cn } from '@/lib/utils';
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

export default function PDV() {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('');
  const [discount, setDiscount] = useState(0);

  const filteredProducts = mockProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search)
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.product.price,
              }
            : item
        );
      }
      return [
        ...prev,
        { product, quantity: 1, discount: 0, subtotal: product.price },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? {
                ...item,
                quantity: Math.max(0, item.quantity + delta),
                subtotal: Math.max(0, item.quantity + delta) * item.product.price,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer('');
    setDiscount(0);
  };

  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const total = subtotal - discount;

  const handleFinishSale = () => {
    // Here would be the sale completion logic
    alert(`Venda finalizada!\nTotal: R$ ${total.toFixed(2)}\nPagamento: ${selectedPayment}`);
    setPaymentDialog(false);
    clearCart();
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'Dinheiro':
        return Banknote;
      case 'Cartão Débito':
      case 'Cartão Crédito':
        return CreditCard;
      case 'PIX':
        return Smartphone;
      default:
        return Receipt;
    }
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-4">
        {/* Products Section */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Buscar por nome, código ou código de barras..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="pdv-product-card text-left"
                >
                  <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="font-medium text-foreground text-sm line-clamp-2 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">{product.code}</p>
                  <p className="text-lg font-bold text-primary">
                    R$ {product.price.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Estoque: {product.stock}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <div className="w-full lg:w-96 bg-card rounded-xl border border-border/50 flex flex-col min-h-[400px] lg:min-h-0">
          {/* Cart Header */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Carrinho
              </h2>
              {cart.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-destructive hover:text-destructive"
                >
                  Limpar
                </Button>
              )}
            </div>

            {/* Customer Select */}
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger className="w-full">
                <User className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Selecionar cliente (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {mockCustomers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Carrinho vazio</p>
                </div>
              </div>
            ) : (
              <ul className="space-y-3">
                {cart.map((item) => (
                  <li key={item.product.id} className="pdv-cart-item">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        R$ {item.product.price.toFixed(2)} x {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Cart Footer */}
          <div className="p-4 border-t border-border/50 space-y-4">
            {/* Discount */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Desconto:</span>
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-24 h-8 text-right"
                min={0}
                max={subtotal}
              />
            </div>

            {/* Totals */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="text-foreground">R$ {subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Desconto:</span>
                  <span className="text-destructive">- R$ {discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-border/50">
                <span>Total:</span>
                <span className="text-primary">R$ {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Button */}
            <Button
              className="w-full h-12 text-lg"
              disabled={cart.length === 0}
              onClick={() => setPaymentDialog(true)}
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Finalizar Venda
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Forma de Pagamento</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {paymentMethods.map((method) => {
              const Icon = getPaymentIcon(method);
              return (
                <button
                  key={method}
                  onClick={() => setSelectedPayment(method)}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2',
                    selectedPayment === method
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{method}</span>
                </button>
              );
            })}
          </div>
          <div className="text-center py-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Total a pagar</p>
            <p className="text-3xl font-bold text-primary">R$ {total.toFixed(2)}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleFinishSale} disabled={!selectedPayment}>
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
