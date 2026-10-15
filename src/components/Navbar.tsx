'use client';

import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  History,
  Plus,
  Flame,
  Coins,
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
}

const TABS = [
  { id: 'dashboard' as const, label: 'Tableau de Bord', shortLabel: 'Stats', icon: LayoutDashboard },
  { id: 'inventory' as const, label: 'Inventaire', shortLabel: 'Stock', icon: Boxes },
  { id: 'pos' as const, label: 'Caisse Rapide', shortLabel: 'Caisse', icon: ShoppingCart },
  { id: 'sales' as const, label: 'Ventes', shortLabel: 'Ventes', icon: History },
];

export default function Navbar({
  activeTab,
  setActiveTab,
  stats,
  currency,
  setCurrency,
  onOpenAddModal,
}: NavbarProps) {
  const lowStockCount = stats ? stats.lowStockCount + stats.outOfStockCount : 0;

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shadow-sm">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wide text-base uppercase text-white">
                  KickBox<span className="text-red-500">Stock</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Gestion des Équipements & Ventes
              </p>
            </div>
          </div>

          {/* Desktop Nav Tabs — Uniform, Clean & Professional */}
          <nav className="hidden md:flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-zinc-800 text-white shadow-sm font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.id === 'inventory' && lowStockCount > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-500 text-black">
                      {lowStockCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2.5">
            {/* Currency */}
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-300">
              <Coins className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="bg-transparent text-white font-bold outline-none cursor-pointer text-xs"
              >
                {(Object.keys(CURRENCY_CONFIG) as CurrencyCode[]).map((c) => (
                  <option key={c} value={c} className="bg-zinc-900 text-white">
                    {c} ({CURRENCY_CONFIG[c].symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Add Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Ajouter Matériel</span>
              <span className="sm:hidden">Ajouter</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-zinc-900 text-xs font-semibold overflow-x-auto gap-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  isActive ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
