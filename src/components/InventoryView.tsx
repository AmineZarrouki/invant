'use client';

import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { Equipment } from '@/types/inventory';
import { formatCurrency, CurrencyCode } from '@/lib/currency';
import { CATEGORY_CONFIG, getStockStatus, getColorSwatch } from '@/lib/categoryColors';

interface InventoryViewProps {
  equipment: Equipment[];
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
}

export default function InventoryView({
  equipment,
  currency,
  onOpenAddModal,
  onOpenEditModal,
  onOpenSaleModal,
  onDuplicateItem,
  onDeleteItem,
  onAdjustStock,
  onOpenDeletionsHistory,
  deletionsCount = 0,
}: InventoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<
    'name' | 'stock-desc' | 'stock-asc' | 'price-desc' | 'price-asc'
  >('stock-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Quick Restock Variant modal state with custom quantity support
  const [quickRestockState, setQuickRestockState] = useState<{
    item: Equipment;
    delta: number;
    sizeIdx: number;
    color: string;
  } | null>(null);

  const brandsList = useMemo(() => {
    const set = new Set<string>();
    equipment.forEach((item) => {
      if (item.brand) set.add(item.brand);
    });
    return Array.from(set).sort();
  }, [equipment]);

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

  return (
    <div className="space-y-6 animate-fadeIn text-slate-900">
      {/* 1. Header with direct actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>📦 Mon Stock de Matériel</span>
            <span className="text-xs px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold border border-blue-200">
              {filteredItems.length} article(s) · {totalFilteredUnits} pcs au club
            </span>
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Chaque article affiche son stock restant. Cliquez sur <strong className="text-emerald-700 font-bold">"Vendre"</strong> pour encaisser ou <strong className="text-blue-700 font-bold">"+ Stock"</strong> pour ajouter des pièces.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Grid / Table switcher */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Cartes Faciles"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Cartes</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tableau Compact"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Tableau</span>
            </button>
          </div>



          {onOpenDeletionsHistory && (
            <button
              onClick={onOpenDeletionsHistory}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-xs border border-slate-200 transition-colors shadow-sm"
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

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nouveau Matériel</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Category Filters */}
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

      {/* 3. Empty State */}
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
        /* 4. PRODUCT CARDS (WHITE & BLUE WITH CLEAR BOX SHADOW) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const itemStock = item.stock ?? 0;
            const status = getStockStatus(itemStock, item.minStockAlert || 3);
            const categoryLabel = CATEGORY_CONFIG[item.category]?.badge || 'Matériel';

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-0.5 rounded-3xl p-5 flex flex-col justify-between transition-all shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5 group relative"
              >
                <div>
                  {/* Category & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
                      {item.brand ? `${item.brand} · ${categoryLabel}` : categoryLabel}
                    </span>

                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-lg border uppercase tracking-wider shadow-sm ${status.badgeClass}`}
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

                {/* TWO MAIN LARGE BUTTONS + OPTIONS BAR */}
                <div className="mt-5 pt-3.5 border-t border-slate-200 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Big Green Vendre Button */}
                    <button
                      onClick={() => onOpenSaleModal(item)}
                      disabled={itemStock <= 0}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4 shrink-0" />
                      <span>Vendre</span>
                    </button>

                    {/* Big Blue +Stock Button */}
                    <button
                      onClick={() => handleOpenRestockModal(item, 10)}
                      className="py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
                    >
                      <PackagePlus className="w-4 h-4 shrink-0" />
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
        /* TABLE VIEW WITH DISTINCT DIVIDING LINE BETWEEN EACH ELEMENT */
        <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-lg shadow-slate-200/80 ring-1 ring-slate-900/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 bg-slate-100/80 text-xs font-black text-slate-700 uppercase tracking-wider">
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

                  return (
                    <tr
                      key={item.id}
                      className="border-b-2 border-slate-200 hover:bg-blue-50/40 transition-colors"
                    >
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
                          <button
                            onClick={() => onOpenSaleModal(item)}
                            disabled={itemStock <= 0}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-30 cursor-pointer"
                          >
                            Vendre
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

      {/* 5. FRIENDLY RESTOCK MODAL (WHITE & BLUE) */}
      {quickRestockState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border-2 border-blue-200 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl text-slate-900 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    Ajouter du Stock
                  </h4>
                  <p className="text-xs text-slate-500">
                    {quickRestockState.item.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickRestockState(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
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

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setQuickRestockState(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmQuickRestock}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/20 transition-all active:scale-95"
              >
                Valider l'ajout (+{quickRestockState.delta} pcs)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
