import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton, FeedPostSkeleton } from '@/components/ui/skeleton';
import { communityPosts } from '@/data/community-posts';
import { Dumbbell, Heart, MessageSquare, Share2, Clock, MapPin, Flame, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getWorkoutFeed } from '@/services/social/workout-sharing-service';

interface WorkoutPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  workoutTitle: string;
  workoutSummary: string;
  duration: number;
  exercises: number;
  calories?: number;
  createdAt: Date;
  likesCount: number;
  commentsCount: number;
  isPublic: boolean;
  tags?: string[];
}

export function CommunityFeed() {
  const router = useRouter();
  const { user } = useAuth();
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [workoutPosts, setWorkoutPosts] = useState<WorkoutPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkoutPosts();
  }, []);

  const loadWorkoutPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to load real workout posts
      const posts = await getWorkoutFeed('public', 5);

      if (posts.length > 0) {
        // Convert to our format
        const formattedPosts: WorkoutPost[] = posts.map(post => ({
          id: post.id,
          userId: post.userId,
          userName: post.userName || 'Anonymous User',
          userAvatar: undefined, // We&apos;ll add avatar support later
          workoutTitle: post.workoutTitle,
          workoutSummary: post.workoutSummary,
          duration: post.duration,
          exercises: post.exercises,
          calories: post.calories,
          createdAt: post.createdAt.toDate(),
          likesCount: post.likesCount || 0,
          commentsCount: post.commentsCount || 0,
          isPublic: post.isPublic,
          tags: post.tags
        }));
        setWorkoutPosts(formattedPosts);
      } else {
        // Fallback to mock data if no real posts
        setWorkoutPosts([]);
      }
    } catch (error) {
      console.error('Error loading workout posts:', error);
      setError('Failed to load community posts');
      // Use fallback data
      setWorkoutPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      // Optimistic update
      setLikedPosts(prev => ({
        ...prev,
        [postId]: !prev[postId]
      }));

      // Update the post&apos;s like count
      setWorkoutPosts(prev => prev.map(post =>
        post.id === postId
          ? { ...post, likesCount: post.likesCount + (likedPosts[postId] ? -1 : 1) }
          : post
      ));

      // TODO: Call API to like/unlike the post
      // await toggleWorkoutLike(postId, user?.uid);
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert optimistic update
      setLikedPosts(prev => ({
        ...prev,
        [postId]: !prev[postId]
      }));
    }
  };

  const handleViewAll = () => {
    router.push('/feed');
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="px-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Gymzy Community</h2>
          <Button variant="ghost" size="sm" disabled className="text-sm p-0 h-auto">
            View All
          </Button>
        </div>
        {[1, 2, 3].map((i) => (
          <FeedPostSkeleton key={i} />
        ))}
      </div>
    );
  }

  const postsToShow = workoutPosts.length > 0 ? workoutPosts : communityPosts.slice(0, 3);

  return (
    <div className="px-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Gymzy Community</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewAll}
          className="text-secondary hover:text-secondary/80 text-sm p-0 h-auto font-medium"
        >
          View All
        </Button>
      </div>

      {error && (
        <Card className="bg-yellow-50 border-yellow-200 p-4 mb-4">
          <p className="text-sm text-yellow-800">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadWorkoutPosts}
            className="mt-2"
          >
            Try Again
          </Button>
        </Card>
      )}

      {workoutPosts.length === 0 && !isLoading && !error && (
        <Card className="bg-blue-50 border-blue-200 p-6 mb-4 text-center">
          <Dumbbell className="h-12 w-12 text-blue-400 mx-auto mb-3" />
          <h3 className="font-medium text-blue-900 mb-2">No Community Posts Yet</h3>
          <p className="text-sm text-blue-700 mb-4">
            Be the first to share your workout and inspire others!
          </p>
          <Button
            onClick={() => router.push('/workout')}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Start a Workout
          </Button>
        </Card>
      )}

      {(workoutPosts.length > 0 ? workoutPosts : communityPosts.slice(0, 3)).map((post) => {
        const isWorkoutPost = 'duration' in post;

        return (
          <Card key={post.id} className="bg-white rounded-xl shadow-sm p-4 mb-4 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-3">
              <Avatar className="w-10 h-10 mr-3">
                <AvatarImage
                  src={isWorkoutPost ? post.userAvatar : (post as any).user?.avatar}
                  alt="User avatar"
                />
                <AvatarFallback className="text-xs">
                  {isWorkoutPost
                    ? getUserInitials(post.userName)
                    : getUserInitials((post as any).user?.name || 'U')
                  }
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">
                    {isWorkoutPost ? post.userName : (post as any).user?.name}
                  </h3>
                  {isWorkoutPost && post.exercises >= 5 && (
                    <Badge variant="secondary" className="text-xs">
                      <Trophy className="h-3 w-3 mr-1" />
                      Beast Mode
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  {isWorkoutPost
                    ? formatTimeAgo(post.createdAt)
                    : (post as any).time
                  }
                </div>
              </div>
            </div>

            {!isWorkoutPost && (post as any).text && (
              <p className="text-sm mb-3 text-gray-800">{(post as any).text}</p>
            )}

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 mb-3 border border-blue-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center text-sm flex-1">
                  <Dumbbell className="text-blue-600 mr-2 h-4 w-4" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {isWorkoutPost ? post.workoutTitle : (post as any).workout?.title}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {isWorkoutPost ? post.workoutSummary : (post as any).workout?.summary}
                    </p>
                  </div>
                </div>
                {isWorkoutPost && (
                  <div className="flex gap-2 ml-3">
                    {post.duration && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {Math.round(post.duration)}m
                      </Badge>
                    )}
                    {post.calories && (
                      <Badge variant="outline" className="text-xs">
                        <Flame className="h-3 w-3 mr-1" />
                        {post.calories}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between text-sm text-gray-500">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLike(post.id)}
                className="flex items-center p-1 h-auto text-green-600 hover:text-green-600"
              >
                <Heart className={`mr-1 w-4 h-4 ${likedPosts[post.id] ? 'fill-current text-green-600' : ''}`} />
                {(isWorkoutPost ? post.likesCount : (post as any).likes) + (likedPosts[post.id] ? 1 : 0)}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/feed?post=${post.id}`)}
                className="flex items-center p-1 h-auto text-green-600 hover:text-green-600"
              >
                <MessageSquare className="mr-1 w-4 h-4" />
                {isWorkoutPost ? post.commentsCount : (post as any).comments}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `${isWorkoutPost ? post.userName : (post as any).user?.name}&apos;s workout`,
                      text: `Check out this workout: ${isWorkoutPost ? post.workoutTitle : (post as any).workout?.title}`,
                      url: window.location.href
                    });
                  } else {
                    // Fallback: copy to clipboard
                    navigator.clipboard.writeText(window.location.href);
                  }
                }}
                className="flex items-center p-1 h-auto text-green-600 hover:text-green-600"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        );
      })}

      {workoutPosts.length > 0 && (
        <div className="text-center mt-4">
          <Button
            variant="outline"
            onClick={handleViewAll}
            className="w-full"
          >
            View All Community Posts
          </Button>
        </div>
      )}
    </div>
  );
}