"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  TrendingUp, 
  Users, 
  Sparkles,
  Clock,
  Dumbbell,
  Loader2,
  ChevronLeft,
  Search
} from 'lucide-react';
import { FeedPostSkeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { 
  getPersonalizedFeed, 
  getTrendingPosts, 
  getFollowingFeed,
  FeedPost 
} from '@/services/social-feed-service';
import {
  likeWorkoutPost,
  unlikeWorkoutPost,
  hasUserLikedPost
} from '@/services/workout-sharing-service';
import { useContextualTracking } from '@/hooks/useContextualTracking';

export default function FeedPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { trackSocialEngagement, trackFeatureUsage } = useContextualTracking();
  
  const [personalizedFeed, setPersonalizedFeed] = useState<FeedPost[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<FeedPost[]>([]);
  const [followingFeed, setFollowingFeed] = useState<FeedPost[]>([]);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [loadingLikes, setLoadingLikes] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personalized');

  useEffect(() => {
    if (user?.uid) {
      loadFeeds();
    }
  }, [user]);

  const loadFeeds = async () => {
    if (!user?.uid) return;
    
    try {
      setIsLoading(true);
      
      const [personalizedData, trendingData, followingData] = await Promise.all([
        getPersonalizedFeed(user.uid, 20),
        getTrendingPosts(10),
        getFollowingFeed(user.uid, 15)
      ]);
      
      setPersonalizedFeed(personalizedData);
      setTrendingPosts(trendingData);
      setFollowingFeed(followingData);
      
      // Load like status for all posts
      const allPosts = [...personalizedData, ...trendingData, ...followingData];
      await loadLikeStatus(allPosts);
      
    } catch (error) {
      console.error('Error loading feeds:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLikeStatus = async (posts: FeedPost[]) => {
    if (!user?.uid) return;

    const likeStatusPromises = posts.map(async (post) => {
      const liked = await hasUserLikedPost(post.id, user.uid);
      return { postId: post.id, liked };
    });

    const likeStatuses = await Promise.all(likeStatusPromises);
    const likeStatusMap: Record<string, boolean> = {};
    likeStatuses.forEach(({ postId, liked }) => {
      likeStatusMap[postId] = liked;
    });

    setLikedPosts(likeStatusMap);
  };

  const handleLikeToggle = async (postId: string) => {
    if (!user?.uid) return;

    try {
      setLoadingLikes(prev => ({ ...prev, [postId]: true }));

      const isCurrentlyLiked = likedPosts[postId];

      if (isCurrentlyLiked) {
        await unlikeWorkoutPost(postId, user.uid);
        setLikedPosts(prev => ({ ...prev, [postId]: false }));
      } else {
        await likeWorkoutPost(postId, user.uid);
        setLikedPosts(prev => ({ ...prev, [postId]: true }));
        // Track social engagement for likes given
        await trackSocialEngagement('likesGiven');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoadingLikes(prev => ({ ...prev, [postId]: false }));
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTimeAgo = (timestamp: any): string => {
    const now = Date.now();
    const postTime = timestamp.toMillis ? timestamp.toMillis() : timestamp;
    const diffMs = now - postTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m ago`;
    }
  };

  const WorkoutPostCard = ({ post, index }: { post: FeedPost, index: number }) => {
    const isLiked = likedPosts[post.id];
    const isLikeLoading = loadingLikes[post.id];

    return (
      <Card
        className="mb-4 animate-fadeInUp"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.userData?.profilePicture} />
                <AvatarFallback>
                  {post.userData?.displayName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm">{post.userData?.displayName}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimeAgo(post.createdAt)}
                </p>
              </div>
            </div>
            
            {activeTab === 'personalized' && (
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs text-primary font-medium">
                  {Math.round(post.score * 100)}% match
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Workout Info */}
          <div className="bg-secondary/10 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                {post.workoutData?.name || 'Workout'}
              </h4>
              <Badge variant="outline" className="text-xs">
                {formatDuration(post.workoutData?.duration || 0)}
              </Badge>
            </div>
            
            {post.workoutData?.exercises && (
              <p className="text-sm text-muted-foreground">
                {post.workoutData.exercises.length} exercises
                {post.workoutData.totalVolume && (
                  <span> • {Math.round(post.workoutData.totalVolume)} kg total volume</span>
                )}
              </p>
            )}
          </div>
          
          {/* Caption */}
          {post.caption && (
            <p className="text-sm mb-3">{post.caption}</p>
          )}
          
          {/* Hashtags */}
          {post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {post.hashtags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLikeToggle(post.id)}
                disabled={isLikeLoading}
                className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : ''}`}
              >
                {isLikeLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                )}
                <span className="text-xs">{post.likesCount}</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">{post.commentsCount}</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <Share2 className="h-4 w-4" />
                <span className="text-xs">{post.sharesCount}</span>
              </Button>
            </div>
            
            {activeTab === 'personalized' && (
              <div className="text-xs text-muted-foreground">
                {Math.round(post.engagementRate * 100)}% engagement
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header with Back Button */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Gymzy Community</h1>
            <div className="flex items-center justify-between">
              <p className="text-gray-600 text-sm flex-1 mr-4">
                Discover workouts and connect with the fitness community
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push('/discover')}
                className="flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personalized" className="flex items-center gap-1">
            <Sparkles className="h-4 w-4" />
            For You
          </TabsTrigger>
          <TabsTrigger value="trending" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="following" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            Following
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="personalized" className="mt-6">
          {isLoading ? (
            <div>
              <FeedPostSkeleton key="personalized-skeleton-1" />
              <FeedPostSkeleton key="personalized-skeleton-2" />
              <FeedPostSkeleton key="personalized-skeleton-3" />
            </div>
          ) : personalizedFeed.length > 0 ? (
            <div>
              {personalizedFeed.map((post, index) => (
                <WorkoutPostCard key={post.id} post={post} index={index} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-medium mb-2">No personalized content yet</h3>
                <p className="text-sm">
                  Follow more users and interact with posts to see personalized recommendations
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="trending" className="mt-6">
          {isLoading ? (
            <div>
              <FeedPostSkeleton key="trending-skeleton-1" />
              <FeedPostSkeleton key="trending-skeleton-2" />
              <FeedPostSkeleton key="trending-skeleton-3" />
            </div>
          ) : trendingPosts.length > 0 ? (
            <div>
              {trendingPosts.map((post, index) => (
                <WorkoutPostCard key={post.id} post={post} index={index} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-medium mb-2">No trending posts</h3>
                <p className="text-sm">
                  Check back later for trending workout content
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="following" className="mt-6">
          {isLoading ? (
            <div>
              <FeedPostSkeleton key="following-skeleton-1" />
              <FeedPostSkeleton key="following-skeleton-2" />
              <FeedPostSkeleton key="following-skeleton-3" />
            </div>
          ) : followingFeed.length > 0 ? (
            <div>
              {followingFeed.map((post, index) => (
                <WorkoutPostCard key={post.id} post={post} index={index} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-medium mb-2">No posts from people you follow</h3>
                <p className="text-sm">
                  Follow more users to see their workout posts here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
