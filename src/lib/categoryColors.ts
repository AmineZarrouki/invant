import { EquipmentCategory } from '@/types/inventory';

/** Professional, high-visibility category configuration */
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
    badgeBg: 'bg-red-500/15',
    badgeText: 'text-red-300',
    badgeBorder: 'border-red-500/40',
  },
  protege_tibias: {
    label: 'Protège-Tibias',
    badge: 'Tibias',
    icon: '🦵',
    badgeBg: 'bg-sky-500/15',
    badgeText: 'text-sky-300',
    badgeBorder: 'border-sky-500/40',
  },
  bandes: {
    label: 'Bandes de Boxe',
    badge: 'Bandes',
    icon: '🎗️',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-500/40',
  },
  protege_dents: {
    label: 'Protège-Dents',
    badge: 'Dents',
    icon: '🦷',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/40',
  },
  coquilles: {
    label: 'Coquilles de Protection',
    badge: 'Coquilles',
    icon: '🛡️',
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-500/40',
  },
  autres: {
    label: 'Autres Accessoires',
    badge: 'Accessoires',
    icon: '⚡',
    badgeBg: 'bg-slate-500/15',
    badgeText: 'text-slate-300',
    badgeBorder: 'border-slate-500/40',
  },
};

/** High-contrast stock status tokens */
export function getStockStatus(stock: number, minAlert: number) {
  if (stock === 0) {
    return {
      label: 'Rupture',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold',
      textClass: 'text-rose-400 font-extrabold',
      dotColor: '#f43f5e',
      isOut: true,
      isLow: false,
    };
  }
  if (stock <= minAlert) {
    return {
      label: 'Stock Faible',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold',
      textClass: 'text-amber-300 font-extrabold',
      dotColor: '#f59e0b',
      isOut: false,
      isLow: true,
    };
  }
  return {
    label: 'En Stock',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold',
    textClass: 'text-emerald-400 font-extrabold',
    dotColor: '#10b981',
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
  { value: 'Bleu', label: 'Bleu Royal (Blue)', swatch: '#3b82f6', group: 'Classique' },
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
    swatch: 'linear-gradient(135deg, #3b82f6 50%, #f8fafc 50%)',
    group: 'Combinaisons Bicolores',
  },
  {
    value: 'Noir / Assorti',
    label: 'Noir / Assorti (Mixte)',
    swatch: 'linear-gradient(135deg, #0f172a 33%, #ef4444 33%, #ef4444 66%, #3b82f6 66%)',
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
  if (lower.includes('bleu') || lower.includes('blue')) return '#3b82f6';
  if (lower.includes('blanc') || lower.includes('white')) return '#f8fafc';
  if (lower.includes('noir') || lower.includes('black')) return '#0f172a';
  if (lower.includes('vert') || lower.includes('green')) return '#22c55e';
  if (lower.includes('gris') || lower.includes('grey')) return '#64748b';
  if (lower.includes('rose') || lower.includes('pink')) return '#ec4899';
  if (lower.includes('orange')) return '#f97316';
  if (lower.includes('jaune') || lower.includes('yellow')) return '#eab308';
  return '#64748b';
}
