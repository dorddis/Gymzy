import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  increment,
  Timestamp 
} from 'firebase/firestore';

export interface WorkoutPost {
  id: string;
  workoutId: string;
  userId: string;
  caption?: string;
  hashtags: string[];
  mentions: string[];
  visibility: 'public' | 'private' | 'friends';
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Workout data for display
  workoutData?: {
    name: string;
    duration: number;
    exercises: any[];
    totalVolume?: number;
  };
  // User data for display
  userData?: {
    displayName: string;
    profilePicture?: string;
  };
}

export interface WorkoutInteraction {
  id: string;
  workoutPostId: string;
  userId: string;
  type: 'like' | 'comment' | 'share';
  content?: string; // For comments
  createdAt: Timestamp;
}

export interface WorkoutComment {
  id: string;
  workoutPostId: string;
  userId: string;
  content: string;
  createdAt: Timestamp;
  userData?: {
    displayName: string;
    profilePicture?: string;
  };
}

// Share a workout
export const shareWorkout = async (
  workoutId: string,
  userId: string,
  options: {
    caption?: string;
    hashtags?: string[];
    mentions?: string[];
    visibility?: 'public' | 'private' | 'friends';
  } = {}
): Promise<string> => {
  try {
    const postId = `${userId}_${workoutId}_${Date.now()}`;
    
    const workoutPost: WorkoutPost = {
      id: postId,
      workoutId,
      userId,
      caption: options.caption || '',
      hashtags: options.hashtags || [],
      mentions: options.mentions || [],
      visibility: options.visibility || 'public',
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const postRef = doc(db, 'workout_posts', postId);
    await setDoc(postRef, workoutPost);

    return postId;
  } catch (error) {
    console.error('Error sharing workout:', error);
    throw error;
  }
};

// Get workout posts for feed
export const getWorkoutFeed = async (
  userId: string,
  limitCount: number = 20
): Promise<WorkoutPost[]> => {
  try {
    // For now, get all public posts. Later we&apos;ll filter by following
    const postsQuery = query(
      collection(db, 'workout_posts'),
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(postsQuery);
    const posts: WorkoutPost[] = [];

    for (const docSnap of querySnapshot.docs) {
      const postData = docSnap.data() as WorkoutPost;
      
      // Get workout data
      const workoutRef = doc(db, 'workouts', postData.workoutId);
      const workoutSnap = await getDoc(workoutRef);
      if (workoutSnap.exists()) {
        postData.workoutData = workoutSnap.data() as any;
      }

      // Get user data
      const userRef = doc(db, 'user_profiles', postData.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        postData.userData = {
          displayName: userData.displayName,
          profilePicture: userData.profilePicture
        };
      }

      posts.push(postData);
    }

    return posts;
  } catch (error) {
    console.error('Error getting workout feed:', error);
    return [];
  }
};

// Like a workout post
export const likeWorkoutPost = async (postId: string, userId: string): Promise<void> => {
  try {
    const interactionId = `${userId}_${postId}_like`;
    const interactionRef = doc(db, 'workout_interactions', interactionId);
    
    // Check if already liked
    const existingLike = await getDoc(interactionRef);
    if (existingLike.exists()) {
      return; // Already liked
    }

    const interaction: WorkoutInteraction = {
      id: interactionId,
      workoutPostId: postId,
      userId,
      type: 'like',
      createdAt: Timestamp.now()
    };

    await setDoc(interactionRef, interaction);

    // Update like count
    const postRef = doc(db, 'workout_posts', postId);
    await updateDoc(postRef, {
      likesCount: increment(1)
    });

  } catch (error) {
    console.error('Error liking workout post:', error);
    throw error;
  }
};

// Unlike a workout post
export const unlikeWorkoutPost = async (postId: string, userId: string): Promise<void> => {
  try {
    const interactionId = `${userId}_${postId}_like`;
    const interactionRef = doc(db, 'workout_interactions', interactionId);
    
    await deleteDoc(interactionRef);

    // Update like count
    const postRef = doc(db, 'workout_posts', postId);
    await updateDoc(postRef, {
      likesCount: increment(-1)
    });

  } catch (error) {
    console.error('Error unliking workout post:', error);
    throw error;
  }
};

// Check if user has liked a post
export const hasUserLikedPost = async (postId: string, userId: string): Promise<boolean> => {
  try {
    const interactionId = `${userId}_${postId}_like`;
    const interactionRef = doc(db, 'workout_interactions', interactionId);
    const interactionSnap = await getDoc(interactionRef);
    
    return interactionSnap.exists();
  } catch (error) {
    console.error('Error checking like status:', error);
    return false;
  }
};

// Add comment to workout post
export const addWorkoutComment = async (
  postId: string,
  userId: string,
  content: string
): Promise<string> => {
  try {
    const commentId = `${userId}_${postId}_${Date.now()}`;
    
    const interaction: WorkoutInteraction = {
      id: commentId,
      workoutPostId: postId,
      userId,
      type: 'comment',
      content,
      createdAt: Timestamp.now()
    };

    const interactionRef = doc(db, 'workout_interactions', commentId);
    await setDoc(interactionRef, interaction);

    // Update comment count
    const postRef = doc(db, 'workout_posts', postId);
    await updateDoc(postRef, {
      commentsCount: increment(1)
    });

    return commentId;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// Get comments for a workout post
export const getWorkoutComments = async (postId: string): Promise<WorkoutComment[]> => {
  try {
    const commentsQuery = query(
      collection(db, 'workout_interactions'),
      where('workoutPostId', '==', postId),
      where('type', '==', 'comment'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(commentsQuery);
    const comments: WorkoutComment[] = [];

    for (const docSnap of querySnapshot.docs) {
      const commentData = docSnap.data() as WorkoutInteraction;
      
      // Get user data
      const userRef = doc(db, 'user_profiles', commentData.userId);
      const userSnap = await getDoc(userRef);
      
      const comment: WorkoutComment = {
        id: commentData.id,
        workoutPostId: commentData.workoutPostId,
        userId: commentData.userId,
        content: commentData.content || '',
        createdAt: commentData.createdAt
      };

      if (userSnap.exists()) {
        const userData = userSnap.data();
        comment.userData = {
          displayName: userData.displayName,
          profilePicture: userData.profilePicture
        };
      }

      comments.push(comment);
    }

    return comments;
  } catch (error) {
    console.error('Error getting comments:', error);
    return [];
  }
};

// Get user&apos;s shared workouts
export const getUserWorkoutPosts = async (userId: string): Promise<WorkoutPost[]> => {
  try {
    const postsQuery = query(
      collection(db, 'workout_posts'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(postsQuery);
    const posts: WorkoutPost[] = [];

    for (const docSnap of querySnapshot.docs) {
      const postData = docSnap.data() as WorkoutPost;
      
      // Get workout data
      const workoutRef = doc(db, 'workouts', postData.workoutId);
      const workoutSnap = await getDoc(workoutRef);
      if (workoutSnap.exists()) {
        postData.workoutData = workoutSnap.data() as any;
      }

      posts.push(postData);
    }

    return posts;
  } catch (error) {
    console.error('Error getting user workout posts:', error);
    return [];
  }
};

export default {
  shareWorkout,
  getWorkoutFeed,
  likeWorkoutPost,
  unlikeWorkoutPost,
  hasUserLikedPost,
  addWorkoutComment,
  getWorkoutComments,
  getUserWorkoutPosts
};
