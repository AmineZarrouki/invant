import { NextResponse } from 'next/server';
import { updatePack, deletePack, getPacks } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await updatePack(id, {
      ...(body.name ? { name: body.name.trim() } : {}),
      ...(body.description !== undefined ? { description: body.description.trim() } : {}),
      ...(body.items
        ? {
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
          }
        : {}),
      ...(body.barcode !== undefined ? { barcode: body.barcode.trim() } : {}),
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Pack non trouvé' }, { status: 404 });
    }

    const packs = await getPacks();
    return NextResponse.json({ success: true, pack: updated, packs });
  } catch (error: any) {
    console.error('API Packs PUT error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la mise à jour du pack' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deletePack(id);

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Pack non trouvé' }, { status: 404 });
    }

    const packs = await getPacks();
    return NextResponse.json({ success: true, packs });
  } catch (error: any) {
    console.error('API Packs DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la suppression du pack' },
      { status: 500 }
    );
  }
}
