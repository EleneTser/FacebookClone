import React, { useState, useEffect } from 'react';
import { 
  doc, 
  deleteDoc, 
  updateDoc, 
  collection, 
  addDoc,
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useUserAvatar } from './useUserAvatar';
import Pfp from '../../assets/PFP.png';

interface Comment {
  id: string;
  userId: string;
  userDisplayName: string;
  userAvatar?: string;
  content?: string;
  text?: string;
  createdAt?: any;
}

interface TaggedFriend {
  uid: string;
  firstName: string;
  lastName?: string;
}

interface Post {
  id: string;
  userId: string;
  userDisplayName: string;
  userAvatar?: string;
  content: string;
  image?: string;
  createdAt?: any;
  likes?: (string | { id: string })[];
  comments?: Comment[];
  visibility?: 'public' | 'friends' | 'only_me';
  taggedFriends?: TaggedFriend[];
}

interface PostCardProps {
  post: Post;
  currentUserId: string;
  onProfileClick?: (userId: string) => void;
}

const VISIBILITY_META: Record<string, { icon: string; label: string }> = {
  public: { icon: 'public', label: 'Public' },
  friends: { icon: 'group', label: 'Friends' },
  only_me: { icon: 'lock', label: 'Only me' },
};

export const PostCard: React.FC<PostCardProps> = ({ post, currentUserId, onProfileClick }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  const initialLikes = post.likes || [];
  const [likes, setLikes] = useState<string[]>(
    initialLikes.map(l => (typeof l === 'string' ? l : l.id))
  );
  
  const hasLiked = likes.includes(currentUserId);
  const isAuthor = currentUserId === post.userId;
  const isMockPost = post.id.startsWith('post_');

  // Always resolve the author's *current* avatar rather than trusting
  // whatever was saved on the post when it was created.
  const authorAvatar = useUserAvatar(post.userId, post.userAvatar);
  const visibilityMeta = VISIBILITY_META[post.visibility || 'public'];
  const taggedFriends = post.taggedFriends || [];

  // Fetch comments in real-time for Firestore posts
  useEffect(() => {
    if (isMockPost) return;

    const q = query(collection(db, 'posts', post.id, 'comments'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(commentList);
    });
    return () => unsubscribe();
  }, [post.id, isMockPost]);

  // Handle Delete Post
  const handleDeletePost = async () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        if (!isMockPost) {
          await deleteDoc(doc(db, 'posts', post.id));
        } else {
          window.location.reload(); 
        }
      } catch (err) {
        console.error("Error deleting post:", err);
      }
    }
  };

  // Handle Update Post
  const handleUpdatePost = async () => {
    if (!editContent.trim()) return;
    try {
      if (!isMockPost) {
        await updateDoc(doc(db, 'posts', post.id), {
          content: editContent.trim()
        });
      }
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating post:", err);
    }
  };

  // Handle Like Toggle
  const handleLikeToggle = () => {
    if (hasLiked) {
      setLikes(likes.filter(id => id !== currentUserId));
    } else {
      setLikes([...likes, currentUserId]);
    }
  };

  // Handle Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const newCommentObj: Comment = {
      id: 'comment_' + Date.now(),
      userId: currentUser.uid,
      userDisplayName: currentUser.displayName || 'Facebook User',
      userAvatar: currentUser.photoURL || Pfp,
      content: newComment.trim(),
      createdAt: new Date()
    };

    try {
      if (!isMockPost) {
        await addDoc(collection(db, 'posts', post.id, 'comments'), {
          userId: currentUser.uid,
          userDisplayName: currentUser.displayName || 'Facebook User',
          userAvatar: currentUser.photoURL || Pfp,
          content: newComment.trim(),
          createdAt: serverTimestamp(),
        });
      } else {
        setComments([...comments, newCommentObj]);
      }
      setNewComment('');
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'FB';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 mb-4 text-[#050505]">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => onProfileClick?.(post.userId)}
        >
          <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
            {authorAvatar && authorAvatar !== Pfp ? (
              <img src={authorAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              getInitials(post.userDisplayName)
            )}
          </div>
          <div>
            <h4 className="font-semibold text-sm text-[#1c1e21] group-hover:underline">
              {post.userDisplayName}
              {taggedFriends.length > 0 && (
                <span className="font-normal text-gray-500">
                  {' '}with{' '}
                  {taggedFriends.map((f, idx) => (
                    <span key={f.uid}>
                      <span
                        className="font-semibold text-[#1c1e21] hover:underline cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onProfileClick?.(f.uid);
                        }}
                      >
                        {f.firstName}
                      </span>
                      {idx < taggedFriends.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </span>
              )}
            </h4>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>
                {typeof post.createdAt === 'string' 
                  ? post.createdAt 
                  : post.createdAt?.toDate 
                  ? post.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  : 'Just now'}
              </span>
              <span>·</span>
              <span className="flex items-center gap-0.5" title={visibilityMeta.label}>
                <span className="material-symbols-outlined text-[13px]">{visibilityMeta.icon}</span>
                {visibilityMeta.label}
              </span>
            </div>
          </div>
        </div>

        {/* Edit/Delete Options for Author */}
        {isAuthor && (
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 cursor-pointer"
              title="Edit post"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button 
              onClick={handleDeletePost} 
              className="p-1.5 hover:bg-gray-100 rounded-full text-red-500 cursor-pointer"
              title="Delete post"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Post Body / Content */}
      <div className="px-4 py-2">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg outline-none text-sm"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsEditing(false)} 
                className="px-3 py-1 bg-gray-200 rounded text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdatePost} 
                className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#1c1e21] whitespace-pre-wrap">{post.content}</p>
        )}
      </div>

      {/* Post Image (if any) */}
      {post.image && (
        <div className="mt-2 bg-black max-h-[500px] flex items-center justify-center overflow-hidden">
          <img src={post.image} alt="Post media" className="w-full object-contain max-h-[500px]" />
        </div>
      )}

      {/* Reactions & Comments Count Summary */}
      <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500 border-b border-gray-100 mx-3">
        <span>👍 {likes.length}</span>
        <button onClick={() => setShowComments(!showComments)} className="hover:underline cursor-pointer">
          {comments.length} comments
        </button>
      </div>

      {/* Action Buttons Bar */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-gray-100 mx-2">
        <button 
          onClick={handleLikeToggle}
          className={`flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 rounded-lg font-semibold text-xs sm:text-sm transition cursor-pointer ${hasLiked ? 'text-blue-600' : 'text-gray-600'}`}
        >
          <span className="material-symbols-outlined text-[20px]">thumb_up</span>
          Like
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 rounded-lg text-gray-600 font-semibold text-xs sm:text-sm transition cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">chat</span>
          Comment
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="p-3 bg-gray-50 rounded-b-xl space-y-3">
          {/* Add Comment Input */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-white border border-gray-300 rounded-full px-4 py-1.5 text-xs outline-none focus:border-blue-500"
            />
            <button type="submit" className="text-blue-600 font-semibold text-xs px-3 cursor-pointer">Post</button>
          </form>

          {/* Comment List */}
          <div className="space-y-2 pt-1">
            {comments.map((comment) => (
              <CommentRow key={comment.id} comment={comment} onProfileClick={onProfileClick} getInitials={getInitials} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Small helper component so each comment can independently resolve its
// author's live avatar via the hook (hooks can't be called inside .map).
const CommentRow: React.FC<{
  comment: Comment;
  onProfileClick?: (userId: string) => void;
  getInitials: (name: string) => string;
}> = ({ comment, onProfileClick, getInitials }) => {
  const avatar = useUserAvatar(comment.userId, comment.userAvatar);

  return (
    <div className="flex items-start gap-2 text-xs">
      <div 
        className="w-7 h-7 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
        onClick={() => onProfileClick?.(comment.userId)}
      >
        {avatar && avatar !== Pfp ? (
          <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          getInitials(comment.userDisplayName)
        )}
      </div>
      <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-gray-100 flex-1">
        <span 
          className="font-semibold block text-[#1c1e21] cursor-pointer hover:underline"
          onClick={() => onProfileClick?.(comment.userId)}
        >
          {comment.userDisplayName}
        </span>
        <p className="text-gray-700 mt-0.5">{comment.content || comment.text}</p>
      </div>
    </div>
  );
};