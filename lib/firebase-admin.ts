import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

if (!admin.apps.length) {
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  const privateKeyVar = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmailVar = process.env.FIREBASE_CLIENT_EMAIL;
  
  const serviceAccountFile = 'barbearia-papo-furado-33cd0-firebase-adminsdk-fbsvc-6173020548.json';
  const filePath = path.join(process.cwd(), serviceAccountFile);

  let cert: any = null;

  // 1. Try loading from individual env variables first (safest for Vercel)
  if (privateKeyVar && clientEmailVar) {
    cert = {
      project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      client_email: clientEmailVar,
      private_key: privateKeyVar,
    };
    console.log("Firebase Admin: Carregando credenciais das variáveis FIREBASE_PRIVATE_KEY e FIREBASE_CLIENT_EMAIL.");
  }
  // 2. Try loading from file if it exists
  else if (fs.existsSync(filePath)) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      cert = JSON.parse(fileContent);
      console.log("Firebase Admin: Carregando credenciais do arquivo JSON.");
    } catch (e) {
      console.error("Erro ao ler arquivo de conta de serviço:", e);
    }
  } 
  // 3. Fallback to FIREBASE_SERVICE_ACCOUNT Environment Variable
  else if (serviceAccountVar) {
    try {
      const cleanJson = serviceAccountVar.trim().replace(/^['"]|['"]$/g, '');
      cert = JSON.parse(cleanJson);
      console.log("Firebase Admin: Carregando credenciais da variável FIREBASE_SERVICE_ACCOUNT.");
    } catch (e) {
      console.error("Erro ao processar FIREBASE_SERVICE_ACCOUNT da env:", e);
    }
  }

  if (cert) {
    try {
      // Garantir que a chave privada tenha quebras de linha reais
      if (cert.private_key && typeof cert.private_key === 'string') {
        // Remove aspas excedentes e converte quebras de linha literais (\n) para quebras reais
        cert.private_key = cert.private_key.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
      }

      admin.initializeApp({
        credential: admin.credential.cert(cert),
        projectId: cert.project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      console.log("Firebase Admin inicializado com sucesso usando Conta de Serviço.");
    } catch (e) {
      console.error("Erro ao inicializar Firebase Admin com certificado:", e);
      admin.initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
    }
  } else {
    // 4. Last resort: default initialization
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
    console.warn("Firebase Admin: Inicializado sem conta de serviço explicitamente (permissões podem falhar).");
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
