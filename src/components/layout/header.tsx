import { Bell } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function StatusBar() {
  return (
    <header className="w-full bg-background px-4 pt-12 pb-4 flex justify-between items-center border-b border-carbon-300">
      <h1 className="text-2xl font-semibold text-primary font-inter">Fitness Track</h1>
      <div className="flex items-center space-x-3">
        <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <Bell className="text-primary" />
        </button>
        <Avatar>
          <AvatarImage src="/avatars/default.png" alt="Profile" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
