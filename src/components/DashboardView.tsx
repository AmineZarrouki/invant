'use client';

import React from 'react';
import {
  TrendingUp,
  PackageCheck,
  AlertOctagon,
  DollarSign,
  Award,
  ArrowUpRight,
  ShieldAlert,
  PlusCircle,
  BarChart3,
  Layers,
  ShoppingBag,
  Clock,
} from 'lucide-react';
import { InventoryStats } from '@/types/inventory';
import { formatCurrency, CurrencyCode } from '@/lib/currency';
import { CATEGORY_CONFIG } from '@/lib/categoryColors';

interface DashboardViewProps {
  stats: InventoryStats | null;
  currency: CurrencyCode;
  onQuickRestock: (equipmentId: string, amount: number) => void;
  onNavigateToInventory: () => void;
  onNavigateToPos: () => void;
  onNavigateToSales: () => void;
}

export default function DashboardView({
  stats,
  currency,
  onQuickRestock,
  onNavigateToInventory,
  onNavigateToPos,
  onNavigateToSales,
}: DashboardViewProps) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-500 border-t-white rounded-full animate-spin"></div>
          <p className="text-xs font-medium">Chargement des données...</p>
        </div>
      </div>
    );
  }

  const profitMarginPercent = stats.totalSalesRevenue > 0
    ? Math.round((stats.totalProfitEarned / stats.totalSalesRevenue) * 100)
    : 0;
  const maxSold = stats.topSoldItems.length > 0 ? stats.topSoldItems[0].unitsSold : 1;

  return (
    <div className="space-y-6 animate-fadeIn text-zinc-100">
      {/* Top Banner */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Tableau de Bord & Performance
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Suivi des stocks kickboxing, analyse des marges nettes et des articles les plus vendus.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onNavigateToPos}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Enregistrer une Vente</span>
          </button>
          <button
            onClick={onNavigateToInventory}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-zinc-700 transition-colors"
          >
            <Layers className="w-4 h-4" />
            <span>Gérer l'Inventaire</span>
          </button>
        </div>
      </div>

      {/* KPI Cards — Clean, High-Contrast, Professional */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock */}
        <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total en Stock</span>
            <PackageCheck className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-white">{stats.totalItemsCount}</span>
            <span className="text-xs text-zinc-400 font-semibold">pièces</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            <span className="text-zinc-300 font-semibold">{stats.uniqueProductsCount}</span> références cataloguées
          </p>
        </div>

        {/* Revenue */}
        <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Chiffre d’Affaires</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">
            {formatCurrency(stats.totalSalesRevenue, currency)}
          </div>
          <div className="text-xs text-zinc-400 mt-2 flex items-center justify-between">
            <span>Bénéfice : <strong className="text-emerald-300 font-bold">+{formatCurrency(stats.totalProfitEarned, currency)}</strong></span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
              {profitMarginPercent}% marge
            </span>
          </div>
        </div>

        {/* Asset Value */}
        <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Valeur Marchande Stock</span>
            <TrendingUp className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {formatCurrency(stats.totalInventoryValue, currency)}
          </div>
          <p className="text-xs text-zinc-500 mt-2 flex items-center justify-between">
            <span>Coût : {formatCurrency(stats.totalInventoryCost, currency)}</span>
            <span className="text-zinc-300 font-medium">Gain pot. : +{formatCurrency(stats.totalPotentialProfit, currency)}</span>
          </p>
        </div>

        {/* Stock Alerts */}
        <div className={`rounded-2xl p-5 border ${
          stats.lowStockCount + stats.outOfStockCount > 0
            ? 'bg-zinc-900/90 border-amber-800/60'
            : 'bg-zinc-900/80 border-zinc-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Alertes Stock</span>
            <AlertOctagon className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-amber-400">
              {stats.lowStockCount + stats.outOfStockCount}
            </span>
            <span className="text-xs text-amber-300/80 font-semibold">à réapprovisionner</span>
          </div>
          <p className="text-xs text-zinc-400 mt-2">
            {stats.outOfStockCount > 0 ? (
              <span className="text-red-400 font-semibold">{stats.outOfStockCount} en rupture totale</span>
            ) : (
              <span>Aucune rupture complète</span>
            )}
          </p>
        </div>
      </div>

      {/* Main Grid: Most Sold Items & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Most Sold Items Leaderboard (7 Cols) */}
        <div className="lg:col-span-7 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Classement des Ventes (Most Sold)</h2>
                <p className="text-xs text-zinc-400">Articles les plus demandés avec revenus et bénéfices</p>
              </div>
            </div>
            <button
              onClick={onNavigateToSales}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-semibold transition-colors"
            >
              Historique complet <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats.topSoldItems.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 flex flex-col items-center justify-center">
              <span className="w-9 h-9 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-2.5">
                <Award className="w-4 h-4" />
              </span>
              <p className="text-xs font-bold text-zinc-300">0 vente enregistrée pour le moment</p>
              <p className="text-[11px] text-zinc-500 mt-1 max-w-sm">
                L’inventaire physique est prêt. Dès qu’une pièce est vendue, le classement des articles les plus demandés et les bénéfices s’afficheront ici en direct.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.topSoldItems.map((item, idx) => {
                const ratio = Math.round((item.unitsSold / maxSold) * 100);

                return (
                  <div
                    key={item.equipmentId}
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-white">{item.name}</h4>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            <span className="font-semibold text-zinc-300">{item.brand}</span>
                            <span> · </span>
                            <span className="text-zinc-400">{CATEGORY_CONFIG[item.category]?.badge || item.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-black text-emerald-400">
                          {formatCurrency(item.totalRevenue, currency)}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          <strong className="text-white">{item.unitsSold}</strong> vendus · <span className="text-emerald-500">+{formatCurrency(item.profitEarned, currency)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Clean Progress Bar */}
                    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-zinc-300 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(10, ratio)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Category & Brand Distribution (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Category Distribution */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Répartition par Catégorie</h3>
                <p className="text-xs text-zinc-400">Stock disponible et valorisation</p>
              </div>
            </div>

            <div className="space-y-3">
              {stats.categoryDistribution.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-300">{cat.label}</span>
                    <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
                      <span>{cat.unitsInStock} pcs ({cat.percentage}%)</span>
                      <span className="font-bold text-zinc-200">{formatCurrency(cat.totalValue, currency)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-zinc-400 h-1.5 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Brand Distribution */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Marques en Stock</h3>
              <span className="text-xs text-zinc-400">{stats.brandDistribution.length} marques</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {stats.brandDistribution.slice(0, 6).map((b) => (
                <div
                  key={b.brand}
                  className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col justify-between"
                >
                  <span className="text-xs font-bold text-zinc-200 truncate">{b.brand}</span>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-zinc-400">
                    <span className="text-white font-bold">{b.unitsInStock} pcs</span>
                    <span>{formatCurrency(b.totalValue, currency)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Urgent Feed */}
      {stats.lowStockItems.length > 0 && (
        <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Articles en Stock Critique ({stats.lowStockItems.length})
                </h3>
                <p className="text-xs text-zinc-400">
                  Cliquez sur "+5 pcs" pour réapprovisionner instantanément.
                </p>
              </div>
            </div>
            <button
              onClick={onNavigateToInventory}
              className="text-xs font-semibold text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 transition-colors"
            >
              Afficher dans l'inventaire
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.lowStockItems.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {item.size} · {item.color}
                  </div>
                  <div className="mt-1">
                    <span
                      className={`text-xs font-bold ${
                        item.stock === 0 ? 'text-red-400' : 'text-amber-400'
                      }`}
                    >
                      {item.stock === 0 ? 'Rupture (0 pc)' : `${item.stock} restant(s)`}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onQuickRestock(item.id, 5)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold transition-colors active:scale-95 whitespace-nowrap"
                  title="Ajouter 5 pièces immédiatement"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  +5 pcs
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sales Activity Footer */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Dernières Ventes Enregistrées</h3>
          </div>
          <button
            onClick={onNavigateToSales}
            className="text-xs text-zinc-400 hover:text-white font-semibold"
          >
            Voir tout
          </button>
        </div>

        {stats.recentSales.length === 0 ? (
          <p className="text-xs text-zinc-500 italic">Aucune transaction enregistrée.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.recentSales.slice(0, 4).map((sale) => (
              <div
                key={sale.id}
                className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                    <span>{new Date(sale.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                    <span className="capitalize px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 text-[10px]">
                      {sale.paymentMethod}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-zinc-100 line-clamp-1">{sale.equipmentName}</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {sale.quantity}x · {sale.buyerName || 'Client'}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-400">+{formatCurrency(sale.totalPrice, currency)}</span>
                  <span className="text-[10px] text-emerald-500 font-semibold">
                    Prof: +{formatCurrency(sale.profit, currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
