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
  Shield,
  Layers,
  ChevronDown,
  Info,
} from 'lucide-react';
import { Equipment, EquipmentCategory } from '@/types/inventory';
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
  defaultSize: string;
  defaultColor: string;
  description: string;
}> = [
  {
    id: 'gants',
    name: 'Gants de Boxe',
    icon: '🥊',
    defaultBrand: 'Venum',
    defaultSize: '12 oz',
    defaultColor: 'Noir',
    description: 'Tailles en Oz (10oz, 12oz, 14oz...), modèles compétition et entraînement.',
  },
  {
    id: 'bandes',
    name: 'Bandes de Boxe',
    icon: '🎗️',
    defaultBrand: 'Standard Pro',
    defaultSize: '4,5m',
    defaultColor: 'Noir',
    description: 'Longueurs en mètres (3,5m, 4,5m, 5,5m), matière coton / semi-élastique.',
  },
  {
    id: 'protege_tibias',
    name: 'Protège-Tibias',
    icon: '🦵',
    defaultBrand: 'Pakka',
    defaultSize: 'M',
    defaultColor: 'Noir',
    description: 'Formats rigides à attaches ou chaussettes élastiques ("T9chira").',
  },
  {
    id: 'protege_dents',
    name: 'Protège-Dents',
    icon: '🦷',
    defaultBrand: 'Baklee',
    defaultSize: 'Adulte (Senior)',
    defaultColor: 'Noir',
    description: 'Simple, thermo-moulable ou boîte incluse, taille Adulte / Enfant.',
  },
  {
    id: 'coquilles',
    name: 'Coquilles de Protection',
    icon: '🛡️',
    defaultBrand: 'Standard Club',
    defaultSize: 'M',
    defaultColor: 'Noir',
    description: 'Slip avec poche ou cup anatomique rigide, tailles S, M, L, XL.',
  },
  {
    id: 'autres',
    name: 'Autres Accessoires',
    icon: '⚡',
    defaultBrand: 'Dojo Pro',
    defaultSize: 'Unique',
    defaultColor: 'Noir',
    description: 'Casques, paos, pattes d’ours, cordes à sauter, chevillères.',
  },
];

