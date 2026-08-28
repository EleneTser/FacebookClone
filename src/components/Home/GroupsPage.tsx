import React from 'react';

interface GroupsPageProps {
  currentUserId?: string; // Made optional with '?' so it never throws a type error
}

export const GroupsPage: React.FC<GroupsPageProps> = ({ currentUserId }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-[#1c1e21]">Groups</h1>
      <p className="text-gray-500 text-sm mt-1">Discover and join groups (User ID: {currentUserId})</p>
    </div>
  );
};