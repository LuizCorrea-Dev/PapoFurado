import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || 'image/jpeg';
    
    try {
      // Tentar salvar localmente (funciona no ambiente local de desenvolvimento)
      const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);
      
      const url = `/uploads/${filename}`;
      return NextResponse.json({ url });
    } catch (fsError) {
      console.warn('Erro ao salvar no sistema de arquivos local (provável ambiente Serverless/Vercel). Convertendo para Base64:', fsError);
      
      // Fallback para Base64 em ambientes Serverless Read-Only (como Vercel)
      const base64Data = buffer.toString('base64');
      const url = `data:${mimeType};base64,${base64Data}`;
      return NextResponse.json({ url });
    }
  } catch (error) {
    console.error('Erro geral no upload:', error);
    return NextResponse.json({ error: 'Erro ao processar upload' }, { status: 500 });
  }
}
