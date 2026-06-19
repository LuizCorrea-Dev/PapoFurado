import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const snapshot = await db.collection('usuarios').get();
    const customers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return NextResponse.json(customers);
  } catch (error) {
    console.error('API Customers GET Error:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isFavorite, isVIP, isPremium } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    const updateData: any = {};
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
    if (isVIP !== undefined) updateData.isVIP = isVIP;
    if (isPremium !== undefined) updateData.isPremium = isPremium;
    updateData.updatedAt = new Date().toISOString();

    await db.collection('usuarios').doc(id).update(updateData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Customers PATCH Error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar tags do cliente' }, { status: 500 });
  }
}
