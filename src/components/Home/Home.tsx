// src/components/Home/Home.tsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { FriendsPage } from './FriendsPage';
import { ProfilePage } from './ProfilePage';
import { GroupsPage } from './GroupsPage'; 
import { ReelsPage } from './ReelsPage';   
import { CreatePostModal } from './CreatePostModal';
import { PostCard } from './PostCard';
import { fetchAllPosts } from './postsService';
import { fetchAcceptedFriendIds } from './friendsHelper';
import { useUserAvatar } from './useUserAvatar';

interface HomeProps {
  userDisplayName: string;
  currentUserId: string;
  onLogout: () => void;
}

export const Home: React.FC<HomeProps> = ({ userDisplayName, currentUserId, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [friendIds, setFriendIds] = useState<string[]>([]);

  const currentUserAvatar = useUserAvatar(currentUserId);

  useEffect(() => {
    const unsubscribe = fetchAllPosts((updatedPosts) => {
      setAllPosts(updatedPosts);
    });
    return () => unsubscribe();
  }, []);

  // Keep track of who the current user is friends with, so the feed can
  // respect each post's Public / Friends / Only me setting.
  useEffect(() => {
    if (!currentUserId) return;
    let cancelled = false;
    fetchAcceptedFriendIds(currentUserId)
      .then((ids) => {
        if (!cancelled) setFriendIds(ids);
      })
      .catch((err) => console.error('Error loading friend list for feed filtering:', err));
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  // Only show posts the current viewer is actually allowed to see.
  const visiblePosts = allPosts.filter((post) => {
    if (post.userId === currentUserId) return true; // you can always see your own posts
    const visibility = post.visibility || 'public';
    if (visibility === 'only_me') return false;
    if (visibility === 'friends') return friendIds.includes(post.userId);
    return true; // 'public'
  });

  // Determine navbar active tab based on the URL path
  const getActiveTab = () => {
    if (location.pathname.startsWith('/friends')) return 'friends';
    if (location.pathname.startsWith('/profile')) return 'profile';
    if (location.pathname.startsWith('/groups')) return 'groups';
    if (location.pathname.startsWith('/reels')) return 'reels';
    return 'home';
  };

  const goHome = () => navigate('/home');

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-[#1c1e21]">
      <Navbar
        currentUserId={currentUserId}
        userDisplayName={userDisplayName}
        userAvatar={currentUserAvatar}
        onLogout={onLogout}
        activeTab={getActiveTab()}
        setActiveTab={(tab) => {
          if (tab === 'home') goHome();
          if (tab === 'friends') navigate('/friends');
          if (tab === 'groups') navigate('/groups');
          if (tab === 'reels') navigate('/reels');
        }}
        onProfileClick={() => navigate(`/profile/${currentUserId}`)}
        onSelectUser={(userId: string) => navigate(`/profile/${userId}`)}
      />

      <main className="pt-4 pb-8">
        <Routes>
          {/* Default Home Feed Route */}
          <Route 
            path="/home" 
            element={
              <div className="max-w-6xl mx-auto px-4 flex justify-center">
                <div className="w-full max-w-[680px]">
                  {/* Create Post Card Trigger */}
                  <div className="bg-white rounded-xl shadow px-4 pt-3 pb-3 mb-4">
                    <div className="flex gap-2 items-center pb-3 border-b border-gray-200">
                      <div 
                        onClick={() => navigate(`/profile/${currentUserId}`)}
                        className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm shrink-0 cursor-pointer hover:opacity-90 overflow-hidden"
                      >
                        {currentUserAvatar ? (
                          <img src={currentUserAvatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          userDisplayName ? userDisplayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'FB'
                        )}
                      </div>
                      <button
                        onClick={() => setIsPostModalOpen(true)}
                        className="w-full bg-[#f0f2f5] hover:bg-[#e4e6eb] text-left px-4 py-2.5 rounded-full text-gray-500 transition-colors cursor-pointer"
                      >
                        What's on your mind, {userDisplayName.split(' ')[0]}?
                      </button>
                    </div>
                  </div>

                  {/* News Feed Stream */}
                  {visiblePosts.length === 0 ? (
                    <div className="bg-white rounded-xl shadow p-8 text-center">
                      <h2 className="text-lg font-bold text-gray-700">No posts yet!</h2>
                      <p className="text-gray-500 mt-1 text-sm">Be the first to share something on your news feed.</p>
                    </div>
                  ) : (
                    visiblePosts.map((post) => (
                      <PostCard 
                        key={post.id} 
                        post={post} 
                        currentUserId={currentUserId} 
                        onProfileClick={(authorId) => navigate(`/profile/${authorId}`)}
                      />
                    ))
                  )}
                </div>
              </div>
            } 
          />
          <Route path="/" element={<Navigate to="/home" replace />} />

          {/* Friends Page Route */}
          <Route 
            path="/friends" 
            element={
              <FriendsPage 
                currentUserId={currentUserId} 
                onProfileClick={(friendId: string) => navigate(`/profile/${friendId}`)}
              />
            } 
          />

          {/* Groups Page Route */}
          <Route 
            path="/groups" 
            element={<GroupsPage currentUserId={currentUserId} />} 
          />

          {/* Reels Page Route */}
          <Route 
            path="/reels" 
            element={<ReelsPage currentUserId={currentUserId} />} 
          />

          {/* Dynamic Profile Page Route */}
          <Route 
            path="/profile/:userId" 
            element={<ProfileRouteWrapper currentUserId={currentUserId} />} 
          />

          {/* Catch-all: any unmatched path (e.g. leftover /verify right after verification) goes home */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>

      <CreatePostModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        userDisplayName={userDisplayName}
        onPostCreated={() => {}}
      />
    </div>
  );
};

// Helper component to extract the dynamic :userId param for the ProfilePage
const ProfileRouteWrapper: React.FC<{ currentUserId: string }> = ({ currentUserId }) => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  return (
    <ProfilePage
      currentUserId={currentUserId}
      profileUserId={userId || currentUserId}
      onProfileClick={(clickedUserId: string) => navigate(`/profile/${clickedUserId}`)}
    />
  );
};

export default Home;