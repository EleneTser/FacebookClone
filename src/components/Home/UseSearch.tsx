// src/components/UserSearch.tsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';

interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
}

// 1. Define your static/mock users here
const STATIC_USERS: UserProfile[] = [
  {
    uid: 'mock_user_1',
    firstName: 'Ana',
    lastName: 'Giorgadze',
    displayName: 'Ana Giorgadze',
    email: 'ana@example.com',
  },
  {
    uid: 'mock_user_2',
    firstName: 'Nika',
    lastName: 'Beridze',
    displayName: 'Nika Beridze',
    email: 'nika@example.com',
  },
  // Add more static users here if needed
];

export const UserSearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [firestoreUsers, setFirestoreUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch users from Firestore on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'users'), orderBy('firstName'));
        const querySnapshot = await getDocs(q);
        
        const fetchedUsers: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
          fetchedUsers.push({ uid: doc.id, ...doc.data() } as UserProfile);
        });
        
        setFirestoreUsers(fetchedUsers);
      } catch (err: any) {
        setError('Failed to load users. Make sure Firestore is initialized.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // 2. Combine static users and Firestore users into a single master list
  const allUsers = [...STATIC_USERS, ...firestoreUsers];

  // 3. Filter combined users based on first name, last name, or display name
  const filteredUsers = allUsers.filter((user) => {
    if (!searchTerm.trim()) return false; // Don't show anything until user types
    const term = searchTerm.toLowerCase();
    const first = user.firstName?.toLowerCase() || '';
    const last = user.lastName?.toLowerCase() || '';
    const full = user.displayName?.toLowerCase() || '';

    return first.includes(term) || last.includes(term) || full.includes(term);
  });

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-md border border-[#ccd0d5] mt-6">
      <h2 className="text-xl font-bold mb-4 text-[#1c1e21]">Search Users</h2>
      
      <input
        type="text"
        placeholder="Search by first or last name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 border border-[#ccd0d5] rounded-xl outline-none focus:border-black text-[15px] mb-4"
      />

      {loading && <p className="text-gray-500 text-sm">Loading users...</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {!loading && !error && searchTerm.trim() && (
        <ul className="space-y-2 max-h-60 overflow-y-auto">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <li 
                key={user.uid} 
                onClick={() => {
                  navigate(`/profile/${user.uid}`);
                  setSearchTerm(''); // Clear search on click
                }}
                className="p-3 bg-gray-50 hover:bg-gray-100 transition rounded-xl border border-gray-100 flex flex-col cursor-pointer"
              >
                <span className="font-semibold text-[#1c1e21]">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-xs text-gray-500">{user.email}</span>
              </li>
            ))
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">No users found.</p>
          )}
        </ul>
      )}
    </div>
  );
};

export default UserSearch;