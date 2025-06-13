"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Users, UserPlus, UserCheck, Loader2, ArrowLeft } from 'lucide-react';
import {
  searchUsers,
  getSuggestedUsers,
  followUser,
  unfollowUser,
  isFollowing,
  PublicUserProfile
} from '@/services/user-discovery-service';
import { useRouter } from 'next/navigation';

export default function DiscoverPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PublicUserProfile[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<PublicUserProfile[]>([]);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  const [loadingUsers, setLoadingUsers] = useState<Record<string, boolean>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);

  // Load suggested users on component mount
  useEffect(() => {
    if (user?.uid) {
      loadSuggestedUsers();
    }
  }, [user]);

  // Load following status for displayed users
  useEffect(() => {
    if (user?.uid) {
      const allUsers = [...searchResults, ...suggestedUsers];
      loadFollowingStatus(allUsers);
    }
  }, [searchResults, suggestedUsers, user]);

  const loadSuggestedUsers = async () => {
    if (!user?.uid) return;
    
    try {
      setIsLoadingSuggestions(true);
      const suggested = await getSuggestedUsers(user.uid, 10);
      setSuggestedUsers(suggested);
    } catch (error) {
      console.error('Error loading suggested users:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const loadFollowingStatus = async (users: PublicUserProfile[]) => {
    if (!user?.uid) return;

    const statusPromises = users.map(async (targetUser) => {
      const following = await isFollowing(user.uid, targetUser.uid);
      return { userId: targetUser.uid, following };
    });

    const statuses = await Promise.all(statusPromises);
    const statusMap: Record<string, boolean> = {};
    statuses.forEach(({ userId, following }) => {
      statusMap[userId] = following;
    });

    setFollowingStatus(prev => ({ ...prev, ...statusMap }));
  };

  const handleSearch = async () => {
    if (!user?.uid || !searchTerm.trim()) return;

    try {
      setIsSearching(true);
      const results = await searchUsers(searchTerm, user.uid, 20);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFollowToggle = async (targetUserId: string) => {
    if (!user?.uid) return;

    try {
      setLoadingUsers(prev => ({ ...prev, [targetUserId]: true }));
      
      const isCurrentlyFollowing = followingStatus[targetUserId];
      
      if (isCurrentlyFollowing) {
        await unfollowUser(user.uid, targetUserId);
        setFollowingStatus(prev => ({ ...prev, [targetUserId]: false }));
      } else {
        await followUser(user.uid, targetUserId);
        setFollowingStatus(prev => ({ ...prev, [targetUserId]: true }));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setLoadingUsers(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  const UserCard = ({ user: targetUser }: { user: PublicUserProfile }) => {
    const isFollowingUser = followingStatus[targetUser.uid];
    const isLoading = loadingUsers[targetUser.uid];

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={targetUser.profilePicture} />
              <AvatarFallback>
                {targetUser.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{targetUser.displayName}</h3>
              {targetUser.bio && (
                <p className="text-sm text-muted-foreground truncate">{targetUser.bio}</p>
              )}
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {targetUser.experienceLevel}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {targetUser.followersCount} followers
                </span>
              </div>
            </div>
            
            <Button
              variant={isFollowingUser ? "outline" : "default"}
              size="sm"
              onClick={() => handleFollowToggle(targetUser.uid)}
              disabled={isLoading}
              className="min-w-[80px]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isFollowingUser ? (
                <>
                  <UserCheck className="h-4 w-4 mr-1" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Follow
                </>
              )}
            </Button>
          </div>
          
          {targetUser.fitnessGoals.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {targetUser.fitnessGoals.slice(0, 3).map((goal, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {goal}
                  </Badge>
                ))}
                {targetUser.fitnessGoals.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{targetUser.fitnessGoals.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
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
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header with Back Button */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Discover People</h1>
            <p className="text-gray-600 text-sm">
              Find and connect with other fitness enthusiasts
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="suggested">Suggested</TabsTrigger>
        </TabsList>
        
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {searchResults.length > 0 ? (
              searchResults.map((user) => (
                <UserCard key={user.uid} user={user} />
              ))
            ) : searchTerm && !isSearching ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No users found for "{searchTerm}"
                </CardContent>
              </Card>
            ) : null}
          </div>
        </TabsContent>
        
        <TabsContent value="suggested" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Suggested for You
              </CardTitle>
            </CardHeader>
          </Card>

          <div className="space-y-3">
            {isLoadingSuggestions ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading suggestions...</p>
                </CardContent>
              </Card>
            ) : suggestedUsers.length > 0 ? (
              suggestedUsers.map((user) => (
                <UserCard key={user.uid} user={user} />
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No suggestions available at the moment
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
