import { NextResponse } from 'next/server';
import { recordPackSale, getEquipment, getSales, getPacks, computeInventoryStats } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { buyerName, paymentMethod, notes, variantSelections } = body;

    const result = await recordPackSale(id, {
      buyerName,
      paymentMethod,
      notes,
      variantSelections,
    });

    const [equipment, sales, deletions, packs] = await Promise.all([
      getEquipment(),
      getSales(),
      Promise.resolve([]),
      getPacks(),
    ]);
    const stats = computeInventoryStats(equipment, sales, deletions);

    return NextResponse.json({
      success: true,
      sales: result.sales,
      updatedEquipment: result.updatedEquipment,
      equipment,
      packs,
      stats,
    });
  } catch (error: any) {
    console.error('API Packs SELL error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la vente du pack' },
      { status: 400 }
    );
  }
}
