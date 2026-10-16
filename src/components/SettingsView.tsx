'use client';

import React, { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  FileCode,
} from 'lucide-react';
import { Equipment, Sale } from '@/types/inventory';
import { CurrencyCode, CURRENCY_CONFIG } from '@/lib/currency';

interface SettingsViewProps {
  equipment: Equipment[];
  sales: Sale[];
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  onResetDatabase: () => Promise<void>;
  onImportDatabase: (data: { equipment: Equipment[]; sales: Sale[] }) => Promise<void>;
}

export default function SettingsView({
  equipment,
  sales,
  currency,
  setCurrency,
  onResetDatabase,
  onImportDatabase,
}: SettingsViewProps) {
  const [activeJsonTab, setActiveJsonTab] = useState<'inventory' | 'sales'>('inventory');
  const [resetting, setResetting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleDownloadBackup = () => {
    window.open('/api/backup', '_blank');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.equipment || !Array.isArray(parsed.equipment)) {
          alert('Format JSON non valide : le tableau "equipment" est requis.');
          return;
        }
        await onImportDatabase(parsed);
        setSuccessMsg('Base de données restaurée avec succès depuis le fichier JSON !');
        setTimeout(() => setSuccessMsg(null), 4000);
      } catch (err: any) {
        alert('Erreur lors du traitement du fichier JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = async () => {
    const confirmed = window.confirm(
      'Voulez-vous vraiment réinitialiser la base de données avec la liste d’équipements Kickboxing initiale ?\nToutes les modifications manuelles seront remplacées.'
    );
    if (!confirmed) return;

    setResetting(true);
    try {
      await onResetDatabase();
      setSuccessMsg('Données réinitialisées au stock de kickboxing d’origine !');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-900">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Database className="w-6 h-6 text-blue-600" />
          <span>Gestion de la Base de Données JSON & Paramètres</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Persistance des données, sauvegardes JSON, import/export et devises
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid: Actions & Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Export JSON Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-3">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Sauvegarde Complète JSON</h3>
            <p className="text-xs text-slate-500 mt-1">
              Téléchargez un fichier JSON contenant tout votre inventaire actuel ainsi que l’historique des ventes.
            </p>
          </div>
          <button
            onClick={handleDownloadBackup}
            className="mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger backup.json</span>
          </button>
        </div>

        {/* Import JSON Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Restaurer un fichier JSON</h3>
            <p className="text-xs text-slate-500 mt-1">
              Importez un fichier JSON sauvegardé pour restaurer ou mettre à jour le catalogue de matériels.
            </p>
          </div>
          <label className="mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer active:scale-95 shadow-sm">
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Sélectionner un JSON</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Reset Database Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-3">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Réinitialiser les Données</h3>
            <p className="text-xs text-slate-500 mt-1">
              Remet à zéro l’inventaire avec le stock officiel kickboxing (Venum, Pakka, Fairtex, Baklee, BS, etc.).
            </p>
          </div>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-500/20 disabled:opacity-40 active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{resetting ? 'Réinitialisation...' : 'Restaurer Matériel Initial'}</span>
          </button>
        </div>
      </div>

      {/* Currency Preference */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Devise d’Affichage</h3>
        <p className="text-xs text-slate-500 mb-4">
          Choisissez la devise pour l’affichage des prix, des coûts d’achat, des marges et du chiffre d’affaires.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.keys(CURRENCY_CONFIG) as CurrencyCode[]).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                currency === c
                  ? 'bg-blue-50 text-blue-900 border-blue-600 shadow-sm ring-2 ring-blue-500/20'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="text-xs font-bold">{CURRENCY_CONFIG[c].label}</div>
              <div className="text-xs text-slate-500 mt-1 font-semibold">
                Symbole: {CURRENCY_CONFIG[c].symbol}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Live JSON Inspector (Collapsible for advanced users only) */}
      <details className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5 group">
        <summary className="cursor-pointer text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center justify-between list-none">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-700">
              Outils informatiques avancés (Afficher les fichiers JSON bruts)
            </span>
          </div>
          <span className="text-xs text-slate-400 group-open:rotate-180 transition-transform">▼</span>
        </summary>

        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">
              Contenu brut stocké dans le fichier :
            </span>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setActiveJsonTab('inventory')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  activeJsonTab === 'inventory' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Stock ({equipment.length})
              </button>
              <button
                onClick={() => setActiveJsonTab('sales')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  activeJsonTab === 'sales' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ventes ({sales.length})
              </button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 max-h-80 overflow-y-auto text-xs font-mono text-slate-200">
            <pre>
              {JSON.stringify(
                activeJsonTab === 'inventory' ? equipment.slice(0, 10) : sales.slice(0, 10),
                null,
                2
              )}
            </pre>
            <div className="mt-2 text-xs text-slate-400 italic">
              (Affichage des 10 premiers éléments - Sauvegardé automatiquement sur le serveur dans data/{activeJsonTab}.json)
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
