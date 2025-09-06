import { StaticItemView } from "@/modules/items/ui/views/item-view-static";

interface Props {
  params: Promise<{ itemId: string; slug: string }>;
}

export const dynamic = "force-static";

const Page = async ({ params }: Props) => {
  // No data fetching - just render the static view
  return <StaticItemView />;
};

export default Page;