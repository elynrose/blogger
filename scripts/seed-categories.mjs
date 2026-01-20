import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import admin from 'firebase-admin';

const categories = [
  {
    name: 'Productivity',
    description: 'Tools and workflows that help teams move faster and stay focused.',
  },
  {
    name: 'Art',
    description: 'Creative tools for design, illustration, and visual storytelling.',
  },
  {
    name: 'Games',
    description: 'Game development, AI NPCs, and immersive gameplay tooling.',
  },
  {
    name: 'Coding',
    description: 'Developer tools, code assistants, and software engineering trends.',
  },
  {
    name: 'Communication',
    description: 'Messaging, collaboration, and customer engagement platforms.',
  },
  {
    name: 'Marketing',
    description: 'Growth, analytics, and campaign automation for modern teams.',
  },
  {
    name: 'Finance',
    description: 'Billing, budgeting, and financial operations for SaaS teams.',
  },
  {
    name: 'Education',
    description: 'Learning platforms, tutoring tools, and training workflows.',
  },
  {
    name: 'Health',
    description: 'Wellness, health tech, and patient engagement solutions.',
  },
  {
    name: 'Operations',
    description: 'Back-office automation and operational excellence tools.',
  },
];

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
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const run = async () => {
  const batch = db.batch();
  const now = admin.firestore.FieldValue.serverTimestamp();

  categories.forEach((category) => {
    const docId = slugify(category.name);
    const docRef = db.collection('categories').doc(docId);
    batch.set(
      docRef,
      {
        id: docId,
        name: category.name,
        description: category.description,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
  });

  await batch.commit();
  console.log(`Seeded ${categories.length} categories.`);
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to seed categories.', error);
    process.exit(1);
  });
