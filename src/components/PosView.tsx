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
  Printer
} from 'lucide-react';
import { Equipment, EquipmentCategory } from '@/types/inventory';
import { formatCurrency, CurrencyCode, CURRENCY_CONFIG } from '@/lib/currency';

interface PosViewProps {
  equipment: Equipment[];
  currency: CurrencyCode;
  onRecordSale: (saleData: {
    equipmentId: string;
    quantity: number;
    unitPrice: number;
    buyerName: string;
    paymentMethod: 'cash' | 'card' | 'transfer' | 'autre';
    notes?: string;
  }) => Promise<void>;
}

interface CartItem {
  equipment: Equipment;
  quantity: number;
  unitPrice: number;
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

  // Filter available items
  const availableItems = useMemo(() => {
    return equipment.filter((item) => {
      if (item.stock <= 0) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          (item.brand || '').toLowerCase().includes(q) ||
          (item.size || '').toLowerCase().includes(q) ||
          (item.color || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [equipment, searchTerm, categoryFilter]);

  const addToCart = (item: Equipment) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.equipment.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) return prev; // Cannot exceed stock
        return prev.map((c) =>
          c.equipment.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { equipment: item, quantity: 1, unitPrice: item.sellingPrice }];
    });
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.equipment.id === id) {
            const nextQty = c.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > c.equipment.stock) return c;
            return { ...c, quantity: nextQty };
          }
          return c;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((c) => c.equipment.id !== id));
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
              {availableItems.length} article(s) disponibles
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher équipement (Venum 12oz, T9chira XL, Bandes 4.5m...)"
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
              onClick={() => addToCart(item)}
              className="text-left p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-red-500/60 hover:bg-zinc-850 transition-all flex flex-col justify-between group active:scale-95"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                  <span className="font-bold text-zinc-300">{item.brand}</span>
                  <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-white font-bold">
                    {item.stock} dispo
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-red-400 line-clamp-2">
                  {item.name}
                </h4>
                <div className="text-[11px] text-zinc-400 mt-1">
                  <span>{item.size}</span> • <span>{item.color}</span>
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

          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              <ShoppingCart className="w-10 h-10 mx-auto text-zinc-700 mb-2 opacity-50" />
              <p className="text-xs font-medium">Le panier est vide.</p>
              <p className="text-[11px] text-zinc-600 mt-1">
                Cliquez sur un article à gauche pour l’ajouter au ticket.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {cart.map((c) => (
                <div
                  key={c.equipment.id}
                  className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{c.equipment.name}</h4>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                      <span>{c.equipment.size}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">
                        {formatCurrency(c.unitPrice, currency)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-zinc-900 rounded-lg border border-zinc-800">
                      <button
                        onClick={() => updateCartQuantity(c.equipment.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-xs font-bold text-zinc-300 hover:text-white"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-white">
                        {c.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(c.equipment.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-xs font-bold text-zinc-300 hover:text-white"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right w-16">
                      <span className="text-xs font-bold text-white block">
                        {formatCurrency(c.quantity * c.unitPrice, currency)}
                      </span>
                    </div>

                    <button
                      onClick={() => removeFromCart(c.equipment.id)}
                      className="text-zinc-500 hover:text-red-400 p-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer & Payment Form */}
        <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Nom de l’Adhérent / Client
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Client comptant..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Mode de Règlement
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Espèces</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Carte</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                  paymentMethod === 'transfer'
                    ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>Virement</span>
              </button>
            </div>
          </div>

          {/* Total & Checkout button */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-zinc-400 font-semibold">Total à payer</span>
              <div className="text-2xl font-black text-emerald-400">
                {formatCurrency(cartTotal, currency)}
              </div>
            </div>
            <span className="text-xs text-zinc-400 font-semibold">
              {cart.reduce((sum, i) => sum + i.quantity, 0)} article(s)
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all disabled:opacity-40 active:scale-98"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{loading ? 'Encaissement en cours...' : 'Valider & Encaisser le Ticket'}</span>
          </button>
        </div>

        {/* Last Receipt Notification */}
        {lastSaleReceipt && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-xs text-emerald-300 flex items-center justify-between">
            <div>
              <span className="font-bold">✓ Vente validée ({lastSaleReceipt.date})</span>
              <div className="text-[11px] text-emerald-400/80">
                {lastSaleReceipt.buyer} • Total: {formatCurrency(lastSaleReceipt.total, currency)}
              </div>
            </div>
            <button
              onClick={() => setLastSaleReceipt(null)}
              className="text-xs text-emerald-400 hover:text-white"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
