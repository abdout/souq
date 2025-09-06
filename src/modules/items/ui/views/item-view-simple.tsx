"use client";

import { StarRating } from "@/components/start-rating";
import { Button } from "@/components/ui/button";
import { formatCurrency, generateTenantURL } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { CheckIcon, LinkIcon, StarIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";

const CartButton = dynamic(
  () => import("../components/cart-button").then((mod) => mod.CartButton),
  {
    ssr: false,
    loading: () => (
      <Button disabled className="flex-1 bg-[#87E64B]">
        Add to cart
      </Button>
    ),
  }
);

interface ItemViewProps {
  itemId: string;
  tenantSlug: string;
}

export const SimpleItemView = ({ itemId, tenantSlug }: ItemViewProps) => {
  const trpc = useTRPC();
  const [isCopied, setIsCopied] = useState(false);
  
  // Use regular useQuery instead of useSuspenseQuery
  const { data, isLoading, error } = useQuery(
    trpc.items.getOne.queryOptions({ id: itemId })
  );
  
  // Show loading state
  if (isLoading) {
    return <ItemViewSkeleton />;
  }
  
  // Show error state
  if (error) {
    return (
      <div className="px-4 lg:px-12 py-10">
        <div className="border rounded-sm bg-white p-8 text-center">
          <p className="text-red-500">Error loading item. Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Show empty state
  if (!data) {
    return <ItemViewSkeleton />;
  }

  // Safe image URL getter
  const getImageUrl = (image: any): string => {
    if (!image) return "/placeholder.png";
    if (typeof image === 'string') return image;
    if (image.url) return image.url;
    return "/placeholder.png";
  };

  return (
    <div className="px-4 lg:px-12 py-10">
      <div className="border rounded-sm bg-white overflow-hidden">
        <div className="relative aspect-[3.9] border-b">
          <Image
            src={getImageUrl(data.image)}
            alt={data.name || "Item"}
            fill
            className="object-cover"
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-6">
          <div className="col-span-4">
            <div className="p-6">
              <h1 className="text-4xl font-medium">{data.name || "Unnamed Item"}</h1>
            </div>

            <div className="border-y flex">
              <div className="px-6 py-4 flex items-center justify-center border-r">
                <div className="relative px-2 py-1 border bg-[#87E64B] w-fit">
                  <p className="text-base font-medium">
                    {formatCurrency(data.price || 0)}
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 flex items-center justify-center lg:border-r">
                <Link
                  href={generateTenantURL(tenantSlug)}
                  className="flex items-center gap-2"
                >
                  <p className="text-base underline font-medium">
                    {data.tenant?.name || "Store"}
                  </p>
                </Link>
              </div>

              <div className="hidden lg:flex px-6 py-4 items-center justify-center">
                <div className="flex items-center gap-2">
                  <StarRating
                    rating={data.reviewRating || 0}
                    iconClassName="size-4"
                  />
                  <p className="text-base font-medium">
                    {data.reviewCount || 0} ratings
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {data.description ? (
                <p className="text-base">{data.description}</p>
              ) : (
                <p className="font-medium text-muted-foreground italic">
                  No description provided
                </p>
              )}
            </div>
          </div>
          
          <div className="col-span-2">
            <div className="border-t lg:border-t-0 lg:border-l h-full">
              <div className="flex flex-col gap-4 p-6 border-b">
                <div className="flex flex-row items-center gap-2">
                  <CartButton
                    isPurchased={false}
                    bookId={itemId}
                    tenantSlug={tenantSlug}
                  />
                  <Button
                    className="size-12"
                    variant="elevated"
                    onClick={() => {
                      setIsCopied(true);
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("URL copied to clipboard");
                      setTimeout(() => {
                        setIsCopied(false);
                      }, 1000);
                    }}
                    disabled={isCopied}
                  >
                    {isCopied ? <CheckIcon /> : <LinkIcon />}
                  </Button>
                </div>
                <p className="text-center font-medium">
                  {data.deliveryTime ? `Delivery in ${data.deliveryTime} minutes` : "Standard delivery"}
                </p>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-medium">Ratings</h3>
                  <div className="flex items-center gap-x-1 font-medium">
                    <StarIcon className="size-4 fill-black" />
                    <p>({data.reviewRating || 0})</p>
                    <p className="text-base">{data.reviewCount || 0} ratings</p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  {(data.reviewCount || 0) > 0 ? (
                    <p>Based on {data.reviewCount} customer reviews</p>
                  ) : (
                    <p>No reviews yet. Be the first to review!</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ItemViewSkeleton = () => {
  return (
    <div className="px-4 lg:px-12 py-10">
      <div className="border rounded-sm bg-white overflow-hidden">
        <div className="relative aspect-[3.9] border-b bg-gray-200 animate-pulse" />
        <div className="p-6">
          <div className="h-10 bg-gray-200 rounded animate-pulse w-1/3" />
          <div className="mt-4 h-20 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
};