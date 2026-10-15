'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, ShoppingBag, Banknote, CreditCard, Landmark, AlertCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import { Equipment } from '@/types/inventory';
import { CurrencyCode, CURRENCY_CONFIG, formatCurrency } from '@/lib/currency';

interface QuickSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment | null;
  onConfirmSale: (saleData: {
    equipmentId: string;
    quantity: number;
    unitPrice: number;
    buyerName: string;
    paymentMethod: 'cash' | 'card' | 'transfer' | 'autre';
    notes?: string;
  }) => Promise<void>;
  onDirectAdjustStock?: (equipmentId: string, delta: number) => Promise<void>;
  currency: CurrencyCode;
}

export default function QuickSaleModal({
  isOpen,
  onClose,
  equipment,
  onConfirmSale,
  onDirectAdjustStock,
  currency,
}: QuickSaleModalProps) {
  const [soldPrice, setSoldPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [buyerName, setBuyerName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'autre'>('cash');
  const [notes, setNotes] = useState<string>('');
  const [isAdjustingWithoutSale, setIsAdjustingWithoutSale] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (equipment) {
      setQuantity(1);
      setSoldPrice(equipment.sellingPrice || 0);
      setBuyerName('');
      setPaymentMethod('cash');
      setNotes('');
      setIsAdjustingWithoutSale(false);
      setError(null);
    }
  }, [equipment, isOpen]);

  if (!isOpen || !equipment) return null;

  const costPerUnit = Number(equipment.costPrice) || 0;
  const unitProfit = soldPrice - costPerUnit;
  const totalProfit = unitProfit * quantity;
  const totalRevenue = soldPrice * quantity;
  const marginPercent = soldPrice > 0 ? Math.round((unitProfit / soldPrice) * 100) : 0;
  const currSymbol = CURRENCY_CONFIG[currency]?.symbol || 'DH';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (equipment.stock < quantity) {
      setError(`Stock insuffisant (${equipment.stock} disponible(s))`);
      return;
    }
    if (!isAdjustingWithoutSale && soldPrice <= 0) {
      setError('Veuillez saisir le prix de vente encaissé pour calculer le bénéfice.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (isAdjustingWithoutSale && onDirectAdjustStock) {
        // Direct stock decrement without logging sale/profit
        await onDirectAdjustStock(equipment.id, -quantity);
      } else {
        // Standard sale: log sale, deduct stock, credit profit difference
        await onConfirmSale({
          equipmentId: equipment.id,
          quantity,
          unitPrice: Number(soldPrice),
          buyerName: buyerName.trim() || 'Client comptant',
          paymentMethod,
          notes: notes.trim() || undefined,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isAdjustingWithoutSale ? 'Correction de Stock (-1 pc)' : 'Enregistrer une Vente (-1 pc)'}
              </h3>
              <p className="text-xs text-zinc-400">
                {equipment.brand} • {equipment.size} • {equipment.color}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Item Banner */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <div className="text-sm font-bold text-white">{equipment.name}</div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mt-1">
              <span>Stock disponible : <strong className="text-white">{equipment.stock} pcs</strong></span>
              <span>Prix catalogue : <strong className="text-zinc-200">{formatCurrency(equipment.sellingPrice, currency)}</strong></span>
            </div>
          </div>

          {!isAdjustingWithoutSale ? (
            <>
              {/* Sold Price Input & Profit Difference Calculator */}
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400 pb-2 border-b border-zinc-800/80">
                  <span>Coût d’achat fournisseur :</span>
                  <span className="font-semibold text-zinc-300">{formatCurrency(costPerUnit, currency)}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Prix de vente encaissé ({currSymbol}) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      required
                      autoFocus
                      placeholder="0"
                      value={soldPrice || ''}
                      onChange={(e) => setSoldPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-lg font-black text-emerald-400 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                      {currSymbol}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Indiquez le prix exact payé par l'acheteur (modifiable en cas de réduction).
                  </p>
                </div>

                {/* Profit Live Breakdown */}
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-[11px] font-semibold text-emerald-300 block">
                        Bénéfice net calculé
                      </span>
                      <span className="text-[10px] text-emerald-400/80">
                        ({soldPrice} - {costPerUnit} {currSymbol})
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-emerald-400">
                      +{formatCurrency(unitProfit, currency)}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-500">
                      {marginPercent}% marge
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Règlement
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      paymentMethod === 'cash'
                        ? 'bg-zinc-800 border-zinc-600 text-white shadow-sm'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Espèces</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-zinc-800 border-zinc-600 text-white shadow-sm'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                    <span>Carte</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      paymentMethod === 'transfer'
                        ? 'bg-zinc-800 border-zinc-600 text-white shadow-sm'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Landmark className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Virement</span>
                  </button>
                </div>
              </div>

              {/* Buyer Name (Optional) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Client / Adhérent (Optionnel)
                </label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Client dojo, Coach..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>
            </>
          ) : (
            /* Non-Sale Adjust Warning */
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/50 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Sortie de stock sans enregistrement de vente</span>
              </div>
              <p className="text-zinc-400">
                Cette option déduit 1 pièce du stock pour cause de perte, détérioration ou inventaire, sans enregistrer de vente ni de bénéfice.
              </p>
            </div>
          )}

          {/* Toggle between Sale and Non-Sale adjust */}
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={() => setIsAdjustingWithoutSale(!isAdjustingWithoutSale)}
              className="text-xs text-zinc-400 hover:text-zinc-200 underline transition-colors"
            >
              {isAdjustingWithoutSale
                ? '← Revenir à l’enregistrement de vente avec bénéfice'
                : 'Ce n’est pas une vente ? Sortie simple pour perte / inventaire'}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || equipment.stock <= 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg transition-all disabled:opacity-40 active:scale-95 ${
                isAdjustingWithoutSale
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {loading
                  ? 'Traitement...'
                  : isAdjustingWithoutSale
                  ? 'Déduire 1 pc du stock'
                  : `Confirmer la vente (+${formatCurrency(unitProfit, currency)} profit)`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
