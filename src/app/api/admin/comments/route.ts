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

    const snapshot = await adminDb
      .collectionGroup('comments')
      .limit(200)
      .get();

    const comments = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        postId: data.postId,
        postTitle: data.postTitle,
        userId: data.userId,
        userName: data.userName,
        body: data.body,
        status: data.status,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
      };
    });

    comments.sort((a, b) => {
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ comments });
  } catch (error: any) {
    console.error('Admin comments GET failed', error);
    const payload = { error: 'Failed to load comments' } as { error: string; detail?: string };
    if (process.env.NODE_ENV !== 'production') {
      payload.detail = error?.message || 'Unknown error';
    }
    return NextResponse.json(payload, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await requireAdmin(request);
    if ('error' in authResult) {
      const payload = { error: authResult.error } as { error: string; detail?: string };
      if (process.env.NODE_ENV !== 'production' && 'detail' in authResult) {
        payload.detail = authResult.detail as string;
      }
      return NextResponse.json(payload, { status: authResult.status });
    }

    const { postId, commentId } = await request.json();
    if (!postId || !commentId) {
      return NextResponse.json({ error: 'Missing postId or commentId' }, { status: 400 });
    }

    await adminDb.collection('posts').doc(postId).collection('comments').doc(commentId).delete();
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Admin comments DELETE failed', error);
    const payload = { error: 'Failed to delete comment' } as { error: string; detail?: string };
    if (process.env.NODE_ENV !== 'production') {
      payload.detail = error?.message || 'Unknown error';
    }
    return NextResponse.json(payload, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authResult = await requireAdmin(request);
    if ('error' in authResult) {
      const payload = { error: authResult.error } as { error: string; detail?: string };
      if (process.env.NODE_ENV !== 'production' && 'detail' in authResult) {
        payload.detail = authResult.detail as string;
      }
      return NextResponse.json(payload, { status: authResult.status });
    }

    const { postId, commentId, status } = await request.json();
    if (!postId || !commentId || !status) {
      return NextResponse.json({ error: 'Missing postId, commentId, or status' }, { status: 400 });
    }
    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await adminDb.collection('posts').doc(postId).collection('comments').doc(commentId).update({ status });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Admin comments PATCH failed', error);
    const payload = { error: 'Failed to update comment' } as { error: string; detail?: string };
    if (process.env.NODE_ENV !== 'production') {
      payload.detail = error?.message || 'Unknown error';
    }
    return NextResponse.json(payload, { status: 500 });
  }
}
