import { NextResponse } from 'next/server';
import { getEquipment, addEquipment, getSales, getDeletions, computeInventoryStats, getStorageStatus } from '@/lib/db';

export async function GET() {
  try {
    const [equipment, sales, deletions] = await Promise.all([getEquipment(), getSales(), getDeletions()]);
    const stats = computeInventoryStats(equipment, sales, deletions);
    const storageStatus = getStorageStatus();
    return NextResponse.json({
      success: true,
      equipment,
      sales,
      deletions,
      stats,
      isCloud: storageStatus.isCloud,
      provider: storageStatus.provider,
    });
  } catch (error) {
    console.error('API Inventory GET error:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors du chargement de l’inventaire' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.category) {
      return NextResponse.json({ success: false, error: 'Champs requis manquants (nom, catégorie)' }, { status: 400 });
    }

    let sizes = body.sizes;
    if (!sizes || !Array.isArray(sizes) || sizes.length === 0) {
      // Fallback for legacy format or quick entry
      const fallbackColor = body.color || 'Standard';
      const fallbackQty = Number(body.stock) || 0;
      if (body.size) {
        sizes = [{ size: body.size, colors: [{ color: fallbackColor, quantity: fallbackQty }] }];
      } else {
        sizes = [{ colors: [{ color: fallbackColor, quantity: fallbackQty }] }];
      }
    }

    const newItem = await addEquipment({
      name: body.name.trim(),
      category: body.category,
      brand: (body.brand || 'Générique').trim(),
      model: body.model ? body.model.trim() : '',
      sizes,
      minStockAlert: Number(body.minStockAlert) || 3,
      costPrice: Number(body.costPrice) || 0,
      sellingPrice: Number(body.sellingPrice) || 0,
      barcode: body.barcode ? body.barcode.trim() : '',
      description: body.description ? body.description.trim() : '',
    });

    const [equipment, sales, deletions] = await Promise.all([getEquipment(), getSales(), getDeletions()]);
    const stats = computeInventoryStats(equipment, sales, deletions);

    return NextResponse.json({ success: true, item: newItem, stats });
  } catch (error) {
    console.error('API Inventory POST error:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors de l’ajout de l’équipement' }, { status: 500 });
  }
}
