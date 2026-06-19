import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { BARBERS } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const snapshot = await db.collection('profissionais').get();
    
    // Se a coleção estiver vazia, popula inicialmente com os valores padrão de constants.ts
    if (snapshot.empty) {
      console.log("A coleção 'profissionais' está vazia. Populando com dados padrão.");
      const batch = db.batch();
      
      for (const barber of BARBERS) {
        const docRef = db.collection('profissionais').doc(barber.id);
        const data = {
          id: barber.id,
          name: barber.name,
          role: barber.specialty || 'Barbeiro',
          specialty: barber.specialty || 'Barbeiro' // Mapear ambos para retrocompatibilidade
        };
        batch.set(docRef, data);
      }
      
      await batch.commit();
      
      // Retorna com o mapeamento
      const formattedDefault = BARBERS.map(b => ({
        id: b.id,
        name: b.name,
        role: b.specialty || 'Barbeiro',
        specialty: b.specialty || 'Barbeiro'
      }));
      return NextResponse.json(formattedDefault);
    }
    
    const barbers = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        role: data.role || data.specialty || 'Barbeiro',
        specialty: data.specialty || data.role || 'Barbeiro'
      };
    });
    
    return NextResponse.json(barbers);
  } catch (error) {
    console.error('Erro na API /api/barbers GET:', error);
    return NextResponse.json({ error: 'Erro ao buscar profissionais' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, role } = body;
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Nome do profissional é obrigatório' }, { status: 400 });
    }
    
    if (!role || typeof role !== 'string' || role.trim() === '') {
      return NextResponse.json({ error: 'Função/Especialidade é obrigatória' }, { status: 400 });
    }
    
    const id = body.id || uuidv4();
    
    const newBarber = {
      id,
      name: name.trim(),
      role: role.trim(),
      specialty: role.trim() // Salva ambos para compatibilidade
    };
    
    await db.collection('profissionais').doc(id).set(newBarber);
    
    return NextResponse.json({ success: true, id, barber: newBarber });
  } catch (error) {
    console.error('Erro na API /api/barbers POST:', error);
    return NextResponse.json({ error: 'Erro ao criar profissional' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, role } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID do profissional é obrigatório' }, { status: 400 });
    }
    
    const updates: any = {};
    
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json({ error: 'Nome do profissional é inválido' }, { status: 400 });
      }
      updates.name = name.trim();
    }
    
    if (role !== undefined) {
      if (typeof role !== 'string' || role.trim() === '') {
        return NextResponse.json({ error: 'Função do profissional é inválida' }, { status: 400 });
      }
      updates.role = role.trim();
      updates.specialty = role.trim(); // Atualiza ambos
    }
    
    await db.collection('profissionais').doc(id).update(updates);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro na API /api/barbers PUT:', error);
    return NextResponse.json({ error: 'Erro ao atualizar profissional' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID do profissional é obrigatório' }, { status: 400 });
    }
    
    await db.collection('profissionais').doc(id).delete();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro na API /api/barbers DELETE:', error);
    return NextResponse.json({ error: 'Erro ao excluir profissional' }, { status: 500 });
  }
}
