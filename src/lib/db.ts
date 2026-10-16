import {
  Equipment,
  Sale,
  InventoryStats,
  EquipmentCategory,
  DeletionLog,
  SizeVariant,
  getEquipmentTotalStock,
} from '@/types/inventory';
import { INITIAL_EQUIPMENT, INITIAL_SALES } from './initialData';
import { getStorageAdapter } from './storage';

/**
 * Normalizes an equipment object to ensure sizes and colors are properly structured.
 * Also attaches the dynamic computed `stock` for runtime display.
 */
function normalizeEquipment(item: any): Equipment {
  let sizes: SizeVariant[] = item.sizes;

  if (!sizes || !Array.isArray(sizes) || sizes.length === 0) {
    if (item.size || item.color) {
      sizes = [
        {
          size: item.size || 'Unique',
          colors: [{ color: item.color || 'Standard', quantity: Number(item.stock) || 0 }],
        },
      ];
    } else {
      sizes = [{ colors: [{ color: 'Standard', quantity: Number(item.stock) || 0 }] }];
    }
  } else {
    sizes = sizes.map((sz) => ({
      ...(sz.size ? { size: sz.size.trim() } : {}),
      colors: (sz.colors || []).map((c: any) => ({
        color: (c.color || 'Standard').trim(),
        quantity: Math.max(0, Number(c.quantity) || 0),
      })),
    }));
  }

  const normalized: Equipment = {
    id: item.id,
    name: item.name,
    category: item.category,
    brand: item.brand || 'Générique',
    model: item.model || '',
    sizes,
    minStockAlert: Number(item.minStockAlert) || 3,
    costPrice: Number(item.costPrice) || 0,
    sellingPrice: Number(item.sellingPrice) || 0,
    barcode: item.barcode || '',
    description: item.description || '',
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
  };

  // Runtime computed property for convenience
  normalized.stock = getEquipmentTotalStock(normalized);
  return normalized;
}

export async function getEquipment(): Promise<Equipment[]> {
  try {
    const adapter = getStorageAdapter();
    const raw = await adapter.get('inventory');
    if (!raw || !Array.isArray(raw) || raw.length === 0) {
      await adapter.set('inventory', INITIAL_EQUIPMENT);
      return INITIAL_EQUIPMENT.map(normalizeEquipment);
    }
    return raw.map(normalizeEquipment);
  } catch (err) {
    console.error('Error in getEquipment, falling back to seed:', err);
    return INITIAL_EQUIPMENT.map(normalizeEquipment);
  }
}

/**
 * Saves equipment list via storage adapter.
 * IMPORTANT: The stored JSON stores quantity per color of each size,
 * NOT a top-level total stock for the overall product.
 */
export async function saveEquipmentList(items: Equipment[]): Promise<void> {
  const jsonReady = items.map((item) => {
    const { stock, ...rest } = item;
    return {
      id: rest.id,
      name: rest.name,
      category: rest.category,
      brand: rest.brand,
      model: rest.model || undefined,
      sizes: (rest.sizes || []).map((sz) => ({
        ...(sz.size ? { size: sz.size.trim() } : {}),
        colors: (sz.colors || []).map((c) => ({
          color: c.color.trim(),
          quantity: Math.max(0, Number(c.quantity) || 0),
        })),
      })),
      minStockAlert: rest.minStockAlert,
      costPrice: rest.costPrice,
      sellingPrice: rest.sellingPrice,
      barcode: rest.barcode || undefined,
      description: rest.description || undefined,
      createdAt: rest.createdAt,
      updatedAt: rest.updatedAt,
    };
  });

  const adapter = getStorageAdapter();
  await adapter.set('inventory', jsonReady);
}

export async function getSales(): Promise<Sale[]> {
  try {
    const adapter = getStorageAdapter();
    const raw = await adapter.get('sales');
    if (!raw || !Array.isArray(raw)) {
      await adapter.set('sales', INITIAL_SALES);
      return INITIAL_SALES;
    }
    return raw;
  } catch (err) {
    console.error('Error in getSales, falling back to seed:', err);
    return INITIAL_SALES;
  }
}

