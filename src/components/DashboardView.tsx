'use client';

import React, { useState } from 'react';
import {
  PackageCheck,
  AlertTriangle,
  Award,
  ArrowUpRight,
  ShieldAlert,
  PlusCircle,
  BarChart3,
  Layers,
  ShoppingBag,
  Clock,
  Sparkles,
  HelpCircle,
  TrendingUp,
  Boxes,
  Plus,
  Coins,
  ChevronDown,
  ChevronUp,
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
  onNavigateToSettings?: () => void;
  onOpenAddModal?: () => void;
  onOpenHelpModal?: () => void;
}

export default function DashboardView({
  stats,
  currency,
  onQuickRestock,
  onNavigateToInventory,
  onNavigateToPos,
  onNavigateToSales,
  onNavigateToSettings,
  onOpenAddModal,
  onOpenHelpModal,
}: DashboardViewProps) {
  const [showTips, setShowTips] = useState(true);

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-200">Chargement de votre stock...</p>
        </div>
      </div>
    );
  }

  const profitMarginPercent =
    stats.totalSalesRevenue > 0
      ? Math.round((stats.totalProfitEarned / stats.totalSalesRevenue) * 100)
      : 0;
  const maxSold = stats.topSoldItems.length > 0 ? stats.topSoldItems[0].unitsSold : 1;
  const totalAlerts = stats.lowStockCount + stats.outOfStockCount;

  return (
    <div className="space-y-6 animate-fadeIn text-[#f8fafc]">
      {/* 1. TOP FRIENDLY ACTION HUB: 3 BIG BUTTONS */}
      <div className="rounded-3xl bg-gradient-to-b from-[#151f38] to-[#101828] border border-[#243555] p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Bonjour & Bienvenue 👋
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                Prêt à l'emploi
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Que souhaitez-vous faire maintenant ? Cliquez sur une action ci-dessous :
            </p>
          </div>

          {onOpenHelpModal && (
            <button
              onClick={onOpenHelpModal}
              className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs transition-colors"
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>Comment ça marche ?</span>
            </button>
          )}
        </div>

        {/* 3 HUGE CLICKABLE ACTION TILES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Action 1: Vendre */}
          <button
            onClick={onNavigateToPos}
            className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-[#0e1628] border-2 border-emerald-500/50 hover:border-emerald-400 hover:scale-[1.02] text-left transition-all shadow-lg group active:scale-95"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/40 group-hover:bg-emerald-500">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                1 clic
              </span>
            </div>
            <h3 className="text-base font-black text-white group-hover:text-emerald-300 transition-colors">
              🛒 Vendre un Article
            </h3>
            <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">
              Encaisser un élève (gants, protège-tibias, bandes). Le stock diminue tout seul.
            </p>
          </button>

          {/* Action 2: Voir le Stock */}
          <button
            onClick={onNavigateToInventory}
            className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/60 to-[#0e1628] border-2 border-blue-500/50 hover:border-blue-400 hover:scale-[1.02] text-left transition-all shadow-lg group active:scale-95"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/40 group-hover:bg-blue-500">
                <Boxes className="w-6 h-6" />
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40">
                {stats.totalItemsCount} pièces
              </span>
            </div>
            <h3 className="text-base font-black text-white group-hover:text-blue-300 transition-colors">
              📦 Consulter le Stock
            </h3>
            <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">
              Voir la liste de tout le matériel disponible par taille, marque et couleur.
            </p>
          </button>

          {/* Action 3: Ajouter Matériel */}
          <button
            onClick={onOpenAddModal}
            className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/60 to-[#0e1628] border-2 border-rose-500/50 hover:border-rose-400 hover:scale-[1.02] text-left transition-all shadow-lg group active:scale-95"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-600/40 group-hover:from-red-500 group-hover:to-rose-500">
                <Plus className="w-6 h-6 stroke-[3]" />
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Nouveau
              </span>
            </div>
            <h3 className="text-base font-black text-white group-hover:text-rose-300 transition-colors">
              ➕ Ajouter du Matériel
            </h3>
            <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">
              Enregistrer une nouvelle livraison ou un nouvel équipement dans votre club.
            </p>
          </button>
        </div>

        {/* Collapsible beginner tip */}
        <div className="mt-4 pt-3.5 border-t border-[#1e2c47]">
          <button
            onClick={() => setShowTips(!showTips)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-400 hover:text-slate-200"
          >
            <span className="flex items-center gap-1.5 text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Astuce rapide : comment fonctionne votre stock ?</span>
            </span>
            {showTips ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showTips && (
            <div className="mt-2.5 p-3 rounded-xl bg-[#0d1424] border border-[#1e2c47] text-xs text-slate-300 space-y-1.5 leading-relaxed">
              <p>
                • <strong>Vert 🟢</strong> = Tout va bien, vous avez du stock en rayon.
              </p>
              <p>
                • <strong>Jaune 🟡</strong> = Attention, il ne reste que quelques pièces. Pensez à réapprovisionner.
              </p>
              <p>
                • <strong>Rouge 🔴</strong> = Rupture complète (0 pièce restante).
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. SIMPLE, HIGH-CONTRAST STATS (NO JARGON) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock */}
        <div className="rounded-2xl bg-[#131c31] border border-[#22314e] p-5 shadow-md hover:border-slate-600 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">
              Total en Stock
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-white">{stats.totalItemsCount}</span>
            <span className="text-xs text-slate-300 font-bold">pièces au club</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Réparties sur <span className="text-white font-bold">{stats.uniqueProductsCount}</span> articles différents
          </p>
        </div>

        {/* Revenue */}
        <div className="rounded-2xl bg-[#131c31] border border-[#22314e] p-5 shadow-md hover:border-emerald-600 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">
              Total des Ventes
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400">
            {formatCurrency(stats.totalSalesRevenue, currency)}
          </div>
          <div className="text-xs text-slate-300 mt-2 flex items-center justify-between font-medium">
            <span>
              Bénéfice net :{' '}
              <strong className="text-emerald-300 font-black">
                +{formatCurrency(stats.totalProfitEarned, currency)}
              </strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/40">
              {profitMarginPercent}% marge
            </span>
          </div>
        </div>

        {/* Total Stock Value */}
        <div className="rounded-2xl bg-[#131c31] border border-[#22314e] p-5 shadow-md hover:border-slate-600 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">
              Valeur du Matériel
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {formatCurrency(stats.totalInventoryValue, currency)}
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Prix total de tout le matériel s’il est vendu au club
          </p>
        </div>

        {/* Stock Alerts */}
        <div
          className={`rounded-2xl p-5 border shadow-md transition-colors ${
            totalAlerts > 0
              ? 'bg-[#18192a] border-amber-500/60'
              : 'bg-[#131c31] border-[#22314e]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-amber-300">
              Alertes de Stock
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-3xl font-black ${totalAlerts > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {totalAlerts}
            </span>
            <span className="text-xs text-slate-300 font-bold">
              {totalAlerts === 0 ? 'Tout est plein' : 'article(s) à recommander'}
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-2 font-medium">
            {stats.outOfStockCount > 0 ? (
              <span className="text-rose-400 font-black">
                ⚠️ {stats.outOfStockCount} en rupture totale (0 pc)
              </span>
            ) : (
              <span className="text-emerald-400 font-bold">✓ Aucune rupture totale</span>
            )}
          </p>
        </div>
      </div>

      {/* 3. URGENT RESTOCK BAR (IF ARTICLES ARE LOW) */}
      {stats.lowStockItems.length > 0 && (
        <div className="rounded-3xl bg-[#141b2e] border-2 border-amber-500/50 p-5 shadow-xl">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold shadow-sm">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>Articles à Réapprovisionner ({stats.lowStockItems.length})</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">
                    Action requise
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Cliquez directement sur <strong className="text-emerald-400 font-bold">"+5 pcs"</strong> pour ajouter 5 pièces sans ouvrir de formulaire.
                </p>
              </div>
            </div>
            <button
              onClick={onNavigateToInventory}
              className="text-xs font-black text-slate-200 hover:text-white px-3.5 py-2 rounded-xl bg-[#1e2c47] hover:bg-[#283b5e] border border-[#2e4166] transition-colors"
            >
              Voir tout dans le Stock →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.lowStockItems.slice(0, 6).map((item) => {
              const currentStock = item.stock ?? 0;
              const isZero = currentStock === 0;

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-[#0e1628] border border-[#1e2c47] flex items-center justify-between gap-3 shadow-sm hover:border-amber-500/40 transition-colors"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-white truncate">{item.name}</h4>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {item.brand} {item.model ? `· ${item.model}` : ''}
                    </p>
                    <div className="mt-1">
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-md ${
                          isZero
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {isZero ? '🔴 0 pc restante' : `🟡 Reste ${currentStock} pcs`}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onQuickRestock(item.id, 5)}
                    className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-transform active:scale-95 shadow-md shadow-emerald-600/20 whitespace-nowrap"
                    title="Ajouter 5 pièces directement"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+5 pcs</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. MAIN GRID: TOP SOLD LEADERBOARD & CATEGORY OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Most Sold Items (7 Cols) */}
        <div className="lg:col-span-7 bg-[#131c31] border border-[#22314e] rounded-3xl p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">🏆 Les Articles les Plus Demandés</h3>
                <p className="text-xs text-slate-300">Ce que vos élèves achètent le plus souvent</p>
              </div>
            </div>
            <button
              onClick={onNavigateToSales}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-bold transition-colors"
            >
              Historique complet <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats.topSoldItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center">
              <span className="w-12 h-12 rounded-2xl bg-[#0e1628] border border-[#22314e] flex items-center justify-center text-slate-400 mb-3">
                <ShoppingBag className="w-6 h-6" />
              </span>
              <p className="text-sm font-bold text-slate-200">Aucune vente enregistrée pour le moment</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Dès que vous vendrez une paire de gants ou des bandes, le classement et vos gains nets apparaîtront ici automatiquement !
              </p>
              <button
                onClick={onNavigateToPos}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
              >
                Faire ma première vente maintenant
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.topSoldItems.map((item, idx) => {
                const ratio = Math.round((item.unitsSold / maxSold) * 100);

                return (
                  <div
                    key={item.equipmentId}
                    className="p-3.5 rounded-2xl bg-[#0e1628] border border-[#1e2c47] hover:border-[#2e4166] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-[#1e2c47] text-white border border-[#2e4166] flex items-center justify-center text-xs font-black">
                          #{idx + 1}
                        </span>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white">{item.name}</h4>
                          <div className="text-xs text-slate-400 mt-0.5">
                            <span className="font-bold text-slate-300">{item.brand}</span>
                            <span> · </span>
                            <span>{CATEGORY_CONFIG[item.category]?.badge || item.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black text-emerald-400">
                          {formatCurrency(item.totalRevenue, currency)}
                        </div>
                        <div className="text-xs text-slate-300 font-medium">
                          <strong className="text-white font-bold">{item.unitsSold}</strong> vendus ·{' '}
                          <span className="text-emerald-400 font-bold">
                            +{formatCurrency(item.profitEarned, currency)} bénéfice
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-[#1e2c47] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(10, ratio)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Category Breakdown (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-[#131c31] border border-[#22314e] rounded-3xl p-5 sm:p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#1e2c47] border border-[#2e4166] flex items-center justify-center text-slate-200">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">📦 Votre Matériel par Famille</h3>
                <p className="text-xs text-slate-300">Quantités disponibles au club</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {stats.categoryDistribution.map((cat) => (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">{cat.label}</span>
                    <div className="flex items-center gap-2 text-slate-300 text-xs">
                      <span className="font-bold text-white">{cat.unitsInStock} pcs</span>
                      <span className="text-slate-400">({cat.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-[#0e1628] rounded-full h-2.5 overflow-hidden border border-[#1e2c47]">
                    <div
                      className="bg-gradient-to-r from-red-600 to-rose-500 h-2.5 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick link to settings */}
          <div className="bg-[#131c31] border border-[#22314e] rounded-3xl p-4 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white">Sauvegardes & Paramètres</h4>
              <p className="text-xs text-slate-400">Exportez votre stock ou réinitialisez la base de données.</p>
            </div>
            {onNavigateToSettings && (
              <button
                onClick={onNavigateToSettings}
                className="text-xs px-3.5 py-2 rounded-xl bg-[#1e2c47] hover:bg-[#283b5e] text-slate-200 hover:text-white font-bold border border-[#2e4166] transition-colors whitespace-nowrap shadow-sm"
              >
                Réglages ⚙️
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. RECENT SALES ACTIVITY */}
      <div className="bg-[#131c31] border border-[#22314e] rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-slate-400" />
            <h3 className="text-sm sm:text-base font-black text-white">
              Dernières Ventes Enregistrées au Club
            </h3>
          </div>
          <button
            onClick={onNavigateToSales}
            className="text-xs font-bold text-slate-300 hover:text-white"
          >
            Voir tout l'historique →
          </button>
        </div>

        {stats.recentSales.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4">Aucune vente enregistrée pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.recentSales.slice(0, 4).map((sale) => (
              <div
                key={sale.id}
                className="p-3.5 rounded-2xl bg-[#0e1628] border border-[#1e2c47] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span>
                      {new Date(sale.date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                    <span className="capitalize px-2 py-0.5 rounded-md bg-[#1e2c47] text-slate-200 text-xs font-bold border border-[#2e4166]">
                      {sale.paymentMethod}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-1">{sale.equipmentName}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Quantité : <strong className="text-white">{sale.quantity}x</strong> · {sale.buyerName || 'Client'}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#1e2c47] flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-400 text-sm font-black">
                    +{formatCurrency(sale.totalPrice, currency)}
                  </span>
                  <span className="text-emerald-300 font-bold">
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
