import { NextResponse } from 'next/server';
import { getStorageStatus, getEquipment, saveEquipmentList, getSales, saveSalesList } from '@/lib/db';
import { UpstashRedisAdapter, setRuntimeCloudCredentials, getStorageAdapter } from '@/lib/storage';

export async function GET() {
  try {
    const status = getStorageStatus();
    const isLockedByEnv = Boolean(
      process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
    );
    return NextResponse.json({ success: true, ...status, isLockedByEnv });
  } catch (error) {
    console.error('API storage-status GET error:', error);
    return NextResponse.json({ success: false, error: 'Erreur statut stockage' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, url, token } = body;

    const isLockedByEnv = Boolean(
      process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
    );

    if (isLockedByEnv && (action === 'save' || action === 'disconnect')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Action protégée : La base Cloud est verrouillée par les variables d’environnement Vercel.',
        },
        { status: 403 }
      );
    }

    if (action === 'test') {
      if (!url || !token) {
        return NextResponse.json(
          { success: false, error: 'Veuillez renseigner l’URL et le Token Upstash' },
          { status: 400 }
        );
      }
      const adapter = new UpstashRedisAdapter(url, token);
      const isOnline = await adapter.ping();
      if (!isOnline) {
        return NextResponse.json(
          {
            success: false,
            error: 'Impossible de joindre la base Upstash. Vérifiez l’URL et le Token.',
          },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        message: '🟢 Connexion Upstash Cloud validée avec succès !',
      });
    }

    if (action === 'save') {
      if (!url || !token) {
        return NextResponse.json(
          { success: false, error: 'Veuillez renseigner l’URL et le Token Upstash' },
          { status: 400 }
        );
      }

      const tempAdapter = new UpstashRedisAdapter(url, token);
      const isOnline = await tempAdapter.ping();
      if (!isOnline) {
        return NextResponse.json(
          {
            success: false,
            error: 'Test de connexion échoué. Vérifiez vos identifiants Upstash.',
          },
          { status: 400 }
        );
      }

      // Check if remote cloud is empty. If empty, seed with current inventory
      const existingRemoteInv = await tempAdapter.get('inventory');
      if (!existingRemoteInv || !Array.isArray(existingRemoteInv) || existingRemoteInv.length === 0) {
        const localEquipment = await getEquipment();
        await tempAdapter.set('inventory', localEquipment);
        const localSales = await getSales();
        await tempAdapter.set('sales', localSales);
      }

      await setRuntimeCloudCredentials({ url, token });
      const currentStatus = getStorageStatus();

      return NextResponse.json({
        success: true,
        message: '🚀 Base Cloud Upstash activée et synchronisée avec succès !',
        ...currentStatus,
      });
    }

    if (action === 'disconnect') {
      await setRuntimeCloudCredentials(null);
      const currentStatus = getStorageStatus();
      return NextResponse.json({
        success: true,
        message: 'Base Cloud déconnectée. Retour au stockage local.',
        ...currentStatus,
      });
    }

    return NextResponse.json({ success: false, error: 'Action non reconnue' }, { status: 400 });
  } catch (error: any) {
    console.error('API storage-status POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la configuration Cloud' },
      { status: 500 }
    );
  }
}
