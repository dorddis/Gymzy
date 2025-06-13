import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  increment,
  Timestamp,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';

export interface UserFollowing {
  id: string;
  followerId: string;
  followingId: string;
  status: 'pending' | 'accepted';
  createdAt: Timestamp;
}

export interface UserStats {
  userId: string;
  totalWorkouts: number;
  totalVolume: number;
  currentStreak: number;
  longestStreak: number;
  favoriteExercises: string[];
  achievements: string[];
}

export interface PublicUserProfile {
  uid: string;
  displayName: string;
  profilePicture?: string;
  bio?: string;
  fitnessGoals: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  isPublic: boolean;
  followersCount: number;
  followingCount: number;
  workoutsCount: number;
  createdAt: Timestamp;
}

// Search users by name or username
export const searchUsers = async (searchTerm: string, currentUserId: string, limitCount: number = 20): Promise<PublicUserProfile[]> => {
  try {
    if (!searchTerm.trim()) return [];

    const usersRef = collection(db, 'user_profiles');
    
    // Search by display name (case-insensitive)
    const searchQuery = query(
      usersRef,
      where('isPublic', '==', true),
      where('displayName', '>=', searchTerm),
      where('displayName', '<=', searchTerm + '\uf8ff'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(searchQuery);
    const users: PublicUserProfile[] = [];

    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      // Include all users (including current user for profile access)
      users.push(userData as PublicUserProfile);
    });

    return users;
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

// Get suggested users based on similar goals/interests
export const getSuggestedUsers = async (currentUserId: string, limitCount: number = 10): Promise<PublicUserProfile[]> => {
  try {
    // Get current user's profile to find similar users
    const currentUserRef = doc(db, 'user_profiles', currentUserId);
    const currentUserSnap = await getDoc(currentUserRef);
    
    if (!currentUserSnap.exists()) return [];
    
    const currentUserData = currentUserSnap.data();
    const usersRef = collection(db, 'user_profiles');
    
    // Find users with similar experience level
    const suggestedQuery = query(
      usersRef,
      where('isPublic', '==', true),
      where('experienceLevel', '==', currentUserData.experienceLevel),
      orderBy('createdAt', 'desc'),
      limit(limitCount * 2) // Get more to filter out current user and existing follows
    );

    const querySnapshot = await getDocs(suggestedQuery);
    const users: PublicUserProfile[] = [];

    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.uid !== currentUserId) {
        users.push(userData as PublicUserProfile);
      }
    });

    return users.slice(0, limitCount);
  } catch (error) {
    console.error('Error getting suggested users:', error);
    return [];
  }
};

// Follow a user
export const followUser = async (followerId: string, followingId: string): Promise<void> => {
  try {
    const followId = `${followerId}_${followingId}`;
    const followRef = doc(db, 'user_following', followId);
    
    const followData: UserFollowing = {
      id: followId,
      followerId,
      followingId,
      status: 'accepted', // For now, auto-accept. Can add pending status later
      createdAt: Timestamp.now()
    };

    await setDoc(followRef, followData);

    // Update follower counts
    const followerRef = doc(db, 'user_profiles', followerId);
    const followingRef = doc(db, 'user_profiles', followingId);

    await updateDoc(followerRef, {
      followingCount: increment(1)
    });

    await updateDoc(followingRef, {
      followersCount: increment(1)
    });

  } catch (error) {
    console.error('Error following user:', error);
    throw error;
  }
};

// Unfollow a user
export const unfollowUser = async (followerId: string, followingId: string): Promise<void> => {
  try {
    const followId = `${followerId}_${followingId}`;
    const followRef = doc(db, 'user_following', followId);
    
    await deleteDoc(followRef);

    // Update follower counts
    const followerRef = doc(db, 'user_profiles', followerId);
    const followingRef = doc(db, 'user_profiles', followingId);

    await updateDoc(followerRef, {
      followingCount: increment(-1)
    });

    await updateDoc(followingRef, {
      followersCount: increment(-1)
    });

  } catch (error) {
    console.error('Error unfollowing user:', error);
    throw error;
  }
};

// Check if user is following another user
export const isFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
  try {
    const followId = `${followerId}_${followingId}`;
    const followRef = doc(db, 'user_following', followId);
    const followSnap = await getDoc(followRef);
    
    return followSnap.exists();
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
};

// Get user's followers
export const getUserFollowers = async (userId: string): Promise<PublicUserProfile[]> => {
  try {
    const followersQuery = query(
      collection(db, 'user_following'),
      where('followingId', '==', userId),
      where('status', '==', 'accepted')
    );

    const querySnapshot = await getDocs(followersQuery);
    const followerIds: string[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      followerIds.push(data.followerId);
    });

    // Get follower profiles
    const followers: PublicUserProfile[] = [];
    for (const followerId of followerIds) {
      const userRef = doc(db, 'user_profiles', followerId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        followers.push(userSnap.data() as PublicUserProfile);
      }
    }

    return followers;
  } catch (error) {
    console.error('Error getting followers:', error);
    return [];
  }
};

// Get users that a user is following
export const getUserFollowing = async (userId: string): Promise<PublicUserProfile[]> => {
  try {
    const followingQuery = query(
      collection(db, 'user_following'),
      where('followerId', '==', userId),
      where('status', '==', 'accepted')
    );

    const querySnapshot = await getDocs(followingQuery);
    const followingIds: string[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      followingIds.push(data.followingId);
    });

    // Get following profiles
    const following: PublicUserProfile[] = [];
    for (const followingId of followingIds) {
      const userRef = doc(db, 'user_profiles', followingId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        following.push(userSnap.data() as PublicUserProfile);
      }
    }

    return following;
  } catch (error) {
    console.error('Error getting following:', error);
    return [];
  }
};

// Get mutual followers between two users
export const getMutualFollowers = async (userId1: string, userId2: string): Promise<PublicUserProfile[]> => {
  try {
    const [user1Followers, user2Followers] = await Promise.all([
      getUserFollowers(userId1),
      getUserFollowers(userId2)
    ]);

    const mutualFollowers = user1Followers.filter(follower1 =>
      user2Followers.some(follower2 => follower1.uid === follower2.uid)
    );

    return mutualFollowers;
  } catch (error) {
    console.error('Error getting mutual followers:', error);
    return [];
  }
};

export default {
  searchUsers,
  getSuggestedUsers,
  followUser,
  unfollowUser,
  isFollowing,
  getUserFollowers,
  getUserFollowing,
  getMutualFollowers
};
