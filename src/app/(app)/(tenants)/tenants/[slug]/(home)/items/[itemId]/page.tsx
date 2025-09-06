import { StaticItemView } from "@/modules/items/ui/views/item-view-static";

interface Props {
  params: Promise<{ itemId: string; slug: string }>;
}

// Temporarily removing force-static to debug 500 error
// export const dynamic = "force-static";

const Page = async ({ params }: Props) => {
  // Await params to ensure compatibility with Next.js 15
  const { itemId, slug } = await params;
  
  // No data fetching - just render the static view
  return <StaticItemView itemId={itemId} slug={slug} />;
};

export default Page;