import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { communityPosts } from '@/data/community-posts';
import { Dumbbell, Heart, MessageSquare, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CommunityFeed() {
  const router = useRouter();
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  const handleLike = (postId: string) => {
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleViewAll = () => {
    router.push('/feed');
  };

  return (
    <div className="px-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Community</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewAll}
          className="text-secondary hover:text-secondary/80 text-sm p-0 h-auto font-medium"
        >
          View All
        </Button>
      </div>
      {communityPosts.map((post) => (
        <Card key={post.id} className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center mb-3">
            <img src={post.user.avatar} className="w-10 h-10 rounded-full mr-3" alt="User" />
            <div>
              <h3 className="font-medium text-gray-900">{post.user.name}</h3>
              <p className="text-xs text-gray-500">{post.time}</p>
            </div>
          </div>
          <p className="text-sm mb-3 text-gray-800">{post.text}</p>
          <div className="bg-gray-100 rounded-lg p-2 mb-3">
            <div className="flex items-center text-sm">
              <Dumbbell className="text-secondary mr-2" />
              <div>
                <p className="font-medium text-gray-900">{post.workout.title}</p>
                <p className="text-xs text-gray-500">{post.workout.summary}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLike(post.id)}
              className="flex items-center p-1 h-auto text-gray-600 hover:text-red-500"
            >
              <Heart className={`mr-1 w-4 h-4 ${likedPosts[post.id] ? 'fill-current text-red-500' : ''}`} />
              {post.likes + (likedPosts[post.id] ? 1 : 0)}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => console.log('Comment on post:', post.id)}
              className="flex items-center p-1 h-auto text-gray-600 hover:text-blue-500"
            >
              <MessageSquare className="mr-1 w-4 h-4" /> {post.comments}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => console.log('Share post:', post.id)}
              className="flex items-center p-1 h-auto text-gray-600 hover:text-green-500"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
} 