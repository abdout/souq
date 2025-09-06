"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { SearchIcon, MicIcon, ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

interface Props {
  defaultValue?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const IntegratedSearchBar = ({ defaultValue, onChange, disabled = false }: Props) => {
  const [searchValue, setSearchValue] = useState(defaultValue || "");
  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const router = useRouter();
  const trpc = useTRPC();

  const { data: categories } = useQuery(trpc.categories.getMany.queryOptions());

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    // You can add category filtering logic here
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center w-full max-w-2xl">
      <div className="flex items-center bg-[#333333] rounded-full w-full border border-transparent hover:border-white focus-within:border-white focus-within:border-2 transition-all">
        {/* Category Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              disabled={disabled}
              className="flex items-center gap-2 px-4 py-3 text-[#CCCCCC] hover:text-white hover:bg-transparent rounded-l-full rounded-r-none border-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-sm font-medium">{selectedCategory}</span>
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="w-48 bg-[#333333] border-[#555555] text-white"
          >
            <DropdownMenuItem 
              onClick={() => handleCategorySelect("All Items")}
              className="text-[#CCCCCC] hover:text-white hover:bg-[#444444]"
            >
              All Items
            </DropdownMenuItem>
            {categories?.map((category) => (
              <DropdownMenuItem
                key={category.id}
                onClick={() => handleCategorySelect(category.name)}
                className="text-[#CCCCCC] hover:text-white hover:bg-[#444444]"
              >
                {category.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Vertical Separator */}
        <div className="h-6 w-px bg-[#555555] my-2"></div>

        {/* Search Input */}
        <div className="flex items-center flex-1 px-4">
          <SearchIcon className="h-4 w-4 text-white mr-3" />
          <Input
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              onChange(e.target.value);
            }}
            placeholder="Search"
            disabled={disabled}
            className="bg-transparent border-none text-white placeholder:text-[#888888] focus-visible:ring-0 focus-visible:ring-offset-0 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Vertical Separator */}
        <div className="h-6 w-px bg-[#555555] my-2"></div>

        {/* Microphone Icon */}
        <Button
          type="button"
          variant="ghost"
          disabled={disabled}
          className="p-3 text-white hover:bg-[#444444] rounded-r-full rounded-l-none border-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MicIcon className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};
