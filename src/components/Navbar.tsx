'use client';

import React from 'react';
import {
  Home,
  Boxes,
  History,
  Plus,
  Flame,
  Coins,
  HelpCircle,
  Lock,
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
  onLockSession?: () => void;
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
  onLockSession,
}: NavbarProps) {
  const lowStockCount = stats ? stats.lowStockCount + stats.outOfStockCount : 0;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 text-slate-800 shadow-md shadow-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 text-left group focus:outline-none"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 ring-2 ring-blue-500/20 group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-wider text-base sm:text-lg uppercase text-slate-900">
                  KickBox<span className="text-blue-600">Stock</span>
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block font-medium">
                Gestion des Équipements & Ventes
              </p>
            </div>
          </button>

          {/* Desktop Nav Tabs — Crisp White & Blue */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
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
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-xs transition-colors shadow-sm"
                title="Comment utiliser l'application ?"
              >
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span className="hidden lg:inline">Guide Facile</span>
              </button>
            )}

            {/* Currency Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 shadow-sm hover:border-slate-300 transition-colors">
              <Coins className="w-4 h-4 text-blue-600 hidden sm:block" />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="bg-transparent text-slate-900 font-extrabold outline-none cursor-pointer text-xs"
                title="Changer la devise"
              >
                {(Object.keys(CURRENCY_CONFIG) as CurrencyCode[]).map((c) => (
                  <option key={c} value={c} className="bg-white text-slate-900">
                    {c} ({CURRENCY_CONFIG[c].symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Lock Button */}
            {onLockSession && (
              <button
                onClick={onLockSession}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs transition-colors shadow-sm cursor-pointer"
                title="Verrouiller la session (code PIN)"
              >
                <Lock className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Verrouiller</span>
              </button>
            )}

            {/* Big Quick Add Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Nouveau Matériel</span>
              <span className="sm:hidden">Ajouter</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-between py-2 border-t border-slate-200 text-xs font-bold overflow-x-auto gap-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-black shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
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
