'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Copy,
  ShoppingBag,
  LayoutGrid,
  List,
  Package,
  Layers,
  ArrowUpDown,
  X,
  PackagePlus,
  RotateCcw,
  Sparkles,
  HelpCircle,
  CheckSquare,
  Square,
  Tag,
  Percent,
  Boxes,
  Check,
  AlertCircle,
  ShoppingCart,
  ArrowRight,
} from 'lucide-react';
import { Equipment, EquipmentPack, CartItem, getPackAvailableStock } from '@/types/inventory';
import { formatCurrency, CurrencyCode, CURRENCY_CONFIG } from '@/lib/currency';
import { CATEGORY_CONFIG, getStockStatus, getColorSwatch } from '@/lib/categoryColors';

interface InventoryViewProps {
  equipment: Equipment[];
  packs?: EquipmentPack[];
  cart?: CartItem[];
  currency: CurrencyCode;
  onOpenAddModal: () => void;
  onOpenEditModal: (item: Equipment) => void;
  onOpenSaleModal: (item: Equipment) => void;
  onDuplicateItem: (item: Equipment) => void;
  onDeleteItem: (item: Equipment) => void;
  onAdjustStock: (
    id: string,
    delta: number,
    variant?: { size?: string; color?: string }
  ) => void;
  onOpenDeletionsHistory?: () => void;
  deletionsCount?: number;
  onOpenCreatePackModal?: (preselectedItems?: Equipment[]) => void;
  onOpenEditPackModal?: (pack: EquipmentPack) => void;
  onOpenSellPackModal?: (pack: EquipmentPack) => void;
  onDeletePack?: (pack: EquipmentPack) => void;
  // Cart Actions
  onAddToCart?: (
    item: Equipment,
    variant?: {
      size?: string;
      color?: string;
      quantity?: number;
      unitPrice?: number;
      maxStock?: number;
    }
  ) => void;
  onAddBatchToCart?: (items: Equipment[]) => void;
  onOpenCart?: () => void;
}

