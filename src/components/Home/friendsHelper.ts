// src/components/home/friendsHelper.ts
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';

export interface FriendSummary {
  uid: string;
  firstName: string;
  lastName?: string;
  profileImage?: string;
}

// Returns the uids of every user with an accepted friendRequests
// connection to `userId`.
export async function fetchAcceptedFriendIds(userId: string): Promise<string[]> {
  const q1 = query(
    collection(db, 'friendRequests'),
    where('senderId', '==', userId),
    where('status', '==', 'accepted')
  );
  const q2 = query(
    collection(db, 'friendRequests'),
    where('receiverId', '==', userId),
    where('status', '==', 'accepted')
  );

  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

  const ids = new Set<string>();
  snap1.docs.forEach((d) => ids.add(d.data().receiverId));
  snap2.docs.forEach((d) => ids.add(d.data().senderId));
  return Array.from(ids);
}

// Same as above, but also resolves each uid to basic profile info
// (name + avatar) so it can be rendered directly, e.g. in a
// friend-tagging picker.
export async function fetchAcceptedFriends(userId: string): Promise<FriendSummary[]> {
  const ids = await fetchAcceptedFriendIds(userId);
  const friends = await Promise.all(
    ids.map(async (uid) => {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        const data: any = snap.exists() ? snap.data() : {};
        return {
          uid,
          firstName: data.firstName || data.name || 'Facebook User',
          lastName: data.lastName || '',
          profileImage: data.profileImage,
        } as FriendSummary;
      } catch {
        return { uid, firstName: 'Facebook User' } as FriendSummary;
      }
    })
  );
  return friends;
}