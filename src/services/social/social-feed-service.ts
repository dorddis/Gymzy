import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp 
} from 'firebase/firestore';
import { getUserFollowing } from '@/services/core/user-discovery-service';
import { WorkoutPost } from './workout-sharing-service';

export interface FeedPost extends WorkoutPost {
  score: number; // Algorithm score for ranking
  engagementRate: number;
  recency: number;
  relevanceScore: number;
}

export interface FeedAlgorithmWeights {
  recency: number;
  engagement: number;
  following: number;
  similarity: number;
  trending: number;
}

// Default algorithm weights
const DEFAULT_WEIGHTS: FeedAlgorithmWeights = {
  recency: 0.3,
  engagement: 0.25,
  following: 0.2,
  similarity: 0.15,
  trending: 0.1
};

// Calculate post engagement rate
const calculateEngagementRate = (post: WorkoutPost): number => {
  const totalInteractions = post.likesCount + post.commentsCount + post.sharesCount;
  const hoursOld = (Date.now() - post.createdAt.toMillis()) / (1000 * 60 * 60);
  
  // Normalize by time to account for newer posts having less time to accumulate engagement
  const timeNormalizedEngagement = totalInteractions / Math.max(hoursOld, 1);
  
  // Scale to 0-1 range (assuming max 10 interactions per hour is excellent)
  return Math.min(timeNormalizedEngagement / 10, 1);
};

// Calculate recency score
const calculateRecencyScore = (post: WorkoutPost): number => {
  const hoursOld = (Date.now() - post.createdAt.toMillis()) / (1000 * 60 * 60);
  
  // Posts are most relevant in first 24 hours, then decay
  if (hoursOld <= 24) {
    return 1 - (hoursOld / 24) * 0.5; // Decay from 1 to 0.5 in first 24 hours
  } else {
    return Math.max(0.5 - ((hoursOld - 24) / 168) * 0.5, 0); // Decay from 0.5 to 0 over next week
  }
};

// Calculate similarity score based on user preferences
const calculateSimilarityScore = async (post: WorkoutPost, userId: string): Promise<number> => {
  try {
    // Get user's profile to compare interests
    const userProfileRef = doc(db, 'user_profiles', userId);
    const userProfileSnap = await getDoc(userProfileRef);
    
    if (!userProfileSnap.exists()) return 0;
    
    const userProfile = userProfileSnap.data();
    const userGoals = userProfile.fitnessGoals || [];
    const userWorkoutTypes = userProfile.preferredWorkoutTypes || [];
    
    // Get post author's profile
    const postAuthorRef = doc(db, 'user_profiles', post.userId);
    const postAuthorSnap = await getDoc(postAuthorRef);
    
    if (!postAuthorSnap.exists()) return 0;
    
    const postAuthorProfile = postAuthorSnap.data();
    const authorGoals = postAuthorProfile.fitnessGoals || [];
    const authorWorkoutTypes = postAuthorProfile.preferredWorkoutTypes || [];
    
    // Calculate similarity based on common goals and workout types
    const commonGoals = userGoals.filter((goal: string) => authorGoals.includes(goal));
    const commonWorkoutTypes = userWorkoutTypes.filter((type: string) => authorWorkoutTypes.includes(type));
    
    const goalSimilarity = commonGoals.length / Math.max(userGoals.length, 1);
    const workoutSimilarity = commonWorkoutTypes.length / Math.max(userWorkoutTypes.length, 1);
    
    return (goalSimilarity + workoutSimilarity) / 2;
  } catch (error) {
    console.error('Error calculating similarity score:', error);
    return 0;
  }
};

// Calculate if user is following the post author
const calculateFollowingScore = async (post: WorkoutPost, userId: string): Promise<number> => {
  try {
    const following = await getUserFollowing(userId);
    const isFollowing = following.some(user => user.uid === post.userId);
    return isFollowing ? 1 : 0;
  } catch (error) {
    console.error('Error calculating following score:', error);
    return 0;
  }
};

// Calculate trending score based on recent engagement
const calculateTrendingScore = (post: WorkoutPost): number => {
  const hoursOld = (Date.now() - post.createdAt.toMillis()) / (1000 * 60 * 60);
  
  // Only consider posts from last 48 hours for trending
  if (hoursOld > 48) return 0;
  
  const totalInteractions = post.likesCount + post.commentsCount + post.sharesCount;
  
  // High engagement in short time = trending
  const engagementVelocity = totalInteractions / Math.max(hoursOld, 0.5);
  
  // Normalize (assuming 5 interactions per hour is highly trending)
  return Math.min(engagementVelocity / 5, 1);
};