export default function InventoryView({
  equipment,
  packs = [],
  cart = [],
  currency,
  onOpenAddModal,
  onOpenEditModal,
  onOpenSaleModal,
  onDuplicateItem,
  onDeleteItem,
  onAdjustStock,
  onOpenDeletionsHistory,
  deletionsCount = 0,
  onOpenCreatePackModal,
  onOpenEditPackModal,
  onOpenSellPackModal,
  onDeletePack,
  onAddToCart,
  onAddBatchToCart,
  onOpenCart,
}: InventoryViewProps) {
  // Ensure portal mounts on client body
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Navigation between Items and Packs
  const [inventoryTab, setInventoryTab] = useState<'items' | 'packs'>('items');

  // Multi-select items for batch cart/pack
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Filter & Search states for Items
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<
    'name' | 'stock-desc' | 'stock-asc' | 'price-desc' | 'price-asc'
  >('stock-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Search state for Packs
  const [packSearchTerm, setPackSearchTerm] = useState('');

  // Quick Restock Variant modal state
  const [quickRestockState, setQuickRestockState] = useState<{
    item: Equipment;
    delta: number;
    sizeIdx: number;
    color: string;
  } | null>(null);

  // Quick Add-to-Cart Variant picker state (for items with multiple sizes/colors)
  const [cartPickingState, setCartPickingState] = useState<{
    item: Equipment;
    sizeIdx: number;
    color: string;
    quantity: number;
    customPrice: number;
  } | null>(null);

  const brandsList = useMemo(() => {
    const set = new Set<string>();
    equipment.forEach((item) => {
      if (item.brand) set.add(item.brand);
    });
    return Array.from(set).sort();
  }, [equipment]);

  // Filter individual equipment items
  const filteredItems = useMemo(() => {
    return equipment
      .filter((item) => {
        const itemStock = item.stock ?? 0;
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          const matchesName = item.name.toLowerCase().includes(q);
          const matchesBrand = (item.brand || '').toLowerCase().includes(q);
          const matchesModel = (item.model || '').toLowerCase().includes(q);
          const matchesBarcode = (item.barcode || '').toLowerCase().includes(q);
          const matchesVariants = item.sizes?.some(
            (s) =>
              (s.size || '').toLowerCase().includes(q) ||
              s.colors?.some((c) => c.color.toLowerCase().includes(q))
          );

          if (
            !matchesName &&
            !matchesBrand &&
            !matchesModel &&
            !matchesBarcode &&
            !matchesVariants
          ) {
            return false;
          }
        }
        if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
        if (selectedBrand !== 'all' && item.brand !== selectedBrand) return false;
        if (selectedStockStatus === 'in_stock' && itemStock <= (item.minStockAlert || 3))
          return false;
        if (
          selectedStockStatus === 'low_stock' &&
          (itemStock === 0 || itemStock > (item.minStockAlert || 3))
        )
          return false;
        if (selectedStockStatus === 'out_of_stock' && itemStock > 0) return false;
        return true;
      })
      .sort((a, b) => {
        const aStock = a.stock ?? 0;
        const bStock = b.stock ?? 0;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'stock-desc') return bStock - aStock;
        if (sortBy === 'stock-asc') return aStock - bStock;
        if (sortBy === 'price-desc') return b.sellingPrice - a.sellingPrice;
        if (sortBy === 'price-asc') return a.sellingPrice - b.sellingPrice;
        return 0;
      });
  }, [equipment, searchTerm, selectedCategory, selectedBrand, selectedStockStatus, sortBy]);

  // Filter packs
  const filteredPacks = useMemo(() => {
    if (!packs || packs.length === 0) return [];
    if (!packSearchTerm) return packs;
    const q = packSearchTerm.toLowerCase();
    return packs.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = (p.description || '').toLowerCase().includes(q);
      const matchBarcode = (p.barcode || '').toLowerCase().includes(q);
      const matchItem = p.items.some(
        (it) =>
          it.equipmentName.toLowerCase().includes(q) ||
          (it.brand || '').toLowerCase().includes(q)
      );
      return matchName || matchDesc || matchBarcode || matchItem;
    });
  }, [packs, packSearchTerm]);

  const totalFilteredUnits = useMemo(
    () => filteredItems.reduce((acc, i) => acc + (i.stock ?? 0), 0),
    [filteredItems]
  );

  const baseCategoryKeys = [
    'gants',
    'protege_tibias',
    'bandes',
    'protege_dents',
    'coquilles',
    'protections',
    'textile',
    'tenue_competition',
    'pantalon_combat',
    'textile_competition',
    'short_combat',
    'tenue_entrainement',
    'autres',
  ];

  const categoryPills = [
    { id: 'all', label: 'Tous les articles', icon: '🥊' },
    ...baseCategoryKeys
      .filter((id) => CATEGORY_CONFIG[id])
      .map((id) => ({
        id,
        label: CATEGORY_CONFIG[id].label,
        icon: CATEGORY_CONFIG[id].icon || '⚡',
      })),
  ];

  // Helper when clicking quick restock on card
  const handleOpenRestockModal = (item: Equipment, initialDelta: number = 10) => {
    const sizes = item.sizes || [];
    const firstColor = sizes[0]?.colors?.[0]?.color || '';
    setQuickRestockState({
      item,
      delta: initialDelta,
      sizeIdx: 0,
      color: firstColor,
    });
  };

  const confirmQuickRestock = () => {
    if (!quickRestockState) return;
    const { item, delta, sizeIdx, color } = quickRestockState;
    if (delta <= 0) return;
    const chosenSize = item.sizes?.[sizeIdx]?.size;
    onAdjustStock(item.id, delta, { size: chosenSize, color });
    setQuickRestockState(null);
  };

  // Quick Add to Cart trigger from card or table
  const handleQuickAddToCart = (item: Equipment) => {
    if (!onAddToCart) return;
    const sizes = item.sizes || [];

    // If item only has 1 size and 1 color, add directly in 1 click
    if (sizes.length === 1 && sizes[0].colors.length === 1) {
      const singleSize = sizes[0].size;
      const singleColor = sizes[0].colors[0].color;
      const singleStock = sizes[0].colors[0].quantity;
      if (singleStock > 0) {
        onAddToCart(item, {
          size: singleSize,
          color: singleColor,
          quantity: 1,
          unitPrice: item.sellingPrice,
          maxStock: singleStock,
        });
        return;
      }
    }

    // Otherwise open the quick variant & price picker modal
    const firstColor = sizes[0]?.colors?.[0]?.color || '';
    setCartPickingState({
      item,
      sizeIdx: 0,
      color: firstColor,
      quantity: 1,
      customPrice: item.sellingPrice || 0,
    });
  };

  const confirmCartPicking = () => {
    if (!cartPickingState || !onAddToCart) return;
    const { item, sizeIdx, color, quantity, customPrice } = cartPickingState;
    const sizeVariant = item.sizes?.[sizeIdx];
    const colorEntry = sizeVariant?.colors.find((c) => c.color === color);
    const stock = colorEntry?.quantity || 0;

    if (stock > 0) {
      onAddToCart(item, {
        size: sizeVariant?.size,
        color,
        quantity: Math.min(quantity, stock),
        unitPrice: customPrice,
        maxStock: stock,
      });
    }
    setCartPickingState(null);
  };

  // Selection handlers
  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedItemIds(new Set(filteredItems.map((i) => i.id)));
  };

  const clearSelection = () => {
    setSelectedItemIds(new Set());
  };

  const handleCreatePackFromSelection = () => {
    const selected = equipment.filter((i) => selectedItemIds.has(i.id));
    if (onOpenCreatePackModal) {
      onOpenCreatePackModal(selected);
    }
    clearSelection();
  };

  const handleAddSelectionToCart = () => {
    const selected = equipment.filter((i) => selectedItemIds.has(i.id));
    if (onAddBatchToCart) {
      onAddBatchToCart(selected);
    } else if (onAddToCart) {
      selected.forEach((item) => {
        const sizes = item.sizes || [];
        const firstSize = sizes[0]?.size;
        const firstColor = sizes[0]?.colors?.[0]?.color;
        const maxStock = sizes[0]?.colors?.[0]?.quantity || item.stock || 1;
        onAddToCart(item, {
          size: firstSize,
          color: firstColor,
          quantity: 1,
          unitPrice: item.sellingPrice,
          maxStock,
        });
      });
    }
    clearSelection();
  };

  const totalCartUnits = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return (
    <div className="space-y-6 animate-fadeIn text-slate-900 pb-20">
      {/* 1. Header with direct actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>📦 Mon Stock & Panier</span>
            <span className="text-xs px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold border border-blue-200">
              {equipment.length} article(s) · {packs.length} pack(s)
            </span>
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Gérez vos équipements, ajoutez-les au <strong className="text-emerald-700 font-bold">Panier</strong> pour vendre plusieurs articles en 1 étape, ou créez des packs groupés.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Corbeille */}
          {onOpenDeletionsHistory && (
            <button
              onClick={onOpenDeletionsHistory}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-xs border border-slate-200 transition-colors shadow-sm cursor-pointer"
              title="Consulter les articles supprimés"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Corbeille</span>
              {deletionsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-xs font-black">
                  {deletionsCount}
                </span>
              )}
            </button>
          )}

          {/* Quick Cart button in inventory header */}
          {onOpenCart && (
            <button
              onClick={onOpenCart}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 cursor-pointer border ${
                cart.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
              }`}
              title="Ouvrir le panier de vente"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Panier ({totalCartUnits})</span>
            </button>
          )}

          {/* New Pack Button */}
          <button
            onClick={() => onOpenCreatePackModal?.()}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer"
            title="Créer un pack regroupant plusieurs articles"
          >
            <Boxes className="w-4 h-4 stroke-[2.5]" />
            <span>Nouveau Pack</span>
          </button>

          {/* New Item Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nouveau Matériel</span>
          </button>
        </div>
      </div>

      {/* Main Tabs: Articles Individuels vs Packs & Formules */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInventoryTab('items')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${
              inventoryTab === 'items'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-600'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>🥊 Articles Individuels</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-black ${
                inventoryTab === 'items'
                  ? 'bg-blue-800 text-blue-100'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {filteredItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setInventoryTab('packs')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${
              inventoryTab === 'packs'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-600'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Packs & Lots Groupés</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-black ${
                inventoryTab === 'packs'
                  ? 'bg-indigo-800 text-indigo-100'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {packs.length}
            </span>
            {packs.length > 0 && (
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-black rounded bg-emerald-500 text-white">
                Formules
              </span>
            )}
          </button>
        </div>

        {/* View Mode switcher (only when on items tab) */}
        {inventoryTab === 'items' && (
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Affichage Cartes"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Cartes</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Affichage Tableau"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Tableau</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INDIVIDUAL ITEMS VIEW                                              */}
      {/* ========================================================================= */}
      {inventoryTab === 'items' && (
        <div className="space-y-6">
          {/* Search & Category Filters */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5 space-y-4">
            {/* Big Search Input */}
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Taper ici pour chercher : nom, taille (12oz, M, L) ou couleur (Noir, Rouge, Or)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-10 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-medium transition-all shadow-inner"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Visual Category Buttons */}
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-2">
                Filtrer par catégorie :
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
                {categoryPills.map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setSelectedCategory(pill.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all border cursor-pointer ${
                      selectedCategory === pill.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                        : 'bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-100 shadow-sm'
                    }`}
                  >
                    <span>{pill.icon}</span>
                    <span>{pill.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Secondary filters row */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200 flex-wrap">
              {/* Stock status pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-500 mr-1">Statut :</span>
                {[
                  { id: 'all', label: 'Tous' },
                  { id: 'in_stock', label: '🟢 En stock' },
                  { id: 'low_stock', label: '🟡 Bientôt épuisé' },
                  { id: 'out_of_stock', label: '🔴 Rupture' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStockStatus(s.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      selectedStockStatus === s.id
                        ? 'bg-blue-50 text-blue-700 border-blue-300 font-black shadow-sm ring-1 ring-blue-400/20'
                        : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200 shadow-sm'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Trier par :</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-600 cursor-pointer shadow-sm"
                >
                  <option value="stock-desc">Plus de stock en premier</option>
                  <option value="stock-asc">Moins de stock en premier</option>
                  <option value="name">Nom alphabétique (A-Z)</option>
                  <option value="price-desc">Prix (Plus cher)</option>
                  <option value="price-asc">Prix (Moins cher)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick selection hint */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                Cochez des articles pour les ajouter groupés au <strong>Panier</strong> ou créer un <strong>Pack</strong>.
              </span>
            </span>
            {selectedItemIds.size > 0 && (
              <button
                type="button"
                onClick={clearSelection}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
              >
                Désélectionner tout ({selectedItemIds.size})
              </button>
            )}
          </div>

          {/* Empty State */}
          {filteredItems.length === 0 ? (
            <div className="rounded-3xl bg-white border border-slate-200 p-12 text-center text-slate-500 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5">
              <Package className="w-14 h-14 mx-auto mb-3 opacity-30 text-slate-400" />
              <h3 className="text-base font-bold text-slate-900">Aucun matériel trouvé</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Aucun article ne correspond à votre recherche actuelle.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedBrand('all');
                  setSelectedStockStatus('all');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-blue-500/20 cursor-pointer"
              >
                Effacer les filtres et tout réafficher
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* PRODUCT CARDS */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const itemStock = item.stock ?? 0;
                const status = getStockStatus(itemStock, item.minStockAlert || 3);
                const categoryLabel = CATEGORY_CONFIG[item.category]?.badge || 'Matériel';
                const isSelected = selectedItemIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    className={`bg-white border rounded-3xl p-5 flex flex-col justify-between transition-all shadow-md group relative ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-indigo-100'
                        : 'border-slate-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-0.5 shadow-slate-200/80 ring-1 ring-slate-900/5'
                    }`}
                  >
                    <div>
                      {/* Category & Status & Selection Checkbox */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectItem(item.id);
                            }}
                            className={`p-1 rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-slate-300'
                            }`}
                            title={isSelected ? 'Retirer de la sélection' : 'Sélectionner cet article'}
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-white" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>

                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 shadow-sm truncate max-w-[130px]">
                            {item.brand ? `${item.brand} · ${categoryLabel}` : categoryLabel}
                          </span>
                        </div>

                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider shadow-sm shrink-0 ${status.badgeClass}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      {/* Title & Model */}
                      <h3 className="text-base font-black text-slate-900 line-clamp-2 leading-snug">
                        {item.name}
                      </h3>
                      {item.model && (
                        <span className="text-xs text-slate-500 block mt-0.5 font-medium">
                          Modèle : {item.model}
                        </span>
                      )}

                      {/* Stock Count Display */}
                      <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                            Quantité restante
                          </span>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className={`text-2xl font-black ${status.textClass}`}>
                              {itemStock}
                            </span>
                            <span className="text-xs text-slate-600 font-bold">pièces</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                            Prix adhérent
                          </span>
                          <span className="text-base font-black text-blue-600 mt-0.5 block">
                            {item.sellingPrice > 0
                              ? formatCurrency(item.sellingPrice, currency)
                              : 'Non fixé'}
                          </span>
                        </div>
                      </div>

                      {/* Sizes & Colors Preview */}
                      <div className="mt-3 space-y-1.5">
                        <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                          Tailles & Couleurs disponibles :
                        </span>
                        <div className="space-y-1.5 max-h-28 overflow-y-auto pr-0.5">
                          {item.sizes && item.sizes.length > 0 ? (
                            item.sizes.map((sz, sIdx) => (
                              <div key={sIdx} className="text-xs flex flex-wrap items-center gap-1.5">
                                {sz.size && sz.size !== 'Unique' && (
                                  <span className="font-black text-blue-700 text-xs">
                                    {sz.size}:
                                  </span>
                                )}
                                <div className="flex flex-wrap gap-1.5">
                                  {sz.colors.map((c, cIdx) => (
                                    <span
                                      key={cIdx}
                                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium shadow-sm"
                                      title={`${c.color} - ${c.quantity} pcs`}
                                    >
                                      <span
                                        className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0"
                                        style={{ background: getColorSwatch(c.color) }}
                                      />
                                      <span>{c.color}</span>
                                      <strong className="text-slate-900 font-bold">({c.quantity})</strong>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500 italic">Taille unique</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ACTION BUTTONS (VENDRE / + PANIER / + STOCK) */}
                    <div className="mt-5 pt-3.5 border-t border-slate-200 space-y-2">
                      <div className="grid grid-cols-3 gap-1.5">
                        {/* Big Green Vendre Button */}
                        <button
                          onClick={() => onOpenSaleModal(item)}
                          disabled={itemStock <= 0}
                          className="py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          title="Vente directe"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                          <span>Vendre</span>
                        </button>

                        {/* + Panier Button (User Request: Add to Cart to group and sell multiple items) */}
                        <button
                          onClick={() => handleQuickAddToCart(item)}
                          disabled={itemStock <= 0}
                          className="py-2 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 font-black text-xs flex items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
                          title="Ajouter au Panier pour vendre avec d'autres articles"
                        >
                          <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                          <span>+ Panier</span>
                        </button>

                        {/* + Stock Button */}
                        <button
                          onClick={() => handleOpenRestockModal(item, 10)}
                          className="py-2 px-2 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm cursor-pointer"
                          title="Ajouter du stock"
                        >
                          <PackagePlus className="w-3.5 h-3.5 shrink-0" />
                          <span>+ Stock</span>
                        </button>
                      </div>

                      {/* Secondary clean action bar */}
                      <div className="flex items-center justify-between text-xs pt-1 px-1">
                        <button
                          onClick={() => onOpenEditModal(item)}
                          className="text-slate-500 hover:text-slate-900 flex items-center gap-1 font-bold py-1 px-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Modifier les informations"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Modifier</span>
                        </button>

                        <button
                          onClick={() => onDuplicateItem(item)}
                          className="text-slate-500 hover:text-slate-900 flex items-center gap-1 font-bold py-1 px-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Créer une copie"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier</span>
                        </button>

                        <button
                          onClick={() => onDeleteItem(item)}
                          className="text-slate-400 hover:text-rose-600 flex items-center gap-1 font-bold py-1 px-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Supprimer l'article"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-lg shadow-slate-200/80 ring-1 ring-slate-900/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-300 bg-slate-100/80 text-xs font-black text-slate-700 uppercase tracking-wider">
                      <th className="py-4 px-3 border-r border-slate-200/80 text-center w-10">
                        <input
                          type="checkbox"
                          checked={
                            filteredItems.length > 0 &&
                            filteredItems.every((i) => selectedItemIds.has(i.id))
                          }
                          onChange={(e) => {
                            if (e.target.checked) selectAllFiltered();
                            else clearSelection();
                          }}
                          className="rounded text-indigo-600 cursor-pointer"
                          title="Tout sélectionner / désélectionner"
                        />
                      </th>
                      <th className="py-4 px-4 border-r border-slate-200/80">Article</th>
                      <th className="py-4 px-3 border-r border-slate-200/80">Marque</th>
                      <th className="py-4 px-3 border-r border-slate-200/80">Tailles & Couleurs</th>
                      <th className="py-4 px-3 border-r border-slate-200/80">Stock Restant</th>
                      <th className="py-4 px-3 border-r border-slate-200/80">Prix de Vente</th>
                      <th className="py-4 px-3 border-r border-slate-200/80">Statut</th>
                      <th className="py-4 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-200 text-xs text-slate-800">
                    {filteredItems.map((item) => {
                      const itemStock = item.stock ?? 0;
                      const status = getStockStatus(itemStock, item.minStockAlert || 3);
                      const isSelected = selectedItemIds.has(item.id);

                      return (
                        <tr
                          key={item.id}
                          className={`border-b-2 border-slate-200 transition-colors ${
                            isSelected ? 'bg-indigo-50/60' : 'hover:bg-blue-50/40'
                          }`}
                        >
                          <td className="py-4 px-3 text-center border-r border-slate-200/60">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectItem(item.id)}
                              className="rounded text-indigo-600 cursor-pointer w-4 h-4"
                            />
                          </td>
                          <td className="py-4 px-4 border-r border-slate-200/60">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">{item.name}</div>
                            {item.model && (
                              <div className="text-xs text-slate-500 font-medium">Modèle: {item.model}</div>
                            )}
                          </td>
                          <td className="py-4 px-3 text-slate-700 font-bold border-r border-slate-200/60">{item.brand || '—'}</td>
                          <td className="py-4 px-3 border-r border-slate-200/60">
                            <div className="space-y-1">
                              {item.sizes?.map((sz, i) => (
                                <div key={i} className="text-xs flex flex-wrap items-center gap-1.5">
                                  {sz.size && sz.size !== 'Unique' && (
                                    <strong className="text-blue-700 mr-1">{sz.size}:</strong>
                                  )}
                                  <div className="flex flex-wrap gap-1">
                                    {sz.colors.map((c, cIdx) => (
                                      <span
                                        key={cIdx}
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium shadow-sm"
                                      >
                                        <span
                                          className="w-2 h-2 rounded-full border border-slate-300"
                                          style={{ background: getColorSwatch(c.color) }}
                                        />
                                        <span>{c.color}</span>
                                        <strong className="text-slate-900 ml-0.5">({c.quantity})</strong>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 px-3 border-r border-slate-200/60">
                            <div className="flex items-center gap-2">
                              <span className={`font-black text-sm ${status.textClass}`}>
                                {itemStock} pcs
                              </span>
                              <button
                                onClick={() => handleOpenRestockModal(item, 10)}
                                className="px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 text-xs font-bold transition-colors cursor-pointer shadow-sm"
                                title="Ajouter du stock"
                              >
                                + Stock
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-3 border-r border-slate-200/60">
                            {item.sellingPrice > 0 ? (
                              <span className="font-bold text-blue-700 text-sm">
                                {formatCurrency(item.sellingPrice, currency)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 font-semibold">Non fixé</span>
                            )}
                          </td>
                          <td className="py-4 px-3 border-r border-slate-200/60">
                            <span
                              className={`px-2.5 py-0.5 rounded-lg text-xs font-black border uppercase shadow-sm ${status.badgeClass}`}
                            >
                              {status.label}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Vendre */}
                              <button
                                onClick={() => onOpenSaleModal(item)}
                                disabled={itemStock <= 0}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-30 cursor-pointer"
                              >
                                Vendre
                              </button>

                              {/* + Panier */}
                              <button
                                onClick={() => handleQuickAddToCart(item)}
                                disabled={itemStock <= 0}
                                className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 font-bold text-xs transition-colors disabled:opacity-30 cursor-pointer shadow-xs flex items-center gap-1"
                                title="Ajouter au panier de vente groupée"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span className="hidden xl:inline">+ Panier</span>
                              </button>

                              <button
                                onClick={() => onOpenEditModal(item)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer shadow-sm"
                                title="Modifier"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteItem(item)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 border border-slate-200 cursor-pointer shadow-sm"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PACKS & GROUPED BUNDLES VIEW                                       */}
      {/* ========================================================================= */}
      {inventoryTab === 'packs' && (
        <div className="space-y-6">
          {/* Informational Banner */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  Formules & Lots Personnalisés
                </h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Regroupez plusieurs matériels dans un pack (ex : <strong>Pack Adhérent Débutant</strong> avec Gants + Bandes + Protège-dents) et <strong>ajustez le tarif individuel de chaque élément</strong> pour afficher la remise exacte.
                </p>
              </div>
            </div>

            <button
              onClick={() => onOpenCreatePackModal?.()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer self-end sm:self-center"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Créer un Pack</span>
            </button>
          </div>

          {/* Search bar for packs */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={packSearchTerm}
              onChange={(e) => setPackSearchTerm(e.target.value)}
              placeholder="🔍 Chercher un pack par nom, description ou matériel inclus..."
              className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
            />
            {packSearchTerm && (
              <button
                onClick={() => setPackSearchTerm('')}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Empty state if no packs */}
          {packs.length === 0 ? (
            <div className="rounded-3xl bg-white border border-slate-200 p-12 text-center text-slate-500 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5">
              <Boxes className="w-16 h-16 mx-auto mb-4 text-indigo-400 opacity-60" />
              <h3 className="text-base font-black text-slate-900">
                Aucun pack créé pour le moment
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                Les packs vous permettent d'associer plusieurs équipements de votre stock en un seul lot avec une réduction globale ou par article.
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  onClick={() => onOpenCreatePackModal?.()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-500/20 active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <PackagePlus className="w-4 h-4" />
                  <span>Créer mon premier Pack</span>
                </button>
              </div>
            </div>
          ) : filteredPacks.length === 0 ? (
            <div className="rounded-3xl bg-white border border-slate-200 p-8 text-center text-slate-500 shadow-sm">
              <Search className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-800">Aucun pack ne correspond à votre recherche</h3>
              <button
                onClick={() => setPackSearchTerm('')}
                className="mt-3 text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                Effacer la recherche
              </button>
            </div>
          ) : (
            /* PACKS GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPacks.map((pack) => {
                const availableStock = getPackAvailableStock(pack, equipment);
                const isOutOfStock = availableStock <= 0;

                return (
                  <div
                    key={pack.id}
                    className="bg-white border-2 border-indigo-100 hover:border-indigo-400 rounded-3xl p-5 shadow-md shadow-indigo-100/50 flex flex-col justify-between transition-all hover:shadow-xl hover:-translate-y-0.5 group"
                  >
                    <div className="space-y-4">
                      {/* Pack Title & Stock Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                              📦 Pack Groupé
                            </span>
                            {pack.barcode && (
                              <span className="text-[10px] font-bold text-slate-500 font-mono">
                                #{pack.barcode}
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-black text-slate-900 leading-snug">
                            {pack.name}
                          </h3>
                        </div>

                        {/* Stock badge */}
                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-xl border shrink-0 uppercase tracking-wider ${
                            isOutOfStock
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : availableStock <= 2
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {isOutOfStock
                            ? '🔴 Rupture'
                            : `🟢 ${availableStock} réalisable${availableStock > 1 ? 's' : ''}`}
                        </span>
                      </div>

                      {pack.description && (
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {pack.description}
                        </p>
                      )}

                      {/* Items list with custom pack prices */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                          Composition du Pack ({pack.items.length} articles) :
                        </span>

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
                          {pack.items.map((it, idx) => {
                            const discountPerItem = it.originalPrice - it.packPrice;

                            return (
                              <div
                                key={idx}
                                className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-black text-[11px]">
                                      {it.quantity}x
                                    </span>
                                    <span className="truncate">{it.equipmentName}</span>
                                  </div>
                                  {(it.size || it.color) && (
                                    <div className="text-[10px] text-slate-500 mt-0.5">
                                      {[it.size, it.color].filter(Boolean).join(' · ')}
                                    </div>
                                  )}
                                </div>

                                <div className="text-right shrink-0">
                                  <div className="flex items-center gap-1.5 justify-end">
                                    {discountPerItem > 0 && (
                                      <span className="text-[11px] line-through text-slate-400">
                                        {formatCurrency(it.originalPrice, currency)}
                                      </span>
                                    )}
                                    <span className="font-black text-indigo-700 text-xs">
                                      {formatCurrency(it.packPrice, currency)}
                                    </span>
                                  </div>
                                  {discountPerItem > 0 && (
                                    <span className="text-[9px] font-bold text-emerald-600 block">
                                      -{formatCurrency(discountPerItem, currency)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Total Price & Discount Summary */}
                      <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                            Prix Total du Pack
                          </span>
                          <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-xl font-black text-indigo-900">
                              {formatCurrency(pack.totalPackPrice, currency)}
                            </span>
                            {pack.discountAmount > 0 && (
                              <span className="text-xs line-through text-slate-400 font-bold">
                                {formatCurrency(pack.totalOriginalPrice, currency)}
                              </span>
                            )}
                          </div>
                        </div>

                        {pack.discountAmount > 0 && (
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
                              <Percent className="w-3 h-3" />
                              <span>-{pack.discountPercentage}%</span>
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
                              Économie: {formatCurrency(pack.discountAmount, currency)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 pt-3.5 border-t border-slate-200 space-y-2">
                      {/* Vendre Pack Button */}
                      <button
                        onClick={() => onOpenSellPackModal?.(pack)}
                        disabled={isOutOfStock}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4 shrink-0" />
                        <span>Vendre ce Pack ({formatCurrency(pack.totalPackPrice, currency)})</span>
                      </button>

                      {/* Edit & Delete bar */}
                      <div className="flex items-center justify-between text-xs pt-1 px-1">
                        <button
                          onClick={() => onOpenEditPackModal?.(pack)}
                          className="text-slate-600 hover:text-indigo-700 flex items-center gap-1.5 font-bold py-1 px-2 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Modifier les éléments ou les prix du pack"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Modifier le Pack</span>
                        </button>

                        <button
                          onClick={() => onDeletePack?.(pack)}
                          className="text-slate-400 hover:text-rose-600 flex items-center gap-1 font-bold py-1 px-2 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Supprimer ce pack"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Floating Action Bar when 1 or more items are selected */}
      {selectedItemIds.size > 0 && inventoryTab === 'items' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-slideUp border border-slate-700 max-w-xl w-[94%] sm:w-auto">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-sm">
              {selectedItemIds.size}
            </span>
            <span className="text-xs sm:text-sm font-bold">
              article(s) sélectionné(s)
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto flex-wrap sm:flex-nowrap">
            {/* Direct Add Selection to Cart (Batch Sale) */}
            <button
              type="button"
              onClick={handleAddSelectionToCart}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
              title="Ajouter la sélection au Panier pour vendre tout en 1 étape"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>+ Panier ({selectedItemIds.size})</span>
            </button>

            {/* Create Pack with Selection */}
            <button
              type="button"
              onClick={handleCreatePackFromSelection}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
              title="Créer un pack réutilisable avec cette sélection"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Créer un Pack</span>
            </button>

            <button
              type="button"
              onClick={clearSelection}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Annuler la sélection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Bottom Cart Pill (when cart has items and no items checked) */}
      {selectedItemIds.size === 0 && cart && cart.length > 0 && onOpenCart && (
        <div className="fixed bottom-6 right-6 z-40 animate-slideUp">
          <button
            type="button"
            onClick={onOpenCart}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-600/30 ring-2 ring-emerald-400/40 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>
              Mon Panier ({totalCartUnits} pcs · {formatCurrency(totalCartPrice, currency)})
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* QUICK ADD-TO-CART VARIANT & PRICE PICKER MODAL (Rendered via Portal: Centered in active viewable screen) */}
      {cartPickingState && mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border-2 border-indigo-200 rounded-3xl w-full max-w-lg shadow-2xl text-slate-900 animate-scaleUp overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh]">
            {/* Modal Header: Sticky at top with Item Model prominently visible */}
            <div className="flex items-start justify-between border-b border-slate-200 p-4 sm:p-5 bg-gradient-to-r from-indigo-50/70 to-slate-50 shrink-0 gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-md shadow-indigo-500/20">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-xs">
                      {cartPickingState.item.brand || 'Matériel'}
                    </span>
                    {/* USER REQUEST: Model clearly visible at the top */}
                    {cartPickingState.item.model && (
                      <span className="text-[11px] font-black text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300 shadow-xs">
                        Modèle : {cartPickingState.item.model}
                      </span>
                    )}
                    {cartPickingState.item.barcode && (
                      <span className="text-[10px] font-mono text-slate-500">
                        #{cartPickingState.item.barcode}
                      </span>
                    )}
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Stock: {cartPickingState.item.stock ?? 0} pcs
                    </span>
                  </div>

                  <h4 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                    {cartPickingState.item.name}
                  </h4>
                  <p className="text-xs text-indigo-700 font-bold mt-0.5">
                    Ajout au Panier de vente groupée
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCartPickingState(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Scrollable if tall on mobile */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Sizes selection */}
              {cartPickingState.item.sizes && cartPickingState.item.sizes.length > 1 && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                    1. Choisir la taille :
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {cartPickingState.item.sizes.map((sz, idx) => {
                      const isSelected = cartPickingState.sizeIdx === idx;
                      const sizeTotal = (sz.colors || []).reduce((acc, c) => acc + (Number(c.quantity) || 0), 0);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const newFirstColor = sz.colors[0]?.color || '';
                            setCartPickingState({
                              ...cartPickingState,
                              sizeIdx: idx,
                              color: newFirstColor,
                            });
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
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
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                  {cartPickingState.item.sizes && cartPickingState.item.sizes.length > 1
                    ? '2. Choisir la couleur :'
                    : '1. Choisir la couleur :'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {cartPickingState.item.sizes?.[cartPickingState.sizeIdx]?.colors.map((c) => {
                    const isSelected = cartPickingState.color === c.color;
                    return (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() =>
                          setCartPickingState({
                            ...cartPickingState,
                            color: c.color,
                          })
                        }
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-400 shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0"
                          style={{ background: getColorSwatch(c.color) }}
                        />
                        <span>{c.color}</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-200 text-xs font-bold text-slate-800">
                          {c.quantity} dispo
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity and Custom Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                    Quantité à ajouter :
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCartPickingState((prev) =>
                          prev ? { ...prev, quantity: Math.max(1, prev.quantity - 1) } : null
                        )
                      }
                      className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-sm flex items-center justify-center cursor-pointer transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={cartPickingState.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setCartPickingState((prev) => (prev ? { ...prev, quantity: Math.max(1, val) } : null));
                      }}
                      className="w-16 text-center font-black text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-xl py-2 text-base"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setCartPickingState((prev) =>
                          prev ? { ...prev, quantity: prev.quantity + 1 } : null
                        )
                      }
                      className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-sm flex items-center justify-center cursor-pointer transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                      Prix de vente unitaire :
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Normal : {formatCurrency(cartPickingState.item.sellingPrice, currency)}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={cartPickingState.customPrice}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setCartPickingState((prev) => (prev ? { ...prev, customPrice: val } : null));
                      }}
                      className="w-full bg-slate-50 border-2 border-indigo-300 rounded-xl pl-3 pr-14 py-2 text-base font-black text-indigo-900 focus:outline-none focus:border-indigo-600 shadow-inner"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 pointer-events-none">
                      {CURRENCY_CONFIG[currency]?.symbol || currency}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer: Sticky at bottom */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => setCartPickingState(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmCartPicking}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>
                  Ajouter au Panier ({formatCurrency(cartPickingState.quantity * cartPickingState.customPrice, currency)})
                </span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* FRIENDLY RESTOCK MODAL (Rendered via Portal: Centered in active viewable screen) */}
      {quickRestockState && mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border-2 border-blue-200 rounded-3xl w-full max-w-lg shadow-2xl text-slate-900 animate-scaleUp overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh]">
            <div className="flex items-start justify-between border-b border-slate-200 p-4 sm:p-5 bg-gradient-to-r from-blue-50/70 to-slate-50 shrink-0 gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-md shadow-blue-500/20">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-xs">
                      {quickRestockState.item.brand || 'Matériel'}
                    </span>
                    {quickRestockState.item.model && (
                      <span className="text-[11px] font-black text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300 shadow-xs">
                        Modèle : {quickRestockState.item.model}
                      </span>
                    )}
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                    {quickRestockState.item.name}
                  </h4>
                  <p className="text-xs text-blue-700 font-bold mt-0.5">
                    Ajouter du Stock
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickRestockState(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quantity stepper with quick shortcuts */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                Combien de pièces voulez-vous ajouter ?
              </label>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setQuickRestockState((prev) =>
                      prev ? { ...prev, delta: Math.max(1, prev.delta - 1) } : null
                    )
                  }
                  className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-lg border border-slate-300 flex items-center justify-center transition-colors"
                >
                  -1
                </button>

                <div className="flex-1">
                  <input
                    type="number"
                    min="1"
                    value={quickRestockState.delta}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setQuickRestockState((prev) =>
                        prev ? { ...prev, delta: Math.max(1, val) } : null
                      );
                    }}
                    className="w-full bg-slate-50 border-2 border-blue-400 rounded-2xl py-2.5 text-center text-xl font-black text-blue-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setQuickRestockState((prev) =>
                      prev ? { ...prev, delta: prev.delta + 1 } : null
                    )
                  }
                  className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-lg border border-slate-300 flex items-center justify-center transition-colors"
                >
                  +1
                </button>
              </div>

              {/* Booster buttons */}
              <div className="flex items-center gap-1.5 flex-wrap pt-2.5">
                <span className="text-xs font-bold text-slate-500 mr-1">Raccourcis :</span>
                {[5, 10, 20, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() =>
                      setQuickRestockState((prev) => (prev ? { ...prev, delta: amt } : null))
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      quickRestockState.delta === amt
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Size selection if multiple */}
            {quickRestockState.item.sizes && quickRestockState.item.sizes.length > 1 && (
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                  Taille concernée :
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {quickRestockState.item.sizes.map((sz, idx) => {
                    const isSelected = quickRestockState.sizeIdx === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const newFirstColor = sz.colors[0]?.color || '';
                          setQuickRestockState({
                            ...quickRestockState,
                            sizeIdx: idx,
                            color: newFirstColor,
                          });
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {sz.size || 'Unique'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color selection */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Couleur :
              </label>
              <div className="flex flex-wrap gap-1.5">
                {quickRestockState.item.sizes?.[quickRestockState.sizeIdx]?.colors.map((c) => {
                  const isSelected = quickRestockState.color === c.color;
                  return (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() =>
                        setQuickRestockState({
                          ...quickRestockState,
                          color: c.color,
                        })
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 border-blue-400 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0"
                        style={{ background: getColorSwatch(c.color) }}
                      />
                      <span>{c.color}</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-200 text-xs font-bold text-slate-800">
                        {c.quantity} pcs actuelles
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setQuickRestockState(null)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmQuickRestock}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
              >
                Valider l'ajout (+{quickRestockState.delta} pcs)
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
