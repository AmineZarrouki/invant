'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Package,
  Plus,
  Trash2,
  Tag,
  Sparkles,
  Percent,
  Coins,
  Check,
  AlertCircle,
  Search,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Equipment, EquipmentPack, PackItem, SizeVariant } from '@/types/inventory';
import { CurrencyCode, formatCurrency, CURRENCY_CONFIG } from '@/lib/currency';
import { CATEGORY_CONFIG, getColorSwatch } from '@/lib/categoryColors';

interface PackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (packData: Partial<EquipmentPack>) => Promise<void>;
  initialData?: EquipmentPack | null;
  preSelectedEquipment?: Equipment[]; // If opened from inventory multi-select!
  allEquipment: Equipment[];
  currency: CurrencyCode;
}

export default function PackModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  preSelectedEquipment = [],
  allEquipment,
  currency,
}: PackModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [barcode, setBarcode] = useState('');
  const [items, setItems] = useState<PackItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize or reset modal
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
      setBarcode(initialData.barcode || '');
      setItems(
        initialData.items.map((it) => ({
          ...it,
          quantity: Number(it.quantity) || 1,
          originalPrice: Number(it.originalPrice) || 0,
          packPrice: Number(it.packPrice) !== undefined ? Number(it.packPrice) : Number(it.originalPrice) || 0,
          costPrice: Number(it.costPrice) || 0,
        }))
      );
    } else if (preSelectedEquipment.length > 0) {
      // Prepopulate with selected equipment from inventory
      setName(`Pack ${preSelectedEquipment.map((e) => e.name).slice(0, 2).join(' + ')}${preSelectedEquipment.length > 2 ? ' ...' : ''}`);
      setDescription(`Pack composé de ${preSelectedEquipment.length} articles.`);
      setBarcode('');
      setItems(
        preSelectedEquipment.map((eq) => {
          const firstSize = eq.sizes?.[0]?.size;
          const firstColor = eq.sizes?.[0]?.colors?.[0]?.color;
          return {
            equipmentId: eq.id,
            equipmentName: eq.name,
            category: eq.category,
            brand: eq.brand || '',
            model: eq.model || '',
            size: firstSize && firstSize !== 'Unique' ? firstSize : undefined,
            color: firstColor,
            quantity: 1,
            originalPrice: Number(eq.sellingPrice) || 0,
            packPrice: Number(eq.sellingPrice) || 0,
            costPrice: Number(eq.costPrice) || 0,
          };
        })
      );
    } else {
      setName('');
      setDescription('');
      setBarcode('');
      setItems([]);
    }
    setError(null);
    setSearchTerm('');
  }, [isOpen, initialData, preSelectedEquipment]);

  // Available equipment search for adding into the pack
  const availableToAdd = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return allEquipment
      .filter((eq) => {
        if (!q) return true;
        return (
          eq.name.toLowerCase().includes(q) ||
          (eq.brand || '').toLowerCase().includes(q) ||
          (eq.model || '').toLowerCase().includes(q) ||
          (eq.category || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  }, [allEquipment, searchTerm]);

  // Add an item to pack
  const handleAddItem = (eq: Equipment) => {
    const firstSize = eq.sizes?.[0]?.size;
    const firstColor = eq.sizes?.[0]?.colors?.[0]?.color;

    const newItem: PackItem = {
      equipmentId: eq.id,
      equipmentName: eq.name,
      category: eq.category,
      brand: eq.brand || '',
      model: eq.model || '',
      size: firstSize && firstSize !== 'Unique' ? firstSize : undefined,
      color: firstColor,
      quantity: 1,
      originalPrice: Number(eq.sellingPrice) || 0,
      packPrice: Number(eq.sellingPrice) || 0, // Defaults to original price
      costPrice: Number(eq.costPrice) || 0,
    };

    setItems((prev) => [...prev, newItem]);
    setSearchTerm('');
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateItem = (index: number, updates: Partial<PackItem>) => {
    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it;
        return { ...it, ...updates };
      })
    );
  };

  // Helper: Apply percentage discount to all element prices in pack
  const applyGlobalDiscount = (percentage: number) => {
    setItems((prev) =>
      prev.map((it) => {
        const discounted = Math.max(0, Math.round(it.originalPrice * (1 - percentage / 100)));
        return { ...it, packPrice: discounted };
      })
    );
  };

  // Live computed pricing totals
  const totalOriginalPrice = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.originalPrice) || 0) * (Number(it.quantity) || 1), 0);
  }, [items]);

  const totalPackPrice = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.packPrice) || 0) * (Number(it.quantity) || 1), 0);
  }, [items]);

  const totalCostPrice = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.costPrice) || 0) * (Number(it.quantity) || 1), 0);
  }, [items]);

  const totalDiscount = Math.max(0, totalOriginalPrice - totalPackPrice);
  const discountPercent = totalOriginalPrice > 0 ? Math.round((totalDiscount / totalOriginalPrice) * 100) : 0;
  const estimatedProfit = totalPackPrice - totalCostPrice;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Veuillez indiquer un nom pour ce pack.');
      return;
    }
    if (items.length === 0) {
      setError('Veuillez ajouter au moins un équipement dans le pack.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        barcode: barcode.trim() || undefined,
        items,
        totalOriginalPrice,
        totalPackPrice,
        discountAmount: totalDiscount,
        discountPercentage: discountPercent,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l’enregistrement du pack.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl shadow-slate-900/20 overflow-hidden text-slate-900 animate-scaleUp ring-1 ring-slate-900/10 flex flex-col max-h-[92vh] sm:max-h-[88vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50/80 via-slate-50 to-indigo-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-blue-500/20">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>{initialData ? 'Modifier le Pack' : 'Créer un Pack d’Équipements'}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-bold">
                  {items.length} article(s) inclus
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Regroupez plusieurs équipements et ajustez librement le prix de chaque élément du pack.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3 font-semibold">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Informations Générales du Pack */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nom du Pack *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Pack Boxe Débutant (Gants + Bandes + Protège-dents)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Réf / Code-barres</span>
                <span className="text-[10px] text-slate-400 font-normal">Optionnel</span>
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="ex: PACK-BOXE-01"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Description / Avantages du Pack</span>
                <span className="text-[10px] text-slate-400 font-normal">Optionnel</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ex: Idéal pour les nouveaux adhérents de kickboxing. Économisez sur la panoplie complète."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Section 2: Ajouter des Articles depuis le Stock */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-blue-600 stroke-[3]" />
                Ajouter des articles du stock dans ce pack
              </span>
              <span className="text-[11px] text-slate-500">
                {allEquipment.length} articles disponibles en inventaire
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Chercher un équipement à ajouter (nom, gants, bandes, tibias, marque)..."
                className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
              />
            </div>

            {/* Quick Suggestions Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1 max-h-36 overflow-y-auto">
              {availableToAdd.map((eq) => {
                const isAlreadyIn = items.some((it) => it.equipmentId === eq.id);
                return (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => handleAddItem(eq)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      isAlreadyIn
                        ? 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:shadow-xs'
                    }`}
                  >
                    <span>{CATEGORY_CONFIG[eq.category]?.icon || '🥊'}</span>
                    <span className="truncate max-w-[140px] sm:max-w-[200px]">{eq.name}</span>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      ({formatCurrency(eq.sellingPrice, currency)})
                    </span>
                    <Plus className="w-3 h-3 text-blue-600 stroke-[3] ml-0.5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Éléments du Pack & Modification du Prix de Chaque Élément */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-900">
                  Éléments du Pack ({items.length}) & Prix de chaque article
                </label>
                <p className="text-[11px] text-slate-500">
                  Vous pouvez modifier le prix de vente de chaque élément au sein de ce pack.
                </p>
              </div>

              {/* Quick discount helpers */}
              {items.length > 0 && (
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  <span className="text-[10px] font-bold text-slate-500 px-1.5 flex items-center gap-1">
                    <Percent className="w-3 h-3" /> Remise rapide :
                  </span>
                  <button
                    type="button"
                    onClick={() => applyGlobalDiscount(10)}
                    className="px-2 py-0.5 rounded-lg bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[11px] font-bold border border-slate-200 shadow-2xs"
                  >
                    -10%
                  </button>
                  <button
                    type="button"
                    onClick={() => applyGlobalDiscount(15)}
                    className="px-2 py-0.5 rounded-lg bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[11px] font-bold border border-slate-200 shadow-2xs"
                  >
                    -15%
                  </button>
                  <button
                    type="button"
                    onClick={() => applyGlobalDiscount(20)}
                    className="px-2 py-0.5 rounded-lg bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[11px] font-bold border border-slate-200 shadow-2xs"
                  >
                    -20%
                  </button>
                  <button
                    type="button"
                    onClick={() => applyGlobalDiscount(0)}
                    className="px-2 py-0.5 rounded-lg bg-white hover:bg-slate-200 text-slate-600 text-[11px] font-bold border border-slate-200 shadow-2xs"
                    title="Rétablir les prix normaux"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 space-y-2">
                <Package className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-600">Aucun équipement dans le pack pour le moment</p>
                <p className="text-[11px] text-slate-400">
                  Utilisez la recherche ci-dessus pour ajouter les équipements qui composent ce pack.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {items.map((it, idx) => {
                  const eq = allEquipment.find((e) => e.id === it.equipmentId);
                  const sizesList = eq?.sizes?.map((s) => s.size).filter(Boolean) || [];
                  const colorsList = eq?.sizes?.flatMap((s) => s.colors.map((c) => c.color)) || [];
                  const uniqueColors = Array.from(new Set(colorsList.filter(Boolean)));

                  const itemDiff = it.packPrice - it.originalPrice;
                  const itemDiscountPercent =
                    it.originalPrice > 0 ? Math.round(((it.originalPrice - it.packPrice) / it.originalPrice) * 100) : 0;

                  return (
                    <div
                      key={`${it.equipmentId}-${idx}`}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      {/* Left info: Icon, Name, Category */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{CATEGORY_CONFIG[it.category]?.icon || '📦'}</span>
                          <span className="text-xs font-black text-slate-900 truncate">
                            {it.equipmentName}
                          </span>
                          {it.brand && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold shrink-0">
                              {it.brand}
                            </span>
                          )}
                        </div>

                        {/* Variant selectors (size / color) */}
                        <div className="flex items-center gap-2 mt-2 text-xs">
                          {sizesList.length > 0 ? (
                            <select
                              value={it.size || ''}
                              onChange={(e) => handleUpdateItem(idx, { size: e.target.value || undefined })}
                              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 cursor-pointer focus:outline-none focus:border-blue-500"
                            >
                              <option value="">Taille : au choix / libre</option>
                              {sizesList.map((sz) => (
                                <option key={sz} value={sz}>
                                  Taille : {sz}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-[11px] text-slate-400">Taille unique</span>
                          )}

                          {uniqueColors.length > 0 && (
                            <select
                              value={it.color || ''}
                              onChange={(e) => handleUpdateItem(idx, { color: e.target.value || undefined })}
                              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 cursor-pointer focus:outline-none focus:border-blue-500"
                            >
                              <option value="">Couleur : au choix / libre</option>
                              {uniqueColors.map((cl) => (
                                <option key={cl} value={cl}>
                                  {cl}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      {/* Right: Quantity, Original Price, and CUSTOM PACK PRICE */}
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Quantity in Pack */}
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                          <span className="text-[10px] font-bold text-slate-400 px-1">Qté:</span>
                          <input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={(e) => handleUpdateItem(idx, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                            className="w-10 text-center bg-white border border-slate-200 rounded-lg py-1 text-xs font-black text-slate-900 focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        {/* Original Price Reference */}
                        <div className="text-right hidden sm:block">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Prix normal</span>
                          <span className="text-xs font-semibold text-slate-500 line-through">
                            {formatCurrency(it.originalPrice, currency)}
                          </span>
                        </div>

                        {/* EDITABLE PACK PRICE */}
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black text-blue-700 block uppercase tracking-wider">
                            Prix dans le pack *
                          </span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={it.packPrice}
                              onChange={(e) =>
                                handleUpdateItem(idx, { packPrice: Math.max(0, Number(e.target.value) || 0) })
                              }
                              className="w-20 sm:w-24 bg-blue-50/60 border-2 border-blue-300 focus:border-blue-600 focus:bg-white rounded-xl px-2 py-1 text-right text-xs sm:text-sm font-black text-blue-900 focus:outline-none transition-colors shadow-2xs"
                            />
                            <span className="text-xs font-bold text-slate-500">
                              {CURRENCY_CONFIG[currency]?.symbol || 'DH'}
                            </span>
                          </div>

                          {/* Discount indicator for this element */}
                          {itemDiscountPercent > 0 ? (
                            <span className="text-[10px] font-bold text-emerald-600 mt-0.5">
                              -{it.originalPrice - it.packPrice} {CURRENCY_CONFIG[currency]?.symbol || 'DH'} (-{itemDiscountPercent}%)
                            </span>
                          ) : itemDiff > 0 ? (
                            <span className="text-[10px] font-bold text-amber-600 mt-0.5">
                              +{itemDiff} {CURRENCY_CONFIG[currency]?.symbol || 'DH'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 mt-0.5 font-medium">Prix inchangé</span>
                          )}
                        </div>

                        {/* Delete from pack button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Retirer cet article du pack"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 4: Récapitulatif Tarifaire Global du Pack */}
          {items.length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-900 text-white shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-300" />
                  <span className="text-xs font-black uppercase tracking-wider text-blue-100">
                    Bilan Tarifaire du Pack
                  </span>
                </div>
                {totalDiscount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-black">
                    🎉 Économie client : -{totalDiscount} {CURRENCY_CONFIG[currency]?.symbol || 'DH'} (-{discountPercent}%)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs">
                  <span className="text-[10px] text-blue-200 font-bold uppercase block">Articles inclus</span>
                  <span className="text-base font-black text-white">{items.length} équipement(s)</span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs">
                  <span className="text-[10px] text-blue-200 font-bold uppercase block">Total prix standard</span>
                  <span className="text-base font-black text-slate-300 line-through">
                    {formatCurrency(totalOriginalPrice, currency)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30">
                  <span className="text-[10px] text-emerald-300 font-black uppercase block">PRIX TOTAL DU PACK</span>
                  <span className="text-lg font-black text-white">
                    {formatCurrency(totalPackPrice, currency)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs">
                  <span className="text-[10px] text-blue-200 font-bold uppercase block">Marge estimée</span>
                  <span className="text-base font-black text-emerald-300">
                    +{formatCurrency(Math.max(0, estimatedProfit), currency)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{initialData ? 'Mettre à jour le Pack' : 'Créer le Pack'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
