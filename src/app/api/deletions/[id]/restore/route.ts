import { NextResponse } from 'next/server';
import { restoreDeletedEquipment, getEquipment, getSales, getDeletions, computeInventoryStats } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const restored = await restoreDeletedEquipment(id);
    if (!restored) {
      return NextResponse.json({ success: false, error: 'Enregistrement de suppression non trouvé' }, { status: 404 });
    }

    const [equipment, sales, deletions] = await Promise.all([getEquipment(), getSales(), getDeletions()]);
    const stats = computeInventoryStats(equipment, sales, deletions);

    return NextResponse.json({
      success: true,
      item: restored,
      stats,
      deletions,
    });
  } catch (error) {
    console.error('API Restore error:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors de la restauration du matériel' }, { status: 500 });
  }
}
