'use client';

import React, { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  ShieldCheck,
  Server
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
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Database className="w-6 h-6 text-red-500" />
          <span>Gestion de la Base de Données JSON & Paramètres</span>
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Persistance des données, sauvegardes JSON, import/export et devises
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid: Actions & Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Export JSON Card */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Sauvegarde Complète JSON</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Téléchargez un fichier JSON contenant tout votre inventaire actuel ainsi que l’historique des ventes.
            </p>
          </div>
          <button
            onClick={handleDownloadBackup}
            className="mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-950/50"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger backup.json</span>
          </button>
        </div>

        {/* Import JSON Card */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Restaurer un fichier JSON</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Importez un fichier JSON sauvegardé pour restaurer ou mettre à jour le catalogue de matériels.
            </p>
          </div>
          <label className="mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all border border-zinc-700 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Sélectionner un JSON</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Reset Database Card */}
        <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-3">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Réinitialiser les Données</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Remet à zéro l’inventaire avec le stock officiel kickboxing (Venum, Pakka, Fairtex, Baklee, BS, etc.).
            </p>
          </div>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-950/50 disabled:opacity-40"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{resetting ? 'Réinitialisation...' : 'Restaurer Matériel Initial'}</span>
          </button>
        </div>
      </div>

      {/* Currency Preference */}
      <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
        <h3 className="text-sm font-bold text-white mb-2">Devise d’Affichage</h3>
        <p className="text-xs text-zinc-400 mb-4">
          Choisissez la devise pour l’affichage des prix, des coûts d’achat, des marges et du chiffre d’affaires.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.keys(CURRENCY_CONFIG) as CurrencyCode[]).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`p-3 rounded-xl border text-left transition-all ${
                currency === c
                  ? 'bg-red-600/20 border-red-500 text-white'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <div className="text-xs font-bold text-white">{CURRENCY_CONFIG[c].label}</div>
              <div className="text-[11px] text-zinc-400 mt-1">Symbole: {CURRENCY_CONFIG[c].symbol}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Live JSON Inspector */}
      <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Inspecteur de Données JSON (Fichiers data/*.json)</h3>
          </div>
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setActiveJsonTab('inventory')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                activeJsonTab === 'inventory' ? 'bg-red-600 text-white' : 'text-zinc-400'
              }`}
            >
              inventory.json ({equipment.length})
            </button>
            <button
              onClick={() => setActiveJsonTab('sales')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                activeJsonTab === 'sales' ? 'bg-red-600 text-white' : 'text-zinc-400'
              }`}
            >
              sales.json ({sales.length})
            </button>
          </div>
        </div>

        <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 max-h-80 overflow-y-auto text-xs font-mono text-zinc-300">
          <pre>
            {JSON.stringify(
              activeJsonTab === 'inventory' ? equipment.slice(0, 10) : sales.slice(0, 10),
              null,
              2
            )}
          </pre>
          <div className="mt-2 text-[11px] text-zinc-500 italic">
            (Affichage des 10 premiers éléments - Sauvegardé automatiquement sur le serveur dans data/{activeJsonTab}.json)
          </div>
        </div>
      </div>
    </div>
  );
}
