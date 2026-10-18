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
import { STANDARD_COLORS, getColorSwatch, CATEGORY_CONFIG } from '@/lib/categoryColors';

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (equipmentData: Partial<Equipment>) => Promise<void>;
  initialData?: Equipment | null;
  currency: CurrencyCode;
}

// Category Configuration & Presets
export const GLOVE_STANDARD_SIZES = [
  '4 oz',
  '6 oz',
  '8 oz',
  '10 oz',
  '12 oz',
  '14 oz',
  '16 oz',
  '18 oz',
  '20 oz',
  '22 oz',
];

export const ALL_GLOVE_SIZES_RANGE = [
  '4 oz',
  '5 oz',
  '6 oz',
  '7 oz',
  '8 oz',
  '9 oz',
  '10 oz',
  '11 oz',
  '12 oz',
  '13 oz',
  '14 oz',
  '15 oz',
  '16 oz',
  '17 oz',
  '18 oz',
  '19 oz',
  '20 oz',
  '21 oz',
  '22 oz',
];

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
    defaultSizes: GLOVE_STANDARD_SIZES,
    description: 'Tailles en Oz de 4 oz à 22 oz (enfants, entraînement, sparring et poids lourds).',
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
    id: 'protections',
    name: 'Protections',
    icon: '🛡️',
    defaultBrand: '',
    defaultSizes: ['Unique', 'S', 'M', 'L', 'XL'],
    description: 'Casques, protège-chevilles, coudières et protections diverses.',
  },
  {
    id: 'textile',
    name: 'Textile',
    icon: '👕',
    defaultBrand: '',
    defaultSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    description: 'T-shirts, débardeurs, sweats et vêtements de sport.',
  },
  {
    id: 'tenue_competition',
    name: 'Tenue de compétition',
    icon: '🥋',
    defaultBrand: 'Full Contact',
    defaultSizes: ['S', 'M', 'L', 'XL'],
    description: 'Ensembles 2 pièces et uniformes de compétition homologués.',
  },
  {
    id: 'pantalon_combat',
    name: 'Pantalon de combat',
    icon: '👖',
    defaultBrand: 'Full Contact',
    defaultSizes: ['S', 'M', 'L', 'XL'],
    description: 'Pantalons kickboxing, full contact et arts martiaux.',
  },
  {
    id: 'textile_competition',
    name: 'Textile de compétition',
    icon: '🎽',
    defaultBrand: '',
    defaultSizes: ['S', 'M', 'L', 'XL'],
    description: 'Maillots sans manches, hauts bicolores de combat.',
  },
  {
    id: 'short_combat',
    name: 'Short de combat',
    icon: '🩳',
    defaultBrand: '',
    defaultSizes: ['S', 'M', 'L', 'XL'],
    description: 'Shorts Muay Thai, Kickboxing et MMA.',
  },
  {
    id: 'tenue_entrainement',
    name: 'Tenue d’entraînement',
    icon: '🏋️',
    defaultBrand: '',
    defaultSizes: ['S', 'M', 'L', 'XL'],
    description: 'Ensembles d’entraînement, rashguards et survêtements.',
  },
  {
    id: 'autres',
    name: 'Autres Accessoires',
    icon: '⚡',
    defaultBrand: '',
    defaultSizes: ['Unique', 'S', 'M', 'L'],
    description: 'Casques, paos, pattes d’ours, cordes à sauter, chevillères.',
  },
];

export interface EquipmentPreset {
  id: string;
  badge: string;
  name: string;
  category: EquipmentCategory;
  brand: string;
  model?: string;
  barcode?: string;
  description?: string;
  hasSizes: boolean;
  sizes: Array<{ size: string; colors: Array<{ color: string; quantity: number }> }>;
  directColors?: Array<{ color: string; quantity: number }>;
}

