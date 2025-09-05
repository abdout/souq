"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Poppins } from "next/font/google";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NavbarSidebar } from "./navbar-sidebar";
import { MenuIcon, SearchIcon } from "lucide-react";
import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Image from "next/image";

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

export const Navbar = () => {
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
    <nav className="h-14 flex border-b justify-between font-medium bg-black">
      <div className="flex items-center gap-4">
        <Link href="/" className="pl-6 flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Souq Logo"
            width={20}
            height={20}
            className="filter brightness-0 saturate-100"
            style={{ filter: 'brightness(0) saturate(100%) invert(67%) sepia(95%) saturate(1234%) hue-rotate(75deg) brightness(95%) contrast(89%)' }}
          />
          <span className={cn("text-xl font-bold text-white", poppins.className)}>
            Souq
          </span>
        </Link>
        <form onSubmit={handleSearch} className="relative hidden md:flex">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10 pr-4 h-10 w-64 lg:w-96 bg-gray-900 border-gray-700 text-white placeholder:text-gray-400 focus:bg-gray-800 focus:border-[#6bc935] rounded-lg"
          />
        </form>
      </div>
      <NavbarSidebar
        items={navbarItems}
        open={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
        isAuthenticated={!!session.data?.user}
        onLogout={handleLogout}
        isLoggingOut={isPending}
      />
      <div className="items-center gap-4 hidden xl:flex">
        {navbarItems.map((item) => (
          <NavbarItem
            key={item.href}
            href={item.href}
            isActive={pathname == item.href}
          >
            {item.children}
          </NavbarItem>
        ))}
      </div>
      {session.data?.user ? (
        <div className="hidden lg:flex">
          <Button
            asChild
            className="border-l border-t-0 border-b-0 border-r-0 px-12 h-full rounded-none bg-white text-black hover:bg-[#87E64B] hover:text-black transition-colors text-lg"
          >
            <Link href="/admin">Dashboard</Link>
          </Button>
          <Button
            onClick={handleLogout}
            disabled={isPending}
            className="border-l border-t-0 border-b-0 border-r-0 px-12 h-full rounded-none bg-red-600 text-white hover:bg-red-500 transition-colors text-lg"
          >
            {isPending ? "Logging out..." : "Logout"}
          </Button>
        </div>
      ) : (
        <div className="">
          <Button
            asChild
            variant="secondary"
            className="hidden xl:flex border-l border-t-0 border-b-0 border-r-0 px-12 h-full rounded-none bg-white text-black
                  hover:bg-[#87E64B] transition-colors text-lg"
          >
            <Link prefetch href="/sign-in">
              Log in
            </Link>
          </Button>
          <Button
            asChild
            className="h-10 my-2 rounded-md bg-primary hover:bg-primary/90 transition-colors text-lg px-6 text-primary-foreground"
          >
            <Link prefetch href="/sign-up">
              Start selling
            </Link>
          </Button>
        </div>
      )}
      <div className="flex xl:hidden items-center justify-center">
        <Button
          variant="ghost"
          className="size-14 border-transparent bg-black text-white hover:bg-neutral-900"
          onClick={() => setIsSidebarOpen(true)}
        >
          <MenuIcon className="size-6" />
        </Button>
      </div>
    </nav>
  );
};
