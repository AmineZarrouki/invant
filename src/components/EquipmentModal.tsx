'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  Box,
  Tag,
  Coins,
  AlertCircle,
  Sparkles,
  Plus,
  Trash2,
  Layers,
  ChevronDown,
  Info,
  Check,
} from 'lucide-react';
import { Equipment, EquipmentCategory, SizeVariant } from '@/types/inventory';
import { CurrencyCode, CURRENCY_CONFIG } from '@/lib/currency';

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (equipmentData: Partial<Equipment>) => Promise<void>;
  initialData?: Equipment | null;
  currency: CurrencyCode;
}

// Category Configuration & Presets
const EQUIPMENT_TYPES: Array<{
  id: EquipmentCategory;
  name: string;
  icon: string;
  defaultBrand: string;
  defaultSizes: string[];
  defaultColors: string[];
  description: string;
}> = [
  {
    id: 'gants',
    name: 'Gants de Boxe',
    icon: '🥊',
    defaultBrand: 'Venum',
    defaultSizes: ['10 oz', '12 oz', '14 oz', '16 oz'],
    defaultColors: ['Noir', 'Blanc / Noir', 'Rouge / Noir', 'Gold / Noir', 'Vert', 'Bleu'],
    description: 'Tailles en Oz (10oz, 12oz, 14oz...), modèles compétition et entraînement.',
  },
  {
    id: 'bandes',
    name: 'Bandes de Boxe',
    icon: '🎗️',
    defaultBrand: 'Standard Pro',
    defaultSizes: ['3,5m', '4,5m', '5,5m'],
    defaultColors: ['Noir / Assorti', 'Rouge', 'Bleu', 'Blanc', 'Rose'],
    description: 'Longueurs en mètres (3,5m, 4,5m, 5,5m), matière coton / semi-élastique.',
  },
  {
    id: 'protege_tibias',
    name: 'Protège-Tibias',
    icon: '🦵',
    defaultBrand: 'Pakka',
    defaultSizes: ['S', 'M', 'L', 'XL'],
    defaultColors: ['Noir', 'Rouge', 'Bleu', 'Gris', 'Noir / Rouge', 'Noir / Or'],
    description: 'Formats rigides à attaches ou chaussettes élastiques ("T9chira").',
  },
  {
    id: 'protege_dents',
    name: 'Protège-Dents',
    icon: '🦷',
    defaultBrand: 'Baklee',
    defaultSizes: ['Adulte (Senior)', 'Enfant (Junior)'],
    defaultColors: ['Noir', 'Blanc', 'Bleu', 'Rouge', 'Orange', 'Transparent'],
    description: 'Simple, thermo-moulable ou boîte incluse, taille Adulte / Enfant.',
  },
  {
    id: 'coquilles',
    name: 'Coquilles de Protection',
    icon: '🛡️',
    defaultBrand: 'Standard Pro',
    defaultSizes: ['S', 'M', 'L', 'XL'],
    defaultColors: ['Noir', 'Blanc', 'Gris'],
    description: 'Slip avec poche ou cup anatomique rigide, tailles S, M, L, XL.',
  },
  {
    id: 'autres',
    name: 'Autres Accessoires',
    icon: '⚡',
    defaultBrand: 'Dojo Pro',
    defaultSizes: ['Unique', 'S', 'M', 'L'],
    defaultColors: ['Noir', 'Rouge', 'Bleu', 'Blanc'],
    description: 'Casques, paos, pattes d’ours, cordes à sauter, chevillères.',
  },
];

interface SizeEntryState {
  id: string;
  size: string;
  colors: Array<{ id: string; color: string; quantity: number }>;
}

interface DirectColorState {
  id: string;
  color: string;
  quantity: number;
}

