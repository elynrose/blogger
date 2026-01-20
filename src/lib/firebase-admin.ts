import fs from 'node:fs';
import path from 'node:path';
import admin from 'firebase-admin';

const getServiceAccount = () => {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    return JSON.parse(json);
  }

  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (filePath) {
    const resolvedPath = path.resolve(filePath);
    const fileContents = fs.readFileSync(resolvedPath, 'utf8');
    return JSON.parse(fileContents);
  }

  return null;
};

if (!admin.apps.length) {
  const serviceAccount = getServiceAccount();
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export { admin };
