import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

const requireAdmin = async (request: Request) => {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return { error: 'Unauthorized', status: 401 };
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
    const role = userSnap.data()?.role;
    if (role !== 'admin') {
      return { error: 'Forbidden', status: 403 };
    }

    return { uid: decoded.uid };
  } catch (error: any) {
    return { error: 'Unauthorized', status: 401, detail: error?.message || 'Invalid token' };
  }
};

const buildTop = (postMap: Map<string, string>, map: Map<string, number>) =>
  Array.from(map.entries())
    .map(([postId, count]) => ({
      postId,
      title: postMap.get(postId) || 'Unknown post',
      count,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

export async function GET(request: Request) {
  try {
    const authResult = await requireAdmin(request);
    if ('error' in authResult) {
      const payload = { error: authResult.error } as { error: string; detail?: string };
      if (process.env.NODE_ENV !== 'production' && 'detail' in authResult) {
        payload.detail = authResult.detail as string;
      }
      return NextResponse.json(payload, { status: authResult.status });
    }

    const postsSnap = await adminDb.collection('posts').get();
    const postMap = new Map<string, string>();
    postsSnap.forEach((docSnap) => {
      postMap.set(docSnap.id, docSnap.data()?.title || 'Untitled post');
    });

    const viewSnap = await adminDb.collection('post_views').get();
    const viewMap = new Map<string, number>();
    viewSnap.forEach((docSnap) => {
      viewMap.set(docSnap.id, Number(docSnap.data()?.totalViews || 0));
    });

    const likeSnap = await adminDb.collectionGroup('likes').get();
    const likeMap = new Map<string, number>();
    likeSnap.forEach((docSnap) => {
      const pathParts = docSnap.ref.path.split('/');
      const postId = pathParts[1];
      likeMap.set(postId, (likeMap.get(postId) ?? 0) + 1);
    });

    const commentSnap = await adminDb.collectionGroup('comments').get();
    const commentMap = new Map<string, number>();
    commentSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const postId = data.postId || docSnap.ref.path.split('/')[1];
      commentMap.set(postId, (commentMap.get(postId) ?? 0) + 1);
    });

    return NextResponse.json({
      topLiked: buildTop(postMap, likeMap),
      topCommented: buildTop(postMap, commentMap),
      topViewed: buildTop(postMap, viewMap),
    });
  } catch (error: any) {
    console.error('Admin post stats GET failed', error);
    const payload = { error: 'Failed to load stats' } as { error: string; detail?: string };
    if (process.env.NODE_ENV !== 'production') {
      payload.detail = error?.message || 'Unknown error';
    }
    return NextResponse.json(payload, { status: 500 });
  }
}
