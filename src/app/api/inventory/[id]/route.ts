import { NextResponse } from 'next/server';
import { updateEquipment, deleteEquipment, getEquipment, getSales, getDeletions, computeInventoryStats } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    const updated = await updateEquipment(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Équipement non trouvé' }, { status: 404 });
    }

    const [equipment, sales, deletions] = await Promise.all([getEquipment(), getSales(), getDeletions()]);
    const stats = computeInventoryStats(equipment, sales, deletions);

    return NextResponse.json({ success: true, item: updated, stats });
  } catch (error) {
    console.error('API Inventory PUT error:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let reason = 'Suppression manuelle';
    try {
      const body = await request.json();
      if (body && body.reason) reason = body.reason;
    } catch {
      // Body is optional on DELETE
    }

    const result = await deleteEquipment(id, reason);
    if (!result.success) {
      return NextResponse.json({ success: false, error: 'Équipement non trouvé' }, { status: 404 });
    }

    const [equipment, sales, deletions] = await Promise.all([getEquipment(), getSales(), getDeletions()]);
    const stats = computeInventoryStats(equipment, sales, deletions);

    return NextResponse.json({ success: true, deletedLog: result.deletedLog, stats });
  } catch (error) {
    console.error('API Inventory DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
