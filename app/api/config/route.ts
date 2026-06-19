import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { LANDING_PAGE_DEFAULTS } from '@/lib/landing-page-defaults';

export async function GET() {
  try {
    const doc = await db.collection('landing_page_config').doc('default').get();
    
    if (!doc.exists) {
      // If none exists, return defaults
      return NextResponse.json(LANDING_PAGE_DEFAULTS);
    }
    
    return NextResponse.json(doc.data());
  } catch (error) {
    console.error('API Config GET Error:', error);
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await db.collection('landing_page_config').doc('default').set(body, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Config POST Error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar configurações' }, { status: 500 });
  }
}
