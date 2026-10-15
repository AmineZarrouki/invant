import { NextResponse } from 'next/server';
import { resetDatabase, computeInventoryStats } from '@/lib/db';

export async function POST() {
  try {
    const { equipment, sales, deletions } = await resetDatabase();
    const stats = computeInventoryStats(equipment, sales, deletions);
    return NextResponse.json({ success: true, equipment, sales, deletions, stats });
  } catch (error) {
    console.error('API Reset error:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors de la réinitialisation' }, { status: 500 });
  }
}
