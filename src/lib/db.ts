import fs from 'fs/promises';
import path from 'path';
import { Equipment, Sale, InventoryStats, EquipmentCategory, DeletionLog } from '@/types/inventory';
import { INITIAL_EQUIPMENT, INITIAL_SALES } from './initialData';

const DATA_DIR = path.join(process.cwd(), 'data');
const INVENTORY_FILE = path.join(DATA_DIR, 'inventory.json');
const SALES_FILE = path.join(DATA_DIR, 'sales.json');
const DELETIONS_FILE = path.join(DATA_DIR, 'deletions.json');

// Ensure data folder and json files exist
async function ensureDbInitialized() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Already exists
  }

  try {
    await fs.access(INVENTORY_FILE);
  } catch {
    await fs.writeFile(INVENTORY_FILE, JSON.stringify(INITIAL_EQUIPMENT, null, 2), 'utf-8');
  }

  try {
    await fs.access(SALES_FILE);
  } catch {
    await fs.writeFile(SALES_FILE, JSON.stringify(INITIAL_SALES, null, 2), 'utf-8');
  }

  try {
    await fs.access(DELETIONS_FILE);
  } catch {
    await fs.writeFile(DELETIONS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export async function getEquipment(): Promise<Equipment[]> {
  await ensureDbInitialized();
  try {
    const raw = await fs.readFile(INVENTORY_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading inventory.json, falling back to seed:', err);
    return INITIAL_EQUIPMENT;
  }
}

export async function saveEquipmentList(items: Equipment[]): Promise<void> {
  await ensureDbInitialized();
  await fs.writeFile(INVENTORY_FILE, JSON.stringify(items, null, 2), 'utf-8');
}

export async function getSales(): Promise<Sale[]> {
  await ensureDbInitialized();
  try {
    const raw = await fs.readFile(SALES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading sales.json, falling back to seed:', err);
    return INITIAL_SALES;
  }
}

export async function saveSalesList(sales: Sale[]): Promise<void> {
  await ensureDbInitialized();
  await fs.writeFile(SALES_FILE, JSON.stringify(sales, null, 2), 'utf-8');
}

export async function addEquipment(item: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Equipment> {
  const items = await getEquipment();
  const now = new Date().toISOString();
  const newItem: Equipment = {
    ...item,
    id: `eq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: now,
    updatedAt: now,
  };
  items.unshift(newItem);
  await saveEquipmentList(items);
  return newItem;
}

export async function updateEquipment(id: string, updates: Partial<Equipment>): Promise<Equipment | null> {
  const items = await getEquipment();
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return null;

  items[index] = {
    ...items[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await saveEquipmentList(items);
  return items[index];
}

export async function getDeletions(): Promise<DeletionLog[]> {
  await ensureDbInitialized();
  try {
    const raw = await fs.readFile(DELETIONS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading deletions.json:', err);
    return [];
  }
}

export async function saveDeletionsList(logs: DeletionLog[]): Promise<void> {
  await ensureDbInitialized();
  await fs.writeFile(DELETIONS_FILE, JSON.stringify(logs, null, 2), 'utf-8');
}

export async function deleteEquipment(id: string, reason?: string): Promise<{ success: boolean; deletedLog?: DeletionLog }> {
  const items = await getEquipment();
  const eq = items.find((i) => i.id === id);
  if (!eq) return { success: false };

  // Create deletion archive log
  const deletedLog: DeletionLog = {
    id: `del-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    equipmentId: eq.id,
    equipmentName: eq.name,
    category: eq.category,
    brand: eq.brand,
    model: eq.model,
    size: eq.size,
    color: eq.color,
    stockAtDeletion: eq.stock,
    costPrice: eq.costPrice || 0,
    sellingPrice: eq.sellingPrice || 0,
    barcode: eq.barcode,
    description: eq.description,
    deletedAt: new Date().toISOString(),
    deletedReason: reason || 'Suppression manuelle',
  };

  const deletions = await getDeletions();
  deletions.unshift(deletedLog);
  await saveDeletionsList(deletions);

  // Remove from active inventory
  const filtered = items.filter((i) => i.id !== id);
  await saveEquipmentList(filtered);

  return { success: true, deletedLog };
}

export async function restoreDeletedEquipment(deletionId: string): Promise<Equipment | null> {
  const deletions = await getDeletions();
  const index = deletions.findIndex((d) => d.id === deletionId);
  if (index === -1) return null;

  const [log] = deletions.splice(index, 1);
  await saveDeletionsList(deletions);

  const restored: Equipment = {
    id: log.equipmentId,
    name: log.equipmentName,
    category: log.category,
    brand: log.brand,
    model: log.model,
    size: log.size,
    color: log.color,
    stock: log.stockAtDeletion,
    minStockAlert: 3,
    costPrice: log.costPrice,
    sellingPrice: log.sellingPrice,
    barcode: log.barcode,
    description: log.description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const items = await getEquipment();
  items.unshift(restored);
  await saveEquipmentList(items);

  return restored;
}

export async function adjustEquipmentStock(id: string, delta: number): Promise<Equipment | null> {
  const items = await getEquipment();
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return null;

  const currentStock = items[index].stock || 0;
  const newStock = Math.max(0, currentStock + delta);
  items[index].stock = newStock;
  items[index].updatedAt = new Date().toISOString();

  await saveEquipmentList(items);
  return items[index];
}

export async function recordSale(saleInput: {
  equipmentId: string;
  quantity: number;
  unitPrice?: number;
  buyerName?: string;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'autre';
  notes?: string;
}): Promise<{ sale: Sale; updatedEquipment: Equipment }> {
  const items = await getEquipment();
  const eqIndex = items.findIndex((i) => i.id === saleInput.equipmentId);
  if (eqIndex === -1) {
    throw new Error('Équipement non trouvé');
  }

  const eq = items[eqIndex];
  if (eq.stock < saleInput.quantity) {
    throw new Error(`Stock insuffisant (${eq.stock} restant(s))`);
  }

  // Deduct stock
  eq.stock -= saleInput.quantity;
  eq.updatedAt = new Date().toISOString();
  await saveEquipmentList(items);

  // Record sale
  const sales = await getSales();
  const unitPrice = saleInput.unitPrice !== undefined ? saleInput.unitPrice : eq.sellingPrice;
  const totalPrice = unitPrice * saleInput.quantity;
  const costTotal = (eq.costPrice || 0) * saleInput.quantity;
  const profit = totalPrice - costTotal;

  const newSale: Sale = {
    id: `sale-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    equipmentId: eq.id,
    equipmentName: eq.name,
    category: eq.category,
    brand: eq.brand,
    size: eq.size,
    color: eq.color,
    quantity: saleInput.quantity,
    unitPrice,
    totalPrice,
    costPrice: eq.costPrice || 0,
    profit,
    buyerName: saleInput.buyerName || 'Client dojo',
    paymentMethod: saleInput.paymentMethod || 'cash',
    date: new Date().toISOString(),
    notes: saleInput.notes,
  };

  sales.unshift(newSale);
  await saveSalesList(sales);

  return { sale: newSale, updatedEquipment: eq };
}

export async function refundSale(saleId: string): Promise<{ success: boolean; refundedSale: Sale }> {
  const sales = await getSales();
  const saleIndex = sales.findIndex((s) => s.id === saleId);
  if (saleIndex === -1) {
    throw new Error('Vente non trouvée');
  }

  const [refundedSale] = sales.splice(saleIndex, 1);
  await saveSalesList(sales);

  // Restore equipment stock
  const items = await getEquipment();
  const eqIndex = items.findIndex((i) => i.id === refundedSale.equipmentId);
  if (eqIndex !== -1) {
    items[eqIndex].stock += refundedSale.quantity;
    items[eqIndex].updatedAt = new Date().toISOString();
    await saveEquipmentList(items);
  }

  return { success: true, refundedSale };
}

export function computeInventoryStats(
  equipment: Equipment[],
  sales: Sale[],
  deletions: DeletionLog[] = []
): InventoryStats {
  let totalItemsCount = 0;
  let totalInventoryCost = 0;
  let totalInventoryValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  const lowStockItems: Equipment[] = [];

  const categoryMap: Record<EquipmentCategory, { unitsInStock: number; totalValue: number; label: string }> = {
    gants: { unitsInStock: 0, totalValue: 0, label: 'Gants de Boxe' },
    protege_tibias: { unitsInStock: 0, totalValue: 0, label: 'Protège-Tibias' },
    bandes: { unitsInStock: 0, totalValue: 0, label: 'Bandes de Boxe' },
    protege_dents: { unitsInStock: 0, totalValue: 0, label: 'Protège-Dents' },
    coquilles: { unitsInStock: 0, totalValue: 0, label: 'Coquilles' },
    autres: { unitsInStock: 0, totalValue: 0, label: 'Autres' },
  };

  const brandMap: Record<string, { unitsInStock: number; totalValue: number }> = {};

  equipment.forEach((item) => {
    const qty = Number(item.stock) || 0;
    const cost = Number(item.costPrice) || 0;
    const sell = Number(item.sellingPrice) || 0;

    totalItemsCount += qty;
    totalInventoryCost += qty * cost;
    totalInventoryValue += qty * sell;

    if (qty === 0) {
      outOfStockCount++;
      lowStockItems.push(item);
    } else if (qty <= (item.minStockAlert || 3)) {
      lowStockCount++;
      lowStockItems.push(item);
    }

    if (categoryMap[item.category]) {
      categoryMap[item.category].unitsInStock += qty;
      categoryMap[item.category].totalValue += qty * sell;
    }

    const brand = item.brand || 'Autre';
    if (!brandMap[brand]) {
      brandMap[brand] = { unitsInStock: 0, totalValue: 0 };
    }
    brandMap[brand].unitsInStock += qty;
    brandMap[brand].totalValue += qty * sell;
  });

  // Sales aggregates
  let totalSalesRevenue = 0;
  let totalProfitEarned = 0;
  let totalUnitsSold = 0;

  const topSoldMap: Record<
    string,
    {
      equipmentId: string;
      name: string;
      category: EquipmentCategory;
      brand: string;
      unitsSold: number;
      totalRevenue: number;
      profitEarned: number;
    }
  > = {};

  sales.forEach((s) => {
    totalSalesRevenue += Number(s.totalPrice) || 0;
    totalProfitEarned += Number(s.profit) || 0;
    totalUnitsSold += Number(s.quantity) || 0;

    if (!topSoldMap[s.equipmentId]) {
      topSoldMap[s.equipmentId] = {
        equipmentId: s.equipmentId,
        name: s.equipmentName,
        category: s.category,
        brand: s.brand,
        unitsSold: 0,
        totalRevenue: 0,
        profitEarned: 0,
      };
    }
    topSoldMap[s.equipmentId].unitsSold += Number(s.quantity) || 0;
    topSoldMap[s.equipmentId].totalRevenue += Number(s.totalPrice) || 0;
    topSoldMap[s.equipmentId].profitEarned += Number(s.profit) || 0;
  });

  const topSoldItems = Object.values(topSoldMap)
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 10);

  const categoryDistribution = (Object.keys(categoryMap) as EquipmentCategory[]).map((catKey) => {
    const cat = categoryMap[catKey];
    return {
      category: catKey,
      label: cat.label,
      unitsInStock: cat.unitsInStock,
      totalValue: cat.totalValue,
      percentage: totalItemsCount > 0 ? Math.round((cat.unitsInStock / totalItemsCount) * 100) : 0,
    };
  }).filter((c) => c.unitsInStock > 0);

  const brandDistribution = Object.entries(brandMap)
    .map(([brand, data]) => ({
      brand,
      unitsInStock: data.unitsInStock,
      totalValue: data.totalValue,
    }))
    .sort((a, b) => b.unitsInStock - a.unitsInStock);

  return {
    totalItemsCount,
    uniqueProductsCount: equipment.length,
    totalInventoryCost,
    totalInventoryValue,
    totalPotentialProfit: totalInventoryValue - totalInventoryCost,
    lowStockCount,
    outOfStockCount,
    totalSalesRevenue,
    totalProfitEarned,
    totalUnitsSold,
    salesCount: sales.length,
    deletionsCount: deletions.length,
    topSoldItems,
    categoryDistribution,
    brandDistribution,
    recentSales: sales.slice(0, 8),
    lowStockItems,
  };
}

export async function resetDatabase(): Promise<{ equipment: Equipment[]; sales: Sale[]; deletions: DeletionLog[] }> {
  await ensureDbInitialized();
  await fs.writeFile(INVENTORY_FILE, JSON.stringify(INITIAL_EQUIPMENT, null, 2), 'utf-8');
  await fs.writeFile(SALES_FILE, JSON.stringify(INITIAL_SALES, null, 2), 'utf-8');
  await fs.writeFile(DELETIONS_FILE, JSON.stringify([], null, 2), 'utf-8');
  return { equipment: INITIAL_EQUIPMENT, sales: INITIAL_SALES, deletions: [] };
}
