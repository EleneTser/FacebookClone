// src/components/home/Navbar.tsx
import React, { useState, useRef, useEffect } from 'react';
import Fblogo from '../../assets/Icons/Facebook-Logosu.png';
import { collection, getDocs, query, orderBy, where, getDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase'; // Adjust path if your firebase.ts is located elsewhere
import { auth } from '../../firebase';
import { FloatingChatBox } from './FloatingChatBox';
import staticData from '../../data.json'; // Adjust path depending on where Navbar.tsx is located relative to data.json
import { useNavigate } from 'react-router-dom';
import { useUserAvatar } from './useUserAvatar';

// Import tab icons and active icons
import home from '../../assets/Icons/Home.png';
import homeactive from '../../assets/Icons/Homeactive.png';
import friends from '../../assets/Icons/Friends.png';
import friendsActive from '../../assets/Icons/FriendsActive.png';
import reels from '../../assets/Icons/Reels.png';
import reelsActive from '../../assets/Icons/ReelsActive.png';
import groups from '../../assets/Icons/Groups.png';
import groupsActive from '../../assets/Icons/GroupsActive.png';

// Import right-side custom image assets
import menu from '../../assets/Icons/menu.png';
import messenger from '../../assets/Icons/messenger.png';
import notification from '../../assets/Icons/Notification.png';
import Pfp from '../../assets/PFP.png';

interface NavbarProps {
  currentUserId: string;
  userDisplayName: string;
  userAvatar?: string;
  onProfileClick: () => void;
  onSelectUser: (userId: string) => void;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface UserProfile {
  uid?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  name?: string;
  email?: string;
  [key: string]: any; // Allows any extra properties from data.json
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUserId,
  userDisplayName,
  userAvatar,
  onProfileClick,
  onSelectUser,
  onLogout,
  activeTab,
  setActiveTab,
}) => {
    const STATIC_USERS = staticData.users || [];
    const navigate = useNavigate();

    // Always prefer the live profile picture; falls back to the PFP
    // default (or whatever was passed in as `userAvatar`) if none is set.
    const liveOwnAvatar = useUserAvatar(currentUserId, userAvatar);

  const [showDropdown, setShowDropdown] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showMessengerDropdown, setShowMessengerDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Initialize allUsers with STATIC_USERS so they are searchable right away
const [allUsers, setAllUsers] = useState<any[]>([...STATIC_USERS]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [friendReqNotifications, setFriendReqNotifications] = useState<any[]>([]);
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [messengerFriends, setMessengerFriends] = useState<any[]>([]);

  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const messengerRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);


  
  

  // 1. Fetch all users from Firestore and combine with static users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const fetched: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as UserProfile;
          fetched.push({ ...data, uid: doc.id });
        });
        
        // Combine static JSON users and Firestore users together
        setAllUsers([...STATIC_USERS, ...fetched]);
      } catch (err) {
        console.error('Error fetching users from Firestore:', err);
      }
    };
    fetchUsers();
  }, []);

  // Real-time listener for incoming pending friend requests
  useEffect(() => {
    const activeUid = currentUserId || auth.currentUser?.uid;
    if (!activeUid) return;

    const q = query(
      collection(db, 'friendRequests'),
      where('receiverId', '==', activeUid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const notifs = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const senderDoc = await getDoc(doc(db, 'users', data.senderId));
            const senderInfo = senderDoc.exists() ? senderDoc.data() : { firstName: 'Someone', lastName: '' };
            return {
              id: docSnap.id,
              text: `${senderInfo.firstName} ${senderInfo.lastName || ''} sent you a friend request.`,
            };
          })
        );
        setFriendReqNotifications(notifs);
      } catch (err) {
        console.error('Error processing real-time notifications:', err);
      }
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // 2. Filter users based on searchQuery input
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers([]);
      return;
    }
    const term = searchQuery.toLowerCase().trim();
    const results = allUsers.filter((u) => {
      const first = u.firstName?.toLowerCase() || '';
      const last = u.lastName?.toLowerCase() || '';
      const displayName = u.displayName?.toLowerCase() || '';
      const name = u.name?.toLowerCase() || ''; // Handles your data.json 'name' field
      const email = u.email?.toLowerCase() || '';

      return (
        first.includes(term) || 
        last.includes(term) || 
        displayName.includes(term) || 
        name.includes(term) || 
        email.includes(term)
      );
    });
    setFilteredUsers(results);
  }, [searchQuery, allUsers]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenuDropdown(false);
      }
      if (messengerRef.current && !messengerRef.current.contains(event.target as Node)) {
        setShowMessengerDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotificationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Extracts just the first and last name from userDisplayName
  const getFirstAndLastName = (name: string) => {
    if (!name) return 'User';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[parts.length - 1]}`;
    }
    return parts[0];
  };

  const firstNameLastName = getFirstAndLastName(userDisplayName);

  const tabs = [
    { id: 'home', icon: home, activeIcon: homeactive },
    { id: 'friends', icon: friends, activeIcon: friendsActive },
    { id: 'watch', icon: reels, activeIcon: reelsActive },
    { id: 'marketplace', icon: groups, activeIcon: groupsActive },
  ];

  const handleOpenChat = (friend: any) => {
    // Avoid duplicate windows for the same friend
    if (!activeChats.some((c) => c.uid === friend.uid)) {
      setActiveChats([...activeChats, friend]);
    }
  };

  useEffect(() => {
    const fetchMessengerFriends = async () => {
      const activeUid = currentUserId || auth.currentUser?.uid;
      if (!activeUid) return;

      try {
        const q1 = query(collection(db, 'friendRequests'), where('senderId', '==', activeUid), where('status', '==', 'accepted'));
        const q2 = query(collection(db, 'friendRequests'), where('receiverId', '==', activeUid), where('status', '==', 'accepted'));

        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

        const friendIds = new Set<string>();
        snap1.docs.forEach((d) => friendIds.add(d.data().receiverId));
        snap2.docs.forEach((d) => friendIds.add(d.data().senderId));

        const friendList = await Promise.all(
          Array.from(friendIds).map(async (fId) => {
            const userDoc = await getDoc(doc(db, 'users', fId));
            return { uid: fId, ...(userDoc.exists() ? userDoc.data() : { firstName: 'User', lastName: '' }) };
          })
        );

        setMessengerFriends(friendList);
      } catch (err) {
        console.error('Error fetching messenger friends:', err);
      }
    };

    if (showMessengerDropdown) {
      fetchMessengerFriends();
    }
  }, [showMessengerDropdown, currentUserId]);

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between bg-white shadow-sm px-4">
      {/* Left: Logo & Search Bar */}
      <div className="flex items-center gap-2 relative">
        <img src={Fblogo} alt="Facebook Logo" className="w-[90px] h-[50px] object-contain" />

        <div ref={searchRef} className="relative">
          <div className="flex items-center rounded-full bg-[#f0f2f5] px-3 py-2 text-[#65676b] w-[240px]">
            <span className="material-symbols-outlined text-[20px] mr-2">search</span>
            <input
              type="text"
              placeholder="Search Facebook"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="bg-transparent text-[15px] outline-none placeholder-[#65676b] text-[#1c1e21] w-full"
            />
          </div>

          {/* Search Popup Dropdown covering both Logo and Search */}
          {isSearchFocused && (
            <div className="absolute -top-2 -left-[106px] w-[340px] bg-white rounded-lg shadow-xl border border-gray-100 pt-3 pb-4 z-50 max-h-96 overflow-y-auto">
              <div className="flex items-center px-3 mb-2 gap-2">
                <button
                  onClick={() => setIsSearchFocused(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-[#65676b] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                </button>
                <div className="flex items-center rounded-full bg-[#f0f2f5] px-3 py-2 text-[#65676b] flex-1">
                  <span className="material-symbols-outlined text-[20px] mr-2">search</span>
                  <input
                    type="text"
                    placeholder="Search Facebook"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="bg-transparent text-[15px] outline-none placeholder-[#65676b] text-[#1c1e21] w-full"
                  />
                </div>
              </div>

              {/* Dynamic User Search Results */}
              <div className="mt-2">
                {searchQuery.trim() === '' ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">No recent searches</div>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <SearchResultRow
                      key={user.uid || user.id}
                      user={user}
                      onClick={() => {
                        setSearchQuery('');
                        setIsSearchFocused(false);
                        onSelectUser(user.uid || user.id || '');
                      }}
                    />
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-gray-500 text-sm">No results for "{searchQuery}"</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

{/* Center Tabs with Images */}
      <div className="flex h-full items-center gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                // Route mapping based on your tab IDs
                if (tab.id === 'home') navigate('/home');
                if (tab.id === 'friends') navigate('/friends');
                if (tab.id === 'watch') navigate('/reels');       // Maps 'watch' tab to /reels route
                if (tab.id === 'marketplace') navigate('/groups'); // Maps 'marketplace' tab to /groups route
              }}
              className={`relative flex h-full w-24 flex-col items-center justify-center rounded-lg transition hover:bg-[#f2f2f2] cursor-pointer ${
                isActive ? 'text-[#1877f2]' : 'text-[#65676b]'
              }`}
            >
              <img src={isActive ? tab.activeIcon : tab.icon} alt="Tab Icon" className="w-7 h-7 object-contain" />
              {isActive && <div className="absolute bottom-0 h-1 w-full bg-[#1877f2] rounded-t-md" />}
            </button>
          );
        })}
      </div>

      {/* Right: Find Friends, Menu, Messenger, Notifications, Profile Dropdown */}
      <div className="flex items-center gap-2">
        {/* Find Friends Button */}
        <button
          onClick={() => setActiveTab('friends')}
          className="hidden xl:flex items-center px-3 py-1.5 rounded-full bg-[#e4e6eb] hover:bg-[#d8dadf] text-[#050505] font-semibold text-sm transition cursor-pointer"
        >
          Find friends
        </button>

        {/* Menu Dropdown Container */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => {
              setShowMenuDropdown(!showMenuDropdown);
              setShowDropdown(false);
              setShowMessengerDropdown(false);
              setShowNotificationDropdown(false);
              setIsSearchFocused(false);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e4e6eb] hover:bg-[#d8dadf] transition cursor-pointer overflow-hidden p-2"
          >
            <img src={menu} alt="Menu" className="w-full h-full object-contain" />
          </button>

          {/* Menu Popup Modal */}
          {showMenuDropdown && (
            <div className="absolute right-0 mt-2 w-[600px] h-[580px] overflow-y-auto rounded-xl bg-white p-4 shadow-2xl border border-gray-200 z-50 text-[#050505] flex gap-4">
              {/* Left Column (Menu contents) */}
              <div className="flex-1 pr-2">
                <h1 className="text-2xl font-bold mb-3 text-[#1c1e21]">Menu</h1>

                {/* Search Menu Input */}
                <div className="flex items-center rounded-full bg-[#f0f2f5] px-3 py-2 text-[#65676b] mb-4">
                  <span className="material-symbols-outlined text-[18px] mr-2">search</span>
                  <input
                    type="text"
                    placeholder="Search menu"
                    className="bg-transparent text-[14px] outline-none placeholder-[#65676b] text-[#1c1e21] w-full"
                  />
                </div>

                {/* Social Section */}
                <div className="mb-4">
                  <h3 className="font-bold text-sm text-[#1c1e21] mb-2">Social</h3>
                  <div className="space-y-1">
                    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">event</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight text-[#1c1e21]">Events</p>
                        <p className="text-xs text-gray-500 leading-tight mt-0.5">
                          Organize or find events and other things to do online and nearby.
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => {
                        setActiveTab('friends');
                        setShowMenuDropdown(false);
                      }}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">group</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight text-[#1c1e21]">Friends</p>
                        <p className="text-xs text-gray-500 leading-tight mt-0.5">Search for friends or people you may know.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">groups</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight text-[#1c1e21]">Groups</p>
                        <p className="text-xs text-gray-500 leading-tight mt-0.5">Connect with people who share your interests.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">newspaper</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight text-[#1c1e21]">News Feed</p>
                        <p className="text-xs text-gray-500 leading-tight mt-0.5">See relevant posts from people and Pages you follow.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">dynamic_feed</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight text-[#1c1e21]">Feeds</p>
                        <p className="text-xs text-gray-500 leading-tight mt-0.5">
                          See the most recent posts from your friends, groups, Pages and more.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">flag</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight text-[#1c1e21]">Pages</p>
                        <p className="text-xs text-gray-500 leading-tight mt-0.5">Discover and connect with businesses on Facebook.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="my-3 border-gray-200" />

                {/* Entertainment Section */}
                <div className="mb-4">
                  <h3 className="font-bold text-sm text-[#1c1e21] mb-2">Entertainment</h3>
                  <div className="space-y-1">
                    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">smart_display</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight text-[#1c1e21]">Reels</p>
                        <p className="text-xs text-gray-500 leading-tight mt-0.5">
                          A Reels destination personalized to your interests and connections.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">sports_esports</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight text-[#1c1e21]">Gaming Video</p>
                        <p className="text-xs text-gray-500 leading-tight mt-0.5">Watch and connect with your favorite games and streamers.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">stadia_controller</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight text-[#1c1e21]">Play games</p>
                        <p className="text-xs text-gray-500 leading-tight mt-0.5">Play your favorite games.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="my-3 border-gray-200" />

                {/* Shopping Section */}
                <div className="mb-4">
                  <h3 className="font-bold text-sm text-[#1c1e21] mb-2">Shopping</h3>
                  <div className="space-y-1">
                    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">payments</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight text-[#1c1e21]">Orders and payments</p>
                        <p className="text-xs text-gray-500 leading-tight mt-0.5">A seamless, secure way to pay on the apps you already use.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">storefront</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight text-[#1c1e21]">Marketplace</p>
                        <p className="text-xs text-gray-500 leading-tight mt-0.5">Buy and sell in your community.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="my-3 border-gray-200" />

                {/* Personal Section */}
                <div className="mb-4">
                  <h3 className="font-bold text-sm text-[#1c1e21] mb-2">Personal</h3>
                  <div className="space-y-1">
                    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">collections</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight text-[#1c1e21]">Recent ad activity</p>
                        <p className="text-xs text-gray-500 leading-tight mt-0.5">See all the ads you interacted with on Facebook.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">history</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight text-[#1c1e21]">Memories</p>
                        <p className="text-xs text-gray-500 leading-tight mt-0.5">Browse your old photos, videos and posts on Facebook.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">bookmark</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight text-[#1c1e21]">Saved</p>
                        <p className="text-xs text-gray-500 leading-tight mt-0.5">Find posts, photos and videos that you saved for later.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="my-3 border-gray-200" />

                {/* Professional Section */}
                <div className="mb-4">
                  <h3 className="font-bold text-sm text-[#1c1e21] mb-2">Professional</h3>
                  <div className="space-y-1">
                    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">bar_chart</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight text-[#1c1e21]">Ads Manager</p>
                        <p className="text-xs text-gray-500 leading-tight mt-0.5">Create, manage and track the performance of your ads.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="my-3 border-gray-200" />

                {/* More from Meta Section */}
                <div className="mb-4">
                  <h3 className="font-bold text-sm text-[#1c1e21] mb-2">More from Meta</h3>
                  <div className="space-y-1">
                    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight text-[#1c1e21]">Meta AI</p>
                        <p className="text-xs text-gray-500 leading-tight mt-0.5">
                          Ask questions, brainstorm ideas, create any image you can imagine and more.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">chat</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight text-[#1c1e21]">WhatsApp</p>
                        <p className="text-xs text-gray-500 leading-tight mt-0.5">Message and call people privately on your computer.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight text-[#1c1e21]">Instagram</p>
                        <p className="text-xs text-gray-500 leading-tight mt-0.5">See everyday moments from people you love.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (Create Section) */}
              <div className="w-[210px] bg-[#f7f8fa] p-3 rounded-xl border border-gray-100 shrink-0">
                <h3 className="font-bold text-lg text-[#1c1e21] mb-3">Create</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-200 transition cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-[#e4e6eb] flex items-center justify-center text-[#050505]">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </div>
                    <span className="font-semibold text-sm">Post</span>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-200 transition cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-[#e4e6eb] flex items-center justify-center text-[#050505]">
                      <span className="material-symbols-outlined text-[18px]">auto_stories</span>
                    </div>
                    <span className="font-semibold text-sm">Story</span>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-200 transition cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-[#e4e6eb] flex items-center justify-center text-[#050505]">
                      <span className="material-symbols-outlined text-[18px]">video_library</span>
                    </div>
                    <span className="font-semibold text-sm">Reel</span>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-200 transition cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-[#e4e6eb] flex items-center justify-center text-[#050505]">
                      <span className="material-symbols-outlined text-[18px]">flag</span>
                    </div>
                    <span className="font-semibold text-sm">Page</span>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-200 transition cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-[#e4e6eb] flex items-center justify-center text-[#050505]">
                      <span className="material-symbols-outlined text-[18px]">campaign</span>
                    </div>
                    <span className="font-semibold text-sm">Ad</span>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-200 transition cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-[#e4e6eb] flex items-center justify-center text-[#050505]">
                      <span className="material-symbols-outlined text-[18px]">group</span>
                    </div>
                    <span className="font-semibold text-sm">Group</span>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-200 transition cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-[#e4e6eb] flex items-center justify-center text-[#050505]">
                      <span className="material-symbols-outlined text-[18px]">event</span>
                    </div>
                    <span className="font-semibold text-sm">Event</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Messenger Dropdown Container */}
        <div className="relative" ref={messengerRef}>
          <button
            onClick={() => {
              setShowMessengerDropdown(!showMessengerDropdown);
              setShowMenuDropdown(false);
              setShowDropdown(false);
              setShowNotificationDropdown(false);
              setIsSearchFocused(false);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e4e6eb] hover:bg-[#d8dadf] transition cursor-pointer overflow-hidden p-2"
          >
            <img src={messenger} alt="Messenger" className="w-full h-full object-contain" />
          </button>

          {/* Messenger Popup Modal */}
          {showMessengerDropdown && (
            <div className="absolute right-0 mt-2 w-[360px] h-[540px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden text-[#050505]">
              {/* Header */}
              <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#1c1e21]">Chats</h2>
                <div className="flex items-center gap-1">
                  <button className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#050505] transition cursor-pointer">
                    <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                  </button>
                  <button className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#050505] transition cursor-pointer">
                    <span className="material-symbols-outlined text-[20px]">open_in_full</span>
                  </button>
                  <button className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#050505] transition cursor-pointer">
                    <span className="material-symbols-outlined text-[20px]">edit_square</span>
                  </button>
                </div>
              </div>

              {/* Search Messenger */}
              <div className="px-3 mb-2">
                <div className="flex items-center rounded-full bg-[#f0f2f5] px-3 py-1.5 text-[#65676b]">
                  <span className="material-symbols-outlined text-[18px] mr-2">search</span>
                  <input
                    type="text"
                    placeholder="Search Messenger"
                    className="bg-transparent text-[14px] outline-none placeholder-[#65676b] text-[#1c1e21] w-full"
                  />
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 px-3 pb-2 overflow-x-auto border-b border-gray-100">
                <button className="px-3 py-1 bg-[#e7f3ff] text-[#1877f2] font-semibold text-xs rounded-full whitespace-nowrap cursor-pointer">
                  All
                </button>
                <button className="px-3 py-1 bg-[#f0f2f5] hover:bg-gray-200 text-[#050505] font-semibold text-xs rounded-full whitespace-nowrap transition cursor-pointer">
                  Unread
                </button>
                <button className="px-3 py-1 bg-[#f0f2f5] hover:bg-gray-200 text-[#050505] font-semibold text-xs rounded-full whitespace-nowrap transition cursor-pointer">
                  Groups
                </button>
              </div>

              {/* Dynamic Friends Chat List */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50 p-2">
                {messengerFriends.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-sm">No friends available to message yet.</div>
                ) : (
                  messengerFriends.map((friend) => (
                    <MessengerFriendRow
                      key={friend.uid}
                      friend={friend}
                      onClick={() => {
                        handleOpenChat(friend);
                        setShowMessengerDropdown(false);
                      }}
                    />
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-gray-100 text-center bg-white">
                <button className="text-[#1877f2] font-semibold text-sm hover:underline cursor-pointer">See all in Messenger</button>
              </div>
            </div>
          )}
        </div>

        {/* Floating Chat Windows Container (Bottom Right Corner) */}
        <div className="fixed bottom-0 right-4 flex items-end gap-3 z-50 pointer-events-none">
          {activeChats.map((chatFriend) => (
            <div key={chatFriend.uid} className="pointer-events-auto">
              <FloatingChatBox
                friend={chatFriend}
                onClose={() => setActiveChats(activeChats.filter((c) => c.uid !== chatFriend.uid))}
              />
            </div>
          ))}
        </div>

        {/* Notifications Dropdown Container */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => {
              setShowNotificationDropdown(!showNotificationDropdown);
              setShowMessengerDropdown(false);
              setShowMenuDropdown(false);
              setShowDropdown(false);
              setIsSearchFocused(false);
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#e4e6eb] hover:bg-[#d8dadf] transition cursor-pointer overflow-hidden p-2"
          >
            <img src={notification} alt="Notifications" className="w-full h-full object-contain" />
            {friendReqNotifications.length > 0 && (
              <span className="absolute top-1 right-1 bg-[#e41e3f] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {friendReqNotifications.length}
              </span>
            )}
          </button>

          {/* Notifications Popup Modal */}
          {showNotificationDropdown && (
            <div className="absolute right-0 mt-2 w-[360px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 p-4 text-[#050505]">
              {/* Header & Options */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-2xl font-bold text-[#1c1e21]">Notifications</h2>
                <button className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#050505] transition cursor-pointer">
                  <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 mb-3">
                <button className="px-3 py-1 bg-[#e7f3ff] text-[#1877f2] font-semibold text-xs rounded-full cursor-pointer">All</button>
                <button className="px-3 py-1 bg-[#f0f2f5] hover:bg-gray-200 text-[#050505] font-semibold text-xs rounded-full transition cursor-pointer">
                  Unread
                </button>
              </div>

              {/* Push Notifications Off Banner */}
              <div className="bg-[#f0f2f5] rounded-xl p-3 mb-3 relative">
                <button className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
                <p className="font-bold text-sm text-[#1c1e21] mb-0.5">Your push notifications are off</p>
                <p className="text-xs text-gray-500 mb-3">Turn on notifications to stay connected</p>
                <div className="flex items-center gap-2">
                  <button className="flex-1 py-1.5 bg-[#e7f3ff] hover:bg-[#dbe7f2] text-[#1877f2] font-semibold text-xs rounded-md transition cursor-pointer">
                    Turn on
                  </button>
                  <button className="flex-1 py-1.5 bg-[#e4e6eb] hover:bg-[#d8dadf] text-[#050505] font-semibold text-xs rounded-md transition cursor-pointer">
                    Not now
                  </button>
                </div>
              </div>

              {/* New Section Title & See All */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-[#1c1e21]">New</span>
                <button className="text-[#1877f2] font-semibold text-xs hover:underline cursor-pointer">See all</button>
              </div>

              {/* Notification Items List */}
              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                {friendReqNotifications.length === 0 ? (
                  <div
                    onClick={() => {
                      setActiveTab('friends');
                      setShowNotificationDropdown(false);
                    }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer relative"
                  >
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full bg-[#1877f2] flex items-center justify-center text-white font-bold text-xl">
                        f
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#303030] border-2 border-white flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-[12px]">notifications</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-xs text-[#1c1e21] leading-snug">
                        See who's also on Facebook. Tap here to get help finding friends.
                      </p>
                      <p className="text-[11px] text-[#1877f2] font-semibold mt-0.5">7h</p>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-[#1877f2] shrink-0"></div>
                  </div>
                ) : (
                  friendReqNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        setActiveTab('friends'); // Takes you straight to the friends page to manage it!
                        setShowNotificationDropdown(false);
                      }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer relative bg-blue-50/40"
                    >
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-full bg-[#1877f2] flex items-center justify-center text-white font-bold text-xl">
                          👤
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#1877f2] border-2 border-white flex items-center justify-center text-white">
                          <span className="material-symbols-outlined text-[12px]">person_add</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-xs font-semibold text-[#1c1e21] leading-snug">{notif.text}</p>
                        <p className="text-[11px] text-[#1877f2] font-semibold mt-0.5">Click to view in Friends tab</p>
                      </div>
                      <div className="w-3 h-3 rounded-full bg-[#1877f2] shrink-0"></div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setShowDropdown(!showDropdown);
              setShowMenuDropdown(false);
              setShowMessengerDropdown(false);
              setShowNotificationDropdown(false);
              setIsSearchFocused(false);
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-full overflow-hidden border border-gray-200 cursor-pointer transition hover:opacity-90"
          >
            <img src={liveOwnAvatar} alt="Profile" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 right-0 bg-[#e4e6eb] border border-white rounded-full p-0.5 flex items-center justify-center">
              <span className="material-symbols-outlined text-[10px] text-[#050505] font-bold">expand_more</span>
            </div>
          </button>

          {/* Facebook Style Profile Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-[360px] rounded-xl bg-white p-3 shadow-2xl border border-gray-200 z-50 text-[#050505]">
              {/* Profile Card Header (Clickable to open profile) */}
              <div
                onClick={() => {
                  onProfileClick();
                  setShowDropdown(false);
                }}
                className="bg-white rounded-xl p-3 shadow-[0_2px_12px_rgba(0,0,0,0.12)] mb-2 border border-gray-100 hover:bg-gray-50 transition cursor-pointer"
              >
                <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                  <img src={liveOwnAvatar} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                  <span className="font-semibold text-base text-[#1c1e21]">{firstNameLastName}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the parent card click if you want separate behavior
                    onProfileClick();
                    setShowDropdown(false);
                  }}
                  className="w-full mt-3 py-2 rounded-md bg-[#e7f3ff] text-[#1877f2] font-semibold text-sm hover:bg-[#dbe7f2] transition cursor-pointer"
                >
                  See your profile
                </button>
              </div>

              {/* Menu Items */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer text-left"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e4e6eb]">
                    <span className="material-symbols-outlined text-[20px] text-[#050505]">logout</span>
                  </span>
                  <span className="font-semibold text-sm text-[#1c1e21]">Log Out</span>
                </button>
              </div>

              {/* Footer Links */}
              <div className="mt-3 pt-2 border-t border-gray-200 text-[11px] text-gray-500 px-1 leading-relaxed">
                Privacy · Terms · Advertising · Ad Choices · Cookies · More
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// Small helper components so each row can independently resolve its
// own user's live avatar via the hook (hooks can't be called in .map).
const MessengerFriendRow: React.FC<{ friend: any; onClick: () => void }> = ({ friend, onClick }) => {
  const avatar = useUserAvatar(friend.uid, friend.profileImage);
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 rounded-lg transition cursor-pointer relative"
    >
      <div className="w-12 h-12 rounded-full bg-blue-500 text-white shrink-0 flex items-center justify-center font-bold text-lg overflow-hidden">
        {avatar && avatar !== Pfp ? (
          <img src={avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          friend.firstName?.[0]?.toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[#1c1e21] truncate">
          {friend.firstName} {friend.lastName}
        </p>
        <p className="text-xs text-gray-500 truncate">Click to open chat</p>
      </div>
    </div>
  );
};

const SearchResultRow: React.FC<{ user: any; onClick: () => void }> = ({ user, onClick }) => {
  const avatar = useUserAvatar(user.uid || user.id, user.profileImage);
  return (
    <div
      className="flex items-center px-4 py-2.5 hover:bg-gray-100 cursor-pointer transition"
      onClick={onClick}
    >
      <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mr-3 shrink-0 overflow-hidden">
        {avatar && avatar !== Pfp ? (
          <img src={avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          user.firstName?.[0]?.toUpperCase() || 'U'
        )}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm text-[#1c1e21] truncate">
          {user.name || `${user.firstName || ''} ${user.lastName || ''}`}
        </p>
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
      </div>
    </div>
  );
};

export default Navbar;