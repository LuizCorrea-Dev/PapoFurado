import * as admin from 'firebase-admin';
import firebaseConfig from '../firebase-applet-config.json';
import * as fs from 'fs';
import * as path from 'path';

if (!admin.apps.length) {
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  const serviceAccountFile = 'barbearia-papo-furado-33cd0-firebase-adminsdk-fbsvc-6173020548.json';
  const filePath = path.join(process.cwd(), serviceAccountFile);

  let cert: any = null;

  // 1. Try loading from file first if it exists
  if (fs.existsSync(filePath)) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      cert = JSON.parse(fileContent);
      console.log("Firebase Admin: Carregando credenciais do arquivo JSON.");
    } catch (e) {
      console.error("Erro ao ler arquivo de conta de serviço:", e);
    }
  } 
  
  // 2. Fallback to Environment Variable
  if (!cert && serviceAccountVar) {
    try {
      const cleanJson = serviceAccountVar.trim().replace(/^['"]|['"]$/g, '');
      cert = JSON.parse(cleanJson);
      console.log("Firebase Admin: Carregando credenciais da variável de ambiente.");
    } catch (e) {
      console.error("Erro ao processar FIREBASE_SERVICE_ACCOUNT da env:", e);
    }
  }

  if (cert) {
    try {
      // Garantir que a chave privada tenha quebras de linha reais
      if (cert.private_key && typeof cert.private_key === 'string') {
        cert.private_key = cert.private_key.replace(/\\n/g, '\n');
      }

      admin.initializeApp({
        credential: admin.credential.cert(cert),
        projectId: cert.project_id || firebaseConfig.projectId,
      });
      console.log("Firebase Admin inicializado com sucesso usando Conta de Serviço.");
    } catch (e) {
      console.error("Erro ao inicializar Firebase Admin com certificado:", e);
      admin.initializeApp({ projectId: firebaseConfig.projectId });
    }
  } else {
    // 3. Last resort: default initialization (might fail if permissions are restricted)
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
    console.warn("Firebase Admin: Inicializado sem conta de serviço explicitamente (permissões podem falhar).");
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
