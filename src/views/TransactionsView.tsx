import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  limit 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Transaction } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { History, Search, Filter, Mail, CreditCard, Banknote, QrCode } from 'lucide-react';

export default function TransactionsView() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(100));
    return onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
      setLoading(false);
    });
  }, []);

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return Banknote;
      case 'qris': return QrCode;
      case 'card': return CreditCard;
      default: return Banknote;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Riwayat Transaksi</h2>
        <p className="text-[#9E9E9E]">Pantau semua aktivitas penjualan Anda.</p>
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">ID & Tanggal</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Item</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Total</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Metode</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Memuat...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Belum ada transaksi.</td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-[9px] font-bold text-slate-500">#{tx.id.slice(0, 8)}</span>
                        <span className="text-sm font-medium text-white">
                          {tx.createdAt?.toDate ? format(tx.createdAt.toDate(), 'dd MMM yyyy, HH:mm', { locale: id }) : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-white">{tx.items.length} Item</span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[200px]">
                          {tx.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-400">{formatCurrency(tx.totalAmount)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {React.createElement(getPaymentIcon(tx.paymentMethod), { className: "w-4 h-4 text-slate-500" })}
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{tx.paymentMethod}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                        tx.status === 'paid' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                      )}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
