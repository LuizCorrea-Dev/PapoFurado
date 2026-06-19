import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const snapshot = await db.collection('bloqueios').get();
    const blocks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return NextResponse.json(blocks);
  } catch (error) {
    console.error('API Blocks GET Error:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, reason, barberId, startTime, endTime, type } = body;
    const id = uuidv4();

    await db.collection('bloqueios').doc(id).set({
      date,
      reason: reason || '',
      barberId: barberId || 'all',
      startTime: startTime || '',
      endTime: endTime || '',
      type: type || 'indisponivel',
      createdAt: new Date().toISOString()
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Blocks POST Error:', error);
    return NextResponse.json({ error: 'Erro ao criar bloqueio' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, date, reason, barberId, startTime, endTime, type } = body;
    
    if (!id) return NextResponse.json({ error: 'ID necessário para atualização' }, { status: 400 });

    const updateData: any = {};
    if (date !== undefined) updateData.date = date;
    if (reason !== undefined) updateData.reason = reason;
    if (barberId !== undefined) updateData.barberId = barberId;
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (type !== undefined) updateData.type = type;
    updateData.updatedAt = new Date().toISOString();

    await db.collection('bloqueios').doc(id).update(updateData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Blocks PUT Error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar bloqueio' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID necessário' }, { status: 400 });

    await db.collection('bloqueios').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Blocks DELETE Error:', error);
    return NextResponse.json({ error: 'Erro ao excluir bloqueio' }, { status: 500 });
  }
}
