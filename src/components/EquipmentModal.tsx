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
  Minus,
  Trash2,
  Layers,
  ChevronDown,
  Info,
  Check,
  Palette,
} from 'lucide-react';
import { Equipment, EquipmentCategory, SizeVariant } from '@/types/inventory';
import { CurrencyCode, CURRENCY_CONFIG } from '@/lib/currency';
import { STANDARD_COLORS, getColorSwatch } from '@/lib/categoryColors';

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
  description: string;
}> = [
  {
    id: 'gants',
    name: 'Gants de Boxe',
    icon: '🥊',
    defaultBrand: 'Venum',
    defaultSizes: ['10 oz', '12 oz', '14 oz', '16 oz'],
    description: 'Tailles en Oz (10oz, 12oz, 14oz...), modèles compétition et entraînement.',
  },
  {
    id: 'bandes',
    name: 'Bandes de Boxe',
    icon: '🎗️',
    defaultBrand: 'Standard Pro',
    defaultSizes: ['3,5m', '4,5m', '5,5m'],
    description: 'Longueurs en mètres (3,5m, 4,5m, 5,5m), matière coton / semi-élastique.',
  },
  {
    id: 'protege_tibias',
    name: 'Protège-Tibias',
    icon: '🦵',
    defaultBrand: 'Pakka',
    defaultSizes: ['S', 'M', 'L', 'XL'],
    description: 'Formats rigides à attaches ou chaussettes élastiques ("T9chira").',
  },
  {
    id: 'protege_dents',
    name: 'Protège-Dents',
    icon: '🦷',
    defaultBrand: 'Baklee',
    defaultSizes: ['Adulte (Senior)', 'Enfant (Junior)'],
    description: 'Simple, thermo-moulable ou boîte incluse, taille Adulte / Enfant.',
  },
  {
    id: 'coquilles',
    name: 'Coquilles de Protection',
    icon: '🛡️',
    defaultBrand: 'Standard Pro',
    defaultSizes: ['S', 'M', 'L', 'XL'],
    description: 'Slip avec poche ou cup anatomique rigide, tailles S, M, L, XL.',
  },
  {
    id: 'autres',
    name: 'Autres Accessoires',
    icon: '⚡',
    defaultBrand: 'Dojo Pro',
    defaultSizes: ['Unique', 'S', 'M', 'L'],
    description: 'Casques, paos, pattes d’ours, cordes à sauter, chevillères.',
  },
];

interface ColorEntryState {
  id: string;
  color: string;
  isCustom: boolean;
  quantity: number;
}

interface SizeEntryState {
  id: string;
  size: string;
  colors: ColorEntryState[];
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
  const [directColorsState, setDirectColorsState] = useState<ColorEntryState[]>([]);

  // Default quantity for newly added colors
  const [newColorDefaultQty, setNewColorDefaultQty] = useState<number>(10);

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

