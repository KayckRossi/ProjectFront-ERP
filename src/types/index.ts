export interface Product {
  id: string;
  code: string;
  barcode: string;
  name: string;
  description: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  supplierId: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  notes: string;
  active: boolean;
  createdAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  document: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  active: boolean;
  createdAt: Date;
}

export interface Seller {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  commissionRate: number;
  active: boolean;
  createdAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  items: CartItem[];
  customerId?: string;
  sellerId?: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface Account {
  id: string;
  type: 'receivable' | 'payable';
  description: string;
  value: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'pending' | 'paid' | 'overdue';
  customerId?: string;
  supplierId?: string;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'seller' | 'cashier';
  permissions: string[];
  active: boolean;
  createdAt: Date;
}
