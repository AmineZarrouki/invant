import { EquipmentCategory } from '@/types/inventory';

/** Professional, restrained category metadata */
export const CATEGORY_CONFIG: Record<EquipmentCategory, {
  label: string;
  badge: string;
}> = {
  gants: {
    label: 'Gants de Boxe',
    badge: 'Gants',
  },
  protege_tibias: {
    label: 'Protège-Tibias',
    badge: 'Tibias',
  },
  bandes: {
    label: 'Bandes de Boxe',
    badge: 'Bandes',
  },
  protege_dents: {
    label: 'Protège-Dents',
    badge: 'Dents',
  },
  coquilles: {
    label: 'Coquilles de Protection',
    badge: 'Coquilles',
  },
  autres: {
    label: 'Autres Accessoires',
    badge: 'Accessoires',
  },
};

/** Professional stock status tokens */
export function getStockStatus(stock: number, minAlert: number) {
  if (stock === 0) {
    return {
      label: 'Rupture',
      badgeClass: 'bg-red-500/10 text-red-400 border-red-500/30',
      textClass: 'text-red-400',
      isOut: true,
      isLow: false,
    };
  }
  if (stock <= minAlert) {
    return {
      label: 'Stock Faible',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      textClass: 'text-amber-400',
      isOut: false,
      isLow: true,
    };
  }
  return {
    label: 'En Stock',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    textClass: 'text-emerald-400',
    isOut: false,
    isLow: false,
  };
}
