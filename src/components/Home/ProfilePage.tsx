import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { PostCard } from './PostCard'; // Adjust path if needed
import { EditProfileModal } from './EditProfileModal';
import { uploadImageToCloudinary } from './cloudinaryService'; // Adjust path if needed
import Pfp from '../../assets/Pfp.png'; // Adjust path to default avatar
import staticData from '../../data.json'; // Import your static mock data

interface ProfilePageProps {
  currentUserId: string;
  profileUserId: string; // The ID of the profile we are currently viewing
  onOpenChat?: (friend: any) => void; // Optional: to open messenger chat with them
  onProfileClick?: (userId: string) => void; // Navigate to a different profile (e.g. from Friends tab)
}

interface FriendSummary {
  uid: string;
  firstName: string;
  profileImage?: string;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUserId,
  profileUserId,
  onOpenChat,
  onProfileClick,
}) => {
  const [profileUser, setProfileUser] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('all');

  // Friend request state for visiting other profiles
  const [friendStatus, setFriendStatus] = useState<'self' | 'friends' | 'pending_sent' | 'pending_received' | 'none'>('none');
  const [requestId, setRequestId] = useState<string | null>(null);

  // Full friends list (for the Friends tab + accurate count)
  const [friendsList, setFriendsList] = useState<FriendSummary[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);

  // Photo upload state
  const [isUploadingProfilePic, setIsUploadingProfilePic] = useState(false);
  const [isUploadingCoverPic, setIsUploadingCoverPic] = useState(false);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const coverPicInputRef = useRef<HTMLInputElement>(null);

  // Edit profile modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isMyProfile = currentUserId === profileUserId;
  // Static demo users (from data.json) can't be written to Firestore
  const isEditableUser = isMyProfile && !!profileUser && profileUser.__isFirestoreUser;

  // 1. Fetch Profile User details & Posts
  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        // First, check if this user exists in your static data.json list
        const STATIC_USERS = (staticData as any).users || [];
        const foundStaticUser: any = STATIC_USERS.find(
          (u: any) => u.id === profileUserId || u.uid === profileUserId || u.username === profileUserId
        );

        if (foundStaticUser) {
          // Populate profile user state from static JSON data safely
          setProfileUser({
            uid: foundStaticUser.id || foundStaticUser.uid,
            firstName: foundStaticUser.name || foundStaticUser.displayName,
            username: foundStaticUser.username,
            profileImage: foundStaticUser.profileImage,
            coverImage: foundStaticUser.coverImage,
            bio: foundStaticUser.bio,
            work: foundStaticUser.work,
            education: foundStaticUser.education,
            currentCity: foundStaticUser.currentCity,
            hometown: foundStaticUser.hometown,
            relationshipStatus: foundStaticUser.relationshipStatus,
            __isFirestoreUser: false,
          });

          const staticPosts = ((staticData as any).posts || [])
            .filter((p: any) => p.userId === foundStaticUser.id)
            .map((p: any) => ({
              ...p,
              userName: foundStaticUser.name,
              userImage: foundStaticUser.profileImage,
            }));

          setUserPosts(staticPosts);
        } else {
          // Otherwise, fetch target user info from Firestore
          const userDocRef = doc(db, 'users', profileUserId);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            setProfileUser({ uid: userSnap.id, ...userSnap.data(), __isFirestoreUser: true });
          } else if (isMyProfile && auth.currentUser) {
            // No users/{uid} doc exists yet for our own account (e.g. first
            // login before any profile-creation step ran). Auto-provision a
            // minimal doc now so profile editing / photo uploads work.
            const fallbackData = {
              firstName: auth.currentUser.displayName || 'Facebook User',
              email: auth.currentUser.email || '',
            };
            try {
              await setDoc(userDocRef, fallbackData, { merge: true });
            } catch (provisionErr) {
              console.error('Error creating default user doc:', provisionErr);
            }
            setProfileUser({ uid: profileUserId, ...fallbackData, __isFirestoreUser: true });
          }

          // Fetch target user posts from Firestore
          const q = query(collection(db, 'posts'), where('userId', '==', profileUserId));
          const snapshot = await getDocs(q);
          const posts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setUserPosts(posts);
        }

        // Check friendship status if it's not our own profile
        if (!isMyProfile) {
          await checkFriendshipStatus();
        } else {
          setFriendStatus('self');
        }

        // Load the full friends list for this profile (for the Friends tab + count)
        fetchFriendsList();
      } catch (err) {
        console.error('Error loading profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileUserId, currentUserId]);

  // Resolve a uid to a display-friendly summary, checking static data first, then Firestore
  const resolveUserSummary = async (uid: string): Promise<FriendSummary> => {
    const STATIC_USERS = (staticData as any).users || [];
    const foundStaticUser: any = STATIC_USERS.find((u: any) => u.id === uid || u.uid === uid);
    if (foundStaticUser) {
      return {
        uid: foundStaticUser.id || foundStaticUser.uid,
        firstName: foundStaticUser.name || foundStaticUser.displayName,
        profileImage: foundStaticUser.profileImage,
      };
    }
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const data: any = snap.data();
        return {
          uid: snap.id,
          firstName: data.firstName || data.name || 'Facebook User',
          profileImage: data.profileImage,
        };
      }
    } catch (err) {
      console.error('Error resolving user:', err);
    }
    return { uid, firstName: 'Facebook User' };
  };

  // Fetch every accepted friend connection for the profile being viewed
  const fetchFriendsList = async () => {
    setFriendsLoading(true);
    try {
      const q1 = query(
        collection(db, 'friendRequests'),
        where('senderId', '==', profileUserId),
        where('status', '==', 'accepted')
      );
      const q2 = query(
        collection(db, 'friendRequests'),
        where('receiverId', '==', profileUserId),
        where('status', '==', 'accepted')
      );

      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

      const otherUids: string[] = [
        ...snap1.docs.map((d) => d.data().receiverId),
        ...snap2.docs.map((d) => d.data().senderId),
      ];

      const summaries = await Promise.all(otherUids.map((uid) => resolveUserSummary(uid)));
      setFriendsList(summaries);
    } catch (err) {
      console.error('Error fetching friends list:', err);
    } finally {
      setFriendsLoading(false);
    }
  };

  // Check friendship status between current user and profile user
  const checkFriendshipStatus = async () => {
    try {
      const q1 = query(collection(db, 'friendRequests'), where('senderId', '==', currentUserId), where('receiverId', '==', profileUserId));
      const q2 = query(collection(db, 'friendRequests'), where('senderId', '==', profileUserId), where('receiverId', '==', currentUserId));

      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

      if (!snap1.empty) {
        const data = snap1.docs[0].data();
        setRequestId(snap1.docs[0].id);
        if (data.status === 'accepted') setFriendStatus('friends');
        else if (data.status === 'pending') setFriendStatus('pending_sent');
      } else if (!snap2.empty) {
        const data = snap2.docs[0].data();
        setRequestId(snap2.docs[0].id);
        if (data.status === 'accepted') setFriendStatus('friends');
        else if (data.status === 'pending') setFriendStatus('pending_received');
      } else {
        setFriendStatus('none');
      }
    } catch (err) {
      console.error('Error checking friendship:', err);
    }
  };

  // Action handlers
  const handleSendFriendRequest = async () => {
    try {
      const newReqRef = doc(collection(db, 'friendRequests'));
      await setDoc(newReqRef, {
        senderId: currentUserId,
        receiverId: profileUserId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      setRequestId(newReqRef.id);
      setFriendStatus('pending_sent');
    } catch (err) {
      console.error('Error sending request:', err);
    }
  };

  const handleCancelOrRemoveFriend = async () => {
    if (!requestId) return;
    try {
      await deleteDoc(doc(db, 'friendRequests', requestId));
      setRequestId(null);
      setFriendStatus('none');
      fetchFriendsList();
    } catch (err) {
      console.error('Error removing request/friend:', err);
    }
  };

  const handleAcceptRequest = async () => {
    if (!requestId) return;
    try {
      await setDoc(doc(db, 'friendRequests', requestId), { status: 'accepted' }, { merge: true });
      setFriendStatus('friends');
      fetchFriendsList();
    } catch (err) {
      console.error('Error accepting request:', err);
    }
  };

  // --- Photo upload handlers -------------------------------------------

  const uploadImage = uploadImageToCloudinary;

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file || !isEditableUser) return;

    setIsUploadingProfilePic(true);
    try {
      const url = await uploadImage(file);
      await setDoc(doc(db, 'users', profileUserId), { profileImage: url }, { merge: true });
      setProfileUser((prev: any) => ({ ...prev, profileImage: url }));
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      alert('Could not upload your profile picture. Check the console for details.');
    } finally {
      setIsUploadingProfilePic(false);
    }
  };

  const handleCoverPicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !isEditableUser) return;

    setIsUploadingCoverPic(true);
    try {
      const url = await uploadImage(file);
      await setDoc(doc(db, 'users', profileUserId), { coverImage: url }, { merge: true });
      setProfileUser((prev: any) => ({ ...prev, coverImage: url }));
    } catch (err) {
      console.error('Error uploading cover photo:', err);
      alert('Could not upload your cover photo. Check the console for details.');
    } finally {
      setIsUploadingCoverPic(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center text-gray-500">Loading profile...</div>;
  }

  // Resolves name cleanly whether it's a Firestore user or a static JSON user
  const displayName = profileUser
    ? (profileUser.firstName || profileUser.name || 'Facebook User')
    : 'Facebook User';

  const friendCount = friendsList.length;

  // Gather photos for the Photos tab: cover, profile pic, and any post images
  const allPhotos: string[] = [
    ...(profileUser?.coverImage ? [profileUser.coverImage] : []),
    ...(profileUser?.profileImage ? [profileUser.profileImage] : []),
    ...userPosts
      .map((p: any) => p.imageUrl || p.image)
      .filter((url: any) => !!url),
  ];

  return (
    <div className="min-h-screen bg-[#f0f2f5] pb-12 select-none">
      {/* Top Header & Cover Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4">

          {/* Cover Photo */}
          <div
            className="h-48 sm:h-72 md:h-80 w-full bg-gradient-to-b from-gray-200 to-gray-300 rounded-b-xl relative overflow-hidden bg-cover bg-center"
            style={profileUser?.coverImage ? { backgroundImage: `url(${profileUser.coverImage})` } : undefined}
          >
            {isMyProfile && (
              <>
                <input
                  ref={coverPicInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverPicChange}
                  disabled={!isEditableUser}
                />
                <button
                  onClick={() => coverPicInputRef.current?.click()}
                  disabled={isUploadingCoverPic || !isEditableUser}
                  className="absolute bottom-4 right-4 bg-white hover:bg-gray-100 text-[#050505] font-semibold text-sm px-3 py-1.5 rounded-md shadow-sm flex items-center gap-2 cursor-pointer transition disabled:opacity-60"
                  title={isEditableUser ? undefined : 'Not available for demo accounts'}
                >
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                  {isUploadingCoverPic ? 'Uploading...' : 'Add cover photo'}
                </button>
              </>
            )}
          </div>

          {/* Profile Info Section */}
          <div className="px-4 pb-4 flex flex-col md:flex-row items-center md:items-end justify-between -mt-16 md:-mt-8 gap-4 mb-4">

            {/* Left: Avatar & Name */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
              <div className="relative">
                <div className="w-40 h-40 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden flex items-center justify-center font-bold text-5xl text-blue-600">
                  {profileUser?.profileImage ? (
                    <img src={profileUser.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : profileUser?.firstName?.[0]?.toUpperCase() ? (
                    profileUser.firstName[0].toUpperCase()
                  ) : (
                    <img src={Pfp} alt="Profile" className="w-full h-full object-cover" />
                  )}
                </div>
                {isMyProfile && (
                  <>
                    <input
                      ref={profilePicInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePicChange}
                      disabled={!isEditableUser}
                    />
                    <button
                      onClick={() => profilePicInputRef.current?.click()}
                      disabled={isUploadingProfilePic || !isEditableUser}
                      className="absolute bottom-3 right-3 bg-[#e4e6eb] hover:bg-[#d8dadf] p-2 rounded-full border-2 border-white cursor-pointer shadow disabled:opacity-60"
                      title={isEditableUser ? undefined : 'Not available for demo accounts'}
                    >
                      <span className="material-symbols-outlined text-[20px] text-[#050505]">
                        {isUploadingProfilePic ? 'hourglass_top' : 'photo_camera'}
                      </span>
                    </button>
                  </>
                )}
              </div>

              <div className="mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1c1e21]">{displayName}</h1>
                <button
                  onClick={() => setActiveSubTab('friends')}
                  className="text-gray-500 hover:underline font-semibold text-sm mt-0.5 cursor-pointer"
                >
                  {friendCount} friend{friendCount === 1 ? '' : 's'}
                </button>
              </div>
            </div>

            {/* Right: Dynamic Action Buttons Based on Relationship */}
            <div className="flex items-center gap-2 mb-2">
              {isMyProfile ? (
                <>
                  <button className="bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold px-4 py-2 rounded-md flex items-center gap-2 text-sm transition cursor-pointer shadow-sm">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Add to story
                  </button>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    disabled={!isEditableUser}
                    title={isEditableUser ? undefined : 'Not available for demo accounts'}
                    className="bg-[#e4e6eb] hover:bg-[#d8dadf] text-[#050505] font-semibold px-4 py-2 rounded-md flex items-center gap-2 text-sm transition cursor-pointer disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    Edit profile
                  </button>
                </>
              ) : (
                <>
                  {friendStatus === 'none' && (
                    <button
                      onClick={handleSendFriendRequest}
                      className="bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold px-4 py-2 rounded-md flex items-center gap-2 text-sm transition cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">person_add</span>
                      Add Friend
                    </button>
                  )}

                  {friendStatus === 'pending_sent' && (
                    <button
                      onClick={handleCancelOrRemoveFriend}
                      className="bg-[#e4e6eb] hover:bg-[#d8dadf] text-[#050505] font-semibold px-4 py-2 rounded-md flex items-center gap-2 text-sm transition cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">person_remove</span>
                      Cancel Request
                    </button>
                  )}

                  {friendStatus === 'pending_received' && (
                    <>
                      <button
                        onClick={handleAcceptRequest}
                        className="bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold px-4 py-2 rounded-md text-sm transition cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={handleCancelOrRemoveFriend}
                        className="bg-[#e4e6eb] hover:bg-[#d8dadf] text-[#050505] font-semibold px-4 py-2 rounded-md text-sm transition cursor-pointer"
                      >
                        Delete
                      </button>
                    </>
                  )}

                  {friendStatus === 'friends' && (
                    <button
                      onClick={handleCancelOrRemoveFriend}
                      className="bg-[#e4e6eb] hover:bg-[#d8dadf] text-[#050505] font-semibold px-4 py-2 rounded-md flex items-center gap-2 text-sm transition cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                      Friends
                    </button>
                  )}

                  <button
                    onClick={() => onOpenChat && onOpenChat(profileUser)}
                    className="bg-[#e4e6eb] hover:bg-[#d8dadf] text-[#050505] font-semibold px-4 py-2 rounded-md flex items-center gap-2 text-sm transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">chat</span>
                    Message
                  </button>
                </>
              )}
            </div>

          </div>

          <hr className="border-gray-200" />

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between overflow-x-auto">
            <div className="flex items-center gap-1 py-1">
              {['All', 'About', 'Friends', 'Photos', 'Reels'].map((tab) => {
                const lower = tab.toLowerCase();
                const isActive = activeSubTab === lower;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveSubTab(lower)}
                    className={`px-4 py-3 font-semibold text-sm rounded-lg transition cursor-pointer ${
                      isActive ? 'text-[#1877f2] border-b-4 border-[#1877f2] rounded-b-none' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-6xl mx-auto px-4 mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Left Column: Intro Details (always visible) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 space-y-3">
            <h2 className="text-xl font-bold text-[#1c1e21]">Intro</h2>

            {profileUser?.bio && (
              <p className="text-sm text-center text-gray-700 pb-3 border-b border-gray-100">{profileUser.bio}</p>
            )}

            <div className="space-y-2.5 text-sm text-gray-700">
              {profileUser?.work && (
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-gray-400 text-[20px]">work</span>
                  <span>Works at <strong>{profileUser.work}</strong></span>
                </div>
              )}
              {profileUser?.education && (
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-gray-400 text-[20px]">school</span>
                  <span>Studied at <strong>{profileUser.education}</strong></span>
                </div>
              )}
              {profileUser?.currentCity && (
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-gray-400 text-[20px]">home</span>
                  <span>Lives in <strong>{profileUser.currentCity}</strong></span>
                </div>
              )}
              {profileUser?.hometown && (
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-gray-400 text-[20px]">location_on</span>
                  <span>From <strong>{profileUser.hometown}</strong></span>
                </div>
              )}
              {profileUser?.relationshipStatus && profileUser.relationshipStatus !== 'Prefer not to say' && (
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-gray-400 text-[20px]">favorite</span>
                  <span>{profileUser.relationshipStatus}</span>
                </div>
              )}
              {!profileUser?.work && !profileUser?.education && !profileUser?.currentCity && !profileUser?.hometown && (
                <p className="text-sm text-gray-500 text-center py-2">
                  {isMyProfile ? 'Add details about yourself.' : `No details shared by ${displayName} yet.`}
                </p>
              )}
            </div>

            {isMyProfile && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                disabled={!isEditableUser}
                className="w-full py-2 bg-[#e4e6eb] hover:bg-[#d8dadf] text-[#050505] font-semibold rounded-lg text-sm transition cursor-pointer disabled:opacity-60"
              >
                Edit details
              </button>
            )}
          </div>

          {/* Friends preview card */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1c1e21]">Friends</h2>
              <button
                onClick={() => setActiveSubTab('friends')}
                className="text-[#1877f2] text-sm font-semibold hover:underline cursor-pointer"
              >
                See all friends
              </button>
            </div>
            <p className="text-sm text-gray-500">{friendCount} friend{friendCount === 1 ? '' : 's'}</p>
            {friendsList.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {friendsList.slice(0, 6).map((friend) => (
                  <button
                    key={friend.uid}
                    onClick={() => onProfileClick && onProfileClick(friend.uid)}
                    className="flex flex-col items-center gap-1 cursor-pointer group"
                  >
                    <div className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg overflow-hidden">
                      {friend.profileImage ? (
                        <img src={friend.profileImage} alt={friend.firstName} className="w-full h-full object-cover" />
                      ) : (
                        friend.firstName?.[0]?.toUpperCase()
                      )}
                    </div>
                    <span className="text-xs font-semibold text-gray-700 group-hover:underline truncate w-full text-center">
                      {friend.firstName}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: switches based on active tab */}
        <div className="lg:col-span-7 space-y-4">

          {activeSubTab === 'all' && (
            <>
              {isMyProfile && (
                <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                    <div className="bg-[#f0f2f5] hover:bg-[#e4e6eb] transition cursor-pointer flex-1 rounded-full px-4 py-2.5 text-gray-500 text-sm">
                      What's on your mind?
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 flex items-center justify-between">
                <span className="font-bold text-lg text-[#1c1e21]">Posts</span>
              </div>

              {userPosts.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
                  <h3 className="font-bold text-gray-800 text-lg">No posts yet</h3>
                  <p className="text-gray-500 text-sm mt-1">This user hasn't posted anything yet.</p>
                </div>
              ) : (
                userPosts.map((post) => (
                  <PostCard key={post.id} post={post} currentUserId={currentUserId} />
                ))
              )}
            </>
          )}

          {activeSubTab === 'about' && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 space-y-4">
              <h2 className="text-xl font-bold text-[#1c1e21]">About</h2>
              <div className="divide-y divide-gray-100">
                <div className="py-3 flex items-center gap-3">
                  <span className="material-symbols-outlined text-gray-400">work</span>
                  <span className="text-sm text-gray-700">{profileUser?.work || 'No workplace added'}</span>
                </div>
                <div className="py-3 flex items-center gap-3">
                  <span className="material-symbols-outlined text-gray-400">school</span>
                  <span className="text-sm text-gray-700">{profileUser?.education || 'No education added'}</span>
                </div>
                <div className="py-3 flex items-center gap-3">
                  <span className="material-symbols-outlined text-gray-400">home</span>
                  <span className="text-sm text-gray-700">{profileUser?.currentCity || 'No current city added'}</span>
                </div>
                <div className="py-3 flex items-center gap-3">
                  <span className="material-symbols-outlined text-gray-400">location_on</span>
                  <span className="text-sm text-gray-700">{profileUser?.hometown || 'No hometown added'}</span>
                </div>
                <div className="py-3 flex items-center gap-3">
                  <span className="material-symbols-outlined text-gray-400">favorite</span>
                  <span className="text-sm text-gray-700">{profileUser?.relationshipStatus || 'Prefer not to say'}</span>
                </div>
              </div>
              {isMyProfile && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  disabled={!isEditableUser}
                  className="py-2 px-4 bg-[#e4e6eb] hover:bg-[#d8dadf] text-[#050505] font-semibold rounded-lg text-sm transition cursor-pointer disabled:opacity-60"
                >
                  Edit details
                </button>
              )}
            </div>
          )}

          {activeSubTab === 'friends' && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 space-y-4">
              <h2 className="text-xl font-bold text-[#1c1e21]">
                Friends <span className="text-gray-400 font-normal">· {friendCount}</span>
              </h2>
              {friendsLoading ? (
                <p className="text-sm text-gray-500 text-center py-6">Loading friends...</p>
              ) : friendsList.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No friends yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {friendsList.map((friend) => (
                    <button
                      key={friend.uid}
                      onClick={() => onProfileClick && onProfileClick(friend.uid)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer text-left"
                    >
                      <div className="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
                        {friend.profileImage ? (
                          <img src={friend.profileImage} alt={friend.firstName} className="w-full h-full object-cover" />
                        ) : (
                          friend.firstName?.[0]?.toUpperCase()
                        )}
                      </div>
                      <span className="font-semibold text-sm text-gray-800 truncate">{friend.firstName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'photos' && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 space-y-4">
              <h2 className="text-xl font-bold text-[#1c1e21]">Photos</h2>
              {allPhotos.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No photos yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {allPhotos.map((url, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'reels' && (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-800 text-lg">No reels yet</h3>
              <p className="text-gray-500 text-sm mt-1">
                {isMyProfile ? "Reels you post will show up here." : `${displayName} hasn't posted any reels yet.`}
              </p>
            </div>
          )}

        </div>

      </div>

      {isMyProfile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          userId={profileUserId}
          initialData={{
            bio: profileUser?.bio,
            work: profileUser?.work,
            education: profileUser?.education,
            currentCity: profileUser?.currentCity,
            hometown: profileUser?.hometown,
            relationshipStatus: profileUser?.relationshipStatus,
          }}
          onSaved={(fields) => setProfileUser((prev: any) => ({ ...prev, ...fields }))}
        />
      )}
    </div>
  );
};

export default ProfilePage;