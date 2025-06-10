export type CommunityPost = {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  time: string;
  text: string;
  workout: {
    title: string;
    summary: string;
  };
  likes: number;
  comments: number;
};

export const communityPosts: CommunityPost[] = [
  {
    id: '1',
    user: {
      name: 'Sarah Johnson',
      avatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg',
    },
    time: '2 hours ago',
    text: 'Just crushed a new PR on deadlifts! 💪 Feeling stronger every week with this program.',
    workout: {
      title: 'Lower Body Strength',
      summary: '4 exercises • 8.5k volume',
    },
    likes: 24,
    comments: 8,
  },
  {
    id: '2',
    user: {
      name: 'Mike Peters',
      avatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg',
    },
    time: '5 hours ago',
    text: 'Finally back in the gym after a week off. Taking it easy but feels good to be back!',
    workout: {
      title: 'Full Body Recovery',
      summary: '5 exercises • 5.2k volume',
    },
    likes: 18,
    comments: 3,
  },
]; 