export default function EquipmentModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  currency,
}: EquipmentModalProps) {
  // Primary state
  const [category, setCategory] = useState<EquipmentCategory>('gants');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('Venum');
  const [model, setModel] = useState('');
  const [minStockAlert, setMinStockAlert] = useState(3);
  const [costPrice, setCostPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [barcode, setBarcode] = useState('');
  const [description, setDescription] = useState('');

  // Variants state (Sizes and Colors with quantities)
  const [hasSizes, setHasSizes] = useState<boolean>(true);
  const [sizesState, setSizesState] = useState<SizeEntryState[]>([]);
  const [directColorsState, setDirectColorsState] = useState<DirectColorState[]>([]);

  // Manual name edit tracking
  const [isNameManuallyEdited, setIsNameManuallyEdited] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to suggest product title
  const generateSuggestedName = (cat: EquipmentCategory, br: string, mod: string) => {
    const brandStr = br ? br.trim() : '';
    const modelStr = mod ? mod.trim() : '';

    if (cat === 'gants') {
      return `Gants de Boxe ${brandStr} ${modelStr}`.replace(/\s+/g, ' ').trim();
    }
    if (cat === 'bandes') {
      return `Bandes de Boxe ${brandStr} ${modelStr}`.replace(/\s+/g, ' ').trim();
    }
    if (cat === 'protege_tibias') {
      return `Protège-Tibias ${brandStr} ${modelStr}`.replace(/\s+/g, ' ').trim();
    }
    if (cat === 'protege_dents') {
      return `Protège-Dents ${brandStr} ${modelStr}`.replace(/\s+/g, ' ').trim();
    }
    if (cat === 'coquilles') {
      return `Coquille ${brandStr} ${modelStr}`.replace(/\s+/g, ' ').trim();
    }
    return `Équipement ${brandStr} ${modelStr}`.replace(/\s+/g, ' ').trim();
  };

  // Initialize form on open
  useEffect(() => {
    if (initialData) {
      setCategory(initialData.category);
      setName(initialData.name);
      setBrand(initialData.brand || '');
      setModel(initialData.model || '');
      setMinStockAlert(initialData.minStockAlert || 3);
      setCostPrice(initialData.costPrice || 0);
      setSellingPrice(initialData.sellingPrice || 0);
      setBarcode(initialData.barcode || '');
      setDescription(initialData.description || '');
      setIsNameManuallyEdited(true);

      // Initialize sizes & colors
      if (initialData.sizes && initialData.sizes.length > 0) {
        const hasExplicitSize = initialData.sizes.some(
          (sz) => sz.size && sz.size.trim() !== '' && sz.size !== 'Unique'
        );
        setHasSizes(hasExplicitSize);

        if (hasExplicitSize) {
          setSizesState(
            initialData.sizes.map((sz) => ({
              id: `sz-${Math.random().toString(36).substring(2, 7)}`,
              size: sz.size || '',
              colors: (sz.colors || []).map((c) => ({
                id: `c-${Math.random().toString(36).substring(2, 7)}`,
                color: c.color || 'Standard',
                quantity: Number(c.quantity) || 0,
              })),
            }))
          );
        } else {
          const allColors = (initialData.sizes[0]?.colors || []).map((c) => ({
            id: `c-${Math.random().toString(36).substring(2, 7)}`,
            color: c.color || 'Standard',
            quantity: Number(c.quantity) || 0,
          }));
          setDirectColorsState(allColors.length > 0 ? allColors : [{ id: 'c-1', color: 'Noir', quantity: 5 }]);
        }
      } else {
        // Fallback for legacy format
        const legacySize = (initialData as any).size;
        const legacyColor = (initialData as any).color || 'Standard';
        const legacyStock = Number((initialData as any).stock) || 0;
        const isSizeExplicit = legacySize && legacySize !== 'Unique';
        setHasSizes(isSizeExplicit);

        if (isSizeExplicit) {
          setSizesState([
            {
              id: 'sz-1',
              size: legacySize,
              colors: [{ id: 'c-1', color: legacyColor, quantity: legacyStock }],
            },
          ]);
        } else {
          setDirectColorsState([{ id: 'c-1', color: legacyColor, quantity: legacyStock }]);
        }
      }
    } else {
      // Default to Gloves
      const def = EQUIPMENT_TYPES[0];
      setCategory(def.id);
      setBrand(def.defaultBrand);
      setModel('Challenger');
      setMinStockAlert(3);
      setCostPrice(0);
      setSellingPrice(0);
      setBarcode('');
      setDescription('');
      setIsNameManuallyEdited(false);
      setName(generateSuggestedName(def.id, def.defaultBrand, 'Challenger'));

      setHasSizes(true);
      setSizesState([
        {
          id: 'sz-1',
          size: '12 oz',
          colors: [
            { id: 'c-1', color: 'Noir', quantity: 5 },
            { id: 'c-2', color: 'Rouge / Noir', quantity: 3 },
          ],
        },
        {
          id: 'sz-2',
          size: '14 oz',
          colors: [{ id: 'c-3', color: 'Noir', quantity: 5 }],
        },
      ]);
      setDirectColorsState([{ id: 'c-1', color: 'Noir', quantity: 10 }]);
    }
    setError(null);
  }, [initialData, isOpen]);

  // When category changes
  const handleCategoryChange = (newCat: EquipmentCategory) => {
    setCategory(newCat);
    const catCfg = EQUIPMENT_TYPES.find((t) => t.id === newCat);
    if (!catCfg) return;

    let newBrand = catCfg.defaultBrand;
    let newModel = '';
    const shouldHaveSizes = newCat !== 'autres';
    setHasSizes(shouldHaveSizes);

    if (newCat === 'gants') {
      newModel = 'Challenger';
      setSizesState([
        {
          id: 'sz-1',
          size: '12 oz',
          colors: [
            { id: 'c-1', color: 'Noir', quantity: 5 },
            { id: 'c-2', color: 'Gold / Noir', quantity: 3 },
          ],
        },
      ]);
    } else if (newCat === 'bandes') {
      newModel = 'Élastique Pro';
      setSizesState([
        {
          id: 'sz-1',
          size: '4,5m',
          colors: [{ id: 'c-1', color: 'Noir / Assorti', quantity: 20 }],
        },
      ]);
    } else if (newCat === 'protege_tibias') {
      newModel = 'SHPA20';
      setSizesState([
        {
          id: 'sz-1',
          size: 'M',
          colors: [{ id: 'c-1', color: 'Noir', quantity: 5 }],
        },
        {
          id: 'sz-2',
          size: 'L',
          colors: [{ id: 'c-2', color: 'Noir', quantity: 5 }],
        },
      ]);
    } else if (newCat === 'protege_dents') {
      newModel = 'BK 035';
      setHasSizes(false);
      setDirectColorsState([
        { id: 'c-1', color: 'Noir', quantity: 10 },
        { id: 'c-2', color: 'Blanc', quantity: 5 },
      ]);
    } else if (newCat === 'coquilles') {
      newModel = 'Anatomique Cup';
      setSizesState([
        {
          id: 'sz-1',
          size: 'M',
          colors: [{ id: 'c-1', color: 'Noir', quantity: 10 }],
        },
      ]);
    } else {
      setHasSizes(false);
      setDirectColorsState([{ id: 'c-1', color: 'Noir', quantity: 5 }]);
    }

    setBrand(newBrand);
    setModel(newModel);

    if (!isNameManuallyEdited) {
      setName(generateSuggestedName(newCat, newBrand, newModel));
    }
  };

  // Live computed total quantity
  const totalCalculatedQuantity = useMemo(() => {
    if (hasSizes) {
      return sizesState.reduce((sum, sz) => {
        return sum + sz.colors.reduce((cSum, c) => cSum + (Number(c.quantity) || 0), 0);
      }, 0);
    }
    return directColorsState.reduce((sum, c) => sum + (Number(c.quantity) || 0), 0);
  }, [hasSizes, sizesState, directColorsState]);

  // Size manipulation
  const addSize = (sizePreset?: string) => {
    const newId = `sz-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setSizesState((prev) => [
      ...prev,
      {
        id: newId,
        size: sizePreset || '',
        colors: [{ id: `c-${Date.now()}`, color: 'Noir', quantity: 5 }],
      },
    ]);
  };

  const removeSize = (sizeId: string) => {
    setSizesState((prev) => prev.filter((s) => s.id !== sizeId));
  };

  const updateSizeName = (sizeId: string, newSize: string) => {
    setSizesState((prev) =>
      prev.map((s) => (s.id === sizeId ? { ...s, size: newSize } : s))
    );
  };

  // Color inside size manipulation
  const addColorToSize = (sizeId: string, colorPreset?: string) => {
    setSizesState((prev) =>
      prev.map((s) => {
        if (s.id !== sizeId) return s;
        return {
          ...s,
          colors: [
            ...s.colors,
            {
              id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
              color: colorPreset || 'Noir',
              quantity: 5,
            },
          ],
        };
      })
    );
  };

  const removeColorFromSize = (sizeId: string, colorId: string) => {
    setSizesState((prev) =>
      prev.map((s) => {
        if (s.id !== sizeId) return s;
        return {
          ...s,
          colors: s.colors.filter((c) => c.id !== colorId),
        };
      })
    );
  };

  const updateColorInSize = (
    sizeId: string,
    colorId: string,
    updates: { color?: string; quantity?: number }
  ) => {
    setSizesState((prev) =>
      prev.map((s) => {
        if (s.id !== sizeId) return s;
        return {
          ...s,
          colors: s.colors.map((c) =>
            c.id === colorId ? { ...c, ...updates } : c
          ),
        };
      })
    );
  };

  // Direct color manipulation (when hasSizes === false)
  const addDirectColor = (colorPreset?: string) => {
    setDirectColorsState((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        color: colorPreset || 'Noir',
        quantity: 5,
      },
    ]);
  };

  const removeDirectColor = (colorId: string) => {
    setDirectColorsState((prev) => prev.filter((c) => c.id !== colorId));
  };

  const updateDirectColor = (
    colorId: string,
    updates: { color?: string; quantity?: number }
  ) => {
    setDirectColorsState((prev) =>
      prev.map((c) => (c.id === colorId ? { ...c, ...updates } : c))
    );
  };

  const currSymbol = CURRENCY_CONFIG[currency]?.symbol || 'DH';
  const profitMargin = sellingPrice - costPrice;
  const marginPercent = costPrice > 0 ? Math.round((profitMargin / costPrice) * 100) : 0;
  const activeCategoryCfg = EQUIPMENT_TYPES.find((t) => t.id === category);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Veuillez spécifier le nom du matériel');
      return;
    }

    // Build sizes array
    let finalSizes: SizeVariant[] = [];

    if (hasSizes) {
      finalSizes = sizesState
        .filter((sz) => sz.colors && sz.colors.length > 0)
        .map((sz) => ({
          size: sz.size.trim() || 'Unique',
          colors: sz.colors
            .filter((c) => c.color.trim())
            .map((c) => ({
              color: c.color.trim(),
              quantity: Math.max(0, Number(c.quantity) || 0),
            })),
        }));
    } else {
      finalSizes = [
        {
          colors: directColorsState
            .filter((c) => c.color.trim())
            .map((c) => ({
              color: c.color.trim(),
              quantity: Math.max(0, Number(c.quantity) || 0),
            })),
        },
      ];
    }

    if (
      finalSizes.length === 0 ||
      finalSizes.every((sz) => !sz.colors || sz.colors.length === 0)
    ) {
      setError('Veuillez ajouter au moins une couleur avec une quantité pour ce matériel.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        category,
        brand: brand.trim() || 'Générique',
        model: model.trim() || undefined,
        sizes: finalSizes,
        minStockAlert: Number(minStockAlert) || 3,
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        barcode: barcode.trim() || undefined,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l’enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl my-8 overflow-hidden text-zinc-100 animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 text-red-500 flex items-center justify-center font-bold text-lg">
              {activeCategoryCfg?.icon || '📦'}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>{initialData ? 'Modifier l’Équipement' : 'Ajouter un Nouvel Équipement'}</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono font-medium">
                  {totalCalculatedQuantity} pcs au total
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Gestion des quantités par couleur pour chaque taille (sans quantité globale brute).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/80 text-red-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: CATEGORY SELECTION */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              1. Catégorie d’Équipement
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {EQUIPMENT_TYPES.map((t) => {
                const isSelected = category === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleCategoryChange(t.id)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${
                      isSelected
                        ? 'bg-zinc-800 border-red-500 text-white shadow-sm ring-1 ring-red-500/50'
                        : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-xl">{t.icon}</span>
                    <span className="text-[11px] font-bold truncate w-full">{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: GENERAL DETAILS (BRAND, MODEL, NAME) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Marque / Fabricant *
              </label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => {
                  setBrand(e.target.value);
                  if (!isNameManuallyEdited) {
                    setName(generateSuggestedName(category, e.target.value, model));
                  }
                }}
                placeholder="ex: Venum, Fairtex, Pakka, Baklee"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Modèle / Gamme
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  if (!isNameManuallyEdited) {
                    setName(generateSuggestedName(category, brand, e.target.value));
                  }
                }}
                placeholder="ex: Challenger, BX1010, SHPA20"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Désignation Commerciale du Produit *
              </label>
              {!isNameManuallyEdited && (
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Nom auto-généré
                </span>
              )}
            </div>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setIsNameManuallyEdited(true);
              }}
              placeholder="ex: Gants Venum Challenger"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold placeholder-zinc-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* STEP 3: TAILLES ET COULEURS AVEC QUANTITÉS (CŒUR DE LA DEMANDE) */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-red-500" />
                  <span>Gestion des Tailles et Couleurs</span>
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Chaque taille dispose de ses propres couleurs et de leurs quantités individuelles.
                </p>
              </div>

              {/* Toggle Has Sizes */}
              <label className="flex items-center gap-2 cursor-pointer bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl hover:border-zinc-700 transition-colors">
                <input
                  type="checkbox"
                  checked={hasSizes}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setHasSizes(checked);
                    if (checked && sizesState.length === 0) {
                      setSizesState([
                        {
                          id: 'sz-1',
                          size: activeCategoryCfg?.defaultSizes[0] || '12 oz',
                          colors: [{ id: 'c-1', color: 'Noir', quantity: 5 }],
                        },
                      ]);
                    } else if (!checked && directColorsState.length === 0) {
                      setDirectColorsState([{ id: 'c-1', color: 'Noir', quantity: 5 }]);
                    }
                  }}
                  className="w-4 h-4 rounded border-zinc-700 text-red-600 focus:ring-0 bg-zinc-950"
                />
                <span className="text-xs font-semibold text-zinc-300">
                  Cet équipement a des tailles
                </span>
              </label>
            </div>

            {/* CASE A: WITH SIZES (TAILLES) */}
            {hasSizes ? (
              <div className="space-y-4">
                {/* Size preset chips for quick addition */}
                {activeCategoryCfg && activeCategoryCfg.defaultSizes.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">
                      Tailles suggérées :
                    </span>
                    {activeCategoryCfg.defaultSizes.map((szPreset) => (
                      <button
                        key={szPreset}
                        type="button"
                        onClick={() => addSize(szPreset)}
                        className="px-2 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 font-medium transition-colors"
                      >
                        + {szPreset}
                      </button>
                    ))}
                  </div>
                )}

                {/* List of sizes */}
                <div className="space-y-3">
                  {sizesState.map((sizeEntry, sIdx) => (
                    <div
                      key={sizeEntry.id}
                      className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-3"
                    >
                      {/* Size row */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 max-w-xs">
                          <span className="text-xs font-bold text-red-400">Taille :</span>
                          <input
                            type="text"
                            required
                            value={sizeEntry.size}
                            onChange={(e) => updateSizeName(sizeEntry.id, e.target.value)}
                            placeholder="ex: 12 oz, S, M, 4,5m"
                            className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold focus:outline-none focus:border-red-500 flex-1"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-zinc-400 font-semibold">
                            Sous-total :{' '}
                            <strong className="text-white">
                              {sizeEntry.colors.reduce((s, c) => s + (Number(c.quantity) || 0), 0)} pcs
                            </strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSize(sizeEntry.id)}
                            className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                            title="Supprimer cette taille"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Colors of this size */}
                      <div className="space-y-2 pt-1 border-t border-zinc-800/60">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                          Couleurs et Quantités pour la taille "{sizeEntry.size || 'Sans nom'}" :
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {sizeEntry.colors.map((colorItem) => (
                            <div
                              key={colorItem.id}
                              className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950 border border-zinc-800"
                            >
                              <input
                                type="text"
                                required
                                value={colorItem.color}
                                onChange={(e) =>
                                  updateColorInSize(sizeEntry.id, colorItem.id, {
                                    color: e.target.value,
                                  })
                                }
                                placeholder="Couleur (ex: Noir, Rouge...)"
                                className="bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs text-white font-medium flex-1 focus:outline-none focus:border-red-500"
                              />

                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[10px] text-zinc-400 font-bold">Qté:</span>
                                <input
                                  type="number"
                                  min="0"
                                  required
                                  value={colorItem.quantity}
                                  onChange={(e) =>
                                    updateColorInSize(sizeEntry.id, colorItem.id, {
                                      quantity: Math.max(0, parseInt(e.target.value) || 0),
                                    })
                                  }
                                  className="w-14 bg-zinc-900 border border-zinc-800 rounded-md px-1.5 py-1 text-xs text-white font-black text-center focus:outline-none focus:border-red-500"
                                />
                                <span className="text-[10px] text-zinc-400">pcs</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeColorFromSize(sizeEntry.id, colorItem.id)}
                                className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                                title="Supprimer cette couleur"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add color button for this size */}
                        <div className="pt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => addColorToSize(sizeEntry.id, 'Noir')}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Ajouter une couleur</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new size button */}
                <button
                  type="button"
                  onClick={() => addSize()}
                  className="w-full py-2.5 rounded-xl border border-dashed border-zinc-700 hover:border-red-500 bg-zinc-950/60 hover:bg-zinc-900 text-zinc-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4 text-red-500" />
                  <span>Ajouter une autre taille</span>
                </button>
              </div>
            ) : (
              /* CASE B: WITHOUT SIZES (COULEURS SEULEMENT) */
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                  Couleurs et Quantités disponibles :
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {directColorsState.map((colorItem) => (
                    <div
                      key={colorItem.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800"
                    >
                      <input
                        type="text"
                        required
                        value={colorItem.color}
                        onChange={(e) =>
                          updateDirectColor(colorItem.id, { color: e.target.value })
                        }
                        placeholder="Couleur (ex: Noir, Rouge, Transparent...)"
                        className="bg-zinc-950 border border-zinc-800 rounded-md px-2 py-1 text-xs text-white font-medium flex-1 focus:outline-none focus:border-red-500"
                      />

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-zinc-400 font-bold">Qté:</span>
                        <input
                          type="number"
                          min="0"
                          required
                          value={colorItem.quantity}
                          onChange={(e) =>
                            updateDirectColor(colorItem.id, {
                              quantity: Math.max(0, parseInt(e.target.value) || 0),
                            })
                          }
                          className="w-14 bg-zinc-950 border border-zinc-800 rounded-md px-1.5 py-1 text-xs text-white font-black text-center focus:outline-none focus:border-red-500"
                        />
                        <span className="text-[10px] text-zinc-400">pcs</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeDirectColor(colorItem.id)}
                        className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                        title="Supprimer cette couleur"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addDirectColor('Noir')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter une couleur</span>
                </button>
              </div>
            )}

            {/* Total Stock Summary Banner */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800/80">
              <span className="text-xs text-zinc-400">
                Stock total calculé (somme des couleurs) :
              </span>
              <span className="text-sm font-black text-emerald-400">
                {totalCalculatedQuantity} pcs
              </span>
            </div>
          </div>

          {/* STEP 4: ALERT LIMIT & PRICING */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Seuil d’Alerte Stock Faible
              </label>
              <input
                type="number"
                min="0"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(parseInt(e.target.value) || 0)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Prix d’Achat Fournisseur ({currSymbol})
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white font-semibold focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-400 mb-1.5">
                Prix de Vente Client ({currSymbol}) *
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
              />
              <div className="text-[10px] text-zinc-400 mt-1 flex items-center justify-between">
                <span>Marge :</span>
                <span className={`font-bold ${profitMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {profitMargin >= 0 ? `+${profitMargin.toFixed(1)}` : profitMargin.toFixed(1)} {currSymbol}
                  {costPrice > 0 && ` (${marginPercent}%)`}
                </span>
              </div>
            </div>
          </div>

          {/* STEP 5: BARCODE & DESCRIPTION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Code-Barres / SKU
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="ex: GNT-VNM-CH-001"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Description / Remarques
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ex: Cuir synthétique premium, triple densité..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Enregistrement...' : 'Enregistrer le Matériel'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
