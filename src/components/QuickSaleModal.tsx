'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  ShoppingBag,
  Banknote,
  CreditCard,
  Landmark,
  AlertCircle,
  TrendingUp,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { Equipment } from '@/types/inventory';
import { CurrencyCode, CURRENCY_CONFIG, formatCurrency } from '@/lib/currency';

interface QuickSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment | null;
  onConfirmSale: (saleData: {
    equipmentId: string;
    size?: string;
    color?: string;
    quantity: number;
    unitPrice: number;
    buyerName: string;
    paymentMethod: 'cash' | 'card' | 'transfer' | 'autre';
    notes?: string;
  }) => Promise<void>;
  onDirectAdjustStock?: (
    equipmentId: string,
    delta: number,
    variant?: { size?: string; color?: string }
  ) => Promise<void>;
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
  const [selectedSizeIndex, setSelectedSizeIndex] = useState<number>(0);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [soldPrice, setSoldPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [buyerName, setBuyerName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'autre'>('cash');
  const [notes, setNotes] = useState<string>('');
  const [isAdjustingWithoutSale, setIsAdjustingWithoutSale] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize selection when equipment opens
  useEffect(() => {
    if (equipment) {
      setSelectedSizeIndex(0);
      const firstSize = equipment.sizes?.[0];
      const firstColor = firstSize?.colors?.[0]?.color || '';
      setSelectedColor(firstColor);
      setQuantity(1);
      setSoldPrice(equipment.sellingPrice || 0);
      setBuyerName('');
      setPaymentMethod('cash');
      setNotes('');
      setIsAdjustingWithoutSale(false);
      setError(null);
    }
  }, [equipment, isOpen]);

  // When size changes, pick first available color in that size
  const handleSizeChange = (index: number) => {
    setSelectedSizeIndex(index);
    const sizeVariant = equipment?.sizes?.[index];
    if (sizeVariant && sizeVariant.colors.length > 0) {
      setSelectedColor(sizeVariant.colors[0].color);
    } else {
      setSelectedColor('');
    }
  };

  const currentSizeVariant = equipment?.sizes?.[selectedSizeIndex];
  const hasMultipleSizes = Boolean(
    equipment?.sizes &&
      equipment.sizes.length > 1 &&
      equipment.sizes.some((s) => s.size && s.size !== 'Unique')
  );

  // Current stock for the selected variant
  const currentVariantStock = useMemo(() => {
    if (!currentSizeVariant) return 0;
    const colorEntry = currentSizeVariant.colors.find((c) => c.color === selectedColor);
    return colorEntry ? Number(colorEntry.quantity) || 0 : 0;
  }, [currentSizeVariant, selectedColor]);

  if (!isOpen || !equipment) return null;

  const costPerUnit = Number(equipment.costPrice) || 0;
  const unitProfit = soldPrice - costPerUnit;
  const totalProfit = unitProfit * quantity;
  const totalRevenue = soldPrice * quantity;
  const marginPercent = soldPrice > 0 ? Math.round((unitProfit / soldPrice) * 100) : 0;
  const currSymbol = CURRENCY_CONFIG[currency]?.symbol || 'DH';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentVariantStock < quantity) {
      setError(`Stock insuffisant pour cette variante (${currentVariantStock} disponible(s))`);
      return;
    }
    if (!isAdjustingWithoutSale && soldPrice <= 0) {
      setError('Veuillez saisir le prix de vente encaissé pour calculer le bénéfice.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const chosenSize = currentSizeVariant?.size;
      if (isAdjustingWithoutSale && onDirectAdjustStock) {
        await onDirectAdjustStock(equipment.id, -quantity, {
          size: chosenSize,
          color: selectedColor,
        });
      } else {
        await onConfirmSale({
          equipmentId: equipment.id,
          size: chosenSize,
          color: selectedColor,
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-zinc-100 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isAdjustingWithoutSale ? 'Correction de Stock (-1 pc)' : 'Enregistrer une Vente'}
              </h3>
              <p className="text-xs text-zinc-400">
                {equipment.brand} • {equipment.name}
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

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
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
              <span>
                Stock total produit : <strong className="text-white">{equipment.stock ?? 0} pcs</strong>
              </span>
              <span>
                Prix catalogue :{' '}
                <strong className="text-zinc-200">
                  {formatCurrency(equipment.sellingPrice, currency)}
                </strong>
              </span>
            </div>
          </div>

          {/* VARIANT SELECTION (TAILLE & COULEUR) */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            {/* Size selection if multiple sizes */}
            {hasMultipleSizes && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  1. Sélectionner la Taille :
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {equipment.sizes?.map((sz, idx) => {
                    const isSelected = selectedSizeIndex === idx;
                    const sizeTotal = (sz.colors || []).reduce((s, c) => s + (Number(c.quantity) || 0), 0);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSizeChange(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        {sz.size || 'Taille unique'} ({sizeTotal} pcs)
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color selection for this size */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                {hasMultipleSizes ? '2. Sélectionner la Couleur :' : 'Sélectionner la Couleur :'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {currentSizeVariant?.colors.map((c) => {
                  const isSelected = selectedColor === c.color;
                  return (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setSelectedColor(c.color)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <span>{c.color}</span>
                      <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px] font-bold">
                        {c.quantity} pcs
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stock status for chosen variant */}
            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
              <span className="text-zinc-400">
                Stock disponible pour {currentSizeVariant?.size ? `${currentSizeVariant.size} - ` : ''}
                <strong className="text-zinc-200">{selectedColor}</strong> :
              </span>
              <span
                className={`font-black ${
                  currentVariantStock > 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {currentVariantStock > 0 ? `${currentVariantStock} pcs` : 'Rupture (0 pc)'}
              </span>
            </div>
          </div>

          {!isAdjustingWithoutSale ? (
            <>
              {/* Sold Price Input & Profit Difference Calculator */}
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400 pb-2 border-b border-zinc-800/80">
                  <span>Coût d’achat fournisseur :</span>
                  <span className="font-semibold text-zinc-300">
                    {formatCurrency(costPerUnit, currency)}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-emerald-400">
                      Prix de Vente Encaissé ({currSymbol}) *
                    </label>
                    <span className="text-[11px] text-zinc-400">
                      Modifiable si remise ou prix négocié
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={soldPrice}
                    onChange={(e) => setSoldPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-900 border border-emerald-500/50 rounded-xl px-3.5 py-2 text-base text-emerald-400 font-black focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Profit Preview */}
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-zinc-300 font-semibold">Bénéfice Net :</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-extrabold ${
                        totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {totalProfit >= 0 ? `+${totalProfit.toFixed(1)}` : totalProfit.toFixed(1)}{' '}
                      {currSymbol}
                    </span>
                    {soldPrice > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 font-bold">
                        {marginPercent}% marge
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-xs font-bold text-zinc-300">Quantité Vendue :</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm flex items-center justify-center disabled:opacity-30 transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={currentVariantStock}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        Math.min(currentVariantStock, Math.max(1, parseInt(e.target.value) || 1))
                      )
                    }
                    className="w-12 bg-zinc-900 border border-zinc-800 rounded-lg text-center font-bold text-white text-sm py-1 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(currentVariantStock, q + 1))}
                    disabled={quantity >= currentVariantStock}
                    className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm flex items-center justify-center disabled:opacity-30 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Moyen de Paiement :
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'cash', label: 'Espèces', icon: Banknote },
                    { id: 'card', label: 'Carte', icon: CreditCard },
                    { id: 'transfer', label: 'Virement', icon: Landmark },
                    { id: 'autre', label: 'Autre', icon: Check },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
                          isSelected
                            ? 'bg-zinc-800 border-emerald-500 text-white'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Buyer & Notes */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nom de l'adhérent / client..."
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Notes / Remarque..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-300">
              <span className="font-bold">Mode Correction de Stock :</span> 1 pièce de la variante{' '}
              <strong>
                {currentSizeVariant?.size ? `${currentSizeVariant.size} - ` : ''}
                {selectedColor}
              </strong>{' '}
              sera déduite sans enregistrer de vente ni de bénéfice commercial.
            </div>
          )}

          {/* Toggle between Sale & Stock Correction */}
          <div className="pt-1 flex items-center justify-between text-xs text-zinc-400">
            <button
              type="button"
              onClick={() => setIsAdjustingWithoutSale(!isAdjustingWithoutSale)}
              className="text-zinc-400 hover:text-white underline transition-colors"
            >
              {isAdjustingWithoutSale
                ? '← Revenir à l’enregistrement de vente avec bénéfice'
                : 'Juste ajuster le stock sans vente (casse / perte)'}
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || currentVariantStock < quantity}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 ${
                isAdjustingWithoutSale
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {loading
                  ? 'Validation...'
                  : isAdjustingWithoutSale
                  ? 'Confirmer le Retrait'
                  : `Encaisser ${formatCurrency(totalRevenue, currency)}`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
