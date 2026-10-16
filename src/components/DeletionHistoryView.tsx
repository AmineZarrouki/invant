'use client';

import React, { useState, useMemo } from 'react';
import {
  Trash2,
  RotateCcw,
  Search,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { DeletionLog } from '@/types/inventory';
import { formatCurrency, CurrencyCode } from '@/lib/currency';
import { getColorSwatch } from '@/lib/categoryColors';

interface DeletionHistoryViewProps {
  deletions: DeletionLog[];
  currency: CurrencyCode;
  onRestoreItem: (deletionId: string) => Promise<void>;
}

export default function DeletionHistoryView({
  deletions,
  currency,
  onRestoreItem,
}: DeletionHistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const filteredDeletions = useMemo(() => {
    if (!searchTerm.trim()) return deletions;
    const q = searchTerm.toLowerCase();
    return deletions.filter(
      (d) =>
        d.equipmentName.toLowerCase().includes(q) ||
        (d.brand || '').toLowerCase().includes(q) ||
        (d.deletedReason || '').toLowerCase().includes(q) ||
        d.sizes?.some(
          (s) =>
            (s.size || '').toLowerCase().includes(q) ||
            s.colors?.some((c) => c.color.toLowerCase().includes(q))
        )
    );
  }, [deletions, searchTerm]);

  const totalLostUnits = useMemo(() => {
    return filteredDeletions.reduce((acc, d) => acc + (d.stockAtDeletion || 0), 0);
  }, [filteredDeletions]);

  const handleRestore = async (log: DeletionLog) => {
    const confirm = window.confirm(
      `Restaurer "${log.equipmentName}" (${log.stockAtDeletion} pcs) dans l’inventaire actif ?`
    );
    if (!confirm) return;

    setRestoringId(log.id);
    try {
      await onRestoreItem(log.id);
    } finally {
      setRestoringId(null);
    }
  };

  const exportDeletionsCSV = () => {
    if (deletions.length === 0) return;
    const headers = [
      'ID Suppression',
      'Date Suppression',
      'Article',
      'Marque',
      'Tailles & Couleurs',
      'Stock Supprime',
      'Prix Vente',
      'Cout Achat',
      'Motif Suppression',
    ];
    const rows = deletions.map((d) => {
      const variantSummary = (d.sizes || [])
        .map(
          (s) =>
            (s.size ? `${s.size}: ` : '') +
            (s.colors || []).map((c) => `${c.color}(${c.quantity})`).join(' ')
        )
        .join(' | ');

      return [
        d.id,
        new Date(d.deletedAt).toISOString(),
        `"${d.equipmentName.replace(/"/g, '""')}"`,
        d.brand || '',
        `"${variantSummary.replace(/"/g, '""')}"`,
        d.stockAtDeletion,
        d.sellingPrice,
        d.costPrice,
        `"${(d.deletedReason || 'Suppression manuelle').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `kickboxing-journal-suppressions-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-[#f8fafc]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-red-500" />
            <span>Journal des Suppressions</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-red-950 text-red-200 border border-red-800/80 font-bold">
              {deletions.length} archivé{deletions.length > 1 ? 's' : ''}
            </span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Historique d’audit de tous les matériels supprimés. Restaurez tout article en un clic dans le stock actif.
          </p>
        </div>

        <button
          onClick={exportDeletionsCSV}
          disabled={deletions.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1e2c47] hover:bg-[#283b5e] text-slate-100 text-xs font-bold transition-colors border border-[#2e4166] disabled:opacity-40 shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Exporter CSV</span>
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#131c31] border border-[#22314e] shadow-md">
          <span className="text-xs uppercase font-bold text-slate-300">Total Suppressions</span>
          <div className="text-2xl font-black text-white mt-1">
            {filteredDeletions.length} référence{filteredDeletions.length > 1 ? 's' : ''}
          </div>
          <p className="text-xs text-slate-400 mt-1">Éléments tracés dans le journal</p>
        </div>

        <div className="p-4 rounded-xl bg-[#131c31] border border-[#22314e] shadow-md">
          <span className="text-xs uppercase font-bold text-amber-400">Volume de Stock Retiré</span>
          <div className="text-2xl font-black text-amber-400 mt-1">
            {totalLostUnits} pièces
          </div>
          <p className="text-xs text-slate-400 mt-1">Unités retirées du stock actif</p>
        </div>

        <div className="p-4 rounded-xl bg-[#131c31] border border-[#22314e] shadow-md">
          <span className="text-xs uppercase font-bold text-emerald-400">Restauration Rapide</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">100% Réversible</div>
          <p className="text-xs text-slate-400 mt-1">Restauration directe avec variantes d’origine</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-4 rounded-2xl bg-[#131c31] border border-[#22314e] flex items-center gap-3 shadow-md">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher dans l'historique par nom, marque, taille, motif..."
            className="w-full bg-[#0e1628] border border-[#263756] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-red-500 font-medium"
          />
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="px-3 py-2 rounded-xl bg-[#1e2c47] text-xs font-bold text-slate-200 hover:text-white"
          >
            Effacer
          </button>
        )}
      </div>

      {/* Table or Empty State */}
      {filteredDeletions.length === 0 ? (
        <div className="bg-[#131c31] border border-[#22314e] rounded-2xl p-12 text-center text-slate-400 shadow-md">
          <Trash2 className="w-10 h-10 mx-auto text-slate-500 mb-2 opacity-50" />
          <p className="text-sm font-bold text-slate-200">
            {deletions.length === 0
              ? 'Aucune suppression enregistrée.'
              : 'Aucun résultat trouvé pour votre recherche.'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {deletions.length === 0
              ? 'Tous les articles supprimés via le compte à rebours de 5s apparaîtront ici avec possibilité de restauration.'
              : 'Essayez avec un autre mot-clé.'}
          </p>
        </div>
      ) : (
        <div className="bg-[#131c31] border border-[#22314e] rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#22314e] bg-[#0e1628] text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Date & Heure</th>
                  <th className="py-3.5 px-4">Matériel Supprimé</th>
                  <th className="py-3.5 px-3">Taille & Couleur</th>
                  <th className="py-3.5 px-3">Stock au Retrait</th>
                  <th className="py-3.5 px-3">Prix</th>
                  <th className="py-3.5 px-3">Motif Archivé</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2c47] text-xs">
                {filteredDeletions.map((log) => (
                  <tr key={log.id} className="hover:bg-[#18233d]/70 transition-colors">
                    <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                      {new Date(log.deletedAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{log.equipmentName}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {log.brand} {log.model ? `· ${log.model}` : ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-200">
                      {log.sizes && log.sizes.length > 0 ? (
                        <div className="space-y-1">
                          {log.sizes.map((sz, i) => (
                            <div key={i} className="text-xs flex flex-wrap items-center gap-1.5">
                              {sz.size && sz.size !== 'Unique' && (
                                <span className="font-bold text-red-400 mr-1">{sz.size}:</span>
                              )}
                              <div className="flex flex-wrap gap-1">
                                {sz.colors.map((c, cIdx) => (
                                  <span
                                    key={cIdx}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0e1628] border border-[#22314e] text-xs text-slate-300"
                                  >
                                    <span
                                      className="w-2 h-2 rounded-full border border-white/20"
                                      style={{ background: getColorSwatch(c.color) }}
                                    />
                                    <span>{c.color}</span>
                                    <strong className="text-white ml-0.5">({c.quantity})</strong>
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-xs">Standard</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40">
                        {log.stockAtDeletion} pcs
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      {log.sellingPrice > 0 ? (
                        <span className="font-bold text-slate-200">
                          {formatCurrency(log.sellingPrice, currency)}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Non fixé</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-slate-300">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#0e1628] text-slate-300 border border-[#22314e]">
                        {log.deletedReason || 'Suppression manuelle'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleRestore(log)}
                        disabled={restoringId === log.id}
                        className="flex items-center gap-1.5 ml-auto px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-500/50 text-emerald-300 hover:text-white text-xs font-bold transition-all disabled:opacity-40 active:scale-95 shadow-sm"
                        title="Restaurer cet équipement dans l’inventaire actif"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{restoringId === log.id ? 'Restauration...' : 'Restaurer'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