export async function saveSalesList(sales: Sale[]): Promise<void> {
  const adapter = getStorageAdapter();
  await adapter.set('sales', sales);
}

export async function addEquipment(item: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt' | 'stock'>): Promise<Equipment> {
  const items = await getEquipment();
  const now = new Date().toISOString();
  
  const newItem: Equipment = {
    ...item,
    id: `eq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    sizes: (item.sizes || []).map((sz) => ({
      ...(sz.size ? { size: sz.size.trim() } : {}),
      colors: (sz.colors || []).map((c) => ({
        color: c.color.trim(),
        quantity: Math.max(0, Number(c.quantity) || 0),
      })),
    })),
    createdAt: now,
    updatedAt: now,
  };
  newItem.stock = getEquipmentTotalStock(newItem);

  items.unshift(newItem);
  await saveEquipmentList(items);
  return newItem;
}

export async function updateEquipment(id: string, updates: Partial<Equipment>): Promise<Equipment | null> {
  const items = await getEquipment();
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return null;

  const current = items[index];
  const newSizes = updates.sizes
    ? updates.sizes.map((sz) => ({
        ...(sz.size ? { size: sz.size.trim() } : {}),
        colors: (sz.colors || []).map((c) => ({
          color: c.color.trim(),
          quantity: Math.max(0, Number(c.quantity) || 0),
        })),
      }))
    : current.sizes;

  const updated: Equipment = {
    ...current,
    ...updates,
    sizes: newSizes,
    updatedAt: new Date().toISOString(),
  };
  updated.stock = getEquipmentTotalStock(updated);
  items[index] = updated;

  await saveEquipmentList(items);
  return updated;
}

export async function getDeletions(): Promise<DeletionLog[]> {
  try {
    const adapter = getStorageAdapter();
    const raw = await adapter.get('deletions');
    if (!raw || !Array.isArray(raw)) {
      return [];
    }
    return raw;
  } catch (err) {
    console.error('Error in getDeletions:', err);
    return [];
  }
}

export async function saveDeletionsList(logs: DeletionLog[]): Promise<void> {
  const adapter = getStorageAdapter();
  await adapter.set('deletions', logs);
}

export async function deleteEquipment(id: string, reason?: string): Promise<{ success: boolean; deletedLog?: DeletionLog }> {
  const items = await getEquipment();
  const eq = items.find((i) => i.id === id);
  if (!eq) return { success: false };

  const totalStock = getEquipmentTotalStock(eq);

  // Create deletion archive log
  const deletedLog: DeletionLog = {
    id: `del-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    equipmentId: eq.id,
    equipmentName: eq.name,
    category: eq.category,
    brand: eq.brand,
    model: eq.model,
    sizes: JSON.parse(JSON.stringify(eq.sizes || [])),
    stockAtDeletion: totalStock,
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
    sizes: log.sizes || [],
    minStockAlert: 3,
    costPrice: log.costPrice,
    sellingPrice: log.sellingPrice,
    barcode: log.barcode,
    description: log.description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  restored.stock = getEquipmentTotalStock(restored);

  const items = await getEquipment();
  items.unshift(restored);
  await saveEquipmentList(items);

  return restored;
}

export async function adjustEquipmentStock(
  id: string,
  delta: number,
  options?: { size?: string; color?: string }
): Promise<Equipment | null> {
  const items = await getEquipment();
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return null;

  const eq = items[index];
  if (!eq.sizes || eq.sizes.length === 0) {
    eq.sizes = [{ colors: [{ color: 'Standard', quantity: 0 }] }];
  }

  // Find matching size variant
  let targetSize = eq.sizes.find((s) => {
    if (!options?.size) return true;
    return (s.size || '').trim().toLowerCase() === options.size.trim().toLowerCase();
  });

  if (!targetSize) {
    if (options?.size) {
      targetSize = { size: options.size.trim(), colors: [] };
      eq.sizes.push(targetSize);
    } else {
      targetSize = eq.sizes[0];
    }
  }

  // Find matching color entry
  let targetColor = targetSize.colors.find((c) => {
    if (!options?.color) return true;
    return (c.color || '').trim().toLowerCase() === options.color.trim().toLowerCase();
  });

  if (!targetColor) {
    if (options?.color) {
      targetColor = { color: options.color.trim(), quantity: 0 };
      targetSize.colors.push(targetColor);
    } else if (targetSize.colors.length > 0) {
      targetColor = targetSize.colors[0];
    } else {
      targetColor = { color: 'Standard', quantity: 0 };
      targetSize.colors.push(targetColor);
    }
  }

  targetColor.quantity = Math.max(0, (targetColor.quantity || 0) + delta);
  eq.stock = getEquipmentTotalStock(eq);
  eq.updatedAt = new Date().toISOString();

  await saveEquipmentList(items);
  return eq;
}

export async function recordSale(saleInput: {
  equipmentId: string;
  size?: string;
  color?: string;
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
  if (!eq.sizes || eq.sizes.length === 0) {
    throw new Error('Aucun stock disponible pour cet équipement');
  }

  // Find matching size variant
  let targetSize = eq.sizes.find((s) => {
    if (!saleInput.size) return true;
    return (s.size || '').trim().toLowerCase() === saleInput.size.trim().toLowerCase();
  });
  if (!targetSize) {
    targetSize = eq.sizes[0];
  }

  // Find matching color entry
  let targetColor = targetSize.colors.find((c) => {
    if (!saleInput.color) return true;
    return (c.color || '').trim().toLowerCase() === saleInput.color.trim().toLowerCase();
  });
  if (!targetColor) {
    targetColor = targetSize.colors[0];
  }

  if (!targetColor || targetColor.quantity < saleInput.quantity) {
    const available = targetColor ? targetColor.quantity : 0;
    const variantDesc = [targetSize.size, targetColor?.color].filter(Boolean).join(' - ');
    throw new Error(
      `Stock insuffisant pour ${eq.name}${variantDesc ? ` (${variantDesc})` : ''} : ${available} restant(s)`
    );
  }

  // Deduct stock for that specific color of that size
  targetColor.quantity -= saleInput.quantity;
  eq.stock = getEquipmentTotalStock(eq);
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
    size: targetSize.size,
    color: targetColor.color,
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

  // Restore equipment stock to matching size and color
  const items = await getEquipment();
  const eqIndex = items.findIndex((i) => i.id === refundedSale.equipmentId);
  if (eqIndex !== -1) {
    const eq = items[eqIndex];
    if (!eq.sizes || eq.sizes.length === 0) {
      eq.sizes = [{ size: refundedSale.size, colors: [{ color: refundedSale.color || 'Standard', quantity: 0 }] }];
    }

    let targetSize = eq.sizes.find((s) => {
      if (!refundedSale.size) return true;
      return (s.size || '').trim().toLowerCase() === refundedSale.size.trim().toLowerCase();
    });
    if (!targetSize) {
      targetSize = { size: refundedSale.size, colors: [] };
      eq.sizes.push(targetSize);
    }

    let targetColor = targetSize.colors.find((c) => {
      if (!refundedSale.color) return true;
      return (c.color || '').trim().toLowerCase() === refundedSale.color.trim().toLowerCase();
    });
    if (!targetColor) {
      targetColor = { color: refundedSale.color || 'Standard', quantity: 0 };
      targetSize.colors.push(targetColor);
    }

    targetColor.quantity += refundedSale.quantity;
    eq.stock = getEquipmentTotalStock(eq);
    eq.updatedAt = new Date().toISOString();
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
    const qty = getEquipmentTotalStock(item);
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
  const adapter = getStorageAdapter();
  await adapter.set('inventory', INITIAL_EQUIPMENT);
  await adapter.set('sales', INITIAL_SALES);
  await adapter.set('deletions', []);
  const eqWithStock = INITIAL_EQUIPMENT.map(normalizeEquipment);
  return { equipment: eqWithStock, sales: INITIAL_SALES, deletions: [] };
}

export function getStorageStatus(): { provider: string; isCloud: boolean } {
  const adapter = getStorageAdapter();
  return {
    provider: adapter.getProviderName(),
    isCloud: adapter.isCloud(),
  };
}
