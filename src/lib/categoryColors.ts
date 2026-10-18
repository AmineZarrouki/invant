import { EquipmentCategory } from '@/types/inventory';

/** Professional, high-visibility category configuration for crisp White & Blue UI */
export const CATEGORY_CONFIG: Record<
  EquipmentCategory,
  {
    label: string;
    badge: string;
    icon: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
  }
> = {
  gants: {
    label: 'Gants de Boxe',
    badge: 'Gants',
    icon: '🥊',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
  },
  protege_tibias: {
    label: 'Protège-Tibias',
    badge: 'Tibias',
    icon: '🦵',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    badgeBorder: 'border-sky-200',
  },
  bandes: {
    label: 'Bandes de Boxe',
    badge: 'Bandes',
    icon: '🎗️',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
  },
  protege_dents: {
    label: 'Protège-Dents',
    badge: 'Dents',
    icon: '🦷',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
  },
  coquilles: {
    label: 'Coquilles de Protection',
    badge: 'Coquilles',
    icon: '🛡️',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
  },
  protections: {
    label: 'Protections',
    badge: 'Protections',
    icon: '🛡️',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700',
    badgeBorder: 'border-teal-200',
  },
  textile: {
    label: 'Textile',
    badge: 'Textile',
    icon: '👕',
    badgeBg: 'bg-violet-50',
    badgeText: 'text-violet-700',
    badgeBorder: 'border-violet-200',
  },
  tenue_competition: {
    label: 'Tenue de compétition',
    badge: 'Tenue Compétition',
    icon: '🥋',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
  },
  pantalon_combat: {
    label: 'Pantalon de combat',
    badge: 'Pantalon Combat',
    icon: '👖',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
  },
  textile_competition: {
    label: 'Textile de compétition',
    badge: 'Textile Compétition',
    icon: '🎽',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
  },
  short_combat: {
    label: 'Short de combat',
    badge: 'Short Combat',
    icon: '🩳',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-700',
    badgeBorder: 'border-cyan-200',
  },
  tenue_entrainement: {
    label: 'Tenue d’entraînement',
    badge: 'Tenue Entraînement',
    icon: '🏋️',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-700',
    badgeBorder: 'border-orange-200',
  },
  autres: {
    label: 'Autres Accessoires',
    badge: 'Accessoires',
    icon: '⚡',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
  },
};

// Aliases for French labels and alternative casing
CATEGORY_CONFIG['Protections'] = CATEGORY_CONFIG['protections'];
CATEGORY_CONFIG['Textile'] = CATEGORY_CONFIG['textile'];
CATEGORY_CONFIG['Tenue de compétition'] = CATEGORY_CONFIG['tenue_competition'];
CATEGORY_CONFIG['Pantalon de combat'] = CATEGORY_CONFIG['pantalon_combat'];
CATEGORY_CONFIG['Textile de compétition'] = CATEGORY_CONFIG['textile_competition'];
CATEGORY_CONFIG['Short de combat'] = CATEGORY_CONFIG['short_combat'];
CATEGORY_CONFIG['Tenue d’entraînement'] = CATEGORY_CONFIG['tenue_entrainement'];
CATEGORY_CONFIG["Tenue d'entraînement"] = CATEGORY_CONFIG['tenue_entrainement'];

/** High-contrast stock status tokens for light professional theme */
export function getStockStatus(stock: number, minAlert: number) {
  if (stock === 0) {
    return {
      label: 'Rupture',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
      textClass: 'text-rose-600 font-black',
      dotColor: '#e11d48',
      isOut: true,
      isLow: false,
    };
  }
  if (stock <= minAlert) {
    return {
      label: 'Stock Faible',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 font-bold',
      textClass: 'text-amber-700 font-black',
      dotColor: '#d97706',
      isOut: false,
      isLow: true,
    };
  }
  return {
    label: 'En Stock',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold',
    textClass: 'text-emerald-700 font-black',
    dotColor: '#059669',
    isOut: false,
    isLow: false,
  };
}

/** Standard combat sports / martial arts color choices for selects and swatches */
export interface ColorPreset {
  value: string;
  label: string;
  swatch: string; // CSS color or gradient
  group: 'Classique' | 'Combinaisons Bicolores' | 'Spécial & Fluo';
}

