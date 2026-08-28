import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

interface UserProfileModalProps {
  currentUserUid?: string;
  targetUser: {
    uid: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ currentUserUid, targetUser, onClose }) => {
  const activeUserId = currentUserUid || auth.currentUser?.uid;

  const [requestStatus, setRequestStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'friends' | 'blocked'>('none');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [showFriendOptions, setShowFriendOptions] = useState(false); // Controls dropdown menu for friends
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkFriendStatus = async () => {
      if (!activeUserId || !targetUser.uid || activeUserId === targetUser.uid) {
        setLoading(false);
        return;
      }

      try {
        const q1 = query(
          collection(db, 'friendRequests'),
          where('senderId', '==', activeUserId),
          where('receiverId', '==', targetUser.uid)
        );
        
        const q2 = query(
          collection(db, 'friendRequests'),
          where('senderId', '==', targetUser.uid),
          where('receiverId', '==', activeUserId)
        );

        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

        if (!snap1.empty) {
          const docData = snap1.docs[0];
          const data = docData.data();
          setRequestId(docData.id);
          if (data.status === 'accepted') setRequestStatus('friends');
          else if (data.status === 'pending') setRequestStatus('pending_sent');
          else if (data.status === 'blocked') setRequestStatus('blocked');
        } else if (!snap2.empty) {
          const docData = snap2.docs[0];
          const data = docData.data();
          setRequestId(docData.id);
          if (data.status === 'accepted') setRequestStatus('friends');
          else if (data.status === 'pending') setRequestStatus('pending_received');
          else if (data.status === 'blocked') setRequestStatus('blocked');
        } else {
          setRequestStatus('none');
        }
      } catch (err) {
        console.error("Error checking status:", err);
      } finally {
        setLoading(false);
      }
    };
    checkFriendStatus();
  }, [activeUserId, targetUser.uid]);

  const sendFriendRequest = async () => {
    if (isSubmitting || !activeUserId || activeUserId === targetUser.uid) return;
    setIsSubmitting(true);
    
    try {
      const docRef = await addDoc(collection(db, 'friendRequests'), {
        senderId: activeUserId,
        receiverId: targetUser.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setRequestId(docRef.id);
      setRequestStatus('pending_sent');
    } catch (err) {
      console.error("Error sending friend request:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const acceptFriendRequest = async () => {
    if (isSubmitting || !requestId) return;
    setIsSubmitting(true);

    try {
      const reqRef = doc(db, 'friendRequests', requestId);
      await updateDoc(reqRef, { status: 'accepted' });
      setRequestStatus('friends');
    } catch (err) {
      console.error("Error accepting friend request:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unfriend handler: deletes the connection document entirely
  const handleUnfriend = async () => {
    if (isSubmitting || !requestId) return;
    setIsSubmitting(true);

    try {
      await deleteDoc(doc(db, 'friendRequests', requestId));
      setRequestId(null);
      setRequestStatus('none');
      setShowFriendOptions(false);
    } catch (err) {
      console.error("Error unfriending:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Block handler: updates status to 'blocked'
  const handleBlock = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (requestId) {
        const reqRef = doc(db, 'friendRequests', requestId);
        await updateDoc(reqRef, { status: 'blocked', blockedBy: activeUserId });
      } else {
        // If no prior request existed, create a block relationship document
        const docRef = await addDoc(collection(db, 'friendRequests'), {
          senderId: activeUserId,
          receiverId: targetUser.uid,
          status: 'blocked',
          blockedBy: activeUserId,
          createdAt: serverTimestamp(),
        });
        setRequestId(docRef.id);
      }
      setRequestStatus('blocked');
      setShowFriendOptions(false);
    } catch (err) {
      console.error("Error blocking user:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-black cursor-pointer">
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-blue-500 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-4">
            {targetUser.firstName?.[0]?.toUpperCase()}
          </div>
          <h2 className="text-xl font-bold text-[#1c1e21]">
            {targetUser.firstName} {targetUser.lastName}
          </h2>
          <p className="text-sm text-gray-500 mb-6">{targetUser.email}</p>

          {!loading && (
            <div className="w-full relative">
              {activeUserId === targetUser.uid ? (
                <button disabled className="w-full py-2 bg-gray-100 text-gray-500 font-semibold rounded-lg cursor-not-allowed">
                  This is your profile
                </button>
              ) : requestStatus === 'none' ? (
                <button
                  onClick={sendFriendRequest}
                  disabled={isSubmitting}
                  className="w-full py-2 bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold rounded-lg transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Add Friend'}
                </button>
              ) : requestStatus === 'pending_sent' ? (
                <button disabled className="w-full py-2 bg-gray-200 text-gray-600 font-semibold rounded-lg cursor-not-allowed">
                  Request Sent
                </button>
              ) : requestStatus === 'pending_received' ? (
                <button
                  onClick={acceptFriendRequest}
                  disabled={isSubmitting}
                  className="w-full py-2 bg-[#2e7d32] hover:bg-[#2e7d32]/90 text-white font-semibold rounded-lg transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Accepting...' : 'Accept Request'}
                </button>
              ) : requestStatus === 'friends' ? (
                <div className="relative">
                  <button
                    onClick={() => setShowFriendOptions(!showFriendOptions)}
                    className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Friends ✓</span>
                    <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
                  </button>

                  {/* Dropdown Menu for Unfriend / Block */}
                  {showFriendOptions && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20 text-left">
                      <button
                        onClick={handleUnfriend}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">person_remove</span>
                        Unfriend {targetUser.firstName}
                      </button>
                      <button
                        onClick={handleBlock}
                        disabled={isSubmitting}
                        className="w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">block</span>
                        Block user
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleUnfriend} // Clicking unblock / reset
                  disabled={isSubmitting}
                  className="w-full py-2 bg-red-100 text-red-600 font-semibold rounded-lg hover:bg-red-200 transition cursor-pointer"
                >
                  Blocked (Click to Unblock)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};