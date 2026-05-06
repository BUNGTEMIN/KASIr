import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  query
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { Plus, Search, Edit2, Trash2, X, Save, Image as ImageIcon, Package } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function InventoryView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.price || editingProduct?.stock === undefined) return;

    try {
      const productData = {
        name: editingProduct.name,
        price: Number(editingProduct.price),
        stock: Number(editingProduct.stock),
        category: editingProduct.category || 'Lainnya',
        imageUrl: editingProduct.imageUrl || '',
        updatedAt: serverTimestamp(),
      };

      if (editingProduct.id) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus produk ini?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-3xl font-bold">Produk & Inventori</h2>
          <p className="text-[#9E9E9E]">Kelola item jualan dan stok Anda.</p>
        </div>
        <button 
          onClick={() => {
            setEditingProduct({ name: '', price: 0, stock: 0, category: '', imageUrl: '' });
            setIsModalOpen(true);
          }}
          className="bg-emerald-500 text-slate-900 px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 font-bold text-sm uppercase tracking-widest"
        >
          <Plus className="w-5 h-5" />
          Tambah Produk
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Cari berdasarkan nama atau kategori..." 
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-white placeholder:text-slate-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Produk</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Kategori</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Harga</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Stok</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Memuat data...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Tidak ada produk ditemukan.</td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/10">
                          {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Package className="w-6 h-6 text-slate-500" />}
                        </div>
                        <span className="font-bold text-white">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-white/10 rounded text-[9px] font-bold uppercase tracking-widest text-emerald-400 border border-white/5">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-emerald-400">{formatCurrency(product.price)}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "font-mono font-bold",
                        product.stock < 5 ? "text-red-400" : "text-white"
                      )}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingProduct(product);
                            setIsModalOpen(true);
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1e293b]/90 backdrop-blur-2xl rounded-[2.5rem] w-full max-w-xl relative overflow-hidden border border-white/10 shadow-2xl"
            >
              <form onSubmit={handleSave} className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold tracking-tight text-white">{editingProduct?.id ? 'Edit Produk' : 'Produk Baru'}</h3>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Nama Produk</label>
                      <input 
                        type="text" 
                        required
                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        value={editingProduct?.name || ''}
                        onChange={e => setEditingProduct(prev => ({ ...prev!, name: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Harga (IDR)</label>
                      <input 
                        type="number" 
                        required
                        className="w-full bg-white/5 border border-white/10 text-emerald-400 rounded-xl py-3 px-4 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        value={editingProduct?.price || ''}
                        onChange={e => setEditingProduct(prev => ({ ...prev!, price: Number(e.target.value) }))}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Stok Awal</label>
                      <input 
                        type="number" 
                        required
                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 px-4 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        value={editingProduct?.stock || 0}
                        onChange={e => setEditingProduct(prev => ({ ...prev!, stock: Number(e.target.value) }))}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Kategori</label>
                      <input 
                        type="text" 
                        required
                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        value={editingProduct?.category || ''}
                        onChange={e => setEditingProduct(prev => ({ ...prev!, category: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">URL Gambar</label>
                      <input 
                        type="text" 
                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        value={editingProduct?.imageUrl || ''}
                        onChange={e => setEditingProduct(prev => ({ ...prev!, imageUrl: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-white/5 text-slate-400 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-white/10 transition-colors border border-white/5"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-emerald-500 text-slate-900 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Simpan Produk
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
