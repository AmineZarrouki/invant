'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  ShoppingCart,
  User,
  CreditCard,
  Banknote,
  Landmark,
  FileText,
  AlertCircle,
  CheckCircle,
  Check,
  Tag,
  Coins,
} from 'lucide-react';
import { Equipment, EquipmentPack, getPackAvailableStock } from '@/types/inventory';
import { CurrencyCode, formatCurrency, CURRENCY_CONFIG } from '@/lib/currency';
import { CATEGORY_CONFIG } from '@/lib/categoryColors';

interface PackSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  pack: EquipmentPack | null;
  allEquipment: Equipment[];
  currency: CurrencyCode;
  onConfirmSale: (saleData: {
    packId: string;
    buyerName?: string;
    paymentMethod: 'cash' | 'card' | 'transfer' | 'autre';
    notes?: string;
    variantSelections?: Record<string, { size?: string; color?: string }>;
  }) => Promise<void>;
}

export default function PackSaleModal({
  isOpen,
  onClose,
  pack,
  allEquipment,
  currency,
  onConfirmSale,
}: PackSaleModalProps) {
  const [buyerName, setBuyerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'autre'>('cash');
  const [notes, setNotes] = useState('');
  const [variantSelections, setVariantSelections] = useState<Record<string, { size?: string; color?: string }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !pack) return;

    setBuyerName('');
    setPaymentMethod('cash');
    setNotes('');
    setError(null);

    // Initialize variant selections
    const initialVariants: Record<string, { size?: string; color?: string }> = {};
    pack.items.forEach((it) => {
      const eq = allEquipment.find((e) => e.id === it.equipmentId);
      const chosenSize = it.size || eq?.sizes?.[0]?.size;
      const chosenColor = it.color || eq?.sizes?.[0]?.colors?.[0]?.color;
      initialVariants[it.equipmentId] = {
        size: chosenSize && chosenSize !== 'Unique' ? chosenSize : undefined,
        color: chosenColor,
      };
    });
    setVariantSelections(initialVariants);
  }, [isOpen, pack, allEquipment]);

  if (!isOpen || !pack) return null;

  const packStock = getPackAvailableStock(pack, allEquipment);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (packStock <= 0) {
      setError('Impossible de vendre ce pack : un ou plusieurs articles sont en rupture de stock.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onConfirmSale({
        packId: pack.id,
        buyerName: buyerName.trim() || undefined,
        paymentMethod,
        notes: notes.trim() || undefined,
        variantSelections,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la vente du pack.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl shadow-slate-900/20 overflow-hidden text-slate-900 animate-scaleUp ring-1 ring-slate-900/10 flex flex-col max-h-[92vh] sm:max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-emerald-500/20">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Vente de Pack : {pack.name}</span>
              </h3>
              <p className="text-xs text-slate-500">
                Enregistre la vente de tous les articles du pack aux tarifs personnalisés et décrémente les stocks.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Stock availability alert */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <span className="font-bold text-slate-700">Disponibilité du pack selon le stock réel :</span>
            {packStock > 0 ? (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-black border border-emerald-200">
                🟢 {packStock} pack(s) disponible(s)
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-black border border-rose-200">
                🔴 Rupture de stock sur un article
              </span>
            )}
          </div>

          {/* Pack Items Breakdown with Custom Element Prices */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
              Articles inclus dans ce pack ({pack.items.length})
            </span>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {pack.items.map((it, idx) => {
                const eq = allEquipment.find((e) => e.id === it.equipmentId);
                const sizesList = eq?.sizes?.map((s) => s.size).filter(Boolean) || [];
                const colorsList = eq?.sizes?.flatMap((s) => s.colors.map((c) => c.color)) || [];
                const uniqueColors = Array.from(new Set(colorsList.filter(Boolean)));

                return (
                  <div
                    key={`${it.equipmentId}-${idx}`}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <span>{CATEGORY_CONFIG[it.category]?.icon || '📦'}</span>
                        <span>{it.equipmentName}</span>
                        <span className="text-slate-500 font-semibold">x{it.quantity}</span>
                      </div>

                      {/* Variant pickers if not fixed */}
                      <div className="flex items-center gap-2 mt-1.5">
                        {sizesList.length > 0 && (
                          <select
                            value={variantSelections[it.equipmentId]?.size || ''}
                            onChange={(e) =>
                              setVariantSelections((prev) => ({
                                ...prev,
                                [it.equipmentId]: {
                                  ...prev[it.equipmentId],
                                  size: e.target.value || undefined,
                                },
                              }))
                            }
                            className="bg-white border border-slate-200 rounded-md px-2 py-0.5 text-[11px] font-semibold text-slate-700"
                          >
                            <option value="">Taille par défaut</option>
                            {sizesList.map((sz) => (
                              <option key={sz} value={sz}>
                                {sz}
                              </option>
                            ))}
                          </select>
                        )}

                        {uniqueColors.length > 0 && (
                          <select
                            value={variantSelections[it.equipmentId]?.color || ''}
                            onChange={(e) =>
                              setVariantSelections((prev) => ({
                                ...prev,
                                [it.equipmentId]: {
                                  ...prev[it.equipmentId],
                                  color: e.target.value || undefined,
                                },
                              }))
                            }
                            className="bg-white border border-slate-200 rounded-md px-2 py-0.5 text-[11px] font-semibold text-slate-700"
                          >
                            <option value="">Couleur par défaut</option>
                            {uniqueColors.map((cl) => (
                              <option key={cl} value={cl}>
                                {cl}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Element Price in Pack */}
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block line-through">
                        Normal: {formatCurrency(it.originalPrice, currency)}
                      </span>
                      <span className="text-xs font-black text-blue-700">
                        Dans le pack : {formatCurrency(it.packPrice, currency)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing Highlight Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shadow-md">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100 block">
                Total à encaisser
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black">{formatCurrency(pack.totalPackPrice, currency)}</span>
                {pack.totalOriginalPrice > pack.totalPackPrice && (
                  <span className="text-xs text-emerald-200 line-through">
                    {formatCurrency(pack.totalOriginalPrice, currency)}
                  </span>
                )}
              </div>
            </div>
            {pack.discountAmount > 0 && (
              <div className="text-right">
                <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-black">
                  Remise -{pack.discountAmount} {CURRENCY_CONFIG[currency]?.symbol || 'DH'}
                </span>
              </div>
            )}
          </div>

          {/* Buyer & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Nom de l’acheteur / Adhérent
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="ex: Youssef K., Nouvel Adhérent..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mode de paiement
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'cash' as const, label: 'Espèces', icon: Banknote },
                  { id: 'card' as const, label: 'Carte', icon: CreditCard },
                  { id: 'transfer' as const, label: 'Virement', icon: Landmark },
                  { id: 'autre' as const, label: 'Autre', icon: Coins },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[11px] font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="truncate">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Notes sur la vente (optionnel)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ex: Inscription saison 2026, payé en 2 fois..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || packStock <= 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-500/20 cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Validation...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Confirmer la Vente du Pack ({formatCurrency(pack.totalPackPrice, currency)})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
