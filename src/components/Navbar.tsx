'use client';

import React from 'react';
import {
  Home,
  Boxes,
  ShoppingCart,
  History,
  Settings,
  Plus,
  Flame,
  Coins,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { CurrencyCode, CURRENCY_CONFIG } from '@/lib/currency';
import { InventoryStats } from '@/types/inventory';

interface NavbarProps {
  activeTab: 'dashboard' | 'inventory' | 'pos' | 'sales' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'inventory' | 'pos' | 'sales' | 'settings') => void;
  stats: InventoryStats | null;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  onOpenAddModal: () => void;
  onOpenHelpModal?: () => void;
}

const TABS = [
  { id: 'dashboard' as const, label: 'Accueil', shortLabel: 'Accueil', icon: Home },
  { id: 'inventory' as const, label: 'Mon Stock', shortLabel: 'Stock', icon: Boxes },
  { id: 'sales' as const, label: 'Historique', shortLabel: 'Historique', icon: History },
];

export default function Navbar({
  activeTab,
  setActiveTab,
  stats,
  currency,
  setCurrency,
  onOpenAddModal,
  onOpenHelpModal,
}: NavbarProps) {
  const lowStockCount = stats ? stats.lowStockCount + stats.outOfStockCount : 0;

  return (
    <header className="sticky top-0 z-40 bg-[#0e1526]/95 backdrop-blur-md border-b border-[#202b44] text-slate-100 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 text-left group focus:outline-none"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg ring-2 ring-red-400/30 group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-wider text-base sm:text-lg uppercase text-white">
                  KickBox<span className="text-rose-500">Stock</span>
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  FACILE
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block font-medium">
                Ventes & Stock simplifié pour club de boxe
              </p>
            </div>
          </button>

          {/* Desktop Nav Tabs — Big, Readable & Clear */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#141d33] p-1.5 rounded-2xl border border-[#263452]">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-1 ring-rose-400/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.id === 'inventory' && lowStockCount > 0 && (
                    <span className="px-2 py-0.5 text-[11px] font-black rounded-full bg-amber-400 text-slate-950 shadow-sm animate-pulse">
                      {lowStockCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2.5">
            {/* Beginner Quick Guide button */}
            {onOpenHelpModal && (
              <button
                onClick={onOpenHelpModal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs transition-colors shadow-sm"
                title="Comment utiliser l'application ?"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="hidden lg:inline">Guide Facile</span>
              </button>
            )}

            {/* Currency Selector */}
            <div className="flex items-center gap-1.5 bg-[#141d33] border border-[#263452] px-3 py-2 rounded-xl text-xs font-bold text-slate-200 shadow-sm hover:border-slate-600 transition-colors">
              <Coins className="w-4 h-4 text-amber-400 hidden sm:block" />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="bg-transparent text-white font-extrabold outline-none cursor-pointer text-xs"
                title="Changer la devise"
              >
                {(Object.keys(CURRENCY_CONFIG) as CurrencyCode[]).map((c) => (
                  <option key={c} value={c} className="bg-[#111827] text-white">
                    {c} ({CURRENCY_CONFIG[c].symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Big Quick Add Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black shadow-lg shadow-red-600/30 transition-all active:scale-95 ring-1 ring-rose-500/40 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Nouveau Matériel</span>
              <span className="sm:hidden">Ajouter</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-between py-2 border-t border-[#1f2b42] text-xs font-bold overflow-x-auto gap-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-rose-600 text-white font-black shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <div className="relative">
                  <Icon className="w-4 h-4" />
                  {tab.id === 'inventory' && lowStockCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 w-3.5 h-3.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black flex items-center justify-center">
                      {lowStockCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px]">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