export const EQUIPMENT_PRESETS: EquipmentPreset[] = [
  {
    id: 'preset-protege-chevilles',
    badge: '1. Protège-chevilles',
    name: 'Protège-chevilles',
    category: 'protections',
    brand: '',
    description: 'Vendu par : paire',
    hasSizes: true,
    sizes: [{ size: 'À renseigner', colors: [{ color: 'Rouge', quantity: 0 }] }],
  },
  {
    id: 'preset-tshirt',
    badge: '2. T-shirt',
    name: 'T-shirt',
    category: 'textile',
    brand: '',
    description: '',
    hasSizes: true,
    sizes: [{ size: 'À renseigner', colors: [{ color: '', quantity: 0 }] }],
  },
  {
    id: 'preset-ensemble-full-contact',
    badge: '3. Ensemble Full Contact',
    name: 'Ensemble Full Contact',
    category: 'tenue_competition',
    brand: 'Full Contact',
    description: 'Vendu par : ensemble de 2 pièces',
    hasSizes: true,
    sizes: [{ size: 'À renseigner', colors: [{ color: 'Noir / rouge', quantity: 0 }] }],
  },
  {
    id: 'preset-pantalon-kickboxing',
    badge: '4. Pantalon Kickboxing Full Contact',
    name: 'Pantalon Kickboxing Full Contact',
    category: 'pantalon_combat',
    brand: 'Full Contact',
    description: '',
    hasSizes: true,
    sizes: [{ size: 'À renseigner', colors: [{ color: '', quantity: 0 }] }],
  },
  {
    id: 'preset-maillot-sans-manches',
    badge: '5. Maillot sans manches',
    name: 'Maillot sans manches',
    category: 'textile_competition',
    brand: '',
    description: '',
    hasSizes: true,
    sizes: [
      {
        size: 'À renseigner',
        colors: [
          { color: 'Rouge / blanc', quantity: 0 },
          { color: 'Bleu / blanc', quantity: 0 },
        ],
      },
    ],
  },
  {
    id: 'preset-short-muay-thai',
    badge: '6. Short de Muay Thai',
    name: 'Short de Muay Thai',
    category: 'short_combat',
    brand: '',
    description: '',
    hasSizes: true,
    sizes: [{ size: 'À renseigner', colors: [{ color: 'Noir / blanc / gris', quantity: 0 }] }],
  },
  {
    id: 'preset-ensemble-ufc',
    badge: '7. Ensemble UFC',
    name: 'Ensemble UFC',
    category: 'tenue_entrainement',
    brand: '',
    description: 'Vendu par : ensemble de 2 pièces',
    hasSizes: true,
    sizes: [{ size: 'À renseigner', colors: [{ color: 'Noir / rouge', quantity: 0 }] }],
  },
  {
    id: 'preset-casque-integral',
    badge: '8. Casque intégral',
    name: 'Casque intégral',
    category: 'protections',
    brand: '',
    model: 'HGVE29',
    barcode: 'HGVE29',
    description: 'Référence : HGVE29',
    hasSizes: true,
    sizes: [
      { size: 'S', colors: [{ color: 'Blanc', quantity: 0 }] },
      { size: 'M', colors: [{ color: 'Blanc', quantity: 0 }] },
      { size: 'L', colors: [{ color: 'Blanc', quantity: 0 }] },
      { size: 'XL', colors: [{ color: 'Blanc', quantity: 0 }] },
    ],
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
    const cfg = CATEGORY_CONFIG[cat];
    const catLabel = cfg?.badge || cfg?.label || 'Équipement';
    return `${catLabel} ${brandStr} ${modelStr}`.replace(/\s+/g, ' ').trim();
  };

  const isColorInPresets = (cName: string) => {
    if (!cName) return true;
    return STANDARD_COLORS.some(
      (p) => p.value.toLowerCase() === (cName || '').trim().toLowerCase()
    );
  };

  // Quick-fill with one of the 8 predefined templates
  const applyPreset = (preset: EquipmentPreset) => {
    setCategory(preset.category);
    setName(preset.name);
    setBrand(preset.brand || '');
    setModel(preset.model || '');
    setBarcode(preset.barcode || '');
    setDescription(preset.description || '');
    setIsNameManuallyEdited(true);
    setCostPrice(0);
    setSellingPrice(0);
    setMinStockAlert(3);
    setHasSizes(preset.hasSizes);

    if (preset.hasSizes && preset.sizes && preset.sizes.length > 0) {
      setSizesState(
        preset.sizes.map((sz, sIdx) => ({
          id: `sz-preset-${sIdx}-${Date.now()}`,
          size: sz.size || '',
          colors: sz.colors.map((c, cIdx) => ({
            id: `c-preset-${sIdx}-${cIdx}-${Date.now()}`,
            color: c.color || '',
            isCustom: !isColorInPresets(c.color || ''),
            quantity: c.quantity || 0,
          })),
        }))
      );
    } else {
      setHasSizes(false);
      setDirectColorsState([
        { id: `c-preset-${Date.now()}`, color: '', isCustom: false, quantity: 0 },
      ]);
    }
    setError(null);
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
                color: c.color || '',
                isCustom: !isColorInPresets(c.color || ''),
                quantity: Number(c.quantity) || 0,
              })),
            }))
          );
        } else {
          const allColors = (initialData.sizes[0]?.colors || []).map((c) => ({
            id: `c-${Math.random().toString(36).substring(2, 7)}`,
            color: c.color || '',
            isCustom: !isColorInPresets(c.color || ''),
            quantity: Number(c.quantity) || 0,
          }));
          setDirectColorsState(
            allColors.length > 0
              ? allColors
              : [{ id: 'c-1', color: '', isCustom: false, quantity: 10 }]
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
    } else if (newCat === 'protections') {
      newModel = '';
      setSizesState([
        {
          id: 'sz-1',
          size: 'Unique',
          colors: [{ id: 'c-1', color: 'Rouge', isCustom: false, quantity: 10 }],
        },
      ]);
    } else if (
      newCat === 'textile' ||
      newCat === 'tenue_competition' ||
      newCat === 'pantalon_combat' ||
      newCat === 'textile_competition' ||
      newCat === 'short_combat' ||
      newCat === 'tenue_entrainement'
    ) {
      newModel = '';
      setSizesState([
        {
          id: 'sz-1',
          size: 'M',
          colors: [{ id: 'c-1', color: 'Noir', isCustom: false, quantity: 5 }],
        },
        {
          id: 'sz-2',
          size: 'L',
          colors: [{ id: 'c-2', color: 'Noir', isCustom: false, quantity: 5 }],
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
    if (sizePreset) {
      const alreadyExists = sizesState.some(
        (s) => s.size.trim().toLowerCase() === sizePreset.trim().toLowerCase()
      );
      if (alreadyExists) {
        alert(`La taille "${sizePreset}" est déjà présente dans la liste.`);
        return;
      }
    }
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

  /** Adds all standard glove sizes from 4 oz to 22 oz in one click without duplicating */
  const addAllStandardGloveSizes = () => {
    const existing = new Set(sizesState.map((s) => s.size.trim().toLowerCase()));
    const missing = GLOVE_STANDARD_SIZES.filter(
      (sz) => !existing.has(sz.toLowerCase())
    );
    if (missing.length === 0) {
      alert('Toutes les tailles standard de 4 oz à 22 oz sont déjà présentes.');
      return;
    }
    const newEntries: SizeEntryState[] = missing.map((sz, idx) => ({
      id: `sz-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
      size: sz,
      colors: [
        {
          id: `c-${Date.now()}-${idx}`,
          color: 'Noir',
          isCustom: false,
          quantity: newColorDefaultQty,
        },
      ],
    }));
    setSizesState((prev) => [...prev, ...newEntries]);
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
            .filter((c) => c.color !== undefined)
            .map((c) => ({
              color: c.color.trim(),
              quantity: Math.max(0, Number(c.quantity) || 0),
            })),
        }));

      // Sort naturally so sizes (e.g. 4 oz, 6 oz, 8 oz, ..., 22 oz) appear in clean ascending order
      finalSizes.sort((a, b) => {
        const numA = parseInt(a.size || '') || 0;
        const numB = parseInt(b.size || '') || 0;
        if (numA && numB) return numA - numB;
        return (a.size || '').localeCompare(b.size || '');
      });
    } else {
      finalSizes = [
        {
          colors: directColorsState
            .filter((c) => c.color !== undefined)
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
      setError('Veuillez ajouter au moins une ligne de variante avec une quantité pour ce matériel.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        category,
        brand: brand.trim(),
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
        className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 hover:border-slate-300 transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Color Selection via Dropdown (no need to type) */}
          <div className="flex-1 flex items-center gap-2">
            {/* Visual Swatch Circle */}
            <div
              className="w-6 h-6 rounded-full shrink-0 border border-slate-300 shadow-sm"
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
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer shadow-sm"
              >
                <option value="">Couleur non spécifiée (laisser vide)</option>
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
                <option value="__custom__" className="text-blue-600 font-bold">
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
                  className="w-full bg-white border border-blue-500 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => onUpdate({ isCustom: false, color: 'Noir' })}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold whitespace-nowrap"
                  title="Revenir à la liste déroulante"
                >
                  Liste
                </button>
              </div>
            )}
          </div>

          {/* Flexible Quantity Controls: Type 1, 10, 100 or use quick stepper/boosters */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Quantité :</span>

            {/* Stepper -1 */}
            <button
              type="button"
              onClick={() => onUpdate({ quantity: Math.max(0, colorItem.quantity - 1) })}
              className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            {/* Direct Editable Quantity Input */}
            <input
              type="number"
              min="0"
              required
              value={colorItem.quantity}
              onChange={(e) => onUpdate({ quantity: Math.max(0, parseInt(e.target.value) || 0) })}
              className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1 text-sm text-slate-900 font-black text-center focus:outline-none focus:border-blue-600 shadow-sm"
            />

            {/* Stepper +1 */}
            <button
              type="button"
              onClick={() => onUpdate({ quantity: colorItem.quantity + 1 })}
              className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            {/* Quick boost shortcuts: +10, +50, +100 */}
            <div className="flex items-center gap-1 pl-1">
              {[10, 50, 100].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => onUpdate({ quantity: colorItem.quantity + step })}
                  className="px-2 py-1 rounded-md bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-xs font-bold text-slate-700 transition-colors shadow-sm"
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
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl shadow-2xl shadow-slate-900/15 my-8 overflow-hidden text-slate-900 animate-scaleUp ring-1 ring-slate-900/10">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-lg shadow-sm">
              {activeCategoryCfg?.icon || '📦'}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>{initialData ? 'Modifier l’Équipement' : 'Nouveau Matériel Kickboxing'}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  {totalCalculatedQuantity} pcs au total
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Choix des couleurs par liste déroulante et réglage libre des quantités (1, 10, 100 pcs...).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3 font-semibold">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* QUICK PRESETS (8 ARTICLES TYPES) */}
          {!initialData && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/90 via-slate-50 to-indigo-50/90 border border-blue-200/70 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    Modèles suggérés & remplissage rapide (8 articles)
                  </span>
                </div>
                <span className="text-[11px] text-blue-700 font-bold hidden sm:inline">
                  Cliquez pour pré-remplir la fiche
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {EQUIPMENT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="p-2.5 rounded-xl bg-white hover:bg-blue-600 text-slate-800 hover:text-white border border-slate-200 hover:border-blue-600 transition-all text-left shadow-xs flex flex-col justify-between group active:scale-95"
                    title={`Pré-remplir avec : ${preset.name}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-black truncate">{preset.name}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-1 text-[10px]">
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-100 group-hover:bg-blue-500 font-bold truncate">
                        {CATEGORY_CONFIG[preset.category]?.badge || preset.category}
                      </span>
                      {preset.brand ? (
                        <span className="text-slate-500 group-hover:text-blue-100 font-semibold truncate">
                          {preset.brand}
                        </span>
                      ) : (
                        <span className="text-slate-400 group-hover:text-blue-200 italic">
                          Sans marque
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1: CATEGORY SELECTION */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              1. Catégorie d’Équipement
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2">
              {EQUIPMENT_TYPES.map((t) => {
                const isSelected = category === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleCategoryChange(t.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-sm ring-2 ring-blue-500/20 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Marque / Fabricant</span>
                <span className="text-[10px] font-normal text-slate-400">(optionnel si sans marque)</span>
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => {
                  setBrand(e.target.value);
                  if (!isNameManuallyEdited) {
                    setName(generateSuggestedName(category, e.target.value, model));
                  }
                }}
                placeholder="ex: Venum, Fairtex, Full Contact (ou laisser vide)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Désignation Commerciale du Produit *
              </label>
              {!isNameManuallyEdited && (
                <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-extrabold placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          {/* STEP 3: TAILLES ET COULEURS PAR SELECT AVEC QUANTITÉS FLEXIBLES */}
          <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-blue-600" />
                  <span>Gestion des Tailles, Couleurs & Quantités</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sélectionnez les couleurs dans la liste déroulante et ajustez les quantités (1, 10, 100 pcs...).
                </p>
              </div>

              {/* Toggle Has Sizes */}
              <label className="flex items-center gap-2.5 cursor-pointer bg-white border border-slate-200 px-3.5 py-2 rounded-xl hover:border-slate-300 transition-colors shadow-sm">
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
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white"
                />
                <span className="text-xs font-bold text-slate-800">
                  Cet équipement a des tailles (ex: 12oz, M, L)
                </span>
              </label>
            </div>

            {/* Quick Bulk Preset Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-700">
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
                        ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
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
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                      {category === 'gants' ? 'Tailles de Gants disponibles (4 oz à 22 oz) :' : 'Tailles suggérées :'}
                    </span>
                    {category === 'gants' && (
                      <button
                        type="button"
                        onClick={addAllStandardGloveSizes}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 text-xs font-black transition-all shadow-sm cursor-pointer"
                        title="Ajouter automatiquement toutes les tailles standard de 4 oz à 22 oz"
                      >
                        ⚡ Tout ajouter (4 à 22 oz)
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {activeCategoryCfg && activeCategoryCfg.defaultSizes.map((szPreset) => {
                      const isAlreadyAdded = sizesState.some(
                        (s) => s.size.trim().toLowerCase() === szPreset.toLowerCase()
                      );
                      return (
                        <button
                          key={szPreset}
                          type="button"
                          onClick={() => addSize(szPreset)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all shadow-sm cursor-pointer border ${
                            isAlreadyAdded
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {isAlreadyAdded ? `✓ ${szPreset}` : `+ ${szPreset}`}
                        </button>
                      );
                    })}

                    {category === 'gants' && (
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            addSize(e.target.value);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-white text-xs font-bold text-slate-700 border border-slate-300 focus:outline-none focus:border-blue-600 shadow-sm cursor-pointer"
                      >
                        <option value="">+ Autre taille (4 à 22 oz)...</option>
                        {ALL_GLOVE_SIZES_RANGE.map((sz) => (
                          <option key={sz} value={sz}>
                            + {sz}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* List of sizes */}
                <div className="space-y-3">
                  {sizesState.map((sizeEntry) => (
                    <div
                      key={sizeEntry.id}
                      className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5"
                    >
                      {/* Size row */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 max-w-md">
                          <span className="text-xs font-extrabold text-blue-600 shrink-0">Taille :</span>
                          {category === 'gants' && (
                            <select
                              value={ALL_GLOVE_SIZES_RANGE.includes(sizeEntry.size) ? sizeEntry.size : '__custom__'}
                              onChange={(e) => {
                                if (e.target.value !== '__custom__') {
                                  updateSizeName(sizeEntry.id, e.target.value);
                                }
                              }}
                              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-black text-blue-900 focus:outline-none focus:border-blue-600 shadow-sm cursor-pointer"
                            >
                              <option value="__custom__">Choisir (4 - 22 oz)...</option>
                              <optgroup label="Tailles Paires (Standards)">
                                {GLOVE_STANDARD_SIZES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="Toutes les Tailles (4 à 22 oz)">
                                {ALL_GLOVE_SIZES_RANGE.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                          )}
                          <input
                            type="text"
                            required
                            list="all-glove-sizes-datalist"
                            value={sizeEntry.size}
                            onChange={(e) => updateSizeName(sizeEntry.id, e.target.value)}
                            placeholder={category === 'gants' ? 'ex: 12 oz' : 'ex: 12 oz, S, M, 4,5m'}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-extrabold focus:outline-none focus:border-blue-600 flex-1 min-w-[70px]"
                          />
                        </div>

                        {/* Quick bulk apply to this size */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
                            Remplir tout à :
                          </span>
                          <div className="flex items-center gap-1">
                            {[10, 50, 100].map((qty) => (
                              <button
                                key={qty}
                                type="button"
                                onClick={() => applyBulkQuantityToSize(sizeEntry.id, qty)}
                                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 border border-slate-200"
                                title={`Définir ${qty} pcs pour toutes les couleurs de ${sizeEntry.size}`}
                              >
                                {qty}
                              </button>
                            ))}
                          </div>

                          <span className="text-xs text-slate-600 font-bold pl-2 border-l border-slate-200">
                            Total :{' '}
                            <strong className="text-blue-700 font-black">
                              {sizeEntry.colors.reduce((s, c) => s + (Number(c.quantity) || 0), 0)} pcs
                            </strong>
                          </span>

                          <button
                            type="button"
                            onClick={() => removeSize(sizeEntry.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
                            title="Supprimer cette taille"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Colors of this size */}
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <span className="text-xs font-bold text-slate-700 block">
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
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 text-blue-600" />
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
                  className="w-full py-3 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/50 text-slate-700 hover:text-blue-600 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>Ajouter une autre taille</span>
                </button>
              </div>
            ) : (
              /* CASE B: WITHOUT SIZES (COULEURS SEULEMENT) */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 block">
                    Couleurs disponibles :
                  </span>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>Remplir tout à :</span>
                    {[10, 50, 100].map((qty) => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => applyBulkQuantityToDirect(qty)}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 border border-slate-200"
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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>Ajouter une couleur ({newColorDefaultQty} pcs)</span>
                </button>
              </div>
            )}

            {/* Total Stock Summary Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-xs font-bold text-blue-900">
                Stock total calculé (somme de toutes les couleurs) :
              </span>
              <span className="text-base font-black text-blue-700">
                {totalCalculatedQuantity} pièces
              </span>
            </div>
          </div>

          {/* STEP 4: ALERT LIMIT & PRICING */}
          <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5 space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
              Tarification & Alertes
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-emerald-700 mb-1.5">
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
                  className="w-full bg-white border-2 border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-emerald-800 font-black focus:outline-none focus:border-emerald-600 shadow-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1">Montant payé par l'élève</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Prix d’Achat Fournisseur ({currSymbol})
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                  placeholder="Ce que vous avez payé"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-600 shadow-sm"
                />
                <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>Gain net :</span>
                  <span
                    className={`font-black ${
                      profitMargin >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {profitMargin >= 0 ? `+${profitMargin.toFixed(1)}` : profitMargin.toFixed(1)}{' '}
                    {currSymbol}
                    {costPrice > 0 && ` (${marginPercent}%)`}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Alerter quand le stock descend à :
                </label>
                <input
                  type="number"
                  min="0"
                  value={minStockAlert}
                  onChange={(e) => setMinStockAlert(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-600 shadow-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1">Devient jaune quand il reste ce nombre</p>
              </div>
            </div>
          </div>

          {/* STEP 5: OPTIONAL DETAILS (BARCODE & DESCRIPTION) */}
          <details className="rounded-2xl bg-slate-50 border border-slate-200 p-4 group">
            <summary className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer flex items-center justify-between list-none">
              <span>➕ Détails avancés (Code-barres, notes...) · Facultatif</span>
              <span className="text-xs text-slate-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Code-Barres ou Référence interne
                </label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="ex: GNT-VNM-001 (laisser vide si pas besoin)"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Remarques
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ex: Matière cuir synthétique..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
                />
              </div>
            </div>
          </details>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Enregistrement...' : 'Enregistrer le Matériel'}</span>
            </button>
          </div>

          {/* Datalist for all glove sizes (4 oz to 22 oz) */}
          <datalist id="all-glove-sizes-datalist">
            {ALL_GLOVE_SIZES_RANGE.map((sz) => (
              <option key={sz} value={sz} />
            ))}
          </datalist>
        </form>
      </div>
    </div>
  );
}
