import { NextResponse } from 'next/server';
import { getEquipment, getSales, saveEquipmentList, saveSalesList, computeInventoryStats } from '@/lib/db';

export async function GET() {
  try {
    const [equipment, sales] = await Promise.all([getEquipment(), getSales()]);
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      equipment,
      sales,
    };
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="kickboxing-inventory-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    console.error('API Backup GET error:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors de l’export' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!Array.isArray(data.equipment)) {
      return NextResponse.json({ success: false, error: 'Format JSON invalide: equipment manquant' }, { status: 400 });
    }

    await saveEquipmentList(data.equipment);
    if (Array.isArray(data.sales)) {
      await saveSalesList(data.sales);
    }

    const [equipment, sales] = await Promise.all([getEquipment(), getSales()]);
    const stats = computeInventoryStats(equipment, sales);

    return NextResponse.json({ success: true, equipment, sales, stats });
  } catch (error) {
    console.error('API Backup POST error:', error);
    return NextResponse.json({ success: false, error: 'Erreur lors de l’importation' }, { status: 500 });
  }
}
