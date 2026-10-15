import { NextResponse } from 'next/server';
import { adjustEquipmentStock, getEquipment, getSales, computeInventoryStats } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const delta = Number(body.delta);

    if (isNaN(delta)) {
      return NextResponse.json({ success: false, error: 'Delta invalide' }, { status: 400 });
    }

    const updated = await adjustEquipmentStock(id, delta);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Équipement non trouvé' }, { status: 404 });
    }

    const [equipment, sales] = await Promise.all([getEquipment(), getSales()]);
    const stats = computeInventoryStats(equipment, sales);

    return NextResponse.json({ success: true, item: updated, stats });
  } catch (error) {
    console.error('API Stock Adjust error:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors de l’ajustement de stock' }, { status: 500 });
  }
}
