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
  Sparkles,
  ShoppingCart,
} from 'lucide-react';
import { Equipment } from '@/types/inventory';
import { CurrencyCode, CURRENCY_CONFIG, formatCurrency } from '@/lib/currency';
import { getColorSwatch } from '@/lib/categoryColors';

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
  onAddToCart?: (
    equipment: Equipment,
    variant?: { size?: string; color?: string; quantity?: number; unitPrice?: number; maxStock?: number }
  ) => void;
  currency: CurrencyCode;
}

export default function QuickSaleModal({
  isOpen,
  onClose,
  equipment,
  onConfirmSale,
  onDirectAdjustStock,
  onAddToCart,
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
      setError('Veuillez saisir le montant encaissé.');
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
          buyerName: buyerName.trim() || 'Client adhérent',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border-2 border-blue-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-900 animate-scaleUp flex flex-col max-h-[90vh] sm:max-h-[85vh]">
        {/* Header - Sticky at top with Item Model prominently displayed */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50/70 to-slate-50 shrink-0 gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-md shadow-emerald-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <span className="text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-xs">
                  {equipment.brand || 'Matériel'}
                </span>
                {/* USER REQUEST: Model clearly visible at the top */}
                {equipment.model && (
                  <span className="text-[11px] font-black text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300 shadow-xs">
                    Modèle : {equipment.model}
                  </span>
                )}
                {equipment.barcode && (
                  <span className="text-[10px] font-mono text-slate-500">
                    #{equipment.barcode}
                  </span>
                )}
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Total stock: {equipment.stock ?? 0} pcs
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {equipment.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {isAdjustingWithoutSale ? 'Correction de stock (Perte/Casse)' : 'Vente directe ou ajout au Panier'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content - Scrollable if tall on mobile */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* VARIANT SELECTION (TAILLE & COULEUR) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5 space-y-3.5">
            {/* Size selection */}
            {hasMultipleSizes && (
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  1. Choisir la Taille :
                </label>
                <div className="flex flex-wrap gap-2">
                  {equipment.sizes?.map((sz, idx) => {
                    const isSelected = selectedSizeIndex === idx;
                    const sizeTotal = (sz.colors || []).reduce(
                      (s, c) => s + (Number(c.quantity) || 0),
                      0
                    );
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSizeChange(idx)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {sz.size || 'Unique'} ({sizeTotal} pcs)
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color selection */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                {hasMultipleSizes ? '2. Choisir la Couleur :' : 'Choisir la Couleur :'}
              </label>
              <div className="flex flex-wrap gap-2">
                {currentSizeVariant?.colors.map((c) => {
                  const isSelected = selectedColor === c.color;
                  return (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setSelectedColor(c.color)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 border-blue-400 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                        style={{ background: getColorSwatch(c.color) }}
                      />
                      <span>{c.color}</span>
                      <span className="px-1.5 py-0.2 rounded-md bg-slate-200 text-xs font-black text-slate-800">
                        {c.quantity} pcs
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stock status for chosen variant */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">
                Stock pour {currentSizeVariant?.size ? `${currentSizeVariant.size} - ` : ''}
                <strong className="text-slate-900 font-bold">{selectedColor}</strong> :
              </span>
              <span
                className={`font-black text-sm ${
                  currentVariantStock > 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {currentVariantStock > 0 ? `🟢 ${currentVariantStock} disponible(s)` : '🔴 Rupture (0 pc)'}
              </span>
            </div>
          </div>

          {!isAdjustingWithoutSale ? (
            <>
              {/* Quantity */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5">
                <div>
                  <span className="text-xs font-black uppercase text-slate-700 block">Quantité vendue</span>
                  <span className="text-xs text-slate-500">Combien de pièces prend le client ?</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-black text-base flex items-center justify-center border border-slate-300 disabled:opacity-30 transition-colors shadow-sm"
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
                    className="w-14 bg-white border-2 border-blue-400 rounded-xl text-center font-black text-blue-900 text-base py-1.5 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(currentVariantStock, q + 1))}
                    disabled={quantity >= currentVariantStock}
                    className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-black text-base flex items-center justify-center border border-slate-300 disabled:opacity-30 transition-colors shadow-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Price & Profit */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-blue-800">
                    Prix de vente unitaire ({currSymbol})
                  </label>
                  <span className="text-xs text-slate-500">Modifiable en cas de remise</span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={soldPrice}
                    onChange={(e) => setSoldPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border-2 border-blue-400 rounded-2xl px-4 py-3 text-xl text-blue-900 font-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                  />
                </div>

                {/* Profit calculation */}
                <div className="p-3 rounded-xl bg-white border border-blue-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-slate-700 font-bold">Votre bénéfice net :</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-emerald-700 text-sm">
                      +{totalProfit.toFixed(1)} {currSymbol}
                    </span>
                    {soldPrice > 0 && (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-xs font-black border border-emerald-200">
                        {marginPercent}% marge
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Moyen de paiement :
                </label>
                <div className="grid grid-cols-4 gap-2">
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
                        className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Buyer & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nom de l'adhérent (optionnel)"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 font-medium transition-colors"
                />
                <input
                  type="text"
                  placeholder="Remarque (ex: taille essayée au dojo)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 font-medium transition-colors"
                />
              </div>
            </>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              <span className="font-bold">Mode Correction :</span> Le stock sera réduit de {quantity} pièce(s) sans générer de vente commerciale (perte ou casse).
            </div>
          )}

          {/* Toggle between Sale & Stock Correction */}
          <div className="pt-1 flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              onClick={() => setIsAdjustingWithoutSale(!isAdjustingWithoutSale)}
              className="text-slate-500 hover:text-slate-900 underline transition-colors"
            >
              {isAdjustingWithoutSale
                ? '← Revenir à la vente normale'
                : 'Ajuster sans vente (casse / perte)'}
            </button>
          </div>

          {/* Checkout Buttons */}
          <div className="pt-2 space-y-2">
            {!isAdjustingWithoutSale && onAddToCart && (
              <button
                type="button"
                disabled={loading || currentVariantStock < quantity || !equipment}
                onClick={() => {
                  if (!equipment) return;
                  onAddToCart(equipment, {
                    size: currentSizeVariant?.size,
                    color: selectedColor,
                    quantity,
                    unitPrice: soldPrice,
                    maxStock: currentVariantStock,
                  });
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-2xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 hover:border-indigo-600 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Ajouter au Panier & continuer ({formatCurrency(totalRevenue, currency)})</span>
              </button>
            )}

            <button
              type="submit"
              disabled={loading || currentVariantStock < quantity}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>
                {loading
                  ? 'Enregistrement...'
                  : isAdjustingWithoutSale
                  ? `Confirmer la déduction (-${quantity} pcs)`
                  : `Vendre Directement (${formatCurrency(totalRevenue, currency)})`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
