import React from 'react';
import { Card } from '@/components/ui/card';
import { communityPosts } from '@/data/community-posts';

export function CommunityFeed() {
  return (
    <div className="px-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Community</h2>
        <span className="text-secondary text-sm cursor-pointer">View All</span>
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
              <span className="material-icons text-secondary mr-2">fitness_center</span>
              <div>
                <p className="font-medium text-gray-900">{post.workout.title}</p>
                <p className="text-xs text-gray-500">{post.workout.summary}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <button className="flex items-center">
              <span className="material-icons mr-1">favorite_border</span> {post.likes}
            </button>
            <button className="flex items-center">
              <span className="material-icons mr-1">chat_bubble_outline</span> {post.comments}
            </button>
            <button className="flex items-center">
              <span className="material-icons">share</span>
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
} 