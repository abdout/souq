"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";

interface Props {
  slug: string;
}

export const NavbarStatic = ({ slug }: Props) => {
  return (
    <nav className="h-20 border-b font-medium bg-white">
      <div className="max-w-(--breakpoint-xl) mx-auto flex justify-between items-center h-full px-4 lg:px-12">
        <Link
          href={`/tenants/${slug}`}
          className="flex items-center gap-2"
        >
          <span className="text-xl font-semibold">Delicious Bites</span>
        </Link>
        <Button className="bg-white">
          <ShoppingCart className="text-black" />
        </Button>
      </div>
    </nav>
  );
};