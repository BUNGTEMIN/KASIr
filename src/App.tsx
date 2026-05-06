/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthProvider';
import Shell from './components/layout/Shell';
import PosView from './views/PosView';
import InventoryView from './views/InventoryView';
import TransactionsView from './views/TransactionsView';
import DashboardView from './views/DashboardView';
import { Store, LogIn, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';

function AppContent() {
  const { user, profile, loading, login } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F5F5F5]">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }} 
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 bg-[#1A1A1A] rounded-xl flex items-center justify-center"
        >
          <Store className="text-white w-6 h-6" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#F5F5F5] p-4">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-black/5 border border-[#E5E5E5] text-center"
        >
          <div className="w-20 h-20 bg-[#1A1A1A] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-black/10">
            <Store className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-2">KassaPro</h1>
          <p className="text-[#9E9E9E] mb-10 font-medium">Sistem POS modern untuk bisnis Anda.</p>
          
          <button 
            onClick={login}
            className="w-full bg-[#1A1A1A] text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-black transition-all shadow-lg shadow-black/10 active:scale-[0.98]"
          >
            <LogIn className="w-5 h-5" />
            Masuk dengan Google
          </button>
          
          <div className="mt-10 grid grid-cols-3 gap-4 opacity-50 grayscale">
            <CreditCard className="w-6 h-6 mx-auto" />
            <Store className="w-6 h-6 mx-auto" />
            <LogIn className="w-6 h-6 mx-auto" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <Shell activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'pos' && <PosView />}
      {activeTab === 'inventory' && <InventoryView />}
      {activeTab === 'transactions' && <TransactionsView />}
    </Shell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
