// src/services/postsService.ts
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import mockData from '../../data.json';

export const fetchAllPosts = (onPostsUpdate: (posts: any[]) => void) => {
  // 1. Format your JSON posts to map user details, likes, and comments
  const formattedMockPosts = mockData.posts.map((post: any) => {
    // Find the post author
    const author = mockData.users.find((u: any) => u.id === post.userId);

    // Map likes (array of user IDs) to full user info or count
    const formattedLikes = post.likes.map((userId: string) => {
      return mockData.users.find((u: any) => u.id === userId);
    }).filter(Boolean);

    // Map comments to include user profile data (name, avatar, username)
    const formattedComments = post.comments.map((comment: any) => {
      const commenter = mockData.users.find((u: any) => u.id === comment.userId);
      return {
        id: comment.id,
        text: comment.text,
        userId: comment.userId,
        userDisplayName: commenter ? commenter.name : 'Facebook User',
        userAvatar: commenter ? commenter.profileImage : '/images/users/Girl1.jpg',
      };
    });

    return {
      id: post.id,
      userId: post.userId,
      userDisplayName: author ? author.name : 'Facebook User',
      userAvatar: author ? author.profileImage : '/images/users/Girl1.jpg',
      content: post.description, // Maps json description to content
      image: post.image || null,
      createdAt: post.createdAt, // e.g. "2 hours ago"
      likes: formattedLikes,      // Full array of users who liked
      comments: formattedComments // Full array of comments with user metadata
    };
  });

  // 2. Listen to live Firestore posts and merge them with mock data
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const livePosts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Combine mock posts and live posts
    onPostsUpdate([...formattedMockPosts, ...livePosts]);
  });

  return unsubscribe;
};