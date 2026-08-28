import React, { useState } from 'react';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialData: {
    bio?: string;
    work?: string;
    education?: string;
    currentCity?: string;
    hometown?: string;
    relationshipStatus?: string;
  };
  onSaved: (updatedFields: any) => void;
}

const RELATIONSHIP_OPTIONS = [
  'Prefer not to say',
  'Single',
  'In a relationship',
  "It's complicated",
  'Engaged',
  'Married',
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  userId,
  initialData,
  onSaved,
}) => {
  const [bio, setBio] = useState(initialData.bio || '');
  const [work, setWork] = useState(initialData.work || '');
  const [education, setEducation] = useState(initialData.education || '');
  const [currentCity, setCurrentCity] = useState(initialData.currentCity || '');
  const [hometown, setHometown] = useState(initialData.hometown || '');
  const [relationshipStatus, setRelationshipStatus] = useState(
    initialData.relationshipStatus || 'Prefer not to say'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);

    const updatedFields = {
      bio: bio.trim(),
      work: work.trim(),
      education: education.trim(),
      currentCity: currentCity.trim(),
      hometown: hometown.trim(),
      relationshipStatus,
    };

    try {
      await updateDoc(doc(db, 'users', userId), updatedFields);
      onSaved(updatedFields);
      onClose();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Could not save your changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-[#1c1e21]">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:bg-gray-100 rounded-full p-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4 overflow-y-auto">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="Tell people a little about yourself"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1877f2] resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/200</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Workplace</label>
            <input
              type="text"
              value={work}
              onChange={(e) => setWork(e.target.value)}
              placeholder="Where do you work?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1877f2]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Education</label>
            <input
              type="text"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="Where did you study?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1877f2]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Current city</label>
            <input
              type="text"
              value={currentCity}
              onChange={(e) => setCurrentCity(e.target.value)}
              placeholder="Where do you live?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1877f2]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Hometown</label>
            <input
              type="text"
              value={hometown}
              onChange={(e) => setHometown(e.target.value)}
              placeholder="Where are you from?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1877f2]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Relationship status
            </label>
            <select
              value={relationshipStatus}
              onChange={(e) => setRelationshipStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1877f2] bg-white"
            >
              {RELATIONSHIP_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg font-semibold text-sm text-gray-700 hover:bg-gray-100 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg font-semibold text-sm bg-[#1877f2] hover:bg-[#166fe5] text-white cursor-pointer disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;