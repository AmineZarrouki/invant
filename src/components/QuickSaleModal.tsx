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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-[#101828] border-2 border-emerald-500/40 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 animate-scaleUp my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#22314e] bg-[#141d33]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {isAdjustingWithoutSale ? 'Correction de stock (Perte/Casse)' : 'Enregistrer une Vente'}
              </h3>
              <p className="text-xs text-slate-300">
                {equipment.brand} • {equipment.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/60 text-red-200 text-xs flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* VARIANT SELECTION (TAILLE & COULEUR) */}
          <div className="p-4 rounded-2xl bg-[#141d33] border border-[#22314e] space-y-3.5">
            {/* Size selection */}
            {hasMultipleSizes && (
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-2">
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
                            ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30'
                            : 'bg-[#0e1628] border-[#22314e] text-slate-300 hover:text-white hover:border-[#384f7c]'
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
              <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-2">
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
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/30'
                          : 'bg-[#0e1628] border-[#22314e] text-slate-300 hover:text-white hover:border-[#384f7c]'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                        style={{ background: getColorSwatch(c.color) }}
                      />
                      <span>{c.color}</span>
                      <span className="px-1.5 py-0.2 rounded-md bg-black/40 text-xs font-black">
                        {c.quantity} pcs
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stock status for chosen variant */}
            <div className="pt-2 border-t border-[#1e2c47] flex items-center justify-between text-xs">
              <span className="text-slate-300">
                Stock pour {currentSizeVariant?.size ? `${currentSizeVariant.size} - ` : ''}
                <strong className="text-white font-bold">{selectedColor}</strong> :
              </span>
              <span
                className={`font-black text-sm ${
                  currentVariantStock > 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {currentVariantStock > 0 ? `🟢 ${currentVariantStock} disponible(s)` : '🔴 Rupture (0 pc)'}
              </span>
            </div>
          </div>

          {!isAdjustingWithoutSale ? (
            <>
              {/* Quantity */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#141d33] border border-[#22314e]">
                <div>
                  <span className="text-xs font-black uppercase text-slate-300 block">Quantité vendue</span>
                  <span className="text-xs text-slate-400">Combien de pièces prend le client ?</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 rounded-xl bg-[#1e2c47] hover:bg-[#283b5e] text-white font-black text-base flex items-center justify-center border border-[#2e4166] disabled:opacity-30 transition-colors"
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
                    className="w-14 bg-[#0e1628] border-2 border-emerald-500/60 rounded-xl text-center font-black text-white text-base py-1.5 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(currentVariantStock, q + 1))}
                    disabled={quantity >= currentVariantStock}
                    className="w-10 h-10 rounded-xl bg-[#1e2c47] hover:bg-[#283b5e] text-white font-black text-base flex items-center justify-center border border-[#2e4166] disabled:opacity-30 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Price & Profit */}
              <div className="p-4 rounded-2xl bg-[#141d33] border border-[#22314e] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-emerald-400">
                    Prix de vente unitaire ({currSymbol})
                  </label>
                  <span className="text-xs text-slate-400">Modifiable en cas de remise</span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={soldPrice}
                    onChange={(e) => setSoldPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0e1628] border-2 border-emerald-500/70 rounded-2xl px-4 py-3 text-xl text-emerald-300 font-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Profit calculation */}
                <div className="p-3 rounded-xl bg-[#0e1628] border border-[#1e2c47] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-300 font-bold">Votre bénéfice net :</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-emerald-400 text-sm">
                      +{totalProfit.toFixed(1)} {currSymbol}
                    </span>
                    {soldPrice > 0 && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/40">
                        {marginPercent}% marge
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-2">
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
                            ? 'bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-600/30'
                            : 'bg-[#141d33] border-[#22314e] text-slate-300 hover:text-white hover:bg-[#1e2c47]'
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
                  className="bg-[#141d33] border border-[#22314e] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                />
                <input
                  type="text"
                  placeholder="Remarque (ex: taille essayée au vestiaire)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-[#141d33] border border-[#22314e] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            </>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-600/50 text-xs text-amber-200">
              <span className="font-bold">Mode Correction :</span> Le stock sera réduit de {quantity} pièce(s) sans générer de vente commerciale (perte ou casse).
            </div>
          )}

          {/* Toggle between Sale & Stock Correction */}
          <div className="pt-1 flex items-center justify-between text-xs text-slate-400">
            <button
              type="button"
              onClick={() => setIsAdjustingWithoutSale(!isAdjustingWithoutSale)}
              className="text-slate-400 hover:text-white underline transition-colors"
            >
              {isAdjustingWithoutSale
                ? '← Revenir à la vente normale'
                : 'Ajuster sans vente (casse / perte)'}
            </button>
          </div>

          {/* Checkout Big Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || currentVariantStock < quantity}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-base shadow-xl shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Check className="w-6 h-6 stroke-[3]" />
              <span>
                {loading
                  ? 'Enregistrement...'
                  : isAdjustingWithoutSale
                  ? `Confirmer la déduction (-${quantity} pcs)`
                  : `Valider la Vente (${formatCurrency(totalRevenue, currency)})`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
