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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-[#101828] border border-[#22314e] rounded-3xl w-full max-w-2xl shadow-2xl my-6 overflow-hidden text-slate-100 animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#17223b] to-[#121a2d] border-b border-[#22314e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>Guide Facile & Rapide</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  Pour Tous
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Vous n'avez pas besoin d'être un expert en informatique. Tout est prévu pour être le plus simple possible !
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Card 1: Vendre */}
          <div className="p-4 rounded-2xl bg-[#141d33] border border-[#22314e] flex gap-4 items-start hover:border-emerald-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-white">1. Encaisser une vente en 2 clics</h4>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  Le plus fréquent
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Un adhérent achète des gants ou des bandes ? Allez sur l’onglet <strong className="text-white">"Caisse (Vendre)"</strong> ou cliquez sur le bouton vert <strong className="text-emerald-400">"🛒 Vendre"</strong> sur la fiche de l'article. Choisissez la taille et la couleur, puis validez. Le stock diminue automatiquement !
              </p>
              <button
                onClick={() => {
                  onClose();
                  onNavigate('pos');
                }}
                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm"
              >
                <span>Aller à la Caisse</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Card 2: Stock */}
          <div className="p-4 rounded-2xl bg-[#141d33] border border-[#22314e] flex gap-4 items-start hover:border-blue-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-white">2. Comprendre les couleurs du stock</h4>
                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                  Visuel & Simple
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Dans <strong className="text-white">"Mon Stock"</strong>, chaque matériel a un indicateur couleur très clair :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-xs">
                <div className="p-2 rounded-lg bg-[#0e1628] border border-emerald-500/30 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="font-bold text-emerald-300">🟢 En Stock</span>
                </div>
                <div className="p-2 rounded-lg bg-[#0e1628] border border-amber-500/30 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0"></span>
                  <span className="font-bold text-amber-300">🟡 Bientôt épuisé</span>
                </div>
                <div className="p-2 rounded-lg bg-[#0e1628] border border-rose-500/30 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0"></span>
                  <span className="font-bold text-rose-300">🔴 Rupture (0 pc)</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Pour ajouter des pièces reçues du fournisseur, cliquez simplement sur <strong className="text-blue-300">"+ Stock"</strong>.
              </p>
            </div>
          </div>

          {/* Card 3: Ajouter du matériel */}
          <div className="p-4 rounded-2xl bg-[#141d33] border border-[#22314e] flex gap-4 items-start hover:border-red-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-white">3. Ajouter un nouvel équipement</h4>
                <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                  Prêt à l'emploi
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Cliquez sur le gros bouton rouge <strong className="text-red-400">"+ Nouveau Matériel"</strong>. Sélectionnez l'icône de l'article (Gants, Protège-tibias, etc.). Les tailles habituelles (10oz, 12oz, M, L...) sont générées automatiquement. Indiquez le prix de vente et c'est terminé !
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenAddModal();
                }}
                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-sm"
              >
                <span>Ajouter un article maintenant</span>
                <span>+</span>
              </button>
            </div>
          </div>

          {/* Card 4: Suivi des bénéfices */}
          <div className="p-4 rounded-2xl bg-[#141d33] border border-[#22314e] flex gap-4 items-start hover:border-purple-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black text-white">4. Vos bénéfices calculés sans calculatrice</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                À chaque vente, l'application calcule automatiquement votre marge nette (Prix de vente - Prix d'achat). Retrouvez tous vos totaux sur l’onglet <strong className="text-white">"Accueil"</strong> et dans <strong className="text-white">"Historique"</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#121b30] border-t border-[#22314e] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Vos données restent toujours enregistrées en toute sécurité.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md shadow-rose-600/30 transition-all active:scale-95"
          >
            J'ai compris, c'est parti !
          </button>
        </div>
      </div>
    </div>
  );
}
