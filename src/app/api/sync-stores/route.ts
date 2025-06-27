// src/app/api/sync-stores/route.ts
import { NextResponse } from 'next/server';
import { syncStoresWithApi } from '@/lib/data/stores';

export async function POST() {
  try {
    await syncStoresWithApi();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Error al sincronizar tiendas:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
