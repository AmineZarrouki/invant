export type EquipmentCategory =
  | 'gants'
  | 'bandes'
  | 'protege_tibias'
  | 'protege_dents'
  | 'coquilles'
  | 'autres';

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
