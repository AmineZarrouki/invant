import { NextResponse } from 'next/server';
import { getSales, recordSale, getEquipment, computeInventoryStats } from '@/lib/db';

export async function GET() {
  try {
    const sales = await getSales();
    return NextResponse.json({ success: true, sales });
  } catch (error) {
    console.error('API Sales GET error:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors du chargement des ventes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { equipmentId, quantity, unitPrice, buyerName, paymentMethod, notes } = body;

    if (!equipmentId || !quantity || quantity <= 0) {
      return NextResponse.json({ success: false, error: 'Informations de vente incomplètes' }, { status: 400 });
    }

    const result = await recordSale({
      equipmentId,
      quantity: Number(quantity),
      unitPrice: unitPrice !== undefined ? Number(unitPrice) : undefined,
      buyerName,
      paymentMethod,
      notes,
    });

    const [equipment, sales] = await Promise.all([getEquipment(), getSales()]);
    const stats = computeInventoryStats(equipment, sales);

    return NextResponse.json({
      success: true,
      sale: result.sale,
      updatedEquipment: result.updatedEquipment,
      stats,
    });
  } catch (error: any) {
    console.error('API Sales POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de l’enregistrement de la vente' },
      { status: 400 }
    );
  }
}
