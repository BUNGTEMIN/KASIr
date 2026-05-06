import React, { useState } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, Package, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePOS } from '../hooks/usePOS';
import { formatCurrency } from '../lib/utils';
import { cn } from '../lib/utils';

export default function PosView() {
  const { 
    products, 
    cart, 
    addToCart, 
    updateQuantity, 
    removeFromCart, 
    totalAmount, 
    checkout,
    isProcessing,
    loading 
  } = usePOS();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterCategory === 'All' || p.category === filterCategory)
  );

  const categories = ['All', ...new Set(products.map(p => p.category))];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      {/* Product Catalog */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari produk..."
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border",
                  filterCategory === cat 
                    ? "bg-white/20 border-white/30 text-white shadow-lg" 
                    : "bg-white/5 text-slate-400 border-white/5 hover:border-white/20 hover:text-white"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white/5 rounded-2xl h-48 animate-pulse border border-white/10" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-8">
            {filteredProducts.map(product => (
              <motion.button
                key={product.id}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => product.stock > 0 && addToCart(product)}
                disabled={product.stock === 0}
                className={cn(
                  "bg-white/5 p-4 rounded-2xl border border-white/10 text-left flex flex-col gap-3 group transition-all backdrop-blur-md",
                  product.stock === 0 ? "opacity-60 cursor-not-allowed" : "hover:bg-white/10 hover:border-white/30 hover:shadow-2xl hover:shadow-emerald-500/10"
                )}
              >
                <div className="aspect-square bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl overflow-hidden relative">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <Package className="w-8 h-8" />
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                      <span className="text-white font-bold text-xs uppercase tracking-widest">Habis</span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white transition-colors line-clamp-1">{product.name}</h3>
                  <p className="text-slate-400 text-xs mb-2">{product.category}</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono font-bold text-emerald-400">{formatCurrency(product.price)}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Stok: {product.stock}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Cart Panel */}
      <div className="lg:col-span-1">
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 flex flex-col h-[calc(100vh-140px)] sticky top-8 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold flex items-center gap-2 tracking-tight">
              <ShoppingCart className="w-6 h-6 text-emerald-400" />
              Detail Pesanan
            </h2>
          </div>

          <div className="flex-1 overflow-auto p-6 space-y-6">
            <AnimatePresence initial={false}>
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <ShoppingCart className="w-10 h-10 opacity-20" />
                  </div>
                  <p className="text-sm font-medium">Keranjang masih kosong</p>
                </div>
              ) : (
                cart.map(item => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex gap-4 group"
                  >
                    <div className="w-14 h-14 bg-white/10 rounded-xl flex-shrink-0 flex items-center justify-center text-slate-400 overflow-hidden border border-white/10">
                      {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Package className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate text-white">{item.name}</h4>
                      <p className="text-xs text-emerald-400 font-mono">{formatCurrency(item.price)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-md transition-colors border border-white/5 text-slate-400 hover:text-white">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-bold text-xs text-white min-w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-md transition-colors border border-white/5 text-slate-400 hover:text-white">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <p className="font-mono font-bold text-sm text-white">{formatCurrency(item.price * item.quantity)}</p>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-400/50 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          <div className="p-6 bg-white/5 space-y-6 border-t border-white/10">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm font-medium">Subtotal</span>
                <span className="font-mono font-bold text-lg text-white">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-xl font-bold border-t border-white/10 pt-2">
                <span className="text-white tracking-tight">Total</span>
                <span className="text-emerald-400 font-mono">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <PaymentButton 
                icon={Banknote} 
                label="Tunai" 
                onClick={() => checkout('cash')} 
                disabled={cart.length === 0 || isProcessing}
                variant="glass"
              />
              <PaymentButton 
                icon={QrCode} 
                label="QRIS" 
                onClick={() => checkout('qris')} 
                disabled={cart.length === 0 || isProcessing}
                variant="glow"
              />
              <PaymentButton 
                icon={CreditCard} 
                label="Kartu" 
                onClick={() => checkout('card')} 
                disabled={cart.length === 0 || isProcessing}
                variant="glass"
              />
            </div>

            <button 
              disabled={cart.length === 0 || isProcessing}
              onClick={() => checkout('qris')}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-4 rounded-2xl shadow-xl shadow-emerald-500/10 transition-all uppercase tracking-widest text-xs"
            >
              {isProcessing ? 'Memproses...' : 'Konfirmasi Pembayaran'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentButton({ icon: Icon, label, onClick, disabled, variant = 'light' }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl transition-all border",
        variant === 'glow' 
          ? "bg-white/20 border-white/30 text-white ring-1 ring-emerald-500/50" 
          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white",
        disabled && "opacity-30 cursor-not-allowed grayscale"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}
