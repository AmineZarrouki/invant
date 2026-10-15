import { NextResponse } from 'next/server';
import { refundSale, getEquipment, getSales, computeInventoryStats } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await refundSale(id);

    const [equipment, sales] = await Promise.all([getEquipment(), getSales()]);
    const stats = computeInventoryStats(equipment, sales);

    return NextResponse.json({
      success: true,
      refundedSale: result.refundedSale,
      stats,
    });
  } catch (error: any) {
    console.error('API Sales DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de l’annulation de la vente' },
      { status: 400 }
    );
  }
}
