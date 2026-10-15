import { NextResponse } from 'next/server';
import { getDeletions } from '@/lib/db';

export async function GET() {
  try {
    const deletions = await getDeletions();
    return NextResponse.json({ success: true, deletions });
  } catch (error) {
    console.error('API Deletions GET error:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors du chargement de l’historique des suppressions' }, { status: 500 });
  }
}