  const isColorInPresets = (cName: string) => {
    return STANDARD_COLORS.some(
      (p) => p.value.toLowerCase() === (cName || '').trim().toLowerCase()
    );
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
                color: c.color || 'Noir',
                isCustom: !isColorInPresets(c.color || 'Noir'),
                quantity: Number(c.quantity) || 0,
              })),
            }))
          );
        } else {
          const allColors = (initialData.sizes[0]?.colors || []).map((c) => ({
            id: `c-${Math.random().toString(36).substring(2, 7)}`,
            color: c.color || 'Noir',
            isCustom: !isColorInPresets(c.color || 'Noir'),
            quantity: Number(c.quantity) || 0,
          }));
          setDirectColorsState(
            allColors.length > 0
              ? allColors
              : [{ id: 'c-1', color: 'Noir', isCustom: false, quantity: 10 }]
          );
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
            { id: 'c-1', color: 'Noir', isCustom: false, quantity: 10 },
            { id: 'c-2', color: 'Rouge / Noir', isCustom: false, quantity: 10 },
          ],
        },
        {
          id: 'sz-2',
          size: '14 oz',
          colors: [{ id: 'c-3', color: 'Noir', isCustom: false, quantity: 10 }],
        },
      ]);
      setDirectColorsState([
        { id: 'c-1', color: 'Noir', isCustom: false, quantity: 10 },
      ]);
    }
    setError(null);
  }, [initialData, isOpen]);

  // When category changes
  const handleCategoryChange = (newCat: EquipmentCategory) => {
    setCategory(newCat);
    const catCfg = EQUIPMENT_TYPES.find((t) => t.id === newCat);
    if (!catCfg) return;

    const newBrand = catCfg.defaultBrand;
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
            { id: 'c-1', color: 'Noir', isCustom: false, quantity: 10 },
            { id: 'c-2', color: 'Gold / Noir', isCustom: false, quantity: 5 },
          ],
        },
      ]);
    } else if (newCat === 'bandes') {
      newModel = 'Élastique Pro';
      setSizesState([
        {
          id: 'sz-1',
          size: '4,5m',
          colors: [{ id: 'c-1', color: 'Noir / Assorti', isCustom: false, quantity: 30 }],
        },
      ]);
    } else if (newCat === 'protege_tibias') {
      newModel = 'SHPA20';
      setSizesState([
        {
          id: 'sz-1',
          size: 'M',
          colors: [{ id: 'c-1', color: 'Noir', isCustom: false, quantity: 10 }],
        },
        {
          id: 'sz-2',
          size: 'L',
          colors: [{ id: 'c-2', color: 'Noir', isCustom: false, quantity: 10 }],
        },
      ]);
    } else if (newCat === 'protege_dents') {
      newModel = 'BK 035';
      setHasSizes(false);
      setDirectColorsState([
        { id: 'c-1', color: 'Noir', isCustom: false, quantity: 20 },
        { id: 'c-2', color: 'Blanc', isCustom: false, quantity: 10 },
      ]);
    } else if (newCat === 'coquilles') {
      newModel = 'Anatomique Cup';
      setSizesState([
        {
          id: 'sz-1',
          size: 'M',
          colors: [{ id: 'c-1', color: 'Noir', isCustom: false, quantity: 15 }],
        },
      ]);
    } else {
      setHasSizes(false);
      setDirectColorsState([{ id: 'c-1', color: 'Noir', isCustom: false, quantity: 10 }]);
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
        colors: [
          {
            id: `c-${Date.now()}`,
            color: 'Noir',
            isCustom: false,
            quantity: newColorDefaultQty,
          },
        ],
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

  // Bulk quantity setter for all colors of a specific size
  const applyBulkQuantityToSize = (sizeId: string, targetQty: number) => {
    setSizesState((prev) =>
      prev.map((s) => {
        if (s.id !== sizeId) return s;
        return {
          ...s,
          colors: s.colors.map((c) => ({ ...c, quantity: targetQty })),
        };
      })
    );
  };

  // Color inside size manipulation
  const addColorToSize = (sizeId: string, colorPreset: string = 'Noir', qty: number = newColorDefaultQty) => {
    setSizesState((prev) =>
      prev.map((s) => {
        if (s.id !== sizeId) return s;
        return {
          ...s,
          colors: [
            ...s.colors,
            {
              id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
              color: colorPreset,
              isCustom: false,
              quantity: qty,
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
    updates: Partial<ColorEntryState>
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
  const addDirectColor = (colorPreset: string = 'Noir', qty: number = newColorDefaultQty) => {
    setDirectColorsState((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        color: colorPreset,
        isCustom: false,
        quantity: qty,
      },
    ]);
  };

  const removeDirectColor = (colorId: string) => {
    setDirectColorsState((prev) => prev.filter((c) => c.id !== colorId));
  };

  const updateDirectColor = (
    colorId: string,
    updates: Partial<ColorEntryState>
  ) => {
    setDirectColorsState((prev) =>
      prev.map((c) => (c.id === colorId ? { ...c, ...updates } : c))
    );
  };

  // Apply bulk quantity to all direct colors
  const applyBulkQuantityToDirect = (targetQty: number) => {
    setDirectColorsState((prev) =>
      prev.map((c) => ({ ...c, quantity: targetQty }))
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

  /** Renders color selector row with select dropdown, visual swatch, and flexible quantity controls */
  const renderColorRow = (
    colorItem: ColorEntryState,
    onUpdate: (updates: Partial<ColorEntryState>) => void,
    onRemove: () => void
  ) => {
    const isCustom = colorItem.isCustom;
    const swatch = getColorSwatch(colorItem.color);

    return (
      <div
        key={colorItem.id}
        className="p-3 rounded-xl bg-[#101828] border border-[#23314d] space-y-2 hover:border-slate-600 transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Color Selection via Dropdown (no need to type) */}
          <div className="flex-1 flex items-center gap-2">
            {/* Visual Swatch Circle */}
            <div
              className="w-6 h-6 rounded-full shrink-0 border border-slate-500 shadow-sm"
              style={{ background: swatch }}
              title={colorItem.color}
            />

            {!isCustom ? (
              <select
                value={colorItem.color}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    onUpdate({ isCustom: true, color: '' });
                  } else {
                    onUpdate({ color: e.target.value, isCustom: false });
                  }
                }}
                className="w-full bg-[#162138] border border-[#2d3e63] rounded-lg px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                <optgroup label="Couleurs Classiques">
                  {STANDARD_COLORS.filter((c) => c.group === 'Classique').map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Combinaisons Bicolores">
                  {STANDARD_COLORS.filter((c) => c.group === 'Combinaisons Bicolores').map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Spécial & Fluo">
                  {STANDARD_COLORS.filter((c) => c.group === 'Spécial & Fluo').map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
                <option value="__custom__" className="text-rose-400 font-bold">
                  + Autre couleur (saisie personnalisée)...
                </option>
              </select>
            ) : (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  required
                  autoFocus
                  value={colorItem.color}
                  onChange={(e) => onUpdate({ color: e.target.value })}
                  placeholder="Tapez le nom de la couleur..."
                  className="w-full bg-[#162138] border border-rose-500/80 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => onUpdate({ isCustom: false, color: 'Noir' })}
                  className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold whitespace-nowrap"
                  title="Revenir à la liste déroulante"
                >
                  Liste
                </button>
              </div>
            )}
          </div>

          {/* Flexible Quantity Controls: Type 1, 10, 100 or use quick stepper/boosters */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Quantité :</span>

            {/* Stepper -1 */}
            <button
              type="button"
              onClick={() => onUpdate({ quantity: Math.max(0, colorItem.quantity - 1) })}
              className="w-7 h-7 rounded-lg bg-[#1a253e] hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>

            {/* Direct Editable Quantity Input: User can type 1, 10, 100, 500, etc. */}
            <input
              type="number"
              min="0"
              required
              value={colorItem.quantity}
              onChange={(e) => onUpdate({ quantity: Math.max(0, parseInt(e.target.value) || 0) })}
              className="w-16 bg-[#162138] border border-[#2e4066] rounded-lg px-2 py-1 text-sm text-white font-black text-center focus:outline-none focus:border-rose-500"
            />

            {/* Stepper +1 */}
            <button
              type="button"
              onClick={() => onUpdate({ quantity: colorItem.quantity + 1 })}
              className="w-7 h-7 rounded-lg bg-[#1a253e] hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>

            {/* Quick boost shortcuts: +10, +50, +100 */}
            <div className="flex items-center gap-1 pl-1">
              {[10, 50, 100].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => onUpdate({ quantity: colorItem.quantity + step })}
                  className="px-2 py-1 rounded-md bg-[#18233a] hover:bg-rose-950/60 hover:text-rose-300 border border-[#2a3a5a] text-xs font-bold text-slate-300 transition-colors"
                  title={`Ajouter +${step} pièces`}
                >
                  +{step}
                </button>
              ))}
            </div>

            {/* Delete Color */}
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors ml-1"
              title="Supprimer cette couleur"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-[#0e1628] border border-[#202c46] rounded-2xl w-full max-w-3xl shadow-2xl my-8 overflow-hidden text-slate-100 animate-scaleUp ring-1 ring-slate-800">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#202c46] bg-[#121b30]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center font-bold text-lg shadow-sm">
              {activeCategoryCfg?.icon || '📦'}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>{initialData ? 'Modifier l’Équipement' : 'Nouveau Matériel Kickboxing'}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  {totalCalculatedQuantity} pcs au total
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Choix des couleurs par liste déroulante et réglage libre des quantités (1, 10, 100 pcs...).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 text-xs flex items-center gap-3 font-semibold">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: CATEGORY SELECTION */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
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
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                      isSelected
                        ? 'bg-[#18233c] border-rose-500 text-white shadow-md ring-2 ring-rose-500/30'
                        : 'bg-[#101828] border-[#22304d] text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-2xl">{t.icon}</span>
                    <span className="text-xs font-bold truncate w-full">{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: GENERAL DETAILS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
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
                className="w-full bg-[#121a2d] border border-[#23314d] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
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
                className="w-full bg-[#121a2d] border border-[#23314d] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-200">
                Désignation Commerciale du Produit *
              </label>
              {!isNameManuallyEdited && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Nom auto-généré
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
              className="w-full bg-[#121a2d] border border-[#23314d] rounded-xl px-4 py-2.5 text-sm text-white font-extrabold placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* STEP 3: TAILLES ET COULEURS PAR SELECT AVEC QUANTITÉS FLEXIBLES */}
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-[#202d48] space-y-4 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202d48] pb-4">
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-rose-500" />
                  <span>Gestion des Tailles, Couleurs & Quantités</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sélectionnez les couleurs dans la liste déroulante et ajustez les quantités (1, 10, 100 pcs...).
                </p>
              </div>

              {/* Toggle Has Sizes */}
              <label className="flex items-center gap-2.5 cursor-pointer bg-[#141e33] border border-[#283756] px-3.5 py-2 rounded-xl hover:border-slate-500 transition-colors">
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
                          colors: [
                            { id: 'c-1', color: 'Noir', isCustom: false, quantity: 10 },
                          ],
                        },
                      ]);
                    } else if (!checked && directColorsState.length === 0) {
                      setDirectColorsState([
                        { id: 'c-1', color: 'Noir', isCustom: false, quantity: 10 },
                      ]);
                    }
                  }}
                  className="w-4 h-4 rounded border-slate-600 text-rose-600 focus:ring-0 bg-[#0c1220]"
                />
                <span className="text-xs font-bold text-slate-200">
                  Cet équipement a des tailles (ex: 12oz, M, L)
                </span>
              </label>
            </div>

            {/* Quick Bulk Preset Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#141e33] border border-[#23314d]">
              <span className="text-xs font-bold text-slate-300">
                Quantité par défaut pour nouvelles couleurs :
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 5, 10, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setNewColorDefaultQty(preset)}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                      newColorDefaultQty === preset
                        ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400'
                        : 'bg-[#1b2742] text-slate-300 hover:text-white border border-[#2a3b5e]'
                    }`}
                  >
                    {preset} pcs
                  </button>
                ))}
              </div>
            </div>

            {/* CASE A: WITH SIZES (TAILLES) */}
            {hasSizes ? (
              <div className="space-y-4">
                {/* Size preset chips for quick addition */}
                {activeCategoryCfg && activeCategoryCfg.defaultSizes.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-400">
                      Tailles suggérées :
                    </span>
                    {activeCategoryCfg.defaultSizes.map((szPreset) => (
                      <button
                        key={szPreset}
                        type="button"
                        onClick={() => addSize(szPreset)}
                        className="px-3 py-1 rounded-lg bg-[#141e33] hover:bg-slate-700 border border-[#283756] text-xs text-slate-200 font-bold transition-colors"
                      >
                        + {szPreset}
                      </button>
                    ))}
                  </div>
                )}

                {/* List of sizes */}
                <div className="space-y-3">
                  {sizesState.map((sizeEntry) => (
                    <div
                      key={sizeEntry.id}
                      className="p-4 rounded-xl bg-[#131c31] border border-[#253454] space-y-3 shadow-sm"
                    >
                      {/* Size row */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <span className="text-xs font-extrabold text-rose-400">Taille :</span>
                          <input
                            type="text"
                            required
                            value={sizeEntry.size}
                            onChange={(e) => updateSizeName(sizeEntry.id, e.target.value)}
                            placeholder="ex: 12 oz, S, M, 4,5m"
                            className="bg-[#0e1628] border border-[#2c3d61] rounded-lg px-3 py-1.5 text-xs text-white font-extrabold focus:outline-none focus:border-rose-500 flex-1"
                          />
                        </div>

                        {/* Quick bulk apply to this size */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
                            Remplir tout à :
                          </span>
                          <div className="flex items-center gap-1">
                            {[10, 50, 100].map((qty) => (
                              <button
                                key={qty}
                                type="button"
                                onClick={() => applyBulkQuantityToSize(sizeEntry.id, qty)}
                                className="px-2 py-0.5 rounded bg-[#1c2944] hover:bg-slate-700 text-xs font-bold text-slate-300 border border-[#2e4168]"
                                title={`Définir ${qty} pcs pour toutes les couleurs de ${sizeEntry.size}`}
                              >
                                {qty}
                              </button>
                            ))}
                          </div>

                          <span className="text-xs text-slate-300 font-bold pl-2 border-l border-slate-700">
                            Total :{' '}
                            <strong className="text-emerald-400">
                              {sizeEntry.colors.reduce((s, c) => s + (Number(c.quantity) || 0), 0)} pcs
                            </strong>
                          </span>

                          <button
                            type="button"
                            onClick={() => removeSize(sizeEntry.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors ml-1"
                            title="Supprimer cette taille"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Colors of this size */}
                      <div className="space-y-2 pt-2 border-t border-[#23314d]">
                        <span className="text-xs font-bold text-slate-300 block">
                          Couleurs sélectionnées pour la taille "{sizeEntry.size || 'Sans nom'}" :
                        </span>

                        <div className="space-y-2">
                          {sizeEntry.colors.map((colorItem) =>
                            renderColorRow(
                              colorItem,
                              (updates) => updateColorInSize(sizeEntry.id, colorItem.id, updates),
                              () => removeColorFromSize(sizeEntry.id, colorItem.id)
                            )
                          )}
                        </div>

                        {/* Add color button for this size */}
                        <div className="pt-2 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => addColorToSize(sizeEntry.id, 'Noir', newColorDefaultQty)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a2642] hover:bg-slate-700 text-slate-200 text-xs font-bold border border-[#2b3c62] transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 text-rose-400" />
                            <span>Ajouter une couleur ({newColorDefaultQty} pcs)</span>
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
                  className="w-full py-3 rounded-xl border border-dashed border-[#2f4268] hover:border-rose-500 bg-[#121b30] hover:bg-[#16213a] text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4 text-rose-500" />
                  <span>Ajouter une autre taille</span>
                </button>
              </div>
            ) : (
              /* CASE B: WITHOUT SIZES (COULEURS SEULEMENT) */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 block">
                    Couleurs disponibles :
                  </span>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span>Remplir tout à :</span>
                    {[10, 50, 100].map((qty) => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => applyBulkQuantityToDirect(qty)}
                        className="px-2 py-0.5 rounded bg-[#1c2944] hover:bg-slate-700 text-xs font-bold text-slate-300 border border-[#2e4168]"
                      >
                        {qty} pcs
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {directColorsState.map((colorItem) =>
                    renderColorRow(
                      colorItem,
                      (updates) => updateDirectColor(colorItem.id, updates),
                      () => removeDirectColor(colorItem.id)
                    )
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => addDirectColor('Noir', newColorDefaultQty)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#18233a] hover:bg-slate-700 text-slate-200 text-xs font-bold border border-[#2a3b5c] transition-colors"
                >
                  <Plus className="w-4 h-4 text-rose-400" />
                  <span>Ajouter une couleur ({newColorDefaultQty} pcs)</span>
                </button>
              </div>
            )}

            {/* Total Stock Summary Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#141f36] border border-[#26375a]">
              <span className="text-xs font-bold text-slate-300">
                Stock total calculé (somme de toutes les couleurs) :
              </span>
              <span className="text-base font-black text-emerald-400">
                {totalCalculatedQuantity} pièces
              </span>
            </div>
          </div>

          {/* STEP 4: ALERT LIMIT & PRICING */}
          <div className="p-4 rounded-2xl bg-[#0f172a] border border-[#202d48] space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider">
              Tarification & Alertes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-emerald-400 mb-1.5">
                  Prix de Vente Client ({currSymbol}) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                  placeholder="Ce que l'adhérent paie"
                  className="w-full bg-[#121a2d] border border-emerald-500/70 rounded-xl px-3.5 py-2.5 text-sm text-emerald-300 font-black focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Montant payé par l'élève</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Prix d’Achat Fournisseur ({currSymbol})
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                  placeholder="Ce que vous avez payé"
                  className="w-full bg-[#121a2d] border border-[#23314d] rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-rose-500"
                />
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Gain net :</span>
                  <span
                    className={`font-black ${
                      profitMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {profitMargin >= 0 ? `+${profitMargin.toFixed(1)}` : profitMargin.toFixed(1)}{' '}
                    {currSymbol}
                    {costPrice > 0 && ` (${marginPercent}%)`}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Alerter quand le stock descend à :
                </label>
                <input
                  type="number"
                  min="0"
                  value={minStockAlert}
                  onChange={(e) => setMinStockAlert(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#121a2d] border border-[#23314d] rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-rose-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Devient jaune quand il reste ce nombre</p>
              </div>
            </div>
          </div>

          {/* STEP 5: OPTIONAL DETAILS (BARCODE & DESCRIPTION) */}
          <details className="rounded-2xl bg-[#0f172a] border border-[#202d48] p-4 group">
            <summary className="text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer flex items-center justify-between list-none">
              <span>➕ Détails avancés (Code-barres, notes...) · Facultatif</span>
              <span className="text-xs text-slate-500 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-[#1e2c47]">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Code-Barres ou Référence interne
                </label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="ex: GNT-VNM-001 (laisser vide si pas besoin)"
                  className="w-full bg-[#121a2d] border border-[#23314d] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Description / Remarques
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ex: Matière cuir synthétique..."
                  className="w-full bg-[#121a2d] border border-[#23314d] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </details>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#202c46]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
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
