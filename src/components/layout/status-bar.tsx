import React from 'react';
import { Bell, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function StatusBar() {
  return (
    <header className="w-full bg-background px-4 py-3 flex justify-between items-center border-b border-gray-200">
      <h1 className="text-lg font-bold">Gymzy</h1>
      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bell className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
} 