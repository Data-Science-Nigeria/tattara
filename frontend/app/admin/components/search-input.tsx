'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export default function SearchInput({ placeholder, value, onChange }: SearchInputProps) {
  const clearSearch = () => {
    onChange('');
  };

  return (
    <div className="relative max-w-md flex-1 items-center justify-center">
      <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full items-center rounded-lg border-2 border-[#BAC7DF] py-3 pr-12 pl-12 text-black placeholder-gray-400"
      />
      {value && (
        <button
          onClick={clearSearch}
          className="absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}