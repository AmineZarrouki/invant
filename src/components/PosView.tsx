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
  Printer,
  X,
  Layers,
} from 'lucide-react';
import { Equipment } from '@/types/inventory';
import { formatCurrency, CurrencyCode, CURRENCY_CONFIG } from '@/lib/currency';

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
      // Process each cart item through the sales API
      for (const item of cart) {
        await onRecordSale({
          equipmentId: item.equipment.id,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          buyerName: buyerName.trim() || 'Client Dojo',
          paymentMethod,
          notes: notes.trim() || 'Vente Caisse Rapide',
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
      {/* Product Selection Catalog (Left 7 Cols) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Header & Search */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              <span>Catalogue Rapide • Caisse</span>
            </h2>
            <span className="text-xs text-zinc-400 font-semibold">
              {availableItems.length} référence(s) disponible(s)
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, taille ou couleur (12oz, M, Noir, Gold...)"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Quick Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {[
              { id: 'all', label: 'Tous' },
              { id: 'gants', label: 'Gants' },
              { id: 'protege_tibias', label: 'Tibias' },
              { id: 'bandes', label: 'Bandes' },
              { id: 'protege_dents', label: 'Dents' },
              { id: 'coquilles', label: 'Coquilles' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors border ${
                  categoryFilter === cat.id
                    ? 'bg-zinc-100 text-zinc-950 font-bold border-zinc-100 shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border-zinc-800 hover:bg-zinc-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-1">
          {availableItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleProductCardClick(item)}
              className="text-left p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-red-500/60 hover:bg-zinc-850 transition-all flex flex-col justify-between group active:scale-95"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                  <span className="font-bold text-zinc-300">{item.brand}</span>
                  <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-white font-bold">
                    {item.stock ?? 0} dispo
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-red-400 line-clamp-2">
                  {item.name}
                </h4>
                {/* Variants preview */}
                <div className="text-[11px] text-zinc-400 mt-1 flex flex-wrap gap-1">
                  {item.sizes?.map((sz, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.2 bg-zinc-950 rounded text-[10px] text-zinc-300 border border-zinc-800"
                    >
                      {sz.size ? `${sz.size}: ` : ''}
                      {sz.colors.map((c) => c.color).join(', ')}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs font-black text-emerald-400">
                  {formatCurrency(item.sellingPrice, currency)}
                </span>
                <span className="w-6 h-6 rounded-lg bg-zinc-800 group-hover:bg-red-600 text-zinc-300 group-hover:text-white flex items-center justify-center font-bold text-xs transition-colors">
                  +
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart & Checkout Panel (Right 5 Cols) */}
      <div className="lg:col-span-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-2xl">
        <div>
          {/* Cart Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-red-500" />
              <h3 className="text-base font-bold text-white">Ticket de Caisse en cours</h3>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-zinc-400 hover:text-red-400 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Vider
              </button>
            )}
          </div>

          {/* Cart Item List */}
          {cart.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-medium">Le panier de caisse est vide.</p>
              <p className="text-[11px] text-zinc-600 mt-1">
                Cliquez sur un article du catalogue pour l’ajouter au ticket.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {cart.map((line) => (
                <div
                  key={line.cartLineId}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <h5 className="font-bold text-white truncate">{line.equipment.name}</h5>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                      {line.size && (
                        <span className="px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                          {line.size}
                        </span>
                      )}
                      {line.color && (
                        <span className="px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                          {line.color}
                        </span>
                      )}
                      <span>·</span>
                      <span className="text-emerald-400 font-bold">
                        {formatCurrency(line.unitPrice, currency)}/u
                      </span>
                    </div>
                  </div>

                  {/* Quantity & Delete */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
                      <button
                        onClick={() => updateCartQuantity(line.cartLineId, -1)}
                        className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold text-xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center font-bold text-white text-xs">
                        {line.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(line.cartLineId, 1)}
                        disabled={line.quantity >= line.maxStock}
                        className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold text-xs disabled:opacity-30"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right w-16">
                      <span className="font-black text-white text-xs block">
                        {formatCurrency(line.quantity * line.unitPrice, currency)}
                      </span>
                    </div>

                    <button
                      onClick={() => removeFromCart(line.cartLineId)}
                      className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkout Form & Total */}
        <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
          {/* Total Row */}
          <div className="flex items-baseline justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-zinc-400">
              Total à Encaisser :
            </span>
            <span className="text-2xl font-black text-emerald-400">
              {formatCurrency(cartTotal, currency)}
            </span>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-4 gap-1">
            {[
              { id: 'cash', label: 'Espèces', icon: Banknote },
              { id: 'card', label: 'Carte', icon: CreditCard },
              { id: 'transfer', label: 'Virement', icon: Landmark },
              { id: 'autre', label: 'Autre', icon: CheckCircle },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`py-1.5 px-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-bold transition-colors ${
                    paymentMethod === m.id
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

          {/* Client & Notes */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="relative">
              <User className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Nom adhérent / client"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Note / Remarque"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || loading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>
              {loading ? 'Validation en cours...' : `Valider l'Encaissement (${formatCurrency(cartTotal, currency)})`}
            </span>
          </button>

          {/* Last Sale Receipt pill */}
          {lastSaleReceipt && (
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs flex items-center justify-between text-zinc-400">
              <div>
                <span className="font-bold text-white">Dernière vente réussie :</span>{' '}
                <span>
                  {lastSaleReceipt.items.length} article(s) pour {lastSaleReceipt.buyer} (
                  {formatCurrency(lastSaleReceipt.total, currency)})
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">{lastSaleReceipt.date}</span>
            </div>
          )}
        </div>
      </div>

      {/* VARIANT PICKER MODAL */}
      {pickingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl text-zinc-100 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white">{pickingItem.name}</h4>
                <p className="text-xs text-zinc-400">Choisir la taille et la couleur</p>
              </div>
              <button
                onClick={() => setPickingItem(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Size selection if has sizes */}
            {pickingItem.sizes && pickingItem.sizes.length > 1 && (
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Taille :
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {pickingItem.sizes.map((sz, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPickerSizeIndex(idx);
                        if (sz.colors.length > 0) {
                          setPickerColor(sz.colors[0].color);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        pickerSizeIndex === idx
                          ? 'bg-red-600 text-white'
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-300 hover:border-zinc-700'
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
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Couleur :
              </label>
              <div className="flex flex-wrap gap-1.5">
                {pickingItem.sizes?.[pickerSizeIndex]?.colors.map((c) => {
                  const isSelected = pickerColor === c.color;
                  return (
                    <button
                      key={c.color}
                      onClick={() => setPickerColor(c.color)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-300 hover:border-zinc-700'
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

            {/* Confirm add to cart */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
              <button
                onClick={() => setPickingItem(null)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handlePickerConfirm}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter au Ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
