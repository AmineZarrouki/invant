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
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-700">Chargement de votre stock...</p>
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
    <div className="space-y-6 animate-fadeIn text-slate-900">
      {/* 1. TOP FRIENDLY ACTION HUB: 3 BIG BUTTONS */}
      <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Bonjour & Bienvenue 👋
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-sm">
                Prêt à l'emploi
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Que souhaitez-vous faire maintenant ? Cliquez sur une action ci-dessous :
            </p>
          </div>

          {onOpenHelpModal && (
            <button
              onClick={onOpenHelpModal}
              className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Comment ça marche ?</span>
            </button>
          )}
        </div>

        {/* 3 HUGE CLICKABLE ACTION TILES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Action 1: Vendre */}
          <button
            onClick={onNavigateToPos}
            className="p-5 rounded-2xl bg-emerald-50/70 border-2 border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50 text-left transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 shadow-emerald-600/10 ring-1 ring-emerald-500/10 group active:scale-95 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 group-hover:bg-emerald-700 transition-colors">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
                1 clic
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-800 transition-colors">
              🛒 Vendre un Article
            </h3>
            <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
              Encaisser un élève (gants, protège-tibias, bandes). Le stock diminue tout seul.
            </p>
          </button>

          {/* Action 2: Voir le Stock */}
          <button
            onClick={onNavigateToInventory}
            className="p-5 rounded-2xl bg-blue-50/70 border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50 text-left transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 shadow-blue-600/10 ring-1 ring-blue-500/10 group active:scale-95 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30 group-hover:bg-blue-700 transition-colors">
                <Boxes className="w-6 h-6" />
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 border border-blue-200 shadow-sm">
                {stats.totalItemsCount} pièces
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900 group-hover:text-blue-800 transition-colors">
              📦 Consulter le Stock
            </h3>
            <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
              Voir la liste de tout le matériel disponible par taille, marque et couleur.
            </p>
          </button>

          {/* Action 3: Ajouter Matériel */}
          <button
            onClick={onOpenAddModal}
            className="p-5 rounded-2xl bg-indigo-50/70 border-2 border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50 text-left transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 shadow-indigo-600/10 ring-1 ring-indigo-500/10 group active:scale-95 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 group-hover:bg-indigo-700 transition-colors">
                <Plus className="w-6 h-6 stroke-[3]" />
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-sm">
                Nouveau
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-800 transition-colors">
              ➕ Ajouter du Matériel
            </h3>
            <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
              Enregistrer une nouvelle livraison ou un nouvel équipement dans votre club.
            </p>
          </button>
        </div>

        {/* Collapsible beginner tip */}
        <div className="mt-4 pt-3.5 border-t border-slate-100">
          <button
            onClick={() => setShowTips(!showTips)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <span className="flex items-center gap-1.5 text-blue-700">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Astuce rapide : comment fonctionne votre stock ?</span>
            </span>
            {showTips ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {showTips && (
            <div className="mt-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5 leading-relaxed shadow-sm">
              <p>
                • <strong className="text-emerald-700">Vert 🟢</strong> = Tout va bien, vous avez du stock disponible au club.
              </p>
              <p>
                • <strong className="text-amber-700">Jaune 🟡</strong> = Attention, il ne reste que quelques pièces. Pensez à réapprovisionner.
              </p>
              <p>
                • <strong className="text-rose-700">Rouge 🔴</strong> = Rupture complète (0 pièce restante).
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. SIMPLE, HIGH-CONTRAST STATS (WHITE & BLUE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5 hover:border-blue-300 hover:shadow-xl hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Total en Stock
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-sm">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-900">{stats.totalItemsCount}</span>
            <span className="text-xs text-slate-600 font-bold">pièces au club</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Réparties sur <span className="text-slate-900 font-bold">{stats.uniqueProductsCount}</span> articles différents
          </p>
        </div>

        {/* Revenue */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5 hover:border-emerald-300 hover:shadow-xl hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Total des Ventes
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-sm">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600">
            {formatCurrency(stats.totalSalesRevenue, currency)}
          </div>
          <div className="text-xs text-slate-600 mt-2 flex items-center justify-between font-medium">
            <span>
              Bénéfice net :{' '}
              <strong className="text-emerald-700 font-black">
                +{formatCurrency(stats.totalProfitEarned, currency)}
              </strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-xs font-black border border-emerald-200 shadow-sm">
              {profitMarginPercent}% marge
            </span>
          </div>
        </div>

        {/* Total Stock Value */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5 hover:border-indigo-300 hover:shadow-xl hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Valeur du Matériel
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {formatCurrency(stats.totalInventoryValue, currency)}
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Valeur totale de vente de tout le matériel réuni
          </p>
        </div>

        {/* Stock Alerts */}
        <div
          className={`rounded-2xl p-5 border shadow-md transition-all ${
            totalAlerts > 0
              ? 'bg-amber-50/70 border-amber-300 shadow-amber-200/50 ring-1 ring-amber-400/20 hover:shadow-xl hover:-translate-y-0.5'
              : 'bg-white border-slate-200 shadow-slate-200/80 ring-1 ring-slate-900/5 hover:shadow-xl hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-amber-800">
              Alertes de Stock
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-3xl font-black ${totalAlerts > 0 ? 'text-amber-700' : 'text-emerald-600'}`}>
              {totalAlerts}
            </span>
            <span className="text-xs text-slate-600 font-bold">
              {totalAlerts === 0 ? 'Tout est plein' : 'article(s) à recommander'}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-2 font-medium">
            {stats.outOfStockCount > 0 ? (
              <span className="text-rose-600 font-black">
                ⚠️ {stats.outOfStockCount} en rupture totale (0 pc)
              </span>
            ) : (
              <span className="text-emerald-700 font-bold">✓ Aucune rupture totale</span>
            )}
          </p>
        </div>
      </div>

      {/* 3. URGENT RESTOCK BAR (IF ARTICLES ARE LOW) */}
      {stats.lowStockItems.length > 0 && (
        <div className="rounded-3xl bg-amber-50/80 border-2 border-amber-200 p-5 shadow-md shadow-amber-200/50 ring-1 ring-amber-400/20">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center font-bold shadow-sm">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>Articles à Réapprovisionner ({stats.lowStockItems.length})</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-black shadow-sm">
                    Action requise
                  </span>
                </h3>
                <p className="text-xs text-slate-600">
                  Cliquez directement sur <strong className="text-emerald-700 font-bold">"+5 pcs"</strong> pour ajouter 5 pièces sans ouvrir de formulaire.
                </p>
              </div>
            </div>
            <button
              onClick={onNavigateToInventory}
              className="text-xs font-black text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 transition-colors shadow-sm cursor-pointer"
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
                  className="p-3.5 rounded-2xl bg-white border border-amber-200 flex items-center justify-between gap-3 shadow-md shadow-amber-100/50 hover:border-amber-400 hover:shadow-lg transition-all"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-900 truncate">{item.name}</h4>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {item.brand} {item.model ? `· ${item.model}` : ''}
                    </p>
                    <div className="mt-1">
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-md shadow-sm ${
                          isZero
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {isZero ? '🔴 0 pc restante' : `🟡 Reste ${currentStock} pcs`}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onQuickRestock(item.id, 5)}
                    className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-transform active:scale-95 shadow-md shadow-emerald-600/20 whitespace-nowrap cursor-pointer"
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
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold shadow-sm">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">🏆 Les Articles les Plus Demandés</h3>
                <p className="text-xs text-slate-500">Ce que vos élèves achètent le plus souvent</p>
              </div>
            </div>
            <button
              onClick={onNavigateToSales}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-bold transition-colors cursor-pointer"
            >
              Historique complet <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats.topSoldItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center">
              <span className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                <ShoppingBag className="w-6 h-6" />
              </span>
              <p className="text-sm font-bold text-slate-800">Aucune vente enregistrée pour le moment</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Dès que vous vendrez une paire de gants ou des bandes, le classement et vos gains nets apparaîtront ici automatiquement !
              </p>
              <button
                onClick={onNavigateToPos}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
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
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 hover:border-blue-300 shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-white text-slate-800 border border-slate-200 font-black flex items-center justify-center text-xs shadow-sm">
                          #{idx + 1}
                        </span>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">{item.name}</h4>
                          <div className="text-xs text-slate-500 mt-0.5">
                            <span className="font-bold text-slate-700">{item.brand}</span>
                            <span> · </span>
                            <span>{CATEGORY_CONFIG[item.category]?.badge || item.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black text-emerald-600">
                          {formatCurrency(item.totalRevenue, currency)}
                        </div>
                        <div className="text-xs text-slate-600 font-medium">
                          <strong className="text-slate-900 font-bold">{item.unitsSold}</strong> vendus ·{' '}
                          <span className="text-emerald-700 font-bold">
                            +{formatCurrency(item.profitEarned, currency)} net
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden shadow-inner">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
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
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold shadow-sm">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">📦 Votre Matériel par Famille</h3>
                <p className="text-xs text-slate-500">Quantités disponibles au club</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {stats.categoryDistribution.map((cat) => (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">{cat.label}</span>
                    <div className="flex items-center gap-2 text-slate-600 text-xs">
                      <span className="font-bold text-slate-900">{cat.unitsInStock} pcs</span>
                      <span className="text-slate-500">({cat.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200 shadow-inner">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick link to settings */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4 flex items-center justify-between shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5">
            <div>
              <h4 className="text-xs font-bold text-slate-900">Sauvegardes & Paramètres</h4>
              <p className="text-xs text-slate-500">Exportez votre stock ou réinitialisez la base de données.</p>
            </div>
            {onNavigateToSettings && (
              <button
                onClick={onNavigateToSettings}
                className="text-xs px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200 transition-colors whitespace-nowrap shadow-sm cursor-pointer"
              >
                Réglages ⚙️
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. RECENT SALES ACTIVITY */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-slate-400" />
            <h3 className="text-sm sm:text-base font-black text-slate-900">
              Dernières Ventes Enregistrées au Club
            </h3>
          </div>
          <button
            onClick={onNavigateToSales}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            Voir tout l'historique →
          </button>
        </div>

        {stats.recentSales.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4">Aucune vente enregistrée pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.recentSales.slice(0, 4).map((sale) => (
              <div
                key={sale.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span>
                      {new Date(sale.date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                    <span className="capitalize px-2 py-0.5 rounded-md bg-white text-slate-700 text-xs font-bold border border-slate-200 shadow-sm">
                      {sale.paymentMethod}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{sale.equipmentName}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quantité : <strong className="text-slate-800">{sale.quantity}x</strong> · {sale.buyerName || 'Client'}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-600 text-sm font-black">
                    +{formatCurrency(sale.totalPrice, currency)}
                  </span>
                  <span className="text-emerald-700 font-bold">
                    Net: +{formatCurrency(sale.profit, currency)}
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
