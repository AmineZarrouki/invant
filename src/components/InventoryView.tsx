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
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { Equipment } from '@/types/inventory';
import { formatCurrency, CurrencyCode } from '@/lib/currency';
import { CATEGORY_CONFIG, getStockStatus } from '@/lib/categoryColors';

interface InventoryViewProps {
  equipment: Equipment[];
  currency: CurrencyCode;
  onOpenAddModal: () => void;
  onOpenEditModal: (item: Equipment) => void;
  onOpenSaleModal: (item: Equipment) => void;
  onDuplicateItem: (item: Equipment) => void;
  onDeleteItem: (item: Equipment) => void;
  onAdjustStock: (id: string, delta: number) => void;
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
  const [sortBy, setSortBy] = useState<'name' | 'stock-desc' | 'stock-asc' | 'price-desc' | 'price-asc'>('stock-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

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
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          const fields = [item.name, item.brand, item.model || '', item.size, item.color, item.barcode || ''];
          if (!fields.some((f) => f.toLowerCase().includes(q))) return false;
        }
        if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
        if (selectedBrand !== 'all' && item.brand !== selectedBrand) return false;
        if (selectedStockStatus === 'in_stock' && item.stock <= (item.minStockAlert || 3)) return false;
        if (selectedStockStatus === 'low_stock' && (item.stock === 0 || item.stock > (item.minStockAlert || 3))) return false;
        if (selectedStockStatus === 'out_of_stock' && item.stock > 0) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'stock-desc') return b.stock - a.stock;
        if (sortBy === 'stock-asc') return a.stock - b.stock;
        if (sortBy === 'price-desc') return b.sellingPrice - a.sellingPrice;
        if (sortBy === 'price-asc') return a.sellingPrice - b.sellingPrice;
        return 0;
      });
  }, [equipment, searchTerm, selectedCategory, selectedBrand, selectedStockStatus, sortBy]);

  const totalFilteredUnits = useMemo(() => filteredItems.reduce((acc, i) => acc + (i.stock || 0), 0), [filteredItems]);

  const categoryPills = [
    { id: 'all', label: 'Tous les articles' },
    ...Object.entries(CATEGORY_CONFIG).map(([id, cfg]) => ({
      id,
      label: cfg.label,
    })),
  ];

  return (
    <div className="space-y-6 animate-fadeIn text-zinc-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>Inventaire Kickboxing</span>
            <span className="text-xs px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 font-medium border border-zinc-700">
              {filteredItems.length} références · {totalFilteredUnits} pcs
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Gestion du matériel, vente directe avec calcul de marge et suivi des seuils.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Grid / Table switcher */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
              title="Affichage en Grille"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'table' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
              title="Affichage en Tableau"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {onOpenDeletionsHistory && (
            <button
              onClick={onOpenDeletionsHistory}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-semibold text-xs border border-zinc-800 transition-colors"
              title="Consulter le journal des suppressions"
            >
              <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Corbeille</span>
              {deletionsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-950 text-red-300 border border-red-800/60 text-[10px] font-bold">
                  {deletionsCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Matériel</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, marque, taille (12oz, 4.5m, M, XL), couleur..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Brand Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer"
            >
              <option value="all">Toutes les marques</option>
              {brandsList.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedStockStatus}
              onChange={(e) => setSelectedStockStatus(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer"
            >
              <option value="all">Tous les états de stock</option>
              <option value="in_stock">En Stock Normal</option>
              <option value="low_stock">Stock Faible (Alerte)</option>
              <option value="out_of_stock">En Rupture (0 pc)</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer"
            >
              <option value="stock-desc">Stock (Décroissant)</option>
              <option value="stock-asc">Stock (Croissant)</option>
              <option value="price-desc">Prix (Décroissant)</option>
              <option value="price-asc">Prix (Croissant)</option>
              <option value="name">Nom (A → Z)</option>
            </select>
          </div>
        </div>

        {/* Category Pills - Clean & Professional */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {categoryPills.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors border ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-950 font-bold border-zinc-100 shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border-zinc-800 hover:bg-zinc-900'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content: Grid or Table */}
      {filteredItems.length === 0 ? (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-400">
          <Package className="w-10 h-10 mx-auto text-zinc-600 mb-3 opacity-60" />
          <h3 className="text-sm font-bold text-white mb-1">Aucun article trouvé</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
            Modifiez vos filtres ou vos termes de recherche.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedBrand('all');
              setSelectedStockStatus('all');
            }}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* PROFESSIONAL GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const status = getStockStatus(item.stock, item.minStockAlert || 3);
            const categoryLabel = CATEGORY_CONFIG[item.category]?.badge || 'Matériel';

            return (
              <div
                key={item.id}
                className="bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-sm hover:shadow-md"
              >
                <div>
                  {/* Category & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60">
                      {item.brand} · {categoryLabel}
                    </span>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${status.badgeClass}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                    {item.name}
                  </h3>

                  {/* Attributes */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    <span className="px-2 py-0.5 rounded bg-zinc-950 text-zinc-300 text-[11px] font-medium border border-zinc-800">
                      Taille: <strong className="text-white">{item.size}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-950 text-zinc-300 text-[11px] font-medium border border-zinc-800">
                      Couleur: <strong className="text-zinc-200">{item.color}</strong>
                    </span>
                    {item.model && (
                      <span className="px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 text-[10px] border border-zinc-800">
                        Réf: {item.model}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800">
                  {/* Stock counter & Quick decrement/increment */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                        Stock Disponible
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-black ${status.textClass}`}>
                          {item.stock}
                        </span>
                        <span className="text-xs text-zinc-400">pcs</span>
                      </div>
                    </div>

                    {/* Stock action buttons */}
                    <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                      {/* Clicking '-' triggers Sale Modal to insert sold price and add difference to profit */}
                      <button
                        onClick={() => onOpenSaleModal(item)}
                        disabled={item.stock <= 0}
                        className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center font-bold text-sm transition-colors disabled:opacity-30"
                        title="Vendre 1 pièce (indiquer le prix et calculer le bénéfice)"
                      >
                        -
                      </button>
                      <button
                        onClick={() => onAdjustStock(item.id, 1)}
                        className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center font-bold text-sm transition-colors"
                        title="Ajouter 1 pièce en stock"
                      >
                        +
                      </button>
                      <button
                        onClick={() => onAdjustStock(item.id, 5)}
                        className="px-2 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center font-bold text-[11px] transition-colors"
                        title="Réapprovisionner +5 pièces"
                      >
                        +5
                      </button>
                    </div>
                  </div>

                  {/* Price & Action row */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div>
                      {item.sellingPrice > 0 ? (
                        <span className="text-sm font-black text-emerald-400">
                          {formatCurrency(item.sellingPrice, currency)}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                          Prix non fixé
                        </span>
                      )}
                      {item.costPrice > 0 && (
                        <div className="text-[10px] text-zinc-400">
                          Coût: {formatCurrency(item.costPrice, currency)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Quick Sell Button */}
                      <button
                        onClick={() => onOpenSaleModal(item)}
                        disabled={item.stock <= 0}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-30 active:scale-95 shadow-sm"
                        title="Enregistrer la vente (insérer le prix vendu)"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Vendre</span>
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => onOpenEditModal(item)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                        title="Modifier la fiche"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Duplicate */}
                      <button
                        onClick={() => onDuplicateItem(item)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                        title="Dupliquer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDeleteItem(item)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950/80 text-zinc-400 hover:text-red-300 transition-colors"
                        title="Supprimer (compte à rebours 5s)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* PROFESSIONAL TABLE VIEW */
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/80 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-3">Marque</th>
                  <th className="py-3 px-3">Taille</th>
                  <th className="py-3 px-3">Couleur</th>
                  <th className="py-3 px-3">Stock</th>
                  <th className="py-3 px-3">Prix de Vente</th>
                  <th className="py-3 px-3">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-xs">
                {filteredItems.map((item) => {
                  const status = getStockStatus(item.stock, item.minStockAlert || 3);

                  return (
                    <tr key={item.id} className="hover:bg-zinc-850/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{item.name}</div>
                        {item.model && <div className="text-[10px] text-zinc-400">Réf: {item.model}</div>}
                      </td>
                      <td className="py-3 px-3 text-zinc-300 font-semibold">{item.brand}</td>
                      <td className="py-3 px-3 text-zinc-200">{item.size}</td>
                      <td className="py-3 px-3 text-zinc-300">{item.color}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-sm ${status.textClass}`}>
                            {item.stock} pcs
                          </span>
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => onOpenSaleModal(item)}
                              disabled={item.stock <= 0}
                              className="w-5 h-5 rounded bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center font-bold disabled:opacity-30"
                              title="Vendre 1 pièce"
                            >
                              -
                            </button>
                            <button
                              onClick={() => onAdjustStock(item.id, 1)}
                              className="w-5 h-5 rounded bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center font-bold"
                              title="Ajouter 1 pièce"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {item.sellingPrice > 0 ? (
                          <span className="font-bold text-emerald-400">
                            {formatCurrency(item.sellingPrice, currency)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-500 font-medium">
                            Non fixé
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${status.badgeClass}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenSaleModal(item)}
                            disabled={item.stock <= 0}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold disabled:opacity-30"
                          >
                            Vendre
                          </button>
                          <button
                            onClick={() => onOpenEditModal(item)}
                            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDuplicateItem(item)}
                            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                            title="Dupliquer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteItem(item)}
                            className="p-1 rounded bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-300"
                            title="Supprimer (compte à rebours 5s)"
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
  );
}
