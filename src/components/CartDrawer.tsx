'use client';

import React, { useState } from 'react';
import {
  X,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Landmark,
  User,
  FileText,
  Tag,
  Percent,
  Check,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { CartItem } from '@/types/inventory';
import { CurrencyCode, formatCurrency, CURRENCY_CONFIG } from '@/lib/currency';
import { getColorSwatch, CATEGORY_CONFIG } from '@/lib/categoryColors';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  currency: CurrencyCode;
  onUpdateItemQuantity: (cartLineId: string, delta: number) => void;
  onUpdateItemPrice: (cartLineId: string, newPrice: number) => void;
  onRemoveItem: (cartLineId: string) => void;
  onClearCart: () => void;
  onCheckout: (checkoutData: {
    buyerName: string;
    paymentMethod: 'cash' | 'card' | 'transfer' | 'autre';
    notes?: string;
  }) => Promise<void>;
  onNavigateToInventory?: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  currency,
  onUpdateItemQuantity,
  onUpdateItemPrice,
  onRemoveItem,
  onClearCart,
  onCheckout,
  onNavigateToInventory,
}: CartDrawerProps) {
  const [buyerName, setBuyerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'autre'>('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore draft checkout info from localStorage on mount
  React.useEffect(() => {
    try {
      const savedBuyer = localStorage.getItem('kickboxing_cart_buyer');
      const savedPayment = localStorage.getItem('kickboxing_cart_payment') as any;
      const savedNotes = localStorage.getItem('kickboxing_cart_notes');
      if (savedBuyer) setBuyerName(savedBuyer);
      if (savedPayment && ['cash', 'card', 'transfer', 'autre'].includes(savedPayment)) {
        setPaymentMethod(savedPayment);
      }
      if (savedNotes) setNotes(savedNotes);
    } catch {}
  }, []);

  const handleBuyerNameChange = (name: string) => {
    setBuyerName(name);
    try {
      localStorage.setItem('kickboxing_cart_buyer', name);
    } catch {}
  };

  const handlePaymentMethodChange = (pm: 'cash' | 'card' | 'transfer' | 'autre') => {
    setPaymentMethod(pm);
    try {
      localStorage.setItem('kickboxing_cart_payment', pm);
    } catch {}
  };

  const handleNotesChange = (n: string) => {
    setNotes(n);
    try {
      localStorage.setItem('kickboxing_cart_notes', n);
    } catch {}
  };

  const handleClearAll = () => {
    onClearCart();
    setBuyerName('');
    setNotes('');
    try {
      localStorage.removeItem('kickboxing_cart_buyer');
      localStorage.removeItem('kickboxing_cart_notes');
    } catch {}
  };

  const totalRegularValue = cart.reduce(
    (sum, item) => sum + item.quantity * (item.originalPrice || item.unitPrice),
    0
  );
  const cartTotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalDiscount = Math.max(0, totalRegularValue - cartTotal);
  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Quick discount helper for all items in the cart
  const applyGlobalDiscount = (percentage: number) => {
    cart.forEach((item) => {
      const orig = item.originalPrice || item.unitPrice;
      const discounted = Math.round(orig * (1 - percentage / 100));
      onUpdateItemPrice(item.cartLineId, discounted);
    });
  };

  const resetToOriginalPrices = () => {
    cart.forEach((item) => {
      onUpdateItemPrice(item.cartLineId, item.originalPrice);
    });
  };

  const handleConfirmCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      await onCheckout({
        buyerName: buyerName.trim() || 'Client Dojo',
        paymentMethod,
        notes: notes.trim() || undefined,
      });
      setBuyerName('');
      setNotes('');
      try {
        localStorage.removeItem('kickboxing_cart_buyer');
        localStorage.removeItem('kickboxing_cart_notes');
      } catch {}
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la validation du panier');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col justify-between text-slate-900 border-l border-slate-200 animate-slideLeft">
          {/* 1. Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>Panier de Vente Groupée</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                    {totalUnits} article{totalUnits > 1 ? 's' : ''}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Modifiez le prix unitaire de chaque élément et validez en 1 étape.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Vider le panier"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 2. Body / Item List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {cart.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <ShoppingCart className="w-8 h-8 opacity-40" />
                </div>
                <h4 className="text-base font-black text-slate-900">
                  Votre panier de vente est vide
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Ajoutez plusieurs équipements depuis l'inventaire en cliquant sur{' '}
                  <strong className="text-emerald-700">« + Panier »</strong> ou en sélectionnant plusieurs articles.
                </p>
                {onNavigateToInventory && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToInventory();
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    <span>Parcourir mon stock</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Global discount shortcuts */}
                <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Réduction globale rapide :</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[5, 10, 15, 20].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => applyGlobalDiscount(pct)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 text-xs font-black transition-all shadow-xs cursor-pointer"
                      >
                        -{pct}%
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={resetToOriginalPrices}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                      title="Rétablir les prix normaux"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* List of Cart Items */}
                <div className="space-y-3">
                  {cart.map((line) => {
                    const lineDiscount = line.originalPrice - line.unitPrice;
                    const isDiscounted = lineDiscount > 0;
                    const lineTotal = line.quantity * line.unitPrice;

                    return (
                      <div
                        key={line.cartLineId}
                        className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 shadow-sm transition-all space-y-3"
                      >
                        {/* Top: Item Title, Variant & Remove */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                {line.equipment.brand || 'Matériel'}
                              </span>
                              {line.equipment.model && (
                                <span className="text-[10px] font-black text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300">
                                  Modèle : {line.equipment.model}
                                </span>
                              )}
                              {line.size && (
                                <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                  Taille: {line.size}
                                </span>
                              )}
                              {line.color && (
                                <span className="text-[10px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 inline-flex items-center gap-1">
                                  <span
                                    className="w-2 h-2 rounded-full border border-slate-300"
                                    style={{ background: getColorSwatch(line.color) }}
                                  />
                                  <span>{line.color}</span>
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-black text-slate-900 mt-1 truncate">
                              {line.equipment.name}
                            </h4>
                          </div>

                          <button
                            type="button"
                            onClick={() => onRemoveItem(line.cartLineId)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Retirer cet article du panier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Middle: Quantity Stepper & Price Customization */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 items-center">
                          {/* Quantity Stepper */}
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                              Quantité (Max: {line.maxStock})
                            </span>
                            <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl p-1 border border-slate-200 w-fit">
                              <button
                                type="button"
                                onClick={() => onUpdateItemQuantity(line.cartLineId, -1)}
                                className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center font-black text-xs transition-colors cursor-pointer shadow-xs"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-9 text-center font-black text-slate-900 text-sm">
                                {line.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateItemQuantity(line.cartLineId, 1)}
                                disabled={line.quantity >= line.maxStock}
                                className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center font-black text-xs disabled:opacity-30 transition-colors cursor-pointer shadow-xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* USER REQUEST: Direct editable price for this element */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                                Prix unitaire dans ce panier
                              </span>
                              {isDiscounted && (
                                <span className="text-[10px] line-through text-slate-400">
                                  {formatCurrency(line.originalPrice, currency)}
                                </span>
                              )}
                            </div>

                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={line.unitPrice}
                                onChange={(e) =>
                                  onUpdateItemPrice(line.cartLineId, parseFloat(e.target.value) || 0)
                                }
                                className={`w-full py-1.5 pl-3 pr-14 text-sm font-black rounded-xl border focus:outline-none transition-all shadow-inner ${
                                  isDiscounted
                                    ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900 focus:border-emerald-600'
                                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-600'
                                }`}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 pointer-events-none">
                                {CURRENCY_CONFIG[currency]?.symbol || currency}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom: Line Total & Discount badge */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            {isDiscounted ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <span>Remise : -{formatCurrency(lineDiscount * line.quantity, currency)}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-500 font-medium">Prix régulier</span>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 mr-1.5 font-medium">Sous-total :</span>
                            <span className="text-sm font-black text-blue-700">
                              {formatCurrency(lineTotal, currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* 3. Footer / Checkout Form (Only if cart not empty) */}
          {cart.length > 0 && (
            <form onSubmit={handleConfirmCheckout} className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-4">
              {/* Buyer & Payment Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                    Nom de l'adhérent / client :
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => handleBuyerNameChange(e.target.value)}
                      placeholder="Ex: Tariq (adhérent)"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 font-bold focus:outline-none focus:border-blue-600 shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                    Moyen de règlement :
                  </label>
                  <div className="grid grid-cols-4 gap-1">
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
                          onClick={() => handlePaymentMethodChange(m.id as any)}
                          className={`py-1.5 px-1 rounded-xl border flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Total & Discount summary banner */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Total net à encaisser
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-2xl font-black text-emerald-700">
                      {formatCurrency(cartTotal, currency)}
                    </span>
                    {totalDiscount > 0 && (
                      <span className="text-xs line-through text-slate-400 font-bold">
                        {formatCurrency(totalRegularValue, currency)}
                      </span>
                    )}
                  </div>
                </div>

                {totalDiscount > 0 && (
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
                      Économie : -{formatCurrency(totalDiscount, currency)}
                    </span>
                  </div>
                )}
              </div>

              {/* Main Submit Button */}
              <button
                type="submit"
                disabled={loading || cart.length === 0}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    <span>Valider la Vente Groupée en 1 Étape ({formatCurrency(cartTotal, currency)})</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
