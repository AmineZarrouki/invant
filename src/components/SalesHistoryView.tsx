'use client';

import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  RotateCcw,
  Download,
  Calendar,
  CreditCard,
  Banknote,
  Landmark,
  User,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Tag
} from 'lucide-react';
import { Sale, DeletionLog } from '@/types/inventory';
import { formatCurrency, CurrencyCode } from '@/lib/currency';
import DeletionHistoryView from './DeletionHistoryView';

interface SalesHistoryViewProps {
  sales: Sale[];
  deletions: DeletionLog[];
  currency: CurrencyCode;
  onRefundSale: (saleId: string) => Promise<void>;
  onRestoreDeletedItem: (deletionId: string) => Promise<void>;
  activeSubTab?: 'sales' | 'deletions';
  onChangeSubTab?: (tab: 'sales' | 'deletions') => void;
}

export default function SalesHistoryView({
  sales,
  deletions,
  currency,
  onRefundSale,
  onRestoreDeletedItem,
  activeSubTab = 'sales',
  onChangeSubTab,
}: SalesHistoryViewProps) {
  const [internalSubTab, setInternalSubTab] = useState<'sales' | 'deletions'>('sales');
  const currentSubTab = onChangeSubTab ? activeSubTab : internalSubTab;
  const setSubTab = onChangeSubTab ? onChangeSubTab : setInternalSubTab;

  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [loadingRefundId, setLoadingRefundId] = useState<string | null>(null);

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (paymentFilter !== 'all' && s.paymentMethod !== paymentFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          s.equipmentName.toLowerCase().includes(q) ||
          (s.buyerName || '').toLowerCase().includes(q) ||
          (s.brand || '').toLowerCase().includes(q) ||
          (s.size || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [sales, searchTerm, paymentFilter]);

  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + (s.totalPrice || 0), 0);
  }, [filteredSales]);

  const totalProfit = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + (s.profit || 0), 0);
  }, [filteredSales]);

  const totalUnits = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + (s.quantity || 0), 0);
  }, [filteredSales]);

  const handleRefund = async (sale: Sale) => {
    const confirmRefund = window.confirm(
      `Confirmer l'annulation de la vente de ${sale.quantity}x "${sale.equipmentName}" pour ${sale.buyerName || 'Client'} ?\nLe stock sera automatiquement réintégré dans l'inventaire.`
    );
    if (!confirmRefund) return;

    setLoadingRefundId(sale.id);
    try {
      await onRefundSale(sale.id);
    } catch (err: any) {
      alert(err.message || 'Erreur lors du remboursement');
    } finally {
      setLoadingRefundId(null);
    }
  };

  const exportSalesCSV = () => {
    if (sales.length === 0) return;
    const headers = ['ID', 'Date', 'Article', 'Marque', 'Taille', 'Quantite', 'PrixUnitaire', 'Total', 'Marge', 'Client', 'Paiement'];
    const rows = sales.map((s) => [
      s.id,
      new Date(s.date).toISOString(),
      `"${s.equipmentName.replace(/"/g, '""')}"`,
      s.brand || '',
      s.size || '',
      s.quantity,
      s.unitPrice,
      s.totalPrice,
      s.profit,
      `"${(s.buyerName || '').replace(/"/g, '""')}"`,
      s.paymentMethod,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kickboxing-ventes-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Subtab Navigation: Sales vs Deletions Journal */}
      <div className="flex items-center gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl w-fit">
        <button
          onClick={() => setSubTab('sales')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            currentSubTab === 'sales'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
          }`}
        >
          <History className="w-4 h-4 text-emerald-400" />
          <span>Ventes & Transactions</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-700 text-zinc-200">
            {sales.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('deletions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            currentSubTab === 'deletions'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
          }`}
        >
          <RotateCcw className="w-4 h-4 text-red-400" />
          <span>Journal des Suppressions</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-950 text-red-300 border border-red-800/60">
            {deletions.length}
          </span>
        </button>
      </div>

      {currentSubTab === 'deletions' ? (
        <DeletionHistoryView
          deletions={deletions}
          currency={currency}
          onRestoreItem={onRestoreDeletedItem}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <History className="w-6 h-6 text-red-500" />
                <span>Historique des Ventes & Transactions</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Journal complet des ventes, réintégration automatique en stock en cas d’annulation
              </p>
            </div>

            <button
              onClick={exportSalesCSV}
              disabled={sales.length === 0}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors border border-zinc-700 disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              <span>Exporter CSV</span>
            </button>
          </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs uppercase font-bold text-zinc-400">Total Ventes (Filtrées)</span>
          <div className="text-2xl font-black text-white mt-1">{filteredSales.length} opérations</div>
          <p className="text-xs text-zinc-400 mt-1">{totalUnits} articles vendus au dojo</p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs uppercase font-bold text-emerald-400">Chiffre d’Affaires</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {formatCurrency(totalRevenue, currency)}
          </div>
          <p className="text-xs text-zinc-400 mt-1">Encaissé sur la sélection</p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs uppercase font-bold text-zinc-400">Marge Nette Réalisée</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            +{formatCurrency(totalProfit, currency)}
          </div>
          <p className="text-xs text-zinc-400 mt-1">Bénéfice calculé après coût matériel</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par article, client, taille..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-300 focus:outline-none focus:border-red-500"
        >
          <option value="all">Tous les modes de paiement</option>
          <option value="cash">Espèces</option>
          <option value="card">Carte bancaire</option>
          <option value="transfer">Virement</option>
        </select>
      </div>

      {/* Sales Table */}
      {filteredSales.length === 0 ? (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
          <History className="w-10 h-10 mx-auto text-zinc-700 mb-2 opacity-50" />
          <p className="text-sm font-medium">Aucune vente ne correspond à ces critères.</p>
        </div>
      ) : (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/70 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Date & Heure</th>
                  <th className="py-3 px-4">Article Vendu</th>
                  <th className="py-3 px-3">Qté</th>
                  <th className="py-3 px-3">Prix Unit.</th>
                  <th className="py-3 px-3">Montant Total</th>
                  <th className="py-3 px-3">Bénéfice</th>
                  <th className="py-3 px-3">Client</th>
                  <th className="py-3 px-3">Paiement</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-xs">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-zinc-850/40 transition-colors">
                    <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                      {new Date(sale.date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{sale.equipmentName}</div>
                      <div className="text-[11px] text-zinc-400">
                        {sale.brand} • {sale.size} • {sale.color}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-black text-white px-2 py-0.5 rounded bg-zinc-800">
                        {sale.quantity}x
                      </span>
                    </td>
                    <td className="py-3 px-3 text-zinc-300">
                      {formatCurrency(sale.unitPrice, currency)}
                    </td>
                    <td className="py-3 px-3 font-black text-emerald-400">
                      {formatCurrency(sale.totalPrice, currency)}
                    </td>
                    <td className="py-3 px-3 font-semibold text-emerald-300">
                      +{formatCurrency(sale.profit, currency)}
                    </td>
                    <td className="py-3 px-3 text-zinc-200 font-medium">
                      {sale.buyerName || 'Client'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="capitalize px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRefund(sale)}
                        disabled={loadingRefundId === sale.id}
                        className="flex items-center gap-1 ml-auto px-2 py-1 rounded bg-zinc-800 hover:bg-red-950/80 hover:text-red-300 text-zinc-400 text-xs font-semibold transition-colors disabled:opacity-40"
                        title="Annuler cette vente et remettre le stock"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{loadingRefundId === sale.id ? 'Annulation...' : 'Annuler'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
