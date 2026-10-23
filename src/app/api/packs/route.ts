import { NextResponse } from 'next/server';
import { getPacks, addPack } from '@/lib/db';

export async function GET() {
  try {
    const packs = await getPacks();
    return NextResponse.json({ success: true, packs });
  } catch (error: any) {
    console.error('API Packs GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du chargement des packs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Le pack doit contenir un nom et au moins un article' },
        { status: 400 }
      );
    }

    const newPack = await addPack({
      name: body.name.trim(),
      description: body.description ? body.description.trim() : undefined,
      items: body.items.map((it: any) => ({
        equipmentId: it.equipmentId,
        equipmentName: it.equipmentName,
        category: it.category,
        brand: it.brand || '',
        model: it.model || '',
        size: it.size || undefined,
        color: it.color || undefined,
        quantity: Math.max(1, Number(it.quantity) || 1),
        originalPrice: Number(it.originalPrice) || 0,
        packPrice: Number(it.packPrice) !== undefined ? Number(it.packPrice) : Number(it.originalPrice) || 0,
        costPrice: Number(it.costPrice) || 0,
      })),
      totalOriginalPrice: 0,
      totalPackPrice: 0,
      discountAmount: 0,
      discountPercentage: 0,
      barcode: body.barcode ? body.barcode.trim() : undefined,
    });

    const packs = await getPacks();
    return NextResponse.json({ success: true, pack: newPack, packs });
  } catch (error: any) {
    console.error('API Packs POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la création du pack' },
      { status: 400 }
    );
  }
}
