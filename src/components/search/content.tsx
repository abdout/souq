"use client";

import { useItemFilters } from "@/modules/items/hooks/use-item-filters";
import { DEFAULT_BG_COLOR } from "@/modules/home/constants";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { BreadcrumbNavigation } from "./breadcrumbs-navigation";
import { Categories } from "./categories";
import { IntegratedSearchBar } from "./integrated-search-bar";

export const SearchFilters = () => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.categories.getMany.queryOptions());
  const [filters, setFilters] = useItemFilters();

  const params = useParams();
  const categoryParam = params.category as string | undefined;
  const activeCategory = categoryParam || "all";

  const activeCategoryData = data.find(
    (category) => category.slug === activeCategory
  );

  const activeCategoryColor = DEFAULT_BG_COLOR; // Categories don't have color property yet
  const activeCategoryName = activeCategoryData?.name || null;

  const activeSubcategory = params.subcategory as string | undefined;
  const activeSubcategoryName = null; // No subcategories implemented yet

  return (
    <div
      className="px-4 lg:px-12 py-8 border-b flex flex-col gap-4 w-full"
      style={{
        backgroundColor: activeCategoryColor,
      }}
    >
      <IntegratedSearchBar
        defaultValue={filters.search}
        onChange={(value) => setFilters({ search: value })}
      />

      <div className="hidden lg:block">
        <Categories data={data} />
      </div>
      <BreadcrumbNavigation
        activeCategory={activeCategory}
        activeCategoryName={activeCategoryName}
        activeSubcategoryName={activeSubcategoryName}
      />
    </div>
  );
};

export const SearchFiltersSkeleton = () => {
  return (
    <div
      className="px-4 lg:px-12 py-8 border-b flex flex-col gap-4 w-full"
      style={{
        backgroundColor: "#F5F5F5",
      }}
    >
      <IntegratedSearchBar disabled onChange={() => {}} />
      <div className="hidden lg:block">
        <div className="h-11" />
      </div>
    </div>
  );
};
