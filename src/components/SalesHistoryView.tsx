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
  Tag,
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
    const headers = [
      'ID',
      'Date',
      'Article',
      'Marque',
      'Taille',
      'Quantite',
      'PrixUnitaire',
      'Total',
      'Marge',
      'Client',
      'Paiement',
    ];
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

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kickboxing-ventes-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-900">
      {/* Subtab Navigation: Sales vs Deletions Journal */}
      <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl w-fit shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5">
        <button
          onClick={() => setSubTab('sales')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            currentSubTab === 'sales'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Toutes les Ventes</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold shadow-sm ${
              currentSubTab === 'sales'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {sales.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('deletions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            currentSubTab === 'deletions'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Corbeille (Matériel Supprimé)</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold shadow-sm ${
              currentSubTab === 'deletions'
                ? 'bg-white/20 text-white'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
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
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <History className="w-6 h-6 text-blue-600" />
                <span>Historique des Ventes & Transactions</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Journal complet des ventes, réintégration automatique en stock en cas d’annulation
              </p>
            </div>

            <button
              onClick={exportSalesCSV}
              disabled={sales.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors border border-slate-200 disabled:opacity-40 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Exporter CSV</span>
            </button>
          </div>

          {/* Quick Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5 hover:shadow-lg transition-all">
              <span className="text-xs uppercase font-bold text-slate-500">
                Total Ventes (Filtrées)
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {filteredSales.length} opérations
              </div>
              <p className="text-xs text-slate-500 mt-1">{totalUnits} articles vendus au dojo</p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5 hover:shadow-lg transition-all">
              <span className="text-xs uppercase font-bold text-blue-600">
                Chiffre d’Affaires
              </span>
              <div className="text-2xl font-black text-blue-600 mt-1">
                {formatCurrency(totalRevenue, currency)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Encaissé sur la sélection</p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5 hover:shadow-lg transition-all">
              <span className="text-xs uppercase font-bold text-emerald-600">
                Marge Nette Réalisée
              </span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                +{formatCurrency(totalProfit, currency)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Bénéfice calculé après coût matériel</p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row gap-3 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par article, client, taille..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white font-medium shadow-inner"
              />
            </div>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer shadow-sm"
            >
              <option value="all">Tous les modes de paiement</option>
              <option value="cash">Espèces</option>
              <option value="card">Carte bancaire</option>
              <option value="transfer">Virement</option>
            </select>
          </div>

          {/* Sales Table with Distinct Dividing Lines */}
          {filteredSales.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5">
              <History className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-700">
                Aucune vente ne correspond à ces critères.
              </p>
            </div>
          ) : (
            <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-lg shadow-slate-200/80 ring-1 ring-slate-900/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-300 bg-slate-100/80 text-xs font-black text-slate-700 uppercase tracking-wider">
                      <th className="py-4 px-4 border-r border-slate-200/80">Date & Heure</th>
                      <th className="py-4 px-4 border-r border-slate-200/80">Article Vendu</th>
                      <th className="py-4 px-3 border-r border-slate-200/80">Qté</th>
                      <th className="py-4 px-3 border-r border-slate-200/80">Prix Unit.</th>
                      <th className="py-4 px-3 border-r border-slate-200/80">Montant Total</th>
                      <th className="py-4 px-3 border-r border-slate-200/80">Bénéfice</th>
                      <th className="py-4 px-3 border-r border-slate-200/80">Client</th>
                      <th className="py-4 px-3 border-r border-slate-200/80">Paiement</th>
                      <th className="py-4 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-200 text-xs">
                    {filteredSales.map((sale) => (
                      <tr key={sale.id} className="border-b-2 border-slate-200 hover:bg-blue-50/40 transition-colors">
                        <td className="py-4 px-4 text-slate-500 whitespace-nowrap border-r border-slate-200/60 font-medium">
                          {new Date(sale.date).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-4 px-4 border-r border-slate-200/60">
                          <div className="font-bold text-slate-900">{sale.equipmentName}</div>
                          <div className="text-xs text-slate-500 mt-0.5 font-medium">
                            {sale.brand} • {sale.size} • {sale.color}
                          </div>
                        </td>
                        <td className="py-4 px-3 border-r border-slate-200/60">
                          <span className="font-black text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 shadow-sm">
                            {sale.quantity}x
                          </span>
                        </td>
                        <td className="py-4 px-3 text-slate-600 font-semibold border-r border-slate-200/60">
                          {formatCurrency(sale.unitPrice, currency)}
                        </td>
                        <td className="py-4 px-3 font-black text-blue-600 border-r border-slate-200/60">
                          {formatCurrency(sale.totalPrice, currency)}
                        </td>
                        <td className="py-4 px-3 font-bold text-emerald-700 border-r border-slate-200/60">
                          +{formatCurrency(sale.profit, currency)}
                        </td>
                        <td className="py-4 px-3 text-slate-800 font-semibold border-r border-slate-200/60">
                          {sale.buyerName || 'Client'}
                        </td>
                        <td className="py-4 px-3 border-r border-slate-200/60">
                          <span className="capitalize px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-sm">
                            {sale.paymentMethod}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => handleRefund(sale)}
                            disabled={loadingRefundId === sale.id}
                            className="flex items-center gap-1 ml-auto px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-600 text-xs font-bold transition-colors border border-slate-200 disabled:opacity-40 cursor-pointer shadow-sm"
                            title="Annuler cette vente et remettre le stock"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>
                              {loadingRefundId === sale.id ? 'Annulation...' : 'Annuler'}
                            </span>
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
