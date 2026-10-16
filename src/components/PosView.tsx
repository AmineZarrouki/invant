'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  CheckCircle,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Landmark,
  User,
  FileText,
  Flame,
  X,
  Layers,
  Sparkles,
  HelpCircle,
  Check,
} from 'lucide-react';
import { Equipment } from '@/types/inventory';
import { formatCurrency, CurrencyCode, CURRENCY_CONFIG } from '@/lib/currency';
import { getColorSwatch, CATEGORY_CONFIG } from '@/lib/categoryColors';

interface PosViewProps {
  equipment: Equipment[];
  currency: CurrencyCode;
  onRecordSale: (saleData: {
    equipmentId: string;
    size?: string;
    color?: string;
    quantity: number;
    unitPrice: number;
    buyerName: string;
    paymentMethod: 'cash' | 'card' | 'transfer' | 'autre';
    notes?: string;
  }) => Promise<void>;
}

interface CartItem {
  cartLineId: string;
  equipment: Equipment;
  size?: string;
  color?: string;
  quantity: number;
  unitPrice: number;
  maxStock: number;
}

export default function PosView({ equipment, currency, onRecordSale }: PosViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [buyerName, setBuyerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'autre'>('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastSaleReceipt, setLastSaleReceipt] = useState<{
    items: CartItem[];
    total: number;
    buyer: string;
    date: string;
  } | null>(null);

  // Variant selector popup state
  const [pickingItem, setPickingItem] = useState<Equipment | null>(null);
  const [pickerSizeIndex, setPickerSizeIndex] = useState<number>(0);
  const [pickerColor, setPickerColor] = useState<string>('');

  // Filter available items
  const availableItems = useMemo(() => {
    return equipment.filter((item) => {
      const stock = item.stock ?? 0;
      if (stock <= 0) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesBrand = (item.brand || '').toLowerCase().includes(q);
        const matchesModel = (item.model || '').toLowerCase().includes(q);
        const matchesVariant = item.sizes?.some(
          (s) =>
            (s.size || '').toLowerCase().includes(q) ||
            s.colors?.some((c) => c.color.toLowerCase().includes(q))
        );
        return matchesName || matchesBrand || matchesModel || matchesVariant;
      }
      return true;
    });
  }, [equipment, searchTerm, categoryFilter]);

  const addVariantToCart = (
    item: Equipment,
    size?: string,
    color?: string,
    variantMaxStock: number = 0
  ) => {
    const lineId = `${item.id}-${size || 'none'}-${color || 'none'}`;
    setCart((prev) => {
      const existing = prev.find((c) => c.cartLineId === lineId);
      if (existing) {
        if (existing.quantity >= variantMaxStock) return prev;
        return prev.map((c) =>
          c.cartLineId === lineId ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          cartLineId: lineId,
          equipment: item,
          size,
          color,
          quantity: 1,
          unitPrice: item.sellingPrice,
          maxStock: variantMaxStock,
        },
      ];
    });
  };

  const handleProductCardClick = (item: Equipment) => {
    const sizes = item.sizes || [];
    // If only 1 size with 1 color, add directly
    if (sizes.length === 1 && sizes[0].colors.length === 1) {
      const singleSize = sizes[0].size;
      const singleColor = sizes[0].colors[0].color;
      const singleStock = sizes[0].colors[0].quantity;
      if (singleStock > 0) {
        addVariantToCart(item, singleSize, singleColor, singleStock);
      }
      return;
    }

    // Otherwise, open variant picker
    setPickingItem(item);
    setPickerSizeIndex(0);
    const firstColor = sizes[0]?.colors?.[0]?.color || '';
    setPickerColor(firstColor);
  };

  const handlePickerConfirm = () => {
    if (!pickingItem) return;
    const sizeVariant = pickingItem.sizes?.[pickerSizeIndex];
    const colorEntry = sizeVariant?.colors.find((c) => c.color === pickerColor);
    const stock = colorEntry?.quantity || 0;

    if (stock > 0) {
      addVariantToCart(pickingItem, sizeVariant?.size, pickerColor, stock);
    }
    setPickingItem(null);
  };

  const updateCartQuantity = (cartLineId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.cartLineId === cartLineId) {
            const nextQty = c.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > c.maxStock) return c;
            return { ...c, quantity: nextQty };
          }
          return c;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (cartLineId: string) => {
    setCart((prev) => prev.filter((c) => c.cartLineId !== cartLineId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      for (const item of cart) {
        await onRecordSale({
          equipmentId: item.equipment.id,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          buyerName: buyerName.trim() || 'Client Dojo',
          paymentMethod,
          notes: notes.trim() || 'Vente Caisse',
        });
      }

      setLastSaleReceipt({
        items: [...cart],
        total: cartTotal,
        buyer: buyerName.trim() || 'Client Dojo',
        date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      });

      setCart([]);
      setBuyerName('');
      setNotes('');
    } catch (err: any) {
      alert(err.message || 'Erreur lors du règlement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn text-slate-900">
      {/* Friendly Guide Banner */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md shadow-blue-500/5 ring-1 ring-blue-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center font-bold shadow-sm">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>Caisse Rapide · Encaisser une vente</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold shadow-sm">
                Étape par étape
              </span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              1️⃣ Cliquez sur un article à gauche → 2️⃣ Choisissez la taille/couleur → 3️⃣ Cliquez sur le gros bouton vert à droite pour valider !
            </p>
          </div>
        </div>

        {lastSaleReceipt && (
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Dernière vente : {formatCurrency(lastSaleReceipt.total, currency)}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Product Selection Catalog (Left 7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Category Pills */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5 space-y-3">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Rechercher un article à vendre (ex: 12oz, Venum, Rouge)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 font-medium transition-all shadow-inner"
              />
            </div>

            {/* Quick Categories */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {[
                { id: 'all', label: 'Tous', icon: '🥊' },
                { id: 'gants', label: 'Gants', icon: '🥊' },
                { id: 'protege_tibias', label: 'Tibias', icon: '🦵' },
                { id: 'bandes', label: 'Bandes', icon: '🎗️' },
                { id: 'protege_dents', label: 'Dents', icon: '🦷' },
                { id: 'coquilles', label: 'Coquilles', icon: '🛡️' },
                { id: 'autres', label: 'Autres', icon: '⚡' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all border cursor-pointer ${
                    categoryFilter === cat.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                      : 'bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-100 shadow-sm'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {availableItems.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-3xl shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5">
              <p className="text-sm font-bold text-slate-800">Aucun article disponible</p>
              <p className="text-xs text-slate-500 mt-1">
                Tous les articles correspondants sont soit épuisés soit introuvables.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[640px] overflow-y-auto pr-1">
              {availableItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleProductCardClick(item)}
                  className="text-left p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col justify-between group active:scale-95 shadow-md shadow-slate-200/70 ring-1 ring-slate-900/5 relative cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                      <span className="font-bold text-slate-700">{item.brand || 'Dojo'}</span>
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-black border border-emerald-200 shadow-sm">
                        🟢 {item.stock ?? 0} dispo
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-blue-700 line-clamp-2 leading-snug">
                      {item.name}
                    </h4>

                    {/* Variants preview */}
                    <div className="text-xs text-slate-600 mt-2 flex flex-wrap gap-1">
                      {item.sizes?.map((sz, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 rounded-md text-[11px] text-slate-700 border border-slate-200 shadow-sm"
                        >
                          {sz.size && sz.size !== 'Unique' ? (
                            <strong className="text-blue-700">{sz.size}: </strong>
                          ) : null}
                          <span>{sz.colors.map((c) => c.color).join(', ')}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-black text-blue-700">
                      {formatCurrency(item.sellingPrice, currency)}
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-blue-50 group-hover:bg-blue-600 text-blue-700 group-hover:text-white font-black text-xs flex items-center gap-1 border border-blue-200 transition-all shadow-sm">
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Ajouter</span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart & Checkout Panel (Right 5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-lg shadow-slate-200/90 ring-1 ring-slate-900/5">
          <div>
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Ticket de Caisse</h3>
                  <p className="text-xs text-slate-500">{cart.length} ligne(s) sélectionnée(s)</p>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 font-bold py-1 px-2 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Tout vider</span>
                </button>
              )}
            </div>

            {/* Cart Item List */}
            {cart.length === 0 ? (
              <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl p-6">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="text-sm font-bold text-slate-700">Le ticket est vide pour l'instant</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Cliquez sur un article à gauche dans le catalogue pour l'ajouter à la commande.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {cart.map((line) => (
                  <div
                    key={line.cartLineId}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs shadow-sm"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <h5 className="font-black text-slate-900 truncate text-xs sm:text-sm">
                        {line.equipment.name}
                      </h5>
                      <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                        {line.size && (
                          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-blue-700 font-bold">
                            {line.size}
                          </span>
                        )}
                        {line.color && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-slate-300"
                              style={{ background: getColorSwatch(line.color) }}
                            />
                            <span>{line.color}</span>
                          </span>
                        )}
                        <span className="text-blue-700 font-bold ml-1">
                          {formatCurrency(line.unitPrice, currency)}/u
                        </span>
                      </div>
                    </div>

                    {/* Quantity & Delete */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-slate-200">
                        <button
                          onClick={() => updateCartQuantity(line.cartLineId, -1)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center font-black text-xs transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center font-black text-slate-900 text-sm">
                          {line.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(line.cartLineId, 1)}
                          disabled={line.quantity >= line.maxStock}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center font-black text-xs disabled:opacity-30 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right w-16">
                        <span className="font-black text-blue-700 text-sm block">
                          {formatCurrency(line.quantity * line.unitPrice, currency)}
                        </span>
                      </div>

                      <button
                        onClick={() => removeFromCart(line.cartLineId)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Retirer cette ligne"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout Form & Total */}
          <div className="mt-5 pt-4 border-t border-slate-100 space-y-4">
            {/* Total Row */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-baseline justify-between">
              <div>
                <span className="text-xs uppercase font-black tracking-wider text-slate-600 block">
                  Total à payer
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} article(s) au total
                </span>
              </div>
              <span className="text-3xl font-black text-blue-700">
                {formatCurrency(cartTotal, currency)}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-600 block mb-1.5">
                Moyen de règlement :
              </span>
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
                      className={`py-2.5 px-2 rounded-2xl border flex flex-col items-center gap-1 text-xs font-bold transition-all ${
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

            {/* Client & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Nom de l'adhérent (optionnel)"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 font-medium transition-colors"
                />
              </div>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Remarque (ex: Payé en avance)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 font-medium transition-colors"
                />
              </div>
            </div>

            {/* Giant Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || loading}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
            >
              <Check className="w-6 h-6 stroke-[3]" />
              <span>
                {loading
                  ? 'Encaissement en cours...'
                  : `Valider l'Encaissement (${formatCurrency(cartTotal, currency)})`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* VARIANT PICKER MODAL */}
      {pickingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border-2 border-blue-200 rounded-3xl w-full max-w-sm p-6 space-y-5 shadow-2xl text-slate-900 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-base font-black text-slate-900">{pickingItem.name}</h4>
                <p className="text-xs text-slate-500">Sélectionnez la taille et la couleur désirées</p>
              </div>
              <button
                onClick={() => setPickingItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Size selection if has sizes */}
            {pickingItem.sizes && pickingItem.sizes.length > 1 && (
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  1. Choisir la taille :
                </label>
                <div className="flex flex-wrap gap-2">
                  {pickingItem.sizes.map((sz, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPickerSizeIndex(idx);
                        if (sz.colors.length > 0) {
                          setPickerColor(sz.colors[0].color);
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all border ${
                        pickerSizeIndex === idx
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {sz.size || 'Unique'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color selection */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                2. Choisir la couleur :
              </label>
              <div className="flex flex-wrap gap-2">
                {pickingItem.sizes?.[pickerSizeIndex]?.colors.map((c) => {
                  const isSelected = pickerColor === c.color;
                  return (
                    <button
                      key={c.color}
                      onClick={() => setPickerColor(c.color)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 border-blue-400 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
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

            {/* Price reminder */}
            <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Prix unitaire :</span>
              <span className="text-base font-black text-blue-700">
                {formatCurrency(pickingItem.sellingPrice, currency)}
              </span>
            </div>

            {/* Confirm add to cart */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
              <button
                onClick={() => setPickingItem(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200"
              >
                Annuler
              </button>
              <button
                onClick={handlePickerConfirm}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Ajouter au Ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
