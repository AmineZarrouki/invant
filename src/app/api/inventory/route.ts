import { NextResponse } from 'next/server';
import { getEquipment, addEquipment, getSales, getDeletions, computeInventoryStats } from '@/lib/db';

export async function GET() {
  try {
    const [equipment, sales, deletions] = await Promise.all([getEquipment(), getSales(), getDeletions()]);
    const stats = computeInventoryStats(equipment, sales, deletions);
    return NextResponse.json({ success: true, equipment, stats });
  } catch (error) {
    console.error('API Inventory GET error:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors du chargement de l’inventaire' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.category || body.stock === undefined) {
      return NextResponse.json({ success: false, error: 'Champs requis manquants' }, { status: 400 });
    }

    const newItem = await addEquipment({
      name: body.name,
      category: body.category,
      brand: body.brand || 'Générique',
      model: body.model || '',
      size: body.size || 'Unique',
      color: body.color || 'Standard',
      stock: Number(body.stock) || 0,
      minStockAlert: Number(body.minStockAlert) || 3,
      costPrice: Number(body.costPrice) || 0,
      sellingPrice: Number(body.sellingPrice) || 0,
      barcode: body.barcode || '',
      description: body.description || '',
    });

    const [equipment, sales, deletions] = await Promise.all([getEquipment(), getSales(), getDeletions()]);
    const stats = computeInventoryStats(equipment, sales, deletions);

    return NextResponse.json({ success: true, item: newItem, stats });
  } catch (error) {
    console.error('API Inventory POST error:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors de l’ajout de l’équipement' }, { status: 500 });
  }
}
