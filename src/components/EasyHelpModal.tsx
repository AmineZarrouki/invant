'use client';

import React from 'react';
import {
  X,
  HelpCircle,
  ShoppingBag,
  Package,
  PlusCircle,
  TrendingUp,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface EasyHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: 'dashboard' | 'inventory' | 'pos' | 'sales' | 'settings') => void;
  onOpenAddModal: () => void;
}

export default function EasyHelpModal({
  isOpen,
  onClose,
  onNavigate,
  onOpenAddModal,
}: EasyHelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl my-6 overflow-hidden text-slate-900 animate-scaleUp ring-1 ring-slate-200">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>Guide Facile & Rapide</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                  Pour Tous
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Vous n'avez pas besoin d'être un expert en informatique. Tout est prévu pour être le plus simple possible !
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Card 1: Vendre */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5 flex gap-4 items-start hover:border-blue-400 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900">1. Encaisser une vente en 2 clics</h4>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Le plus fréquent
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Un adhérent achète des gants ou des bandes ? Cliquez sur le bouton vert <strong className="text-emerald-700">"🛒 Vendre"</strong> sur la fiche de l'article ou depuis le tableau de bord. Choisissez la taille et la couleur, puis validez. Le stock diminue automatiquement !
              </p>
              <button
                onClick={() => {
                  onClose();
                  onNavigate('pos');
                }}
                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                <span>Aller à la Caisse</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Card 2: Stock */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5 flex gap-4 items-start hover:border-blue-400 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900">2. Comprendre les couleurs du stock</h4>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  Visuel & Simple
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Dans <strong className="text-slate-900">"Mon Stock"</strong>, chaque matériel a un indicateur couleur très clair :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-xs">
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="font-bold text-emerald-800">🟢 En Stock</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0"></span>
                  <span className="font-bold text-amber-800">🟡 Bientôt épuisé</span>
                </div>
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0"></span>
                  <span className="font-bold text-rose-800">🔴 Rupture (0 pc)</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Pour ajouter des pièces reçues du fournisseur, cliquez simplement sur <strong className="text-blue-600">+ Stock</strong>.
              </p>
            </div>
          </div>

          {/* Card 3: Ajouter du matériel */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5 flex gap-4 items-start hover:border-blue-400 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900">3. Ajouter un nouvel équipement</h4>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  Prêt à l'emploi
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Cliquez sur le bouton bleu <strong className="text-blue-600">+ Nouveau Matériel</strong>. Sélectionnez l'icône de l'article (Gants, Protège-tibias, etc.). Les tailles habituelles (10oz, 12oz, M, L...) sont générées automatiquement. Indiquez le prix de vente et c'est terminé !
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenAddModal();
                }}
                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                <span>Ajouter un article maintenant</span>
                <span>+</span>
              </button>
            </div>
          </div>

          {/* Card 4: Suivi des bénéfices */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5 flex gap-4 items-start hover:border-blue-400 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black text-slate-900">4. Vos bénéfices calculés sans calculatrice</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                À chaque vente, l'application calcule automatiquement votre marge nette (Prix de vente - Prix d'achat). Retrouvez tous vos totaux sur l’onglet <strong className="text-slate-900">"Accueil"</strong> et dans <strong className="text-slate-900">"Historique"</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Vos données restent toujours enregistrées en toute sécurité.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            J'ai compris, c'est parti !
          </button>
        </div>
      </div>
    </div>
  );
}
