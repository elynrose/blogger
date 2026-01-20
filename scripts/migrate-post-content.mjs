import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import admin from 'firebase-admin';

const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!serviceAccountPath) {
  console.error('Missing service account credentials.');
  console.error('Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS to a service account JSON path.');
  process.exit(1);
}

const resolvedPath = path.resolve(serviceAccountPath);

if (!fs.existsSync(resolvedPath)) {
  console.error(`Service account file not found: ${resolvedPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const toPlainText = (value) =>
  value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const buildExcerpt = (value, maxLength = 160) => {
  const plain = toPlainText(value || '');
  if (!plain) return '';
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).trimEnd()}...`;
};

const run = async () => {
  const postsSnapshot = await db.collection('posts').get();
  if (postsSnapshot.empty) {
    console.log('No posts found.');
    return;
  }

  let batch = db.batch();
  let operations = 0;

  const commitBatch = async () => {
    if (operations === 0) return;
    await batch.commit();
    batch = db.batch();
    operations = 0;
  };

  for (const docSnap of postsSnapshot.docs) {
    const data = docSnap.data();
    const content = data.content;
    const excerpt = data.excerpt || (content ? buildExcerpt(content) : '');

    if (!content && data.excerpt) {
      continue;
    }

    const postRef = docSnap.ref;
    const privateRef = postRef.collection('private').doc('content');

    if (content) {
      batch.set(
        privateRef,
        {
          content,
          migratedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      operations += 1;
    }

    batch.update(postRef, {
      excerpt,
      content: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    operations += 1;

    if (operations >= 450) {
      await commitBatch();
    }
  }

  await commitBatch();
  console.log('Post content migration completed.');
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed.', error);
    process.exit(1);
  });
