export type EquipmentCategory =
  | 'gants'
  | 'bandes'
  | 'protege_tibias'
  | 'protege_dents'
  | 'coquilles'
  | 'autres';

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  brand: string;
  model?: string;
  size: string; // e.g. "12 oz", "3.5m", "M", "L", "XL"
  color: string;
  stock: number;
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
  size: string;
  color: string;
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
  size: string;
  color: string;
  stockAtDeletion: number;
  costPrice: number;
  sellingPrice: number;
  barcode?: string;
  description?: string;
  deletedAt: string; // ISO string
  deletedReason?: string;
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
