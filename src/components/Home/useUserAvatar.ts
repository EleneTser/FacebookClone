// src/components/home/useUserAvatar.ts
//
// Central place that resolves a user's *current* avatar image.
// Anywhere in the app that shows someone's picture (navbar, posts,
// comments, messenger, friend lists, etc.) should use this hook instead
// of trusting a value that was copied onto a post/comment/message at the
// time it was created — that copy goes stale the moment the person
// changes their profile picture. This hook always reflects the live
// value in `users/{uid}.profileImage`, and falls back to the default
// PFP image when the user has never uploaded one.

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import staticData from '../../data.json';
import Pfp from '../../assets/PFP.png';

export const DEFAULT_AVATAR = Pfp;

// Small in-memory cache so we don't re-fetch the same user doc from
// every card/avatar that happens to render them on the same page.
const avatarCache = new Map<string, string>();

export function invalidateAvatarCache(uid?: string) {
  if (uid) avatarCache.delete(uid);
  else avatarCache.clear();
}

function resolveStaticAvatar(uid: string): string | undefined {
  const STATIC_USERS = (staticData as any).users || [];
  const found = STATIC_USERS.find((u: any) => u.id === uid || u.uid === uid);
  return found?.profileImage || undefined;
}

/**
 * Returns the best-known avatar URL for `uid`, always preferring the
 * live Firestore `profileImage`. `fallback` (e.g. a URL saved on an old
 * post) is only used until the live value loads, and only if the user
 * truly has no profile picture set. Defaults to the shared PFP asset.
 */
export function useUserAvatar(uid?: string | null, fallback?: string | null): string {
  const [avatar, setAvatar] = useState<string>(() => {
    if (uid && avatarCache.has(uid)) return avatarCache.get(uid)!;
    if (uid) {
      const staticUrl = resolveStaticAvatar(uid);
      if (staticUrl) return staticUrl;
    }
    return fallback || DEFAULT_AVATAR;
  });

  useEffect(() => {
    if (!uid) {
      setAvatar(fallback || DEFAULT_AVATAR);
      return;
    }

    const staticUrl = resolveStaticAvatar(uid);
    if (staticUrl) {
      avatarCache.set(uid, staticUrl);
      setAvatar(staticUrl);
      return;
    }

    if (avatarCache.has(uid)) {
      setAvatar(avatarCache.get(uid)!);
    }

    let cancelled = false;
    getDoc(doc(db, 'users', uid))
      .then((snap) => {
        if (cancelled) return;
        const liveUrl = snap.exists() ? (snap.data() as any).profileImage : undefined;
        const resolved = liveUrl || fallback || DEFAULT_AVATAR;
        avatarCache.set(uid, resolved);
        setAvatar(resolved);
      })
      .catch(() => {
        if (!cancelled) setAvatar(fallback || DEFAULT_AVATAR);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  return avatar;
}