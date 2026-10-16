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
  MoreVertical,
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
  const [activeItemMenuId, setActiveItemMenuId] = useState<string | null>(null);

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

  const categoryPills = [
    { id: 'all', label: 'Tous les articles', icon: '🥊' },
    ...Object.entries(CATEGORY_CONFIG).map(([id, cfg]) => ({
      id,
      label: cfg.label,
      icon:
        id === 'gants'
          ? '🥊'
          : id === 'bandes'
          ? '🎗️'
          : id === 'protege_tibias'
          ? '🦵'
          : id === 'protege_dents'
          ? '🦷'
          : id === 'coquilles'
          ? '🛡️'
          : '⚡',
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
    <div className="space-y-6 animate-fadeIn text-[#f8fafc]">
      {/* 1. Header with direct actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>📦 Mon Stock de Matériel</span>
            <span className="text-xs px-2.5 py-1 rounded-xl bg-[#131c31] text-emerald-300 font-bold border border-emerald-500/30">
              {filteredItems.length} article(s) · {totalFilteredUnits} pcs au club
            </span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Chaque article affiche son stock restant. Cliquez sur <strong className="text-emerald-400">"Vendre"</strong> pour encaisser ou <strong className="text-blue-300">"+ Stock"</strong> pour ajouter des pièces.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Grid / Table switcher */}
          <div className="flex items-center bg-[#131c31] border border-[#22314e] rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
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
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#131c31] hover:bg-[#18233d] text-slate-300 hover:text-white font-bold text-xs border border-[#22314e] transition-colors"
              title="Consulter les articles supprimés"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Corbeille</span>
              {deletionsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-950 text-red-300 border border-red-800/80 text-xs font-black">
                  {deletionsCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs shadow-lg shadow-red-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nouveau Matériel</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Category Filters (Big, readable, touch-friendly) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#131c31] border border-[#22314e] shadow-xl space-y-4">
        {/* Big Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Taper ici pour chercher : nom, taille (12oz, M, L) ou couleur (Noir, Rouge, Or)..."
            className="w-full bg-[#0e1628] border border-[#263756] rounded-2xl pl-12 pr-10 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 font-medium transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Visual Category Buttons */}
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-2">
            Filtrer par catégorie :
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            {categoryPills.map((pill) => (
              <button
                key={pill.id}
                onClick={() => setSelectedCategory(pill.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all border ${
                  selectedCategory === pill.id
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30 ring-1 ring-rose-400/40'
                    : 'bg-[#0e1628] text-slate-300 hover:text-white border-[#22314e] hover:bg-[#18233d]'
                }`}
              >
                <span>{pill.icon}</span>
                <span>{pill.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Secondary filters row */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#1e2c47] flex-wrap">
          {/* Stock status pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-400 mr-1">Statut :</span>
            {[
              { id: 'all', label: 'Tous' },
              { id: 'in_stock', label: '🟢 En stock' },
              { id: 'low_stock', label: '🟡 Bientôt épuisé' },
              { id: 'out_of_stock', label: '🔴 Rupture' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStockStatus(s.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                  selectedStockStatus === s.id
                    ? 'bg-[#1e2c47] text-white border-slate-400'
                    : 'bg-[#0e1628] text-slate-400 hover:text-white border-[#22314e]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Trier par :</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#0e1628] border border-[#263756] rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-red-500 cursor-pointer"
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
        <div className="rounded-3xl bg-[#131c31] border border-[#22314e] p-12 text-center text-slate-300 shadow-xl">
          <Package className="w-14 h-14 mx-auto mb-3 opacity-40 text-slate-400" />
          <h3 className="text-base font-bold text-white">Aucun matériel trouvé</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Aucun article ne correspond à votre recherche actuelle.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedBrand('all');
              setSelectedStockStatus('all');
            }}
            className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md"
          >
            Effacer les filtres et tout réafficher
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* 4. HIGH-VISIBILITY, ZERO-CONFUSION PRODUCT CARDS */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const itemStock = item.stock ?? 0;
            const status = getStockStatus(itemStock, item.minStockAlert || 3);
            const categoryLabel = CATEGORY_CONFIG[item.category]?.badge || 'Matériel';
            const isMenuOpen = activeItemMenuId === item.id;

            return (
              <div
                key={item.id}
                className="bg-[#131c31] border border-[#22314e] hover:border-[#384f7c] rounded-3xl p-5 flex flex-col justify-between transition-all shadow-lg hover:shadow-2xl group relative"
              >
                <div>
                  {/* Category & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-slate-200 bg-[#0e1628] px-2.5 py-1 rounded-lg border border-[#22314e]">
                      {item.brand || 'Dojo'} · {categoryLabel}
                    </span>

                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-lg border uppercase tracking-wider ${status.badgeClass}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  {/* Title & Model */}
                  <h3 className="text-base font-black text-white line-clamp-2 leading-snug">
                    {item.name}
                  </h3>
                  {item.model && (
                    <span className="text-xs text-slate-400 block mt-0.5 font-medium">
                      Modèle : {item.model}
                    </span>
                  )}

                  {/* Stock Count Display (Big & Bold) */}
                  <div className="mt-4 p-3 rounded-2xl bg-[#0e1628] border border-[#1e2c47] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        Quantité restante
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className={`text-2xl font-black ${status.textClass}`}>
                          {itemStock}
                        </span>
                        <span className="text-xs text-slate-300 font-bold">pièces</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        Prix adhérent
                      </span>
                      <span className="text-base font-black text-emerald-400 mt-0.5 block">
                        {item.sellingPrice > 0
                          ? formatCurrency(item.sellingPrice, currency)
                          : 'Non fixé'}
                      </span>
                    </div>
                  </div>

                  {/* Sizes & Colors Preview */}
                  <div className="mt-3 space-y-1.5">
                    <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      Tailles & Couleurs disponibles :
                    </span>
                    <div className="space-y-1.5 max-h-28 overflow-y-auto pr-0.5">
                      {item.sizes && item.sizes.length > 0 ? (
                        item.sizes.map((sz, sIdx) => (
                          <div key={sIdx} className="text-xs flex flex-wrap items-center gap-1.5">
                            {sz.size && sz.size !== 'Unique' && (
                              <span className="font-black text-rose-400 text-xs">
                                {sz.size}:
                              </span>
                            )}
                            <div className="flex flex-wrap gap-1.5">
                              {sz.colors.map((c, cIdx) => (
                                <span
                                  key={cIdx}
                                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#0e1628] border border-[#243555] text-xs text-slate-200 font-medium"
                                  title={`${c.color} - ${c.quantity} pcs`}
                                >
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                                    style={{ background: getColorSwatch(c.color) }}
                                  />
                                  <span>{c.color}</span>
                                  <strong className="text-white font-bold">({c.quantity})</strong>
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
                <div className="mt-5 pt-3.5 border-t border-[#22314e] space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Big Green Vendre Button */}
                    <button
                      onClick={() => onOpenSaleModal(item)}
                      disabled={itemStock <= 0}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ShoppingBag className="w-4 h-4 shrink-0" />
                      <span>Vendre</span>
                    </button>

                    {/* Big Blue +Stock Button */}
                    <button
                      onClick={() => handleOpenRestockModal(item, 10)}
                      className="py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                    >
                      <PackagePlus className="w-4 h-4 shrink-0" />
                      <span>+ Stock</span>
                    </button>
                  </div>

                  {/* Secondary clean action bar (Edit, Duplicate, Delete) */}
                  <div className="flex items-center justify-between text-xs pt-1 px-1">
                    <button
                      onClick={() => onOpenEditModal(item)}
                      className="text-slate-300 hover:text-white flex items-center gap-1 font-bold py-1 px-1.5 rounded-lg hover:bg-[#1e2c47] transition-colors"
                      title="Modifier les informations"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Modifier</span>
                    </button>

                    <button
                      onClick={() => onDuplicateItem(item)}
                      className="text-slate-300 hover:text-white flex items-center gap-1 font-bold py-1 px-1.5 rounded-lg hover:bg-[#1e2c47] transition-colors"
                      title="Créer une copie"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier</span>
                    </button>

                    <button
                      onClick={() => onDeleteItem(item)}
                      className="text-slate-400 hover:text-rose-400 flex items-center gap-1 font-bold py-1 px-1.5 rounded-lg hover:bg-rose-950/40 transition-colors"
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
        <div className="bg-[#131c31] border border-[#22314e] rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#22314e] bg-[#0e1628] text-xs font-black text-slate-300 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Article</th>
                  <th className="py-3.5 px-3">Marque</th>
                  <th className="py-3.5 px-3">Tailles & Couleurs</th>
                  <th className="py-3.5 px-3">Stock Restant</th>
                  <th className="py-3.5 px-3">Prix de Vente</th>
                  <th className="py-3.5 px-3">Statut</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2c47] text-xs">
                {filteredItems.map((item) => {
                  const itemStock = item.stock ?? 0;
                  const status = getStockStatus(itemStock, item.minStockAlert || 3);

                  return (
                    <tr key={item.id} className="hover:bg-[#18233d]/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-xs sm:text-sm">{item.name}</div>
                        {item.model && (
                          <div className="text-xs text-slate-400">Modèle: {item.model}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-slate-200 font-bold">{item.brand}</td>
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          {item.sizes?.map((sz, i) => (
                            <div key={i} className="text-xs flex flex-wrap items-center gap-1.5">
                              {sz.size && sz.size !== 'Unique' && (
                                <strong className="text-rose-400 mr-1">{sz.size}:</strong>
                              )}
                              <div className="flex flex-wrap gap-1">
                                {sz.colors.map((c, cIdx) => (
                                  <span
                                    key={cIdx}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0e1628] border border-[#22314e] text-xs text-slate-300 font-medium"
                                  >
                                    <span
                                      className="w-2 h-2 rounded-full border border-white/20"
                                      style={{ background: getColorSwatch(c.color) }}
                                    />
                                    <span>{c.color}</span>
                                    <strong className="text-white ml-0.5">({c.quantity})</strong>
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-sm ${status.textClass}`}>
                            {itemStock} pcs
                          </span>
                          <button
                            onClick={() => handleOpenRestockModal(item, 10)}
                            className="px-2 py-0.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-bold transition-colors"
                            title="Ajouter du stock"
                          >
                            + Stock
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        {item.sellingPrice > 0 ? (
                          <span className="font-bold text-emerald-400 text-sm">
                            {formatCurrency(item.sellingPrice, currency)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-semibold">Non fixé</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-xs font-black border uppercase ${status.badgeClass}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenSaleModal(item)}
                            disabled={itemStock <= 0}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-30"
                          >
                            Vendre
                          </button>
                          <button
                            onClick={() => onOpenEditModal(item)}
                            className="p-1.5 rounded-lg bg-[#1a253f] hover:bg-[#243555] text-slate-200 border border-[#2a3c5f]"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteItem(item)}
                            className="p-1.5 rounded-lg bg-[#1a253f] hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-[#2a3c5f]"
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

      {/* 5. FRIENDLY RESTOCK MODAL */}
      {quickRestockState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#101828] border-2 border-blue-500/40 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl text-slate-100 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#22314e] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">
                    Ajouter du Stock
                  </h4>
                  <p className="text-xs text-slate-400">
                    {quickRestockState.item.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickRestockState(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quantity stepper with quick shortcuts */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-2">
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
                  className="w-11 h-11 rounded-2xl bg-[#1a253f] hover:bg-[#243555] text-white font-black text-lg border border-[#2a3c5f] flex items-center justify-center transition-colors"
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
                    className="w-full bg-[#0e1628] border-2 border-blue-500/60 rounded-2xl py-2.5 text-center text-xl font-black text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setQuickRestockState((prev) =>
                      prev ? { ...prev, delta: prev.delta + 1 } : null
                    )
                  }
                  className="w-11 h-11 rounded-2xl bg-[#1a253f] hover:bg-[#243555] text-white font-black text-lg border border-[#2a3c5f] flex items-center justify-center transition-colors"
                >
                  +1
                </button>
              </div>

              {/* Booster buttons */}
              <div className="flex items-center gap-1.5 flex-wrap pt-2.5">
                <span className="text-xs font-bold text-slate-400 mr-1">Raccourcis :</span>
                {[5, 10, 20, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() =>
                      setQuickRestockState((prev) => (prev ? { ...prev, delta: amt } : null))
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      quickRestockState.delta === amt
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-[#131c31] text-slate-300 hover:text-white border-[#243555] hover:bg-[#1a253f]'
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
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
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
                            ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                            : 'bg-[#0e1628] border-[#22314e] text-slate-300 hover:border-[#33466d]'
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
              <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
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
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                          : 'bg-[#0e1628] border-[#22314e] text-slate-300 hover:border-[#33466d]'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                        style={{ background: getColorSwatch(c.color) }}
                      />
                      <span>{c.color}</span>
                      <span className="px-1.5 py-0.2 rounded bg-black/40 text-xs font-bold">
                        {c.quantity} pcs actuelles
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#22314e]">
              <button
                type="button"
                onClick={() => setQuickRestockState(null)}
                className="px-4 py-2.5 rounded-xl bg-[#1e2c47] hover:bg-[#283b5e] text-slate-200 text-xs font-bold border border-[#2e4166] transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmQuickRestock}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-600/30 transition-all active:scale-95"
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
