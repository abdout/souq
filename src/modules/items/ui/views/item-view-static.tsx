"use client";

import { StarRating } from "@/components/start-rating";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { CheckIcon, LinkIcon, StarIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

// Mock data - no API calls
const MOCK_ITEM = {
  id: "mock-item-1",
  name: "Delicious Burger",
  description: "A tasty burger with fresh ingredients",
  price: 25.99,
  image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjY2NjIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5EZWxpY2lvdXMgQnVyZ2VyPC90ZXh0Pjwvc3ZnPg==",
  deliveryTime: "30",
  reviewRating: 4.5,
  reviewCount: 12,
  tenant: {
    name: "Delicious Bites",
    slug: "delicious-bites",
  }
};

interface Props {
  itemId?: string;
  slug?: string;
}

export const StaticItemView = ({ itemId, slug }: Props) => {
  const [isCopied, setIsCopied] = useState(false);
  const item = MOCK_ITEM;

  return (
    <div className="px-4 lg:px-12 py-10">
      <div className="border rounded-sm bg-white overflow-hidden">
        <div className="relative aspect-[3.9] border-b bg-gray-100">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-6">
          <div className="col-span-4">
            <div className="p-6">
              <h1 className="text-4xl font-medium">{item.name}</h1>
            </div>

            <div className="border-y flex">
              <div className="px-6 py-4 flex items-center justify-center border-r">
                <div className="relative px-2 py-1 border bg-[#87E64B] w-fit">
                  <p className="text-base font-medium">
                    {formatCurrency(item.price)}
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 flex items-center justify-center lg:border-r">
                <Link
                  href={`/tenants/${item.tenant.slug}`}
                  className="flex items-center gap-2"
                >
                  <p className="text-base underline font-medium">
                    {item.tenant.name}
                  </p>
                </Link>
              </div>

              <div className="hidden lg:flex px-6 py-4 items-center justify-center">
                <div className="flex items-center gap-2">
                  <StarRating
                    rating={item.reviewRating}
                    iconClassName="size-4"
                  />
                  <p className="text-base font-medium">
                    {item.reviewCount} ratings
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-base">{item.description}</p>
            </div>
          </div>
          
          <div className="col-span-2">
            <div className="border-t lg:border-t-0 lg:border-l h-full">
              <div className="flex flex-col gap-4 p-6 border-b">
                <div className="flex flex-row items-center gap-2">
                  <Button className="flex-1 bg-[#87E64B]">
                    Add to cart
                  </Button>
                  <Button
                    className="size-12"
                    variant="elevated"
                    onClick={() => {
                      setIsCopied(true);
                      if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("URL copied to clipboard");
                      }
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
                  Delivery in {item.deliveryTime} minutes
                </p>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-medium">Ratings</h3>
                  <div className="flex items-center gap-x-1 font-medium">
                    <StarIcon className="size-4 fill-black" />
                    <p>({item.reviewRating})</p>
                    <p className="text-base">{item.reviewCount} ratings</p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Based on {item.reviewCount} customer reviews</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};