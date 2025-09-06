"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Poppins } from "next/font/google";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { MenuIcon, SearchIcon } from "lucide-react";
import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Image from "next/image";
import { SiteSidebar } from "../site-sidebar/content";
import { IntegratedSearchBar } from "@/components/search/integrated-search-bar";


const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700"],
});

interface NavbarItemProps {
  href: string;
  children: React.ReactNode;
  isActive?: boolean;
}

const NavbarItem = ({ href, children, isActive }: NavbarItemProps) => {
  return (
    <Button
      asChild
      variant="outline"
      className={cn(
        "bg-transparent hover:bg-transparent rounded-full hover:border-[#87E64B] border-transparent px-3.5 text-lg text-white",
        isActive && "bg-[#87E64B] text-black hover:bg-[#87E64B] hover:text-black"
      )}
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
};

const navbarItems = [
  { href: "/", children: "Home" },
  { href: "/about", children: "About" },
  { href: "/features", children: "Features" },
  { href: "/pricing", children: "Pricing" },
  { href: "/contact", children: "Contact" },
];

export const SiteHeader = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const session = useQuery(trpc.auth.session.queryOptions());

  const { mutate: logout, isPending } = useMutation(
    trpc.auth.logout.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.auth.session.queryFilter());
        toast.success("Logged out successfully");
        router.push("/");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const handleLogout = () => {
    logout();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  return (
    <nav className="h-16 flex items-center justify-between font-medium bg-[#1A1A1A] border-b border-[#99CC33] px-6">
      {/* Logo and Search Bar */}
      <div className="flex items-center gap-6 flex-1">
        <Link href="/" className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
            <path fill="#99CC33" fillRule="evenodd" d="M5.174 3h5.652a1.5 1.5 0 0 1 1.49 1.328l.808 7A1.5 1.5 0 0 1 11.634 13H4.366a1.5 1.5 0 0 1-1.49-1.672l.808-7A1.5 1.5 0 0 1 5.174 3m-2.98 1.156A3 3 0 0 1 5.174 1.5h5.652a3 3 0 0 1 2.98 2.656l.808 7a3 3 0 0 1-2.98 3.344H4.366a3 3 0 0 1-2.98-3.344zM5 5.25a.75.75 0 0 1 1.5 0v.25a1.5 1.5 0 1 0 3 0v-.25a.75.75 0 0 1 1.5 0v.25a3 3 0 0 1-6 0z" clipRule="evenodd"/>
          </svg>
          <span className={cn("text-xl font-bold text-[#F5F5F5]", poppins.className)}>
            Souq
          </span>
        </Link>
        
        {/* Integrated Search Bar */}
        <div className="flex-1 max-w-2xl">
          <IntegratedSearchBar 
            defaultValue={searchValue}
            onChange={setSearchValue}
          />
        </div>
      </div>
      {/* Right side buttons */}
      <div className="flex items-center gap-4">
        {session.data?.user ? (
          <>
            <Button
              asChild
              className="hidden lg:flex px-6 py-2 rounded-md bg-white text-[#1A1A1A] hover:bg-[#99CC33] transition-colors text-sm font-medium"
            >
              <Link href="/admin">Dashboard</Link>
            </Button>
            <Button
              onClick={handleLogout}
              disabled={isPending}
              className="hidden lg:flex px-6 py-2 rounded-md bg-red-600 text-white hover:bg-red-500 transition-colors text-sm font-medium"
            >
              {isPending ? "Logging out..." : "Logout"}
            </Button>
          </>
        ) : (
          <>
            <Button
              asChild
              className="hidden xl:flex px-6 py-2 rounded-md bg-white text-[#1A1A1A] hover:bg-[#99CC33] transition-colors text-sm font-medium"
            >
              <Link prefetch href="/sign-in">
                Log in
              </Link>
            </Button>
            <Button
              asChild
              className="px-6 py-2 rounded-md bg-[#99CC33] text-[#1A1A1A] hover:bg-[#87E64B] transition-colors text-sm font-medium"
            >
              <Link prefetch href="/sign-up">
                Get unlimited downloads
              </Link>
            </Button>
          </>
        )}
        
        {/* Hamburger Menu */}
        <Button
          variant="ghost"
          className="p-2 text-white hover:bg-[#333333] rounded-md"
          onClick={() => setIsSidebarOpen(true)}
        >
          <MenuIcon className="h-5 w-5" />
        </Button>
      </div>

      <SiteSidebar
        items={navbarItems}
        open={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
        isAuthenticated={!!session.data?.user}
        onLogout={handleLogout}
        isLoggingOut={isPending}
      />
    </nav>
  );
};
