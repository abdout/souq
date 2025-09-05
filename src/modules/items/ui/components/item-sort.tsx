"use client";

import { Button } from "@/components/ui/button";
import { useItemFilters } from "../../hooks/use-item-filters";
import { cn } from "@/lib/utils";

export const ItemSort = () => {
  const [filters, setFilters] = useItemFilters();

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className={cn(
            "rounded-full bg-white hover:bg-white",
            filters.sort !== "curated" &&
              "bg-transparent border-transparent hover:border-border hover:bg-transparent"
          )}
          variant="secondary"
          onClick={() => setFilters({ sort: "curated" })}
        >
          Curated
        </Button>
        <Button
          size="sm"
          className={cn(
            "rounded-full bg-white hover:bg-white",
            filters.sort !== "trending" &&
              "bg-transparent border-transparent hover:border-border hover:bg-transparent"
          )}
          variant="secondary"
          onClick={() => setFilters({ sort: "trending" })}
        >
          Trending
        </Button>
        <Button
          size="sm"
          className={cn(
            "rounded-full bg-white hover:bg-white",
            filters.sort !== "hot_and_new" &&
              "bg-transparent border-transparent hover:border-border hover:bg-transparent"
          )}
          variant="secondary"
          onClick={() => setFilters({ sort: "hot_and_new" })}
        >
          Hot & New
        </Button>
      </div>
    </div>
  );
};
