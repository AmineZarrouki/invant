import {
  Equipment,
  Sale,
  InventoryStats,
  EquipmentCategory,
  DeletionLog,
  SizeVariant,
  getEquipmentTotalStock,
  EquipmentPack,
  PackItem,
} from '@/types/inventory';
import { INITIAL_EQUIPMENT, INITIAL_SALES } from './initialData';
import { getStorageAdapter } from './storage';
import { CATEGORY_CONFIG } from './categoryColors';

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
          colors: [{ color: item.color !== undefined ? item.color : '', quantity: Number(item.stock) || 0 }],
        },
      ];
    } else {
      sizes = [{ colors: [{ color: '', quantity: Number(item.stock) || 0 }] }];
    }
  } else {
    sizes = sizes.map((sz) => ({
      ...(sz.size !== undefined ? { size: sz.size.trim() } : {}),
      colors: (sz.colors || []).map((c: any) => ({
        color: (c.color !== undefined ? c.color : '').trim(),
        quantity: Math.max(0, Number(c.quantity) || 0),
      })),
    }));
  }

  const normalized: Equipment = {
    id: item.id,
    name: item.name,
    category: item.category,
    brand: item.brand !== undefined ? item.brand : '',
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

export async function recordBatchSale(batchInput: {
  items: Array<{
    equipmentId: string;
    size?: string;
    color?: string;
    quantity: number;
    unitPrice?: number;
  }>;
  buyerName?: string;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'autre';
  notes?: string;
}): Promise<{ sales: Sale[]; updatedEquipment: Equipment[] }> {
  if (!batchInput.items || batchInput.items.length === 0) {
    throw new Error('Le panier est vide');
  }

  const items = await getEquipment();
  const sales = await getSales();
  const newSales: Sale[] = [];

  // 1. Validation pass: verify all items have enough stock before deducting anything
  for (const itemInput of batchInput.items) {
    const eq = items.find((i) => i.id === itemInput.equipmentId);
    if (!eq) {
      throw new Error(`Équipement ID ${itemInput.equipmentId} non trouvé`);
    }
    if (!eq.sizes || eq.sizes.length === 0) {
      throw new Error(`Aucun stock disponible pour ${eq.name}`);
    }

    let targetSize = eq.sizes.find((s) => {
      if (!itemInput.size) return true;
      return (s.size || '').trim().toLowerCase() === itemInput.size.trim().toLowerCase();
    });
    if (!targetSize) targetSize = eq.sizes[0];

    let targetColor = targetSize.colors.find((c) => {
      if (!itemInput.color) return true;
      return (c.color || '').trim().toLowerCase() === itemInput.color.trim().toLowerCase();
    });
    if (!targetColor) targetColor = targetSize.colors[0];

    if (!targetColor || targetColor.quantity < itemInput.quantity) {
      const available = targetColor ? targetColor.quantity : 0;
      const variantDesc = [targetSize.size, targetColor?.color].filter(Boolean).join(' - ');
      throw new Error(
        `Stock insuffisant pour ${eq.name}${variantDesc ? ` (${variantDesc})` : ''} : ${available} restant(s)`
      );
    }
  }

  // 2. Deduction and Sale creation pass
  const now = new Date().toISOString();
  for (const itemInput of batchInput.items) {
    const eq = items.find((i) => i.id === itemInput.equipmentId)!;

    let targetSize = eq.sizes.find((s) => {
      if (!itemInput.size) return true;
      return (s.size || '').trim().toLowerCase() === itemInput.size.trim().toLowerCase();
    });
    if (!targetSize) targetSize = eq.sizes[0];

    let targetColor = targetSize.colors.find((c) => {
      if (!itemInput.color) return true;
      return (c.color || '').trim().toLowerCase() === itemInput.color.trim().toLowerCase();
    });
    if (!targetColor) targetColor = targetSize.colors[0];

    targetColor.quantity -= itemInput.quantity;
    eq.stock = getEquipmentTotalStock(eq);
    eq.updatedAt = now;

    const unitPrice = itemInput.unitPrice !== undefined ? itemInput.unitPrice : eq.sellingPrice;
    const totalPrice = unitPrice * itemInput.quantity;
    const costTotal = (eq.costPrice || 0) * itemInput.quantity;
    const profit = totalPrice - costTotal;

    const newSale: Sale = {
      id: `sale-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      equipmentId: eq.id,
      equipmentName: eq.name,
      category: eq.category,
      brand: eq.brand,
      size: targetSize.size,
      color: targetColor.color,
      quantity: itemInput.quantity,
      unitPrice,
      totalPrice,
      costPrice: eq.costPrice || 0,
      profit,
      buyerName: batchInput.buyerName || 'Client dojo',
      paymentMethod: batchInput.paymentMethod || 'cash',
      date: now,
      notes: batchInput.notes,
    };

    newSales.push(newSale);
    sales.unshift(newSale);
  }

  await saveEquipmentList(items);
  await saveSalesList(sales);

  return {
    sales: newSales,
    updatedEquipment: items,
  };
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

  const categoryMap: Record<string, { unitsInStock: number; totalValue: number; label: string }> = {};

  // Pre-seed default categories
  const defaultKeys = [
    'gants',
    'protege_tibias',
    'bandes',
    'protege_dents',
    'coquilles',
    'protections',
    'textile',
    'tenue_competition',
    'pantalon_combat',
    'textile_competition',
    'short_combat',
    'tenue_entrainement',
    'autres',
  ];
  defaultKeys.forEach((key) => {
    categoryMap[key] = {
      unitsInStock: 0,
      totalValue: 0,
      label: CATEGORY_CONFIG[key]?.label || key,
    };
  });

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

    const catKey = item.category || 'autres';
    if (!categoryMap[catKey]) {
      categoryMap[catKey] = {
        unitsInStock: 0,
        totalValue: 0,
        label: CATEGORY_CONFIG[catKey]?.label || catKey,
      };
    }
    categoryMap[catKey].unitsInStock += qty;
    categoryMap[catKey].totalValue += qty * sell;

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

// -------------------------------------------------------------
// PACKS MANAGEMENT (GROUPING EQUIPMENTS WITH INDIVIDUAL PRICES)
// -------------------------------------------------------------

export async function getPacks(): Promise<EquipmentPack[]> {
  try {
    const adapter = getStorageAdapter();
    const raw = await adapter.get('packs');
    if (!raw || !Array.isArray(raw)) {
      return [];
    }
    return raw;
  } catch (err) {
    console.error('Error in getPacks:', err);
    return [];
  }
}

export async function savePacksList(packs: EquipmentPack[]): Promise<void> {
  const adapter = getStorageAdapter();
  await adapter.set('packs', packs);
}

export async function addPack(
  packData: Omit<EquipmentPack, 'id' | 'createdAt' | 'updatedAt'>
): Promise<EquipmentPack> {
  const packs = await getPacks();
  const now = new Date().toISOString();

  // Compute totals
  const totalOriginalPrice = packData.items.reduce(
    (sum, it) => sum + (Number(it.originalPrice) || 0) * (Number(it.quantity) || 1),
    0
  );
  const totalPackPrice = packData.items.reduce(
    (sum, it) => sum + (Number(it.packPrice) || 0) * (Number(it.quantity) || 1),
    0
  );
  const discountAmount = Math.max(0, totalOriginalPrice - totalPackPrice);
  const discountPercentage =
    totalOriginalPrice > 0 ? Math.round((discountAmount / totalOriginalPrice) * 100) : 0;

  const newPack: EquipmentPack = {
    ...packData,
    id: `pack-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    totalOriginalPrice,
    totalPackPrice,
    discountAmount,
    discountPercentage,
    createdAt: now,
    updatedAt: now,
  };

  packs.unshift(newPack);
  await savePacksList(packs);
  return newPack;
}

export async function updatePack(
  id: string,
  updates: Partial<EquipmentPack>
): Promise<EquipmentPack | null> {
  const packs = await getPacks();
  const index = packs.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const current = packs[index];
  const items = updates.items || current.items;

  const totalOriginalPrice = items.reduce(
    (sum, it) => sum + (Number(it.originalPrice) || 0) * (Number(it.quantity) || 1),
    0
  );
  const totalPackPrice = items.reduce(
    (sum, it) => sum + (Number(it.packPrice) || 0) * (Number(it.quantity) || 1),
    0
  );
  const discountAmount = Math.max(0, totalOriginalPrice - totalPackPrice);
  const discountPercentage =
    totalOriginalPrice > 0 ? Math.round((discountAmount / totalOriginalPrice) * 100) : 0;

  const updated: EquipmentPack = {
    ...current,
    ...updates,
    items,
    totalOriginalPrice,
    totalPackPrice,
    discountAmount,
    discountPercentage,
    updatedAt: new Date().toISOString(),
  };

  packs[index] = updated;
  await savePacksList(packs);
  return updated;
}

export async function deletePack(id: string): Promise<boolean> {
  const packs = await getPacks();
  const filtered = packs.filter((p) => p.id !== id);
  if (filtered.length === packs.length) return false;

  await savePacksList(filtered);
  return true;
}

export async function recordPackSale(
  packId: string,
  options: {
    buyerName?: string;
    paymentMethod?: 'cash' | 'card' | 'transfer' | 'autre';
    notes?: string;
    variantSelections?: Record<string, { size?: string; color?: string }>;
  }
): Promise<{ sales: Sale[]; updatedEquipment: Equipment[] }> {
  const packs = await getPacks();
  const pack = packs.find((p) => p.id === packId);
  if (!pack) {
    throw new Error('Pack non trouvé');
  }

  const equipmentList = await getEquipment();
  const createdSales: Sale[] = [];
  const now = new Date().toISOString();

  // Validate stock for all items in the pack before deducting any
  for (const packItem of pack.items) {
    const eq = equipmentList.find((e) => e.id === packItem.equipmentId);
    if (!eq) {
      throw new Error(`Article "${packItem.equipmentName}" non trouvé dans l'inventaire`);
    }

    const selectedVariant = options.variantSelections?.[packItem.equipmentId] || {};
    const targetSizeStr = selectedVariant.size || packItem.size;
    const targetColorStr = selectedVariant.color || packItem.color;

    let targetSize = eq.sizes?.find((s) => {
      if (!targetSizeStr) return true;
      return (s.size || '').toLowerCase() === targetSizeStr.toLowerCase();
    });
    if (!targetSize && eq.sizes?.length) targetSize = eq.sizes[0];

    let targetColor = targetSize?.colors?.find((c) => {
      if (!targetColorStr) return true;
      return (c.color || '').toLowerCase() === targetColorStr.toLowerCase();
    });
    if (!targetColor && targetSize?.colors?.length) targetColor = targetSize.colors[0];

    const available = targetColor?.quantity || 0;
    const requiredQty = Number(packItem.quantity) || 1;
    if (available < requiredQty) {
      throw new Error(
        `Stock insuffisant pour "${eq.name}" (${targetSize?.size || 'Standard'} / ${targetColor?.color || 'Standard'}) dans le pack : ${available} restant(s), ${requiredQty} requis`
      );
    }
  }

  // Deduct stock and record sales
  for (const packItem of pack.items) {
    const eq = equipmentList.find((e) => e.id === packItem.equipmentId)!;
    const selectedVariant = options.variantSelections?.[packItem.equipmentId] || {};
    const targetSizeStr = selectedVariant.size || packItem.size;
    const targetColorStr = selectedVariant.color || packItem.color;

    let targetSize = eq.sizes?.find((s) => {
      if (!targetSizeStr) return true;
      return (s.size || '').toLowerCase() === targetSizeStr.toLowerCase();
    });
    if (!targetSize && eq.sizes?.length) targetSize = eq.sizes[0];

    let targetColor = targetSize?.colors?.find((c) => {
      if (!targetColorStr) return true;
      return (c.color || '').toLowerCase() === targetColorStr.toLowerCase();
    });
    if (!targetColor && targetSize?.colors?.length) targetColor = targetSize.colors[0];

    const requiredQty = Number(packItem.quantity) || 1;
    if (targetColor) {
      targetColor.quantity -= requiredQty;
    }
    eq.stock = getEquipmentTotalStock(eq);
    eq.updatedAt = now;

    // Record sale with the element's custom pack price
    const unitPrice = Number(packItem.packPrice) || 0;
    const totalPrice = unitPrice * requiredQty;
    const costTotal = (Number(packItem.costPrice) || Number(eq.costPrice) || 0) * requiredQty;
    const profit = totalPrice - costTotal;

    const sale: Sale = {
      id: `sale-pack-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      equipmentId: eq.id,
      equipmentName: `${eq.name} (Pack: ${pack.name})`,
      category: eq.category,
      brand: eq.brand,
      size: targetSize?.size,
      color: targetColor?.color,
      quantity: requiredQty,
      unitPrice,
      totalPrice,
      costPrice: Number(packItem.costPrice) || Number(eq.costPrice) || 0,
      profit,
      buyerName: options.buyerName || 'Client dojo',
      paymentMethod: options.paymentMethod || 'cash',
      date: now,
      notes: options.notes ? `[Pack: ${pack.name}] ${options.notes}` : `Vente du pack "${pack.name}"`,
    };

    createdSales.push(sale);
  }

  // Save all modified equipment and new sales
  await saveEquipmentList(equipmentList);
  const sales = await getSales();
  sales.unshift(...createdSales);
  await saveSalesList(sales);

  return { sales: createdSales, updatedEquipment: equipmentList };
}

