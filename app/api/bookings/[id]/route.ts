import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { date, time, service, professional } = body;

    const updateData: any = {};
    if (date) updateData.date = date;
    if (time) updateData.time = time;
    if (service) updateData.service = service;
    if (professional) updateData.professional = professional;
    updateData.updatedAt = new Date().toISOString();

    await db.collection('agendamentos').doc(id).update(updateData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    return NextResponse.json({ error: 'Erro ao atualizar agendamento' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.collection('agendamentos').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir agendamento:', error);
    return NextResponse.json({ error: 'Erro ao excluir agendamento' }, { status: 500 });
  }
}
