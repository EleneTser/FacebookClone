import React, { useEffect, useRef, useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { uploadImageToCloudinary } from './cloudinaryService'; // Adjust path if needed
import { fetchAcceptedFriends } from './friendsHelper';
import type { FriendSummary } from './friendsHelper';
import { EmojiPicker } from './EmojiPicker';
import { useUserAvatar } from './useUserAvatar';
import Pfp from '../../assets/PFP.png';

export type PostVisibility = 'public' | 'friends' | 'only_me';

const VISIBILITY_OPTIONS: { value: PostVisibility; label: string; icon: string; description: string }[] = [
  { value: 'public', label: 'Public', icon: 'public', description: 'Anyone on or off Facebook' },
  { value: 'friends', label: 'Friends', icon: 'group', description: 'Your friends only' },
  { value: 'only_me', label: 'Only me', icon: 'lock', description: 'Only you can see this' },
];

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  userDisplayName: string;
  onPostCreated: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  userDisplayName,
  onPostCreated,
}) => {
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null); // local preview (instant)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null); // final Cloudinary URL
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Privacy / visibility
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const visibilityRef = useRef<HTMLDivElement>(null);

  // Friend tagging
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [taggedFriends, setTaggedFriends] = useState<FriendSummary[]>([]);
  const tagPickerRef = useRef<HTMLDivElement>(null);

  // Emoji
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentUserId = auth.currentUser?.uid;
  const liveAvatar = useUserAvatar(currentUserId, auth.currentUser?.photoURL);

  // Load the poster's friends once the modal opens, for tagging
  useEffect(() => {
    if (!isOpen || !currentUserId) return;
    setFriendsLoading(true);
    fetchAcceptedFriends(currentUserId)
      .then(setFriends)
      .catch((err) => console.error('Error loading friends for tagging:', err))
      .finally(() => setFriendsLoading(false));
  }, [isOpen, currentUserId]);

  // Close the visibility / tag dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (visibilityRef.current && !visibilityRef.current.contains(e.target as Node)) {
        setShowVisibilityMenu(false);
      }
      if (tagPickerRef.current && !tagPickerRef.current.contains(e.target as Node)) {
        setShowTagPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const resetImageState = () => {
    setImagePreview(null);
    setUploadedImageUrl(null);
    setUploadError(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    // Show an instant local preview while the real upload happens in the background
    const localPreviewUrl = URL.createObjectURL(file);
    setImagePreview(localPreviewUrl);
    setUploadedImageUrl(null);
    setUploadError(null);
    setIsUploadingImage(true);

    try {
      const url = await uploadImageToCloudinary(file);
      setUploadedImageUrl(url);
    } catch (err) {
      console.error('Error uploading post image:', err);
      setUploadError('Could not upload image. Try again.');
      setImagePreview(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const toggleTaggedFriend = (friend: FriendSummary) => {
    setTaggedFriends((prev) =>
      prev.some((f) => f.uid === friend.uid)
        ? prev.filter((f) => f.uid !== friend.uid)
        : [...prev, friend]
    );
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((prev) => prev + emoji);
      return;
    }
    const start = textarea.selectionStart ?? content.length;
    const end = textarea.selectionEnd ?? content.length;
    const next = content.slice(0, start) + emoji + content.slice(end);
    setContent(next);
    // Restore focus/cursor after the inserted emoji on the next tick
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + emoji.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !uploadedImageUrl) return;
    if (isUploadingImage) return; // wait for the upload to finish first

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Ensure we use the full display name available from props or auth
    const fullName = userDisplayName || currentUser.displayName || 'Facebook User';

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'posts'), {
        userId: currentUser.uid,
        userDisplayName: fullName, // <-- Saves full name and last name properly
        userAvatar: liveAvatar || currentUser.photoURL || Pfp,
        content: content.trim(),
        image: uploadedImageUrl || null,
        visibility, // 'public' | 'friends' | 'only_me'
        taggedFriends: taggedFriends.map((f) => ({
          uid: f.uid,
          firstName: f.firstName,
          lastName: f.lastName || '',
        })),
        createdAt: serverTimestamp(),
      });

      setContent('');
      resetImageState();
      setTaggedFriends([]);
      setVisibility('public');
      onPostCreated();
      onClose();
    } catch (err) {
      console.error("Error creating post:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const initials = userDisplayName
    ? userDisplayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'FB';

  const canSubmit = !isUploadingImage && !isSubmitting && (content.trim() || uploadedImageUrl);

  const selectedVisibility = VISIBILITY_OPTIONS.find((v) => v.value === visibility)!;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden text-[#050505] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 relative">
          <h2 className="text-xl font-bold text-center w-full text-[#1c1e21]">Create post</h2>
          <button
            onClick={onClose}
            className="absolute right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* User Info Bar */}
        <div className="flex items-center gap-3 px-4 pt-4">
          <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
            {liveAvatar && liveAvatar !== Pfp ? (
              <img src={liveAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            <h4 className="font-semibold text-sm text-[#1c1e21]">
              {userDisplayName}
              {taggedFriends.length > 0 && (
                <span className="font-normal text-gray-500">
                  {' '}with {taggedFriends.map((f) => f.firstName).join(', ')}
                </span>
              )}
            </h4>

            {/* Visibility selector */}
            <div className="relative" ref={visibilityRef}>
              <button
                type="button"
                onClick={() => setShowVisibilityMenu((v) => !v)}
                className="flex items-center gap-1 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-0.5 rounded font-medium text-gray-700 cursor-pointer transition"
              >
                <span className="material-symbols-outlined text-[13px]">{selectedVisibility.icon}</span>
                {selectedVisibility.label}
                <span className="material-symbols-outlined text-[13px]">expand_more</span>
              </button>

              {showVisibilityMenu && (
                <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-30">
                  {VISIBILITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setVisibility(opt.value);
                        setShowVisibilityMenu(false);
                      }}
                      className={`w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-gray-100 cursor-pointer ${
                        visibility === opt.value ? 'bg-gray-50' : ''
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px] text-gray-600 mt-0.5">{opt.icon}</span>
                      <span>
                        <span className="block text-sm font-semibold text-[#1c1e21]">{opt.label}</span>
                        <span className="block text-xs text-gray-500">{opt.description}</span>
                      </span>
                      {visibility === opt.value && (
                        <span className="material-symbols-outlined text-[16px] text-blue-600 ml-auto self-center">
                          check
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Post Input Form */}
        <form onSubmit={handleSubmit} className="p-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`What's on your mind, ${userDisplayName?.split(' ')[0] || 'User'}?`}
            rows={4}
            className="w-full resize-none outline-none text-[#1c1e21] placeholder-gray-500 text-base"
          />

          {/* Hidden file input, triggered by the photo/video button below */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative mt-3 mb-2 rounded-lg overflow-hidden border border-gray-200">
              <img src={imagePreview} alt="Preview" className="w-full max-h-72 object-contain bg-black" />

              {isUploadingImage && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">Uploading...</span>
                </div>
              )}

              <button
                type="button"
                onClick={resetImageState}
                disabled={isUploadingImage}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer disabled:opacity-50"
                title="Remove photo"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}

          {uploadError && (
            <p className="text-xs text-red-600 mt-1 mb-2">{uploadError}</p>
          )}

          {/* Tagged friends chips */}
          {taggedFriends.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {taggedFriends.map((f) => (
                <span
                  key={f.uid}
                  className="flex items-center gap-1 bg-[#e7f3ff] text-[#1877f2] text-xs font-semibold px-2 py-1 rounded-full"
                >
                  {f.firstName}
                  <button
                    type="button"
                    onClick={() => toggleTaggedFriend(f)}
                    className="cursor-pointer hover:opacity-70"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add to your post toolbar */}
          <div className="flex items-center justify-between border border-gray-200 rounded-lg p-3 mt-4 mb-4">
            <span className="font-semibold text-sm text-gray-700">Add to your post</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-green-500 transition cursor-pointer"
                title="Add photo"
              >
                <span className="material-symbols-outlined text-[22px]">photo_library</span>
              </button>

              {/* Tag friends */}
              <div className="relative" ref={tagPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowTagPicker((v) => !v)}
                  className={`w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition cursor-pointer ${
                    taggedFriends.length > 0 ? 'text-blue-600' : 'text-blue-500'
                  }`}
                  title="Tag friends"
                >
                  <span className="material-symbols-outlined text-[22px]">person_add</span>
                </button>

                {showTagPicker && (
                  <div className="absolute right-0 top-full mt-2 w-64 max-h-72 overflow-y-auto bg-white rounded-lg shadow-2xl border border-gray-200 z-30 p-2">
                    <p className="text-xs font-semibold text-gray-500 px-2 pb-2">Tag friends</p>
                    {friendsLoading ? (
                      <p className="text-xs text-gray-400 px-2 py-3 text-center">Loading friends...</p>
                    ) : friends.length === 0 ? (
                      <p className="text-xs text-gray-400 px-2 py-3 text-center">No friends to tag yet.</p>
                    ) : (
                      friends.map((f) => {
                        const isTagged = taggedFriends.some((t) => t.uid === f.uid);
                        return (
                          <button
                            key={f.uid}
                            type="button"
                            onClick={() => toggleTaggedFriend(f)}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-gray-100 cursor-pointer ${
                              isTagged ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                              {f.profileImage ? (
                                <img src={f.profileImage} alt={f.firstName} className="w-full h-full object-cover" />
                              ) : (
                                f.firstName?.[0]?.toUpperCase()
                              )}
                            </div>
                            <span className="text-sm text-[#1c1e21] flex-1 truncate">
                              {f.firstName} {f.lastName}
                            </span>
                            {isTagged && (
                              <span className="material-symbols-outlined text-[16px] text-blue-600">check</span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Emoji picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-yellow-500 transition cursor-pointer"
                  title="Add emoji"
                >
                  <span className="material-symbols-outlined text-[22px]">sentiment_satisfied</span>
                </button>
                {showEmojiPicker && (
                  <EmojiPicker
                    onSelect={(emoji) => insertEmoji(emoji)}
                    onClose={() => setShowEmojiPicker(false)}
                    className="right-0 bottom-full mb-2"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full py-2.5 rounded-lg font-semibold text-sm transition ${
              !canSubmit
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#1877f2] hover:bg-[#166fe5] text-white cursor-pointer shadow'
            }`}
          >
            {isSubmitting ? 'Posting...' : isUploadingImage ? 'Uploading photo...' : 'Post'}
          </button>
        </form>

      </div>
    </div>
  );
};