export const STANDARD_COLORS: ColorPreset[] = [
  // Classiques
  { value: 'Noir', label: 'Noir (Black)', swatch: '#0f172a', group: 'Classique' },
  { value: 'Blanc', label: 'Blanc (White)', swatch: '#f8fafc', group: 'Classique' },
  { value: 'Rouge', label: 'Rouge (Red)', swatch: '#ef4444', group: 'Classique' },
  { value: 'Bleu', label: 'Bleu Royal (Blue)', swatch: '#2563eb', group: 'Classique' },
  { value: 'Gris', label: 'Gris Anthracite', swatch: '#64748b', group: 'Classique' },

  // Combinaisons Bicolores
  {
    value: 'Or / Noir',
    label: 'Or & Noir (Gold / Black)',
    swatch: 'linear-gradient(135deg, #eab308 50%, #0f172a 50%)',
    group: 'Combinaisons Bicolores',
  },
  {
    value: 'Noir / Or',
    label: 'Noir & Or (Black / Gold)',
    swatch: 'linear-gradient(135deg, #0f172a 50%, #eab308 50%)',
    group: 'Combinaisons Bicolores',
  },
  {
    value: 'Rouge / Noir',
    label: 'Rouge & Noir',
    swatch: 'linear-gradient(135deg, #ef4444 50%, #0f172a 50%)',
    group: 'Combinaisons Bicolores',
  },
  {
    value: 'Noir / Rouge',
    label: 'Noir & Rouge',
    swatch: 'linear-gradient(135deg, #0f172a 50%, #ef4444 50%)',
    group: 'Combinaisons Bicolores',
  },
  {
    value: 'Blanc / Noir',
    label: 'Blanc & Noir',
    swatch: 'linear-gradient(135deg, #f8fafc 50%, #0f172a 50%)',
    group: 'Combinaisons Bicolores',
  },
  {
    value: 'Bleu / Blanc',
    label: 'Bleu & Blanc',
    swatch: 'linear-gradient(135deg, #2563eb 50%, #f8fafc 50%)',
    group: 'Combinaisons Bicolores',
  },
  {
    value: 'Rouge / Blanc',
    label: 'Rouge & Blanc',
    swatch: 'linear-gradient(135deg, #ef4444 50%, #f8fafc 50%)',
    group: 'Combinaisons Bicolores',
  },
  {
    value: 'Noir / Blanc / Gris',
    label: 'Noir / Blanc / Gris',
    swatch: 'linear-gradient(135deg, #0f172a 33%, #f8fafc 33%, #f8fafc 66%, #64748b 66%)',
    group: 'Combinaisons Bicolores',
  },
  {
    value: 'Noir / Assorti',
    label: 'Noir / Assorti (Mixte)',
    swatch: 'linear-gradient(135deg, #0f172a 33%, #ef4444 33%, #ef4444 66%, #2563eb 66%)',
    group: 'Combinaisons Bicolores',
  },

  // Spécial, Fluo & Accessoires
  { value: 'Vert', label: 'Vert Kaki / Militaire', swatch: '#15803d', group: 'Spécial & Fluo' },
  { value: 'Vert Fluo', label: 'Vert Fluo (Neon Green)', swatch: '#84cc16', group: 'Spécial & Fluo' },
  { value: 'Orange', label: 'Orange Vif', swatch: '#f97316', group: 'Spécial & Fluo' },
  { value: 'Jaune', label: 'Jaune Combat', swatch: '#eab308', group: 'Spécial & Fluo' },
  { value: 'Rose', label: 'Rose / Pink', swatch: '#ec4899', group: 'Spécial & Fluo' },
  { value: 'Violet', label: 'Violet / Purple', swatch: '#a855f7', group: 'Spécial & Fluo' },
  {
    value: 'Argent',
    label: 'Argenté (Silver)',
    swatch: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)',
    group: 'Spécial & Fluo',
  },
  {
    value: 'Transparent',
    label: 'Transparent (Protège-Dents)',
    swatch: 'radial-gradient(circle, #cbd5e1 20%, #475569 100%)',
    group: 'Spécial & Fluo',
  },
];

/** Helper to get CSS swatch for any color name (known preset or fallback) */
export function getColorSwatch(colorName: string): string {
  if (!colorName) return '#94a3b8';
  const found = STANDARD_COLORS.find(
    (c) => c.value.toLowerCase() === colorName.trim().toLowerCase()
  );
  if (found) return found.swatch;

  // Fallback heuristic for custom names
  const lower = colorName.toLowerCase();
  if (lower.includes('gold') || lower.includes('or')) return '#eab308';
  if (lower.includes('rouge') || lower.includes('red')) return '#ef4444';
  if (lower.includes('bleu') || lower.includes('blue')) return '#2563eb';
  if (lower.includes('blanc') || lower.includes('white')) return '#f8fafc';
  if (lower.includes('noir') || lower.includes('black')) return '#0f172a';
  if (lower.includes('vert') || lower.includes('green')) return '#16a34a';
  if (lower.includes('gris') || lower.includes('grey')) return '#64748b';
  if (lower.includes('rose') || lower.includes('pink')) return '#ec4899';
  if (lower.includes('orange')) return '#f97316';
  if (lower.includes('jaune') || lower.includes('yellow')) return '#eab308';
  return '#64748b';
}
