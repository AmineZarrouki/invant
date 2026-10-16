import { NextResponse } from 'next/server';
import { getStorageStatus } from '@/lib/db';

export async function GET() {
  try {
    const status = getStorageStatus();
    return NextResponse.json({ success: true, ...status });
  } catch (error) {
    console.error('API storage-status error:', error);
    return NextResponse.json({ success: false, error: 'Erreur statut stockage' }, { status: 500 });
  }
}
