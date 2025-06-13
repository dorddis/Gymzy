"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UserPlus,
  UserCheck,
  Users,
  Calendar,
  Target,
  TrendingUp,
  Loader2,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { 
  followUser, 
  unfollowUser, 
  isFollowing,
  getUserFollowers,
  getUserFollowing,
  PublicUserProfile 
} from '@/services/user-discovery-service';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const userId = params.userId as string;
  
  const [userProfile, setUserProfile] = useState<PublicUserProfile | null>(null);
  const [followers, setFollowers] = useState<PublicUserProfile[]>([]);
  const [following, setFollowing] = useState<PublicUserProfile[]>([]);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (userId) {
      loadUserProfile();
    }
  }, [userId]);

  useEffect(() => {
    if (currentUser?.uid && userId && currentUser.uid !== userId) {
      checkFollowingStatus();
    }
  }, [currentUser, userId]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      
      // Load user profile
      const userRef = doc(db, 'user_profiles', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data() as PublicUserProfile;
        setUserProfile(userData);
        
        // Load followers and following
        const [followersData, followingData] = await Promise.all([
          getUserFollowers(userId),
          getUserFollowing(userId)
        ]);
        
        setFollowers(followersData);
        setFollowing(followingData);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkFollowingStatus = async () => {
    if (!currentUser?.uid) return;
    
    try {
      const following = await isFollowing(currentUser.uid, userId);
      setIsFollowingUser(following);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser?.uid) return;

    try {
      setIsFollowLoading(true);
      
      if (isFollowingUser) {
        await unfollowUser(currentUser.uid, userId);
        setIsFollowingUser(false);
        // Update local follower count
        if (userProfile) {
          setUserProfile({
            ...userProfile,
            followersCount: userProfile.followersCount - 1
          });
        }
      } else {
        await followUser(currentUser.uid, userId);
        setIsFollowingUser(true);
        // Update local follower count
        if (userProfile) {
          setUserProfile({
            ...userProfile,
            followersCount: userProfile.followersCount + 1
          });
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
            <p className="text-muted-foreground">
              This user profile doesn't exist or is private.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwnProfile = currentUser?.uid === userId;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Back Button */}
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </Button>
      </div>

      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={userProfile.profilePicture} />
              <AvatarFallback className="text-2xl">
                {userProfile.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{userProfile.displayName}</h1>
              {userProfile.bio && (
                <p className="text-muted-foreground mt-1">{userProfile.bio}</p>
              )}
              
              <div className="flex items-center space-x-4 mt-3">
                <div className="text-center">
                  <div className="font-semibold">{userProfile.workoutsCount}</div>
                  <div className="text-sm text-muted-foreground">Workouts</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{userProfile.followersCount}</div>
                  <div className="text-sm text-muted-foreground">Followers</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{userProfile.followingCount}</div>
                  <div className="text-sm text-muted-foreground">Following</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 mt-3">
                <Badge variant="secondary">
                  {userProfile.experienceLevel}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Member since {formatDate(userProfile.createdAt)}
                </span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              {isOwnProfile ? (
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <Button
                  variant={isFollowingUser ? "outline" : "default"}
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                >
                  {isFollowLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : isFollowingUser ? (
                    <UserCheck className="h-4 w-4 mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  {isFollowingUser ? 'Following' : 'Follow'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workouts">Workouts</TabsTrigger>
          <TabsTrigger value="followers">Followers</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Fitness Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userProfile.fitnessGoals.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {userProfile.fitnessGoals.map((goal, index) => (
                      <Badge key={index} variant="outline">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No goals set</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Activity Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Workouts</span>
                    <span className="font-medium">{userProfile.workoutsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Experience Level</span>
                    <span className="font-medium capitalize">{userProfile.experienceLevel}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="workouts">
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Workout history will be displayed here
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="followers">
          <div className="space-y-3">
            {followers.length > 0 ? (
              followers.map((follower) => (
                <Card key={follower.uid}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={follower.profilePicture} />
                        <AvatarFallback>
                          {follower.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{follower.displayName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {follower.followersCount} followers
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No followers yet
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="following">
          <div className="space-y-3">
            {following.length > 0 ? (
              following.map((followedUser) => (
                <Card key={followedUser.uid}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={followedUser.profilePicture} />
                        <AvatarFallback>
                          {followedUser.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{followedUser.displayName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {followedUser.followersCount} followers
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Not following anyone yet
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