// Presets by category
const PRESETS = {
  gants: {
    sizes: ['4 oz', '6 oz', '8 oz', '10 oz', '12 oz', '14 oz', '16 oz'],
    brands: ['Venum', 'Pakka', 'Baklee', 'Fairtex', 'Twins Special', 'Booster'],
    models: ['Challenger', 'Elite', 'BX1010 (Excellente qualité)', 'FC 1041', 'FC 1051', 'BXF A44', 'Pro Training'],
    closures: ['Velcro (Scratch large)', 'Lacets traditionnels', 'Élastique'],
    materials: ['Cuir synthétique PU haute densité', 'Cuir véritable', 'Semi-cuir premium'],
    colors: ['Noir', 'Blanc / Noir', 'Rouge / Noir', 'Or / Noir', 'Vert', 'Blanc', 'Bleu', 'Rose'],
  },
  bandes: {
    sizes: ['2,5m', '3,5m', '4,5m', '5,5m'],
    brands: ['Standard Pro', 'Venum', 'Fairtex', 'Pakka', 'Twins'],
    types: ['Semi-élastique (Coton/Élasthanne)', '100% Coton rigide', 'Tissage Mexicain'],
    colors: ['Noir', 'Rouge', 'Bleu', 'Blanc', 'Jaune', 'Rose', 'Gris'],
  },
  protege_tibias: {
    types: ['Modèle rigide / Coque semi-cuir (sangles)', 'Chaussette élastique tubulaire ("T9chira")'],
    sizes: ['S', 'M', 'L', 'XL'],
    brands: ['Pakka', 'BS 2026', 'T9chira Club', 'Fairtex', 'Venum'],
    models: ['SHPA20', 'BS 1009', 'FC BS 2026', 'T9chira Club Elastic'],
    colors: ['Noir', 'Rouge', 'Bleu', 'Gris', 'Noir / Or', 'Mixte'],
  },
  protege_dents: {
    molds: ['Simple (Arcade supérieure)', 'Double (Arcade sup. & inf.)', 'Thermoformable (Boil & Bite)'],
    sizes: ['Adulte (Senior)', 'Enfant (Junior)'],
    brands: ['Baklee', 'Venum', 'Standard Club', 'Shock Doctor'],
    models: ['BK 035', 'Challenger', 'Predator', 'Standard'],
    colors: ['Noir', 'Rouge', 'Bleu', 'Orange', 'Transparent', 'Blanc', 'Bicolore'],
  },
  coquilles: {
    types: ['Slip avec poche amovible', 'Coquille anatomique rigide', 'Muay Thai acier (lacets)'],
    sizes: ['S', 'M', 'L', 'XL'],
    brands: ['Standard Club', 'Venum', 'Shock Doctor', 'Fairtex'],
    colors: ['Noir', 'Blanc', 'Gris'],
  },
  autres: {
    types: ['Casque de protection', 'Pattes d’ours (Pao court)', 'Pao Muay Thai', 'Corde à sauter', 'Chevillères élastiques', 'Sac de frappe'],
    sizes: ['Unique', 'S', 'M', 'L', 'XL'],
    brands: ['Dojo Pro', 'Venum', 'Fairtex', 'Twins'],
    colors: ['Noir', 'Rouge', 'Bleu', 'Blanc'],
  },
};

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
  const [size, setSize] = useState('12 oz');
  const [color, setColor] = useState('Noir');
  const [stock, setStock] = useState(5);
  const [minStockAlert, setMinStockAlert] = useState(3);
  const [costPrice, setCostPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [barcode, setBarcode] = useState('');
  const [description, setDescription] = useState('');

  // Equipment specific parameters
  const [subType, setSubType] = useState('');
  const [material, setMaterial] = useState('');
  const [hasStorageBox, setHasStorageBox] = useState(true);

  // Manual name edit tracking
  const [isNameManuallyEdited, setIsNameManuallyEdited] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to construct automatic title from parameters
  const generateSuggestedName = (
    cat: EquipmentCategory,
    br: string,
    mod: string,
    sz: string,
    col: string,
    st: string
  ) => {
    const brandStr = br ? br.trim() : '';
    const sizeStr = sz ? sz.trim() : '';
    const colorStr = col ? col.trim() : '';
    const modelStr = mod ? mod.trim() : '';

    if (cat === 'gants') {
      return `Gants ${brandStr} ${modelStr ? `${modelStr} ` : ''}${sizeStr} ${colorStr}`.replace(/\s+/g, ' ').trim();
    }
    if (cat === 'bandes') {
      return `Bandes de Boxe ${brandStr} ${sizeStr} ${colorStr}`.replace(/\s+/g, ' ').trim();
    }
    if (cat === 'protege_tibias') {
      const typePrefix = st.includes('T9chira') ? 'Protège-Tibias (T9chira)' : 'Protège-Tibias';
      return `${typePrefix} ${brandStr} ${modelStr ? `${modelStr} ` : ''}${sizeStr} ${colorStr}`.replace(/\s+/g, ' ').trim();
    }
    if (cat === 'protege_dents') {
      return `Protège-Dents ${brandStr} ${modelStr ? `${modelStr} ` : ''}${colorStr}`.replace(/\s+/g, ' ').trim();
    }
    if (cat === 'coquilles') {
      return `Coquille ${brandStr} ${sizeStr} ${colorStr}`.replace(/\s+/g, ' ').trim();
    }
    return `${st || 'Matériel'} ${brandStr} ${sizeStr} ${colorStr}`.replace(/\s+/g, ' ').trim();
  };

  // Initialize form on open
  useEffect(() => {
    if (initialData) {
      setCategory(initialData.category);
      setName(initialData.name);
      setBrand(initialData.brand || '');
      setModel(initialData.model || '');
      setSize(initialData.size || 'Unique');
      setColor(initialData.color || 'Noir');
      setStock(initialData.stock || 0);
      setMinStockAlert(initialData.minStockAlert || 3);
      setCostPrice(initialData.costPrice || 0);
      setSellingPrice(initialData.sellingPrice || 0);
      setBarcode(initialData.barcode || '');
      setDescription(initialData.description || '');
      setIsNameManuallyEdited(true);
    } else {
      // Default to Gloves
      const def = EQUIPMENT_TYPES[0];
      setCategory(def.id);
      setBrand(def.defaultBrand);
      setSize(def.defaultSize);
      setColor(def.defaultColor);
      setModel('');
      setStock(5);
      setMinStockAlert(3);
      setCostPrice(0);
      setSellingPrice(0);
      setBarcode('');
      setDescription('');
      setSubType('');
      setMaterial('');
      setHasStorageBox(true);
      setIsNameManuallyEdited(false);
      setName(generateSuggestedName(def.id, def.defaultBrand, '', def.defaultSize, def.defaultColor, ''));
    }
    setError(null);
  }, [initialData, isOpen]);

  // When category changes, update defaults
  const handleCategoryChange = (newCat: EquipmentCategory) => {
    setCategory(newCat);
    const catCfg = EQUIPMENT_TYPES.find((t) => t.id === newCat);
    if (!catCfg) return;

    let newBrand = catCfg.defaultBrand;
    let newSize = catCfg.defaultSize;
    let newColor = catCfg.defaultColor;
    let newModel = '';
    let newSubType = '';

    if (newCat === 'gants') {
      newBrand = 'Venum';
      newSize = '12 oz';
      newColor = 'Noir';
      newModel = 'Challenger';
    } else if (newCat === 'bandes') {
      newBrand = 'Standard Pro';
      newSize = '4,5m';
      newColor = 'Noir';
    } else if (newCat === 'protege_tibias') {
      newBrand = 'Pakka';
      newSize = 'M';
      newColor = 'Noir';
      newSubType = PRESETS.protege_tibias.types[0];
    } else if (newCat === 'protege_dents') {
      newBrand = 'Baklee';
      newModel = 'BK 035';
      newSize = 'Adulte (Senior)';
      newColor = 'Noir';
    } else if (newCat === 'coquilles') {
      newBrand = 'Standard Club';
      newSize = 'M';
      newColor = 'Noir';
    } else {
      newBrand = 'Dojo Pro';
      newSize = 'Unique';
      newColor = 'Noir';
      newSubType = 'Casque de protection';
    }

    setBrand(newBrand);
    setSize(newSize);
    setColor(newColor);
    setModel(newModel);
    setSubType(newSubType);

    if (!isNameManuallyEdited) {
      setName(generateSuggestedName(newCat, newBrand, newModel, newSize, newColor, newSubType));
    }
  };

  // Auto-update suggested name when parameters change (unless user manually typed their own custom name)
  const updateSuggestedName = (
    c: EquipmentCategory,
    b: string,
    m: string,
    s: string,
    col: string,
    st: string
  ) => {
    if (!isNameManuallyEdited) {
      setName(generateSuggestedName(c, b, m, s, col, st));
    }
  };

  const currSymbol = CURRENCY_CONFIG[currency]?.symbol || 'DH';
  const profitMargin = sellingPrice - costPrice;
  const marginPercent = costPrice > 0 ? Math.round((profitMargin / costPrice) * 100) : 0;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Veuillez spécifier le nom du matériel');
      return;
    }
    setLoading(true);
    setError(null);

    // Build rich description if specific parameters were picked
    let fullDescription = description;
    const extraDetails: string[] = [];
    if (subType) extraDetails.push(`Type: ${subType}`);
    if (material) extraDetails.push(`Matière: ${material}`);
    if (category === 'protege_dents' && hasStorageBox) extraDetails.push('Boîte de rangement incluse');

    if (extraDetails.length > 0) {
      fullDescription = fullDescription
        ? `${fullDescription} | ${extraDetails.join(' • ')}`
        : extraDetails.join(' • ');
    }

    try {
      await onSave({
        name: name.trim(),
        category,
        brand: brand.trim() || 'Générique',
        model: model.trim() || undefined,
        size: size.trim() || 'Unique',
        color: color.trim() || 'Standard',
        stock: Number(stock) || 0,
        minStockAlert: Number(minStockAlert) || 3,
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        barcode: barcode.trim() || undefined,
        description: fullDescription.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/30 text-red-500 flex items-center justify-center font-bold">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>{initialData ? 'Modifier l’équipement' : 'Nouveau Matériel'}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  PARAMÈTRES DYNAMIQUES
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Sélectionnez le type pour afficher ses paramètres sur-mesure (oz, mètres, tailles, modèles).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs sm:text-sm">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: SELECT EQUIPMENT TYPE (CRITICAL REQUIREMENT) */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
              1. Type d’Équipement Sportif *
            </label>

            {/* Visual Type Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EQUIPMENT_TYPES.map((t) => {
                const isSelected = category === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleCategoryChange(t.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-red-950/40 border-red-500 text-white shadow-sm ring-1 ring-red-500/50'
                        : 'bg-zinc-950/70 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{t.icon}</span>
                      <span className="font-bold text-xs sm:text-sm truncate">{t.name}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 line-clamp-1">{t.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: DYNAMIC PARAMETERS ACCORDING TO EQUIPMENT TYPE */}
          <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
                <Sparkles className="w-4 h-4" />
                <span>2. Paramètres Spécifiques : {EQUIPMENT_TYPES.find((t) => t.id === category)?.name}</span>
              </div>
              <span className="text-[11px] text-zinc-500">Formulaire dynamique</span>
            </div>

            {/* DYNAMIC CASE: GANTS DE BOXE */}
            {category === 'gants' && (
              <div className="space-y-4">
                {/* Weight in Oz */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Poids / Taille en Oz (Ounces) *
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {PRESETS.gants.sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setSize(s);
                          updateSuggestedName(category, brand, model, s, color, subType);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          size === s
                            ? 'bg-red-600 text-white'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={size}
                    onChange={(e) => {
                      setSize(e.target.value);
                      updateSuggestedName(category, brand, model, e.target.value, color, subType);
                    }}
                    placeholder="Ou saisie libre (ex: 12 oz)"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Brand & Model */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Marque de Gants *
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {PRESETS.gants.brands.map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => {
                            setBrand(b);
                            updateSuggestedName(category, b, model, size, color, subType);
                          }}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            brand === b
                              ? 'bg-zinc-700 text-white font-bold'
                              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => {
                        setBrand(e.target.value);
                        updateSuggestedName(category, e.target.value, model, size, color, subType);
                      }}
                      placeholder="ex: Venum, Pakka, Fairtex..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Modèle / Série de Gants
                    </label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => {
                        setModel(e.target.value);
                        updateSuggestedName(category, brand, e.target.value, size, color, subType);
                      }}
                      placeholder="ex: BX1010, FC 1041, BXF A44, Challenger"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['BX1010', 'FC 1041', 'FC 1051', 'BXF A44', 'Elite'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setModel(m);
                            updateSuggestedName(category, brand, m, size, color, subType);
                          }}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800"
                        >
                          +{m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DYNAMIC CASE: BANDES DE BOXE */}
            {category === 'bandes' && (
              <div className="space-y-4">
                {/* Length in Meters */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Longueur de la Bande *
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {PRESETS.bandes.sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setSize(s);
                          updateSuggestedName(category, brand, model, s, color, subType);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                          size === s
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={size}
                    onChange={(e) => {
                      setSize(e.target.value);
                      updateSuggestedName(category, brand, model, e.target.value, color, subType);
                    }}
                    placeholder="ex: 4,5m ou 3,5m"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Marque / Fabricant
                    </label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => {
                        setBrand(e.target.value);
                        updateSuggestedName(category, e.target.value, model, size, color, subType);
                      }}
                      placeholder="ex: Standard Pro, Venum, Fairtex"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Type de Tissage & Élasticité
                    </label>
                    <select
                      value={subType}
                      onChange={(e) => setSubType(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
                    >
                      <option value="">Sélectionner le tissage...</option>
                      {PRESETS.bandes.types.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* DYNAMIC CASE: PROTÈGE-TIBIAS */}
            {category === 'protege_tibias' && (
              <div className="space-y-4">
                {/* Format selection: Rigide vs T9chira */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Format de Protection *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PRESETS.protege_tibias.types.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setSubType(t);
                          updateSuggestedName(category, brand, model, size, color, t);
                        }}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-colors ${
                          subType === t
                            ? 'bg-zinc-800 border-red-500 text-white'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size S, M, L, XL */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Taille du Protège-Tibia *
                  </label>
                  <div className="flex gap-2 mb-2">
                    {PRESETS.protege_tibias.sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setSize(s);
                          updateSuggestedName(category, brand, model, s, color, subType);
                        }}
                        className={`w-12 py-2 rounded-xl text-xs font-black transition-all ${
                          size === s
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Marque / Gamme
                    </label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => {
                        setBrand(e.target.value);
                        updateSuggestedName(category, e.target.value, model, size, color, subType);
                      }}
                      placeholder="ex: Pakka, BS, T9chira Club"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Modèle / Référence Usine
                    </label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => {
                        setModel(e.target.value);
                        updateSuggestedName(category, brand, e.target.value, size, color, subType);
                      }}
                      placeholder="ex: SHPA20, BS1009, FC BS 2026"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* DYNAMIC CASE: PROTÈGE-DENTS */}
            {category === 'protege_dents' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Taille / Public Cible *
                    </label>
                    <div className="flex gap-2">
                      {PRESETS.protege_dents.sizes.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setSize(s);
                            updateSuggestedName(category, brand, model, s, color, subType);
                          }}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                            size === s
                              ? 'bg-red-600 text-white'
                              : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Type de Moulage
                    </label>
                    <select
                      value={subType}
                      onChange={(e) => setSubType(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
                    >
                      {PRESETS.protege_dents.molds.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Marque
                    </label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => {
                        setBrand(e.target.value);
                        updateSuggestedName(category, e.target.value, model, size, color, subType);
                      }}
                      placeholder="ex: Baklee, Venum, Standard"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Modèle / Réf
                    </label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => {
                        setModel(e.target.value);
                        updateSuggestedName(category, brand, e.target.value, size, color, subType);
                      }}
                      placeholder="ex: BK 035, Challenger"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={hasStorageBox}
                    onChange={(e) => setHasStorageBox(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 text-red-600 focus:ring-0 bg-zinc-900"
                  />
                  <span>Boîte de protection et de transport incluse</span>
                </label>
              </div>
            )}

            {/* DYNAMIC CASE: COQUILLES */}
            {category === 'coquilles' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Taille de la Coquille *
                  </label>
                  <div className="flex gap-2">
                    {PRESETS.coquilles.sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setSize(s);
                          updateSuggestedName(category, brand, model, s, color, subType);
                        }}
                        className={`w-12 py-2 rounded-xl text-xs font-black transition-all ${
                          size === s
                            ? 'bg-red-600 text-white'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Marque
                    </label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => {
                        setBrand(e.target.value);
                        updateSuggestedName(category, e.target.value, model, size, color, subType);
                      }}
                      placeholder="ex: Standard Club, Venum"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Type de Fixation
                    </label>
                    <select
                      value={subType}
                      onChange={(e) => setSubType(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
                    >
                      {PRESETS.coquilles.types.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* DYNAMIC CASE: AUTRES */}
            {category === 'autres' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Type de Matériel *
                    </label>
                    <select
                      value={subType}
                      onChange={(e) => {
                        setSubType(e.target.value);
                        updateSuggestedName(category, brand, model, size, color, e.target.value);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
                    >
                      {PRESETS.autres.types.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Taille / Dimension
                    </label>
                    <input
                      type="text"
                      value={size}
                      onChange={(e) => {
                        setSize(e.target.value);
                        updateSuggestedName(category, brand, model, e.target.value, color, subType);
                      }}
                      placeholder="Unique, S, M, L..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* COLOR PALETTE (COMMON DYNAMIC SELECTOR) */}
            <div className="pt-2 border-t border-zinc-900">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Couleur de l’équipement *
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  'Noir',
                  'Rouge',
                  'Bleu',
                  'Blanc',
                  'Or / Noir',
                  'Blanc / Noir',
                  'Rouge / Noir',
                  'Vert',
                  'Gris',
                  'Orange',
                ].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setColor(c);
                      updateSuggestedName(category, brand, model, size, c, subType);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      color === c
                        ? 'bg-zinc-700 text-white font-bold border border-zinc-500'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={color}
                onChange={(e) => {
                  setColor(e.target.value);
                  updateSuggestedName(category, brand, model, size, e.target.value, subType);
                }}
                placeholder="Ou préciser la couleur (ex: Rouge / Noir mat)"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* STEP 3: FINAL PRODUCT NAME (AUTO-SUGGESTED + EDITABLE) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                3. Désignation Commerciale Finale *
              </label>
              {!isNameManuallyEdited && (
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Auto-généré selon paramètres
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
              placeholder="ex: Gants Venum 12oz Noir"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold placeholder-zinc-500 focus:outline-none focus:border-red-500"
            />
            {isNameManuallyEdited && (
              <button
                type="button"
                onClick={() => {
                  setIsNameManuallyEdited(false);
                  setName(generateSuggestedName(category, brand, model, size, color, subType));
                }}
                className="text-[11px] text-zinc-400 hover:text-red-400 transition-colors"
              >
                ↺ Réinitialiser au nom auto-généré
              </button>
            )}
          </div>

          {/* STEP 4: STOCK & ALERT LIMITS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Quantité Initiale en Stock (Pièces) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white font-bold focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Seuil d’Alerte Stock Faible
              </label>
              <input
                type="number"
                min="0"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(parseInt(e.target.value) || 0)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* STEP 5: PRICING & MARGIN CALCULATION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Prix d’Achat Fournisseur ({currSymbol})
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white font-semibold focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1.5">
                Prix de Vente Client ({currSymbol}) *
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
              />

              <div className="text-[11px] text-zinc-400 mt-1.5 flex items-center justify-between">
                <span>Marge estimée :</span>
                <span className={`font-bold ${profitMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {profitMargin >= 0 ? `+${profitMargin.toFixed(1)}` : profitMargin.toFixed(1)} {currSymbol}
                  {costPrice > 0 && ` (${marginPercent}%)`}
                </span>
              </div>
            </div>
          </div>

          {/* STEP 6: BARCODE & OPTIONAL NOTES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Code-Barres / SKU
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="ex: GNT-VNM-12-BLK"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Notes & Remarques
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ex: Cuir premium, double surpiqûre..."
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
