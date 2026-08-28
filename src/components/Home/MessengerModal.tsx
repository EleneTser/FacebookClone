import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import { useUserAvatar, DEFAULT_AVATAR } from './useUserAvatar';

interface MessengerModalProps {
  onClose: () => void;
  onOpenChat: (friend: any) => void;
}

export const MessengerModal: React.FC<MessengerModalProps> = ({ onClose, onOpenChat }) => {
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    const fetchFriends = async () => {
      if (!currentUserId) return;
      try {
        const q1 = query(collection(db, 'friendRequests'), where('senderId', '==', currentUserId), where('status', '==', 'accepted'));
        const q2 = query(collection(db, 'friendRequests'), where('receiverId', '==', currentUserId), where('status', '==', 'accepted'));
        
        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        
        const friendIds = new Set<string>();
        snap1.docs.forEach(d => friendIds.add(d.data().receiverId));
        snap2.docs.forEach(d => friendIds.add(d.data().senderId));

        const friendList = await Promise.all(
          Array.from(friendIds).map(async (fId) => {
            const userDoc = await getDoc(doc(db, 'users', fId));
            return { uid: fId, ...(userDoc.exists() ? userDoc.data() : { firstName: 'User', lastName: '' }) };
          })
        );

        setFriends(friendList);
      } catch (err) {
        console.error("Error fetching friends list:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, [currentUserId]);

  return (
    <div className="absolute right-0 mt-2 w-[360px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 p-4 text-[#050505]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-2xl font-bold text-[#1c1e21]">Chats</h2>
        <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <div className="space-y-1 max-h-[350px] overflow-y-auto">
        {loading ? (
          <p className="text-center text-gray-400 py-4 text-sm">Loading chats...</p>
        ) : friends.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No friends to message yet.</p>
        ) : (
          friends.map((friend) => (
            <MessengerListRow
              key={friend.uid}
              friend={friend}
              onClick={() => {
                onOpenChat(friend);
                onClose();
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Separate component so we can call the avatar hook per-friend (hooks
// can't be called inside .map on the parent).
const MessengerListRow: React.FC<{ friend: any; onClick: () => void }> = ({ friend, onClick }) => {
  const avatar = useUserAvatar(friend.uid, friend.profileImage);
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition"
    >
      <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg overflow-hidden">
        {avatar && avatar !== DEFAULT_AVATAR ? (
          <img src={avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          friend.firstName?.[0]?.toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm text-[#1c1e21] truncate">{friend.firstName} {friend.lastName}</h4>
        <p className="text-xs text-gray-500">Click to open chat window</p>
      </div>
    </div>
  );
};