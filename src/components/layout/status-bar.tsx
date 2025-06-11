import React from 'react';
import { Bell, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function StatusBar() {
  return (
    <header className="w-full bg-background px-4 py-0.5 flex justify-between items-center border-b border-gray-200">
      <h1 className="text-lg font-bold">Gymzy</h1>
      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Bell className="h-3 w-3" />
        </Button>
        <Avatar className="h-6 w-6">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
} 