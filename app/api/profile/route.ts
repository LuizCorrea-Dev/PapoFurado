import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
  }

  try {
    const snapshot = await db.collection('usuarios').where('email', '==', email).limit(1).get();
    
    if (snapshot.empty) {
      // Create profile if it doesn't exist
      const id = uuidv4();
      const newUser = {
        email,
        name: email.split('@')[0],
        phone: '',
        photoUrl: '',
        role: email === 'barbeariapapofurado@gmail.com' ? 'admin' : 'client',
        isFavorite: false,
        isPremium: false,
        isVIP: false,
        createdAt: new Date().toISOString()
      };
      await db.collection('usuarios').doc(id).set(newUser);
      return NextResponse.json({ id, ...newUser });
    }

    const userData = snapshot.docs[0].data();
    return NextResponse.json({ id: snapshot.docs[0].id, ...userData });
  } catch (error) {
    console.error('Errro ao buscar perfil:', error);
    return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, name, phone, email, photoUrl } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
    updateData.updatedAt = new Date().toISOString();

    await db.collection('usuarios').doc(id).update(updateData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
  }

  try {
    // Delete user profile
    await db.collection('usuarios').doc(id).delete();
    // Potencialmente excluir agendamentos também? O usuário pediu deletar perfil
    // Para ser seguro, mantemos os agendamentos ou limpamos as referências se necessário
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir perfil:', error);
    return NextResponse.json({ error: 'Erro ao excluir perfil' }, { status: 500 });
  }
}
