export type EquipmentCategory =
  | 'gants'
  | 'bandes'
  | 'protege_tibias'
  | 'protege_dents'
  | 'coquilles'
  | 'protections'
  | 'textile'
  | 'tenue_competition'
  | 'pantalon_combat'
  | 'textile_competition'
  | 'short_combat'
  | 'tenue_entrainement'
  | 'autres'
  | (string & {});


export interface ColorStock {
  color: string;
  quantity: number;
}

export interface SizeVariant {
  size?: string; // Taille (e.g. "12 oz", "3,5m", "M", "L", etc. - Optional if no size)
  colors: ColorStock[]; // Quantities for each color of this size
}

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  brand: string;
  model?: string;
  sizes: SizeVariant[]; // For each taille (if there is one), quantity for each color
  stock?: number; // Dynamically computed total units in stock (for UI/display, NOT saved in JSON)
  minStockAlert: number;
  costPrice: number; // Prix d'achat
  sellingPrice: number; // Prix de vente
  barcode?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  equipmentId: string;
  equipmentName: string;
  category: EquipmentCategory;
  brand: string;
  size?: string;
  color?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  costPrice: number;
  profit: number;
  buyerName?: string;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'autre';
  date: string; // ISO string
  notes?: string;
}

export interface DeletionLog {
  id: string;
  equipmentId: string;
  equipmentName: string;
  category: EquipmentCategory;
  brand: string;
  model?: string;
  sizes: SizeVariant[];
  stockAtDeletion: number;
  costPrice: number;
  sellingPrice: number;
  barcode?: string;
  description?: string;
  deletedAt: string; // ISO string
  deletedReason?: string;
}

/** Helper function to calculate total stock from sizes */
export function getEquipmentTotalStock(equipment: Equipment): number {
  if (!equipment.sizes || !Array.isArray(equipment.sizes)) {
    return (equipment as any).stock || 0;
  }
  return equipment.sizes.reduce((total, sz) => {
    if (!sz.colors || !Array.isArray(sz.colors)) return total;
    return total + sz.colors.reduce((cTotal, c) => cTotal + (Number(c.quantity) || 0), 0);
  }, 0);
}

export interface InventoryStats {
  totalItemsCount: number; // total units (sum of stock)
  uniqueProductsCount: number; // number of distinct SKUs/items
  totalInventoryCost: number; // sum(stock * costPrice)
  totalInventoryValue: number; // sum(stock * sellingPrice)
  totalPotentialProfit: number;
  lowStockCount: number; // items with stock <= minStockAlert
  outOfStockCount: number; // items with stock === 0
  
  // Sales insights
  totalSalesRevenue: number;
  totalProfitEarned: number;
  totalUnitsSold: number;
  salesCount: number;
  
  // Deletions count
  deletionsCount: number;
  
  // Rankings & breakdowns
  topSoldItems: Array<{
    equipmentId: string;
    name: string;
    category: EquipmentCategory;
    brand: string;
    unitsSold: number;
    totalRevenue: number;
    profitEarned: number;
  }>;
  categoryDistribution: Array<{
    category: EquipmentCategory;
    label: string;
    unitsInStock: number;
    totalValue: number;
    percentage: number;
  }>;
  brandDistribution: Array<{
    brand: string;
    unitsInStock: number;
    totalValue: number;
  }>;
  recentSales: Sale[];
  lowStockItems: Equipment[];
}

export interface PackItem {
  equipmentId: string;
  equipmentName: string;
  category: EquipmentCategory;
  brand?: string;
  model?: string;
  size?: string;
  color?: string;
  quantity: number;
  originalPrice: number; // Regular unit selling price
  packPrice: number; // Customized price of this specific element in the pack
  costPrice: number;
}

export interface CartItem {
  cartLineId: string;
  equipment: Equipment;
  size?: string;
  color?: string;
  quantity: number;
  unitPrice: number; // Prix personnalisé de cet article dans le panier (modifiable par l'utilisateur !)
  originalPrice: number; // Prix de vente standard
  costPrice: number;
  maxStock: number;
}

export interface EquipmentPack {
  id: string;
  name: string;
  description?: string;
  items: PackItem[];
  totalOriginalPrice: number; // Sum of (originalPrice * quantity)
  totalPackPrice: number; // Sum of (packPrice * quantity)
  discountAmount: number; // totalOriginalPrice - totalPackPrice
  discountPercentage: number;
  barcode?: string;
  createdAt: string;
  updatedAt: string;
}

/** Helper function to calculate maximum available packs based on constituent items stock */
export function getPackAvailableStock(pack: EquipmentPack, equipmentList: Equipment[]): number {
  if (!pack.items || pack.items.length === 0) return 0;

  const limits: number[] = [];

  for (const item of pack.items) {
    const eq = equipmentList.find((e) => e.id === item.equipmentId);
    if (!eq) {
      limits.push(0);
      continue;
    }

    let available = 0;
    if (item.size && item.color) {
      const sz = eq.sizes?.find((s) => (s.size || '').toLowerCase() === item.size?.toLowerCase());
      const cl = sz?.colors?.find((c) => (c.color || '').toLowerCase() === item.color?.toLowerCase());
      available = cl ? Number(cl.quantity) || 0 : 0;
    } else if (item.size) {
      const sz = eq.sizes?.find((s) => (s.size || '').toLowerCase() === item.size?.toLowerCase());
      available = sz?.colors?.reduce((sum, c) => sum + (Number(c.quantity) || 0), 0) || 0;
    } else {
      available = getEquipmentTotalStock(eq);
    }

    const neededPerPack = Math.max(1, Number(item.quantity) || 1);
    limits.push(Math.floor(available / neededPerPack));
  }

  return limits.length > 0 ? Math.min(...limits) : 0;
}

