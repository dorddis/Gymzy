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
  DocumentData,
  runTransaction,
  writeBatch
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

// Enhanced search users with fuzzy matching
export const searchUsers = async (searchTerm: string, currentUserId: string, limitCount: number = 20): Promise<PublicUserProfile[]> => {
  try {
    if (!searchTerm.trim()) return [];

    console.log('🔍 UserDiscovery: Searching for users with term:', searchTerm);

    const usersRef = collection(db, 'user_profiles');
    const searchTermLower = searchTerm.toLowerCase();

    // Get all public users first (since Firestore doesn't support full-text search)
    const allUsersQuery = query(
      usersRef,
      where('isPublic', '==', true),
      limit(100) // Get more users to filter locally
    );

    const querySnapshot = await getDocs(allUsersQuery);
    const allUsers: PublicUserProfile[] = [];

    querySnapshot.forEach((doc) => {
      const userData = doc.data() as PublicUserProfile;
      allUsers.push(userData);
    });

    // Filter users with fuzzy matching
    const matchedUsers = allUsers.filter(user => {
      if (!user.displayName) return false;

      const displayNameLower = user.displayName.toLowerCase();

      // Exact match (highest priority)
      if (displayNameLower === searchTermLower) return true;

      // Starts with search term
      if (displayNameLower.startsWith(searchTermLower)) return true;

      // Contains search term
      if (displayNameLower.includes(searchTermLower)) return true;

      // Fuzzy matching - check if search term words are in display name
      const searchWords = searchTermLower.split(' ');
      const nameWords = displayNameLower.split(' ');

      return searchWords.some(searchWord =>
        nameWords.some(nameWord =>
          nameWord.includes(searchWord) || searchWord.includes(nameWord)
        )
      );
    });

    // Sort by relevance
    const sortedUsers = matchedUsers.sort((a, b) => {
      const aName = a.displayName.toLowerCase();
      const bName = b.displayName.toLowerCase();

      // Exact match first
      if (aName === searchTermLower && bName !== searchTermLower) return -1;
      if (bName === searchTermLower && aName !== searchTermLower) return 1;

      // Starts with search term
      if (aName.startsWith(searchTermLower) && !bName.startsWith(searchTermLower)) return -1;
      if (bName.startsWith(searchTermLower) && !aName.startsWith(searchTermLower)) return 1;

      // Alphabetical order
      return aName.localeCompare(bName);
    });

    const result = sortedUsers.slice(0, limitCount);
    console.log(`✅ UserDiscovery: Found ${result.length} matching users`);

    return result;
  } catch (error) {
    console.error('❌ UserDiscovery: Error searching users:', error);
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

// Follow a user with transaction support
export const followUser = async (followerId: string, followingId: string): Promise<void> => {
  try {
    console.log(`🔄 UserDiscovery: Following user ${followingId} by ${followerId}`);

    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    // Use transaction to ensure data consistency
    await runTransaction(db, async (transaction) => {
      const followId = `${followerId}_${followingId}`;
      const followRef = doc(db, 'user_following', followId);
      const followerRef = doc(db, 'user_profiles', followerId);
      const followingRef = doc(db, 'user_profiles', followingId);

      // Check if already following
      const existingFollow = await transaction.get(followRef);
      if (existingFollow.exists()) {
        throw new Error('Already following this user');
      }

      // Check if both users exist
      const [followerDoc, followingDoc] = await Promise.all([
        transaction.get(followerRef),
        transaction.get(followingRef)
      ]);

      if (!followerDoc.exists()) {
        throw new Error('Follower profile not found');
      }
      if (!followingDoc.exists()) {
        throw new Error('User to follow not found');
      }

      // Create follow relationship
      const followData: UserFollowing = {
        id: followId,
        followerId,
        followingId,
        status: 'accepted',
        createdAt: Timestamp.now()
      };

      transaction.set(followRef, followData);

      // Update counters atomically
      const followerData = followerDoc.data();
      const followingData = followingDoc.data();

      transaction.update(followerRef, {
        followingCount: (followerData?.followingCount || 0) + 1,
        updatedAt: Timestamp.now()
      });

      transaction.update(followingRef, {
        followersCount: (followingData?.followersCount || 0) + 1,
        updatedAt: Timestamp.now()
      });

      console.log(`✅ UserDiscovery: Successfully followed user ${followingId}`);
    });

  } catch (error) {
    console.error('❌ UserDiscovery: Error following user:', error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        throw new Error('Permission denied. Please check your account settings.');
      } else if (error.message.includes('not found')) {
        throw new Error('User not found or profile is private.');
      } else {
        throw error;
      }
    }

    throw new Error('Failed to follow user. Please try again.');
  }
};

// Unfollow a user with transaction support
export const unfollowUser = async (followerId: string, followingId: string): Promise<void> => {
  try {
    console.log(`🔄 UserDiscovery: Unfollowing user ${followingId} by ${followerId}`);

    // Use transaction to ensure data consistency
    await runTransaction(db, async (transaction) => {
      const followId = `${followerId}_${followingId}`;
      const followRef = doc(db, 'user_following', followId);
      const followerRef = doc(db, 'user_profiles', followerId);
      const followingRef = doc(db, 'user_profiles', followingId);

      // Check if follow relationship exists
      const existingFollow = await transaction.get(followRef);
      if (!existingFollow.exists()) {
        throw new Error('Not following this user');
      }

      // Get current profiles
      const [followerDoc, followingDoc] = await Promise.all([
        transaction.get(followerRef),
        transaction.get(followingRef)
      ]);

      if (!followerDoc.exists() || !followingDoc.exists()) {
        throw new Error('User profile not found');
      }

      // Delete follow relationship
      transaction.delete(followRef);

      // Update counters atomically
      const followerData = followerDoc.data();
      const followingData = followingDoc.data();

      transaction.update(followerRef, {
        followingCount: Math.max(0, (followerData?.followingCount || 0) - 1),
        updatedAt: Timestamp.now()
      });

      transaction.update(followingRef, {
        followersCount: Math.max(0, (followingData?.followersCount || 0) - 1),
        updatedAt: Timestamp.now()
      });

      console.log(`✅ UserDiscovery: Successfully unfollowed user ${followingId}`);
    });

  } catch (error) {
    console.error('❌ UserDiscovery: Error unfollowing user:', error);

    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        throw new Error('Permission denied. Please check your account settings.');
      } else {
        throw error;
      }
    }

    throw new Error('Failed to unfollow user. Please try again.');
  }
};

// Check if user is following another user with better error handling
export const isFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
  try {
    if (!followerId || !followingId) {
      console.warn('⚠️ UserDiscovery: Invalid user IDs provided for follow check');
      return false;
    }

    const followId = `${followerId}_${followingId}`;
    const followRef = doc(db, 'user_following', followId);
    const followSnap = await getDoc(followRef);

    const isFollowingUser = followSnap.exists();
    console.log(`🔍 UserDiscovery: Follow status ${followerId} -> ${followingId}: ${isFollowingUser}`);

    return isFollowingUser;
  } catch (error) {
    console.error('❌ UserDiscovery: Error checking follow status:', error);
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
