export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
  createdAt: any;
  updatedAt: any;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: string;
  items: CartItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'qris' | 'card';
  status: 'paid' | 'refunded';
  userId: string;
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: 'admin' | 'cashier';
}