// Main algorithm to score and rank posts
const scorePost = async (
  post: WorkoutPost, 
  userId: string, 
  weights: FeedAlgorithmWeights = DEFAULT_WEIGHTS
): Promise<FeedPost> => {
  const engagementRate = calculateEngagementRate(post);
  const recency = calculateRecencyScore(post);
  const similarity = await calculateSimilarityScore(post, userId);
  const following = await calculateFollowingScore(post, userId);
  const trending = calculateTrendingScore(post);
  
  const score = 
    (recency * weights.recency) +
    (engagementRate * weights.engagement) +
    (following * weights.following) +
    (similarity * weights.similarity) +
    (trending * weights.trending);
  
  return {
    ...post,
    score,
    engagementRate,
    recency,
    relevanceScore: similarity
  };
};

// Get personalized feed for user
export const getPersonalizedFeed = async (
  userId: string,
  limitCount: number = 20,
  weights?: FeedAlgorithmWeights
): Promise<FeedPost[]> => {
  try {
    // Get all recent public posts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const postsQuery = query(
      collection(db, 'workout_posts'),
      where('visibility', '==', 'public'),
      where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo)),
      orderBy('createdAt', 'desc'),
      limit(limitCount * 3) // Get more posts to have options for ranking
    );

    const querySnapshot = await getDocs(postsQuery);
    const posts: WorkoutPost[] = [];

    // Load post data with workout and user info
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

    // Score all posts
    const scoredPosts: FeedPost[] = [];
    for (const post of posts) {
      const scoredPost = await scorePost(post, userId, weights);
      scoredPosts.push(scoredPost);
    }

    // Sort by score and return top posts
    return scoredPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, limitCount);

  } catch (error) {
    console.error('Error getting personalized feed:', error);
    return [];
  }
};

// Get trending posts (high engagement recently)
export const getTrendingPosts = async (limitCount: number = 10): Promise<FeedPost[]> => {
  try {
    // Get posts from last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const postsQuery = query(
      collection(db, 'workout_posts'),
      where('visibility', '==', 'public'),
      where('createdAt', '>=', Timestamp.fromDate(oneDayAgo)),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(postsQuery);
    const posts: WorkoutPost[] = [];

    // Load post data
    for (const docSnap of querySnapshot.docs) {
      const postData = docSnap.data() as WorkoutPost;
      
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

    // Score posts for trending (emphasize trending score)
    const trendingWeights: FeedAlgorithmWeights = {
      recency: 0.2,
      engagement: 0.3,
      following: 0.1,
      similarity: 0.1,
      trending: 0.3
    };

    const scoredPosts: FeedPost[] = [];
    for (const post of posts) {
      const scoredPost = await scorePost(post, '', trendingWeights); // No user context for trending
      scoredPosts.push(scoredPost);
    }

    return scoredPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, limitCount);

  } catch (error) {
    console.error('Error getting trending posts:', error);
    return [];
  }
};

// Get posts from users you follow
export const getFollowingFeed = async (userId: string, limitCount: number = 20): Promise<FeedPost[]> => {
  try {
    // Get users that current user follows
    const following = await getUserFollowing(userId);
    const followingIds = following.map(user => user.uid);

    if (followingIds.length === 0) {
      return [];
    }

    // Get posts from followed users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const postsQuery = query(
      collection(db, 'workout_posts'),
      where('userId', 'in', followingIds.slice(0, 10)), // Firestore 'in' limit is 10
      where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo)),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(postsQuery);
    const posts: FeedPost[] = [];

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

      // Add basic scoring for chronological order with engagement boost
      const feedPost: FeedPost = {
        ...postData,
        score: calculateRecencyScore(postData) + calculateEngagementRate(postData),
        engagementRate: calculateEngagementRate(postData),
        recency: calculateRecencyScore(postData),
        relevanceScore: 1 // High relevance since user follows them
      };

      posts.push(feedPost);
    }

    return posts.sort((a, b) => b.score - a.score);

  } catch (error) {
    console.error('Error getting following feed:', error);
    return [];
  }
};

export default {
  getPersonalizedFeed,
  getTrendingPosts,
  getFollowingFeed
};
