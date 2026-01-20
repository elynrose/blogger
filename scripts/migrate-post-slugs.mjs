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

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

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
    const title = data.title || '';
    const existingSlug = data.slug;
    const slug = slugify(title);

    if (!title || existingSlug === slug) {
      continue;
    }

    batch.update(docSnap.ref, {
      slug,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    operations += 1;

    if (operations >= 450) {
      await commitBatch();
    }
  }

  await commitBatch();
  console.log('Post slug migration completed.');
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed.', error);
    process.exit(1);
  });
