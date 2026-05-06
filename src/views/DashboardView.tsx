import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  where,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Transaction, Product } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Users,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export default function DashboardView() {
  const [stats, setStats] = useState({
    totalSales: 0,
    orderCount: 0,
    itemSold: 0,
    lowStockCount: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    // Basic stats from products
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const products = snapshot.docs.map(doc => doc.data() as Product);
      const lowStock = products.filter(p => p.stock < 5).length;
      setStats(prev => ({ ...prev, lowStockCount: lowStock }));
    });

    // Transactions for sales analytics
    const today = startOfDay(new Date());
    const thirtyDaysAgo = subDays(today, 7); // Let's show last 7 days

    const q = query(
      collection(db, 'transactions'), 
      where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
      orderBy('createdAt', 'asc')
    );

    const unsubTransactions = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      
      const total = txs.reduce((sum, tx) => sum + tx.totalAmount, 0);
      const items = txs.reduce((sum, tx) => sum + tx.items.reduce((s, i) => s + i.quantity, 0), 0);
      
      setStats(prev => ({
        ...prev,
        totalSales: total,
        orderCount: txs.length,
        itemSold: items
      }));

      // Prepare chart data (group by day)
      const days: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const d = format(subDays(new Date(), i), 'dd MMM');
        days[d] = 0;
      }

      txs.forEach(tx => {
        if (tx.createdAt) {
          const d = format(tx.createdAt.toDate(), 'dd MMM');
          if (days[d] !== undefined) {
            days[d] += tx.totalAmount;
          }
        }
      });

      setChartData(Object.entries(days).map(([day, amount]) => ({ day, amount })).reverse());
      setRecentTransactions(txs.slice(-5).reverse());
    });

    return () => {
      unsubProducts();
      unsubTransactions();
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Ringkasan Bisnis</h2>
        <p className="text-[#9E9E9E]">Performa toko Anda dalam 7 hari terakhir.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={DollarSign} 
          label="Total Penjualan" 
          value={formatCurrency(stats.totalSales)} 
          trend="+12%" 
          positive
          color="emerald"
        />
        <StatCard 
          icon={ShoppingCart} 
          label="Total Transaksi" 
          value={stats.orderCount.toString()} 
          trend="+5%" 
          positive
          color="blue"
        />
        <StatCard 
          icon={Package} 
          label="Item Terjual" 
          value={stats.itemSold.toString()} 
          trend="+8%" 
          positive
          color="purple"
        />
        <StatCard 
          icon={TrendingDown} 
          label="Stok Rendah" 
          value={stats.lowStockCount.toString()} 
          trend="-2" 
          negative={stats.lowStockCount > 3}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg tracking-tight text-white">Statistik Penjualan</h3>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              IDR per Hari
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} 
                  tickFormatter={(val) => `Rp ${val / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#10b981' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  formatter={(val: number) => [formatCurrency(val), 'Penjualan']}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl">
          <h3 className="font-bold text-lg mb-6 tracking-tight text-white">Transaksi Terbaru</h3>
          <div className="space-y-4">
            {recentTransactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                    <ShoppingCart className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white truncate max-w-[120px]">
                      {tx.items.length} Item
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      {tx.createdAt ? format(tx.createdAt.toDate(), 'HH:mm') : '-'}
                    </p>
                  </div>
                </div>
                <p className="font-mono font-bold text-sm text-emerald-400">
                  {formatCurrency(tx.totalAmount)}
                </p>
              </div>
            ))}
            {recentTransactions.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <p className="text-sm">Belum ada transaksi</p>
              </div>
            )}
          </div>
          <button className="w-full mt-6 py-3 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:border-white/30 hover:text-white transition-all">
            Lihat Semua
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, positive, negative, color = 'black' }: any) {
  const colorMap = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    black: "bg-white/5 text-white border-white/10"
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center border",
          colorMap[color as keyof typeof colorMap] || colorMap.black
        )}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={cn(
          "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border",
          positive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : negative ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-white/5 text-slate-500 border-white/10"
        )}>
          {positive ? <ArrowUpRight className="w-3 h-3" /> : (negative ? <ArrowDownRight className="w-3 h-3" /> : null)}
          {trend}
        </div>
      </div>
      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
      <h4 className="text-2xl font-bold font-mono tracking-tighter text-white">{value}</h4>
    </div>
  );
}
