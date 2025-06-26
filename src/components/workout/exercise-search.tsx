import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';

interface ExerciseSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function ExerciseSearch({ onSearch, placeholder = "Search exercises..." }: ExerciseSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    onSearch(debouncedSearch);
  }, [debouncedSearch, onSearch]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full py-3 pl-10 pr-4 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-secondary"
      />
    </div>
  );
} 