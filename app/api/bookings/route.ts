import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get('date');

  try {
    let query: any = db.collection('agendamentos');
    
    if (dateStr) {
      query = query.where('date', '==', dateStr);
    }
    
    const snapshot = await query.get();
    let bookings = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data() as any
    }));

    // Sort in memory to avoid index requirement
    bookings.sort((a: any, b: any) => (a.time || '').localeCompare(b.time || ''));
    
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('API Bookings GET Error:', error);
    // Return empty array on error to prevent client-side crashes
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, service, professional, date, time } = body;

    const id = uuidv4();
    const createdAt = new Date().toISOString();

    await db.collection('agendamentos').doc(id).set({
      name: name || 'Cliente',
      phone: phone || '',
      service: service || '',
      professional: professional || '',
      date: date || '',
      time: time || '',
      status: 'pendente',
      createdAt
    });

    return NextResponse.json({ id, success: true });
  } catch (error) {
    console.error('API Bookings POST Error:', error);
    return NextResponse.json({ error: 'Erro ao criar agendamento' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'ID necessário' }, { status: 400 });

    // Remove undefined fields
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
    }

    await db.collection('agendamentos').doc(id).update(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Bookings PUT Error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar agendamento' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID necessário' }, { status: 400 });

    await db.collection('agendamentos').doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Bookings DELETE Error:', error);
    return NextResponse.json({ error: 'Erro ao excluir agendamento' }, { status: 500 });
  }
}
