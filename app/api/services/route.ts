import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { SERVICES } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const snapshot = await db.collection('servicos').get();
    
    // Se a coleção estiver vazia, popula inicialmente com os valores padrão de constants.ts
    if (snapshot.empty) {
      console.log("A coleção 'servicos' está vazia. Populando com dados padrão.");
      const batch = db.batch();
      
      for (const service of SERVICES) {
        const docRef = db.collection('servicos').doc(service.id);
        batch.set(docRef, service);
      }
      
      await batch.commit();
      return NextResponse.json(SERVICES);
    }
    
    const services = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json(services);
  } catch (error) {
    console.error('Erro na API /api/services GET:', error);
    return NextResponse.json({ error: 'Erro ao buscar serviços' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, duration, price, description } = body;
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Nome do serviço é obrigatório' }, { status: 400 });
    }
    
    const numDuration = Number(duration);
    if (isNaN(numDuration) || numDuration <= 0 || numDuration % 15 !== 0) {
      return NextResponse.json({ error: 'O tempo estimado deve ser um múltiplo de 15 minutos' }, { status: 400 });
    }
    
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return NextResponse.json({ error: 'O preço deve ser um valor válido' }, { status: 400 });
    }
    
    const id = body.id || uuidv4();
    
    const newService = {
      id,
      name: name.trim(),
      duration: numDuration,
      price: numPrice,
      description: description ? String(description).trim() : ''
    };
    
    await db.collection('servicos').doc(id).set(newService);
    
    return NextResponse.json({ success: true, id, service: newService });
  } catch (error) {
    console.error('Erro na API /api/services POST:', error);
    return NextResponse.json({ error: 'Erro ao criar serviço' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, duration, price, description } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID do serviço é obrigatório' }, { status: 400 });
    }
    
    const updates: any = {};
    
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json({ error: 'Nome do serviço é inválido' }, { status: 400 });
      }
      updates.name = name.trim();
    }
    
    if (duration !== undefined) {
      const numDuration = Number(duration);
      if (isNaN(numDuration) || numDuration <= 0 || numDuration % 15 !== 0) {
        return NextResponse.json({ error: 'O tempo estimado deve ser um múltiplo de 15 minutos' }, { status: 400 });
      }
      updates.duration = numDuration;
    }
    
    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return NextResponse.json({ error: 'O preço deve ser um valor válido' }, { status: 400 });
      }
      updates.price = numPrice;
    }
    
    if (description !== undefined) {
      updates.description = String(description).trim();
    }
    
    await db.collection('servicos').doc(id).update(updates);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro na API /api/services PUT:', error);
    return NextResponse.json({ error: 'Erro ao atualizar serviço' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID do serviço é obrigatório' }, { status: 400 });
    }
    
    await db.collection('servicos').doc(id).delete();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro na API /api/services DELETE:', error);
    return NextResponse.json({ error: 'Erro ao excluir serviço' }, { status: 500 });
  }
}
