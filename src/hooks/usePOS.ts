import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  runTransaction
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { Product, CartItem, Transaction } from '../types';
import { useAuth } from '../components/AuthProvider';

export function usePOS() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'products'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(items);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const clearCart = () => setCart([]);

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const checkout = async (paymentMethod: 'cash' | 'qris' | 'card') => {
    if (!profile || cart.length === 0) return;
    setIsProcessing(true);

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Verify stock and prepare data
        for (const item of cart) {
          const productRef = doc(db, 'products', item.id);
          const productDoc = await transaction.get(productRef);
          
          if (!productDoc.exists()) {
            throw new Error(`Product ${item.name} not found`);
          }

          const currentStock = productDoc.data().stock;
          if (currentStock < item.quantity) {
            throw new Error(`Insufficient stock for ${item.name}`);
          }

          // 2. Decrement stock
          transaction.update(productRef, {
            stock: currentStock - item.quantity,
            updatedAt: serverTimestamp()
          });
        }

        // 3. Create transaction record
        const transactionRef = doc(collection(db, 'transactions'));
        transaction.set(transactionRef, {
          items: cart,
          totalAmount,
          paymentMethod,
          status: 'paid',
          userId: profile.uid,
          createdAt: serverTimestamp()
        });
      });

      clearCart();
      await fetchProducts(); // Refresh local stock
      return true;
    } catch (error) {
      console.error("Checkout failed:", error);
      alert(error instanceof Error ? error.message : "Checkout failed");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    products,
    cart,
    loading,
    isProcessing,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalAmount,
    checkout,
    fetchProducts
  };
}
