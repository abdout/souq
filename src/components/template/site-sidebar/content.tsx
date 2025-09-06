"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface NavbarItem {
  href: string;
  children: React.ReactNode;
}

interface Props {
  items: NavbarItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAuthenticated?: boolean;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

export const SiteSidebar = ({
  items,
  open,
  onOpenChange,
  isAuthenticated = false,
  onLogout,
  isLoggingOut = false,
}: Props) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 transition-none">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center">
            <SheetTitle>Menu</SheetTitle>
          </div>
        </SheetHeader>
        <ScrollArea className="flex flex-col overflow-y-auto h-full pb-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="w-full text-left p-4 hover:bg-black hover:text-white flex items-center
                  text-base font-medium"
              onClick={() => onOpenChange(false)}
            >
              {item.children}
            </Link>
          ))}
          <div className="border-t">
            {isAuthenticated ? (
              <>
                <Link
                  href="/admin"
                  className="w-full text-left p-4 hover:bg-black hover:text-white flex items-center
                      text-base font-medium"
                  onClick={() => onOpenChange(false)}
                >
                  Dashboard
                </Link>
                <Button
                  onClick={() => {
                    onLogout?.();
                    onOpenChange(false);
                  }}
                  disabled={isLoggingOut}
                  className="w-full text-left p-4 hover:bg-red-500 hover:text-white flex items-center
                      text-base font-medium bg-transparent text-black border-0 rounded-none justify-start"
                >
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </Button>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="w-full text-left p-4 hover:bg-black hover:text-white flex items-center
                      text-base font-medium"
                  onClick={() => onOpenChange(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/sign-up"
                  className="w-full text-left p-4 hover:bg-black hover:text-white flex items-center
                      text-base font-medium"
                  onClick={() => onOpenChange(false)}
                >
                  Start selling
                </Link>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
