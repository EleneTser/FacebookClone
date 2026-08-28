import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import mockData from '../../data.json'; // Import your data.json file
import { useUserAvatar, DEFAULT_AVATAR } from './useUserAvatar';

interface FriendsPageProps {
  currentUserId: string;
  onProfileClick: (friendId: string) => void;
}

export const FriendsPage: React.FC<FriendsPageProps> = ({ currentUserId, onProfileClick }) => {
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncomingRequests = async () => {
    if (!currentUserId) return;

    try {
      const q = query(
        collection(db, 'friendRequests'),
        where('receiverId', '==', currentUserId),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);

      const requestsData = await Promise.all(
        snapshot.docs.map(async (requestDoc) => {
          const data = requestDoc.data();
          const userDocRef = doc(db, 'users', data.senderId);
          const userDoc = await getDoc(userDocRef);

          return {
            id: requestDoc.id,
            ...data,
            sender: userDoc.exists() ? userDoc.data() : { firstName: 'Facebook', lastName: 'User', email: '' },
          };
        })
      );

      setIncomingRequests(requestsData);

      // Load mock suggestions from data.json
      setSuggestions(mockData.users);
    } catch (err) {
      console.error('Error fetching incoming requests & suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomingRequests();
  }, [currentUserId]);

  const handleAccept = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'friendRequests', requestId), { status: 'accepted' });
      setIncomingRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (err) {
      console.error('Error accepting request:', err);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, 'friendRequests', requestId));
      setIncomingRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (err) {
      console.error('Error rejecting request:', err);
    }
  };

  // Handle actions for mock suggestions
  const handleAddSuggestion = (userId: string) => {
    setSentRequests((prev) => [...prev, userId]);
  };

  const handleRemoveSuggestion = (userId: string) => {
    setSuggestions((prev) => prev.filter((user) => user.id !== userId));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen bg-[#f0f2f5] space-y-8">
      {/* SECTION 1: Pending Friend Requests */}
      <div>
        <h1 className="text-2xl font-bold mb-4 text-[#1c1e21]">Friend Requests</h1>
        {loading ? (
          <p className="text-gray-500">Loading requests...</p>
        ) : incomingRequests.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-200">
            <p className="text-gray-500 text-sm">No pending friend requests.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {incomingRequests.map((req) => (
              <IncomingRequestCard
                key={req.id}
                req={req}
                onProfileClick={onProfileClick}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: People You May Know (From data.json) */}
      <div>
        <h1 className="text-2xl font-bold mb-4 text-[#1c1e21]">People You May Know</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {suggestions.map((user) => {
            const isRequestSent = sentRequests.includes(user.id);

            return (
              <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                {/* Profile Image */}
                <div
                  onClick={() => onProfileClick(user.id)}
                  className="h-48 w-full bg-gray-200 overflow-hidden cursor-pointer"
                >
                  <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                </div>

                {/* User Details & Actions */}
                <div className="p-4 flex flex-col flex-1 justify-between">
                  <div onClick={() => onProfileClick(user.id)} className="cursor-pointer">
                    <h3 className="font-bold text-[#1c1e21] text-base truncate hover:underline">{user.name}</h3>
                    <p className="text-xs text-gray-500">@{user.username}</p>
                  </div>

                  <div className="flex flex-col gap-2 mt-4">
                    <button
                      onClick={() => handleAddSuggestion(user.id)}
                      disabled={isRequestSent}
                      className={`w-full py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
                        isRequestSent
                          ? 'bg-gray-200 text-gray-600 cursor-default'
                          : 'bg-[#e7f3ff] text-[#1877f2] hover:bg-[#dbe7f2]'
                      }`}
                    >
                      {isRequestSent ? 'Request Sent' : 'Add Friend'}
                    </button>
                    <button
                      onClick={() => handleRemoveSuggestion(user.id)}
                      className="w-full py-2 rounded-lg text-sm font-semibold bg-[#e4e6eb] text-[#050505] hover:bg-[#d8dadf] transition cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Separate component so the incoming-request avatar can independently
// resolve the sender's live profile picture via the hook (hooks can't
// be called inside .map on the parent).
const IncomingRequestCard: React.FC<{
  req: any;
  onProfileClick: (id: string) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}> = ({ req, onProfileClick, onAccept, onReject }) => {
  const avatar = useUserAvatar(req.senderId, req.sender?.profileImage);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      <div
        onClick={() => onProfileClick(req.senderId)}
        className="h-32 bg-blue-500 flex items-center justify-center text-white text-3xl font-bold cursor-pointer overflow-hidden"
      >
        {avatar && avatar !== DEFAULT_AVATAR ? (
          <img src={avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          req.sender.firstName?.[0]?.toUpperCase()
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <h3
          onClick={() => onProfileClick(req.senderId)}
          className="font-bold text-[#1c1e21] text-base truncate cursor-pointer hover:underline"
        >
          {req.sender.firstName} {req.sender.lastName}
        </h3>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onAccept(req.id)}
            className="flex-1 py-2 bg-[#1877f2] hover:bg-[#166fe5] text-white text-sm font-semibold rounded-lg cursor-pointer transition text-center"
          >
            Confirm
          </button>
          <button
            onClick={() => onReject(req.id)}
            className="flex-1 py-2 bg-[#e4e6eb] hover:bg-[#d8dadf] text-[#050505] text-sm font-semibold rounded-lg cursor-pointer transition text-center"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};